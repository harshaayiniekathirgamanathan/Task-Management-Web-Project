import axiosClient from './axiosClient';

// Calls POST /api/auth/login with the user's credentials.
// Returns the full response data on success.
// Throws an error (with the server's message) on failure — the caller handles it.
export async function login(email, password) {
    const response = await axiosClient.post('/api/auth/login', { email, password });
    return response.data; // shape: { user: {...}, accessToken: "..." }
}
