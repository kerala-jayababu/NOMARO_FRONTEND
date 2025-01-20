import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import secureLocalStorage from "react-secure-storage";

function PrivateRoute() {
  const isAuthenticated = () => {
    const user = secureLocalStorage.getItem("user");
    return user === null;
  };
  return isAuthenticated() ? <Outlet /> : <Navigate to="/" />;
}

export default PrivateRoute;
