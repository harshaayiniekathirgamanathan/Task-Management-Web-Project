import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, ButtonGroup, Button } from 'react-bootstrap';
import TaskCard from '../components/TaskCard';


const ProjectDetailPage = () => {
    // Read the project ID from the URL (e.g., /projects/123 -> id is 123)
    const { id } = useParams();

    // State to track the current view: 'board' or 'table'
    const [view, setView] = useState('board');

    return (
        <Container className="mt-4">
            {/* Fake title with the ID from the URL */}
            <h2>Project Alpha (ID: {id})</h2>

            {/* Button group to toggle between Board and Table views */}
            <div className="mb-4">
                <ButtonGroup>
                    <Button
                        variant={view === 'board' ? 'primary' : 'outline-primary'}
                        onClick={() => setView('board')}
                    >
                        Board
                    </Button>
                    <Button
                        variant={view === 'table' ? 'primary' : 'outline-primary'}
                        onClick={() => setView('table')}
                    >
                        Table
                    </Button>
                </ButtonGroup>
            </div>

            {/* Placeholders for the actual views */}
            <div>
                {view === 'board' ? (
                    <div className="p-5 border rounded bg-light text-center">
                        <h4>Board View Placeholder</h4>
                        <TaskCard
                            task={{
                                id: 1,
                                title: "Design Homepage",
                                priority: "high",
                                status: "todo",
                                due_date: "2023-12-31",
                                assignees: [{ id: 101, name: "John Doe" }],
                                labels: [{ id: 201, name: "Frontend", color: "#0d6efd" }]
                            }}
                            onOpen={(t) => alert("Clicked on: " + t.title)}
                        />
                        <p>Draggable task cards will go here.</p>
                    </div>
                ) : (
                    <div className="p-5 border rounded bg-light text-center">
                        <h4>Table View Placeholder</h4>
                        <p>List of tasks will go here.</p>
                    </div>
                )}
            </div>
        </Container>
    );
};

export default ProjectDetailPage;
