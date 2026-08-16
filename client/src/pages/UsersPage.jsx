import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Badge, Button, Form, InputGroup, Card, Spinner } from 'react-bootstrap';
import UserFormModal from '../components/UserFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import axiosClient from '../api/axiosClient';

const FALLBACK_USERS = [
  { id: '1', name: 'System Admin', email: 'admin@example.com', role: 'admin', is_active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: '2', name: 'Sarah Developer', email: 'sarah@example.com', role: 'member', is_active: true, created_at: '2026-01-10T00:00:00Z' },
  { id: '3', name: 'Marcus Manager', email: 'marcus@example.com', role: 'project_manager', is_active: false, created_at: '2026-02-01T00:00:00Z' },
];

export default function UsersPage() {
  const [users, setUsers] = useState(FALLBACK_USERS);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await axiosClient.get('/api/users');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setUsers(res.data);
      }
    } catch (err) {
      // Use fallback users if API isn't populated
    } finally {
      setLoading(false);
    }
  }

  function handleAddClick() {
    setSelectedUser(null);
    setShowModal(true);
  }

  function handleEditClick(user) {
    setSelectedUser(user);
    setShowModal(true);
  }

  async function handleSave(formValues) {
    if (selectedUser) {
      // Update existing
      setUsers(users.map((u) => u.id === selectedUser.id ? { ...u, ...formValues } : u));
    } else {
      // Add new
      const newUser = {
        id: String(Date.now()),
        ...formValues,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      setUsers([newUser, ...users]);
    }
  }

  function handleDeactivateClick(user) {
    setUserToDeactivate(user);
    setShowConfirm(true);
  }

  function handleConfirmDeactivate() {
    if (userToDeactivate) {
      setUsers(users.map((u) => u.id === userToDeactivate.id ? { ...u, is_active: !u.is_active } : u));
    }
    setShowConfirm(false);
    setUserToDeactivate(null);
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="py-2">
      {/* Heading */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h1 className="h2 fw-bold text-white mb-1">User Administration</h1>
          <p className="text-muted mb-0 small">Manage user access rights, workspace roles, and account statuses</p>
        </div>
        <Button 
          className="gradient-btn px-4 py-2 rounded-3 text-white fw-semibold shadow"
          onClick={handleAddClick}
        >
          + Add New User
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="glass-card p-3 mb-4 border-0">
        <Row className="g-3 align-items-center">
          <Col xs={12} md={7}>
            <Form.Group>
              <Form.Label className="small text-muted mb-1">Search Users</Form.Label>
              <Form.Control
                type="text"
                placeholder="Search by name or email address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col xs={12} md={5}>
            <Form.Group>
              <Form.Label className="small text-muted mb-1">Filter by Role</Form.Label>
              <Form.Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="admin">Administrator</option>
                <option value="project_manager">Project Manager</option>
                <option value="member">Member</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card className="glass-card border-0 overflow-hidden">
        <Table responsive className="table-dark-custom mb-0">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined Date</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="d-flex align-items-center gap-3">
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                      style={{
                        width: '38px',
                        height: '38px',
                        background: 'var(--gradient-primary)',
                        fontSize: '0.9rem'
                      }}
                    >
                      {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="fw-semibold text-white mb-0">{u.name}</div>
                      <div className="text-muted small">{u.email}</div>
                    </div>
                  </div>
                </td>

                <td>
                  <Badge 
                    className={`rounded-pill px-2.5 py-1 text-capitalize ${
                      u.role === 'admin' ? 'badge-indigo' : u.role === 'project_manager' ? 'badge-amber' : 'badge-emerald'
                    }`}
                  >
                    {u.role ? u.role.replace('_', ' ') : 'member'}
                  </Badge>
                </td>

                <td>
                  <Badge 
                    className={`rounded-pill px-2.5 py-1 ${
                      u.is_active ? 'badge-emerald' : 'badge-rose'
                    }`}
                  >
                    {u.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </td>

                <td className="text-muted small">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                </td>

                <td className="text-end">
                  <Button
                    variant="outline-light"
                    size="sm"
                    className="me-2 rounded-3 px-3 py-1 border-secondary border-opacity-30 small"
                    onClick={() => handleEditClick(u)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant={u.is_active ? 'outline-danger' : 'outline-success'}
                    size="sm"
                    className="rounded-3 px-3 py-1 border-opacity-30 small"
                    onClick={() => handleDeactivateClick(u)}
                  >
                    {u.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <UserFormModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        user={selectedUser}
      />

      <ConfirmDialog
        show={showConfirm}
        message={`Are you sure you want to ${userToDeactivate?.is_active ? 'deactivate' : 'activate'} ${userToDeactivate?.name}?`}
        onConfirm={handleConfirmDeactivate}
        onClose={() => setShowConfirm(false)}
      />
    </div>
  );
}
