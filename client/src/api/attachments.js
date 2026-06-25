import axiosClient from './axiosClient';

// GET /api/tasks/:taskId/attachments
export async function listAttachments(taskId) {
    const response = await axiosClient.get(`/api/tasks/${taskId}/attachments`);

    if (Array.isArray(response.data)) {
        return response.data;
    }

    return response.data.attachments || response.data.data || [];
}

// POST /api/tasks/:taskId/attachments
// The backend expects multipart/form-data with field name: file.
export async function uploadAttachment(taskId, file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosClient.post(
        `/api/tasks/${taskId}/attachments`,
        formData
    );

    return response.data.attachment || response.data;
}
