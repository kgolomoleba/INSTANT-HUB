import { useEffect, useState, useRef } from 'react';
import type { User } from '@supabase/auth-js';
import { supabase } from '../supabaseClient';
import './Dashboard.css';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  const fetchUser = async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;

      if (!user) {
        // If not logged in, redirect to login
        window.location.href = '/login';
        return;
      }

      setUser(user);

      // Fetch username from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setUsername(profile?.username ?? null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user.');
    } finally {
      setLoading(false);
      setTimeout(() => {
        mainRef.current?.focus();
      }, 100);
    }
  };

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line
  }, []);

  if (loading)
    return (
      <main className="dashboard-container" role="main" tabIndex={-1} ref={mainRef}>
        <p className="loading-text">Loading your dashboard…</p>
      </main>
    );

  if (error)
    return (
      <main className="dashboard-container" role="main" tabIndex={-1} ref={mainRef}>
        <p className="error-text">Error: {error}</p>
        <button className="btn-secondary" onClick={fetchUser} aria-label="Retry loading dashboard">
          Retry
        </button>
      </main>
    );

  return (
    <main className="dashboard-container" role="main" tabIndex={-1} ref={mainRef}>
      <header className="dashboard-header">
        <h1>
          Welcome back,{' '}
          <span className="accent-text">
            {username ? username : user?.email ?? 'Guest'}
          </span>
          !
        </h1>
        <p>What would you like to do today?</p>
      </header>

      <section className="dashboard-widgets">
        <h2>Quick Links</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <button
            className="btn-primary"
            onClick={() => window.location.href = '/products'}
            aria-label="Browse Products"
          >
            Browse Products
          </button>
          <button
            className="btn-primary"
            onClick={() => window.location.href = '/services'}
            aria-label="Find Services"
          >
            Find Services
          </button>
          <button
            className="btn-primary"
            onClick={() => window.location.href = '/feed'}
            aria-label="Community Feed"
          >
            Community Feed
          </button>
        </div>
        <p>More features coming soon…</p>
      </section>
    </main>
  );
}