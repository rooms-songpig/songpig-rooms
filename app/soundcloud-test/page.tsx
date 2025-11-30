export const metadata = {
  title: 'SoundCloud Private Embed Test',
};

export default function SoundCloudTestPage() {
  // This is the EXACT src URL extracted from SoundCloud's embed code.
  // When adding songs, artists should paste the full <iframe> code from SoundCloud,
  // and we extract this src automatically.
  const embedSrc =
    'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%3Atracks%3A2221470425%3Fsecret_token%3Ds-ItCn8A5N42y&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=false&show_reposts=false&show_teaser=false&sharing=false&liking=false&show_playcount=false&show_artwork=false';

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#050816',
        color: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 600,
          background: '#111827',
          padding: 20,
          borderRadius: 8,
          boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
          textAlign: 'center',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>Maximum Stealth Player</h2>
        <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: 16 }}>
          This uses the exact embed src from SoundCloud&apos;s Share → Embed panel.
        </p>

        <div
          style={{
            overflow: 'hidden',
            height: 150,
            borderRadius: 6,
            border: '1px solid #1f2937',
          }}
        >
          <iframe
            width="100%"
            height="166"
            scrolling="no"
            frameBorder="no"
            allow="autoplay; encrypted-media"
            sandbox="allow-scripts allow-same-origin"
            src={embedSrc}
          />
        </div>
      </div>
    </main>
  );
}


