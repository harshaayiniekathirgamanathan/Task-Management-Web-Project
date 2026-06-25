const supabase = require('../utils/supabase');

// Get all labels for a project
async function getLabels(projectId) {
  const { data, error } = await supabase
    .from('labels')
    .select('id, name, color')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return data;
}

// Create a new label
async function createLabel(projectId, userId, name, color) {
  const { data, error } = await supabase
    .from('labels')
    .insert([
      {
        project_id: projectId,
        created_by: userId,
        name,
        color,
      },
    ])
    .select('id, name, color')
    .single();

  if (error) throw error;

  return data;
}

// Attach label to task (Step 4.4 - Handles duplicate inserts gracefully)
async function attachLabel(taskId, labelId) {
  const { data: existing, error: checkError } = await supabase
    .from('task_labels')
    .select('*')
    .eq('task_id', taskId)
    .eq('label_id', labelId)
    .maybeSingle();

  if (checkError) throw checkError;
  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from('task_labels')
    .insert([
      {
        task_id: taskId,
        label_id: labelId,
      },
    ])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { task_id: taskId, label_id: labelId };
    }
    throw error;
  }

  return data;
}

// Remove label from task
async function removeLabel(taskId, labelId) {
  const { error } = await supabase
    .from('task_labels')
    .delete()
    .eq('task_id', taskId)
    .eq('label_id', labelId);

  if (error) throw error;

  return { message: 'Label removed successfully' };
}

module.exports = {
  getLabels,
  createLabel,
  attachLabel,
  removeLabel,
};
