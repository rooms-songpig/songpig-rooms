'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/app/lib/auth-helpers';
import PageLabel from '@/app/components/PageLabel';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    const user = getCurrentUser();
    if (user) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#050816',
        color: '#f9fafb',
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <PageLabel pageName="Home" />
      
      {/* Hero Section */}
      <section
        style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f23 100%)',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1
            style={{
              fontSize: '3rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #4a9eff 0%, #60a5fa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Song Pig A/B Testing
          </h1>
          <p
            style={{
              fontSize: '1.25rem',
              opacity: 0.9,
              marginBottom: '2rem',
              lineHeight: '1.6',
            }}
          >
            Private rooms to A/B test your songs with friends. Invite-only. Votes and comments stay private.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/register"
              style={{
                background: '#3b82f6',
                color: 'white',
                padding: '0.75rem 2rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '1rem',
                transition: 'background 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#2563eb';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#3b82f6';
              }}
            >
              Get Started
            </Link>
            <Link
              href="/login"
              style={{
                background: 'transparent',
                color: '#3b82f6',
                padding: '0.75rem 2rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '1rem',
                border: '2px solid #3b82f6',
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '4rem 2rem', background: '#0f0f23' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: '2rem',
              textAlign: 'center',
              marginBottom: '3rem',
              color: '#4a9eff',
            }}
          >
            How It Works
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '2rem',
            }}
          >
            <div
              style={{
                background: '#1a1a2e',
                padding: '2rem',
                borderRadius: '0.75rem',
                border: '1px solid #333',
              }}
            >
              <div
                style={{
                  fontSize: '2.5rem',
                  marginBottom: '1rem',
                }}
              >
                1️⃣
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                Create a Room
              </h3>
              <p style={{ opacity: 0.8, lineHeight: '1.6' }}>
                Artists create private listening rooms and invite friends to join.
              </p>
            </div>
            <div
              style={{
                background: '#1a1a2e',
                padding: '2rem',
                borderRadius: '0.75rem',
                border: '1px solid #333',
              }}
            >
              <div
                style={{
                  fontSize: '2.5rem',
                  marginBottom: '1rem',
                }}
              >
                2️⃣
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                Add Songs
              </h3>
              <p style={{ opacity: 0.8, lineHeight: '1.6' }}>
                Upload your songs or add SoundCloud links. Compare different versions side-by-side.
              </p>
            </div>
            <div
              style={{
                background: '#1a1a2e',
                padding: '2rem',
                borderRadius: '0.75rem',
                border: '1px solid #333',
              }}
            >
              <div
                style={{
                  fontSize: '2.5rem',
                  marginBottom: '1rem',
                }}
              >
                3️⃣
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                Get Feedback
              </h3>
              <p style={{ opacity: 0.8, lineHeight: '1.6' }}>
                Listeners vote on their favorites and leave comments. All feedback stays private.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Artists Section */}
      <section style={{ padding: '4rem 2rem', background: '#050816' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: '2rem',
              textAlign: 'center',
              marginBottom: '3rem',
              color: '#4a9eff',
            }}
          >
            For Artists
          </h2>
          <div
            style={{
              background: '#1a1a2e',
              padding: '3rem',
              borderRadius: '0.75rem',
              border: '1px solid #333',
            }}
          >
            <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#60a5fa' }}>
                  Private Testing
                </h3>
                <p style={{ opacity: 0.9, lineHeight: '1.6', marginBottom: '1rem' }}>
                  Test your music with trusted listeners before public release. All feedback is private and only visible to you.
                </p>
              </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#60a5fa' }}>
                  A/B Comparisons
                </h3>
                <p style={{ opacity: 0.9, lineHeight: '1.6', marginBottom: '1rem' }}>
                  Compare different versions of your songs side-by-side. See which version resonates more with your audience.
                </p>
              </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#60a5fa' }}>
                  Detailed Analytics
                </h3>
                <p style={{ opacity: 0.9, lineHeight: '1.6', marginBottom: '1rem' }}>
                  Track win rates, view comments, and understand what your listeners think about each version.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          padding: '4rem 2rem',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f23 100%)',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            Ready to test your music?
          </h2>
          <p style={{ fontSize: '1.125rem', opacity: 0.9, marginBottom: '2rem' }}>
            Join Song Pig and start getting private feedback on your songs today.
          </p>
          <Link
            href="/register"
            style={{
              background: '#3b82f6',
              color: 'white',
              padding: '0.75rem 2rem',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '1rem',
              display: 'inline-block',
            }}
          >
            Create Your Account
          </Link>
        </div>
      </section>
    </main>
  );
}

