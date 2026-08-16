import { Modal, Button } from 'react-bootstrap';

export default function ConfirmDialog({ show, message, onConfirm, onClose }) {
  return (
    <Modal show={show} onHide={onClose} centered className="dark-modal">
      <Modal.Header closeButton>
        <Modal.Title className="h5 text-white fw-bold">Action Required</Modal.Title>
      </Modal.Header>

      <Modal.Body className="text-white py-4">
        {message}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose} className="rounded-3">
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} className="rounded-3 px-4">
          Confirm Action
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
