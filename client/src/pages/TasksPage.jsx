import { useEffect, useMemo, useState } from 'react';
import { Container, Spinner, Alert, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { listTasks } from '../api/tasks';
import TaskDetailModal from '../components/TaskDetailModal';

const STATUS_LABEL = {
    todo: 'To Do',
    in_progress: 'In Progress',
    completed: 'Completed',
};

const PRIORITY_VARIANT = { high: 'danger', medium: 'warning', low: 'secondary' };

export default function TasksPage() {
    const { user } = useAuth();
    const isManager = user?.role === 'project_manager' || user?.role === 'admin';

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedTask, setSelectedTask] = useState(null);

    const loadTasks = async () => {
        if (!user?.id) return;
        try {
            setError('');
            const data = await listTasks({ assignee: user.id });
            setTasks(data);
        } catch (err) {
            console.error('Failed to load tasks:', err);
            setError('Could not load your tasks. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    // Keep the open modal's data fresh after edits.
    useEffect(() => {
        if (!selectedTask) return;
        const refreshed = tasks.find((t) => t.id === selectedTask.id);
        if (refreshed) setSelectedTask(refreshed);
    }, [tasks, selectedTask]);

    // Group assigned tasks by the project they belong to.
    const groups = useMemo(() => {
        const map = new Map();
        for (const task of tasks) {
            const projectId = task.project?.id || task.project_id || 'unknown';
            const projectTitle = task.project?.title || 'Unknown project';
            if (!map.has(projectId)) {
                map.set(projectId, { projectId, projectTitle, items: [] });
            }
            map.get(projectId).items.push(task);
        }
        return Array.from(map.values());
    }, [tasks]);

    return (
        <Container className="py-4">
            <h2 className="mb-4">My Tasks</h2>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" />
                </div>
            ) : user?.role === 'admin' ? (
                <div className="tm-empty">
                    Admins aren’t assigned tasks. Manage work in Projects and the team in Users.
                </div>
            ) : tasks.length === 0 ? (
                <div className="tm-empty">No tasks assigned to you yet.</div>
            ) : (
                groups.map((group) => (
                    <div key={group.projectId} className="tm-task-group mb-4">
                        <div className="tm-task-group-head">
                            <span className="tm-task-group-title">{group.projectTitle}</span>
                            <Badge bg="secondary">{group.items.length}</Badge>
                        </div>

                        <div className="tm-task-rows">
                            {group.items.map((task) => (
                                <button
                                    key={task.id}
                                    type="button"
                                    className="tm-task-row"
                                    onClick={() => setSelectedTask(task)}
                                >
                                    <span className="tm-task-row-main">
                                        <span className="tm-task-row-title">{task.title}</span>
                                        <span className="tm-task-row-meta">
                                            {task.due_date
                                                ? `Due ${new Date(task.due_date).toLocaleDateString()}`
                                                : 'No deadline'}
                                        </span>
                                    </span>
                                    <span className="d-flex align-items-center gap-2">
                                        <Badge bg={PRIORITY_VARIANT[task.priority] || 'secondary'}>
                                            {task.priority}
                                        </Badge>
                                        <Badge bg="light" text="dark" className="tm-status-pill">
                                            {STATUS_LABEL[task.status] || task.status}
                                        </Badge>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))
            )}

            <TaskDetailModal
                show={Boolean(selectedTask)}
                task={selectedTask}
                projectId={selectedTask?.project?.id || selectedTask?.project_id}
                canEdit
                canManageLabels={isManager}
                onTaskUpdated={loadTasks}
                onClose={() => setSelectedTask(null)}
            />
        </Container>
    );
}
