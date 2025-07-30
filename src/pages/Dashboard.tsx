import './Dashboard.css';

export default function Dashboard() {
  return (
    <main className="dashboard-page" role="main" tabIndex={-1}>
      <h1>Dashboard</h1>
      <p>Welcome to your dashboard (protected area).</p>

      <section className="dashboard-info" aria-labelledby="overview-title">
        <h2 id="overview-title">Your Overview</h2>
        <p>This area will show personalized information once you log in.</p>
      </section>

      <section className="dashboard-actions" aria-label="Dashboard actions">
        <button type="button" className="btn-primary" aria-label="View Profile">
          View Profile
        </button>
        <button type="button" className="btn-secondary" aria-label="Settings">
          Settings
        </button>
      </section>
    </main>
  );
}
