'use client';

import { useState, useEffect, useRef } from 'react';

interface CommentAuthorTooltipProps {
  authorId: string;
  authorUsername: string;
  isAnonymous: boolean;
  children: React.ReactNode;
}

interface UserInfo {
  role: string;
  bio?: string;
}

export default function CommentAuthorTooltip({
  authorId,
  authorUsername,
  isAnonymous,
  children,
}: CommentAuthorTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const fetchUserInfo = async () => {
    if (isAnonymous || loading || userInfo) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${authorId}`);
      const data = await res.json();
      if (data.user) {
        setUserInfo({
          role: data.user.role,
          bio: data.user.bio,
        });
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseEnter = () => {
    if (isAnonymous) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (!userInfo && !loading) {
      fetchUserInfo();
    }
    
    timeoutRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, 300); // Small delay to prevent tooltip flicker
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowTooltip(false);
  };

  const handleClick = () => {
    // On mobile, toggle tooltip on click
    if (isAnonymous) return;
    
    if (!userInfo && !loading) {
      fetchUserInfo();
    }
    
    setShowTooltip(!showTooltip);
  };

  if (isAnonymous) {
    return <>{children}</>;
  }

  const roleLabel = userInfo?.role
    ? userInfo.role.charAt(0).toUpperCase() + userInfo.role.slice(1)
    : 'Loading...';

  const bioPreview = userInfo?.bio
    ? userInfo.bio.length > 100
      ? `${userInfo.bio.substring(0, 100)}...`
      : userInfo.bio
    : null;

  return (
    <span
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {children}
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '0.5rem',
            background: '#1a1a2e',
            border: '1px solid #4a9eff',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            minWidth: '200px',
            maxWidth: '300px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            fontSize: '0.85rem',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: '#4a9eff' }}>
            {authorUsername}
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: bioPreview ? '0.5rem' : 0 }}>
            {roleLabel}
          </div>
          {bioPreview && (
            <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '0.5rem', lineHeight: '1.4' }}>
              {bioPreview}
            </div>
          )}
          {/* Arrow pointing down */}
          <div
            style={{
              position: 'absolute',
              bottom: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #4a9eff',
            }}
          />
        </div>
      )}
    </span>
  );
}

