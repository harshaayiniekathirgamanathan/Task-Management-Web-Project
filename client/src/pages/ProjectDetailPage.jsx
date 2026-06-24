import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, ButtonGroup, Button } from 'react-bootstrap';
import TaskCard from '../components/TaskCard';
import TaskBoard from '../components/TaskBoard';
import TaskTable from '../components/TaskTable';

import { useAuth } from '../context/AuthContext';
import TaskFormModal from '../components/TaskFormModal';





const ProjectDetailPage = () => {
    // Read the project ID from the URL (e.g., /projects/123 -> id is 123)
    const { user } = useAuth(); // Grab the logged in user
    //const canCreateTask = true;
    const canCreateTask = user?.role === 'project_manager' || user?.role === 'admin';
    const [showModal, setShowModal] = useState(false);

    const { id } = useParams();

    // State to track the current view: 'board' or 'table'
    const [view, setView] = useState('board');

    return (
        <Container className="mt-4">
            {/* Fake title with the ID from the URL */}
            <h2>Project Alpha (ID: {id})</h2>

            {/* Button group to toggle between Board and Table views */}
            <div className="mb-4 d-flex justify-content-between align-items-center">
                <ButtonGroup>
                    {/* Your existing Board and Table buttons stay exactly the same here */}
                    <Button variant={view === 'board' ? 'primary' : 'outline-primary'} onClick={() => setView('board')}>Board</Button>
                    <Button variant={view === 'table' ? 'primary' : 'outline-primary'} onClick={() => setView('table')}>Table</Button>
                </ButtonGroup>

                {/* Only show this button if they have permission */}
                {canCreateTask && (
                    <Button variant="success" onClick={() => setShowModal(true)}>
                        + New Task
                    </Button>
                )}
            </div>


            {/* Placeholders for the actual views */}
            <div>
                {view === 'board' ? (
                    <div className="mt-3">
                        <TaskBoard />
                    </div>
                ) : (
                    <div className="mt-3">
                        <TaskTable />
                    </div>
                )}


            </div>

            {/* Other stuff like Board/Table views are up here */}

            <TaskFormModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onSave={(data) => {
                    // When they hit save, we log the data and close the modal
                    console.log("Parent received save:", data);
                    setShowModal(false);
                }}
            />

        </Container>
    );
};

export default ProjectDetailPage;
