export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#050816",
        color: "#f9fafb",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 480, padding: "1.5rem" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>
          Songpig Listening Rooms
        </h1>
        <p style={{ opacity: 0.8, marginBottom: "1.5rem" }}>
          Private rooms to A/B your songs with friends.
          Invite-only. Votes and comments stay private.
        </p>
        <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>
          Next step: we’ll add real rooms, invites, and voting.
        </p>
      </div>
    </main>
  );
}
