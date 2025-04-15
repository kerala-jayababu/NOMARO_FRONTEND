import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import secureLocalStorage from "react-secure-storage";

function PrivateRoute() {
  const isAuthenticated = () => {
    const user = secureLocalStorage.getItem("user");
    return !!user; // Returns true if user exists, false otherwise
  };

  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
}

export default PrivateRoute;
