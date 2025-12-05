import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { userStore, type User } from '@/app/lib/users';

type ArtistPageParams = {
  handle: string;
};

type ArtistPageProps = {
  params: ArtistPageParams;
};

async function getArtistFromParams(params: ArtistPageParams): Promise<User | null> {
  const rawHandle = params.handle || '';
  const trimmed = rawHandle.trim();
  if (!trimmed) return null;

  // Support both /artist/BestKidRocker and /artist/@BestKidRocker
  const cleaned = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
  const artist = await userStore.getUserByUsername(cleaned);

  if (!artist || artist.status !== 'active') {
    return null;
  }

  return artist;
}

function stringToHslColor(str: string, s: number, l: number): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    // Simple hash based on character codes
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export async function generateMetadata({ params }: ArtistPageProps): Promise<Metadata> {
  const artist = await getArtistFromParams(params);

  if (!artist) {
    return {
      title: 'Artist not found · SongPig',
      description: 'This artist profile could not be found on SongPig.',
    };
  }

  const handle = artist.username;
  const displayName = artist.displayName || handle;
  const title = `${displayName} (@${handle}) · SongPig`;

  const baseDescription =
    artist.bio && artist.bio.trim().length > 0
      ? artist.bio.trim()
      : `Explore private A/B song feedback and listening rooms for ${displayName} on SongPig.`;

  const description =
    baseDescription.length > 200 ? `${baseDescription.slice(0, 197)}...` : baseDescription;

  const ogImage = artist.avatarUrl || undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `/artist/${handle}`,
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function ArtistProfilePage({ params }: ArtistPageProps) {
  const artist = await getArtistFromParams(params);

  if (!artist) {
    notFound();
  }

  const handle = artist.username;
  const displayName = artist.displayName || handle;
  const roleLabel =
    artist.role === 'artist'
      ? 'Artist'
      : artist.role === 'admin'
      ? 'Artist / Admin'
      : 'Reviewer';

  const bannerBase = stringToHslColor(handle, 70, 45);
  const bannerAccent = stringToHslColor(`${handle}-accent`, 70, 30);

  const avatarInitial = (displayName || handle).charAt(0).toUpperCase();

  const socialLinks = artist.socialLinks || {};
  const sameAs = Object.values(socialLinks).filter((url) => !!url && typeof url === 'string');

  const profilePath = `/artist/${handle}`;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': artist.role === 'artist' || artist.role === 'admin' ? 'MusicGroup' : 'Person',
    name: displayName,
    alternateName: `@${handle}`,
    url: profilePath,
    description: artist.bio || undefined,
    image: artist.avatarUrl || undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  };

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: '#050816',
        color: '#f9fafb',
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: '2rem 1.5rem 3rem',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: '960px' }}>
        <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
          <Link href="/" style={{ color: '#9ca3af', textDecoration: 'none' }}>
            ← Back to dashboard
          </Link>
        </div>

        <article
          style={{
            borderRadius: '1.25rem',
            overflow: 'hidden',
            border: '1px solid rgba(148,163,184,0.35)',
            background: 'radial-gradient(circle at top, #020617 0, #020617 55%, #000 100%)',
          }}
        >
          {/* Banner */}
          <div
            style={{
              height: '180px',
              background: `linear-gradient(135deg, ${bannerBase}, ${bannerAccent})`,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at 10% 0%, rgba(15,23,42,0.3) 0, transparent 50%), radial-gradient(circle at 90% 0%, rgba(15,23,42,0.35) 0, transparent 55%)',
              }}
            />
          </div>

          {/* Header content */}
          <div
            style={{
              padding: '1.5rem 1.5rem 1.75rem',
              marginTop: '-64px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1.25rem',
                alignItems: 'flex-end',
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '999px',
                  border: '3px solid #020617',
                  boxShadow: '0 18px 35px rgba(0,0,0,0.6)',
                  overflow: 'hidden',
                  background: '#020617',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginLeft: '0.25rem',
                }}
              >
                {artist.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={artist.avatarUrl}
                    alt={`${displayName} avatar`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2.5rem',
                      fontWeight: 700,
                      background: bannerBase,
                      color: '#f9fafb',
                    }}
                  >
                    {avatarInitial}
                  </div>
                )}
              </div>

              {/* Name + handle + role */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: '1.75rem',
                    lineHeight: 1.2,
                    letterSpacing: '0.02em',
                  }}
                >
                  {displayName}
                </h1>
                <p
                  style={{
                    margin: '0.25rem 0 0.35rem',
                    fontSize: '0.95rem',
                    opacity: 0.85,
                  }}
                >
                  <span style={{ fontWeight: 500 }}>@{handle}</span> ·{' '}
                  <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.8rem' }}>
                    {roleLabel}
                  </span>
                </p>
              </div>
            </div>

            {/* Bio */}
            {artist.bio && artist.bio.trim() && (
              <section aria-label="Artist bio">
                <h2
                  style={{
                    margin: '0 0 0.35rem',
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.09em',
                    opacity: 0.7,
                  }}
                >
                  About
                </h2>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    opacity: 0.9,
                  }}
                >
                  {artist.bio}
                </p>
              </section>
            )}

            {/* Social / support links placeholder (future) */}
            {sameAs.length > 0 && (
              <section aria-label="Artist links">
                <h2
                  style={{
                    margin: '0 0 0.35rem',
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.09em',
                    opacity: 0.7,
                  }}
                >
                  Links
                </h2>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  {sameAs.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '999px',
                        border: '1px solid rgba(148,163,184,0.6)',
                        fontSize: '0.8rem',
                        color: '#e5e7eb',
                        textDecoration: 'none',
                        background: 'rgba(15,23,42,0.7)',
                      }}
                    >
                      {url.replace(/^https?:\/\//, '')}
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Placeholder section for future room/track list */}
            <section aria-label="Rooms and songs" style={{ marginTop: '0.75rem' }}>
              <h2
                style={{
                  margin: '0 0 0.35rem',
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.09em',
                  opacity: 0.7,
                }}
              >
                A/B rooms
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.9rem',
                  opacity: 0.8,
                }}
              >
                Public room summaries will appear here in a future release. For now, invited listeners
                can access this artist&apos;s rooms directly via invite links.
              </p>
            </section>
          </div>
        </article>

        {/* JSON-LD for SEO */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      </div>
    </main>
  );
}


