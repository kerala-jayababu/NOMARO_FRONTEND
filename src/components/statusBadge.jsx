import React from "react";
import PropTypes from "prop-types";

const StatusBadge = ({ status }) => {
  const getBadgeClass = (status) => {
    return ["Active", "Working"].includes(status)
      ? "bg-label-success"
      : "bg-label-warning";
  };
  
  const formatStatus = (status) => {
    if (status === "NotWorking") {
      return "Not Working";
    }
    return status;
  };
  
  return <span className={`badge ${getBadgeClass(status)}`}>{formatStatus(status)}</span>;
};

export default StatusBadge;

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
};
