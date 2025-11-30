// Helper functions for authentication

export interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'artist' | 'listener';
  status: 'active' | 'disabled' | 'deleted';
  [key: string]: unknown;
}

export const AUTH_CHANGE_EVENT = 'songpig-auth-change';

// Get current user from localStorage
export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    const user = JSON.parse(userStr);
    return user;
  } catch {
    return null;
  }
}

// Get auth headers for API requests
export function getAuthHeaders(): HeadersInit {
  const user = getCurrentUser();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (user) {
    headers['x-user-id'] = user.id;
    headers['x-user-role'] = user.role;
    headers['x-user-name'] = user.username;
  }
  
  return headers;
}

export function setCurrentUser(user: AuthUser | null): void {
  if (typeof window === 'undefined') return;

  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('userId', user.id);
    localStorage.setItem('userRole', user.role);
  } else {
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
  }

  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

// Check if user has specific role
export function hasRole(role: 'admin' | 'artist' | 'listener'): boolean {
  const user = getCurrentUser();
  return user?.role === role;
}

// Logout user
export function logout(): void {
  setCurrentUser(null);
}

