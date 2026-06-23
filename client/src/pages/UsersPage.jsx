import React, { useState } from 'react';
import {
    Container, Row, Col,
    Table, Badge, Button,
    Form, InputGroup
} from 'react-bootstrap';
import UserFormModal from '../components/UserFormModal'; // <-- new import

// Hard-coded fake users matching the API contract
// Shape: { id, name, email, role, is_active, created_at }
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
    // Search and filter state — no filtering logic yet
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null); // null = create mode

    // Open in CREATE mode — no user pre-selected
    function handleAddClick() {
        setSelectedUser(null);
        setShowModal(true);
    }

    // Open in EDIT mode — pass the clicked user row
    function handleEditClick(user) {
        setSelectedUser(user);
        setShowModal(true);
    }

    // Called by the modal's Save button
    function handleSave(formValues) {
        // For now just log — will be replaced by an API call later
        console.log('Saving user:', formValues);
        // Modal closes itself after calling onSave
    }

    function handleClose() {
        setShowModal(false);
        setSelectedUser(null); // reset so next open starts fresh
    }

    return (
        <Container className="py-4">
            {/* Page heading + Add User button */}
            <Row className="mb-4 align-items-center">
                <Col>
                    <h2 className="fw-bold mb-0">Users</h2>
                </Col>
                <Col xs="auto">
                    {/* Opens the modal in create mode */}
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
                                {/* Opens the modal pre-filled with this user's data */}
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => handleEditClick(u)}
                                >
                                    Edit
                                </Button>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => { }} // wire up deactivate later
                                >
                                    Deactivate
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {/* The modal — rendered once, shown/hidden via the show prop */}
            <UserFormModal
                show={showModal}
                onClose={handleClose}
                onSave={handleSave}
                user={selectedUser}  // null → create mode, object → edit mode
            />
        </Container>
    );
}
