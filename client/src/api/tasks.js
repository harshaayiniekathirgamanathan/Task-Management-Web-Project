import axiosClient from './axiosClient';

// GET /api/tasks — fetch tasks with optional filters
// params: { project_id, status, priority, assignee, sort }
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
