// Controller for /api/projects — reads the request, calls the service,
// sends the response. No database code here (that lives in the service).
const projectService = require('../services/projectService');

// GET /api/projects -> list all projects (any logged-in user)
async function listProjects(req, res, next) {
  try {
    const projects = await projectService.listProjects();
    res.json(projects);
  } catch (err) {
    next(err); // errorHandler turns this into JSON { code, message }
  }
}

// POST /api/projects -> create a project (project_manager/admin only)
async function createProject(req, res, next) {
  try {
    const { title, description } = req.body;
    const project = await projectService.createProject({
      title,
      description,
      userId: req.user.id, // who is logged in (set by authMiddleware)
    });
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProjects,
  createProject,
};