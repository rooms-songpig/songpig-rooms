// User management and authentication
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

// In-memory user storage (will be replaced with database)
declare global {
  var __users__: Map<string, User> | undefined;
}

let users: Map<string, User>;
if (typeof globalThis !== 'undefined') {
  if (!globalThis.__users__) {
    globalThis.__users__ = new Map();
  }
  users = globalThis.__users__;
} else {
  users = new Map();
}

// Simple password hashing (in production, use bcrypt)
function hashPassword(password: string): string {
  // Simple hash for now - replace with bcrypt in production
  return Buffer.from(password).toString('base64');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Generate a random ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export const userStore = {
  // Create a new user
  createUser(
    username: string,
    password: string,
    email: string | undefined,
    role: 'admin' | 'artist' | 'listener' = 'listener'
  ): User {
    // Check if username already exists
    for (const user of users.values()) {
      if (user.username.toLowerCase() === username.toLowerCase() && user.status !== 'deleted') {
        throw new Error('Username already exists');
      }
    }

    const user: User = {
      id: generateId(),
      username: username.trim(),
      email: email?.trim(),
      passwordHash: hashPassword(password),
      role,
      status: 'active',
      createdAt: Date.now(),
      bio: '',
    };

    users.set(user.id, user);
    console.log('User created:', user.id, user.username, user.role);
    return user;
  },

  // Get user by ID
  getUser(id: string): User | undefined {
    const user = users.get(id);
    if (!user || user.status === 'deleted') return undefined;
    return user;
  },

  // Get user by username
  getUserByUsername(username: string): User | undefined {
    for (const user of users.values()) {
      if (user.username.toLowerCase() === username.toLowerCase() && user.status !== 'deleted') {
        return user;
      }
    }
    return undefined;
  },

  // Authenticate user
  authenticate(username: string, password: string): User | null {
    const user = this.getUserByUsername(username);
    if (!user) {
      return null;
    }

    // Check if user is active (disabled or deleted users cannot login)
    if (user.status !== 'active') {
      console.log('Login attempt for inactive user:', username, 'status:', user.status);
      return null;
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return null;
    }

    // Update last login
    user.lastLogin = Date.now();
    return user;
  },

  // Update user
  updateUser(id: string, updates: Partial<User>): User | null {
    const user = users.get(id);
    if (!user || user.status === 'deleted') return null;

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
      const existing = this.getUserByUsername(updates.username);
      if (existing && existing.id !== id) {
        throw new Error('Username already exists');
      }
    }

    Object.assign(user, updates);
    console.log('User updated:', id, updates);
    return user;
  },

  // Disable user
  disableUser(id: string): boolean {
    const user = users.get(id);
    if (!user) return false;
    user.status = 'disabled';
    return true;
  },

  // Delete user (soft delete)
  deleteUser(id: string): boolean {
    const user = users.get(id);
    if (!user) return false;
    user.status = 'deleted';
    return true;
  },

  // Get all users (for admin)
  getAllUsers(): User[] {
    return Array.from(users.values()).filter(u => u.status !== 'deleted');
  },

  // Get users by role
  getUsersByRole(role: 'admin' | 'artist' | 'listener'): User[] {
    return this.getAllUsers().filter(u => u.role === role && u.status === 'active');
  },
};

// Create default admin user if none exists
if (users.size === 0) {
  try {
    userStore.createUser('admin', 'admin123', undefined, 'admin');
    console.log('Default admin user created: username=admin, password=admin123');
  } catch (e) {
    // Admin already exists
  }
}

