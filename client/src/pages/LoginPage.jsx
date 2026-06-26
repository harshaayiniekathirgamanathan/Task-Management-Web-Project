import { useState } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
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
        <div className="tm-auth">
            <Card className="tm-auth-card shadow-sm">
                <Card.Body>
                    <div className="tm-auth-mark" aria-hidden="true">T</div>
                    <h1 className="tm-auth-title">Welcome back</h1>
                    <p className="tm-auth-sub">Sign in to your workspace.</p>

                    {error && (
                        <Alert variant="danger" onClose={() => setError('')} dismissible>
                            {error}
                        </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3" controlId="loginEmail">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="name@gmail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </Form.Group>

                        <Form.Group className="mb-4" controlId="loginPassword">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </Form.Group>

                        <Button
                            variant="primary"
                            type="submit"
                            className="w-100"
                            disabled={loading}
                        >
                            {loading ? 'Signing in…' : 'Sign in'}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
}
