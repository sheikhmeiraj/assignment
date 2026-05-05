import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-brand">Team Tasks</div>
      <nav className="navbar-links">
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
          Dashboard
        </NavLink>
        <NavLink to="/projects" className={({ isActive }) => (isActive ? 'active' : '')}>
          Projects
        </NavLink>
      </nav>
      <div className="navbar-user">
        <span className="muted">
          {user?.name} · <strong>{user?.role}</strong>
        </span>
        <button type="button" className="btn btn-outline" onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
}
