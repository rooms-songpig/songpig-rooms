// Helper functions for authentication

export interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'artist' | 'listener';
  status: 'active' | 'disabled' | 'deleted';
}

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
  if (typeof window === 'undefined') return;
  localStorage.removeItem('user');
  localStorage.removeItem('userId');
  localStorage.removeItem('userRole');
}

