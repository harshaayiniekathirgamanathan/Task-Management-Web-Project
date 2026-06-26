const supabase = require('../utils/supabase');
const bcrypt = require('bcryptjs');
const emailService = require('../utils/emailService');

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

const listUsers = async ({ search, role, active }) => {
    let query = supabase
        .from('users')
        .select('id, name, email, role, is_active, created_at');

    if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (role) {
        query = query.eq('role', role);
    }

    if (active !== undefined) {
        query = query.eq('is_active', active);
    }

    const { data: users, error } = await query;

    if (error) {
        throw { status: 500, message: 'Failed to retrieve users' };
    }

    return users;
};

// Users who can be assigned to tasks: active, non-admin, and never the caller.
// (Admins can't be assigned; project managers shouldn't see themselves.)
const listAssignableUsers = async ({ excludeUserId } = {}) => {
    let query = supabase
        .from('users')
        .select('id, name, email, role')
        .eq('is_active', true)
        .neq('role', 'admin')
        .order('name', { ascending: true });

    if (excludeUserId) {
        query = query.neq('id', excludeUserId);
    }

    const { data: users, error } = await query;

    if (error) {
        throw { status: 500, message: 'Failed to retrieve assignable users' };
    }

    return users;
};

const createUser = async ({ name, email, role }) => {
    const normalizedEmail = normalizeEmail(email);

    const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', normalizedEmail)
        .single();

    if (existingUser) {
        throw { status: 400, message: 'Email already exists' };
    }

    // Generate a random policy-compliant password
    const randPart = Math.random().toString(36).slice(-8);
    const digitPart = Math.floor(Math.random() * 10);
    const tempPassword = `Temp-${randPart}${digitPart}`;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    const { data: newUser, error } = await supabase
        .from('users')
        .insert([
            {
                name,
                email: normalizedEmail,
                role,
                password_hash: passwordHash,
                is_active: true,
                must_reset_password: true
            }
        ])
        .select('id, name, email, role, is_active, created_at, must_reset_password')
        .single();

    if (error) {
        throw { status: 500, message: 'Failed to create user' };
    }

    // The temporary password is only useful if the recipient receives it. Wait
    // for SMTP and roll back the user row if delivery fails immediately.
    try {
        await emailService.sendOnboardingEmail(normalizedEmail, name, tempPassword);
    } catch (err) {
        await supabase.from('users').delete().eq('id', newUser.id);
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
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    updates.updated_at = new Date().toISOString();

    const { data: updatedUser, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select('id, name, email, role, is_active, created_at')
        .single();

    if (error) {
        throw { status: 500, message: 'Failed to update user' };
    }

    return updatedUser;
};

const deactivateUser = async (id) => {
    const { data: deactivatedUser, error } = await supabase
        .from('users')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('id, name, email, role, is_active, created_at')
        .single();

    if (error) {
        throw { status: 500, message: 'Failed to deactivate user' };
    }

    // Force log out of all active sessions
    await supabase
        .from('refresh_tokens')
        .delete()
        .eq('user_id', id);

    return deactivatedUser;
};

module.exports = {
    listUsers,
    listAssignableUsers,
    createUser,
    updateUser,
    deactivateUser
};
