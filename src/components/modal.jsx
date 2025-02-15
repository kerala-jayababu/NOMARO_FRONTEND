

import React, { useEffect } from "react";
import PropTypes from "prop-types";

const Modal = ({ id, title, children, onClose, onSubmit, isSubmitting, isOpen }) => {
  useEffect(() => {
    const modal = document.getElementById(id);
    if (modal) {
      modal.addEventListener('hidden.bs.modal', onClose);
      return () => {
        modal.removeEventListener('hidden.bs.modal', onClose);
      };
    }
  }, [id, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    if (!isSubmitting) {
      const success = await onSubmit(e); // Call the provided onSubmit function only if not submitting
      // Close the modal only if submission was successful
      if (success) {
        const modal = document.getElementById(id);
        if (modal) {
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal.hide();
        }
      }
    }
  };

  return (
    <div className={`modal fade ${isOpen ? 'show' : ''}`} id={id} tabIndex="-1" aria-hidden="true">
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">{children}</div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-primary btn-sm py-2 px-4 me-2" 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
            <button 
              type="button" 
              className="btn btn-outline-secondary btn-sm py-2 px-4" 
              data-bs-dismiss="modal"
              disabled={isSubmitting}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;

Modal.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
  isSubmitting: PropTypes.bool,
  isOpen: PropTypes.bool,
};
