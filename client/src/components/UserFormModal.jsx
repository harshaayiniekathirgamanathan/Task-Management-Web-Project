import { useState, useEffect } from 'react';
import { Alert, Modal, Form, Button } from 'react-bootstrap';

const GMAIL_ADDRESS_REGEX = /^[^@\s]+@gmail\.com$/i;

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
    const [validationError, setValidationError] = useState('');

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
        setValidationError('');
    }, [user, show]);

    function handleSave() {
        const trimmedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (!trimmedName) {
            setValidationError('Name is required.');
            return;
        }

        if (!isEditMode && !GMAIL_ADDRESS_REGEX.test(normalizedEmail)) {
            setValidationError('Use a valid @gmail.com address so the onboarding email can be delivered.');
            return;
        }

        onSave({ name: trimmedName, email: normalizedEmail, role });
    }

    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>{isEditMode ? 'Edit User' : 'Add User'}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {validationError && (
                    <Alert variant="danger" className="py-2">
                        {validationError}
                    </Alert>
                )}

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
                            placeholder="name@gmail.com"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setValidationError('');
                            }}
                            disabled={isEditMode}
                            isInvalid={!isEditMode && Boolean(email) && !GMAIL_ADDRESS_REGEX.test(email.trim())}
                        />
                        {!isEditMode && (
                            <>
                                <Form.Control.Feedback type="invalid">
                                    Email must be a valid @gmail.com address.
                                </Form.Control.Feedback>
                                <Form.Text className="text-muted">
                                    Onboarding emails are sent through the Gmail SMTP setup.
                                </Form.Text>
                            </>
                        )}
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
