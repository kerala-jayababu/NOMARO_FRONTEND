import React, { useState } from "react";
import { Button, Modal } from "react-bootstrap";

function ConfirmationModal({ t, modalShow, messageText, callbackModal, id = "", title = "", confirmBtn = t("Ok.label"), CancelBtn = t("Cancel.label") }) {
  const [show, setShow] = useState(modalShow);
  const [message, setMessage] = useState(messageText);

  const handleClose = () => {
     setShow(false);
     callbackModal(false, id);
   
  }
  const handleConfirm = () => {
    setShow(false);
    callbackModal(true,id );
  };

  return (
    <>
      <Modal show={show} onHide={handleClose}
        aria-labelledby="contained-modal-title-vcenter"
        size="sm"
        centered backdrop="static"
				keyboard={false}>
        <Modal.Header className="border-0" closeButton>
          <Modal.Title>{title}</Modal.Title>
          </Modal.Header>
        <Modal.Body>
          <div className="d-flex align-items-center justify-content-center shortDataHeight">
          {message}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" className="px-3" onClick={handleClose} autoFocus>
          {CancelBtn}
        </Button>
        <Button variant="primary" onClick={handleConfirm} className="px-3">
          {confirmBtn}
        </Button>
      </Modal.Footer>
    </Modal >
    </>
  );
}

export default ConfirmationModal;
