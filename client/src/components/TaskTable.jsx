import React, { useState } from 'react';
import { Table, Badge, Form, Row, Col } from 'react-bootstrap';

// Hard-coded tasks (we are duplicating the ones from the board for now)
const dummyTasks = [
    {
        id: 1, title: 'Setup Database', priority: 'high', status: 'todo', due_date: '2023-11-01',
        assignees: [{ id: 101, name: 'Alice Smith' }]
    },
    {
        id: 2, title: 'Design Login Page', priority: 'medium', status: 'todo', due_date: '2023-11-05',
        assignees: [{ id: 102, name: 'Bob Jones' }]
    },
    {
        id: 3, title: 'Build Auth API', priority: 'high', status: 'in_progress', due_date: '2023-10-25',
        assignees: [{ id: 101, name: 'Alice Smith' }]
    },
    {
        id: 4, title: 'Create Layout', priority: 'low', status: 'in_progress', due_date: '2023-11-10',
        assignees: [{ id: 103, name: 'Charlie Brown' }]
    },
    {
        id: 5, title: 'Initial Setup', priority: 'medium', status: 'completed', due_date: '2023-10-20',
        assignees: [{ id: 102, name: 'Bob Jones' }]
    }
];

const TaskTable = () => {
    // State for our filter dropdowns
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');

    // Filter the list of tasks before rendering them
    const filteredTasks = dummyTasks.filter(task => {
        // If filter is empty string (''), we match everything
        const matchesStatus = statusFilter === '' || task.status === statusFilter;
        const matchesPriority = priorityFilter === '' || task.priority === priorityFilter;
        return matchesStatus && matchesPriority;
    });

    // Small helpers for colors and initials
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

            {/* Filter Bar */}
            <Row className="mb-4">
                <Col xs={6} md={3}>
                    <Form.Group>
                        <Form.Label className="small text-muted fw-bold mb-1">Status</Form.Label>
                        <Form.Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
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
                        <Form.Label className="small text-muted fw-bold mb-1">Priority</Form.Label>
                        <Form.Select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
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

            {/* Task Table */}
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
                    {filteredTasks.length > 0 ? (
                        filteredTasks.map(task => (
                            <tr key={task.id}>
                                <td className="fw-medium">{task.title}</td>
                                <td>
                                    <Badge bg={getPriorityVariant(task.priority)}>
                                        {task.priority}
                                    </Badge>
                                </td>
                                <td>
                                    <Badge bg={getStatusVariant(task.status)}>
                                        {/* Replacing the underscore so "in_progress" looks nice */}
                                        {task.status.replace('_', ' ')}
                                    </Badge>
                                </td>
                                <td className="text-muted small">
                                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                                </td>
                                <td>
                                    {task.assignees?.map(a => (
                                        <span
                                            key={a.id}
                                            className="rounded-circle bg-secondary text-white d-inline-flex justify-content-center align-items-center me-1"
                                            style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}
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
                                No tasks match your filters.
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </div>
    );
};

export default TaskTable;
