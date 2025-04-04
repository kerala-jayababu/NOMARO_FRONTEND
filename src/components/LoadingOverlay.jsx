import React from "react";

const LoadingOverlay = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 bg-dark d-flex align-items-center justify-content-center"
      style={{ zIndex: 1050,opacity:"0.5"}}
    >
      <div className="spinner-border text-light" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
};

export default LoadingOverlay;

