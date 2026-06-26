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
            setTasks(data);
        } catch (err) {
            console.error('Failed to load tasks:', err);
            setError('Could not load tasks. Please check the backend.');
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
        console.error('Failed to load assignable users:', err);
        setError('Could not load assignable users. Please check the backend.');
    }
};

    useEffect(() => {
        loadTasks();
    }, [id, filters.status, filters.priority]);
    useEffect(() => {
    loadUsers();
}, []);

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
            assignee_ids: formData.assignees,
            // null clears the deadline; the modal sends an end-of-day ISO string
            due_date: formData.due_date || null
        };

        if (editingTask) {
            await updateTask(editingTask.id, payload);
            setSuccess('Task updated successfully.');
        } else {
            await createTask({
                ...payload,
                project_id: id
            });
            setSuccess('Task created successfully.');
        }

        setShowModal(false);
        setEditingTask(null);
        loadTasks();
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
    } catch (err) {
        console.error('Failed to change status:', err);
        setError(err.response?.data?.message || 'Could not change task status.');
    }
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
                            <Button
                variant="success"
                onClick={() => {
                    setEditingTask(null);
                    setShowModal(true);
                }}
            >
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
            {success && (
            <Alert variant="success">
                {success}
            </Alert>
        )}

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" />
                    <p className="text-muted mt-3">Loading tasks...</p>
                </div>
            ) : view === 'board' ? (
                <TaskBoard
                    tasks={tasks}
                    projectId={id}
                    onStatusChange={handleStatusChange}
                    onTaskUpdated={() => loadTasks(false)}
                />
            ) : (
                <TaskTable tasks={tasks} />
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
