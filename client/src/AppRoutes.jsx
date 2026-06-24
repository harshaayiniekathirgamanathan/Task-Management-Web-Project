import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import UsersPage from './pages/UsersPage';
import ProjectsPage from './pages/ProjectsPage'; // <-- new import

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

        {/* Swap Placeholder for the real ProjectsPage */}
        <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />

        {/* Project detail still a placeholder — built in the next step */}
        <Route path="/projects/:id" element={<ProtectedRoute><Placeholder name="Project detail" /></ProtectedRoute>} />

        <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />

        {/* Admins only */}
        <Route path="/users" element={<ProtectedRoute roles={['admin']}><UsersPage /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}
