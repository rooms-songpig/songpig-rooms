'use client';

import Link from 'next/link';
import UserProfile from '@/app/components/UserProfile';
import ScrollToTop from '@/app/components/ScrollToTop';
import PageLabel from '@/app/components/PageLabel';

export default function AboutPage() {
  const version = '0.1.0-alpha';
  const buildDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long',
    day: 'numeric'
  });

  return (
    <main style={{ 
      minHeight: '100dvh', 
      background: '#0f0f23', 
      color: '#fff', 
      display: 'flex',
      flexDirection: 'column',
    }}>
      <PageLabel pageName="About" />
      <UserProfile />
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '2rem',
        flex: 1,
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>About Song Pig Listening Rooms</h1>
        
        <div style={{ 
          background: '#1a1a2e', 
          padding: '2rem', 
          borderRadius: '0.75rem',
          marginBottom: '2rem',
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#4a9eff' }}>
            Version Information
          </h2>
          <div style={{ marginBottom: '1.5rem' }}>
            <p><strong>Version:</strong> {version}</p>
            <p><strong>Build Date:</strong> {buildDate}</p>
            <p><strong>Status:</strong> Alpha Testing</p>
          </div>
        </div>

        <div style={{ 
          background: '#1a1a2e', 
          padding: '2rem', 
          borderRadius: '0.75rem',
          marginBottom: '2rem',
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#4a9eff' }}>
            Features
          </h2>
          <ul style={{ lineHeight: '1.8', paddingLeft: '1.5rem' }}>
            <li>Room creation and management for artists</li>
            <li>Song comparison and A/B testing</li>
            <li>Voting system to determine preferred versions</li>
            <li>Comment system for detailed feedback</li>
            <li>User roles: Admin, Artist, Reviewer</li>
            <li>Guest access for viewing rooms</li>
            <li>Invite code system for room sharing</li>
            <li>Win rate tracking and statistics</li>
            <li>Profile management with bio</li>
            <li>Admin dashboard for user and room management</li>
          </ul>
        </div>

        <div style={{ 
          background: '#1a1a2e', 
          padding: '2rem', 
          borderRadius: '0.75rem',
          marginBottom: '2rem',
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#4a9eff' }}>
            How It Works
          </h2>
          <p style={{ lineHeight: '1.8', marginBottom: '1rem' }}>
            Song Pig Listening Rooms helps artists get feedback on different versions of their songs. 
            Artists create rooms, add song versions, and listeners compare them side-by-side to vote 
            on which version they prefer.
          </p>
          <p style={{ lineHeight: '1.8' }}>
            The system tracks win rates and provides detailed feedback through comments, helping artists 
            make informed decisions about which version to finalize for production.
          </p>
        </div>

        <div style={{ 
          background: '#1a1a2e', 
          padding: '2rem', 
          borderRadius: '0.75rem',
          marginBottom: '2rem',
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#4a9eff' }}>
            Getting Started
          </h2>
          <p style={{ lineHeight: '1.8', marginBottom: '1rem' }}>
            <strong>For Artists:</strong> Register as an artist, create a room, add your song versions, 
            and share the invite code with reviewers and fans.
          </p>
          <p style={{ lineHeight: '1.8', marginBottom: '1rem' }}>
            <strong>For Reviewers:</strong> Register as a reviewer or continue as a guest to view rooms 
            and provide feedback through voting and comments.
          </p>
          <p style={{ lineHeight: '1.8' }}>
            <Link href="/" style={{ color: '#4a9eff', textDecoration: 'none' }}>
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>
      <ScrollToTop />
    </main>
  );
}

