// User management and authentication
import bcrypt from 'bcryptjs';
import { supabaseServer } from './supabase-server';

export interface User {
  id: string;
  username: string;
  email?: string;
  passwordHash: string;
  role: 'admin' | 'artist' | 'listener';
  status: 'active' | 'disabled' | 'deleted';
  createdAt: number;
  lastLogin?: number;
  bio?: string;
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
  if (user.createdAt !== undefined) dbUser.created_at = new Date(user.createdAt).toISOString();
  if (user.lastLogin !== undefined) dbUser.last_login = user.lastLogin ? new Date(user.lastLogin).toISOString() : null;
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
    // Check if username already exists
    const { data: existing } = await supabaseServer
      .from('users')
      .select('id')
      .ilike('username', username.trim())
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
        username: username.trim(),
        email: email?.trim() || null,
        password_hash: passwordHash,
        role,
        status: 'active',
        bio: '',
        created_at: now,
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
        details: error.details,
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

  // Get user by username
  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabaseServer
      .from('users')
      .select('*')
      .ilike('username', username)
      .neq('status', 'deleted')
      .single();

    if (error || !data) {
      return undefined;
    }

    return dbUserToUser(data as DbUser);
  },

  // Authenticate user
  async authenticate(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) {
      return null;
    }

    // Check if user is active (disabled or deleted users cannot login)
    if (user.status !== 'active') {
      console.log('Login attempt for inactive user:', username, 'status:', user.status);
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
  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = await this.getUser(id);
    if (!user) return null;

    // Prevent modifying admin accounts
    if (user.role === 'admin') {
      if (updates.role && updates.role !== 'admin') {
        throw new Error('Cannot change admin role');
      }
      if (updates.status && updates.status !== 'active') {
        throw new Error('Cannot disable or delete admin accounts');
      }
    }

    // Check username uniqueness if changing
    if (updates.username && updates.username !== user.username) {
      const existing = await this.getUserByUsername(updates.username);
      if (existing && existing.id !== id) {
        throw new Error('Username already exists');
      }
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

