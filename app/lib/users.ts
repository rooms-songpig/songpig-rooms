// User management and authentication
import bcrypt from 'bcryptjs';
import { supabaseServer } from './supabase-server';

// Username / handle rules
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 24;
const USERNAME_REGEX = /^[a-zA-Z0-9_.]+$/;

function normalizeUsernameInput(raw: string): string {
  return raw.trim();
}

function validateUsername(username: string): string | null {
  const value = normalizeUsernameInput(username);
  if (value.length < MIN_USERNAME_LENGTH || value.length > MAX_USERNAME_LENGTH) {
    return `Username must be between ${MIN_USERNAME_LENGTH} and ${MAX_USERNAME_LENGTH} characters.`;
  }
  if (!USERNAME_REGEX.test(value)) {
    return 'Username can only contain letters, numbers, underscores, and periods.';
  }
  return null;
}

export interface User {
  id: string;
  // Username doubles as the public @handle (unique, case-insensitive via DB index)
  username: string;
  // Optional display name for artist/band; can differ from username/@handle
  displayName?: string;
  email?: string;
  passwordHash: string;
  role: 'admin' | 'artist' | 'listener';
  status: 'active' | 'disabled' | 'deleted';
  createdAt: number;
  lastLogin?: number;
  bio?: string;
  // Optional profile avatar image URL
  avatarUrl?: string;
  // Flexible social/support links (website, x, instagram, tipping, etc.)
  socialLinks?: Record<string, string>;
  // Managed upload / storage fields (optional for backward compatibility)
  allowManagedUploads?: boolean;
  maxCloudSongs?: number;
  storageLimitBytes?: number | null;
  storageUsedBytes?: number;
}

// Database user type (snake_case)
interface DbUser {
  id: string;
  username: string;
  email: string | null;
  password_hash: string;
  role: 'admin' | 'artist' | 'listener';
  status: 'active' | 'disabled' | 'deleted';
  bio: string | null;
  created_at: string;
  last_login: string | null;
  display_name: string | null;
  avatar_url: string | null;
  social_links: Record<string, string> | null;
  // Managed uploads / storage columns
  allow_managed_uploads?: boolean | null;
  max_cloud_songs?: number | null;
  storage_limit_bytes?: number | null;
  storage_used_bytes?: number | null;
}

// Convert database user to application user
function dbUserToUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    username: dbUser.username,
    email: dbUser.email || undefined,
    passwordHash: dbUser.password_hash,
    role: dbUser.role,
    status: dbUser.status,
    createdAt: new Date(dbUser.created_at).getTime(),
    lastLogin: dbUser.last_login ? new Date(dbUser.last_login).getTime() : undefined,
    bio: dbUser.bio || undefined,
    displayName: dbUser.display_name || undefined,
    avatarUrl: dbUser.avatar_url || undefined,
    socialLinks: dbUser.social_links || undefined,
    allowManagedUploads: dbUser.allow_managed_uploads ?? undefined,
    maxCloudSongs: dbUser.max_cloud_songs ?? undefined,
    storageLimitBytes: dbUser.storage_limit_bytes ?? null,
    storageUsedBytes: dbUser.storage_used_bytes ?? undefined,
  };
}

// Convert application user to database user (for inserts/updates)
function userToDbUser(user: Partial<User>): Partial<DbUser> {
  const dbUser: Partial<DbUser> = {};
  if (user.username !== undefined) dbUser.username = user.username;
  if (user.email !== undefined) dbUser.email = user.email || null;
  if (user.passwordHash !== undefined) dbUser.password_hash = user.passwordHash;
  if (user.role !== undefined) dbUser.role = user.role;
  if (user.status !== undefined) dbUser.status = user.status;
  if (user.bio !== undefined) dbUser.bio = user.bio || null;
   if (user.displayName !== undefined) dbUser.display_name = user.displayName || null;
   if (user.avatarUrl !== undefined) dbUser.avatar_url = user.avatarUrl || null;
   if (user.socialLinks !== undefined) dbUser.social_links = user.socialLinks || null;
  if (user.createdAt !== undefined) dbUser.created_at = new Date(user.createdAt).toISOString();
  if (user.lastLogin !== undefined) dbUser.last_login = user.lastLogin ? new Date(user.lastLogin).toISOString() : null;
   if (user.allowManagedUploads !== undefined) {
     dbUser.allow_managed_uploads = user.allowManagedUploads;
   }
   if (user.maxCloudSongs !== undefined) {
     dbUser.max_cloud_songs = user.maxCloudSongs;
   }
   if (user.storageLimitBytes !== undefined) {
     dbUser.storage_limit_bytes = user.storageLimitBytes;
   }
   if (user.storageUsedBytes !== undefined) {
     dbUser.storage_used_bytes = user.storageUsedBytes;
   }
  return dbUser;
}

