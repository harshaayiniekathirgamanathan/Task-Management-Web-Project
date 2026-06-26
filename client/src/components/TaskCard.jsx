import React, { useRef, useState } from 'react';
import { Card, Badge, Overlay, Popover, Form, Button, Spinner } from 'react-bootstrap';
import { createLabel, attachLabel, listLabels } from '../api/labels';

// A small, stable palette so auto-assigned label colors stay on-theme.
const LABEL_COLORS = ['#1c1c1c', '#5f5f5d', '#b45309', '#15803d', '#1d4ed8', '#7c3aed', '#be123c'];
const colorForName = (name) => {
    let hash = 0;
    for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    return LABEL_COLORS[hash % LABEL_COLORS.length];
};

const getPriorityVariant = (priority) => {
    switch (priority?.toLowerCase()) {
        case 'high': return 'danger';
        case 'medium': return 'warning';
        case 'low': return 'secondary';
        default: return 'primary';
    }
};

const getInitials = (name) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

const TaskCard = ({
    task,
    onOpen,
    isOverlay = false,
    canManageLabels = false,
    projectId,
    onLabelAdded,
}) => {
    const [showPop, setShowPop] = useState(false);
    const [labelName, setLabelName] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const addBtnRef = useRef(null);

    const formattedDate = task.due_date
        ? new Date(task.due_date).toLocaleDateString()
        : 'No due date';

    // Keep pointer interactions on the "+" trigger from starting a drag or
    // opening the detail modal.
    const swallow = (event) => event.stopPropagation();

    const handleCreateLabel = async () => {
        const name = labelName.trim();
        if (!name) return;

        try {
            setSaving(true);
            setError('');

            let label;
            try {
                label = await createLabel(projectId, { name, color: colorForName(name) });
            } catch (err) {
                // Most likely a duplicate name in this project — reuse the existing label.
                const existing = (await listLabels(projectId)).find(
                    (l) => l.name.toLowerCase() === name.toLowerCase()
                );
                if (!existing) throw err;
                label = existing;
            }

            await attachLabel(task.id, label.id);
            setLabelName('');
            setShowPop(false);
            onLabelAdded?.();
        } catch (err) {
            console.error('Failed to add label:', err);
            setError(err.response?.data?.message || 'Could not add label.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card
            className="mb-2"
            style={{ cursor: isOverlay ? 'grabbing' : 'pointer' }}
            onClick={isOverlay ? undefined : () => onOpen?.(task)}
        >
            <Card.Body>
                {/* Top Row: Title and Priority Badge */}
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <Card.Title className="h6 mb-0">{task.title}</Card.Title>
                    <Badge bg={getPriorityVariant(task.priority)}>
                        {task.priority || 'None'}
                    </Badge>
                </div>

                {/* Labels row — chips plus the "+" quick-add (managers/admins only) */}
                <div className="d-flex flex-wrap align-items-center gap-1 mb-3">
                    {(task.labels || []).map((label) => (
                        <Badge
                            key={label.id}
                            style={{ backgroundColor: label.color || '#6c757d' }}
                            className="text-white"
                        >
                            {label.name}
                        </Badge>
                    ))}

                    {canManageLabels && !isOverlay && (
                        <>
                            <button
                                type="button"
                                ref={addBtnRef}
                                className="tm-label-add"
                                aria-label="Add label"
                                title="Add label"
                                onPointerDown={swallow}
                                onClick={(e) => {
                                    swallow(e);
                                    setError('');
                                    setShowPop((v) => !v);
                                }}
                            >
                                +
                            </button>

                            <Overlay
                                show={showPop}
                                target={addBtnRef.current}
                                placement="bottom"
                                rootClose
                                onHide={() => setShowPop(false)}
                            >
                                <Popover id={`label-pop-${task.id}`} className="tm-label-pop">
                                    <Popover.Body
                                        onClick={swallow}
                                        onPointerDown={swallow}
                                    >
                                        <Form.Label className="small fw-semibold mb-1">
                                            New label
                                        </Form.Label>
                                        <Form.Control
                                            size="sm"
                                            autoFocus
                                            placeholder="Label name"
                                            value={labelName}
                                            disabled={saving}
                                            onChange={(e) => setLabelName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleCreateLabel();
                                                }
                                            }}
                                        />
                                        {error && (
                                            <div className="text-danger small mt-1">{error}</div>
                                        )}
                                        <div className="d-flex justify-content-end gap-2 mt-2">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                disabled={saving}
                                                onClick={() => setShowPop(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="primary"
                                                disabled={saving || !labelName.trim()}
                                                onClick={handleCreateLabel}
                                            >
                                                {saving ? <Spinner size="sm" animation="border" /> : 'Add'}
                                            </Button>
                                        </div>
                                    </Popover.Body>
                                </Popover>
                            </Overlay>
                        </>
                    )}
                </div>

                {/* Bottom Row: Due Date and Assignee Initials */}
                <div className="d-flex justify-content-between align-items-end">
                    <small className="text-muted">{formattedDate}</small>

                    <div>
                        {(task.assignees || []).map((assignee) => (
                            <span
                                key={assignee.id}
                                className="rounded-circle bg-secondary text-white d-inline-flex justify-content-center align-items-center ms-1"
                                style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}
                                title={assignee.name}
                            >
                                {getInitials(assignee.name)}
                            </span>
                        ))}
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

export default TaskCard;
