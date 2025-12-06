'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout } from '@/app/lib/auth-helpers';
import Link from 'next/link';
import SongPigLogo from '@/app/components/SongPigLogo';

type UserProfileProps = {
  pageName?: string;
};

export default function UserProfile({ pageName }: UserProfileProps) {
  const router = useRouter();
  const user = getCurrentUser();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugCopied, setDebugCopied] = useState(false);
  const debugButtonRef = useRef<HTMLButtonElement | null>(null);
  const debugPopoverRef = useRef<HTMLDivElement | null>(null);
  const [debugInfo, setDebugInfo] = useState('');
  const [clientPath, setClientPath] = useState('');
  const [clientHref, setClientHref] = useState('');
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    setClientPath(window.location.pathname + window.location.search);
    setClientHref(window.location.href);
  }, []);

  useEffect(() => {
    if (!debugOpen) return;
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (
        !target ||
        debugPopoverRef.current?.contains(target) ||
        debugButtonRef.current?.contains(target)
      ) {
        return;
      }
      setDebugOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [debugOpen]);

  if (!user) return null;

  const isSuperAdmin =
    user.role === 'admin' && user.username.toLowerCase() === 'admin';

  const handleLogout = () => {
    logout();
    router.push('/login');
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    if (!mobileTriggerRef.current) {
      setMobileMenuOpen((open) => !open);
      return;
    }

    const rect = mobileTriggerRef.current.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 8,
      right: Math.max(window.innerWidth - rect.right - 8, 12),
    });
    setMobileMenuOpen((open) => !open);
  };

  const createDebugInfo = useCallback(() => {
    const timestamp = new Date().toISOString();
    return [
      `Page: ${pageName ?? 'Unknown'}`,
      `Path: ${clientPath || 'n/a'}`,
      `URL: ${clientHref || 'n/a'}`,
      `User: ${user?.username ?? 'unknown'} (${user?.role ?? 'unknown'})`,
      `Status: ${user?.status ?? 'unknown'}`,
      `Timestamp: ${timestamp}`,
    ].join('\n');
  }, [pageName, clientPath, clientHref, user?.username, user?.role, user?.status]);

  const handleDebugToggle = () => {
    if (!pageName) return;
    setDebugCopied(false);
    setDebugInfo(createDebugInfo());
    setDebugOpen((open) => !open);
  };

  const handleCopyDebugInfo = async () => {
    try {
      const info = debugInfo || createDebugInfo();
      await navigator.clipboard.writeText(info);
      setDebugCopied(true);
      setTimeout(() => setDebugCopied(false), 2000);
      setDebugOpen(false);
    } catch (error) {
      console.warn('Failed to copy debug info', error);
    }
  };

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        padding: '0.5rem 0 0.75rem',
        background:
          'linear-gradient(180deg, rgba(2,6,23,0.96) 0%, rgba(15,23,42,0.9) 60%, rgba(15,23,42,0) 100%)',
        zIndex: 1000,
        backdropFilter: 'blur(10px)',
        overflow: 'visible',
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
          overflow: 'visible',
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
          <SongPigLogo href="/" size={isMobile ? 'md' : 'lg'} />

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
          {pageName && (
            <div style={{ position: 'relative' }}>
              <button
                ref={debugButtonRef}
                type="button"
                aria-label="Copy debug info"
                onClick={handleDebugToggle}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  border: '1px solid rgba(148,163,184,0.45)',
                  background: 'rgba(15,23,42,0.9)',
                  color: '#38bdf8',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                📍
              </button>
              {debugOpen && (
                <div
                  ref={debugPopoverRef}
                  onMouseLeave={() => {
                    if (!isTouchDevice) {
                      setDebugOpen(false);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 0.4rem)',
                    right: 0,
                    minWidth: '220px',
                    padding: '0.75rem',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(148,163,184,0.35)',
                    background: 'rgba(15,23,42,0.97)',
                    boxShadow: '0 20px 45px rgba(0,0,0,0.65)',
                    zIndex: 1500,
                  }}
                >
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                    Page: <strong style={{ color: '#f9fafb' }}>{pageName}</strong>
                  </p>
                  {clientPath && (
                    <p style={{ margin: '0.4rem 0', fontSize: '0.75rem', color: '#cbd5f5' }}>
                      {clientPath}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleCopyDebugInfo}
                    style={{
                      marginTop: '0.5rem',
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(56,189,248,0.4)',
                      background: 'rgba(8,47,73,0.85)',
                      color: '#e0f2fe',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    {debugCopied ? 'Copied!' : 'Copy debug info'}
                  </button>
                </div>
              )}
            </div>
          )}
          {isMobile ? (
            <>
              <button
                ref={mobileTriggerRef}
                type="button"
                aria-label="Open menu"
                onClick={toggleMobileMenu}
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
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            background: 'rgba(2,6,23,0.5)',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseLeave={() => {
              if (!isTouchDevice) {
                setMobileMenuOpen(false);
              }
            }}
            style={{
              position: 'absolute',
              top: menuPosition?.top ?? 80,
              right: menuPosition?.right ?? 16,
              background:
                'linear-gradient(145deg, rgba(15,23,42,0.98) 0%, rgba(2,6,23,0.99) 100%)',
              borderRadius: '1rem',
              border: '1px solid rgba(139,92,246,0.35)',
              minWidth: '210px',
              boxShadow:
                '0 25px 60px rgba(0,0,0,0.8), 0 0 25px rgba(139,92,246,0.2)',
              padding: '0.6rem',
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
        </div>
      )}
    </div>
  );
}

