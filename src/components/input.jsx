import PropTypes from "prop-types";

const Input = ({
  type = "text",
  name,
  value,
  onChange,
  maxLength,
  label,
  error,
  style
}) => {
  return (
    <div className="mb-2" style={{ ...style}}>
      <label className="form-label mb-1">{label}</label>
      <input
        type={type}
        className="form-control"
        name={name}
        maxLength={maxLength}
        value={value}
        onChange={onChange}
        style={{ width: "100%" }} // Ensures responsiveness
      />
      {error && <div className="text-danger">{error}</div>}
    </div>
  );
};

Input.propTypes = {
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  maxLength: PropTypes.string,
  label: PropTypes.string.isRequired,
  error: PropTypes.string,
  style: PropTypes.object,
};

Input.defaultProps = {
  type: "text",
  maxLength: "50",
};

export default Input;