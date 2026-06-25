import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Alert,
    Button,
    ButtonGroup,
    Col,
    Container,
    Form,
    Row,
    Spinner
} from 'react-bootstrap';

import { useAuth } from '../context/AuthContext';
import { listTasks } from '../api/tasks';
import TaskBoard from '../components/TaskBoard';
import TaskTable from '../components/TaskTable';
import TaskFormModal from '../components/TaskFormModal';

const ProjectDetailPage = () => {
    const { id } = useParams();
    const { user } = useAuth();

    const canCreateTask =
        user?.role === 'project_manager' || user?.role === 'admin';

    const [view, setView] = useState('board');
    const [showModal, setShowModal] = useState(false);

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [filters, setFilters] = useState({
        status: '',
        priority: ''
    });

    const loadTasks = async () => {
        try {
            setLoading(true);
            setError('');

            const params = {
                project_id: id
            };

            if (filters.status) {
                params.status = filters.status;
            }

            if (filters.priority) {
                params.priority = filters.priority;
            }

            const data = await listTasks(params);
            setTasks(data);
        } catch (err) {
            console.error('Failed to load tasks:', err);
            setError('Could not load tasks. Please check the backend.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, [id, filters.status, filters.priority]);

    const handleFilterChange = (name, value) => {
        setFilters(previousFilters => ({
            ...previousFilters,
            [name]: value
        }));
    };

    return (
        <Container className="mt-4">
            <h2>Project Alpha (ID: {id})</h2>

            <div className="mb-4 d-flex justify-content-between align-items-center">
                <ButtonGroup>
                    <Button
                        variant={view === 'board' ? 'primary' : 'outline-primary'}
                        onClick={() => setView('board')}
                    >
                        Board
                    </Button>

                    <Button
                        variant={view === 'table' ? 'primary' : 'outline-primary'}
                        onClick={() => setView('table')}
                    >
                        Table
                    </Button>
                </ButtonGroup>

                {canCreateTask && (
                    <Button variant="success" onClick={() => setShowModal(true)}>
                        + New Task
                    </Button>
                )}
            </div>

            <Row className="mb-4">
                <Col xs={6} md={3}>
                    <Form.Group>
                        <Form.Label className="small text-muted fw-bold mb-1">
                            Status
                        </Form.Label>

                        <Form.Select
                            value={filters.status}
                            onChange={(event) =>
                                handleFilterChange('status', event.target.value)
                            }
                            size="sm"
                        >
                            <option value="">All Statuses</option>
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </Form.Select>
                    </Form.Group>
                </Col>

                <Col xs={6} md={3}>
                    <Form.Group>
                        <Form.Label className="small text-muted fw-bold mb-1">
                            Priority
                        </Form.Label>

                        <Form.Select
                            value={filters.priority}
                            onChange={(event) =>
                                handleFilterChange('priority', event.target.value)
                            }
                            size="sm"
                        >
                            <option value="">All Priorities</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </Form.Select>
                    </Form.Group>
                </Col>
            </Row>

            {error && (
                <Alert variant="danger">
                    {error}
                </Alert>
            )}

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" />
                    <p className="text-muted mt-3">Loading tasks...</p>
                </div>
            ) : view === 'board' ? (
                <TaskBoard tasks={tasks} />
            ) : (
                <TaskTable tasks={tasks} />
            )}

            <TaskFormModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onSave={(data) => {
                    console.log('Parent received save:', data);
                    setShowModal(false);
                }}
            />
        </Container>
    );
};

export default ProjectDetailPage;
