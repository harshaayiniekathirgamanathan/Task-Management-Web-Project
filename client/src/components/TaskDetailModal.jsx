import { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    Tabs,
    Tab,
    Form,
    Button,
    ListGroup,
    Badge,
    Dropdown,
    Spinner
} from 'react-bootstrap';

import { addComment, listComments } from '../api/comments';
import { listAttachments, uploadAttachment } from '../api/attachments';
import { attachLabel, listLabels, removeLabel } from '../api/labels';

const TaskDetailModal = ({ show, onClose, task, projectId, onTaskUpdated }) => {
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [projectLabels, setProjectLabels] = useState([]);
    const [taskLabels, setTaskLabels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fileInputKey, setFileInputKey] = useState(0);

    const taskId = task?.id;

    const loadDetails = async () => {
        if (!taskId || !projectId) return;

        try {
            setLoading(true);
            setError('');

            const [commentsData, attachmentsData, labelsData] =
                await Promise.all([
                    listComments(taskId),
                    listAttachments(taskId),
                    listLabels(projectId)
                ]);

            setComments(commentsData);
            setAttachments(attachmentsData);
            setProjectLabels(labelsData);
            setTaskLabels(task.labels || []);
        } catch (err) {
            console.error('Failed to load task details:', err);
            setError(err.response?.data?.message || 'Could not load task details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (show && task) {
            setComment('');
            setSuccess('');
            setError('');
            loadDetails();
        }
    }, [show, taskId, projectId]);

    const refreshTaskData = async () => {
        await loadDetails();

        if (onTaskUpdated) {
            onTaskUpdated();
        }
    };

    const handleAddComment = async () => {
        if (!comment.trim() || !taskId) return;

        try {
            setSaving(true);
            setError('');
            setSuccess('');

            await addComment(taskId, comment.trim());
            setComment('');
            setSuccess('Comment added successfully.');
            await refreshTaskData();
        } catch (err) {
            console.error('Failed to add comment:', err);
            setError(err.response?.data?.message || 'Could not add comment.');
        } finally {
            setSaving(false);
        }
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file || !taskId) return;

        try {
            setSaving(true);
            setError('');
            setSuccess('');

            await uploadAttachment(taskId, file);
            setSuccess('File uploaded successfully.');
            setFileInputKey(previousKey => previousKey + 1);
            await refreshTaskData();
        } catch (err) {
            console.error('Failed to upload file:', err);
            setError(err.response?.data?.message || 'Could not upload file.');
        } finally {
            setSaving(false);
        }
    };

    const handleAddLabel = async (labelId) => {
        if (!labelId || !taskId) return;

        try {
            setSaving(true);
            setError('');
            setSuccess('');

            await attachLabel(taskId, labelId);
            const addedLabel = projectLabels.find(label => label.id === labelId);

            if (addedLabel) {
                setTaskLabels(previousLabels => [...previousLabels, addedLabel]);
            }

            setSuccess('Label added successfully.');

            if (onTaskUpdated) {
                onTaskUpdated();
            }
        } catch (err) {
            console.error('Failed to add label:', err);
            setError(err.response?.data?.message || 'Could not add label.');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveLabel = async (labelId) => {
        if (!labelId || !taskId) return;

        try {
            setSaving(true);
            setError('');
            setSuccess('');

            await removeLabel(taskId, labelId);
            setTaskLabels(previousLabels =>
                previousLabels.filter(label => label.id !== labelId)
            );
            setSuccess('Label removed successfully.');

            if (onTaskUpdated) {
                onTaskUpdated();
            }
        } catch (err) {
            console.error('Failed to remove label:', err);
            setError(err.response?.data?.message || 'Could not remove label.');
        } finally {
            setSaving(false);
        }
    };

    const availableLabels = projectLabels.filter(label =>
        !taskLabels.some(taskLabel => taskLabel.id === label.id)
    );

    if (!task) return null;

    return (
        <Modal show={show} onHide={onClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{task.title}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                {loading ? (
                    <div className="text-center py-4">
                        <Spinner animation="border" />
                        <p className="text-muted mt-2">Loading task details...</p>
                    </div>
                ) : (
                    <Tabs defaultActiveKey="comments" className="mb-3">
                        <Tab eventKey="comments" title="Comments">
                            <ListGroup
                                className="mb-3"
                                style={{ maxHeight: '250px', overflowY: 'auto' }}
                            >
                                {comments.length > 0 ? (
                                    comments.map(item => (
                                        <ListGroup.Item key={item.id}>
                                            <div className="d-flex justify-content-between">
                                                <strong>
                                                    {item.author?.name || 'Unknown user'}
                                                </strong>

                                                <small className="text-muted">
                                                    {new Date(item.created_at).toLocaleString()}
                                                </small>
                                            </div>

                                            <p className="mb-0 mt-2">{item.content}</p>
                                        </ListGroup.Item>
                                    ))
                                ) : (
                                    <ListGroup.Item className="text-muted">
                                        No comments yet.
                                    </ListGroup.Item>
                                )}
                            </ListGroup>

                            <Form.Group className="mb-2">
                                <Form.Label>Add comment</Form.Label>

                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={comment}
                                    onChange={(event) => setComment(event.target.value)}
                                    placeholder="Write a comment..."
                                />
                            </Form.Group>

                            <Button
                                onClick={handleAddComment}
                                disabled={saving || !comment.trim()}
                            >
                                Add
                            </Button>
                        </Tab>

                        <Tab eventKey="files" title="Files">
                            <Form.Group className="mb-3">
                                <Form.Label>Upload a file</Form.Label>

                                <Form.Control
                                    key={fileInputKey}
                                    type="file"
                                    onChange={handleFileChange}
                                    disabled={saving}
                                />
                            </Form.Group>

                            <ListGroup>
                                {attachments.length > 0 ? (
                                    attachments.map(file => (
                                        <ListGroup.Item key={file.id}>
                                            <a
                                                href={file.file_url}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                {file.file_name}
                                            </a>

                                            {file.file_size && (
                                                <small className="text-muted ms-2">
                                                    ({Math.round(file.file_size / 1024)} KB)
                                                </small>
                                            )}
                                        </ListGroup.Item>
                                    ))
                                ) : (
                                    <ListGroup.Item className="text-muted">
                                        No files uploaded yet.
                                    </ListGroup.Item>
                                )}
                            </ListGroup>
                        </Tab>

                        <Tab eventKey="labels" title="Labels">
                            <div className="mb-3">
                                {taskLabels.length > 0 ? (
                                    taskLabels.map(label => (
                                        <span key={label.id} className="me-2 mb-2 d-inline-flex align-items-center">
                                            <Badge
                                                className="me-1"
                                                style={{ backgroundColor: label.color || '#6c757d' }}
                                            >
                                                {label.name}
                                            </Badge>

                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                disabled={saving}
                                                onClick={() => handleRemoveLabel(label.id)}
                                            >
                                                Remove
                                            </Button>
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-muted">No labels on this task.</p>
                                )}
                            </div>

                            <Dropdown onSelect={handleAddLabel}>
                                <Dropdown.Toggle
                                    variant="outline-primary"
                                    disabled={saving || availableLabels.length === 0}
                                >
                                    Add label
                                </Dropdown.Toggle>

                                <Dropdown.Menu>
                                    {availableLabels.map(label => (
                                        <Dropdown.Item
                                            key={label.id}
                                            eventKey={label.id}
                                        >
                                            {label.name}
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown.Menu>
                            </Dropdown>
                        </Tab>
                    </Tabs>
                )}
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default TaskDetailModal;
