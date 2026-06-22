import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, ButtonGroup, Button } from 'react-bootstrap';
import TaskCard from '../components/TaskCard';
import TaskBoard from '../components/TaskBoard';



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
                    <div className="mt-3">
                        <TaskBoard />
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
