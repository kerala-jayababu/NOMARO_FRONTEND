import PropTypes from "prop-types";

const DatePicker = ({ label, name, value, onChange, min, max }) => {
  return (
    <div className="mb-2">
      <label className="form-label mb-1">{label}</label>
      <input
        type="date"
        className="form-control"
        name={name}
        value={value}
        onChange={onChange}
        min={min || ""} // Apply min if provided, otherwise allow all past dates
        max={max || ""} // Apply max if provided, otherwise allow all future dates
      />
    </div>
  );
};

export default DatePicker;

DatePicker.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  min: PropTypes.string, // Optional min date
  max: PropTypes.string, // Optional max date
};
