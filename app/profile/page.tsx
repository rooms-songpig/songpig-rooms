'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuthHeaders } from '@/app/lib/auth-helpers';
import UserProfile from '@/app/components/UserProfile';
import Breadcrumb from '@/app/components/Breadcrumb';
import ScrollToTop from '@/app/components/ScrollToTop';
import Toast from '@/app/components/Toast';
import PageLabel from '@/app/components/PageLabel';

interface User {
  id: string;
  username: string;
  email?: string;
  role: 'admin' | 'artist' | 'listener';
  bio?: string;
  displayName?: string;
  avatarUrl?: string;
  socialLinks?: Record<string, string>;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [website, setWebsite] = useState('');
  const [xHandle, setXHandle] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [youtube, setYoutube] = useState('');
  const [tipping, setTipping] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    // Track previous page for smart back navigation
    if (typeof window !== 'undefined') {
      const referrer = document.referrer;
      if (referrer) {
        try {
          const url = new URL(referrer);
          if (url.pathname !== window.location.pathname && url.origin === window.location.origin) {
            sessionStorage.setItem('previousPage', url.pathname);
          }
        } catch (e) {
          // ignore invalid referrer
        }
      }
    }
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setUsername(data.user.username || '');
        setBio(data.user.bio || '');
        setDisplayName(data.user.displayName || '');
        setAvatarUrl(data.user.avatarUrl || '');
        const links = data.user.socialLinks || {};
        setWebsite(links.website || '');
        setXHandle(links.x || '');
        setInstagram(links.instagram || '');
        setFacebook(links.facebook || '');
        setYoutube(links.youtube || '');
        setTipping(links.tipping || links.support || '');
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const socialLinks: Record<string, string> = {};
      if (website.trim()) socialLinks.website = website.trim();
      if (xHandle.trim()) socialLinks.x = xHandle.trim();
      if (instagram.trim()) socialLinks.instagram = instagram.trim();
      if (facebook.trim()) socialLinks.facebook = facebook.trim();
      if (youtube.trim()) socialLinks.youtube = youtube.trim();
      if (tipping.trim()) {
        socialLinks.support = tipping.trim();
      }

