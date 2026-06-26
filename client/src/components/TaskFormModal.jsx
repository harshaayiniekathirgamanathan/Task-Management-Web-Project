import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Form, Badge, Alert } from 'react-bootstrap';
import DeadlineCalendar from './DeadlineCalendar';

const ROLE_LABEL = {
    project_manager: 'Project Manager',
    collaborator: 'Collaborator',
};

const TaskFormModal = ({ show, onClose, onSave, task, users = [] }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        assignees: [],
    });
    const [validationError, setValidationError] = useState('');

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                priority: task.priority || 'medium',
                due_date: task.due_date ? task.due_date.split('T')[0] : '',
                assignees: task.assignees ? task.assignees.map((a) => a.id.toString()) : [],
            });
        } else {
            setFormData({
                title: '',
                description: '',
                priority: 'medium',
                due_date: '',
                assignees: [],
            });
        }
        setValidationError('');
    }, [task, show]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const toggleAssignee = (userId) => {
        const id = userId.toString();
        setFormData((prev) => {
            const has = prev.assignees.includes(id);
            return {
                ...prev,
                assignees: has
                    ? prev.assignees.filter((a) => a !== id)
                    : [...prev.assignees, id],
            };
        });
        setValidationError('');
    };

    const selectedCount = formData.assignees.length;

    // Build the payload the API expects, sending the deadline as end-of-day so
    // a deadline picked for *today* isn't rejected as "in the past".
    const buildDueDate = useMemo(
        () => (dateStr) => (dateStr ? `${dateStr}T23:59:59` : null),
        []
    );

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            setValidationError('Please enter a task title.');
            return;
        }
        // Issue #5 — a task must have at least one assignee. The list only
        // contains collaborators and project managers, so this also satisfies
        // "at least one collaborator or project manager".
        if (selectedCount === 0) {
            setValidationError('Assign at least one collaborator or project manager.');
            return;
        }

        onSave({
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
            due_date: buildDueDate(formData.due_date),
            assignees: formData.assignees,
        });
    };

    return (
        <Modal show={show} onHide={onClose} backdrop="static" size="lg">
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>{task ? 'Edit Task' : 'New Task'}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {validationError && (
                        <Alert variant="danger" className="py-2">{validationError}</Alert>
                    )}

                    <Form.Group className="mb-3">
                        <Form.Label>Title</Form.Label>
                        <Form.Control
                            type="text"
                            name="title"
                            placeholder="e.g. Update user dashboard"
                            value={formData.title}
                            onChange={handleChange}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                            as="textarea"
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Priority</Form.Label>
                        <Form.Select name="priority" value={formData.priority} onChange={handleChange}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </Form.Select>
                    </Form.Group>

                    {/* Deadline — integrated calendar */}
                    <Form.Group className="mb-3">
                        <Form.Label>Deadline</Form.Label>
                        <DeadlineCalendar
                            value={formData.due_date}
                            onChange={(date) =>
                                setFormData((prev) => ({ ...prev, due_date: date }))
                            }
                        />
                    </Form.Group>

                    {/* Assignees — required; admins and the current user are not shown */}
                    <Form.Group className="mb-1">
                        <Form.Label className="d-flex align-items-center justify-content-between">
                            <span>
                                Assignees <span className="text-danger">*</span>
                            </span>
                            <Badge bg="secondary">{selectedCount} selected</Badge>
                        </Form.Label>

                        {users.length === 0 ? (
                            <p className="text-muted small mb-0">
                                No assignable team members available.
                            </p>
                        ) : (
                            <div className="tm-assignee-list">
                                {users.map((user) => {
                                    const id = user.id.toString();
                                    const checked = formData.assignees.includes(id);
                                    return (
                                        <label
                                            key={user.id}
                                            className={`tm-assignee-row ${checked ? 'is-selected' : ''}`}
                                        >
                                            <Form.Check
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleAssignee(user.id)}
                                                id={`assignee-${user.id}`}
                                            />
                                            <span className="tm-assignee-name">{user.name}</span>
                                            <Badge bg="secondary" className="ms-auto">
                                                {ROLE_LABEL[user.role] || user.role}
                                            </Badge>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </Form.Group>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" type="submit">Save Task</Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default TaskFormModal;
