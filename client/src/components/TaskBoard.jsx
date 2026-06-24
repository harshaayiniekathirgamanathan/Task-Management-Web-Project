import React from 'react';
import { Row, Col } from 'react-bootstrap';
import TaskCard from './TaskCard';

// Hard-coded tasks to test our layout before connecting to the backend
const dummyTasks = [
    {
        id: 1, title: 'Setup Database', priority: 'high', status: 'todo', due_date: '2023-11-01',
        assignees: [{ id: 101, name: 'Alice Smith' }], labels: [{ id: 201, name: 'Backend', color: '#dc3545' }]
    },
    {
        id: 2, title: 'Design Login Page', priority: 'medium', status: 'todo', due_date: '2023-11-05',
        assignees: [{ id: 102, name: 'Bob Jones' }], labels: [{ id: 202, name: 'UI', color: '#0d6efd' }]
    },
    {
        id: 3, title: 'Build Auth API', priority: 'high', status: 'in_progress', due_date: '2023-10-25',
        assignees: [{ id: 101, name: 'Alice Smith' }], labels: [{ id: 203, name: 'Security', color: '#198754' }]
    },
    {
        id: 4, title: 'Create Layout', priority: 'low', status: 'in_progress', due_date: '2023-11-10',
        assignees: [{ id: 103, name: 'Charlie Brown' }], labels: [{ id: 204, name: 'Frontend', color: '#0dcaf0' }]
    },
    {
        id: 5, title: 'Initial Setup', priority: 'medium', status: 'completed', due_date: '2023-10-20',
        assignees: [{ id: 102, name: 'Bob Jones' }], labels: [{ id: 205, name: 'Config', color: '#6c757d' }]
    }
];

const TaskBoard = () => {
    // Split tasks into arrays based on their status
    const todoTasks = dummyTasks.filter(task => task.status === 'todo');
    const inProgressTasks = dummyTasks.filter(task => task.status === 'in_progress');
    const completedTasks = dummyTasks.filter(task => task.status === 'completed');

    // Function to run when a card is clicked
    const handleOpenTask = (task) => {
        alert(`Clicked task to open: ${task.title}`);
    };
    const handleStatusChange = (taskId, newStatus) => {
    console.log('Status changed:', taskId, newStatus);
    };
    return (
        <Row className="g-3">
            {/* To Do Column */}
            <Col xs={12} md={4}>
                <div className="bg-light p-3 rounded border h-100">
                    <h5 className="mb-3 d-flex justify-content-between align-items-center">
                        To Do
                        <span className="badge bg-secondary rounded-pill">{todoTasks.length}</span>
                    </h5>
                    {todoTasks.map(task => (
                        <TaskCard
                        key={task.id}
                        task={task}
                        onOpen={handleOpenTask}
                        onStatusChange={handleStatusChange}
                    />
                    ))}
                </div>
            </Col>

            {/* In Progress Column */}
            <Col xs={12} md={4}>
                <div className="bg-light p-3 rounded border h-100">
                    <h5 className="mb-3 d-flex justify-content-between align-items-center">
                        In Progress
                        <span className="badge bg-secondary rounded-pill">{inProgressTasks.length}</span>
                    </h5>
                    {inProgressTasks.map(task => (
                        <TaskCard
                        key={task.id}
                        task={task}
                        onOpen={handleOpenTask}
                        onStatusChange={handleStatusChange}
                    />
                    ))}
                </div>
            </Col>

            {/* Completed Column */}
            <Col xs={12} md={4}>
                <div className="bg-light p-3 rounded border h-100">
                    <h5 className="mb-3 d-flex justify-content-between align-items-center">
                        Completed
                        <span className="badge bg-secondary rounded-pill">{completedTasks.length}</span>
                    </h5>
                    {completedTasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onOpen={handleOpenTask}
                            onStatusChange={handleStatusChange}
                        />
                    ))}
                </div>
            </Col>
        </Row>
    );
};

export default TaskBoard;
