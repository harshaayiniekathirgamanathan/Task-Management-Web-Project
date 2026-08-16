const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbac');
const validate = require('../middleware/validate');

const GMAIL_ADDRESS_REGEX = /^[^@\s]+@gmail\.com$/i;

// Every user route requires login
router.use(authMiddleware);

/**
 * @swagger
 * /api/users/assignable:
 *   get:
 *     summary: List users who can be assigned to tasks (project_manager/admin only)
 *     description: >
 *       Returns active, non-admin users excluding the caller. Used to populate the
 *       assignee picker when creating or editing a task.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assignable users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    '/assignable',
    requireRole('project_manager', 'admin'),
    userController.listAssignableUsers
);

// The remaining user-management routes are admin-only
router.use(requireRole('admin'));

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List all users (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query for name or email (ilike match)
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, project_manager, collaborator]
 *         description: Filter by user role
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', userController.listUsers);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a user with a generated temporary password (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [admin, project_manager, collaborator]
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request / Email already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
    '/',
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('email')
            .trim()
            .isEmail().withMessage('Valid email is required')
            .bail()
            .custom((value) => {
                if (!GMAIL_ADDRESS_REGEX.test(value)) {
                    throw new Error('Email must be a valid @gmail.com address');
                }
                return true;
            })
            .customSanitizer((value) => value.toLowerCase()),
        body('role').isIn(['admin', 'project_manager', 'collaborator']).withMessage('Role must be admin, project_manager, or collaborator')
    ],
    validate,
    userController.createUser
);

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Update user name and/or role (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, project_manager, collaborator]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.patch(
    '/:id',
    [
        body('name').optional().notEmpty().withMessage('Name cannot be empty'),
        body('role').optional().isIn(['admin', 'project_manager', 'collaborator']).withMessage('Role must be admin, project_manager, or collaborator')
    ],
    validate,
    userController.updateUser
);

/**
 * @swagger
 * /api/users/{id}/deactivate:
 *   patch:
 *     summary: Deactivate a user (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.patch('/:id/deactivate', userController.deactivateUser);

/**
 * @swagger
 * /api/users/{id}/activate:
 *   patch:
 *     summary: Re-activate a user (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User re-activated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.patch('/:id/activate', userController.activateUser);

module.exports = router;
