import React from "react";
import PropTypes from "prop-types";

const Grid = ({
  columns,
  data,
  onEditClick,
  idKey,
  modalId,
  popUpId,
  onEmpCodeClick,
  onDownloadClick,
  employees
}) => {
  return (
    <div className="table-responsive text-nowrap" style={{maxHeight:'450px', overflowY:'auto'}}>
      <table className="table table-sm">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={{position:'sticky',top:0,backgroundColor:'white',zIndex:1}}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="table-border-bottom-0">
          {data?.length > 0 ? (
            data.map((row) => (
              <tr key={row[idKey]}>
                {columns?.map((column) => (
                  <td key={column.key}>
                    {column.key === "empCode" ? (
                      window.location.href.includes("employee-profile") ||
                      window.location.href.includes(
                        "employee-salary-config"
                      ) ? (
                        <a
                          href="#{popUpId}"
                          data-bs-toggle="modal"
                          data-bs-target={`#${popUpId}`}
                          style={{ color: "#1893cf", cursor: "pointer" }}
                          onClick={(e) => {
                            e.preventDefault();
                            onEmpCodeClick(row[idKey]);
                          }}
                        >
                          {row[column.key]}
                        </a>
                      ) : (
                        <span style={{ textDecoration: "none" }}>
                          {row[column.key]}
                        </span>
                      )
                    ) : column.key === "actions" ? (
                      <div className="text-end">
                        { employees?.find((emp) => emp.idEmployee === row[idKey])?.attachmentBlobForchildcount && 
                        <button class="btn btn-outline-primary border-0 btn-sm" fdprocessedid="wr0ef8" onClick={() => onDownloadClick(row[idKey])}>
                          <i class="bx bx-paperclip cursor"></i>
                        </button>
                        }
                        <button
                          type="button"
                          className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
                          data-bs-toggle="modal"
                          data-bs-target={`#${modalId}`}
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
  onEmpCodeClick: PropTypes.func.isRequired,
  idKey: PropTypes.string.isRequired,
  modalId: PropTypes.string.isRequired,
  popUpId: PropTypes.string.isRequired,
};

export default Grid;