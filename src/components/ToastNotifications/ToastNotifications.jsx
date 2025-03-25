import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ToastNotifications = () => {
  return <ToastContainer position="top-right" autoClose={2000} />;
};

export default ToastNotifications;
