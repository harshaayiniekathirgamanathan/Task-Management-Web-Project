import axiosClient from './axiosClient';

// GET /api/notifications
// Gets the logged-in user's notifications, newest first.
export async function listNotifications() {
    const response = await axiosClient.get('/api/notifications');

    if (Array.isArray(response.data)) {
        return response.data;
    }

    return response.data.notifications || response.data.data || [];
}

// PATCH /api/notifications/:id/read
// Marks one notification as read.
export async function markRead(id) {
    const response = await axiosClient.patch(`/api/notifications/${id}/read`);
    return response.data;
}
