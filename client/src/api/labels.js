import axiosClient from './axiosClient';

// GET /api/projects/:projectId/labels
export async function listLabels(projectId) {
    const response = await axiosClient.get(`/api/projects/${projectId}/labels`);

    if (Array.isArray(response.data)) {
        return response.data;
    }

    return response.data.labels || response.data.data || [];
}

// POST /api/projects/:projectId/labels
export async function createLabel(projectId, data) {
    const response = await axiosClient.post(
        `/api/projects/${projectId}/labels`,
        data
    );

    return response.data.label || response.data;
}

// POST /api/tasks/:taskId/labels/:labelId
export async function attachLabel(taskId, labelId) {
    const response = await axiosClient.post(
        `/api/tasks/${taskId}/labels/${labelId}`
    );

    return response.data;
}

// DELETE /api/tasks/:taskId/labels/:labelId
export async function removeLabel(taskId, labelId) {
    await axiosClient.delete(`/api/tasks/${taskId}/labels/${labelId}`);
}
