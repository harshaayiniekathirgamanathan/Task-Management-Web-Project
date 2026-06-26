import { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Button, Spinner, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listTasks } from '../api/tasks';
import { listProjects } from '../api/projects';
import { listUsers } from '../api/users';
import { listNotifications } from '../api/notifications';

// Per-role primary action shown as the black pill button.
const PRIMARY_ACTION = {
    collaborator: { label: 'View Tasks', to: '/tasks' },
    project_manager: { label: 'View Projects', to: '/projects' },
    admin: { label: 'Manage Users', to: '/users' },
};

// Bucket an open task by how soon it's due. Returns null for no due date.
function deadlineBucket(dueDate) {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startTomorrow = new Date(startToday); startTomorrow.setDate(startTomorrow.getDate() + 1);
    const startNextWeek = new Date(startToday); startNextWeek.setDate(startNextWeek.getDate() + 7);

    if (due < startToday) return 'Overdue';
    if (due < startTomorrow) return 'Due today';
    if (due < startNextWeek) return 'This week';
    return 'Later';
}

const BUCKET_ORDER = ['Overdue', 'Due today', 'This week', 'Later'];

export default function DashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const isAdmin = user?.role === 'admin';

    const [loading, setLoading] = useState(true);
    const [myTasks, setMyTasks] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [projectsCount, setProjectsCount] = useState(0);
    const [usersCount, setUsersCount] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const notifs = await listNotifications().catch(() => []);
                if (cancelled) return;
                setNotifications(Array.isArray(notifs) ? notifs : []);

                if (isAdmin) {
                    const [projectsRes, usersRes] = await Promise.all([
                        listProjects().catch(() => []),
                        listUsers().catch(() => []),
                    ]);
                    if (cancelled) return;
                    const projects = Array.isArray(projectsRes) ? projectsRes : projectsRes?.data || [];
                    const users = Array.isArray(usersRes) ? usersRes : usersRes?.data || [];
                    setProjectsCount(projects.length);
                    setUsersCount(users.length);
                } else if (user?.id) {
                    const tasksRes = await listTasks({ assignee: user.id }).catch(() => []);
                    if (cancelled) return;
                    setMyTasks(Array.isArray(tasksRes) ? tasksRes : []);
                }
            } catch (err) {
                console.error('Failed to load dashboard:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, isAdmin]);

    const unreadCount = notifications.filter((n) => !n.is_read).length;
    const recentNotifications = notifications.slice(0, 4);
    const distinctProjects = useMemo(
        () => new Set(myTasks.map((t) => t.project?.id || t.project_id)).size,
        [myTasks]
    );

    // Deadline tracker: open tasks with a due date, grouped by urgency.
    const deadlineGroups = useMemo(() => {
        const buckets = {};
        for (const task of myTasks) {
            if (task.status === 'completed' || !task.due_date) continue;
            const bucket = deadlineBucket(task.due_date);
            if (!bucket) continue;
            (buckets[bucket] || (buckets[bucket] = [])).push(task);
        }
        for (const key of Object.keys(buckets)) {
            buckets[key].sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
        }
        return BUCKET_ORDER.filter((b) => buckets[b]?.length).map((b) => ({
            bucket: b,
            items: buckets[b],
        }));
    }, [myTasks]);

    const stats = isAdmin
        ? [
              { label: 'Projects', value: projectsCount },
              { label: 'Team Members', value: usersCount },
              { label: 'Unread Notifications', value: unreadCount },
          ]
        : [
              { label: 'My Tasks', value: myTasks.length },
              { label: 'My Projects', value: distinctProjects },
              { label: 'Unread Notifications', value: unreadCount },
          ];

    const action = PRIMARY_ACTION[user?.role] || PRIMARY_ACTION.collaborator;

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" />
            </div>
        );
    }

    return (
        <div>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                <h2 className="mb-0">Welcome back, {user?.name || 'there'} 👋</h2>
                <button className="tm-pill-btn" onClick={() => navigate(action.to)}>
                    {action.label}
                </button>
            </div>

            {/* Real, role-accurate stat cards */}
            <Row className="g-3 mb-4">
                {stats.map((stat) => (
                    <Col key={stat.label} xs={12} md={4}>
                        <Card className="text-center shadow-sm">
                            <Card.Body>
                                <Card.Title className="display-6">{stat.value}</Card.Title>
                                <Card.Text className="text-muted">{stat.label}</Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row className="g-3">
                {/* Left: assigned tasks + deadline tracker */}
                <Col xs={12} lg={7}>
                    <Card className="shadow-sm mb-3">
                        <Card.Body>
                            <Card.Title className="h5 mb-3">Assigned Tasks</Card.Title>

                            {isAdmin ? (
                                <p className="text-muted mb-0">
                                    As an admin you aren’t assigned tasks. Use{' '}
                                    <strong>Projects</strong> to oversee work and{' '}
                                    <strong>Users</strong> to manage the team.
                                </p>
                            ) : myTasks.length === 0 ? (
                                <p className="text-muted mb-0">
                                    You have no assigned tasks yet.
                                </p>
                            ) : (
                                <div className="tm-task-rows">
                                    {myTasks.slice(0, 5).map((task) => (
                                        <button
                                            key={task.id}
                                            type="button"
                                            className="tm-task-row"
                                            onClick={() => navigate('/tasks')}
                                        >
                                            <span className="tm-task-row-main">
                                                <span className="tm-task-row-title">{task.title}</span>
                                                <span className="tm-task-row-meta">
                                                    {task.project?.title || 'Project'}
                                                </span>
                                            </span>
                                            <Badge bg="light" text="dark" className="tm-status-pill">
                                                {task.status === 'in_progress'
                                                    ? 'In Progress'
                                                    : task.status === 'completed'
                                                    ? 'Completed'
                                                    : 'To Do'}
                                            </Badge>
                                        </button>
                                    ))}
                                    {myTasks.length > 5 && (
                                        <button
                                            type="button"
                                            className="tm-task-row tm-task-row--more"
                                            onClick={() => navigate('/tasks')}
                                        >
                                            View all {myTasks.length} tasks →
                                        </button>
                                    )}
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Deadline tracker — PM + collaborators only */}
                    {!isAdmin && (
                        <Card className="shadow-sm">
                            <Card.Body>
                                <Card.Title className="h5 mb-3">Deadline Tracker</Card.Title>
                                {deadlineGroups.length === 0 ? (
                                    <p className="text-muted mb-0">
                                        No upcoming deadlines on your open tasks.
                                    </p>
                                ) : (
                                    deadlineGroups.map((group) => (
                                        <div key={group.bucket} className="tm-deadline-group">
                                            <div className="tm-deadline-label">
                                                <span
                                                    className={`tm-deadline-dot ${
                                                        group.bucket === 'Overdue' ? 'is-overdue' : ''
                                                    }`}
                                                />
                                                {group.bucket}
                                                <Badge bg="secondary" className="ms-2">
                                                    {group.items.length}
                                                </Badge>
                                            </div>
                                            {group.items.map((task) => (
                                                <div key={task.id} className="tm-deadline-row">
                                                    <span>{task.title}</span>
                                                    <span className="text-muted small">
                                                        {new Date(task.due_date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ))
                                )}
                            </Card.Body>
                        </Card>
                    )}
                </Col>

                {/* Right: notifications form (4 most recent) */}
                <Col xs={12} lg={5}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <Card.Title className="h5 mb-3 d-flex align-items-center justify-content-between">
                                Notifications
                                {unreadCount > 0 && (
                                    <Badge bg="danger" pill>{unreadCount} new</Badge>
                                )}
                            </Card.Title>

                            {recentNotifications.length === 0 ? (
                                <p className="text-muted mb-0">You’re all caught up.</p>
                            ) : (
                                <div className="tm-notif-list">
                                    {recentNotifications.map((n) => (
                                        <div
                                            key={n.id}
                                            className={`tm-notif-item ${n.is_read ? '' : 'is-unread'}`}
                                        >
                                            <div className="tm-notif-message">{n.message}</div>
                                            <div className="text-muted small">
                                                {new Date(n.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
