// Controller for /api/tasks — reads the request, calls the service,
// sends the response. No database code here (that lives in the service).
const taskService = require('../services/taskService');

// GET /api/tasks -> list tasks (scaffold: returns [] for now)
async function listTasks(req, res, next) {
  try {
    res.json([]);
  } catch (err) {
    next(err);
  }
}

// POST /api/tasks -> create a task (project_manager/admin only)
async function createTask(req, res, next) {
  try {
    const { project_id, title, description, priority, due_date, assignee_ids } = req.body;
    const task = await taskService.createTask({
      project_id,
      title,
      description,
      priority,
      due_date,
      assignee_ids,
      created_by: req.user.id, // who is logged in (set by authMiddleware)
    });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listTasks,
  createTask,
};