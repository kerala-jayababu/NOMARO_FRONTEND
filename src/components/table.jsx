import React from "react";
import PropTypes from "prop-types";

const Table = ({ headers, rows }) => {
  return (
    <table className="table table-sm mb-0 border">
      <thead>
        <tr>
          {headers.map((header, index) => (
            <th key={index}>
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
};

export default Table;

Table.propTypes = {
  headers: PropTypes.array.isRequired,
  rows: PropTypes.array.isRequired,
};
