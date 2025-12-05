'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, getAuthHeaders, AUTH_CHANGE_EVENT, type AuthUser } from '@/app/lib/auth-helpers';

type FeedbackType = 'bug' | 'feature' | 'question' | 'other';

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Start with no user on both server and client; sync from local state in an effect
  // to avoid hydration mismatches from reading window/localStorage during render.
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const syncUser = () => setUser(getCurrentUser());

    syncUser();
    window.addEventListener(AUTH_CHANGE_EVENT, syncUser);
    window.addEventListener('storage', syncUser);
    window.addEventListener('focus', syncUser);

    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, syncUser);
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('focus', syncUser);
    };
  }, []);

  useEffect(() => {
    if (!user && isOpen) {
      setIsOpen(false);
    }
  }, [user, isOpen]);

  // Don't show button if not logged in
  if (!user) return null;

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ type, title, description }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(true);
        setTitle('');
        setDescription('');
        setType('bug');
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
        }, 2000);
      }
    } catch (err) {
      setError('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const typeLabels: Record<FeedbackType, string> = {
    bug: '🐛 Bug Report',
    feature: '✨ Feature Request',
    question: '❓ Question',
    other: '💬 Other',
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          zIndex: 1100,
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        }}
        title="Submit Feedback"
        aria-label="Submit feedback"
      >
        💡
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            style={{
              background: '#1a1a2e',
              borderRadius: '1rem',
              padding: '1.5rem',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              border: '1px solid #333',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Submit Feedback</h2>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#888',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.25rem',
                }}
              >
                ×
              </button>
            </div>

            {success ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <p style={{ color: '#4ade80' }}>Thanks for your feedback!</p>
              </div>
            ) : (
              <>
                {/* Type Selection */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
                    Type
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {(Object.keys(typeLabels) as FeedbackType[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setType(t)}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '0.5rem',
                          border: type === t ? '2px solid #3b82f6' : '1px solid #444',
                          background: type === t ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                          color: '#f9fafb',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                        }}
                      >
                        {typeLabels[t]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief summary..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #444',
                      background: '#0f0f1e',
                      color: '#f9fafb',
                      fontSize: '1rem',
                    }}
                  />
                </div>

                {/* Description */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the bug or feature in detail..."
                    rows={5}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #444',
                      background: '#0f0f1e',
                      color: '#f9fafb',
                      fontSize: '1rem',
                      resize: 'vertical',
                    }}
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <p style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    {error}
                  </p>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: submitting ? '#666' : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

