// Attachments: file bytes live in Azure Blob Storage; metadata lives in Postgres.
const { BlobServiceClient } = require('@azure/storage-blob');
const db = require('../utils/db');

const CONTAINER_NAME =
  process.env.AZURE_STORAGE_ATTACHMENTS_CONTAINER || 'attachments';

// Lazily build the container client so importing this module never requires
// storage credentials (keeps unit tests / CI that don't upload files working).
let _container = null;
function getContainer() {
  if (_container) return _container;
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    const err = new Error('Missing AZURE_STORAGE_CONNECTION_STRING');
    err.status = 500;
    throw err;
  }
  const service = BlobServiceClient.fromConnectionString(connectionString);
  _container = service.getContainerClient(CONTAINER_NAME);
  return _container;
}

// Upload a file (from multer memoryStorage) to Blob Storage, then record it.
async function uploadAttachment(taskId, userId, file) {
  if (!file) {
    const err = new Error('File is required');
    err.status = 400;
    throw err;
  }

  // Keep files grouped per task; timestamp prefix avoids name collisions.
  const blobName = `${taskId}/${Date.now()}-${file.originalname}`;
  const blockBlob = getContainer().getBlockBlobClient(blobName);

  await blockBlob.uploadData(file.buffer, {
    blobHTTPHeaders: { blobContentType: file.mimetype },
  });

  const attachment = await db.one(
    `INSERT INTO attachments (task_id, user_id, file_name, file_url, file_size)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [taskId, userId, file.originalname, blockBlob.url, file.size]
  );

  return attachment;
}

// List task attachments (newest first).
async function listAttachments(taskId) {
  return db.many(
    `SELECT * FROM attachments WHERE task_id = $1 ORDER BY created_at DESC`,
    [taskId]
  );
}

module.exports = {
  uploadAttachment,
  listAttachments,
};
