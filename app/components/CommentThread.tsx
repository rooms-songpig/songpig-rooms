'use client';

import { useState, useEffect } from 'react';
import { getAuthHeaders } from '@/app/lib/auth-helpers';
import CommentAuthorTooltip from './CommentAuthorTooltip';

interface Comment {
  id: string;
  text: string;
  authorId: string;
  authorUsername: string;
  isAnonymous: boolean;
  parentCommentId?: string;
  createdAt: number;
}

interface CommentThreadProps {
  comments: Comment[];
  songId: string;
  roomId: string;
  currentUserId: string | null;
  isGuest: boolean;
  onCommentAdded: () => void;
  formatTimestamp: (timestamp: number) => string;
}

const REACTIONS = [
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'insightful', emoji: '💡', label: 'Insightful' },
  { type: 'fire', emoji: '🔥', label: 'Fire' },
];

interface ReactionCounts {
  [key: string]: number;
}

function SingleComment({
  comment,
  replies,
  songId,
  roomId,
  currentUserId,
  isGuest,
  onCommentAdded,
  formatTimestamp,
  depth = 0,
}: {
  comment: Comment;
  replies: Comment[];
  songId: string;
  roomId: string;
  currentUserId: string | null;
  isGuest: boolean;
  onCommentAdded: () => void;
  formatTimestamp: (timestamp: number) => string;
  depth?: number;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [reactionCounts, setReactionCounts] = useState<ReactionCounts>({});
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const authorName = comment.isAnonymous ? 'Anonymous' : comment.authorUsername;

  // Fetch reactions
  useEffect(() => {
    const fetchReactions = async () => {
      try {
        const res = await fetch(`/api/comments/${comment.id}/reactions`);
        const data = await res.json();
        if (!data.error) {
          setReactionCounts(data.counts || {});
          // Check if current user has reacted
          if (currentUserId && data.userReactions?.[currentUserId]) {
            setUserReaction(data.userReactions[currentUserId][0] || null);
          }
        }
      } catch (e) {
        // Silent fail
      }
    };
    fetchReactions();
  }, [comment.id, currentUserId]);

  const handleReaction = async (reactionType: string) => {
    if (isGuest || !currentUserId) return;

    try {
      const res = await fetch(`/api/comments/${comment.id}/reactions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reactionType }),
      });
      const data = await res.json();
      
      if (!data.error) {
        if (data.action === 'removed') {
          setReactionCounts(prev => ({
            ...prev,
            [reactionType]: Math.max(0, (prev[reactionType] || 1) - 1),
          }));
          setUserReaction(null);
        } else if (data.action === 'added') {
          setReactionCounts(prev => ({
            ...prev,
            [reactionType]: (prev[reactionType] || 0) + 1,
          }));
          setUserReaction(reactionType);
        } else if (data.action === 'changed') {
          // Remove old, add new
          if (userReaction) {
            setReactionCounts(prev => ({
              ...prev,
              [userReaction]: Math.max(0, (prev[userReaction] || 1) - 1),
              [reactionType]: (prev[reactionType] || 0) + 1,
            }));
          }
          setUserReaction(reactionType);
        }
      }
    } catch (e) {
      console.error('Failed to add reaction:', e);
    }
    setShowReactionPicker(false);
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim() || !currentUserId) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/songs/${songId}/comments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          text: replyText,
          isAnonymous: false,
          parentCommentId: comment.id,
        }),
      });

      const data = await res.json();
      if (!data.error) {
        setReplyText('');
        setShowReplyForm(false);
        onCommentAdded();
      }
    } catch (e) {
      console.error('Failed to submit reply:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

  return (
    <div style={{ marginLeft: depth > 0 ? '1.5rem' : 0 }}>
      <div
        style={{
          background: depth > 0 ? '#0a0a15' : '#0f0f1e',
          padding: '1rem',
          borderRadius: '0.75rem',
          borderLeft: depth > 0 ? '3px solid #3b82f6' : 'none',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <CommentAuthorTooltip
            authorId={comment.authorId}
            authorUsername={comment.authorUsername}
            isAnonymous={comment.isAnonymous}
          >
            <span
              style={{
                fontWeight: '600',
                color: '#4a9eff',
                cursor: comment.isAnonymous ? 'default' : 'pointer',
              }}
            >
              {authorName}
            </span>
          </CommentAuthorTooltip>
          <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>
            {formatTimestamp(comment.createdAt)}
          </span>
        </div>

        {/* Comment text */}
        <p style={{ margin: '0 0 0.75rem 0', lineHeight: 1.5 }}>{comment.text}</p>

        {/* Actions row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem' }}>
          {/* Reaction button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => !isGuest && setShowReactionPicker(!showReactionPicker)}
              style={{
                background: userReaction ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: userReaction ? '#3b82f6' : '#9ca3af',
                cursor: isGuest ? 'not-allowed' : 'pointer',
                padding: '0.25rem 0.6rem',
                borderRadius: '999px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                minWidth: '48px',
                justifyContent: 'center',
                transition: 'background 0.15s, color 0.15s',
              }}
              title={isGuest ? 'Register to react' : 'Add reaction'}
            >
              <span style={{ fontSize: '1rem' }}>
                {userReaction ? REACTIONS.find(r => r.type === userReaction)?.emoji : '👍'}
              </span>
              {totalReactions > 0 && (
                <span style={{ fontSize: '0.8rem', color: userReaction ? '#3b82f6' : '#9ca3af' }}>
                  {totalReactions}
                </span>
              )}
            </button>

            {/* Reaction picker */}
            {showReactionPicker && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  background: '#1a1a2e',
                  border: '1px solid #333',
                  borderRadius: '2rem',
                  padding: '0.5rem',
                  display: 'flex',
                  gap: '0.25rem',
                  zIndex: 100,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                {REACTIONS.map(reaction => (
                  <button
                    key={reaction.type}
                    onClick={() => handleReaction(reaction.type)}
                    style={{
                      background: userReaction === reaction.type ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      fontSize: '1.25rem',
                      cursor: 'pointer',
                      transition: 'transform 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    title={reaction.label}
                  >
                    {reaction.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reply button */}
          {!isGuest && depth < 2 && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#888',
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
              }}
            >
              Reply
            </button>
          )}

          {/* Show reaction summary */}
          {totalReactions > 0 && (
            <div style={{ display: 'flex', gap: '0.25rem', opacity: 0.7 }}>
              {Object.entries(reactionCounts)
                .filter(([, count]) => count > 0)
                .map(([type, count]) => (
                  <span key={type} title={`${count} ${type}`}>
                    {REACTIONS.find(r => r.type === type)?.emoji}
                    {count > 1 && <span style={{ fontSize: '0.75rem' }}>{count}</span>}
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* Reply form */}
        {showReplyForm && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #333' }}>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${authorName}...`}
              autoFocus
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#050816',
                border: '1px solid #333',
                borderRadius: '0.5rem',
                color: '#f9fafb',
                fontSize: '0.9rem',
                minHeight: '80px',
                resize: 'vertical',
                marginBottom: '0.5rem',
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleSubmitReply}
                disabled={!replyText.trim() || submitting}
                style={{
                  background: replyText.trim() && !submitting ? '#3b82f6' : '#555',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.85rem',
                  cursor: replyText.trim() && !submitting ? 'pointer' : 'not-allowed',
                }}
              >
                {submitting ? 'Posting...' : 'Reply'}
              </button>
              <button
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyText('');
                }}
                style={{
                  background: 'transparent',
                  color: '#888',
                  border: '1px solid #444',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div style={{ marginTop: '0.5rem' }}>
          <button
            onClick={() => setShowReplies(!showReplies)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#3b82f6',
              cursor: 'pointer',
              fontSize: '0.85rem',
              marginBottom: '0.5rem',
              marginLeft: '1.5rem',
            }}
          >
            {showReplies ? '▼' : '▶'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </button>
          
          {showReplies && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {replies.map(reply => (
                <SingleComment
                  key={reply.id}
                  comment={reply}
                  replies={[]} // No nested replies beyond depth 1 for simplicity
                  songId={songId}
                  roomId={roomId}
                  currentUserId={currentUserId}
                  isGuest={isGuest}
                  onCommentAdded={onCommentAdded}
                  formatTimestamp={formatTimestamp}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CommentThread({
  comments,
  songId,
  roomId,
  currentUserId,
  isGuest,
  onCommentAdded,
  formatTimestamp,
}: CommentThreadProps) {
  const [newCommentText, setNewCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Separate parent comments from replies
  const parentComments = comments.filter(c => !c.parentCommentId);
  const repliesMap = new Map<string, Comment[]>();
  
  comments.forEach(comment => {
    if (comment.parentCommentId) {
      const existing = repliesMap.get(comment.parentCommentId) || [];
      existing.push(comment);
      repliesMap.set(comment.parentCommentId, existing);
    }
  });

  const handleSubmitComment = async () => {
    if (!newCommentText.trim() || !currentUserId) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/songs/${songId}/comments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          text: newCommentText,
          isAnonymous: false,
        }),
      });

      const data = await res.json();
      if (!data.error) {
        setNewCommentText('');
        onCommentAdded();
      }
    } catch (e) {
      console.error('Failed to submit comment:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Add comment form */}
      {!isGuest && (
        <div style={{ marginBottom: '1.5rem' }}>
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Write a comment..."
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#0f0f1e',
              border: '1px solid #333',
              borderRadius: '0.5rem',
              color: '#f9fafb',
              fontSize: '0.95rem',
              minHeight: '80px',
              resize: 'vertical',
              marginBottom: '0.5rem',
            }}
          />
          <button
            onClick={handleSubmitComment}
            disabled={!newCommentText.trim() || submitting}
            style={{
              background: newCommentText.trim() && !submitting ? '#3b82f6' : '#555',
              color: 'white',
              border: 'none',
              padding: '0.6rem 1.25rem',
              borderRadius: '0.5rem',
              fontSize: '0.9rem',
              cursor: newCommentText.trim() && !submitting ? 'pointer' : 'not-allowed',
              fontWeight: '500',
            }}
          >
            {submitting ? 'Posting...' : 'Comment'}
          </button>
        </div>
      )}

      {isGuest && (
        <p style={{ opacity: 0.6, fontSize: '0.9rem', marginBottom: '1rem', fontStyle: 'italic' }}>
          Register to leave comments and reactions
        </p>
      )}

      {/* Comments list */}
      {parentComments.length === 0 ? (
        <p style={{ opacity: 0.5, textAlign: 'center', padding: '1rem' }}>
          No comments yet. Be the first to share your thoughts!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {parentComments.map(comment => (
            <SingleComment
              key={comment.id}
              comment={comment}
              replies={repliesMap.get(comment.id) || []}
              songId={songId}
              roomId={roomId}
              currentUserId={currentUserId}
              isGuest={isGuest}
              onCommentAdded={onCommentAdded}
              formatTimestamp={formatTimestamp}
            />
          ))}
        </div>
      )}
    </div>
  );
}

