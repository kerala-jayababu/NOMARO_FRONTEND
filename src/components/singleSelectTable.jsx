import React from "react";
import PropTypes from "prop-types";

const SingleSelectTable = ({
  title,
  headers,
  data,
  onSelect,
  searchPlaceholder = "Search...",
  selectedRow,
  searchTerm, // Add searchTerm prop
  onSearchChange, // Add onSearchChange prop
}) => {
  const handleSelect = (row) => {
    if (selectedRow === row) {
      onSelect(null);
    } else {
      onSelect(row);
    }
  };

  return (
    <div className="card ScreenpermissionCard mb-2 border">
      <div className="card-header d-flex align-items-center justify-content-between px-3 py-3 border-bottom">
        <h5 className="m-0">{title}</h5>
        <div className="list_menu">
          <div className="list_searchbox">
            <input
              type="search"
              className="form-control"
              placeholder={searchPlaceholder}
              value={searchTerm} // Bind searchTerm to the input
              onChange={(e) => onSearchChange(e.target.value)} // Call onSearchChange
            />
            <i className="bx bx-search"></i>
          </div>
        </div>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive" style={{
                            maxHeight: "500px", // Adjust the height as needed
                            overflowY: "auto", // Enable vertical scrolling
                            border: "1px solid #ddd", // Optional: Add a border for better visibility
                          }}>
          <table className="table table-sm" >
            <thead>
              <tr>
                <th></th>
                {headers.map((header, index) => (
                  <th key={index} className="text-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="table-border-bottom-0">
              {data
                .filter((row) => {
                  // Filter data based on search term
                  return (
                    row.empCode?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
                    row.empName?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
                    row.designation?.toLowerCase().includes(searchTerm?.toLowerCase())
                  );
                })
                .map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td>
                      <input
                        type="radio"
                        className="form-check-input"
                        name="flexRadioDefault"
                        value={row.id || rowIndex}
                        checked={selectedRow === row}
                        onChange={() => handleSelect(row)}
                      />
                    </td>
                    {headers.map((header, colIndex) => {
                      switch (header) {
                        case "Emp. Code":
                          return <td key={colIndex}>{row.empCode}</td>;
                        case "Employee Name":
                          return <td key={colIndex}>{row.empName}</td>;
                        case "Designation":
                          return <td key={colIndex}>{row.designation}</td>;
                        default:
                          return null;
                      }
                    })}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SingleSelectTable;

SingleSelectTable.propTypes = {
  title: PropTypes.string,
  headers: PropTypes.array,
  data: PropTypes.array,
  onSelect: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  selectedRow: PropTypes.object,
  searchTerm: PropTypes.string, // Add searchTerm prop type
  onSearchChange: PropTypes.func, // Add onSearchChange prop type
};