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
  inviteCode: string;
  status: 'draft' | 'active' | 'archived' | 'deleted';
  songs: any[];
  comparisons: any[];
  createdAt: number;
  updatedAt?: number;
  lastAccessed?: number;
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
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.9rem', opacity: 0.7 }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.9rem', opacity: 0.7 }}>Artist ID</th>
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
                        <td style={{ padding: '0.75rem', fontSize: '0.85rem', opacity: 0.7 }}>{room.artistId}</td>
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
