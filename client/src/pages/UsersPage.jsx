import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Row, Col,
    Table, Badge, Button,
    Form, InputGroup,
    Spinner, Alert
} from 'react-bootstrap';
import UserFormModal from '../components/UserFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { listUsers } from '../api/users'; // <-- real API call

// roleBadgeVariant — pick a badge colour based on the role string
function roleBadgeVariant(role) {
    return role === 'admin' ? 'primary' : 'secondary';
}

// DEBOUNCE_MS — how long to wait after the user stops typing before fetching
const DEBOUNCE_MS = 400;

export default function UsersPage() {
    // --- Filter state (drives the API call) ---
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    // --- Data state ---
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchErr, setFetchErr] = useState('');

    // --- UserFormModal state ---
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // --- ConfirmDialog state ---
    const [showConfirm, setShowConfirm] = useState(false);
    const [userToDeactivate, setUserToDeactivate] = useState(null);

    // fetchUsers — calls the API and updates state
    // Wrapped in useCallback so the debounced effect can depend on it safely
    const fetchUsers = useCallback(async (searchVal, roleVal) => {
        setLoading(true);
        setFetchErr('');
        try {
            // Only send role param if one is actually selected
            const params = {
                search: searchVal || undefined,
                role: roleVal || undefined,
            };
            const data = await listUsers(params);
            setUsers(data.data); // API returns { data: [...] }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to load users. Please try again.';
            setFetchErr(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounced effect — waits DEBOUNCE_MS after search/role changes before fetching.
    // This prevents a request on every single keystroke.
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers(search, roleFilter);
        }, DEBOUNCE_MS);

        // Cleanup: cancel the previous timer if the user types again before it fires
        return () => clearTimeout(timer);
    }, [search, roleFilter, fetchUsers]);

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
        // TODO: replace with real createUser / updateUser API call
        console.log('Saving user:', formValues);
        // Re-fetch the list so the table stays in sync
        fetchUsers(search, roleFilter);
    }

    function handleModalClose() {
        setShowModal(false);
        setSelectedUser(null);
    }

    // ---- ConfirmDialog handlers ----
    function handleDeactivateClick(user) {
        setUserToDeactivate(user);
        setShowConfirm(true);
    }

    function handleConfirmDeactivate() {
        // TODO: replace with real deactivateUser API call
        console.log('Deactivating user:', userToDeactivate);
        setShowConfirm(false);
        setUserToDeactivate(null);
        // Re-fetch so the status badge updates
        fetchUsers(search, roleFilter);
    }

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

            {/* Error banner — shown when the fetch failed */}
            {fetchErr && (
                <Alert variant="danger" onClose={() => setFetchErr('')} dismissible className="mb-3">
                    {fetchErr}
                </Alert>
            )}

            {/* Search + Role filter bar */}
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
                            // Updating state triggers the debounced useEffect
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </InputGroup>
                </Col>

                <Col xs={12} md={3}>
                    <Form.Label className="fw-semibold">Role</Form.Label>
                    <Form.Select
                        id="roleFilter"
                        value={roleFilter}
                        // Changing role fires immediately (no debounce needed for a dropdown)
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="">All roles</option>
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                    </Form.Select>
                </Col>
            </Row>

            {/* Loading spinner — centred, shown while fetch is in-flight */}
            {loading && (
                <div className="text-center my-5">
                    <Spinner animation="border" variant="primary" role="status">
                        <span className="visually-hidden">Loading…</span>
                    </Spinner>
                </div>
            )}

            {/* Table — only shown when not loading and no error */}
            {!loading && !fetchErr && (
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
                        {users.length === 0 ? (
                            // Empty state — no results for the current filters
                            <tr>
                                <td colSpan={5} className="text-center text-muted py-4">
                                    No users found.
                                </td>
                            </tr>
                        ) : (
                            users.map((u) => (
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
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => handleDeactivateClick(u)}
                                        >
                                            Deactivate
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            )}

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
