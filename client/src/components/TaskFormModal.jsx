import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

// Fake users list just for our dropdown testing
const FAKE_USERS = [
    { id: 101, name: 'Alice Smith' },
    { id: 102, name: 'Bob Jones' },
    { id: 103, name: 'Charlie Brown' }
];

const TaskFormModal = ({ show, onClose, onSave, task }) => {
    // State to hold everything the user types
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        assignees: [] // This will store an array of user IDs
    });

    // Whenever the modal opens (show changes) or the task changes (edit mode), reset the form
    useEffect(() => {
        if (task) {
            // Edit mode: fill it with the existing task's data
            setFormData({
                title: task.title || '',
                description: task.description || '',
                priority: task.priority || 'medium',
                due_date: task.due_date ? task.due_date.split('T')[0] : '', // format nicely for the date picker
                assignees: task.assignees ? task.assignees.map(a => a.id.toString()) : []
            });
        } else {
            // New task mode: start totally fresh
            setFormData({
                title: '',
                description: '',
                priority: 'medium',
                due_date: '',
                assignees: []
            });
        }
    }, [task, show]);

    // Handle standard text/date inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle the multi-select dropdown which is slightly different
    const handleAssigneesChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions).map(opt => opt.value);
        setFormData(prev => ({ ...prev, assignees: selectedOptions }));
    };

    // What to do when they click "Save"
    const handleSubmit = (e) => {
        e.preventDefault(); // Stop the page from reloading
        console.log("Form submitted with data:", formData);
        onSave(formData);
    };

    return (
        <Modal show={show} onHide={onClose} backdrop="static">
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>{task ? 'Edit Task' : 'New Task'}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {/* Title */}
                    <Form.Group className="mb-3">
                        <Form.Label>Title</Form.Label>
                        <Form.Control
                            type="text"
                            name="title"
                            required
                            placeholder="e.g. Update user dashboard"
                            value={formData.title}
                            onChange={handleChange}
                        />
                    </Form.Group>

                    {/* Description */}
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

                    {/* Priority */}
                    <Form.Group className="mb-3">
                        <Form.Label>Priority</Form.Label>
                        <Form.Select name="priority" value={formData.priority} onChange={handleChange}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </Form.Select>
                    </Form.Group>

                    {/* Due Date */}
                    <Form.Group className="mb-3">
                        <Form.Label>Due Date</Form.Label>
                        <Form.Control
                            type="date"
                            name="due_date"
                            value={formData.due_date}
                            onChange={handleChange}
                        />
                    </Form.Group>

                    {/* Assignees */}
                    <Form.Group className="mb-3">
                        <Form.Label>Assignees <small className="text-muted">(Hold Ctrl/Cmd to pick multiple)</small></Form.Label>
                        <Form.Select
                            multiple
                            name="assignees"
                            value={formData.assignees}
                            onChange={handleAssigneesChange}
                        >
                            {FAKE_USERS.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.name}
                                </option>
                            ))}
                        </Form.Select>
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
