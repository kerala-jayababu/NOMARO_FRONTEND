import React, { useEffect } from "react";
import PropTypes from "prop-types";

const Modal = ({ id, title, children }) => {



  return (
    <div className="modal fade" id={id} tabIndex="-1" aria-hidden="true">
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">{children}</div>
          <div className="modal-footer">
            <button type="submit" className="btn btn-primary btn-sm py-2 px-4 me-2">Submit</button>
            <button type="button" className="btn btn-outline-secondary btn-sm py-2 px-4" data-bs-dismiss="modal">
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
  onShow: PropTypes.func,
};