import React from "react";
import PropTypes from "prop-types";

const RadioButton = ({ name, options, selectedValue, onChange, className }) => {
  return (
    <div className={`radio-group ${className}`}>
      {options.map((option) => (
        <label key={option.value} className="radio-label me-3">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={selectedValue === option.value}
            onChange={() => onChange(option.value)}
            className="radio-input"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
};

RadioButton.propTypes = {
  name: PropTypes.string.isRequired, 
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired, 
      value: PropTypes.string.isRequired, 
    })
  ).isRequired,
  selectedValue: PropTypes.string, 
  onChange: PropTypes.func.isRequired, 
  className: PropTypes.string, 
};

export default RadioButton;
