import axiosClient from './axiosClient';

// GET /api/users — fetch a list of users with optional filters.
// params shape: { search: string, role: 'admin'|'member'|'', active: boolean|'' }
// Unused params are simply ignored by axios (it skips undefined values).
export async function listUsers(params = {}) {
    const response = await axiosClient.get('/api/users', { params });
    return response.data; // shape: { data: [ ...users ] }
}
