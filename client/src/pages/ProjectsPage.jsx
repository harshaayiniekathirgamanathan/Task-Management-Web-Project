import React, { useState } from 'react';
import {
    Container, Row, Col,
    Card, Button,
    Modal, Form
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

// Hard-coded fake projects matching the API contract
// Shape: { id, title, description, created_at }
const FAKE_PROJECTS = [
    {
        id: '1',
        title: 'Website Redesign',
        description: 'Redesign the company website with a modern look and feel.',
        created_at: '2024-01-15T08:00:00Z',
    },
    {
        id: '2',
        title: 'Mobile App MVP',
        description: 'Build the first version of the iOS and Android app.',
        created_at: '2024-02-20T10:00:00Z',
    },
    {
        id: '3',
        title: 'API Integration',
        description: 'Connect the dashboard to third-party analytics services.',
        created_at: '2024-03-05T09:30:00Z',
    },
];

export default function ProjectsPage() {
    const navigate = useNavigate();

    // --- New project modal state ---
    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    function handleOpenModal() {
        // Reset fields every time the modal opens
        setTitle('');
        setDescription('');
        setShowModal(true);
    }

    function handleCloseModal() {
        setShowModal(false);
    }

    function handleSave() {
        // For now just log — swap for a real POST /api/projects call later
        console.log('New project:', { title, description });
        handleCloseModal();
    }

    return (
        <Container className="py-4">
            {/* Page heading + New project button */}
            <Row className="mb-4 align-items-center">
                <Col>
                    <h2 className="fw-bold mb-0">Projects</h2>
                </Col>
                <Col xs="auto">
                    <Button variant="primary" onClick={handleOpenModal}>
                        + New Project
                    </Button>
                </Col>
            </Row>

            {/* Project cards grid */}
            <Row className="g-4">
                {FAKE_PROJECTS.map((project) => (
                    <Col key={project.id} xs={12} md={6} lg={4}>
                        <Card className="h-100 shadow-sm border-0 rounded-4">
                            <Card.Body className="d-flex flex-column">
                                {/* Project title */}
                                <Card.Title className="fw-bold">{project.title}</Card.Title>

                                {/* Description — grows to fill available space */}
                                <Card.Text className="text-muted flex-grow-1">
                                    {project.description}
                                </Card.Text>

                                {/* Created date — small text above the button */}
                                <Card.Text className="text-muted small mb-3">
                                    Created: {new Date(project.created_at).toLocaleDateString()}
                                </Card.Text>

                                {/* Open button — navigates to the project detail page */}
                                <Button
                                    variant="outline-primary"
                                    onClick={() => navigate(`/projects/${project.id}`)}
                                >
                                    Open
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* ---- New Project Modal ---- */}
            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>New Project</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Form onSubmit={(e) => e.preventDefault()}>
                        {/* Title */}
                        <Form.Group className="mb-3" controlId="projectTitle">
                            <Form.Label className="fw-semibold">Title</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Project title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </Form.Group>

                        {/* Description */}
                        <Form.Group controlId="projectDescription">
                            <Form.Label className="fw-semibold">Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="What is this project about?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSave}>
                        Create Project
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
