import React from "react";
import PropTypes from "prop-types";

const StatusBadge = ({ status }) => {
  const getBadgeClass = (status) => {
    return ["Active", "Working"].includes(status)
      ? "bg-label-success"
      : "bg-label-warning";
  };
  return <span className={`badge ${getBadgeClass(status)}`}>{status}</span>;
};

export default StatusBadge;

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
};
