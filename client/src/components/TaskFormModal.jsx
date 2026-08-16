import { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Form, Badge, Alert } from 'react-bootstrap';
import DeadlineCalendar from './DeadlineCalendar';
import { listAssignableUsers } from '../api/users';

const ROLE_LABEL = {
    project_manager: 'Project Manager',
    collaborator: 'Collaborator',
    admin: 'Administrator',
};

const TaskFormModal = ({ show, onClose, onSave, task, users = [] }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        assignees: [],
    });
    const [localUsers, setLocalUsers] = useState([]);
    const [validationError, setValidationError] = useState('');

    useEffect(() => {
        if (show) {
            if (users.length === 0) {
                listAssignableUsers()
                    .then(data => setLocalUsers(Array.isArray(data) ? data : data.data || []))
                    .catch(err => console.warn('Local assignees fetch error:', err));
            }
        }
    }, [show, users]);

    const activeUserList = users.length > 0 ? users : localUsers;

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

        if (activeUserList.length > 0 && selectedCount === 0) {
            setValidationError('Assign at least one team member to this task.');
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
        <Modal show={show} onHide={onClose} backdrop="static" size="lg" className="dark-modal">
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title className="text-white fw-bold">{task ? 'Edit Task & Assignees' : 'New Task'}</Modal.Title>
                </Modal.Header>

                <Modal.Body className="d-flex flex-column gap-3">
                    {validationError && (
                        <Alert variant="danger" className="py-2 bg-danger bg-opacity-25 text-white border-danger border-opacity-40 rounded-3 mb-0 small fw-medium">
                            {validationError}
                        </Alert>
                    )}

                    <Form.Group>
                        <Form.Label className="text-white fw-medium">Title</Form.Label>
                        <Form.Control
                            type="text"
                            name="title"
                            placeholder="e.g. Update user dashboard"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group>
                        <Form.Label className="text-white fw-medium">Description</Form.Label>
                        <Form.Control
                            as="textarea"
                            name="description"
                            rows={3}
                            placeholder="Describe task scope and requirements..."
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </Form.Group>

                    <Form.Group>
                        <Form.Label className="text-white fw-medium">Priority</Form.Label>
                        <Form.Select name="priority" value={formData.priority} onChange={handleChange}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </Form.Select>
                    </Form.Group>

                    {/* Deadline — integrated calendar */}
                    <Form.Group>
                        <Form.Label className="text-white fw-medium">Deadline (Due Date)</Form.Label>
                        <DeadlineCalendar
                            value={formData.due_date}
                            onChange={(date) =>
                                setFormData((prev) => ({ ...prev, due_date: date }))
                            }
                        />
                    </Form.Group>

                    {/* Assignees */}
                    <Form.Group className="mb-1">
                        <Form.Label className="d-flex align-items-center justify-content-between text-white fw-medium">
                            <span>
                                Select Assignees <span className="text-danger">*</span>
                            </span>
                            <Badge bg="indigo" className="badge-indigo">{selectedCount} selected</Badge>
                        </Form.Label>

                        {activeUserList.length === 0 ? (
                            <p className="text-muted small mb-0">
                                Loading team members...
                            </p>
                        ) : (
                            <div className="tm-assignee-list glass-card p-2 rounded-3 border-secondary border-opacity-20" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {activeUserList.map((user) => {
                                    const id = user.id.toString();
                                    const checked = formData.assignees.includes(id);
                                    return (
                                        <label
                                            key={user.id}
                                            className={`d-flex align-items-center gap-2 p-2 rounded-3 text-white cursor-pointer mb-1 ${checked ? 'bg-indigo bg-opacity-25 border border-indigo border-opacity-40' : 'hover-bg-secondary'}`}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <Form.Check
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleAssignee(user.id)}
                                                id={`assignee-${user.id}`}
                                                className="mb-0"
                                            />
                                            <span className="fw-semibold small">{user.name}</span>
                                            <span className="text-muted small">({user.email})</span>
                                            <Badge bg="secondary" className="ms-auto small">
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
                    <Button variant="outline-secondary" onClick={onClose} className="rounded-3">Cancel</Button>
                    <Button className="gradient-btn rounded-3" type="submit">Save Task</Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default TaskFormModal;
