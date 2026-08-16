import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import axiosClient from '../api/axiosClient';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setStatus('error');
      setMessage('Please fill in all three password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus('error');
      setMessage('New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setStatus('error');
      setMessage('New password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      setStatus(null);
      await axiosClient.post('/api/auth/change-password', {
        oldPassword: currentPassword,
        newPassword: newPassword,
      });

      setStatus('success');
      setMessage('Your password has been changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Failed to update password. Please check current password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container className="d-flex align-items-center justify-content-center py-4">
      <Row className="w-100 justify-content-center">
        <Col md={8} lg={6} xl={5}>
          <Card className="glass-card p-4 border-0">
            <Card.Body>
              <h2 className="text-center mb-2 fw-bold text-white">Security Settings</h2>
              <p className="text-center text-muted small mb-4">Update your password to keep your account secure</p>

              {status && (
                <Alert
                  variant={status === 'success' ? 'success' : 'danger'}
                  onClose={() => setStatus(null)}
                  dismissible
                  className={`rounded-3 mb-4 small ${
                    status === 'success' ? 'bg-success bg-opacity-20 text-success border-success border-opacity-30' : 'bg-danger bg-opacity-20 text-danger border-danger border-opacity-30'
                  }`}
                >
                  {message}
                </Alert>
              )}

              <div className="p-3 rounded-3 bg-indigo bg-opacity-10 border border-indigo border-opacity-20 mb-4">
                <div className="fw-semibold text-indigo small mb-1">💡 Password Requirements:</div>
                <ul className="mb-0 text-muted small ps-3">
                  <li>Minimum 6 characters</li>
                  <li>Mix of letters, numbers, and symbols recommended</li>
                </ul>
              </div>

              <Form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                <Form.Group controlId="currentPassword">
                  <Form.Label>Current Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group controlId="newPassword">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group controlId="confirmPassword">
                  <Form.Label>Confirm New Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="gradient-btn py-2.5 fw-semibold rounded-3 mt-2"
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Updating Password...
                    </>
                  ) : (
                    'Update Password'
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
