import React, { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';

export default function UserFormModal({ show, onClose, onSave, user }) {
  const isEditMode = Boolean(user);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setRole(user.role || 'member');
    } else {
      setName('');
      setEmail('');
      setRole('member');
    }
  }, [user, show]);

  function handleSave() {
    onSave({ name, email, role });
    onClose();
  }

  return (
    <Modal show={show} onHide={onClose} centered className="dark-modal">
      <Modal.Header closeButton>
        <Modal.Title className="h5 text-white fw-bold">
          {isEditMode ? 'Edit User Credentials' : 'Add New Workspace Member'}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="d-flex flex-column gap-3">
        <Form onSubmit={(e) => e.preventDefault()}>
          <Form.Group className="mb-3" controlId="modalUserName">
            <Form.Label>Full Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="modalUserEmail">
            <Form.Label>Email Address</Form.Label>
            <Form.Control
              type="email"
              placeholder="jane@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isEditMode}
              required
            />
          </Form.Group>

          <Form.Group controlId="modalUserRole">
            <Form.Label>Workspace Role</Form.Label>
            <Form.Select
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="member">Member</option>
              <option value="project_manager">Project Manager</option>
              <option value="admin">Administrator</option>
            </Form.Select>
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose} className="rounded-3">
          Cancel
        </Button>
        <Button className="gradient-btn rounded-3" onClick={handleSave}>
          {isEditMode ? 'Save Changes' : 'Create User'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
