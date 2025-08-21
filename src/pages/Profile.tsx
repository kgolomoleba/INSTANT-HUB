import { useEffect, useState } from 'react';
import type { User } from '@supabase/auth-js';
import { supabase } from '../supabaseClient';
import './Profile.css';

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) throw error;
        if (!user) throw new Error('No user logged in');

        setUser(user);

        // Fetch username from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') throw profileError;

        setUsername(profileData?.username ?? '');
      } catch (err: any) {
        setError(err.message || 'Failed to fetch user info');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    if (!username.trim()) {
      setError('Username cannot be empty');
      setLoading(false);
      return;
    }

    try {
      if (!user) throw new Error('No user');

      const updates = {
        id: user.id,
        username: username.trim(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) throw error;

      setMessage('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user)
    return (
      <main className="profile-page" role="main" tabIndex={-1}>
        <p>Loading profile…</p>
      </main>
    );

  if (error && !user)
    return (
      <main className="profile-page" role="main" tabIndex={-1}>
        <p className="error">Error: {error}</p>
      </main>
    );

  return (
    <main className="profile-page" role="main" tabIndex={-1}>
      <h1>Your Profile</h1>

      <section className="profile-info">
        <label htmlFor="email">Email (read-only)</label>
        <input type="email" id="email" value={user?.email || ''} disabled />

        <label htmlFor="username">Username</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={30}
          placeholder="Enter your username"
          autoComplete="username"
          spellCheck={false}
          aria-describedby="username-desc"
        />
        <small id="username-desc" className="description">
          Your public username (max 30 characters)
        </small>

        <div className="actions">
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </section>
    </main>
  );
}
