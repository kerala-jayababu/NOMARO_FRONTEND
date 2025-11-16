import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signIn } from "../redux/api/authAPI";
import secureLocalStorage from "react-secure-storage";
import CommonService from "../core/services/CommonService";
 
function Login() {
  const navigate = useNavigate();
  const [logo, setLogo] = useState("");

   
  const handleSignIn = async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;


    const formData = { email, password };
 
    try {
      console.log("Form data:", formData);
      const result = await signIn(formData); // Await API response
      console.log("Sign in result:", result.data);
 
      if (result?.data) {
        secureLocalStorage.setItem("user", JSON.stringify(result.data));
        console.log("Sign in successful, token received.");

        navigate("/dashboard");
      } else {
        console.error("Authentication failed, no token received.");
      }
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  useEffect(()=>{
    secureLocalStorage.getItem("user");
    if(secureLocalStorage.getItem("user")) {
      navigate("/dashboard");
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
  },[])
 
  return (
    <div className="container-xxl">
      <div className="authentication-wrapper authentication-basic container-p-y">
        <div className="authentication-inner">
          <div className="card">
            <div className="card-body">
              <div className="app-brand justify-content-center">
                <a href="index.html" className="app-brand-link gap-2">
                  <span className="app-brand-logo demo">
                    {logo && <img src={logo} alt="Logo" />}
                  </span>
                </a>
              </div>
              <form id="formAuthentication" className="mb-3">
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
                      placeholder="••••••••••••"
                    />
                    <span className="input-group-text cursor-pointer">
                      <i className="bx bx-hide"></i>
                    </span>
                  </div>
                </div>
                <div className="mb-3 mt-4">
                  <button
                    type="button"
                    className="btn btn-primary d-grid w-100"
                    onClick={handleSignIn}
                  >
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
 
export default Login;
 
 