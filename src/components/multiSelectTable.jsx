import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";


const MultiSelectTable = ({ data, columns, onSelectionChange }) => {
  const [tableData, setTableData] = useState(data);

  useEffect(() => {
    setTableData(data);
  }, [data]);

  const handleCheckboxChange = (parentIndex, columnKey, isSubMenu = false, subMenuIndex = -1) => {
    const updatedData = [...tableData];

    if (isSubMenu) {
      updatedData[parentIndex].subMenus[subMenuIndex][columnKey] =
        !updatedData[parentIndex].subMenus[subMenuIndex][columnKey];
    } else {
      updatedData[parentIndex][columnKey] = !updatedData[parentIndex][columnKey];
    }

    setTableData(updatedData);
    onSelectionChange(updatedData);
  };

  return (
    <div className="table-responsive">
      <table className="table table-sm">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.className || ""}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.map((parent, parentIndex) => (
            <React.Fragment key={parentIndex}>
              <tr>
                <td>
                  <strong>{parent.screenName}</strong>
                </td>
                {columns.slice(1).map((column) => (
                  <td key={column.key} className={column.className || ""}>
                    {column.type === "checkbox" && (
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={parent[column.key] || false}
                        onChange={() => handleCheckboxChange(parentIndex, column.key)}
                      />
                    )}
                  </td>
                ))}
              </tr>
              {parent.subMenus &&
                parent.subMenus.map((subMenu, subMenuIndex) => (
                  <tr key={`${parentIndex}-${subMenuIndex}`}>
                    <td style={{ paddingLeft: "20px" }}>{subMenu.screenName}</td>
                    {columns.slice(1).map((column) => (
                      <td key={column.key} className={column.className || ""}>
                        {column.type === "checkbox" && (
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={subMenu[column.key] || false}
                            onChange={() =>
                              handleCheckboxChange(parentIndex, column.key, true, subMenuIndex)
                            }
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};


MultiSelectTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.oneOf(["text", "checkbox"]).isRequired,
      className: PropTypes.string,
    })
  ).isRequired,
  onSelectionChange: PropTypes.func.isRequired,
};

export default MultiSelectTable;