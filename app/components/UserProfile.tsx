'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout } from '@/app/lib/auth-helpers';
import Link from 'next/link';

export default function UserProfile() {
  const router = useRouter();
  const user = getCurrentUser();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  
  if (!user) return null;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMenu]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        background: '#1a1a2e',
        borderBottom: '2px solid #fbbf24',
        borderRadius: '0.75rem',
        zIndex: 1000,
        padding: '0.75rem 1rem',
        backdropFilter: 'blur(10px)',
        overflowX: 'hidden',
        maxWidth: '100vw',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ 
        maxWidth: '100%', 
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
        position: 'relative',
        overflowX: 'hidden',
      }}>
        {/* Main Title - Centered */}
        <Link
          href="/"
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            textDecoration: 'none',
            zIndex: 1,
            width: '100%',
            maxWidth: '600px',
            padding: '0 1rem',
          }}
        >
          <h1 style={{
            fontSize: 'clamp(0.9rem, 3vw, 1.5rem)',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: 0,
            textAlign: 'center',
            letterSpacing: '0.05em',
            wordBreak: 'break-word',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
          }}>
            Song Pig Listening Rooms
          </h1>
        </Link>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, position: 'relative', zIndex: 2 }}>
          <div
            ref={buttonRef}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600',
              fontSize: '1rem',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            onClick={() => setShowMenu(!showMenu)}
            title="Profile"
          >
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: '500', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.username}
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'capitalize' }}>
              {user.role}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
          {user.role === 'admin' && (
            <Link
              href="/admin"
              style={{
                padding: '0.5rem 1rem',
                background: '#3b82f6',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.85rem',
                fontWeight: '500',
              }}
            >
              Admin Dashboard
            </Link>
          )}
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              background: '#1a1a2e',
              color: '#f9fafb',
              border: '1px solid #333',
              borderRadius: '0.375rem',
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Logout
          </button>
        </div>
      </div>
      
      {/* Profile Menu */}
      {showMenu && (
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            background: '#1a1a2e',
            border: '1px solid #333',
            borderRadius: '0.5rem',
            padding: '0.5rem',
            marginTop: '0.5rem',
            minWidth: '200px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            zIndex: 1001,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Link
            href="/profile"
            style={{
              display: 'block',
              padding: '0.75rem',
              color: '#fff',
              textDecoration: 'none',
              borderBottom: '1px solid #333',
              fontSize: '0.9rem',
            }}
            onClick={() => setShowMenu(false)}
          >
            Edit Profile
          </Link>
          <div style={{ padding: '0.5rem', fontSize: '0.85rem', opacity: 0.7, marginTop: '0.5rem' }}>
            Profile picture upload coming soon!
          </div>
        </div>
      )}
    </div>
  );
}

