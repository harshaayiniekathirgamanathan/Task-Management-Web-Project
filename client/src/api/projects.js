import axiosClient from './axiosClient';

// GET /api/projects — fetch all projects the current user can see
export async function listProjects() {
    const response = await axiosClient.get('/api/projects');
    return response.data; // shape: { data: [...projects] }
}

// GET /api/projects/:id — fetch a single project (with creator + progress)
export async function getProject(id) {
    const response = await axiosClient.get(`/api/projects/${id}`);
    return response.data;
}

// POST /api/projects — create a new project
// data: { title, description }
export async function createProject(data) {
    const response = await axiosClient.post('/api/projects', data);
    return response.data; // shape: { data: { ...newProject } }
}
