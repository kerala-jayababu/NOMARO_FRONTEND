import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import secureLocalStorage from "react-secure-storage";
import LoginService from "../core/services/LoginService";
import { toast } from "react-toastify";

function LoginWithOtp() {
  const navigate = useNavigate();
  const [emailId, setEmailId] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);

  const handleSignIn = () => {
    LoginService.validateEmailwithOtp(emailId, otp).then(res => {
      if (res.data.success && res.data.data.idEmployee > 0) {
        const array = res.data.data.authorizedModules.split(',');
        console.log(array)
        secureLocalStorage.setItem("authorizedModules", array);
        secureLocalStorage.setItem("currentAuth", array[0]);
        secureLocalStorage.setItem("token", res.data.data.token);
        secureLocalStorage.setItem("user", JSON.stringify(res.data.data));
        navigate("/dashboard");
      }
    }).catch(err => {
    });
  };

  const getOtp = () => {
    LoginService.getOtp(emailId).then(res => {
      if (res.data.success && res.data.data.idEmployee > 0) {
        toast.success('OTP sent to email successfully', {
          position: 'top-right',
          autoClose: 2000
        });
      } else {
        toast.error('Failed to sent OTP', {
          position: 'top-right',
          autoClose: 2000
        });
      }
    }).catch(err => {
    });
  };

  useEffect(() => {
    if (secureLocalStorage.getItem("user")) {
      navigate("/dashboard");
    }
  }, [])

  return (
    <div className="container-xxl">
      <div className="authentication-wrapper authentication-basic container-p-y">
        <div className="authentication-inner">
          <div className="card">
            <div className="card-body">
              <div className="app-brand justify-content-center">
                <a href="index.html" className="app-brand-link gap-2">
                  <span className="app-brand-logo demo">
                    <img src="assets/logo.png" alt="Logo" />
                  </span>
                </a>
              </div>
              <form id="formAuthentication" className="mb-3">
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
                    autoFocus value={emailId} autoComplete="false"
                    onChange={(e) => setEmailId(e.target.value)} />
                </div>
                <div className="mb-3 mt-4">
                  <button
                    type="button" onClick={() => getOtp()}
                    className="btn btn-primary d-grid w-100" disabled={emailId == ''}>
                    Get OTP
                  </button>
                </div>
                <div className="mb-3 form-password-toggle">
                  <label className="form-label" htmlFor="password">
                    OTP
                  </label>
                  <div className="input-group input-group-merge">
                    <input
                      type={showOtp ? 'number' : 'password'}
                      id="password"
                      className="form-control"
                      name="password" value={otp}
                      onChange={(e) => setOtp(e.target.value)} />
                    <span className="input-group-text cursor-pointer" onClick={() => setShowOtp(!showOtp)}>
                      {!showOtp && <i className="bx bx-hide"></i>}
                      {showOtp && <i className="bx bx-show"></i>}
                    </span>
                  </div>
                </div>
                <div className="mb-3 mt-4">
                  <button
                    type="button"
                    className="btn btn-primary d-grid w-100"
                    onClick={() => handleSignIn()} disabled={emailId == '' || otp == ''}>
                    Sign in
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginWithOtp;

