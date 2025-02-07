import React from "react";
import PropTypes from "prop-types";

const Modal = ({ show, onClose, title, children }) => {
  if (!show) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        top: "0",
        left: "0",
        right: "0",
        bottom: "0",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: "999",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: "600px",
          margin: "auto",
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          zIndex: "1000",
        }}
      >
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">{title}</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <div className="card-body">{children}</div>
        </div>
      </div>
    </div>
  );
};

Modal.propTypes = {
  show: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};



export default Modal;