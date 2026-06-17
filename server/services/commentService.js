const supabase = require('../utils/supabase');

// Get all comments for a task
async function listComments(taskId) {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
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

  return data;
}

module.exports = {
  listComments,
  addComment,
};