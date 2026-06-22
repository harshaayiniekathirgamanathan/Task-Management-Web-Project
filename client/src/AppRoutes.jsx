import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

function Placeholder({ name }) {
  return <h2 style={{ padding: '2rem' }}>{name} page (coming soon)</h2>;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Placeholder name="Login" />} />

      {/* Any logged-in user */}
      <Route path="/" element={<ProtectedRoute><Placeholder name="Dashboard" /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><Placeholder name="Projects" /></ProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute><Placeholder name="Project detail" /></ProtectedRoute>} />
      <Route path="/change-password" element={<ProtectedRoute><Placeholder name="Change password" /></ProtectedRoute>} />

      {/* Admins only */}
      <Route path="/users" element={<ProtectedRoute roles={['admin']}><Placeholder name="Users" /></ProtectedRoute>} />
    </Routes>
  );
}