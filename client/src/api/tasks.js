import axiosClient from './axiosClient';

// GET /api/tasks
// params can include: project_id, status, priority, assignee, sort
export async function listTasks(params = {}) {
    const response = await axiosClient.get('/api/tasks', { params });

    if (Array.isArray(response.data)) {
        return response.data;
    }

    if (Array.isArray(response.data.tasks)) {
        return response.data.tasks;
    }

    if (Array.isArray(response.data.data)) {
        return response.data.data;
    }

    return [];
}

// POST /api/tasks
// data: { project_id, title, description, priority, due_date, assignee_ids }
export async function createTask(data) {
    const response = await axiosClient.post('/api/tasks', data);
    return response.data;
}

// PATCH /api/tasks/:id
// data: { title, description, priority, due_date, assignee_ids }
export async function updateTask(id, data) {
    const response = await axiosClient.patch(`/api/tasks/${id}`, data);
    return response.data;
}

// PATCH /api/tasks/:id/status
// status: "todo", "in_progress", or "completed"
export async function changeStatus(id, status) {
    const response = await axiosClient.patch(`/api/tasks/${id}/status`, {
        status
    });

    return response.data;
}