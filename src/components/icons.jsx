import React from "react";
import PropTypes from "prop-types";

export const DeleteIcon = ({ onClick }) => (
  <button className="btn btn-outline-danger btn-sm border-0" onClick={onClick}>
    <i className="bx bx-trash"></i>
  </button>
);

export const AddIcon = ({ onClick }) => (
  <button className="btn btn-outline-primary border-0 btn-sm me-2" onClick={onClick}>
    <i className="bx bx-plus"></i>
  </button>
);

export const UpIcon = ({ onClick, disabled, title = "Move up" }) => (
  <button 
    className="btn btn-outline-secondary border-0 btn-sm" 
    onClick={onClick}
    disabled={disabled}
    data-bs-toggle="tooltip"
    data-bs-placement="top"
    title={title}
    style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
  >
    <i className="bx bx-chevron-up"></i>
  </button>
);

export const DownIcon = ({ onClick, disabled, title = "Move down" }) => (
  <button 
    className="btn btn-outline-secondary border-0 btn-sm" 
    onClick={onClick}
    disabled={disabled}
    data-bs-toggle="tooltip"
    data-bs-placement="bottom"
    title={title}
    style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
  >
    <i className="bx bx-chevron-down"></i>
  </button>
);


DeleteIcon.propTypes = {
    onClick: PropTypes.func.isRequired,
    };
AddIcon.propTypes = {
    onClick: PropTypes.func.isRequired,
    };
UpIcon.propTypes = {
    onClick: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    title: PropTypes.string,
    };
DownIcon.propTypes = {
    onClick: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    title: PropTypes.string,
    };    