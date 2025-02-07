import React from "react";
import PropTypes from "prop-types";

const Table = ({ columns, data, onEditClick, idKey }) => {
  return (
    <div className="table-responsive text-nowrap">
      <table className="table table-sm">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="table-border-bottom-0">
          {data?.length > 0 ? (
            data.map((row) => (
              <tr key={row[idKey]}>
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.key === "actions" ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
                        onClick={() => onEditClick(row[idKey])}
                      >
                        <span className="tf-icons bx bx-pencil"></span>
                      </button>
                    ) : column.render ? (
                      column.render(row[column.key])
                    ) : (
                      row[column.key]
                    )}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="text-center">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  onEditClick: PropTypes.func.isRequired,
  idKey: PropTypes.string.isRequired,
};

export default Table;

