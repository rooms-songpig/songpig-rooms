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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement | null>(null);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (
        !target ||
        (mobileMenuRef.current &&
          mobileMenuRef.current.contains(target)) ||
        (mobileTriggerRef.current &&
          mobileTriggerRef.current.contains(target))
      ) {
        return;
      }
      setMobileMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [mobileMenuOpen]);
  
  if (!user) return null;

  const isSuperAdmin =
    user.role === 'admin' && user.username.toLowerCase() === 'admin';

  const handleLogout = () => {
    logout();
    router.push('/login');
    setMobileMenuOpen(false);
  };

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        padding: '0.5rem 0 0.75rem',
        background: 'linear-gradient(180deg, rgba(2,6,23,0.96) 0%, rgba(15,23,42,0.9) 60%, rgba(15,23,42,0) 100%)',
        zIndex: 1000,
        backdropFilter: 'blur(10px)',
        overflowX: 'hidden',
        maxWidth: '100vw',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
          padding: '0.35rem 0.75rem',
          borderRadius: '0.75rem',
          border: isSuperAdmin
            ? '2px solid #f97316'
            : '1px solid rgba(148,163,184,0.5)',
          background: isSuperAdmin
            ? 'linear-gradient(135deg, #0f172a 0%, #1f2937 40%, #4b5563 100%)'
            : 'rgba(15, 23, 42, 0.96)',
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
          {isMobile ? (
            <>
              <button
                ref={mobileTriggerRef}
                type="button"
                aria-label="Open menu"
                onClick={() => setMobileMenuOpen((open) => !open)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '999px',
                  border: '1px solid rgba(148,163,184,0.6)',
                  background:
                    'radial-gradient(circle at 0% 0%, rgba(34,211,238,0.25) 0, transparent 45%), rgba(15,23,42,0.95)',
                  color: '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <span style={{ fontSize: '1.3rem', transform: 'translateY(-1px)' }}>⋮</span>
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
      {/* Mobile quick menu */}
      {isMobile && mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.6rem)',
            right: '1rem',
            background:
              'linear-gradient(145deg, rgba(15,23,42,0.98) 0%, rgba(2,6,23,0.99) 100%)',
            borderRadius: '1rem',
            border: '1px solid rgba(139,92,246,0.35)',
            minWidth: '200px',
            boxShadow:
              '0 20px 50px rgba(0,0,0,0.75), 0 0 30px rgba(139,92,246,0.15)',
            padding: '0.6rem',
            zIndex: 1200,
          }}
        >
          <div
            style={{
              padding: '0.6rem 0.75rem 0.5rem',
              borderBottom: '1px solid rgba(139,92,246,0.25)',
              marginBottom: '0.35rem',
              fontSize: '0.78rem',
              color: '#94a3b8',
            }}
          >
            Signed in as{' '}
            <strong style={{ color: '#e5e7eb' }}>{user.username}</strong>
          </div>
          {user.role === 'admin' && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'block',
                padding: '0.65rem 0.75rem',
                borderRadius: '0.6rem',
                color: '#e5e7eb',
                textDecoration: 'none',
                fontSize: '0.9rem',
                background: 'rgba(59,130,246,0.12)',
              }}
            >
              🛠️ Admin Dashboard
            </Link>
          )}
          <Link
            href="/profile"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              display: 'block',
              padding: '0.65rem 0.75rem',
              borderRadius: '0.6rem',
              color: '#e5e7eb',
              textDecoration: 'none',
              fontSize: '0.9rem',
              marginTop: '0.15rem',
            }}
          >
            👤 Profile
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              width: '100%',
              marginTop: '0.35rem',
              padding: '0.65rem 0.75rem',
              borderRadius: '0.6rem',
              border: 'none',
              background: 'rgba(239,68,68,0.1)',
              color: '#fca5a5',
              fontSize: '0.9rem',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            🚪 Logout
          </button>
        </div>
      )}
    </div>
  );
}

