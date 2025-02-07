import React from "react";
import PropTypes from "prop-types";

const Button = ({ onClick, className, children, type = "button" }) => {
  return (
    <button type={type} className={className} onClick={onClick}>
      {children}
    </button>
  );
};

Button.propTypes = {
  onClick: PropTypes.func, 
  className: PropTypes.string, 
  children: PropTypes.node.isRequired, 
  type: PropTypes.oneOf(["button", "submit", "reset"]),
};

Button.defaultProps = {
  type: "button", 
};

export default Button;