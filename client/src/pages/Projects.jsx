import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext.jsx';

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  async function loadProjects() {
    setError('');
    setLoading(true);
    try {
      const res = await api.get('/projects');
      setProjects(res.data.projects || []);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load projects.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await api.post('/projects', { name: name.trim(), description: description.trim() });
      setName('');
      setDescription('');
      await loadProjects();
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not create project.';
      setError(msg);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Projects</h1>
        <p className="muted">Open a project to see members and tasks.</p>
      </div>

      {error ? <div className="banner error">{error}</div> : null}

      {user?.role === 'admin' ? (
        <div className="card margin-bottom">
          <h2 className="section-title">Create project</h2>
          <form className="form form-row" onSubmit={handleCreate}>
            <div className="form-group grow">
              <label htmlFor="project-name">Name</label>
              <input
                id="project-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mobile app launch"
                required
              />
            </div>
            <div className="form-group grow">
              <label htmlFor="project-desc">Description</label>
              <input
                id="project-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short summary (optional)"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? 'Saving…' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {loading ? <p className="muted">Loading projects…</p> : null}

      {!loading && projects.length === 0 ? (
        <p className="muted">No projects yet. Ask an admin to create one and add you.</p>
      ) : null}

      <div className="card-grid">
        {!loading
          ? projects.map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="card project-card">
                <h3>{p.name}</h3>
                <p className="muted small clamp">{p.description || 'No description'}</p>
                <span className="badge">View details →</span>
              </Link>
            ))
          : null}
      </div>
    </div>
  );
}
