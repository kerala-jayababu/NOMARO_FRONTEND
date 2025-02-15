// components/NavTabButton.js
import React from 'react';
import PropTypes from 'prop-types';

const NavTabButton = ({ id, label, target, isActive, onClick }) => {
  return (
    <li className="nav-item">
      <button
        type="button"
        className={`nav-link ${isActive ? 'active' : ''}`}
        role="tab"
        data-bs-toggle="tab"
        data-bs-target={target}
        aria-controls={target.substring(1)} // Removing the # from the target for aria-controls
        aria-selected={isActive}
        onClick={onClick}
      >
        {label}
      </button>
    </li>
  );
};

export default NavTabButton;


NavTabButton.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string,
  target: PropTypes.string,
  isActive: PropTypes.bool,
  onClick: PropTypes.func,
};