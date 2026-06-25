import axiosClient from './axiosClient';

// GET /api/tasks/:taskId/comments
export async function listComments(taskId) {
    const response = await axiosClient.get(`/api/tasks/${taskId}/comments`);

    if (Array.isArray(response.data)) {
        return response.data;
    }

    return response.data.comments || response.data.data || [];
}

// POST /api/tasks/:taskId/comments
export async function addComment(taskId, content) {
    const response = await axiosClient.post(`/api/tasks/${taskId}/comments`, {
        content
    });

    return response.data.comment || response.data;
}
