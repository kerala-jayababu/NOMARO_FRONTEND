import React, { useState } from "react";
import PropTypes from "prop-types";

// const Dropdown = ({ label, options }) => {
//   const [selectedValue, setSelectedValue] = useState("");

//   const handleChange = (event) => {
//     setSelectedValue(event.target.value);
//   };

//   return (
//     <div className="form-group">
//       <label>{label}</label>
//       <select
//         className="form-control"
//         value={selectedValue}
//         onChange={handleChange}
//       >
//         <option value="" disabled>
//           Select an option
//         </option>
//         {options.map(
//           (option) => (
//             console.log("option", option),
//             (
//               <option key={option.value} value={option.value}>
//                 {option.label}
//               </option>
//             )
//           )
//         )}
//       </select>
//     </div>
//   );
// };
const Dropdown = ({ label, options, name, value, onChange }) => {
  const handleChange = (event) => {
    onChange(event); // Use the parent component's handler to update formData
  };

  return (
    <div className="form-group">
      <label>{label}</label>
      <select
        className="form-control"
        name={name} // Add the name prop
        value={value}
        onChange={handleChange}
      >
        <option value="" disabled>
          Select an option
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
};

export default Dropdown;
