import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Wrap any page that should be private.
// - No logged-in user  → send to /login
// - Wrong role         → send to / (dashboard)
export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}