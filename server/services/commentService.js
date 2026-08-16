const supabase = require('../utils/supabase');

// Get all comments for a task
async function listComments(taskId) {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      id,
      content,
      created_at,
      users (
        id,
        name
      )
    `)
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data.map(comment => ({
    id: comment.id,
    content: comment.content,
    created_at: comment.created_at,
    author: comment.users ? { id: comment.users.id, name: comment.users.name } : null
  }));
}

// Add a comment to a task
async function addComment(taskId, userId, content) {
  if (!content || !content.trim()) {
    const err = new Error('Comment content is required');
    err.status = 400;
    throw err;
  }

  const { data: inserted, error: insertError } = await supabase
    .from('comments')
    .insert([
      {
        task_id: taskId,
        user_id: userId,
        content: content.trim(),
      },
    ])
    .select(`
      id,
      content,
      created_at,
      users (
        id,
        name
      )
    `)
    .single();

  if (insertError) {
    throw insertError;
  }

  const formattedComment = {
    id: inserted.id,
    content: inserted.content,
    created_at: inserted.created_at,
    author: inserted.users ? { id: inserted.users.id, name: inserted.users.name } : null
  };

  // Step 4.9 hook: Notify the other assignees on this task
  try {
    const { data: assignees } = await supabase
      .from('task_assignments')
      .select('user_id')
      .eq('task_id', taskId);

    if (assignees && assignees.length > 0) {
      const { createNotification } = require('./notificationService');
      for (const assignment of assignees) {
        if (assignment.user_id !== userId) {
          await createNotification(
            assignment.user_id,
            'comment_added',
            `A new comment was added to a task you are assigned to.`,
            taskId
          );
        }
      }
    }
  } catch (err) {
    console.error('Failed to notify assignees of new comment:', err.message);
  }

  return formattedComment;
}

module.exports = {
  listComments,
  addComment,
};
