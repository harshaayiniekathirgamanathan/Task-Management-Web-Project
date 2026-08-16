import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Badge, ProgressBar, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { listProjects, createProject } from '../api/projects';

const INITIAL_PROJECTS = [
  {
    id: '1',
    title: 'Website Redesign',
    description: 'Redesign the company website with modern typography, glassmorphism UI, and dark mode theme.',
    category: 'Frontend Design',
    status: 'In Progress',
    progress: 75,
    members: ['A', 'M', 'R'],
    created_at: '2026-01-15T08:00:00Z',
  },
  {
    id: '2',
    title: 'Mobile App MVP',
    description: 'Build the first version of the iOS and Android application with real-time push notifications.',
    category: 'Mobile Platform',
    status: 'Planning',
    progress: 40,
    members: ['A', 'K'],
    created_at: '2026-02-20T10:00:00Z',
  },
  {
    id: '3',
    title: 'API Gateway Integration',
    description: 'Connect frontend dashboard to microservice backend with JWT authentication and PostgreSQL.',
    category: 'Backend Architecture',
    status: 'Near Complete',
    progress: 90,
    members: ['A', 'S', 'D'],
    created_at: '2026-03-05T09:30:00Z',
  },
];

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Frontend Design');

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const data = await listProjects();
      const projectList = Array.isArray(data) ? data : (data?.data || []);
      if (projectList.length > 0) {
        setProjects(projectList.map(p => ({
          ...p,
          category: p.category || 'General Workspace',
          progress: p.progress ?? 50,
          members: ['A'],
        })));
      }
    } catch (err) {
      console.warn('Backend projects fetch fallback:', err);
    }
  }

  function handleOpenModal() {
    setTitle('');
    setDescription('');
    setCategory('Frontend Design');
    setShowModal(true);
  }

  function handleCloseModal() {
    setShowModal(false);
  }

  async function handleCreateProject(e) {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const res = await createProject({ title, description });
      const newProj = res?.data || res || {
        id: String(Date.now()),
        title,
        description: description || 'New project workspace.',
        category,
        status: 'In Progress',
        progress: 0,
        members: ['A'],
        created_at: new Date().toISOString(),
      };
      setProjects([newProj, ...projects]);
    } catch (err) {
      const newProj = {
        id: String(Date.now()),
        title,
        description: description || 'New project workspace.',
        category,
        status: 'In Progress',
        progress: 0,
        members: ['A'],
        created_at: new Date().toISOString(),
      };
      setProjects([newProj, ...projects]);
    } finally {
      handleCloseModal();
    }
  }

  const filteredProjects = projects.filter((p) =>
    (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="py-2">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h1 className="h2 fw-bold text-white mb-1">Projects Workspace</h1>
          <p className="text-muted mb-0 small">Manage and track your active team projects</p>
        </div>
        <Button 
          className="gradient-btn px-4 py-2 rounded-3 text-white fw-semibold shadow"
          onClick={handleOpenModal}
        >
          + Create New Project
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="glass-card p-2 mb-4 border-0">
        <Card.Body className="py-2">
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Search projects by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-0 text-white shadow-none"
            />
          </InputGroup>
        </Card.Body>
      </Card>

      {/* Projects Grid */}
      <Row className="g-4">
        {filteredProjects.map((project) => (
          <Col key={project.id} xs={12} md={6} lg={4}>
            <Card className="glass-card h-100 p-2 border-0 d-flex flex-column">
              <Card.Body className="d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <Badge className="badge-indigo rounded-pill px-2.5 py-1 small fw-normal">
                    {project.category || 'General'}
                  </Badge>
                  <span className="text-muted small">
                    {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'Today'}
                  </span>
                </div>

                <Card.Title className="h5 fw-bold text-white mb-2">{project.title}</Card.Title>
                <Card.Text className="text-muted small flex-grow-1 mb-4" style={{ lineHeight: '1.6' }}>
                  {project.description}
                </Card.Text>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>Completion Progress</span>
                    <span className="text-indigo fw-bold small">{project.progress ?? 0}%</span>
                  </div>
                  <ProgressBar 
                    now={project.progress ?? 0} 
                    style={{ height: '6px' }} 
                    className="bg-secondary bg-opacity-20"
                  />
                </div>

                {/* Footer bar */}
                <div className="d-flex justify-content-between align-items-center pt-3 border-top border-secondary border-opacity-10 mt-auto">
                  <div className="d-flex gap-1">
                    {(project.members || ['A']).map((m, idx) => (
                      <div 
                        key={idx}
                        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                        style={{
                          width: '28px',
                          height: '28px',
                          background: 'var(--gradient-primary)',
                          fontSize: '0.75rem'
                        }}
                      >
                        {m}
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outline-light"
                    size="sm"
                    className="rounded-3 px-3 py-1 border-secondary border-opacity-30 small"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    Open Workspace →
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered className="dark-modal">
        <Modal.Header closeButton>
          <Modal.Title className="h5 text-white fw-bold">Create New Project</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateProject}>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group controlId="projectTitle">
              <Form.Label>Project Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Mobile App Redesign"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group controlId="projectCategory">
              <Form.Label>Category</Form.Label>
              <Form.Select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Frontend Design">Frontend Design</option>
                <option value="Mobile Platform">Mobile Platform</option>
                <option value="Backend Architecture">Backend Architecture</option>
                <option value="DevOps & Cloud">DevOps & Cloud</option>
              </Form.Select>
            </Form.Group>

            <Form.Group controlId="projectDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Describe project objectives and scope..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={handleCloseModal} className="rounded-3">
              Cancel
            </Button>
            <Button type="submit" className="gradient-btn rounded-3">
              Create Project
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
