import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import LoginService from "../core/services/LoginService";
import { useLoader } from "./LoaderContext";
import { PasswordInput, PasswordRules } from "./PasswordInput";
import { isStrongPassword } from "../utils/passwordRules";

const ChangePasswordModal = ({ show, onClose }) => {
  const { showLoader, hideLoader } = useLoader();
  const [hasPassword, setHasPassword] = useState(true);
  const [lastChanged, setLastChanged] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!show) return;
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    LoginService.getPasswordStatus().then((res) => {
      const status = res?.data?.data;
      if (status) {
        setHasPassword(status.hasPassword);
        setLastChanged(status.passwordUpdatedOn);
      }
    });
  }, [show]);

  const canSubmit =
    (!hasPassword || currentPassword !== "") &&
    isStrongPassword(newPassword) &&
    newPassword === confirmPassword;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    showLoader();
    LoginService.changePassword({
      currentPassword: hasPassword ? currentPassword : null,
      newPassword,
      confirmPassword,
    }).then((res) => {
      hideLoader();
      if (res?.data?.success) {
        toast.success(res.data.message || "Password changed successfully", { position: "top-right", autoClose: 2000 });
        onClose();
      }
    }).catch(() => hideLoader());
  };

  return (
    <Modal show={show} onHide={onClose} centered backdrop="static" keyboard={false} aria-labelledby="change-password-title">
      <form onSubmit={handleSubmit} noValidate>
        <Modal.Header closeButton>
          <Modal.Title id="change-password-title">
            <h5 className="m-0">{hasPassword ? "Change Password" : "Set Password"}</h5>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!hasPassword && (
            <div className="alert alert-info py-2 small">
              You have not set a password yet. Once set, you can login using either OTP or password.
            </div>
          )}
          {hasPassword && lastChanged && (
            <div className="small text-muted mb-3">
              Last changed on {new Date(lastChanged).toLocaleDateString("en-GB")}
            </div>
          )}
          {hasPassword && (
            <PasswordInput id="currentPassword" label="Current Password" value={currentPassword}
              onChange={setCurrentPassword} autoComplete="current-password" autoFocus />
          )}
          <PasswordInput id="newPassword" label="New Password" value={newPassword}
            onChange={setNewPassword} autoComplete="new-password" autoFocus={!hasPassword} />
          <PasswordInput id="confirmPassword" label="Confirm New Password" value={confirmPassword}
            onChange={setConfirmPassword} autoComplete="new-password" />
          <PasswordRules password={newPassword} confirmPassword={confirmPassword} />
        </Modal.Body>
        <Modal.Footer>
          <button type="submit" className="btn btn-primary px-4 me-2" disabled={!canSubmit}>
            {hasPassword ? "Change Password" : "Set Password"}
          </button>
          <button type="button" className="btn btn-outline-secondary px-4" onClick={onClose}>
            Cancel
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

ChangePasswordModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ChangePasswordModal;
