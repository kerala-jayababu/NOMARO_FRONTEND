import PropTypes from "prop-types";

const DatePicker = ({ label, name, value, onChange }) => (
  <div className="mb-2">
    <label className="form-label mb-1">{label}</label>
    <input
      type="date"
      className="form-control"
      name={name}
      value={value}
      onChange={onChange}
    />
  </div>
);

export default DatePicker;

DatePicker.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
