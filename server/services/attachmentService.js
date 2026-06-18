const supabase = require('../utils/supabase');

// Upload file to Supabase Storage
async function uploadAttachment(taskId, userId, file) {
  if (!file) {
    const err = new Error('File is required');
    err.status = 400;
    throw err;
  }

  const filePath = `${taskId}/${Date.now()}-${file.originalname}`;

  const { error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('attachments')
    .getPublicUrl(filePath);

  const { data: attachment, error } = await supabase
    .from('attachments')
    .insert([
      {
        task_id: taskId,
        user_id: userId,
        file_name: file.originalname,
        file_url: data.publicUrl,
        file_size: file.size,
      },
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return attachment;
}

// List task attachments
async function listAttachments(taskId) {
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

module.exports = {
  uploadAttachment,
  listAttachments,
};