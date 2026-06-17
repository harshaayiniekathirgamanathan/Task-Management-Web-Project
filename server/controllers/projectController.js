// GET /api/projects
// Returns empty array for now — we fill it in Step 3.2
async function listProjects(req, res) {
  return res.json([]);
}

module.exports = { listProjects };