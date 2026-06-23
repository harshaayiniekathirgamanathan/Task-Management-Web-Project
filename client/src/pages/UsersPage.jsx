import React, { useState } from 'react';
import {
    Container, Row, Col,
    Table, Badge, Button,
    Form, InputGroup
} from 'react-bootstrap';

// --- Hard-coded fake users matching the API contract ---
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

// Helper — pick a badge colour based on the role string
function roleBadgeVariant(role) {
    return role === 'admin' ? 'primary' : 'secondary';
}

export default function UsersPage() {
    // Search and filter state — no filtering logic yet, just controlled inputs
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    return (
        <Container className="py-4">
            {/* Page heading */}
            <h2 className="mb-4 fw-bold">Users</h2>

            {/* ---- Search + Filter bar ---- */}
            <Row className="mb-3 g-2 align-items-end">
                {/* Search box */}
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

                {/* Role filter */}
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

            {/* ---- Users Table ---- */}
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
                            {/* Name */}
                            <td className="align-middle">{u.name}</td>

                            {/* Email */}
                            <td className="align-middle">{u.email}</td>

                            {/* Role — shown as a coloured Badge */}
                            <td className="align-middle">
                                <Badge bg={roleBadgeVariant(u.role)} className="text-capitalize">
                                    {u.role}
                                </Badge>
                            </td>

                            {/* Active / Inactive status */}
                            <td className="align-middle">
                                {u.is_active
                                    ? <Badge bg="success">Active</Badge>
                                    : <Badge bg="danger">Inactive</Badge>
                                }
                            </td>

                            {/* Action buttons — no logic yet */}
                            <td className="align-middle">
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => { }} // wire up later
                                >
                                    Edit
                                </Button>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => { }} // wire up later
                                >
                                    Deactivate
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Container>
    );
}
