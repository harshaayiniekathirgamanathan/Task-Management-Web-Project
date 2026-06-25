import React, { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';

// Props:
//   show     — boolean
//   onClose  — function
//   onSave   — async function(formValues) — parent handles the API call
//   user     — optional object; present = edit mode
//   loading  — boolean; disables the Save button while the API call is in-flight
export default function UserFormModal({ show, onClose, onSave, user, loading = false }) {
    const isEditMode = Boolean(user);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('collaborator');

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
            setRole(user.role);
        } else {
            setName('');
            setEmail('');
            setRole('collaborator');
        }
    }, [user, show]);

    function handleSave() {
        onSave({ name, email, role }); // parent does the API call and closes on success
    }

    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>{isEditMode ? 'Edit User' : 'Add User'}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Form onSubmit={(e) => e.preventDefault()}>
                    <Form.Group className="mb-3" controlId="modalUserName">
                        <Form.Label className="fw-semibold">Name</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="modalUserEmail">
                        <Form.Label className="fw-semibold">Email address</Form.Label>
                        <Form.Control
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isEditMode}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="modalUserRole">
                        <Form.Label className="fw-semibold">Role</Form.Label>
                        <Form.Select value={role} onChange={(e) => setRole(e.target.value)}>
                            <option value="collaborator">Collaborator</option>
                            <option value="project_manager">Project Manager</option>
                            <option value="admin">Admin</option>
                        </Form.Select>
                    </Form.Group>
                </Form>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                {/* Disabled + text changes while the save request is in-flight */}
                <Button variant="primary" onClick={handleSave} disabled={loading}>
                    {loading ? 'Saving…' : (isEditMode ? 'Save changes' : 'Add user')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
