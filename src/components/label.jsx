import React from "react";
import PropTypes from "prop-types";

const Label = ({ text, value }) => {
  return (
    <div className="col-md-3 p-2">
      <label className="form-label mb-1">{text}</label>
      <p className="m-0">{value}</p>
    </div>
  );
};

export default Label;


Label.propTypes = {
  text: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};