// Secure password hashing with bcrypt
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Support legacy base64 hashes for migration
  if (hash.startsWith('$2')) {
    // bcrypt hash
    return bcrypt.compare(password, hash);
  } else {
    // Legacy base64 hash (for backward compatibility during migration)
    const legacyHash = Buffer.from(password).toString('base64');
    return legacyHash === hash;
  }
}

export const userStore = {
  // Create a new user
  async createUser(
    username: string,
    password: string,
    email: string | undefined,
    role: 'admin' | 'artist' | 'listener' = 'listener'
  ): Promise<User> {
    const normalizedUsername = normalizeUsernameInput(username);
    // Strip leading '@' if present so people can type @Handle but we store Handle
    const cleanedUsername = normalizedUsername.startsWith('@')
      ? normalizedUsername.slice(1)
      : normalizedUsername;
    const validationError = validateUsername(cleanedUsername);
    if (validationError) {
      throw new Error(validationError);
    }

    // Check if username already exists (case-insensitive)
    const { data: existing } = await supabaseServer
      .from('users')
      .select('id')
      .ilike('username', cleanedUsername)
      .neq('status', 'deleted')
      .single();

    if (existing) {
      throw new Error('Username already exists');
    }

    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    const { data: insertData, error: insertError } = await supabaseServer
      .from('users')
      .insert({
        username: cleanedUsername,
        email: email?.trim() || null,
        password_hash: passwordHash,
        role,
        status: 'active',
        bio: '',
        created_at: now,
        // Default storage settings for new users
        allow_managed_uploads: true,
        max_cloud_songs: 6,
        storage_used_bytes: 0,
      })
      .select()
      .limit(1);

    if (insertError) {
      if (insertError.code === '23505') { // Unique constraint violation
        throw new Error('Username already exists');
      }
      console.error('Error creating user:', insertError);
      throw new Error('Failed to create user');
    }

    if (!insertData || insertData.length === 0) {
      console.error('User insert succeeded but no data returned');
      throw new Error('Failed to create user');
    }

    const data = insertData[0];
    const user = dbUserToUser(data as DbUser);
    console.log('User created:', user.id, user.username, user.role);

    // Verify the user can be read back (handles read-after-write consistency)
    // This ensures the user is fully committed and visible to subsequent queries
    let verified = false;
    let verifyAttempts = 0;
    const maxVerifyAttempts = 5;
    const verifyDelays = [200, 400, 600, 800, 1000]; // ms

    while (!verified && verifyAttempts < maxVerifyAttempts) {
      if (verifyAttempts > 0) {
        const delay = verifyDelays[verifyAttempts - 1];
        console.log(`Verifying user can be read back (attempt ${verifyAttempts + 1}/${maxVerifyAttempts}), waiting ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const { data: verifyData, error: verifyError } = await supabaseServer
        .from('users')
        .select('id')
        .eq('id', user.id)
        .limit(1);

      if (!verifyError && verifyData && verifyData.length > 0 && verifyData[0].id === user.id) {
        verified = true;
        console.log(`✅ User verified after creation (attempt ${verifyAttempts + 1})`);
        break;
      }

      verifyAttempts++;
    }

    if (!verified) {
      console.warn(`⚠️ User created but could not be verified after ${maxVerifyAttempts} attempts. User ID: ${user.id}`);
      console.warn('This may indicate a database replication delay. The user should still be usable.');
      // Still return the user - the retry logic in API routes will handle it
    }

    return user;
  },

  // Get user by ID
  async getUser(id: string): Promise<User | undefined> {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      console.error('getUser called with invalid ID:', id, 'Type:', typeof id);
      return undefined;
    }

    const cleanId = id.trim();
    const startTime = Date.now();
    console.log('getUser: Looking up user with ID:', cleanId, 'Length:', cleanId.length, 'Timestamp:', new Date().toISOString());

    // Try without .single() first to avoid PGRST116 errors
    // This is more lenient and works better with newly inserted users
    let { data: queryData, error: queryError } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', cleanId)
      .neq('status', 'deleted')
      .limit(1);
    
    const queryTime = Date.now() - startTime;
    
    // Convert array result to single object
    let data = queryData && queryData.length > 0 ? queryData[0] : null;
    let error = queryError || (queryData && queryData.length === 0 ? { code: 'PGRST116', message: 'No rows returned' } : null);

    // If no data found, try a direct query without status filter to see if user exists
    if (error && error.code === 'PGRST116' && !data) {
      console.log('getUser: No rows found, trying direct query without status filter...');
      const directStartTime = Date.now();
      const { data: directData, error: directError } = await supabaseServer
        .from('users')
        .select('*')
        .eq('id', cleanId)
        .limit(1);
      const directQueryTime = Date.now() - directStartTime;
      
      if (!directError && directData && directData.length > 0) {
        const directUser = directData[0];
        console.log('getUser: User found via direct query:', {
          id: directUser.id,
          username: directUser.username,
          status: directUser.status,
          queryTime: directQueryTime,
        });
        
        // If user is deleted, return undefined
        if (directUser.status === 'deleted') {
          console.log('getUser: User is deleted');
          return undefined;
        }
        
        // Use the direct query result
        data = directUser;
        error = null;
      } else {
        console.log('getUser: Direct query also returned no results:', {
          hasData: !!directData,
          dataLength: directData?.length || 0,
          error: directError?.message,
          queryTime: directQueryTime,
        });
      }
    }

    if (error && error.code !== 'PGRST116') {
      // Only log non-PGRST116 errors (PGRST116 is handled above)
      console.error('getUser error:', {
        message: error.message,
        code: error.code,
        details: (error as any).details,
        userId: cleanId,
        queryTime,
      });
      return undefined;
    }

    if (!data) {
      console.log('getUser: No data returned for ID:', cleanId, 'Query time:', queryTime);
      return undefined;
    }

    console.log('getUser: Found user:', {
      id: data.id,
      username: data.username,
      status: data.status,
      role: data.role,
      queryTime,
    });
    return dbUserToUser(data as DbUser);
  },

  // Get user by username (handle)
  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabaseServer
      .from('users')
      .select('*')
      .ilike('username', username)
      .neq('status', 'deleted')
      .single();

    // If no data was found, treat as "user not found"
    if (!data) {
      return undefined;
    }

    // In development, surface *real* Supabase errors clearly so routes like
    // /artist/[handle] don't silently hide configuration issues. However,
    // avoid throwing for the common "no rows returned" case, which we already
    // treat as "not found" above.
    if (process.env.NODE_ENV !== 'production' && error) {
      const code = (error as any).code;
      // PostgREST uses PGRST116 for "No rows found"
      if (code !== 'PGRST116') {
        console.error('getUserByUsername Supabase error:', {
          username,
          code,
          message: (error as any).message,
          details: (error as any).details,
        });
        throw new Error(
          `Supabase error in getUserByUsername for "${username}". ` +
            'Check your NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY and RLS policies.'
        );
      }
    }

    return dbUserToUser(data as DbUser);
  },

  // Get user by email
  async getUserByEmail(email: string): Promise<User | undefined> {
    const trimmed = email.trim();
    if (!trimmed) return undefined;

    const { data, error } = await supabaseServer
      .from('users')
      .select('*')
      .ilike('email', trimmed)
      .neq('status', 'deleted')
      .single();

    if (error || !data) {
      return undefined;
    }

    return dbUserToUser(data as DbUser);
  },

  // Authenticate user
  async authenticate(identifier: string, password: string): Promise<User | null> {
    const raw = identifier?.trim();
    if (!raw) {
      return null;
    }

    let user: User | undefined;

    // Treat values that look like emails as email login; otherwise use username/@handle
    if (raw.includes('@') && raw.includes('.')) {
      user = await this.getUserByEmail(raw);
    } else {
      const normalized = raw.startsWith('@') ? raw.slice(1) : raw;
      user = await this.getUserByUsername(normalized);
    }

    if (!user) {
      return null;
    }

    // Check if user is active (disabled or deleted users cannot login)
    if (user.status !== 'active') {
      console.log('Login attempt for inactive user:', identifier, 'status:', user.status);
      return null;
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return null;
    }

    // Update last login
    await supabaseServer
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    user.lastLogin = Date.now();
    return user;
  },

  // Update user
  async updateUser(
    id: string,
    updates: Partial<User>,
    actingUserId?: string
  ): Promise<User | null> {
    const user = await this.getUser(id);
    if (!user) return null;

    // Load acting user (if provided) to determine super-admin privileges
    let actingUser: User | undefined;
    if (actingUserId) {
      actingUser = await this.getUser(actingUserId);
    }

    const isSuperAdmin =
      actingUser &&
      actingUser.role === 'admin' &&
      actingUser.username.toLowerCase() === 'admin';
    const isSelfUpdate = actingUserId === id;

    // Prevent modifying admin accounts unless super-admin is acting on another admin
    if (user.role === 'admin') {
      // Super-admin cannot demote or disable themselves
      if (isSelfUpdate) {
        if (updates.role && updates.role !== 'admin') {
          throw new Error('Cannot change your own admin role');
        }
        if (updates.status && updates.status !== 'active') {
          throw new Error('Cannot disable or delete your own admin account');
        }
      } else if (!isSuperAdmin) {
        // Non super-admins cannot change other admin accounts
        if (updates.role && updates.role !== 'admin') {
          throw new Error('Cannot change admin role');
        }
        if (updates.status && updates.status !== 'active') {
          throw new Error('Cannot disable or delete admin accounts');
        }
      }
    }

    // Check username validity + uniqueness if changing
    if (updates.username && updates.username !== user.username) {
      const rawUsername = normalizeUsernameInput(updates.username);
      const cleanedUsername = rawUsername.startsWith('@')
        ? rawUsername.slice(1)
        : rawUsername;

      const validationError = validateUsername(cleanedUsername);
      if (validationError) {
        throw new Error(validationError);
      }

      const existing = await this.getUserByUsername(cleanedUsername);
      if (existing && existing.id !== id) {
        throw new Error('Username already exists');
      }

      // Persist the cleaned username back into updates so it's what we save
      updates.username = cleanedUsername;
    }

    // Hash password if it's being updated
    const dbUpdates: Partial<DbUser> = userToDbUser(updates);
    if (updates.passwordHash) {
      // If passwordHash is provided, it should already be hashed
      // But if a plain password is provided, we'd need to detect that
      // For now, assume passwordHash is already hashed
      dbUpdates.password_hash = updates.passwordHash;
    }

    const { data, error } = await supabaseServer
      .from('users')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating user:', error);
      return null;
    }

    const updatedUser = dbUserToUser(data as DbUser);
    console.log('User updated:', id, updates);
    return updatedUser;
  },

  // Disable user
  async disableUser(id: string): Promise<boolean> {
    const { error } = await supabaseServer
      .from('users')
      .update({ status: 'disabled' })
      .eq('id', id);

    return !error;
  },

  // Delete user (soft delete)
  async deleteUser(id: string): Promise<boolean> {
    const { error } = await supabaseServer
      .from('users')
      .update({ status: 'deleted' })
      .eq('id', id);

    return !error;
  },

  // Get all users (for admin)
  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabaseServer
      .from('users')
      .select('*')
      .neq('status', 'deleted')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Error fetching users:', error);
      return [];
    }

    return data.map(dbUserToUser);
  },

  // Get users by role
  async getUsersByRole(role: 'admin' | 'artist' | 'listener'): Promise<User[]> {
    const { data, error } = await supabaseServer
      .from('users')
      .select('*')
      .eq('role', role)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Error fetching users by role:', error);
      return [];
    }

    return data.map(dbUserToUser);
  },
};

// Create default admin user if none exists (async initialization)
(async () => {
  try {
    const admin = await userStore.getUserByUsername('admin');
    if (!admin) {
      await userStore.createUser('admin', 'admin123', undefined, 'admin');
      console.log('Default admin user created: username=admin, password=admin123');
    }
  } catch (e) {
    // Admin already exists or error creating
    console.log('Admin user check:', e instanceof Error ? e.message : 'unknown error');
  }
})();

