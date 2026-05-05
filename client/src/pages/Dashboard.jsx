import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError('');
      setLoading(true);
      try {
        const res = await api.get('/dashboard');
        if (!cancelled) setStats(res.data);
      } catch (err) {
        if (!cancelled) {
          const msg = err.response?.data?.message || 'Failed to load dashboard.';
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="muted">
          Signed in as {user?.email}
          {user?.role === 'admin' ? ' · viewing totals for all tasks' : ' · viewing only tasks assigned to you'}
        </p>
      </div>

      {error ? <div className="banner error">{error}</div> : null}

      {loading ? <p className="muted">Loading stats…</p> : null}

      {!loading && stats ? (
        <div className="stat-grid">
          <div className="card stat-card">
            <span className="stat-label">Total tasks</span>
            <span className="stat-value">{stats.total_tasks}</span>
          </div>
          <div className="card stat-card">
            <span className="stat-label">To do</span>
            <span className="stat-value">{stats.todo_tasks}</span>
          </div>
          <div className="card stat-card">
            <span className="stat-label">In progress</span>
            <span className="stat-value">{stats.in_progress_tasks}</span>
          </div>
          <div className="card stat-card">
            <span className="stat-label">Done</span>
            <span className="stat-value">{stats.done_tasks}</span>
          </div>
          <div className="card stat-card highlight">
            <span className="stat-label">Overdue</span>
            <span className="stat-value">{stats.overdue_tasks}</span>
          </div>
        </div>
      ) : null}

      {!loading ? (
        <div className="card margin-top card-inline">
          <p className="no-margin muted">Browse your projects or create a new one (admins).</p>
          <Link className="btn btn-primary" to="/projects">
            Go to projects
          </Link>
        </div>
      ) : null}
    </div>
  );
}
