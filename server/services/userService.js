const supabase = require('../utils/supabase');
const bcrypt = require('bcryptjs');
const emailService = require('../utils/emailService');

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

const createUser = async ({ name, email, role }) => {
    const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
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
                email,
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

    // Send email, or print to console if no SMTP
    // Email the temporary password to the NEW USER only.
    // Flow: admin creates the user -> user gets the temp password by email
    // -> user logs in with it and is forced to reset. The admin never sees it.
    try {
        await emailService.sendOnboardingEmail(email, name, tempPassword);
    } catch (err) {
        // Don't fail the request if email is down; log it, but never leak the
        // password in production logs.
        console.error(`Onboarding email to ${email} failed: ${err.message}`);
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[dev] Temp password for ${email}: ${tempPassword}`);
        }
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
    createUser,
    updateUser,
    deactivateUser
};
