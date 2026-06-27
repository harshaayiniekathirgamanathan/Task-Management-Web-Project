import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { changePassword as changePasswordApi } from '../api/auth'; // <-- real API call

export default function ChangePasswordPage() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // null = no message yet | 'error' | 'success'
    const [status, setStatus] = useState(null);
    const [message, setMessage] = useState('');

    // Disables the button while the request is in-flight
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        // --- Client-side validation first (no need to hit the server) ---
        if (!currentPassword || !newPassword || !confirmPassword) {
            setStatus('error');
            setMessage('Please fill in all three fields.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setStatus('error');
            setMessage('New password and confirm password do not match.');
            return;
        }

        setStatus(null);
        setLoading(true);

        try {
            // --- REAL API CALL ---
            await changePasswordApi(currentPassword, newPassword);

            // Show a success message briefly, then redirect to the dashboard
            setStatus('success');
            setMessage('Password changed successfully! Redirecting…');

            // Give the user 1.5 seconds to read the success message before redirect
            setTimeout(() => navigate('/'), 1500);

        } catch (err) {
            // 400 = weak password (or wrong current password) — show server message
            // Any other error falls back to a generic message
            const serverMessage =
                err.response?.data?.message || 'Something went wrong. Please try again.';
            setStatus('error');
            setMessage(serverMessage);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
            <Row className="w-100 justify-content-center">
                <Col md={8} lg={6} xl={5}>
                    <Card className="shadow border-0 rounded-4 p-4">
                        <Card.Body>
                            <h2 className="text-center mb-4">Change Password</h2>

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

                            {/* Password rules note */}
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

                                {/* Button disabled while request is in-flight */}
                                <Button
                                    variant="primary"
                                    type="submit"
                                    className="w-100 mt-3 py-2 fw-semibold shadow-sm"
                                    disabled={loading}
                                >
                                    {loading ? 'Saving…' : 'Change Password'}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
