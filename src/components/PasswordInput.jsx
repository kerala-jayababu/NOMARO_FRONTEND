import { useState } from "react";
import PropTypes from "prop-types";
import { PASSWORD_RULES } from "../utils/passwordRules";

/** Password box with show / hide eye, in the same style as the OTP box on the login page. */
export const PasswordInput = ({ id, label, value, onChange, placeholder, autoComplete, autoFocus }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="mb-3 form-password-toggle">
      <label className="form-label" htmlFor={id}>{label}</label>
      <div className="input-group input-group-merge">
        <input
          type={show ? "text" : "password"}
          id={id}
          className="form-control"
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          maxLength={50}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="input-group-text cursor-pointer" onClick={() => setShow(!show)}>
          <i className={`bx ${show ? "bx-show" : "bx-hide"}`}></i>
        </span>
      </div>
    </div>
  );
};

PasswordInput.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  autoComplete: PropTypes.string,
  autoFocus: PropTypes.bool,
};

/** Live checklist of the password rules (related rules shown together on one line). */
const RULE_LINES = [
  { label: "8 to 50 characters", keys: ["length"] },
  { label: "An upper case letter & A lower case letter", keys: ["upper", "lower"] },
  { label: "A number & A special character", keys: ["digit", "special"] },
  { label: "No spaces", keys: ["space"] },
];

const RuleLine = ({ ok, label }) => (
  <li className={ok ? "text-success" : "text-muted"}>
    <i className={`bx ${ok ? "bx-check-circle" : "bx-circle"} me-1`}></i>{label}
  </li>
);

RuleLine.propTypes = {
  ok: PropTypes.bool,
  label: PropTypes.string.isRequired,
};

export const PasswordRules = ({ password, confirmPassword }) => {
  const value = password || "";
  const passes = (key) => PASSWORD_RULES.find((rule) => rule.key === key).test(value);
  return (
    <ul className="list-unstyled small mb-3">
      {RULE_LINES.map((line) => (
        <RuleLine key={line.label} label={line.label} ok={line.keys.every(passes)} />
      ))}
      <RuleLine label="New and confirm password match" ok={!!password && password === confirmPassword} />
    </ul>
  );
};

PasswordRules.propTypes = {
  password: PropTypes.string,
  confirmPassword: PropTypes.string,
};
