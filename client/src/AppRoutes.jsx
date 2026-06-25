import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import UsersPage from './pages/UsersPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public - no navbar */}
      <Route path="/login" element={<LoginPage />} />

      {/* Pages WITH the navbar */}
      <Route element={<Layout />}>
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

        <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />

        <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />

        <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />

        {/* Admins only */}
        <Route path="/users" element={<ProtectedRoute roles={['admin']}><UsersPage /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}
