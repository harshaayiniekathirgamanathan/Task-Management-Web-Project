import { Table, Badge, Button } from 'react-bootstrap';

const TaskTable = ({ tasks = [], onEditTask, canEdit = true }) => {
    const getPriorityVariant = (priority) => {
        if (priority === 'high') return 'danger';
        if (priority === 'medium') return 'warning';
        return 'secondary';
    };

    const getStatusVariant = (status) => {
        if (status === 'completed') return 'success';
        if (status === 'in_progress') return 'primary';
        return 'secondary';
    };

    return (
        <div className="glass-card p-3 border-0 shadow-lg">
            <Table responsive hover variant="dark" className="align-middle mb-0 bg-transparent">
                <thead>
                    <tr className="text-muted border-bottom border-secondary border-opacity-30">
                        <th style={{ minWidth: '220px' }}>Task Title</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Due Date</th>
                        <th>Assigned Team</th>
                        {canEdit && <th className="text-end">Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {tasks.length > 0 ? (
                        tasks.map(task => (
                            <tr key={task.id} className="border-bottom border-secondary border-opacity-20">
                                <td>
                                    <div className="fw-bold text-white fs-6 mb-0">{task.title}</div>
                                    {task.description && (
                                        <div className="text-muted small text-truncate" style={{ maxWidth: '300px' }}>
                                            {task.description}
                                        </div>
                                    )}
                                </td>
                                <td>
                                    <Badge bg={getPriorityVariant(task.priority)} className="px-2.5 py-1 text-uppercase" style={{ fontSize: '0.7rem' }}>
                                        {task.priority}
                                    </Badge>
                                </td>
                                <td>
                                    <Badge bg={getStatusVariant(task.status)} className="px-2.5 py-1 text-uppercase" style={{ fontSize: '0.7rem' }}>
                                        {task.status?.replace('_', ' ')}
                                    </Badge>
                                </td>
                                <td>
                                    <span className="text-light small">
                                        {task.due_date ? new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline'}
                                    </span>
                                </td>
                                <td>
                                    {task.assignees && task.assignees.length > 0 ? (
                                        <div className="d-flex align-items-center gap-1 flex-wrap">
                                            {task.assignees.map(a => (
                                                <Badge key={a.id} className="badge-indigo px-2 py-1 small fw-normal">
                                                    👤 {a.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-muted small opacity-60">Unassigned</span>
                                    )}
                                </td>
                                {canEdit && (
                                    <td className="text-end">
                                        <Button
                                            variant="outline-light"
                                            size="sm"
                                            className="rounded-3 px-3 py-1 small border-secondary border-opacity-40"
                                            onClick={() => onEditTask && onEditTask(task)}
                                        >
                                            ✏️ Edit & Assign
                                        </Button>
                                    </td>
                                )}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={canEdit ? 6 : 5} className="text-center text-muted py-4">
                                No tasks found in this project.
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </div>
    );
};

export default TaskTable;
