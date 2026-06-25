import React, { useState, useEffect } from 'react';
import {
    Container, Row, Col,
    Card, Button,
    Modal, Form,
    Spinner, Alert
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listProjects, createProject } from '../api/projects';

export default function ProjectsPage() {
    const navigate = useNavigate();
    const { user } = useAuth(); // needed to check role for the button

    // --- Data state ---
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchErr, setFetchErr] = useState('');

    // --- Action feedback ---
    const [actionMsg, setActionMsg] = useState('');
    const [actionErr, setActionErr] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // --- New project modal state ---
    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    // Fetch projects on first render
    useEffect(() => {
        fetchProjects();
    }, []);

    async function fetchProjects() {
        setLoading(true);
        setFetchErr('');
        try {
            const data = await listProjects();
            // Handle both { data: [...] } and a bare array response shape
            const list = Array.isArray(data?.data) ? data.data
                : Array.isArray(data) ? data
                    : [];
            setProjects(list);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to load projects. Please try again.';
            setFetchErr(msg);
        } finally {
            setLoading(false);
        }
    }

    // ---- Modal handlers ----
    function handleOpenModal() {
        setTitle('');
        setDescription('');
        setActionMsg('');
        setActionErr('');
        setShowModal(true);
    }

    function handleCloseModal() {
        setShowModal(false);
    }

    async function handleSave() {
        // Basic client-side check
        if (!title.trim()) {
            setActionErr('Project title is required.');
            return;
        }

        setActionLoading(true);
        setActionErr('');
        try {
            await createProject({ title, description });
            setActionMsg(`Project "${title}" created successfully.`);
            handleCloseModal();
            fetchProjects(); // refresh the cards grid
        } catch (err) {
            const serverMsg = err.response?.data?.message || 'Failed to create project.';
            setActionErr(serverMsg);
            // Keep modal open so the user can correct the input
        } finally {
            setActionLoading(false);
        }
    }

    // Only admin or project_manager roles may create projects
    const canCreate = user?.role === 'admin' || user?.role === 'project_manager';

    return (
        <Container className="py-4">
            {/* Heading + New Project button (role-gated) */}
            <Row className="mb-4 align-items-center">
                <Col>
                    <h2 className="fw-bold mb-0">Projects</h2>
                </Col>
                {canCreate && (
                    <Col xs="auto">
                        <Button variant="primary" onClick={handleOpenModal} disabled={actionLoading}>
                            + New Project
                        </Button>
                    </Col>
                )}
            </Row>

            {/* Success banner */}
            {actionMsg && (
                <Alert variant="success" onClose={() => setActionMsg('')} dismissible className="mb-3">
                    {actionMsg}
                </Alert>
            )}

            {/* Fetch error banner */}
            {fetchErr && (
                <Alert variant="danger" onClose={() => setFetchErr('')} dismissible className="mb-3">
                    {fetchErr}
                </Alert>
            )}

            {/* Loading spinner */}
            {loading && (
                <div className="text-center my-5">
                    <Spinner animation="border" variant="primary" role="status">
                        <span className="visually-hidden">Loading…</span>
                    </Spinner>
                </div>
            )}

            {/* Empty state */}
            {!loading && !fetchErr && projects.length === 0 && (
                <p className="text-muted text-center mt-5">No projects yet.</p>
            )}

            {/* Project cards grid */}
            {!loading && !fetchErr && projects.length > 0 && (
                <Row className="g-4">
                    {projects.map((project) => (
                        <Col key={project.id} xs={12} md={6} lg={4}>
                            <Card className="h-100 shadow-sm border-0 rounded-4">
                                <Card.Body className="d-flex flex-column">
                                    <Card.Title className="fw-bold">{project.title}</Card.Title>

                                    <Card.Text className="text-muted flex-grow-1">
                                        {project.description}
                                    </Card.Text>

                                    <Card.Text className="text-muted small mb-3">
                                        Created: {new Date(project.created_at).toLocaleDateString()}
                                    </Card.Text>

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
            )}

            {/* New Project Modal */}
            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>New Project</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {/* Server/validation error inside the modal */}
                    {actionErr && (
                        <Alert variant="danger" className="mb-3">
                            {actionErr}
                        </Alert>
                    )}

                    <Form onSubmit={(e) => e.preventDefault()}>
                        <Form.Group className="mb-3" controlId="projectTitle">
                            <Form.Label className="fw-semibold">Title</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Project title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </Form.Group>

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
                    <Button variant="secondary" onClick={handleCloseModal} disabled={actionLoading}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSave} disabled={actionLoading}>
                        {actionLoading ? 'Creating…' : 'Create Project'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