      const res = await fetch(`/api/users/${user?.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          username,
          bio,
          displayName,
          avatarUrl,
          socialLinks,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setToast({ message: data.error, type: 'error' });
      } else {
        setToast({ message: 'Profile updated successfully!', type: 'success' });
        setUser(data.user);
        // Navigate back after showing success message
        setTimeout(() => {
          const previousPage = sessionStorage.getItem('previousPage');
          if (previousPage && previousPage !== window.location.pathname) {
            router.push(previousPage);
          } else {
            router.push('/');
          }
        }, 500);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setToast({ message: 'Failed to update profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main style={{ minHeight: '100dvh', background: '#0f0f23', color: '#fff', padding: '2rem' }}>
        <UserProfile />
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main style={{ minHeight: '100dvh', background: '#0f0f23', color: '#fff', padding: '2rem' }}>
      <PageLabel pageName="Profile" />
      <UserProfile />
      <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem' }}>
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Edit Profile' },
          ]}
        />
        <button
          onClick={() => {
            const previousPage = sessionStorage.getItem('previousPage');
            if (previousPage && previousPage !== window.location.pathname) {
              router.push(previousPage);
            } else {
              router.push('/');
            }
          }}
          style={{
            background: '#1a1a2e',
            color: '#f9fafb',
            border: '1px solid #333',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            fontSize: '0.9rem',
            cursor: 'pointer',
            marginBottom: '1rem',
          }}
        >
          ← Back
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>Edit Profile</h1>
          <Link
            href="/"
            style={{
              padding: '0.5rem 1rem',
              background: '#1a1a2e',
              color: '#f9fafb',
              border: '1px solid #333',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontSize: '0.9rem',
            }}
          >
            Home
          </Link>
        </div>
        
        <form onSubmit={handleSave} style={{ background: '#1a1a2e', padding: '2rem', borderRadius: '0.75rem' }}>
          <div style={{ marginBottom: '1.5rem', display: 'grid', gap: '1rem', gridTemplateColumns: '1.5fr 1.5fr' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
                Account Type
              </label>
              <p
                style={{
                  fontSize: '0.9rem',
                  opacity: 0.95,
                  fontStyle: 'italic',
                  margin: 0,
                }}
              >
                {user.role === 'listener'
                  ? 'Reviewer'
                  : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </p>
            </div>
            {user.email && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
                  Email
                </label>
                <p style={{ fontSize: '0.9rem', opacity: 0.9, margin: 0 }}>{user.email}</p>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
              Username / @handle *
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#0f0f23',
                border: '1px solid #333',
                borderRadius: '0.5rem',
                color: '#fff',
                fontSize: '1rem',
              }}
            />
            <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.35rem' }}>
              Your public handle will appear as <span style={{ fontWeight: 600 }}>@
              {username || 'yourname'}</span>.
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
              Display Name (artist or band)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. The Electric Light Orchestra"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#0f0f23',
                border: '1px solid #333',
                borderRadius: '0.5rem',
                color: '#fff',
                fontSize: '1rem',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
              Avatar Image URL (optional)
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/your-photo.jpg"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#0f0f23',
                border: '1px solid #333',
                borderRadius: '0.5rem',
                color: '#fff',
                fontSize: '1rem',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={5}
              placeholder="Tell us about yourself..."
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#0f0f23',
                border: '1px solid #333',
                borderRadius: '0.5rem',
                color: '#fff',
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
            <p style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '0.5rem' }}>
              This bio will appear on your rooms and profile.
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', margin: '0 0 0.75rem 0' }}>Links & Support</h2>
            <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.75rem' }}>
              Add links you want trusted listeners to see on your public profile.
            </p>
            <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: '1fr' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', opacity: 0.8 }}>
                  Website
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://your-site.com"
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    background: '#0f0f23',
                    border: '1px solid #333',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '0.95rem',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', opacity: 0.8 }}>
                  X (Twitter)
                </label>
                <input
                  type="url"
                  value={xHandle}
                  onChange={(e) => setXHandle(e.target.value)}
                  placeholder="https://x.com/yourhandle"
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    background: '#0f0f23',
                    border: '1px solid #333',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '0.95rem',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', opacity: 0.8 }}>
                  Instagram
                </label>
                <input
                  type="url"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/yourhandle"
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    background: '#0f0f23',
                    border: '1px solid #333',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '0.95rem',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', opacity: 0.8 }}>
                  Facebook
                </label>
                <input
                  type="url"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="https://facebook.com/yourpage"
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    background: '#0f0f23',
                    border: '1px solid #333',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '0.95rem',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', opacity: 0.8 }}>
                  YouTube
                </label>
                <input
                  type="url"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  placeholder="https://youtube.com/@yourchannel"
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    background: '#0f0f23',
                    border: '1px solid #333',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '0.95rem',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', opacity: 0.8 }}>
                  Support / Tips link
                </label>
                <input
                  type="url"
                  value={tipping}
                  onChange={(e) => setTipping(e.target.value)}
                  placeholder="https://buymeacoffee.com/you or https://venmo.com/you"
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    background: '#0f0f23',
                    border: '1px solid #333',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '0.95rem',
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              type="submit"
              disabled={saving || !username.trim()}
              style={{
                padding: '0.75rem 2rem',
                background: saving || !username.trim() ? '#333' : '#4a9eff',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: saving || !username.trim() ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                padding: '0.75rem 2rem',
                background: 'transparent',
                color: '#fff',
                border: '1px solid #333',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
            >
              Cancel
            </button>
          </div>
        </form>

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#1a1a2e', borderRadius: '0.75rem', fontSize: '0.9rem', opacity: 0.7 }}>
          <p>
            <strong>Role:</strong>{' '}
            <span style={{ fontStyle: 'italic' }}>
              {user.role === 'listener'
                ? 'Reviewer'
                : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          </p>
          {user.email && <p><strong>Email:</strong> {user.email}</p>}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <ScrollToTop />
    </main>
  );
}

