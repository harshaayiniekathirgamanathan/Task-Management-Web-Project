// Controller for /api/projects — reads the request, calls the service,
// sends the response. No database code here (that lives in the service).
const projectService = require('../services/projectService');

// GET /api/projects -> list all projects (any logged-in user)
async function listProjects(req, res, next) {
  try {
    const projects = await projectService.listProjects();
    res.json(projects);
  } catch (err) {
    next(err);
  }
}

// POST /api/projects -> create a project (project_manager/admin only)
async function createProject(req, res, next) {
  try {
    const { title, description } = req.body;
    const project = await projectService.createProject({
      title,
      description,
      userId: req.user.id,
    });
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
}

// GET /api/projects/:id -> one project (any logged-in user)
async function getProject(req, res, next) {
  try {
    const project = await projectService.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ code: 404, message: 'Project not found' });
    }
    res.json(project);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/projects/:id -> update title/description (managers/admins only)
async function updateProject(req, res, next) {
  try {
    const { title, description } = req.body;
    const project = await projectService.updateProject(req.params.id, { title, description });
    if (!project) {
      return res.status(404).json({ code: 404, message: 'Project not found' });
    }
    res.json(project);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/projects/:id -> remove it (managers/admins only)
async function deleteProject(req, res, next) {
  try {
    const deleted = await projectService.deleteProject(req.params.id);
    if (!deleted) {
      return res.status(404).json({ code: 404, message: 'Project not found' });
    }
    res.status(204).end(); // 204 = success, no body
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
};