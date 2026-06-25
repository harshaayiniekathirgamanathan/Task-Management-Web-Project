import axiosClient from './axiosClient';

// Calls POST /api/auth/login with the user's credentials.
// Returns the full response data on success.
// Throws on failure — the caller handles it.
export async function login(email, password) {
    const response = await axiosClient.post('/api/auth/login', { email, password });
    return response.data; // shape: { user: {...}, accessToken: "..." }
}

// Calls POST /api/auth/change-password.
// The server validates strength — a 400 means the new password is too weak.
// Throws on failure — the caller handles it.
export async function changePassword(currentPassword, newPassword) {
    const response = await axiosClient.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
    });
    return response.data; // shape: { message: "Password changed successfully" }
}
