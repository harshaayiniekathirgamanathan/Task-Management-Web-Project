import { useState } from 'react';
import {
    Modal,
    Tabs,
    Tab,
    Form,
    Button,
    ListGroup,
    Badge,
    Dropdown
} from 'react-bootstrap';

const fakeComments = [
    {
        id: 1,
        author: { name: 'Alice Smith' },
        content: 'The database setup is ready for review.',
        created_at: '2026-06-20T10:30:00'
    },
    {
        id: 2,
        author: { name: 'Bob Jones' },
        content: 'I will check this today.',
        created_at: '2026-06-21T09:15:00'
    }
];

const fakeAttachments = [
    {
        id: 1,
        file_name: 'task-requirements.pdf',
        file_url: '#task-requirements'
    },
    {
        id: 2,
        file_name: 'design-preview.png',
        file_url: '#design-preview'
    }
];

const fakeLabels = [
    { id: 1, name: 'Urgent', color: '#dc3545' },
    { id: 2, name: 'Frontend', color: '#0d6efd' },
    { id: 3, name: 'Backend', color: '#198754' }
];

const TaskDetailModal = ({ show, onClose, task }) => {
    const [comment, setComment] = useState('');

    const handleAddComment = () => {
        if (!comment.trim()) return;

        console.log('Add comment:', {
            taskId: task.id,
            content: comment
        });

        setComment('');
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];

        if (file) {
            console.log('Upload file:', {
                taskId: task.id,
                file
            });
        }
    };

    const handleAddLabel = (labelId) => {
        console.log('Add label:', {
            taskId: task.id,
            labelId
        });
    };

    if (!task) return null;

    return (
        <Modal show={show} onHide={onClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{task.title}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Tabs defaultActiveKey="comments" className="mb-3">
                    <Tab eventKey="comments" title="Comments">
                        <ListGroup
                            className="mb-3"
                            style={{ maxHeight: '250px', overflowY: 'auto' }}
                        >
                            {fakeComments.map(item => (
                                <ListGroup.Item key={item.id}>
                                    <div className="d-flex justify-content-between">
                                        <strong>{item.author.name}</strong>

                                        <small className="text-muted">
                                            {new Date(item.created_at).toLocaleString()}
                                        </small>
                                    </div>

                                    <p className="mb-0 mt-2">{item.content}</p>
                                </ListGroup.Item>
                            ))}
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

                        <Button onClick={handleAddComment}>
                            Add
                        </Button>
                    </Tab>

                    <Tab eventKey="files" title="Files">
                        <Form.Group className="mb-3">
                            <Form.Label>Upload a file</Form.Label>

                            <Form.Control
                                type="file"
                                onChange={handleFileChange}
                            />
                        </Form.Group>

                        <ListGroup>
                            {fakeAttachments.map(file => (
                                <ListGroup.Item key={file.id}>
                                    <a
                                        href={file.file_url}
                                        onClick={() =>
                                            console.log('Download file:', file)
                                        }
                                    >
                                        {file.file_name}
                                    </a>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    </Tab>

                    <Tab eventKey="labels" title="Labels">
                        <div className="mb-3">
                            {fakeLabels.map(label => (
                                <Badge
                                    key={label.id}
                                    className="me-2"
                                    style={{ backgroundColor: label.color }}
                                >
                                    {label.name}
                                </Badge>
                            ))}
                        </div>

                        <Dropdown onSelect={handleAddLabel}>
                            <Dropdown.Toggle variant="outline-primary">
                                Add label
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                {fakeLabels.map(label => (
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