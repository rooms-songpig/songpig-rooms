'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, getAuthHeaders, logout } from '@/app/lib/auth-helpers';
import UserProfile from '@/app/components/UserProfile';
import ScrollToTop from '@/app/components/ScrollToTop';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'artist' | 'listener';
  status: 'active' | 'disabled' | 'deleted';
  createdAt: number;
}

interface Room {
  id: string;
  name: string;
  description: string;
  artistId: string;
  artistName?: string;
  inviteCode: string;
  status: 'draft' | 'active' | 'archived' | 'deleted';
  songs: any[];
  comparisons: any[];
  createdAt: number;
  updatedAt?: number;
  lastAccessed?: number;
}

interface Feedback {
  id: string;
  user_id: string;
  username: string;
  type: 'bug' | 'feature' | 'question' | 'other';
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'wont_fix';
  priority: 'low' | 'normal' | 'high' | 'critical';
  admin_notes: string | null;
  created_at: string;
  updated_at: string | null;
  resolved_at: string | null;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<'admin' | 'artist' | 'listener'>('listener');
  const [editStatus, setEditStatus] = useState<'active' | 'disabled' | 'deleted'>('active');
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<'draft' | 'active' | 'archived' | 'deleted'>('active');
  const [changingBulkStatus, setChangingBulkStatus] = useState(false);
  
