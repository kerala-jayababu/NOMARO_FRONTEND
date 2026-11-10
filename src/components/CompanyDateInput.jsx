import { useState } from "react";
import PropTypes from "prop-types";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Utils from "../utils/Utils";

const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toIsoDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const CompanyDateInput = ({ name, value, defaultValue, onChange, min, max, wrapperClassName, ...props }) => {
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(() => parseDate(defaultValue));
  const selected = parseDate(isControlled ? value : uncontrolledValue);

  const handleChange = (date) => {
    if (!isControlled) setUncontrolledValue(date);
    onChange?.({ target: { name, value: date ? toIsoDate(date) : "" } });
  };

  return (
    <DatePicker
      {...props}
      name={name}
      selected={selected}
      onChange={handleChange}
      dateFormat={Utils.DATE_PICKER_FORMAT}
      wrapperClassName={wrapperClassName || "w-100"}
      minDate={parseDate(min)}
      maxDate={parseDate(max)}
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
    />
  );
};

CompanyDateInput.propTypes = {
  name: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  onChange: PropTypes.func,
  min: PropTypes.string,
  max: PropTypes.string,
  wrapperClassName: PropTypes.string,
};

export default CompanyDateInput;
