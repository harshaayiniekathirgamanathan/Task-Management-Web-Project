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

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    return (
        <div className="glass-card p-3 border-0 shadow">
            <Table responsive hover className="align-middle text-white mb-0">
                <thead>
                    <tr className="text-muted border-bottom border-secondary border-opacity-20">
                        <th>Title</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Due Date</th>
                        <th>Assignees</th>
                        {canEdit && <th className="text-end">Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {tasks.length > 0 ? (
                        tasks.map(task => (
                            <tr key={task.id} className="border-bottom border-secondary border-opacity-10">
                                <td className="fw-semibold text-white">{task.title}</td>
                                <td>
                                    <Badge bg={getPriorityVariant(task.priority)} className="px-2.5 py-1">
                                        {task.priority}
                                    </Badge>
                                </td>
                                <td>
                                    <Badge bg={getStatusVariant(task.status)} className="px-2.5 py-1">
                                        {task.status?.replace('_', ' ')}
                                    </Badge>
                                </td>
                                <td className="text-muted small">
                                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                                </td>
                                <td>
                                    {task.assignees && task.assignees.length > 0 ? (
                                        <div className="d-flex align-items-center gap-1">
                                            {task.assignees.map(a => (
                                                <div
                                                    key={a.id}
                                                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                                                    style={{
                                                        width: '28px',
                                                        height: '28px',
                                                        background: 'var(--gradient-primary)',
                                                        fontSize: '0.75rem'
                                                    }}
                                                    title={a.name}
                                                >
                                                    {getInitials(a.name)}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-muted small opacity-50">Unassigned</span>
                                    )}
                                </td>
                                {canEdit && (
                                    <td className="text-end">
                                        <Button
                                            variant="outline-info"
                                            size="sm"
                                            className="rounded-3 px-3 py-1 small"
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
