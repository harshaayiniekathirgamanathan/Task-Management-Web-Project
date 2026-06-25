import React, { useState } from 'react';
import {
    Container, Row, Col,
    Table, Badge, Button,
    Form, InputGroup
} from 'react-bootstrap';
import UserFormModal from '../components/UserFormModal';
import ConfirmDialog from '../components/ConfirmDialog'; // <-- new import

const FAKE_USERS = [
    {
        id: '1',
        name: 'Alice Admin',
        email: 'alice@example.com',
        role: 'admin',
        is_active: true,
        created_at: '2024-01-10T08:00:00Z',
    },
    {
        id: '2',
        name: 'Bob Member',
        email: 'bob@example.com',
        role: 'member',
        is_active: true,
        created_at: '2024-02-15T09:30:00Z',
    },
    {
        id: '3',
        name: 'Carol Inactive',
        email: 'carol@example.com',
        role: 'member',
        is_active: false,
        created_at: '2024-03-20T14:00:00Z',
    },
];

function roleBadgeVariant(role) {
    return role === 'admin' ? 'primary' : 'secondary';
}

export default function UsersPage() {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    // --- UserFormModal state ---
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // --- ConfirmDialog state ---
    const [showConfirm, setShowConfirm] = useState(false);
    const [userToDeactivate, setUserToDeactivate] = useState(null); // which user was clicked

    // ---- UserFormModal handlers ----
    function handleAddClick() {
        setSelectedUser(null);
        setShowModal(true);
    }

    function handleEditClick(user) {
        setSelectedUser(user);
        setShowModal(true);
    }

    function handleSave(formValues) {
        console.log('Saving user:', formValues);
    }

    function handleModalClose() {
        setShowModal(false);
        setSelectedUser(null);
    }

    // ---- ConfirmDialog handlers ----

    // Clicking Deactivate sets the target and opens the dialog
    function handleDeactivateClick(user) {
        setUserToDeactivate(user);
        setShowConfirm(true);
    }

    // User clicked Confirm inside the dialog
    function handleConfirmDeactivate() {
        // For now just log — replace with API call later
        console.log('Deactivating user:', userToDeactivate);
        setShowConfirm(false);
        setUserToDeactivate(null);
    }

    // User cancelled the dialog
    function handleConfirmClose() {
        setShowConfirm(false);
        setUserToDeactivate(null);
    }

    return (
        <Container className="py-4">
            {/* Heading + Add User button */}
            <Row className="mb-4 align-items-center">
                <Col>
                    <h2 className="fw-bold mb-0">Users</h2>
                </Col>
                <Col xs="auto">
                    <Button variant="primary" onClick={handleAddClick}>
                        + Add User
                    </Button>
                </Col>
            </Row>

            {/* Search + Filter bar */}
            <Row className="mb-3 g-2 align-items-end">
                <Col xs={12} md={6}>
                    <Form.Label className="fw-semibold">Search</Form.Label>
                    <InputGroup>
                        <InputGroup.Text>🔍</InputGroup.Text>
                        <Form.Control
                            id="userSearch"
                            type="text"
                            placeholder="Search by name or email…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </InputGroup>
                </Col>

                <Col xs={12} md={3}>
                    <Form.Label className="fw-semibold">Role</Form.Label>
                    <Form.Select
                        id="roleFilter"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="all">All roles</option>
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                    </Form.Select>
                </Col>
            </Row>

            {/* Users Table */}
            <Table striped bordered hover responsive className="shadow-sm">
                <thead className="table-dark">
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {FAKE_USERS.map((u) => (
                        <tr key={u.id}>
                            <td className="align-middle">{u.name}</td>
                            <td className="align-middle">{u.email}</td>

                            <td className="align-middle">
                                <Badge bg={roleBadgeVariant(u.role)} className="text-capitalize">
                                    {u.role}
                                </Badge>
                            </td>

                            <td className="align-middle">
                                {u.is_active
                                    ? <Badge bg="success">Active</Badge>
                                    : <Badge bg="danger">Inactive</Badge>
                                }
                            </td>

                            <td className="align-middle">
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => handleEditClick(u)}
                                >
                                    Edit
                                </Button>

                                {/* Now opens the confirm dialog instead of doing nothing */}
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleDeactivateClick(u)}
                                >
                                    Deactivate
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {/* UserFormModal — create or edit */}
            <UserFormModal
                show={showModal}
                onClose={handleModalClose}
                onSave={handleSave}
                user={selectedUser}
            />

            {/* ConfirmDialog — shown before deactivating */}
            <ConfirmDialog
                show={showConfirm}
                message={`Deactivate this user (${userToDeactivate?.name})?`}
                onConfirm={handleConfirmDeactivate}
                onClose={handleConfirmClose}
            />
        </Container>
    );
}
