import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import secureLocalStorage from "react-secure-storage";
import LoginService from "../core/services/LoginService";
import { toast } from "react-toastify";
import { useLoader } from "../components/LoaderContext";
import CommonService from "../core/services/CommonService";
import { PasswordInput, PasswordRules } from "../components/PasswordInput";
import { isStrongPassword } from "../utils/passwordRules";

const LOGIN_MODE_KEY = "nomaroLoginMode"; // remembers the user's last choice (OTP / PASSWORD)
const MODE_OTP = "OTP";
const MODE_PASSWORD = "PASSWORD";
const MODE_RESET = "RESET";

// Keeps the selected tab in the app theme colour (core.css pills default to purple)
const activeTabStyle = { backgroundColor: "var(--primary-color)", color: "#fff" };

// Logo is shown at 70% of its normal size on the Forgot Password screen (it has more fields)
const RESET_LOGO_SCALE = 0.7;

const getSavedMode = () => {
  try {
    return localStorage.getItem(LOGIN_MODE_KEY) === MODE_PASSWORD ? MODE_PASSWORD : MODE_OTP;
  } catch {
    return MODE_OTP;
  }
};

function LoginWithOtp() {
  const { showLoader, hideLoader } = useLoader();
  const navigate = useNavigate();
  const [mode, setMode] = useState(getSavedMode);
  const [emailId, setEmailId] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [logo, setLogo] = useState("");
  const [logoWidth, setLogoWidth] = useState(0);

  const changeMode = (newMode) => {
    setMode(newMode);
    setOtp('');
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
    if (newMode !== MODE_RESET) {
      try { localStorage.setItem(LOGIN_MODE_KEY, newMode); } catch { /* ignore */ }
    }
  };

  // Same session setup for OTP and password login
  const completeLogin = (data) => {
    const array = data.authorizedModules.split(',');
    secureLocalStorage.setItem("authorizedModules", array);
    secureLocalStorage.setItem("currentAuth", array[0]);
    secureLocalStorage.setItem("token", data.token);
    secureLocalStorage.setItem("user", JSON.stringify(data));
    navigate("/dashboard");
  };

  const handleSignIn = () => {
    showLoader();
    LoginService.validateEmailwithOtp(emailId.trim(), otp).then(res => {
      hideLoader();
      if (res?.data?.success && res.data.data?.idEmployee > 0) {
        completeLogin(res.data.data);
      } else if (res?.data) {
        toast.error(res.data.message || 'Invalid Email ID or OTP', { position: 'top-right', autoClose: 2500 });
      }
    }).catch(() => {
      hideLoader();
    });
  };

  const handlePasswordSignIn = () => {
    showLoader();
    LoginService.loginWithPassword(emailId.trim(), password).then(res => {
      hideLoader();
      if (res?.data?.success && res.data.data?.idEmployee > 0) {
        completeLogin(res.data.data);
      }
      // Failure messages (wrong password, locked, no password set) are shown by the common error toast
    }).catch(() => {
      hideLoader();
    });
  };

  const handleResetPassword = () => {
    showLoader();
    LoginService.resetPasswordWithOtp({
      emailID: emailId.trim(),
      otp,
      newPassword,
      confirmPassword,
    }).then(res => {
      hideLoader();
      if (res?.data?.success) {
        toast.success(res.data.message || 'Password has been reset', { position: 'top-right', autoClose: 2500 });
        changeMode(MODE_PASSWORD);
      }
    }).catch(() => {
      hideLoader();
    });
  };

  const getOtp = () => {
    showLoader();
    LoginService.getOtp(emailId.trim()).then(res => {
      hideLoader();
      if (res.data.success && res.data.data.idEmployee > 0) {
        toast.success('OTP sent to email successfully', {
          position: 'top-right',
          autoClose: 2000
        });
      } else {
        toast.error(res.data?.data?.otp || 'Failed to sent OTP', {
          position: 'top-right',
          autoClose: 2000
        });
      }
    }).catch(err => {
      hideLoader();
    });
  };

  const canReset = emailId.trim() !== '' && otp !== '' && isStrongPassword(newPassword) && newPassword === confirmPassword;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (emailId.trim() === '') return;
    if (mode === MODE_OTP && otp !== '') handleSignIn();
    if (mode === MODE_PASSWORD && password !== '') handlePasswordSignIn();
    if (mode === MODE_RESET && canReset) handleResetPassword();
  };

  useEffect(() => {
    if (secureLocalStorage.getItem("user")) {
      navigate("/dashboard");
    } else {
      secureLocalStorage.clear();
    }

    // Fetch logo from system parameters
    CommonService.getSystemParameters().then(res => {
      if (res.data && res.data.data) {
        const productLogo = res.data.data.find(item => item.parameterName === "ProductLogo");
        if (productLogo && productLogo.parameterBinaryValue) {
          setLogo(`data:image/png;base64,${productLogo.parameterBinaryValue}`);
        }
      }
    }).catch(err => {
      // Keep logo blank if API fails
      console.error("Failed to fetch logo:", err);
    });
  }, [])

  const otpField = (
    <div className="mb-3 form-password-toggle">
      <label className="form-label" htmlFor="otp">
        OTP
      </label>
      <div className="input-group input-group-merge">
        <input
          type={showOtp ? 'text' : 'password'}
          id="otp"
          className="form-control"
          name="otp" value={otp} maxLength={6}
          autoComplete="one-time-code"
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9]/g, '');
            setOtp(value);
          }} />
        <span className="input-group-text cursor-pointer" onClick={() => setShowOtp(!showOtp)}>
          {!showOtp && <i className="bx bx-hide"></i>}
          {showOtp && <i className="bx bx-show"></i>}
        </span>
      </div>
    </div>
  );

  const getOtpButton = (
    <div className="mb-3 mt-4">
      <button
        type="button" onClick={() => getOtp()}
        className="btn btn-primary d-grid w-100" disabled={emailId.trim() == ''}>
        Get OTP
      </button>
    </div>
  );

  return (
    <div className="container-xxl">
      <div className="authentication-wrapper authentication-basic container-p-y">
        <div className="authentication-inner">
          <div className="card">
            <div className="card-body">
              <div className="app-brand justify-content-center">
                <a href="index.html" className="app-brand-link gap-2">
                  <span className="app-brand-logo demo">
                    {logo && (
                      <img src={logo} alt="Logo"
                        onLoad={(e) => setLogoWidth(e.currentTarget.naturalWidth)}
                        style={mode === MODE_RESET && logoWidth ? { width: logoWidth * RESET_LOGO_SCALE, height: "auto" } : undefined} />
                    )}
                  </span>
                </a>
              </div>

              {mode !== MODE_RESET ? (
                <div className="nav nav-pills nav-fill mb-4 p-1 rounded" style={{ backgroundColor: "var(--primary-light)" }} role="tablist">
                  <button type="button" role="tab" aria-selected={mode === MODE_OTP}
                    className={`nav-link py-2 ${mode === MODE_OTP ? "active" : ""}`}
                    style={mode === MODE_OTP ? activeTabStyle : undefined}
                    onClick={() => changeMode(MODE_OTP)}>
                    <i className="bx bx-envelope me-1"></i> Login using OTP
                  </button>
                  <button type="button" role="tab" aria-selected={mode === MODE_PASSWORD}
                    className={`nav-link py-2 ${mode === MODE_PASSWORD ? "active" : ""}`}
                    style={mode === MODE_PASSWORD ? activeTabStyle : undefined}
                    onClick={() => changeMode(MODE_PASSWORD)}>
                    <i className="bx bx-lock-alt me-1"></i> Login using Password
                  </button>
                </div>
              ) : (
                <div className="mb-4">
                  <h5 className="mb-1">Forgot Password</h5>
                  <p className="small text-muted mb-0">Get an OTP on your email and set a new password.</p>
                </div>
              )}

              <form id="formAuthentication" className="mb-3" onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email ID
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="email"
                    name="email-username"
                    placeholder="Enter your email"
                    autoFocus value={emailId} autoComplete="username"
                    onChange={(e) => setEmailId(e.target.value)} />
                </div>

                {mode === MODE_OTP && (
                  <>
                    {getOtpButton}
                    {otpField}
                    <div className="mb-3 mt-4">
                      <button
                        type="submit"
                        className="btn btn-primary d-grid w-100"
                        disabled={emailId.trim() == '' || otp == ''}>
                        Sign in
                      </button>
                    </div>
                  </>
                )}

                {mode === MODE_PASSWORD && (
                  <>
                    <PasswordInput id="password" label="Password" value={password}
                      onChange={setPassword} autoComplete="current-password" />
                    <div className="text-end mb-3" style={{ marginTop: "-0.5rem" }}>
                      <a href="#" className="small" onClick={(e) => { e.preventDefault(); changeMode(MODE_RESET); }}>
                        Forgot password?
                      </a>
                    </div>
                    <div className="mb-3">
                      <button
                        type="submit"
                        className="btn btn-primary d-grid w-100"
                        disabled={emailId.trim() == '' || password == ''}>
                        Sign in
                      </button>
                    </div>
                    <p className="small text-muted text-center mb-0">
                      First time? Login using OTP, then set your password from <b>Change Password</b> in the profile menu.
                    </p>
                  </>
                )}

                {mode === MODE_RESET && (
                  <>
                    {getOtpButton}
                    {otpField}
                    <PasswordInput id="newPassword" label="New Password" value={newPassword}
                      onChange={setNewPassword} autoComplete="new-password" />
                    <PasswordInput id="confirmPassword" label="Confirm New Password" value={confirmPassword}
                      onChange={setConfirmPassword} autoComplete="new-password" />
                    <PasswordRules password={newPassword} confirmPassword={confirmPassword} />
                    <div className="mb-3">
                      <button type="submit" className="btn btn-primary d-grid w-100" disabled={!canReset}>
                        Reset Password
                      </button>
                    </div>
                    <div className="text-center">
                      <a href="#" className="small" onClick={(e) => { e.preventDefault(); changeMode(MODE_PASSWORD); }}>
                        <i className="bx bx-chevron-left"></i> Back to login
                      </a>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginWithOtp;
