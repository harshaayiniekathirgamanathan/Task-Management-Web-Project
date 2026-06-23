const supabase = require('../utils/supabase');

// Get notifications for logged-in user
async function getNotifications(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, message, task_id, is_read, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
}

// Mark notification as read
async function markAsRead(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getNotifications,
  markAsRead,
};
