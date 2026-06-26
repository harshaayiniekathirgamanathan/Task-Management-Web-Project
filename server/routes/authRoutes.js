const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const authMiddleware = require('../middleware/authMiddleware');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  // Max login attempts per IP per window. 10 was too low for demos/testing with
  // several accounts; configurable via env so production can tighten it.
  max: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      code: 429,
      message: 'Too many attempts, try later'
    });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in a user and issue tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns tokens and user info
 *       400:
 *         description: Bad request / validation failure
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many attempts
 */
router.post(
  '/login',
  loginLimiter,
  [
    body('email')
      .isEmail()
      .withMessage('Valid email is required'),

    body('password')
      .notEmpty()
      .withMessage('Password must not be empty')
  ],
  validate,
  authController.login
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token using cookie-stored refresh token (with rotation)
 *     responses:
 *       200:
 *         description: New access token and rotated refresh token cookie
 *       401:
 *         description: Invalid, expired, or already used refresh token
 */
router.post('/refresh', authController.refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log out the user and revoke refresh token
 *     responses:
 *       204:
 *         description: Successfully logged out
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change user password (protected)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Bad request / policy failure / incorrect current password
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/change-password',
  authMiddleware,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number')
  ],
  validate,
  authController.changePassword
);

module.exports = router;
