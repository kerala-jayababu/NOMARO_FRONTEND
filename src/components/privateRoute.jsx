import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import secureLocalStorage from "react-secure-storage";
import { getCompanyCode } from "../utils/companyContext";

function PrivateRoute() {
  const isAuthenticated = () => {
    const user = secureLocalStorage.getItem("user");
    return !!user; // Returns true if user exists, false otherwise
  };

  // Redirect to the company-specific login so the company code stays in the URL
  const code = getCompanyCode();
  const loginPath = code ? `/${code}/login` : "/";

  return isAuthenticated() ? <Outlet /> : <Navigate to={loginPath} replace />;
}

export default PrivateRoute;
