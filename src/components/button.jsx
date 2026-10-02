import React from "react";
import PropTypes from "prop-types";

const Button = ({ onClick, className, children, type = "button", disabled = false }) => {
  return (
    <button type={type} className={className} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};

Button.propTypes = {
  onClick: PropTypes.func, 
  className: PropTypes.string, 
  children: PropTypes.node.isRequired, 
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  disabled: PropTypes.bool,
};

Button.defaultProps = {
  type: "button", 
};

export default Button;