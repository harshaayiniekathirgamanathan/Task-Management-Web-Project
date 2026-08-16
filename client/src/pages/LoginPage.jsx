import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await axiosClient.post('/api/auth/login', { email, password });
      const { user, accessToken } = res.data;
      login(user, accessToken);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to sign in. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100 py-5">
      <Row className="w-100 justify-content-center">
        <Col md={8} lg={6} xl={4}>
          <div className="text-center mb-4">
            <div 
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 shadow-lg"
              style={{
                width: '64px',
                height: '64px',
                background: 'var(--gradient-primary)',
                color: '#fff',
                fontSize: '1.75rem',
                fontWeight: 'bold'
              }}
            >
              ✓
            </div>
            <h1 className="h2 fw-bold text-white mb-1">Task Management System</h1>
            <p className="text-muted small">Sign in to access your project management workspace</p>
          </div>

          <Card className="glass-card p-4 border-0">
            <Card.Body>
              {error && (
                <Alert 
                  variant="danger" 
                  onClose={() => setError('')} 
                  dismissible 
                  className="bg-danger bg-opacity-20 text-danger border-danger border-opacity-30 rounded-3 mb-4 small"
                >
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="loginEmail">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4" controlId="loginPassword">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-100 py-2.5 fw-semibold gradient-btn rounded-3"
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In to Account'
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
