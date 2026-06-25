import axiosClient from './axiosClient';

// GET /api/projects — fetch all projects the current user can see
export async function listProjects() {
    const response = await axiosClient.get('/api/projects');
    return response.data; // shape: { data: [...projects] }
}

// POST /api/projects — create a new project
// data: { title, description }
export async function createProject(data) {
    const response = await axiosClient.post('/api/projects', data);
    return response.data; // shape: { data: { ...newProject } }
}
