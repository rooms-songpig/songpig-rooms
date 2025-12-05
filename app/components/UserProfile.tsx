'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout } from '@/app/lib/auth-helpers';
import Link from 'next/link';
import SongPigLogo from '@/app/components/SongPigLogo';

export default function UserProfile() {
  const router = useRouter();
  const user = getCurrentUser();
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  if (!user) return null;

  const isSuperAdmin =
    user.role === 'admin' && user.username.toLowerCase() === 'admin';

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
        background: isSuperAdmin
          ? 'linear-gradient(135deg, #0f172a 0%, #1f2937 40%, #4b5563 100%)'
          : 'rgba(15, 23, 42, 0.96)',
        borderBottom: isSuperAdmin ? '3px solid #f97316' : '1px solid rgba(148,163,184,0.5)',
        borderRadius: '0.75rem',
        zIndex: 1000,
        padding: '0.75rem 1rem',
        backdropFilter: 'blur(10px)',
        overflowX: 'hidden',
        maxWidth: '100vw',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          position: 'relative',
          overflowX: 'hidden',
        }}
      >
        {/* Left: Logo + user summary */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.9rem',
            flex: 1,
            minWidth: 0,
            zIndex: 2,
          }}
        >
          <SongPigLogo href="/" size={isMobile ? 'sm' : 'md'} />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background:
                  'radial-gradient(circle at 20% 0%, #60a5fa 0, #3b82f6 45%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 600,
                fontSize: '1rem',
                flexShrink: 0,
              }}
              title={user.username}
            >
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user.username}
              </div>
              <div
                style={{
                  fontSize: '0.8rem',
                  opacity: 0.85,
                  fontStyle: 'italic',
                }}
              >
                {isSuperAdmin
                  ? 'Super admin'
                  : user.role === 'listener'
                  ? 'Reviewer'
                  : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Right: actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
            position: 'relative',
            zIndex: 2,
          }}
        >
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
          <Link
            href="/profile"
            style={{
              padding: '0.5rem 1rem',
              background: '#1a1a2e',
              color: '#f9fafb',
              border: '1px solid #333',
              borderRadius: '0.375rem',
              fontSize: '0.85rem',
              fontWeight: '500',
              textDecoration: 'none',
            }}
          >
            Profile
          </Link>
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
    </div>
  );
}

