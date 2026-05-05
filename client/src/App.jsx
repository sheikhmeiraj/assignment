import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Projects from './pages/Projects.jsx';
import ProjectDetails from './pages/ProjectDetails.jsx';

export default function App() {
  const { user, loading } = useAuth();

  function AuthLanding({ children }) {
    if (loading) {
      return (
        <div className="page-center">
          <p className="muted">Starting app…</p>
        </div>
      );
    }
    return children;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <AuthLanding>{user ? <Navigate to="/dashboard" replace /> : <Login />}</AuthLanding>
        }
      />
      <Route
        path="/signup"
        element={
          <AuthLanding>{user ? <Navigate to="/dashboard" replace /> : <Signup />}</AuthLanding>
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
      </Route>

      <Route
        path="/"
        element={
          loading ? (
            <div className="page-center">
              <p className="muted">Starting app…</p>
            </div>
          ) : user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
