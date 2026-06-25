import { useState } from 'react';
import { Row, Col } from 'react-bootstrap';
import TaskCard from './TaskCard';
import TaskDetailModal from './TaskDetailModal';

const TaskBoard = ({ tasks = [], onStatusChange }) => {
    const [selectedTask, setSelectedTask] = useState(null);

    const todoTasks = tasks.filter(task => task.status === 'todo');
    const inProgressTasks = tasks.filter(
        task => task.status === 'in_progress'
    );
    const completedTasks = tasks.filter(
        task => task.status === 'completed'
    );

    const handleOpenTask = (task) => {
        setSelectedTask(task);
    };


    const renderTaskCard = (task) => (
        <TaskCard
            key={task.id}
            task={task}
            onOpen={handleOpenTask}
           onStatusChange={onStatusChange}
        />
    );

    return (
        <>
            <Row className="g-3">
                {/* To Do Column */}
                <Col xs={12} md={4}>
                    <div className="bg-light p-3 rounded border h-100">
                        <h5 className="mb-3 d-flex justify-content-between align-items-center">
                            To Do

                            <span className="badge bg-secondary rounded-pill">
                                {todoTasks.length}
                            </span>
                        </h5>

                        {todoTasks.map(renderTaskCard)}
                    </div>
                </Col>

                {/* In Progress Column */}
                <Col xs={12} md={4}>
                    <div className="bg-light p-3 rounded border h-100">
                        <h5 className="mb-3 d-flex justify-content-between align-items-center">
                            In Progress

                            <span className="badge bg-secondary rounded-pill">
                                {inProgressTasks.length}
                            </span>
                        </h5>

                        {inProgressTasks.map(renderTaskCard)}
                    </div>
                </Col>

                {/* Completed Column */}
                <Col xs={12} md={4}>
                    <div className="bg-light p-3 rounded border h-100">
                        <h5 className="mb-3 d-flex justify-content-between align-items-center">
                            Completed

                            <span className="badge bg-secondary rounded-pill">
                                {completedTasks.length}
                            </span>
                        </h5>

                        {completedTasks.map(renderTaskCard)}
                    </div>
                </Col>
            </Row>

            <TaskDetailModal
                show={Boolean(selectedTask)}
                task={selectedTask}
                onClose={() => setSelectedTask(null)}
            />
        </>
    );
};

export default TaskBoard;
