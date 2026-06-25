import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../api/auth'; // <-- real API call

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // loading flag disables the button while the request is in-flight
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        // Client-side: both fields must be filled before we bother the server
        if (!email || !password) {
            setError('Please fill in both email and password.');
            return;
        }

        setError('');
        setLoading(true); // disable the button

        try {
            // --- REAL API CALL ---
            // Returns { user, accessToken } on success
            const data = await loginApi(email, password);

            // Store the user and token in context (also saves user to localStorage)
            login(data.user, data.accessToken);

            // If the server flagged that the password must be reset, go there first
            if (data.user.must_reset_password) {
                navigate('/change-password');
            } else {
                navigate('/');
            }
        } catch (err) {
            // Show the server's error message if it sent one, otherwise a fallback
            const serverMessage =
                err.response?.data?.message || 'Login failed. Please try again.';
            setError(serverMessage);
        } finally {
            setLoading(false); // re-enable the button either way
        }
    }

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
            <Row className="w-100 justify-content-center">
                <Col md={8} lg={5} xl={4}>
                    <Card className="shadow border-0 rounded-4 p-4">
                        <Card.Body>
                            <h2 className="text-center mb-4 fw-bold text-primary">Task Manager</h2>

                            {/* Error banner — shown when error is non-empty */}
                            {error && (
                                <Alert variant="danger" onClose={() => setError('')} dismissible>
                                    {error}
                                </Alert>
                            )}

                            <Form onSubmit={handleSubmit}>
                                {/* Email */}
                                <Form.Group className="mb-3" controlId="loginEmail">
                                    <Form.Label className="fw-semibold">Email address</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="name@example.com"
                                        className="py-2"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </Form.Group>

                                {/* Password */}
                                <Form.Group className="mb-3" controlId="loginPassword">
                                    <Form.Label className="fw-semibold">Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Enter password"
                                        className="py-2"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </Form.Group>

                                {/* Button is disabled while the request is in-flight */}
                                <Button
                                    variant="primary"
                                    type="submit"
                                    className="w-100 mt-3 py-2 fw-semibold shadow-sm"
                                    disabled={loading}
                                >
                                    {loading ? 'Logging in…' : 'Log in'}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
