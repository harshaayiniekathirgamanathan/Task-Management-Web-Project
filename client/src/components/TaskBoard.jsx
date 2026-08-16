import { useEffect, useMemo, useState } from 'react';
import { Row, Col } from 'react-bootstrap';
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    useDraggable,
    useDroppable,
    pointerWithin,
} from '@dnd-kit/core';

import TaskCard from './TaskCard';
import TaskDetailModal from './TaskDetailModal';
import { useAuth } from '../context/AuthContext';

const COLUMNS = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'completed', title: 'Completed' },
];

// A status column that tasks can be dropped into.
function DroppableColumn({ id, title, count, children }) {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <Col xs={12} md={4}>
            <div ref={setNodeRef} className={`tm-column ${isOver ? 'is-over' : ''}`}>
                <div className="tm-column-head">
                    <span className="tm-column-title">{title}</span>
                    <span className="tm-column-count">{count}</span>
                </div>
                {children}
            </div>
        </Col>
    );
}

// A draggable wrapper around a card. Dragging is disabled when the user
// isn't allowed to move this particular task.
function DraggableCard({ task, canDrag, ...cardProps }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: task.id,
        data: { status: task.status },
        disabled: !canDrag,
    });

    return (
        <div
            ref={setNodeRef}
            className="tm-draggable"
            data-can-drag={canDrag ? 'true' : 'false'}
            style={{ opacity: isDragging ? 0.4 : 1 }}
            {...(canDrag ? listeners : {})}
            {...attributes}
        >
            <TaskCard task={task} {...cardProps} />
        </div>
    );
}

const TaskBoard = ({ tasks = [], projectId, onStatusChange, onTaskUpdated, onEditTask }) => {
    const { user } = useAuth();
    const isManager = user?.role === 'project_manager' || user?.role === 'admin';

    const [selectedTask, setSelectedTask] = useState(null);
    const [activeId, setActiveId] = useState(null);

    // Local mirror of the tasks so a drop can update the board instantly
    // (optimistic) while the API call + refetch happen in the background.
    const [boardTasks, setBoardTasks] = useState(tasks);
    useEffect(() => { setBoardTasks(tasks); }, [tasks]);

    const sensors = useSensors(
        // 8px of travel before a drag begins, so a plain click still opens the card.
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor)
    );

    const canDragTask = (task) =>
        isManager || (task.assignees || []).some((a) => a.id === user?.id);

    const byStatus = useMemo(() => {
        const map = { todo: [], in_progress: [], completed: [] };
        for (const task of boardTasks) {
            (map[task.status] || map.todo).push(task);
        }
        return map;
    }, [boardTasks]);

    const activeTask = boardTasks.find((t) => t.id === activeId) || null;

    const handleOpenTask = (task) => setSelectedTask(task);

    useEffect(() => {
        if (!selectedTask) return;
        const refreshed = tasks.find((t) => t.id === selectedTask.id);
        if (refreshed) setSelectedTask(refreshed);
    }, [tasks, selectedTask]);

    const handleDragEnd = ({ active, over }) => {
        setActiveId(null);
        if (!over) return;

        const newStatus = over.id; // column id === status
        const moved = boardTasks.find((t) => t.id === active.id);
        if (!moved || moved.status === newStatus) return;

        // Optimistic move for an instant, smooth result.
        setBoardTasks((prev) =>
            prev.map((t) => (t.id === active.id ? { ...t, status: newStatus } : t))
        );
        onStatusChange(active.id, newStatus);
    };

    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={pointerWithin}
                onDragStart={({ active }) => setActiveId(active.id)}
                onDragCancel={() => setActiveId(null)}
                onDragEnd={handleDragEnd}
            >
                <Row className="g-3 align-items-stretch">
                    {COLUMNS.map((col) => {
                        const items = byStatus[col.id] || [];
                        return (
                            <DroppableColumn
                                key={col.id}
                                id={col.id}
                                title={col.title}
                                count={items.length}
                            >
                                {items.length === 0 ? (
                                    <div className="tm-column-empty">Drop tasks here</div>
                                ) : (
                                    items.map((task) => (
                                        <DraggableCard
                                            key={task.id}
                                            task={task}
                                            canDrag={canDragTask(task)}
                                            onOpen={handleOpenTask}
                                            onEditTask={onEditTask}
                                            canManageLabels={isManager}
                                            projectId={projectId}
                                            onLabelAdded={() => onTaskUpdated?.()}
                                        />
                                    ))
                                )}
                            </DroppableColumn>
                        );
                    })}
                </Row>

                <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }}>
                    {activeTask ? (
                        <div className="tm-card-overlay">
                            <TaskCard task={activeTask} isOverlay />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            <TaskDetailModal
                show={Boolean(selectedTask)}
                task={selectedTask}
                projectId={projectId}
                canManageLabels={isManager}
                canEdit={
                    selectedTask
                        ? isManager ||
                          (selectedTask.assignees || []).some((a) => a.id === user?.id)
                        : false
                }
                onTaskUpdated={onTaskUpdated}
                onEditTask={onEditTask}
                onClose={() => setSelectedTask(null)}
            />
        </>
    );
};

export default TaskBoard;
