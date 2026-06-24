import React from 'react';
import { Card, Badge, Dropdown } from 'react-bootstrap';

const TaskCard = ({ task, onOpen, onStatusChange }) => {
    // Helper to pick the right color for the priority badge
    const getPriorityVariant = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'danger';   // Red
            case 'medium': return 'warning'; // Yellow
            case 'low': return 'secondary';  // Grey
            default: return 'primary';       // Blue (fallback)
        }
    };

    // Helper to extract initials from a full name (e.g., "John Doe" -> "JD")
    const getInitials = (name) => {
        if (!name) return '';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    // Format the due date to look readable
    const formattedDate = task.due_date
        ? new Date(task.due_date).toLocaleDateString()
        : 'No due date';

    return (
        <Card
            className="mb-2 shadow-sm"
            style={{ cursor: 'pointer' }}
            onClick={() => onOpen(task)}
        >
            <Card.Body>
                {/* Top Row: Title and Priority Badge */}
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <Card.Title className="h6 mb-0">{task.title}</Card.Title>
                    <Badge bg={getPriorityVariant(task.priority)}>
                        {task.priority || 'None'}
                    </Badge>
                </div>

                {/* Middle Row: Labels */}
                {task.labels && task.labels.length > 0 && (
                    <div className="mb-3">
                        {task.labels.map(label => (
                            <Badge
                                key={label.id}
                                // We use inline style here in case 'color' is a hex code like '#ff0000'
                                style={{ backgroundColor: label.color || '#6c757d' }}
                                className="me-1 text-white"
                            >
                                {label.name}
                            </Badge>
                        ))}
                    </div>
                )}
                {/* Status dropdown */}
                <Dropdown
                    className="mb-3"
                    onClick={(event) => event.stopPropagation()}
                    onSelect={(newStatus) => onStatusChange(task.id, newStatus)}
                >
                    <Dropdown.Toggle variant="outline-primary" size="sm">
                        Change Status
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                        <Dropdown.Item eventKey="todo">To Do</Dropdown.Item>
                        <Dropdown.Item eventKey="in_progress">In Progress</Dropdown.Item>
                        <Dropdown.Item eventKey="completed">Completed</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>

                {/* Bottom Row: Due Date and Assignee Initials */}
                <div className="d-flex justify-content-between align-items-end">
                    <small className="text-muted">
                        {formattedDate}
                    </small>

                    <div>
                        {task.assignees && task.assignees.map(assignee => (
                            <span
                                key={assignee.id}
                                className="rounded-circle bg-secondary text-white d-inline-flex justify-content-center align-items-center ms-1"
                                style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}
                                title={assignee.name} // Shows full name when you hover over the initials
                            >
                                {getInitials(assignee.name)}
                            </span>
                        ))}
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

export default TaskCard;
