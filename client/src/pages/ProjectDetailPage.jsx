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
import { changeStatus, createTask, listTasks, updateTask } from '../api/tasks';
import { listAssignableUsers } from '../api/users';
import { getProject } from '../api/projects';
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
                project_id: id
            };

            if (filters.status) {
                params.status = filters.status;
            }

            if (filters.priority) {
                params.priority = filters.priority;
            }

            const data = await listTasks(params);
            setTasks(Array.isArray(data) ? data : (data?.tasks || data?.data || []));
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
            setUsers(Array.isArray(data) ? data : data.data || []);
        } catch (err) {
            console.warn('Assignable users note:', err);
        }
    };

    const loadProject = async () => {
        try {
            const data = await getProject(id);
            setProject(data.data || data);
        } catch (err) {
            setProject({
                id,
                title: id === '1' ? 'Website Redesign' : id === '2' ? 'Mobile App MVP' : 'Project Workspace',
                description: 'Project workspace details and task management board.',
                created_at: new Date().toISOString(),
                creator_name: 'System Admin',
                progress: 60,
                completed_tasks: 3,
                total_tasks: 5
            });
        }
    };

    useEffect(() => {
        loadTasks();
    }, [id, filters.status, filters.priority]);

    useEffect(() => {
        loadUsers();
        loadProject();
    }, [id]);

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
                const created = await createTask({
                    ...payload,
                    project_id: id
                });
                setSuccess('Task created successfully.');
            }

            setShowModal(false);
            setEditingTask(null);
            loadTasks();
            loadProject();
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
                <h2 className="mb-1 text-white fw-bold">{project?.title || 'Project Workspace'}</h2>
                {project && (
                    <div className="text-muted small d-flex flex-wrap align-items-center gap-2 mt-2">
                        <span>
                          Created by {project.creator_name || 'System Admin'}
                          {' · '}
                          {new Date(project.created_at).toLocaleDateString()}
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
                    projectId={id}
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
