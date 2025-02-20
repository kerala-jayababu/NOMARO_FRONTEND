import React from "react";
import PropTypes from "prop-types";

const Grid = ({ columns, data, onEditClick, idKey, modalId, popUpId , onEmpCodeClick}) => {
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
                {columns?.map((column) => (
                  <td
                    key={column.key}
                    data-bs-toggle="modal"
                    data-bs-target={`#${popUpId}`}
                    onClick={() => {
                      if (column.key !== "actions") {
                        // Ensure we don't trigger on actions column
                        console.log(
                          `Editing row with ID: ${row[idKey]} for field: ${column.key}`
                        );
                        onEmpCodeClick(row[idKey]); // Call onEditClick when cell is clicked
                      }
                    }}
                  >
                    {column.key === "actions" ? (
                      <div className="text-end">
                        {" "}
                        {/* Align button to right */}
                        <button
                          type="button"
                          className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
                          data-bs-toggle="modal"
                          data-bs-target={`#${modalId}`} // Dynamic modal ID
                          onClick={() => {
                            console.log(`Editing row with ID: ${row[idKey]}`);
                            onEditClick(row[idKey]);
                          }}
                        >
                          <span className="bx bx-pencil"></span>
                        </button>
                      </div>
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

Grid.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  onEditClick: PropTypes.func.isRequired,
  idKey: PropTypes.string.isRequired,
  modalId: PropTypes.string.isRequired, // Ensure modal ID is passed
  popUpId: PropTypes.string.isRequired, // Ensure pop-up ID is passed
};

export default Grid;
