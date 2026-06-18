import { Routes, Route } from 'react-router-dom';

// A simple stand-in so we can confirm routing works.
// Each of these gets replaced by a real page later.
function Placeholder({ name }) {
  return <h2 style={{ padding: '2rem' }}>{name} page (coming soon)</h2>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Placeholder name="Login" />} />
      <Route path="/" element={<Placeholder name="Dashboard" />} />
      <Route path="/users" element={<Placeholder name="Users" />} />
      <Route path="/projects" element={<Placeholder name="Projects" />} />
      <Route path="/projects/:id" element={<Placeholder name="Project detail" />} />
      <Route path="/change-password" element={<Placeholder name="Change password" />} />
    </Routes>
  );
}