import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import secureLocalStorage from "react-secure-storage";

function PrivateRoute() {
  const isAuthenticated = () => {
    const user = secureLocalStorage.getItem("user");
    console.log("User from storage:", user); // Debug log
    return !!user; // Returns true if user exists, false otherwise
  };

  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
}

export default PrivateRoute;
