import React from 'react';
import { Modal, Button } from 'react-bootstrap';

// A reusable "are you sure?" dialog.
// Props:
//   show      — boolean, controls visibility
//   message   — string shown in the modal body
//   onConfirm — function, called when the user clicks Confirm
//   onClose   — function, called when the user cancels or closes
export default function ConfirmDialog({ show, message, onConfirm, onClose }) {
    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Please confirm</Modal.Title>
            </Modal.Header>

            {/* The caller decides what question is shown here */}
            <Modal.Body>{message}</Modal.Body>

            <Modal.Footer>
                {/* Cancel — dismiss without taking action */}
                <Button variant="secondary" onClick={onClose}>
                    Cancel
                </Button>

                {/* Confirm — proceed with the destructive action */}
                <Button variant="danger" onClick={onConfirm}>
                    Confirm
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
