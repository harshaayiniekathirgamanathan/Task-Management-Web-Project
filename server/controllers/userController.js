const userService = require('../services/userService');

const listUsers = async (req, res) => {
    try {
        const { search, role, active } = req.query;
        let activeBool;
        if (active !== undefined) {
            activeBool = active === 'true';
        }

        const users = await userService.listUsers({ search, role, active: activeBool });
        res.json(users);
    } catch (error) {
        const status = error.status || 500;
        const message = error.message || 'Internal server error';
        res.status(status).json({ code: status, message });
    }
};

const listAssignableUsers = async (req, res) => {
    try {
        const users = await userService.listAssignableUsers({ excludeUserId: req.user.id });
        res.json(users);
    } catch (error) {
        const status = error.status || 500;
        const message = error.message || 'Internal server error';
        res.status(status).json({ code: status, message });
    }
};

const createUser = async (req, res) => {
    try {
        const { name, email, role } = req.body;
        const result = await userService.createUser({ name, email, role });
        res.status(201).json(result);
    } catch (error) {
        const status = error.status || 500;
        const message = error.message || 'Internal server error';
        res.status(status).json({ code: status, message });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, role } = req.body;
        const updatedUser = await userService.updateUser(id, { name, role });
        res.json(updatedUser);
    } catch (error) {
        const status = error.status || 500;
        const message = error.message || 'Internal server error';
        res.status(status).json({ code: status, message });
    }
};

const deactivateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const deactivatedUser = await userService.deactivateUser(id);
        res.json(deactivatedUser);
    } catch (error) {
        const status = error.status || 500;
        const message = error.message || 'Internal server error';
        res.status(status).json({ code: status, message });
    }
};

module.exports = {
    listUsers,
    listAssignableUsers,
    createUser,
    updateUser,
    deactivateUser
};
