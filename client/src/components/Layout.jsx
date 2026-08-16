import { Navbar, Nav, Container, Button, Dropdown } from 'react-bootstrap';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar expand="lg" className="glass-nav sticky-top py-3 mb-4">
        <Container>
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2">
            <div 
              className="d-flex align-items-center justify-content-center rounded-3 fw-bold"
              style={{
                width: '36px',
                height: '36px',
                background: 'var(--gradient-primary)',
                color: '#fff',
                fontSize: '1.2rem'
              }}
            >
              ✓
            </div>
            <span className="fw-bold fs-4 text-white font-heading">Task Management System</span>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="main-nav" className="border-secondary" />

          <Navbar.Collapse id="main-nav">
            <Nav className="me-auto ms-lg-4 gap-1">
              <Nav.Link 
                as={Link} 
                to="/" 
                className={`px-3 py-2 rounded-3 text-white fw-medium ${location.pathname === '/' ? 'bg-indigo bg-opacity-20 text-indigo border border-indigo border-opacity-30' : 'text-secondary opacity-80'}`}
              >
                Dashboard
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/projects" 
                className={`px-3 py-2 rounded-3 text-white fw-medium ${location.pathname.startsWith('/projects') ? 'bg-indigo bg-opacity-20 text-indigo border border-indigo border-opacity-30' : 'text-secondary opacity-80'}`}
              >
                Projects
              </Nav.Link>
              {user?.role === 'admin' && (
                <Nav.Link 
                  as={Link} 
                  to="/users" 
                  className={`px-3 py-2 rounded-3 text-white fw-medium ${location.pathname === '/users' ? 'bg-indigo bg-opacity-20 text-indigo border border-indigo border-opacity-30' : 'text-secondary opacity-80'}`}
                >
                  Users
                </Nav.Link>
              )}
            </Nav>

            {user && (
              <div className="d-flex align-items-center gap-3 mt-3 mt-lg-0">
                <Dropdown align="end">
                  <Dropdown.Toggle 
                    variant="link" 
                    id="user-dropdown" 
                    className="p-0 border-0 text-decoration-none d-flex align-items-center gap-2"
                  >
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow-sm"
                      style={{
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        fontSize: '1rem'
                      }}
                    >
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="text-start d-none d-sm-block">
                      <div className="fw-semibold text-white small lh-1 mb-1">{user.name || 'User'}</div>
                      <span className="badge badge-indigo text-capitalize px-2 py-0.5" style={{ fontSize: '0.7rem' }}>
                        {user.role || 'collaborator'}
                      </span>
                    </div>
                  </Dropdown.Toggle>

                  <Dropdown.Menu className="dropdown-menu-dark glass-card shadow-lg p-2 border-0 mt-2">
                    <Dropdown.Header className="text-muted small">Signed in as {user.email}</Dropdown.Header>
                    <Dropdown.Divider className="border-secondary opacity-20" />
                    <Dropdown.Item as={Link} to="/change-password" className="rounded-2 py-2 small">
                      🔑 Change Password
                    </Dropdown.Item>
                    <Dropdown.Divider className="border-secondary opacity-20" />
                    <Dropdown.Item onClick={handleLogout} className="rounded-2 py-2 small text-danger">
                      🚪 Logout
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            )}
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="flex-grow-1 pb-5">
        <Outlet />
      </Container>

      <footer className="py-4 border-top border-secondary border-opacity-10 mt-auto text-center text-muted small">
        <Container>
          Task Management System &copy; 2026 • Designed for peak team performance
        </Container>
      </footer>
    </div>
  );
}