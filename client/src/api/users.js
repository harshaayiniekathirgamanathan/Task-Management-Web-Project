import axiosClient from './axiosClient';

// GET /api/users — fetch users with optional filters
// params: { search, role }
export async function listUsers(params = {}) {
    const response = await axiosClient.get('/api/users', { params });
    return response.data; // shape: { data: [...users] }
}

// GET /api/users/assignable — users who can be assigned to tasks
// (active, non-admin, excluding the current user). Accessible to PM/admin.
export async function listAssignableUsers() {
    const response = await axiosClient.get('/api/users/assignable');

    if (Array.isArray(response.data)) {
        return response.data;
    }

    return response.data.data || [];
}

// POST /api/users — create a new user
// data: { name, email, role }
export async function createUser(data) {
    const response = await axiosClient.post('/api/users', data);
    return response.data; // shape: { data: { ...newUser } }
}

// PATCH /api/users/:id — update an existing user's name, email, or role
// data: { name, email, role }
export async function updateUser(id, data) {
    const response = await axiosClient.patch(`/api/users/${id}`, data);
    return response.data; // shape: { data: { ...updatedUser } }
}

// PATCH /api/users/:id/deactivate — mark a user as inactive
export async function deactivateUser(id) {
    const response = await axiosClient.patch(`/api/users/${id}/deactivate`);
    return response.data; // shape: { message: "User deactivated" }
}

// PATCH /api/users/:id/activate — mark a user as active
export async function activateUser(id) {
    const response = await axiosClient.patch(`/api/users/${id}/activate`);
    return response.data;
}
