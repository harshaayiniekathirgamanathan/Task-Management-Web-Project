import React from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';

export default function LoginPage() {
    return (
        // Centering the container vertically and horizontally
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
            <Row className="w-100 justify-content-center">
                <Col md={8} lg={5} xl={4}>
                    {/* Card container with shadow and no border for modern look */}
                    <Card className="shadow border-0 rounded-4 p-4">
                        <Card.Body>
                            {/* Application Title */}
                            <h2 className="text-center mb-4 fw-bold text-primary">Task Manager</h2>

                            <Form onSubmit={(e) => e.preventDefault()}>
                                {/* Email Form Control */}
                                <Form.Group className="mb-3" controlId="loginEmail">
                                    <Form.Label className="fw-semibold">Email address</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="name@example.com"
                                        className="py-2"
                                    />
                                </Form.Group>

                                {/* Password Form Control */}
                                <Form.Group className="mb-3" controlId="loginPassword">
                                    <Form.Label className="fw-semibold">Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Enter password"
                                        className="py-2"
                                    />
                                </Form.Group>

                                {/* Primary Log in Button */}
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