  // Create user form state
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'artist' | 'listener'>('listener');
  const [showPassword, setShowPassword] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createUserMessage, setCreateUserMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Feedback state
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [updatingFeedback, setUpdatingFeedback] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }

    if (currentUser.role !== 'admin') {
      router.push('/');
      return;
    }

    setUser(currentUser);
    fetchUsers();
    fetchRooms();
    fetchFeedback();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms', {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.rooms) {
        setRooms(data.rooms);
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    }
  };

  const fetchFeedback = async () => {
    try {
      const res = await fetch('/api/feedback', {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.feedback) {
        setFeedback(data.feedback);
      }
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
    }
  };

  const handleUpdateFeedback = async (id: string, updates: { status?: string; priority?: string; admin_notes?: string }) => {
    setUpdatingFeedback(id);
    try {
      const res = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id, ...updates }),
      });
      const data = await res.json();
      if (data.feedback) {
        setFeedback(prev => prev.map(f => f.id === id ? data.feedback : f));
      }
    } catch (error) {
      console.error('Failed to update feedback:', error);
    } finally {
      setUpdatingFeedback(null);
    }
  };

  const handleUpdateUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          role: editRole,
          status: editStatus,
        }),
      });

      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setEditingUser(null);
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Failed to update user');
    }
  };

  const startEditing = (u: User) => {
    setEditingUser(u.id);
    setEditRole(u.role);
    setEditStatus(u.status);
  };

  const cancelEditing = () => {
    setEditingUser(null);
  };

  const handleCreateUser = async () => {
    if (!newUsername.trim() || !newPassword) {
      setCreateUserMessage({ type: 'error', text: 'Username and password are required' });
      return;
    }

    setCreatingUser(true);
    setCreateUserMessage(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword,
          email: newEmail.trim() || undefined,
          role: newRole,
        }),
      });

      const data = await res.json();
      
      if (data.error) {
        setCreateUserMessage({ type: 'error', text: data.error });
      } else {
        setCreateUserMessage({ type: 'success', text: `User "${newUsername}" created successfully!` });
        setNewUsername('');
        setNewPassword('');
        setNewEmail('');
        setNewRole('listener');
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      setCreateUserMessage({ type: 'error', text: 'Failed to create user' });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleSelectRoom = (roomId: string) => {
    const newSelected = new Set(selectedRooms);
    if (newSelected.has(roomId)) {
      newSelected.delete(roomId);
    } else {
      newSelected.add(roomId);
    }
    setSelectedRooms(newSelected);
  };

  const handleSelectAllRooms = () => {
    if (selectedRooms.size === rooms.length) {
      setSelectedRooms(new Set());
    } else {
      setSelectedRooms(new Set(rooms.map(r => r.id)));
    }
  };

  const handleBulkStatusChange = async () => {
    if (selectedRooms.size === 0) {
      alert('Please select at least one room');
      return;
    }

    if (!confirm(`Change status of ${selectedRooms.size} room(s) to ${bulkStatus}?`)) {
      return;
    }

    setChangingBulkStatus(true);
    try {
      const res = await fetch('/api/rooms/bulk-status', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          roomIds: Array.from(selectedRooms),
          status: bulkStatus,
        }),
      });

      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setSelectedRooms(new Set());
        fetchRooms();
        alert(`Successfully updated ${data.updated || selectedRooms.size} room(s)`);
      }
    } catch (error) {
      console.error('Failed to update room statuses:', error);
      alert('Failed to update room statuses');
    } finally {
      setChangingBulkStatus(false);
    }
  };

  const totalSongs = rooms.reduce((sum, room) => sum + room.songs.length, 0);
  const totalComparisons = rooms.reduce((sum, room) => sum + (room.comparisons?.length || 0), 0);
  const totalComments = rooms.reduce(
    (sum, room) => sum + room.songs.reduce((s, song) => s + (song.comments?.length || 0), 0),
    0
  );

  if (loading || !user) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: '#050816',
          color: '#f9fafb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#050816',
        color: '#f9fafb',
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: '2rem',
      }}
    >
      <UserProfile />
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Admin Dashboard</h1>
          <p style={{ opacity: 0.8 }}>Welcome, {user.username}</p>
        </div>

        <div style={{ background: '#1a1a2e', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>System Statistics</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Total Users</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{users.length}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Artists</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {users.filter(u => u.role === 'artist').length}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Listeners</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {users.filter(u => u.role === 'listener').length}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Total Rooms</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{rooms.length}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Total Songs</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{totalSongs}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Total Comparisons</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{totalComparisons}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Total Comments</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{totalComments}</p>
            </div>
          </div>
        </div>

        {/* Feedback Section */}
        <div style={{ background: '#1a1a2e', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '2rem' }}>
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              cursor: 'pointer' 
            }}
            onClick={() => setShowFeedback(!showFeedback)}
          >
            <h2 style={{ margin: 0 }}>
              Feedback & Bug Reports 
              {feedback.filter(f => f.status === 'open').length > 0 && (
                <span style={{ 
                  marginLeft: '0.5rem', 
                  background: '#ef4444', 
                  color: '#fff', 
                  padding: '0.1rem 0.5rem', 
                  borderRadius: '1rem', 
                  fontSize: '0.8rem' 
                }}>
                  {feedback.filter(f => f.status === 'open').length} open
                </span>
              )}
            </h2>
            <span style={{ fontSize: '1.5rem', opacity: 0.7 }}>{showFeedback ? '−' : '+'}</span>
          </div>
          
          {showFeedback && (
            <div style={{ marginTop: '1rem' }}>
              {/* Copy button for open items */}
              {feedback.filter(f => f.status === 'open' || f.status === 'in_progress').length > 0 && (
                <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      const openItems = feedback
                        .filter(f => f.status === 'open' || f.status === 'in_progress')
                        .map(f => `[${f.type.toUpperCase()}] ${f.title}\n${f.description}\n(Status: ${f.status}, Priority: ${f.priority})`)
                        .join('\n\n---\n\n');
                      navigator.clipboard.writeText(openItems);
                      alert('Copied ' + feedback.filter(f => f.status === 'open' || f.status === 'in_progress').length + ' open items to clipboard!');
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #3b82f6',
                      background: 'transparent',
                      color: '#3b82f6',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    📋 Copy Open Items
                  </button>
                  <button
                    onClick={() => {
                      const allItems = feedback
                        .map(f => `[${f.type.toUpperCase()}] ${f.title}\n${f.description}\n(Status: ${f.status}, Priority: ${f.priority})`)
                        .join('\n\n---\n\n');
                      navigator.clipboard.writeText(allItems);
                      alert('Copied all ' + feedback.length + ' items to clipboard!');
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #666',
                      background: 'transparent',
                      color: '#888',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    📋 Copy All Items
                  </button>
                </div>
              )}
              {feedback.length === 0 ? (
                <p style={{ opacity: 0.7, textAlign: 'center', padding: '2rem' }}>No feedback submitted yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {feedback.map((item) => (
                    <div 
                      key={item.id} 
                      style={{ 
                        background: '#0f0f1e', 
                        padding: '1rem', 
                        borderRadius: '0.5rem',
                        borderLeft: `3px solid ${
                          item.type === 'bug' ? '#ef4444' : 
                          item.type === 'feature' ? '#3b82f6' : 
                          item.type === 'question' ? '#f59e0b' : '#888'
                        }`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            padding: '0.1rem 0.4rem', 
                            borderRadius: '0.25rem',
                            background: item.type === 'bug' ? '#ef4444' : 
                                       item.type === 'feature' ? '#3b82f6' : 
                                       item.type === 'question' ? '#f59e0b' : '#888',
                            marginRight: '0.5rem'
                          }}>
                            {item.type}
                          </span>
                          <strong>{item.title}</strong>
                        </div>
                        <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '0.75rem' }}>{item.description}</p>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>by {item.username}</span>
                        <select
                          value={item.status}
                          onChange={(e) => handleUpdateFeedback(item.id, { status: e.target.value })}
                          disabled={updatingFeedback === item.id}
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            border: '1px solid #444',
                            background: '#1a1a2e',
                            color: '#f9fafb',
                            fontSize: '0.75rem',
                          }}
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                          <option value="wont_fix">Won&apos;t Fix</option>
                        </select>
                        <select
                          value={item.priority}
                          onChange={(e) => handleUpdateFeedback(item.id, { priority: e.target.value })}
                          disabled={updatingFeedback === item.id}
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            border: '1px solid #444',
                            background: '#1a1a2e',
                            color: '#f9fafb',
                            fontSize: '0.75rem',
                          }}
                        >
                          <option value="low">Low</option>
                          <option value="normal">Normal</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ background: '#1a1a2e', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '2rem' }}>
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              cursor: 'pointer' 
            }}
            onClick={() => setShowCreateUser(!showCreateUser)}
          >
            <h2 style={{ margin: 0 }}>Create New User</h2>
            <span style={{ fontSize: '1.5rem', opacity: 0.7 }}>{showCreateUser ? '−' : '+'}</span>
          </div>
          
          {showCreateUser && (
            <div style={{ marginTop: '1.5rem' }}>
              {createUserMessage && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem',
                    background: createUserMessage.type === 'success' ? '#10b98120' : '#ef444420',
                    border: `1px solid ${createUserMessage.type === 'success' ? '#10b981' : '#ef4444'}`,
                    color: createUserMessage.type === 'success' ? '#10b981' : '#ef4444',
                  }}
                >
                  {createUserMessage.text}
                </div>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
                    Username *
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Enter username"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#0f0f1e',
                      border: '1px solid #333',
                      borderRadius: '0.5rem',
                      color: '#f9fafb',
                      fontSize: '1rem',
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
                    Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter password"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        paddingRight: '3rem',
                        background: '#0f0f1e',
                        border: '1px solid #333',
                        borderRadius: '0.5rem',
                        color: '#f9fafb',
                        fontSize: '1rem',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.5rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#888',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        fontSize: '0.8rem',
                      }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter email"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#0f0f1e',
                      border: '1px solid #333',
                      borderRadius: '0.5rem',
                      color: '#f9fafb',
                      fontSize: '1rem',
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
                    Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as 'artist' | 'listener')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#0f0f1e',
                      border: '1px solid #333',
                      borderRadius: '0.5rem',
                      color: '#f9fafb',
                      fontSize: '1rem',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="listener">Listener</option>
                    <option value="artist">Artist</option>
                  </select>
                </div>
              </div>
              
              <div style={{ marginTop: '1.5rem' }}>
                <button
                  onClick={handleCreateUser}
                  disabled={creatingUser || !newUsername.trim() || !newPassword}
                  style={{
                    background: creatingUser || !newUsername.trim() || !newPassword ? '#555' : '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: creatingUser || !newUsername.trim() || !newPassword ? 'not-allowed' : 'pointer',
                  }}
                >
                  {creatingUser ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>All Users</h2>
          {users.length === 0 ? (
            <p style={{ opacity: 0.7, textAlign: 'center', padding: '2rem' }}>No users found</p>
          ) : (
            <div style={{ background: '#1a1a2e', padding: '1.5rem', borderRadius: '0.75rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.9rem', opacity: 0.7 }}>Username</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.9rem', opacity: 0.7 }}>Role</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.9rem', opacity: 0.7 }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.9rem', opacity: 0.7 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #333' }}>
                      <td style={{ padding: '0.75rem' }}>{u.username}</td>
                      <td style={{ padding: '0.75rem' }}>
                        {editingUser === u.id ? (
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as any)}
                            disabled={u.role === 'admin'}
                            style={{
                              background: '#0f0f1e',
                              color: '#f9fafb',
                              border: '1px solid #333',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.375rem',
                            }}
                          >
                            <option value="admin">admin</option>
                            <option value="artist">artist</option>
                            <option value="listener">listener</option>
                          </select>
                        ) : (
                          u.role
                        )}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {editingUser === u.id ? (
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as any)}
                            disabled={u.role === 'admin'}
                            style={{
                              background: '#0f0f1e',
                              color: '#f9fafb',
                              border: '1px solid #333',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.375rem',
                            }}
                          >
                            <option value="active">active</option>
                            <option value="disabled">disabled</option>
                            <option value="deleted">deleted</option>
                          </select>
                        ) : (
                          <span style={{ color: u.status === 'active' ? '#10b981' : u.status === 'disabled' ? '#ef4444' : '#888' }}>
                            {u.status}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {editingUser === u.id ? (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleUpdateUser(u.id)}
                              style={{
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '0.375rem',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                              }}
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              style={{
                                background: '#666',
                                color: 'white',
                                border: 'none',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '0.375rem',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditing(u)}
                            disabled={u.role === 'admin'}
                            style={{
                              background: u.role === 'admin' ? '#555' : '#3b82f6',
                              color: 'white',
                              border: 'none',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.85rem',
                              cursor: u.role === 'admin' ? 'not-allowed' : 'pointer',
                            }}
                            title={u.role === 'admin' ? 'Admin accounts cannot be modified' : 'Edit user'}
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>All Rooms</h2>
            {selectedRooms.size > 0 && (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                  {selectedRooms.size} room(s) selected
                </span>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value as any)}
                  style={{
                    background: '#0f0f1e',
                    color: '#f9fafb',
                    border: '1px solid #333',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                  <option value="deleted">Deleted</option>
                </select>
                <button
                  onClick={handleBulkStatusChange}
                  disabled={changingBulkStatus}
                  style={{
                    background: changingBulkStatus ? '#555' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.9rem',
                    cursor: changingBulkStatus ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                  }}
                >
                  {changingBulkStatus ? 'Updating...' : 'Change Status'}
                </button>
                <button
                  onClick={() => setSelectedRooms(new Set())}
                  style={{
                    background: '#1a1a2e',
                    color: '#f9fafb',
                    border: '1px solid #333',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>
          {rooms.length === 0 ? (
            <p style={{ opacity: 0.7, textAlign: 'center', padding: '2rem' }}>No rooms found</p>
          ) : (
            <div style={{ background: '#1a1a2e', padding: '1.5rem', borderRadius: '0.75rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.9rem', opacity: 0.7 }}>
                      <input
                        type="checkbox"
                        checked={selectedRooms.size === rooms.length && rooms.length > 0}
                        onChange={handleSelectAllRooms}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.9rem', opacity: 0.7 }}>Room Name</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.9rem', opacity: 0.7 }}>Invite Code</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.9rem', opacity: 0.7 }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.9rem', opacity: 0.7 }}>Artist</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.9rem', opacity: 0.7 }}>Created</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.9rem', opacity: 0.7 }}>Last Accessed</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.9rem', opacity: 0.7 }}>Songs</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.9rem', opacity: 0.7 }}>Comparisons</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.9rem', opacity: 0.7 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => {
                    const roomComments = room.songs.reduce((sum, song) => sum + (song.comments?.length || 0), 0);
                    const formatDate = (timestamp?: number) => {
                      if (!timestamp) return 'Never';
                      const date = new Date(timestamp);
                      const now = new Date();
                      const diffMs = now.getTime() - date.getTime();
                      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                      
                      if (diffDays === 0) return 'Today';
                      if (diffDays === 1) return 'Yesterday';
                      if (diffDays < 7) return `${diffDays} days ago`;
                      return date.toLocaleDateString();
                    };
                    
                    return (
                      <tr key={room.id} style={{ borderBottom: '1px solid #333' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <input
                            type="checkbox"
                            checked={selectedRooms.has(room.id)}
                            onChange={() => handleSelectRoom(room.id)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ padding: '0.75rem' }}>{room.name}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <code style={{ 
                              background: '#0f0f1e', 
                              padding: '0.25rem 0.5rem', 
                              borderRadius: '0.25rem',
                              fontSize: '0.8rem',
                              fontFamily: 'monospace'
                            }}>
                              {room.inviteCode}
                            </code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(room.inviteCode);
                                alert('Invite code copied!');
                              }}
                              style={{
                                background: 'transparent',
                                border: '1px solid #444',
                                color: '#888',
                                padding: '0.2rem 0.4rem',
                                borderRadius: '0.25rem',
                                fontSize: '0.7rem',
                                cursor: 'pointer',
                              }}
                              title="Copy invite code"
                            >
                              Copy
                            </button>
                            <button
                              onClick={() => {
                                const link = `${window.location.origin}/join?code=${room.inviteCode}`;
                                navigator.clipboard.writeText(link);
                                alert('Room link copied!');
                              }}
                              style={{
                                background: 'transparent',
                                border: '1px solid #444',
                                color: '#888',
                                padding: '0.2rem 0.4rem',
                                borderRadius: '0.25rem',
                                fontSize: '0.7rem',
                                cursor: 'pointer',
                              }}
                              title="Copy room link"
                            >
                              Link
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span
                            style={{
                              background: room.status === 'draft' ? '#f59e0b' : room.status === 'active' ? '#10b981' : room.status === 'archived' ? '#6b7280' : '#ef4444',
                              color: 'white',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.7rem',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                            }}
                          >
                            {room.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{room.artistName || 'Unknown'}</td>
                        <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{formatDate(room.createdAt)}</td>
                        <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{formatDate(room.lastAccessed)}</td>
                        <td style={{ padding: '0.75rem' }}>{room.songs.length}</td>
                        <td style={{ padding: '0.75rem' }}>{room.comparisons?.length || 0}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <Link
                            href={`/room/${room.id}`}
                            style={{
                              color: '#3b82f6',
                              textDecoration: 'none',
                              fontSize: '0.85rem',
                            }}
                          >
                            View Room
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <ScrollToTop />
    </main>
  );
}
