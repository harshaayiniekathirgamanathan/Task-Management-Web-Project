// Controller for /api/tasks — reads the request, calls the service,
// sends the response. No database code here (that lives in the service).
const taskService = require('../services/taskService');

// GET /api/tasks -> list tasks (with optional filters + sorting)
async function listTasks(req, res, next) {
  try {
    const { project_id, status, priority, assignee, sort } = req.query;
    const tasks = await taskService.listTasks({ project_id, status, priority, assignee, sort });
    res.json(tasks);
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
      created_by: req.user.id,
    });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

// GET /api/tasks/:id -> one full task (any logged-in user)
async function getTask(req, res, next) {
  try {
    const task = await taskService.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ code: 404, message: 'Task not found' });
    }
    res.json(task);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/tasks/:id -> update a task (project_manager/admin only)
async function updateTask(req, res, next) {
  try {
    const { title, description, priority, due_date, assignee_ids } = req.body;
    const task = await taskService.updateTask(req.params.id, {
      title,
      description,
      priority,
      due_date,
      assignee_ids,
    });
    if (!task) {
      return res.status(404).json({ code: 404, message: 'Task not found' });
    }
    res.json(task);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/tasks/:id/status -> change a task's status.
// Managers/admins on any task; collaborators only on tasks assigned to them.
async function updateTaskStatus(req, res, next) {
  try {
    const task = await taskService.updateTaskStatus(req.params.id, req.body.status, req.user);
    if (!task) {
      return res.status(404).json({ code: 404, message: 'Task not found' });
    }
    res.json(task);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listTasks,
  createTask,
  getTask,
  updateTask,
  updateTaskStatus,
};