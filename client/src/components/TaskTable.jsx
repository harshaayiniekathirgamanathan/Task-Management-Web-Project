import { Table, Badge } from 'react-bootstrap';

const TaskTable = ({ tasks = [] }) => {
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
        if (!name) return '';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    return (
        <div className="bg-white p-3 rounded border">
            <Table responsive hover className="align-middle border-top">
                <thead className="table-light">
                    <tr>
                        <th>Title</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Due Date</th>
                        <th>Assignees</th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.length > 0 ? (
                        tasks.map(task => (
                            <tr key={task.id}>
                                <td className="fw-medium">{task.title}</td>
                                <td>
                                    <Badge bg={getPriorityVariant(task.priority)}>
                                        {task.priority}
                                    </Badge>
                                </td>
                                <td>
                                    <Badge bg={getStatusVariant(task.status)}>
                                        {task.status?.replace('_', ' ')}
                                    </Badge>
                                </td>
                                <td className="text-muted small">
                                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                                </td>
                                <td>
                                    {task.assignees?.map(a => (
                                        <span
                                            key={a.id}
                                            className="tm-avatar me-1"
                                            title={a.name}
                                        >
                                            {getInitials(a.name)}
                                        </span>
                                    ))}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" className="text-center text-muted py-4">
                                No tasks found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </div>
    );
};

export default TaskTable;
