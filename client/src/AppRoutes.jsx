import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage'; // <-- new import

function Placeholder({ name }) {
  return <h2 style={{ padding: '2rem' }}>{name} page (coming soon)</h2>;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public - no navbar */}
      <Route path="/login" element={<LoginPage />} />

      {/* Pages WITH the navbar */}
      <Route element={<Layout />}>
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><Placeholder name="Projects" /></ProtectedRoute>} />
        <Route path="/projects/:id" element={<ProtectedRoute><Placeholder name="Project detail" /></ProtectedRoute>} />

        {/* Swap Placeholder for the real page */}
        <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />

        {/* Admins only */}
        <Route path="/users" element={<ProtectedRoute roles={['admin']}><Placeholder name="Users" /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}
