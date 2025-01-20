import React from "react";

function Login() {
  return (
    <div className="container-xxl">
      <div className="authentication-wrapper authentication-basic container-p-y">
        <div className="authentication-inner">
          {/* <!-- Register --> */}
          <div className="card">
            <div className="card-body">
              {/* <!-- Logo --> */}
              <div className="app-brand justify-content-center">
                <a href="index.html" className="app-brand-link gap-2">
                  <span className="app-brand-logo demo">
                    <img src="assets/logo.png" />
                  </span>
                </a>
              </div>
              {/* <!-- /Logo -->
            <!-- <p className="mb-4 text-center">Welcome back! Please enter your details.</p> --> */}
              <form
                id="formAuthentication"
                className="mb-3"
                method="POST"
              >
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email or Username
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="email"
                    name="email-username"
                    placeholder="Enter your email or username"
                    autoFocus
                  />
                </div>
                <div className="mb-3 form-password-toggle">
                  <label className="form-label" htmlFor="password">
                    Password
                  </label>
                  <div className="input-group input-group-merge">
                    <input
                      type="password"
                      id="password"
                      className="form-control"
                      name="password"
                      placeholder="&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;"
                      aria-describedby="password"
                    />
                    <span className="input-group-text cursor-pointer">
                      <i className="bx bx-hide"></i>
                    </span>
                  </div>
                </div>
                {/* <!-- <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="remember-me" />
                    <label className="form-check-label" htmlFor="remember-me"> Remember Me </label>
                  </div>
                  <a href="auth-forgot-password-basic.html">
                    <small>Forgot Password?</small>
                  </a>
                </div>
              </div> --> */}
                <div className="mb-3 mt-4">
                  <a className="btn btn-primary d-grid w-100" href="/dashboard">
                    Sign in
                  </a>
                </div>
              </form>
              {/* <!-- <p className="text-center">
              <span>New on our platform?</span>
              <a href="auth-register-basic.html">
                <span>Create an account</span>
              </a>
            </p> --> */}
            </div>
          </div>
          {/* <!-- /Register --> */}
        </div>
      </div>
    </div>
  );
}

export default Login;
