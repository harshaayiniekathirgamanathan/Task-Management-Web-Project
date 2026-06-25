const supabase = require('../utils/supabase');
const { createNotification } = require('./notificationService');

// Get all comments for a task
async function listComments(taskId) {
  const { data, error } = await supabase
    .from('comments')
    .select('id, content, created_at, author:users ( id, name )')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}

// Add a comment to a task
async function addComment(taskId, userId, content) {
  if (!content || !content.trim()) {
    const err = new Error('Comment content is required');
    err.status = 400;
    throw err;
  }

  const { data, error } = await supabase
    .from('comments')
    .insert([
      {
        task_id: taskId,
        user_id: userId,
        content,
      },
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

    // Step 4.9 — notify the other people assigned to this task
  const { data: assignees } = await supabase
    .from('task_assignments')
    .select('user_id')
    .eq('task_id', taskId);

  for (const a of assignees || []) {
    if (a.user_id === userId) continue; // don't notify the comment author
    try {
      await createNotification(
        a.user_id,
        'comment_added',
        'A new comment was added to a task you are on',
        taskId
      );
    } catch (e) {
      console.error('comment_added notification failed:', e.message);
    }
  }

  return data;
}

module.exports = {
  listComments,
  addComment,
};