import React, { useState } from "react";
import PropTypes from "prop-types";





const Dropdown = ({ label, options, name, value, onChange, style }) => {
  const handleChange = (event) => {
    onChange(event); // Use the parent component's handler to update formData
  };

  return (
    <div className="form-group" style={{ ...style }}>
      <label className="form-label mb-1">{label}</label>
      <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
        <select
          className="form-control"
          name={name}
          value={value}
          onChange={handleChange}
          style={{
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            width: "100%",
            height: "38px", // Match the input field height
            padding: "8px 30px 8px 10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            background:
              "white url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' fill='gray'><path d='M7 10l5 5 5-5z'/></svg>\") no-repeat right 10px center",
            backgroundSize: "16px",
            cursor: "pointer",
          }}
        >
          <option value="" disabled>
            Select
          </option>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

Dropdown.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  style: PropTypes.object,
};

export default Dropdown;
