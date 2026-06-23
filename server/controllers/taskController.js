// List tasks placeholder
async function listTasks(req, res, next) {
    try {
        res.json([]);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    listTasks,
};
