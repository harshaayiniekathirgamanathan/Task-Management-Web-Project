const db = require('../utils/db');
const bcrypt = require('bcryptjs');
const emailService = require('../utils/emailService');

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

const listUsers = async ({ search, role, active }) => {
    const where = [];
    const params = [];

    if (search) {
        params.push(`%${search}%`);
        where.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length})`);
    }
    if (role) {
        params.push(role);
        where.push(`role = $${params.length}`);
    }
    if (active !== undefined) {
        params.push(active);
        where.push(`is_active = $${params.length}`);
    }

    const sql =
        'SELECT id, name, email, role, is_active, created_at FROM users' +
        (where.length ? ` WHERE ${where.join(' AND ')}` : '');

    try {
        return await db.many(sql, params);
    } catch (err) {
        throw { status: 500, message: 'Failed to retrieve users' };
    }
};

// Users who can be assigned to tasks: active, non-admin, and never the caller.
// (Admins can't be assigned; project managers shouldn't see themselves.)
const listAssignableUsers = async ({ excludeUserId } = {}) => {
    const params = [];
    let sql =
        "SELECT id, name, email, role FROM users WHERE is_active = true AND role <> 'admin'";

    if (excludeUserId) {
        params.push(excludeUserId);
        sql += ` AND id <> $${params.length}`;
    }
    sql += ' ORDER BY name ASC';

    try {
        return await db.many(sql, params);
    } catch (err) {
        throw { status: 500, message: 'Failed to retrieve assignable users' };
    }
};

const createUser = async ({ name, email, role }) => {
    const normalizedEmail = normalizeEmail(email);

    const existingUser = await db.one('SELECT id FROM users WHERE email = $1', [
        normalizedEmail,
    ]);
    if (existingUser) {
        throw { status: 400, message: 'Email already exists' };
    }

    // Generate a random policy-compliant password
    const randPart = Math.random().toString(36).slice(-8);
    const digitPart = Math.floor(Math.random() * 10);
    const tempPassword = `Temp-${randPart}${digitPart}`;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    let newUser;
    try {
        newUser = await db.one(
            `INSERT INTO users (name, email, role, password_hash, is_active, must_reset_password)
             VALUES ($1, $2, $3, $4, true, true)
             RETURNING id, name, email, role, is_active, created_at, must_reset_password`,
            [name, normalizedEmail, role, passwordHash]
        );
    } catch (err) {
        throw { status: 500, message: 'Failed to create user' };
    }

    // The temporary password is only useful if the recipient receives it. Wait
    // for SMTP and roll back the user row if delivery fails immediately.
    try {
        await emailService.sendOnboardingEmail(normalizedEmail, name, tempPassword);
    } catch (err) {
        await db.query('DELETE FROM users WHERE id = $1', [newUser.id]);
        console.error(`Onboarding email to ${normalizedEmail} failed: ${err.message}`);
        throw {
            status: err.status || 502,
            message: 'User was not created because the onboarding email could not be sent. Check SMTP settings and try again.',
        };
    }

    // Return ONLY the user (contract: 201 {id,name,email,role,...}).
    // The temp password is intentionally NOT returned — it goes to the inbox.
    return newUser;
};

const updateUser = async (id, { name, role }) => {
    const sets = [];
    const params = [];
    if (name !== undefined) {
        params.push(name);
        sets.push(`name = $${params.length}`);
    }
    if (role !== undefined) {
        params.push(role);
        sets.push(`role = $${params.length}`);
    }
    sets.push('updated_at = NOW()');
    params.push(id);

    try {
        const updatedUser = await db.one(
            `UPDATE users SET ${sets.join(', ')} WHERE id = $${params.length}
             RETURNING id, name, email, role, is_active, created_at`,
            params
        );
        return updatedUser;
    } catch (err) {
        throw { status: 500, message: 'Failed to update user' };
    }
};

const deactivateUser = async (id) => {
    let deactivatedUser;
    try {
        deactivatedUser = await db.one(
            `UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1
             RETURNING id, name, email, role, is_active, created_at`,
            [id]
        );
    } catch (err) {
        throw { status: 500, message: 'Failed to deactivate user' };
    }

    // Force log out of all active sessions
    await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [id]);

    return deactivatedUser;
};

module.exports = {
    listUsers,
    listAssignableUsers,
    createUser,
    updateUser,
    deactivateUser,
};
