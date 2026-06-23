import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    // Controlled state for each field
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Show an error banner when fields are empty
    const [error, setError] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();

    function handleSubmit(e) {
        e.preventDefault();  // stop the browser from reloading the page

        // Validation — both fields must be filled
        if (!email || !password) {
            setError('Please fill in both email and password.');
            return;
        }

        // Clear any previous error
        setError('');

        // --- FAKE LOGIN (swap this for a real API call later) ---
        login(
            { id: '1', name: 'Test Admin', role: 'admin', must_reset_password: false },
            'fake-token'
        );

        // Redirect to the dashboard
        navigate('/');
    }

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
            <Row className="w-100 justify-content-center">
                <Col md={8} lg={5} xl={4}>
                    <Card className="shadow border-0 rounded-4 p-4">
                        <Card.Body>
                            <h2 className="text-center mb-4 fw-bold text-primary">Task Manager</h2>

                            {/* Error banner — only renders when error is non-empty */}
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

                                <Button variant="primary" type="submit" className="w-100 mt-3 py-2 fw-semibold shadow-sm">
                                    Log in
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}


