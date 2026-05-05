import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext.jsx';

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

export default function ProjectDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [memberEmail, setMemberEmail] = useState('');
  const [inviteBusy, setInviteBusy] = useState(false);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [taskBusy, setTaskBusy] = useState(false);

  const [statusBusyId, setStatusBusyId] = useState(null);
  const [deleteBusyId, setDeleteBusyId] = useState(null);

  const reloadAll = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const projectRes = await api.get(`/projects/${id}`);
      setProject(projectRes.data.project);
      setMembers(projectRes.data.members || []);

      const tasksRes = await api.get(`/tasks/project/${id}`);
      setTasks(tasksRes.data.tasks || []);
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not load project.';
      setError(msg);
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  async function handleAddMember(e) {
    e.preventDefault();
    setInviteBusy(true);
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail.trim() });
      setMemberEmail('');
      await reloadAll();
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to add member.';
      setError(msg);
    } finally {
      setInviteBusy(false);
    }
  }

  async function handleCreateTask(e) {
    e.preventDefault();
    setTaskBusy(true);
    try {
      await api.post('/tasks', {
        project_id: Number(id),
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        assigned_to: Number(assignedTo),
        due_date: dueDate || null,
      });
      setTaskTitle('');
      setTaskDescription('');
      setDueDate('');
      await reloadAll();
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not create task.';
      setError(msg);
    } finally {
      setTaskBusy(false);
    }
  }

  async function handleStatusChange(taskId, status) {
    setStatusBusyId(taskId);
    setError('');
    try {
      await api.put(`/tasks/${taskId}/status`, { status });
      await reloadAll();
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not update status.';
      setError(msg);
    } finally {
      setStatusBusyId(null);
    }
  }

  async function handleDeleteTask(taskId) {
    if (!window.confirm('Delete this task?')) return;
    setDeleteBusyId(taskId);
    setError('');
    try {
      await api.delete(`/tasks/${taskId}`);
      await reloadAll();
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not delete task.';
      setError(msg);
    } finally {
      setDeleteBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Loading project…</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="page">
        {error ? <div className="banner error">{error}</div> : null}
        <Link to="/projects" className="link">
          ← Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="breadcrumbs muted small">
        <Link to="/projects" className="link">
          Projects
        </Link>{' '}
        / <span>{project.name}</span>
      </div>

      <div className="page-header split">
        <div>
          <h1>{project.name}</h1>
          <p className="muted">{project.description || 'No description yet.'}</p>
        </div>
      </div>

      {error ? <div className="banner error">{error}</div> : null}

      {user?.role === 'admin' ? (
        <div className="two-col grid-gap">
          <div className="card">
            <h2 className="section-title">Add member</h2>
            <p className="muted small">
              Invite an existing account by email. They must already be registered.
            </p>
            <form className="form form-row tight" onSubmit={handleAddMember}>
              <div className="form-group grow">
                <label htmlFor="member-email">Member email</label>
                <input
                  id="member-email"
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  required
                />
              </div>
              <button type="submit" className="btn btn-secondary" disabled={inviteBusy}>
                {inviteBusy ? 'Adding…' : 'Add'}
              </button>
            </form>
          </div>

          <div className="card">
            <h2 className="section-title">Create task</h2>
            <form className="form" onSubmit={handleCreateTask}>
              <div className="form-group">
                <label htmlFor="task-title">Title</label>
                <input
                  id="task-title"
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="task-desc">Description</label>
                <textarea
                  id="task-desc"
                  rows={2}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Details (optional)"
                />
              </div>
              <div className="form-row responsive">
                <div className="form-group">
                  <label htmlFor="assignee">Assign to</label>
                  <select
                    id="assignee"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    required
                  >
                    <option value="">Choose member…</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="due-date">Due date</label>
                  <input id="due-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={taskBusy || members.length === 0}>
                {taskBusy ? 'Creating…' : 'Create task'}
              </button>
              {members.length === 0 ? (
                <p className="muted small">Add at least one member before assigning tasks.</p>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}

      <div className="card margin-top">
        <h2 className="section-title">Team members ({members.length})</h2>
        {members.length === 0 ? (
          <p className="muted">No members yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Project role</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{m.email}</td>
                    <td>
                      <span className="badge subtle">{m.project_role}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card margin-top">
        <h2 className="section-title">
          Tasks {user?.role !== 'admin' ? 'assigned to you' : ''}
        </h2>
        {tasks.length === 0 ? (
          <p className="muted">No tasks to show.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  {user?.role === 'admin' ? <th>Assigned to</th> : null}
                  <th>Status</th>
                  <th>Due</th>
                  {user?.role === 'admin' ? <th></th> : null}
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => {
                  const canEditStatus =
                    user?.role === 'admin' || (user && t.assigned_to === user.id);

                  return (
                    <tr key={t.id}>
                      <td>
                        <div className="cell-title">{t.title}</div>
                        {t.description ? <div className="muted small">{t.description}</div> : null}
                      </td>
                      {user?.role === 'admin' ? (
                        <td>{t.assignee_name || t.assignee_email || `#${t.assigned_to}`}</td>
                      ) : null}
                      <td>
                        {canEditStatus ? (
                          <select
                            className="select-inline"
                            value={t.status}
                            disabled={statusBusyId === t.id}
                            onChange={(e) => handleStatusChange(t.id, e.target.value)}
                          >
                            {STATUS_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="badge subtle">{t.status}</span>
                        )}
                      </td>
                      <td>{t.due_date || '—'}</td>
                      {user?.role === 'admin' ? (
                        <td>
                          <button
                            type="button"
                            className="btn btn-danger btn-small"
                            disabled={deleteBusyId === t.id}
                            onClick={() => handleDeleteTask(t.id)}
                          >
                            {deleteBusyId === t.id ? '…' : 'Delete'}
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
