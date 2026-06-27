import { useState, useEffect, useCallback } from 'react';
import {
    Container, Row, Col,
    Table, Badge, Button,
    Form, InputGroup,
    Spinner, Alert
} from 'react-bootstrap';
import UserFormModal from '../components/UserFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { listUsers, createUser, updateUser, deactivateUser, activateUser } from '../api/users';

function roleBadgeVariant(role) {
    if (role === 'admin') return 'primary';
    if (role === 'project_manager') return 'info';
    return 'secondary';
}

function roleLabel(role) {
    if (role === 'admin') return 'Admin';
    if (role === 'project_manager') return 'Project Manager';
    if (role === 'collaborator') return 'Collaborator';
    return role;
}



const DEBOUNCE_MS = 400;

export default function UsersPage() {
    // --- Filter state ---
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    // --- Data state ---
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchErr, setFetchErr] = useState('');

    // --- Action feedback (success / action error) ---
    // Separate from fetchErr so banners don't clash
    const [actionMsg, setActionMsg] = useState('');  // success text
    const [actionErr, setActionErr] = useState('');  // error text
    const [actionLoading, setActionLoading] = useState(false);

    // --- UserFormModal state ---
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // --- ConfirmDialog state ---
    const [showConfirm, setShowConfirm] = useState(false);
    const [userToToggle, setUserToToggle] = useState(null);

    // ---- Fetch helpers ----
    const fetchUsers = useCallback(async (searchVal, roleVal) => {
        setLoading(true);
        setFetchErr('');
        try {
            const params = {
                search: searchVal || undefined,
                role: roleVal || undefined,
            };
            const data = await listUsers(params);
            // Handle both { data: [...] } and a bare array response shape
            const list = Array.isArray(data?.data) ? data.data
                : Array.isArray(data) ? data
                    : [];
            setUsers(list);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to load users. Please try again.';
            setFetchErr(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounced re-fetch whenever search or roleFilter change
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers(search, roleFilter);
        }, DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [search, roleFilter, fetchUsers]);

    // ---- Modal handlers ----
    function handleAddClick() {
        setSelectedUser(null);
        setActionMsg('');
        setActionErr('');
        setShowModal(true);
    }

    function handleEditClick(user) {
        setSelectedUser(user);
        setActionMsg('');
        setActionErr('');
        setShowModal(true);
    }

    function handleModalClose() {
        setShowModal(false);
        setSelectedUser(null);
    }

    // Called by UserFormModal's Save button
    async function handleSave(formValues) {
        setActionLoading(true);
        setActionMsg('');
        setActionErr('');
        try {
            if (selectedUser) {
                // Edit mode — PATCH the existing user
                await updateUser(selectedUser.id, formValues);
                setActionMsg(`User "${formValues.name}" updated successfully.`);
            } else {
                // Create mode — POST a new user
                await createUser(formValues);
                setActionMsg(`User "${formValues.name}" created successfully.`);
            }
            handleModalClose();
            fetchUsers(search, roleFilter); // refresh the table
        } catch (err) {
            // 400 usually means validation failure (e.g. duplicate email)
            // The server sends { code, message } — show that message
            const serverMsg = err.response?.data?.message || 'Action failed. Please try again.';
            setActionErr(serverMsg);
            // Keep the modal open so the user can correct the field
        } finally {
            setActionLoading(false);
        }
    }

    // ---- Activate/deactivate handlers ----
    function handleStatusClick(user) {
        setUserToToggle(user);
        setActionMsg('');
        setActionErr('');
        setShowConfirm(true);
    }

    async function handleConfirmStatusChange() {
        setShowConfirm(false);
        setActionLoading(true);
        try {
            if (userToToggle.is_active) {
                await deactivateUser(userToToggle.id);
                setActionMsg(`User "${userToToggle.name}" deactivated.`);
            } else {
                await activateUser(userToToggle.id);
                setActionMsg(`User "${userToToggle.name}" re-activated.`);
            }
            fetchUsers(search, roleFilter); // refresh the table
        } catch (err) {
            const action = userToToggle.is_active ? 'deactivate' : 're-activate';
            const serverMsg = err.response?.data?.message || `Could not ${action} user.`;
            setActionErr(serverMsg);
        } finally {
            setUserToToggle(null);
            setActionLoading(false);
        }
    }

    function handleConfirmClose() {
        setShowConfirm(false);
        setUserToToggle(null);
    }

    return (
        <Container className="py-4">
            {/* Heading + Add User button */}
            <Row className="mb-4 align-items-center">
                <Col>
                    <h2 className="fw-bold mb-0">Users</h2>
                </Col>
                <Col xs="auto">
                    <Button variant="primary" onClick={handleAddClick} disabled={actionLoading}>
                        + Add User
                    </Button>
                </Col>
            </Row>

            {/* Success banner — shown after a create / update / deactivate */}
            {actionMsg && (
                <Alert variant="success" onClose={() => setActionMsg('')} dismissible className="mb-3">
                    {actionMsg}
                </Alert>
            )}

            {/* Action error banner — server errors from create/update/deactivate */}
            {actionErr && (
                <Alert variant="danger" onClose={() => setActionErr('')} dismissible className="mb-3">
                    {actionErr}
                </Alert>
            )}

            {/* Fetch error banner — shown when the list GET fails */}
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
                        <InputGroup.Text>
                            <svg
                                width="15" height="15" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.3-4.3" />
                            </svg>
                        </InputGroup.Text>
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
                        <option value="">All roles</option>
                        <option value="admin">Admin</option>
                        <option value="project_manager">Project Manager</option>
                        <option value="collaborator">Collaborator</option>
                    </Form.Select>
                </Col>
            </Row>

            {/* Loading spinner */}
            {loading && (
                <div className="text-center my-5">
                    <Spinner animation="border" variant="primary" role="status">
                        <span className="visually-hidden">Loading…</span>
                    </Spinner>
                </div>
            )}

            {/* Table — only rendered when not loading and no fetch error */}
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
                        {(users ?? []).length === 0 ? (
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
                                        <Badge bg={roleBadgeVariant(u.role)}>{roleLabel(u.role)}</Badge>
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
                                            disabled={actionLoading}
                                        >
                                            Edit
                                        </Button>
                                        {u.is_active ? (
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleStatusClick(u)}
                                                disabled={actionLoading}
                                            >
                                                Deactivate
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline-success"
                                                size="sm"
                                                onClick={() => handleStatusClick(u)}
                                                disabled={actionLoading}
                                            >
                                                Re-activate
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            )}

            {/* UserFormModal — passes actionLoading so Save button disables too */}
            <UserFormModal
                show={showModal}
                onClose={handleModalClose}
                onSave={handleSave}
                user={selectedUser}
                loading={actionLoading}
            />

            {/* ConfirmDialog — shown before changing a user's active status */}
            <ConfirmDialog
                show={showConfirm}
                message={userToToggle?.is_active
                    ? `Deactivate "${userToToggle.name}"? They will no longer be able to log in.`
                    : `Re-activate "${userToToggle?.name}"? They will be able to log in again.`
                }
                onConfirm={handleConfirmStatusChange}
                onClose={handleConfirmClose}
            />
        </Container>
    );
}
