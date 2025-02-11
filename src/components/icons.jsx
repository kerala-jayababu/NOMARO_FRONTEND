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


DeleteIcon.propTypes = {
    onClick: PropTypes.func.isRequired,
    };
AddIcon.propTypes = {
    onClick: PropTypes.func.isRequired,
    };    