import PropTypes from "prop-types";
import CompanyDateInput from "./CompanyDateInput";

const DatePicker = ({ label, name, value, onChange, min, max }) => {
  return (
    <div className="mb-2">
      <label className="form-label mb-1">{label}</label>
      <CompanyDateInput
        className="form-control"
        name={name}
        value={value}
        onChange={onChange}
        min={min || ""}
        max={max || ""}
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
