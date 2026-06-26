import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/">Task Manager</Navbar.Brand>
          <Navbar.Toggle aria-controls="main-nav" />
          <Navbar.Collapse id="main-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/">Dashboard</Nav.Link>
              <Nav.Link as={Link} to="/projects">Projects</Nav.Link>
              {/* Tasks tab for project managers and collaborators (admins aren't assigned tasks) */}
              {user?.role !== 'admin' && (
                <Nav.Link as={Link} to="/tasks">Tasks</Nav.Link>
              )}
              {/* Users link only shows for admins */}
              {user?.role === 'admin' && (
                <Nav.Link as={Link} to="/users">Users</Nav.Link>
              )}
            </Nav>
            {user && (
              <Nav className="align-items-lg-center gap-2">
                <NotificationBell />

                <Button variant="outline-light" onClick={handleLogout}>
                  Logout
                </Button>
              </Nav>
            )}
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Each page shows here, below the navbar */}
      <main>
        <Container className="mt-4 tm-page-enter">
          <Outlet />
        </Container>
      </main>
    </>
  );
}