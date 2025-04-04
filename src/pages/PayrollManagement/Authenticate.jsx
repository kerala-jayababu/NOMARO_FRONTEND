import React, { useEffect, useState } from "react";
import SalaryGenerationService from "../../core/services/SalaryGenerationService";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import secureLocalStorage from "react-secure-storage";
import { toast } from "react-hot-toast";

function Authenticate() {
  const { search } = useLocation();
  const param = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const params = new URLSearchParams(search);
  const token = params.get("tk");
  // Debug log
  useEffect(() => {
    if (token) {
      setLoading(true);
      SalaryGenerationService.decryptToken(token)
        .then((res) => {
          if (res.error) {
            toast.error(res.error);
            setLoading(false);
          } else {
            secureLocalStorage.setItem("user", JSON.stringify(res.data));
            setSuccess(true);
            setLoading(false);
            setTimeout(() => {
              navigate(`/dashboard/${param.route}`);
            }, 1500);
          }
        })
        .catch((error) => {
          console.error("Authentication error:", error);
          toast.error("Authentication failed");
          setLoading(false);
        });
    } else {
      toast.error("No authentication token provided");
      setLoading(false);
    }
  }, []);

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
      {loading && (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Authenticating...</p>
        </div>
      )}
      
      {!loading && success && (
        <div className="text-center">
          <div className="mb-3">
            <i className="bx bx-check-circle text-success" style={{ fontSize: "4rem" }}></i>
          </div>
          <h4 className="text-success">Authentication Successful</h4>
          <p>Redirecting to dashboard...</p>
        </div>
      )}
      
      {!loading && !success && (
        <div className="text-center">
          <div className="mb-3">
            <i className="bx bx-error-circle text-danger" style={{ fontSize: "4rem" }}></i>
          </div>
          <h4 className="text-danger">Authentication Failed</h4>
          <button 
            className="btn btn-primary mt-3" 
            onClick={() => navigate("/login")}
          >
            Go to Login
          </button>
        </div>
      )}
    </div>
  );
}

export default Authenticate;
