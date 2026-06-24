import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';

export default function ChangePasswordPage() {
    // Controlled state for the three fields
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // null = no message yet | 'error' | 'success'
    const [status, setStatus] = useState(null);
    const [message, setMessage] = useState('');

    function handleSubmit(e) {
        e.preventDefault();

        // --- Basic validation ---
        if (!currentPassword || !newPassword || !confirmPassword) {
            setStatus('error');
            setMessage('Please fill in all three fields.');
            return;
        }

        // New password and confirm must match
        if (newPassword !== confirmPassword) {
            setStatus('error');
            setMessage('New password and confirm password do not match.');
            return;
        }

        // --- FAKE SUBMIT (swap for real API call later) ---
        // At this point we would POST to /api/auth/change-password
        setStatus('success');
        setMessage('Password changed successfully!');

        // Clear the fields after success
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    }

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
            <Row className="w-100 justify-content-center">
                <Col md={8} lg={6} xl={5}>
                    <Card className="shadow border-0 rounded-4 p-4">
                        <Card.Body>
                            <h2 className="text-center mb-4 fw-bold text-primary">Change Password</h2>

                            {/* Status banner — shown only after a submit attempt */}
                            {status && (
                                <Alert
                                    variant={status === 'success' ? 'success' : 'danger'}
                                    onClose={() => setStatus(null)}
                                    dismissible
                                >
                                    {message}
                                </Alert>
                            )}

                            {/* Password rules — shown as a helpful note */}
                            <Alert variant="info" className="small">
                                <strong>Password rules:</strong>
                                <ul className="mb-0 mt-1">
                                    <li>At least 8 characters</li>
                                    <li>At least one uppercase letter (A–Z)</li>
                                    <li>At least one lowercase letter (a–z)</li>
                                    <li>At least one number (0–9)</li>
                                </ul>
                            </Alert>

                            <Form onSubmit={handleSubmit}>
                                {/* Current Password */}
                                <Form.Group className="mb-3" controlId="currentPassword">
                                    <Form.Label className="fw-semibold">Current Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Enter current password"
                                        className="py-2"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                    />
                                </Form.Group>

                                {/* New Password */}
                                <Form.Group className="mb-3" controlId="newPassword">
                                    <Form.Label className="fw-semibold">New Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Enter new password"
                                        className="py-2"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                </Form.Group>

                                {/* Confirm New Password */}
                                <Form.Group className="mb-3" controlId="confirmPassword">
                                    <Form.Label className="fw-semibold">Confirm New Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Re-enter new password"
                                        className="py-2"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </Form.Group>

                                <Button variant="primary" type="submit" className="w-100 mt-3 py-2 fw-semibold shadow-sm">
                                    Change Password
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
