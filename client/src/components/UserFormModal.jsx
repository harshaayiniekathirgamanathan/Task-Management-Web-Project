import React, { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';

// Props:
//   show     — boolean, controls visibility
//   onClose  — function, called when the modal should close
//   onSave   — function(formValues), called when Save is clicked
//   user     — optional object; if present → edit mode, fields are pre-filled
export default function UserFormModal({ show, onClose, onSave, user }) {
    // Determine mode from whether a user was passed in
    const isEditMode = Boolean(user);

    // Controlled form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('member');

    // When the modal opens (or the user prop changes), pre-fill or reset the fields
    useEffect(() => {
        if (user) {
            // Edit mode — populate with the existing user's values
            setName(user.name);
            setEmail(user.email);
            setRole(user.role);
        } else {
            // Create mode — start with blank fields
            setName('');
            setEmail('');
            setRole('member');
        }
    }, [user, show]); // re-run whenever the modal opens or the target user changes

    function handleSave() {
        // Build the plain object to hand back to the parent
        const formValues = { name, email, role };

        // For now just log — parent will replace this with a real API call later
        console.log('UserFormModal saved:', formValues);

        onSave(formValues); // let the parent decide what to do with the values
        onClose();          // close the modal after saving
    }

    return (
        <Modal show={show} onHide={onClose} centered>
            {/* Title changes depending on mode */}
            <Modal.Header closeButton>
                <Modal.Title>{isEditMode ? 'Edit User' : 'Add User'}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Form onSubmit={(e) => e.preventDefault()}>
                    {/* Name */}
                    <Form.Group className="mb-3" controlId="modalUserName">
                        <Form.Label className="fw-semibold">Name</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </Form.Group>

                    {/* Email */}
                    <Form.Group className="mb-3" controlId="modalUserEmail">
                        <Form.Label className="fw-semibold">Email address</Form.Label>
                        <Form.Control
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </Form.Group>

                    {/* Role — dropdown select */}
                    <Form.Group className="mb-3" controlId="modalUserRole">
                        <Form.Label className="fw-semibold">Role</Form.Label>
                        <Form.Select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                        </Form.Select>
                    </Form.Group>
                </Form>
            </Modal.Body>

            <Modal.Footer>
                {/* Cancel — just close without saving */}
                <Button variant="secondary" onClick={onClose}>
                    Cancel
                </Button>

                {/* Save — hand values back to parent */}
                <Button variant="primary" onClick={handleSave}>
                    {isEditMode ? 'Save changes' : 'Add user'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
