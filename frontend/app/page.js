export default function Home() {
  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>StartupIndia Tracker</h1>
        <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>Your premium dashboard to track progress, funding, and milestones.</p>
        <a href="/login" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', padding: '1rem 2rem' }}>Get Started</a>
      </div>
    </div>
  );
}
