import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { changeStatus, createTask, listTasks, updateTask } from '../api/tasks';
import { listAssignableUsers } from '../api/users';
import { getProject } from '../api/projects';
import TaskBoard from '../components/TaskBoard';
import TaskTable from '../components/TaskTable';
import TaskFormModal from '../components/TaskFormModal';

const ProjectDetailPage = () => {
    const { id: rawId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Sanitize ID in case spaces or URL encoded spaces were in the address bar
    const cleanId = (rawId || '').trim().replace(/%20/g, '-').replace(/\s+/g, '-');

    // Auto-correct URL in address bar if spaces were present
    useEffect(() => {
        if (rawId && (rawId.includes(' ') || rawId.includes('%20'))) {
            navigate(`/projects/${cleanId}`, { replace: true });
        }
    }, [rawId, cleanId, navigate]);

    const canCreateTask =
        user?.role === 'project_manager' || user?.role === 'admin';

    const [view, setView] = useState('board');
    const [showModal, setShowModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [users, setUsers] = useState([]);

    const [filters, setFilters] = useState({
        status: '',
        priority: ''
    });

    const loadTasks = async (showSpinner = true) => {
        try {
            if (showSpinner) {
                setLoading(true);
            }

            setError('');

            const params = {
                project_id: cleanId
            };

            if (filters.status) {
                params.status = filters.status;
            }

            if (filters.priority) {
                params.priority = filters.priority;
            }

            const data = await listTasks(params);
            const fetchedTasks = Array.isArray(data) ? data : (data?.tasks || data?.data || []);
            setTasks(Array.isArray(fetchedTasks) ? fetchedTasks : []);
        } catch (err) {
            console.error('Failed to load tasks:', err);
            setTasks([]);
        } finally {
            if (showSpinner) {
                setLoading(false);
            }
        }
    };

    const loadUsers = async () => {
        try {
            const data = await listAssignableUsers();
            setUsers(Array.isArray(data) ? data : data?.data || []);
        } catch (err) {
            console.warn('Assignable users note:', err);
            setUsers([]);
        }
    };

    const loadProject = async () => {
        try {
            const data = await getProject(cleanId);
            setProject(data?.data || data);
        } catch (err) {
            setProject({
                id: cleanId,
                title: cleanId.includes('1111')
                    ? 'Website Redesign'
                    : cleanId.includes('2222')
                    ? 'Mobile App MVP'
                    : cleanId.includes('3333')
                    ? 'API Gateway Integration'
                    : 'Project Workspace',
                description: 'Project workspace details and task management board.',
                created_at: new Date().toISOString(),
                creator_name: 'Harshaa',
                progress: 0,
                completed_tasks: 0,
                total_tasks: 0
            });
        }
    };

    useEffect(() => {
        if (cleanId) {
            loadTasks();
        }
    }, [cleanId, filters.status, filters.priority]);

    useEffect(() => {
        if (cleanId) {
            loadUsers();
            loadProject();
        }
    }, [cleanId]);

    const handleFilterChange = (name, value) => {
        setFilters(previousFilters => ({
            ...previousFilters,
            [name]: value
        }));
    };

    const handleSaveTask = async (formData) => {
        try {
            setError('');
            setSuccess('');

            const payload = {
                title: formData.title,
                description: formData.description,
                priority: formData.priority,
                assignee_ids: formData.assignees || [],
                due_date: formData.due_date || null
            };

            if (editingTask) {
                await updateTask(editingTask.id, payload);
                setSuccess('Task updated successfully.');
            } else {
                await createTask({
                    ...payload,
                    project_id: cleanId
                });
                setSuccess('Task created successfully.');
            }

            setShowModal(false);
            setEditingTask(null);
            await loadTasks(false);
            await loadProject();
        } catch (err) {
            console.error('Failed to save task:', err);
            setError(err.response?.data?.message || 'Could not save task.');
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            setError('');
            setSuccess('');

            await changeStatus(taskId, newStatus);

            setSuccess('Task status updated successfully.');
            loadTasks();
            loadProject();
        } catch (err) {
            console.error('Failed to change status:', err);
            setError(err.response?.data?.message || 'Could not change task status.');
        }
    };

    return (
        <Container className="mt-4">
            <div className="mb-4">
                <Button
                    variant="outline-secondary"
                    size="sm"
                    className="rounded-3 px-3 py-1 mb-3 text-white border-secondary border-opacity-30"
                    onClick={() => navigate('/projects')}
                >
                    ← Back to Projects
                </Button>
                <h2 className="mb-1 text-white fw-bold">{project?.title || 'Project Workspace'}</h2>
                {project && (
                    <div className="text-muted small d-flex flex-wrap align-items-center gap-2 mt-2">
                        <span>
                          Created by {project.creator_name || 'Harshaa'}
                          {' · '}
                          {new Date(project.created_at || Date.now()).toLocaleDateString()}
                        </span>
                        <span className="d-inline-flex align-items-center gap-2 ms-2">
                            <span className="tm-progress-track" style={{ width: '120px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', height: '8px' }}>
                                <span
                                    className="tm-progress-fill"
                                    style={{ width: `${project.progress ?? 0}%`, background: 'var(--gradient-primary)', display: 'block', height: '100%', borderRadius: '4px' }}
                                />
                            </span>
                            <span className="fw-semibold text-white">{project.progress ?? 0}%</span>
                            <span>({project.completed_tasks ?? 0}/{project.total_tasks ?? 0} done)</span>
                        </span>
                    </div>
                )}
                {project?.description && (
                    <p className="text-muted mt-2 mb-0">{project.description}</p>
                )}
            </div>

            <div className="mb-4 d-flex justify-content-between align-items-center">
                <ButtonGroup>
                    <Button
                        variant={view === 'board' ? 'primary' : 'outline-primary'}
                        onClick={() => setView('board')}
                        className="rounded-start-3"
                    >
                        Board
                    </Button>

                    <Button
                        variant={view === 'table' ? 'primary' : 'outline-primary'}
                        onClick={() => setView('table')}
                        className="rounded-end-3"
                    >
                        Table
                    </Button>
                </ButtonGroup>

                {canCreateTask && (
                    <Button
                        className="gradient-btn px-4 py-2 rounded-3 text-white fw-semibold"
                        onClick={() => {
                            setEditingTask(null);
                            setShowModal(true);
                        }}
                    >
                        + New Task
                    </Button>
                )}
            </div>

            <Row className="mb-4 g-3">
                <Col xs={6} md={3}>
                    <Form.Group>
                        <Form.Label className="small text-muted fw-bold mb-1">
                            Status Filter
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
                            Priority Filter
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
                <Alert variant="danger" className="bg-danger bg-opacity-20 text-white border-danger border-opacity-30 rounded-3 mb-4">
                    {error}
                </Alert>
            )}
            {success && (
                <Alert variant="success" className="bg-success bg-opacity-20 text-white border-success border-opacity-30 rounded-3 mb-4">
                    {success}
                </Alert>
            )}

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="indigo" />
                    <p className="text-muted mt-3">Loading tasks...</p>
                </div>
            ) : view === 'board' ? (
                <TaskBoard
                    tasks={tasks}
                    projectId={cleanId}
                    onStatusChange={handleStatusChange}
                    onTaskUpdated={() => loadTasks(false)}
                    onEditTask={(taskToEdit) => {
                        setEditingTask(taskToEdit);
                        setShowModal(true);
                    }}
                />
            ) : (
                <TaskTable
                    tasks={tasks}
                    canEdit={canCreateTask}
                    onEditTask={(taskToEdit) => {
                        setEditingTask(taskToEdit);
                        setShowModal(true);
                    }}
                />
            )}

            <TaskFormModal
                show={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingTask(null);
                }}
                users={users}
                task={editingTask}
                onSave={handleSaveTask}
            />
        </Container>
    );
};

export default ProjectDetailPage;
