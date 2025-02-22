// import React, { useState, useEffect } from "react";
// import PropTypes from "prop-types";

// const SmallTable = ({
//   initialRows = [],
//   columns = [],
//   rowActions = true,
//   onAddRow,
//   onDeleteRow,
//   onInputChange,
// }) => {
//   const [rows, setRows] = useState(initialRows);

//   useEffect(() => {
//     setRows(initialRows);
//   }, [initialRows]);

//   const handleAddRow = () => {
//     const newRow = columns.reduce((acc, column) => {
//       acc[column.field] = "";
//       return acc;
//     }, {});
//     const updatedRows = [...rows, newRow];
//     setRows(updatedRows);
//     if (onAddRow) onAddRow(newRow);
//   };

//   const handleDeleteRow = (index) => {
//     const updatedRows = rows.filter((_, i) => i !== index);
//     setRows(updatedRows);
//     if (onDeleteRow) onDeleteRow(index);
//   };

//   const handleInputChange = (e, index, field) => {
//     const updatedRows = [...rows];
//     updatedRows[index][field] = e.target.value;
  
//     if (field === "method") {
//       updatedRows[index].value = "";
//       updatedRows[index].formula = "";
//       updatedRows[index].percentageOf = "";
//     }
  
//     setRows(updatedRows);
//     if (onInputChange) onInputChange(updatedRows, index, field);
//   };
  
  
  
// // const renderDynamicField = (row, rowIndex) => {
// //     switch (row.method) {
// //       case "Percentage of":
// //         return (

// //         <div className="d-flex">
// //           <select
// //             className="form-select form-select-sm me-2"
// //             style={{ width: "60%" }}
// //             value={row.percentageOf || ""}
// //             onChange={(e) => handleInputChange(e, rowIndex, "percentageOf")}
// //           >
// //             <option value="">Select</option>
// //             {columns[0].options.map((option, optIndex) => (
// //               <option key={optIndex} value={option.value}>
// //                 {option.label}
// //               </option>
// //             ))}
// //           </select>
// //           <input
// //             type="number"
// //             className="form-control form-control-sm"
// //             style={{ width: "40%" }}
// //             value={row.value || ""}
// //             onChange={(e) => handleInputChange(e, rowIndex, "value")}
// //             placeholder="Value"
// //           />
// //         </div>
// //         );
// //       case "Fixed Amount":
// //         return (
// //           <input
// //             type="number"
// //             className="form-control form-control-sm"
// //             value={row.value || ""}
// //             onChange={(e) => handleInputChange(e, rowIndex, "value")}
// //             placeholder="Amount"
// //           />
// //         );
// //       case "Custom Formula":
// //         return (
// //           <input
// //             type="text"
// //             className="form-control form-control-sm"
// //             value={row.formula || ""}
// //             onChange={(e) => handleInputChange(e, rowIndex, "formula")}
// //             placeholder="Custom Formula"
// //           />
// //         );
// //       default:
// //         // Always show both fields for any other method or when method is not set
// //         return (
// //           <div className="d-flex">
// //             <select
// //               className="form-select form-select-sm me-2"
// //               style={{ width: "60%" }}
// //               value={row.percentageOf || ""}
// //               onChange={(e) => handleInputChange(e, rowIndex, "percentageOf")}
// //             >
// //               <option value="">Select</option>
// //               {columns[0].options.map((option, optIndex) => (
// //                 <option key={optIndex} value={option.value}>
// //                   {option.label}
// //                 </option>
// //               ))}
// //             </select>
// //             <input
// //               type="number"
// //               className="form-control form-control-sm"
// //               style={{ width: "40%" }}
// //               value={row.value || ""}
// //               onChange={(e) => handleInputChange(e, rowIndex, "value")}
// //               placeholder="Value"
// //             />
// //           </div>
// //         );
// //     }
// //   };
// const renderDynamicField = (row, rowIndex) => {
//   switch (row.method) {
//     case "Percentage of":
//       return (
//         <div className="d-flex">
//           <select
//             className="form-select form-select-sm me-2"
//             style={{ width: "60%" }}
//             value={row.percentageOf || ""}
//             onChange={(e) => handleInputChange(e, rowIndex, "percentageOf")}
//           >
//             <option value="">Select</option>
//             {columns[0].options.map((option, optIndex) => (
//               <option key={optIndex} value={option.value}>
//                 {option.label}
//               </option>
//             ))}
//           </select>
//           <input
//             type="number"
//             className="form-control form-control-sm"
//             style={{ width: "40%" }}
//             value={row.value || ""}
//             onChange={(e) => handleInputChange(e, rowIndex, "value")}
//             placeholder="Value"
//           />
//         </div>
//       );
//     case "Fixed Amount":
//       return (
//         <input
//           type="number"
//           className="form-control form-control-sm"
//           value={row.value || ""}
//           onChange={(e) => handleInputChange(e, rowIndex, "value")}
//           placeholder="Amount"
//         />
//       );
//     case "Custom Formula":
//       return (
//         <input
//           type="text"
//           className="form-control form-control-sm"
//           value={row.formula || ""}
//           onChange={(e) => handleInputChange(e, rowIndex, "formula")}
//           placeholder="Custom Formula"
//         />
//       );
//     default:
//       return (
//         <div className="d-flex">
//           <select
//             className="form-select form-select-sm me-2"
//             style={{ width: "60%" }}
//             value={row.percentageOf || ""}
//             onChange={(e) => handleInputChange(e, rowIndex, "percentageOf")}
//           >
//             <option value="">Select</option>
//             {columns[0].options.map((option, optIndex) => (
//               <option key={optIndex} value={option.value}>
//                 {option.label}
//               </option>
//             ))}
//           </select>
//           <input
//             type="number"
//             className="form-control form-control-sm"
//             style={{ width: "40%" }}
//             value={row.value || ""}
//             onChange={(e) => handleInputChange(e, rowIndex, "value")}
//             placeholder="Value"
//           />
//         </div>
//       );
//   }
// };
  

//   return (
//     <table className="table table-sm">
//       <thead>
//         <tr>
//           {columns.map((column, index) => (
//             <th key={index} style={{ width: column.width }}>
//               {column.header}
//             </th>
//           ))}
//           {rowActions && <th style={{ width: "10%" }}></th>}
//         </tr>
//       </thead>
//       <tbody>
//         {rows.map((row, rowIndex) => (
//           <tr key={rowIndex}>
//             {columns.map((column, colIndex) => (
//               <td key={colIndex}>
//                 {column.type === "select" ? (
//                   <select
//                     className="form-select form-select-sm"
//                     value={row[column.field]}
//                     onChange={(e) => handleInputChange(e, rowIndex, column.field)}
//                   >
//                     {column.options.map((option, optIndex) => (
//                       <option key={optIndex} value={option.value}>
//                         {option.label}
//                       </option>
//                     ))}
//                   </select>
//                 ) : column.type === "dynamic" ? (
//                   renderDynamicField(row, rowIndex)
//                 ) : (
//                   <input
//                     type={column.type}
//                     className="form-control form-control-sm"
//                     placeholder={column.placeholder}
//                     value={row[column.field]}
//                     onChange={(e) => handleInputChange(e, rowIndex, column.field)}
//                   />
//                 )}
//               </td>
//             ))}
//             {rowActions && (
//               <td>
//                 <div className="d-flex justify-content-center">
//                   {rowIndex === rows.length - 1 ? (
//                     <button
//                       className="btn btn-outline-primary border-0 btn-sm"
//                       onClick={handleAddRow}
//                     >
//                       <i className="bx bx-plus"></i>
//                     </button>
//                   ) : (
//                     <button
//                       className="btn btn-outline-danger btn-sm border-0"
//                       onClick={() => handleDeleteRow(rowIndex)}
//                     >
//                       <i className="bx bx-trash"></i>
//                     </button>
//                   )}
//                 </div>
//               </td>
//             )}
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   );
// };

// export default SmallTable;

// SmallTable.propTypes = {
//   initialRows: PropTypes.array,
//   columns: PropTypes.arrayOf(
//     PropTypes.shape({
//       header: PropTypes.string.isRequired,
//       field: PropTypes.string.isRequired,
//       type: PropTypes.string.isRequired,
//       options: PropTypes.array,
//       width: PropTypes.string,
//     })
//   ),
//   rowActions: PropTypes.bool,
//   onAddRow: PropTypes.func,
//   onDeleteRow: PropTypes.func,
//   onInputChange: PropTypes.func,
// };
// import React, { useState, useEffect } from "react";
// import PropTypes from "prop-types";

// const SmallTable = ({
//   initialRows = [],
//   columns = [],
//   rowActions = true,
//   onAddRow,
//   onDeleteRow,
//   onInputChange,
// }) => {
//   const [rows, setRows] = useState(initialRows);

//   useEffect(() => {
//     setRows(initialRows);
//   }, [initialRows]);

//   const handleAddRow = () => {
//     const newRow = columns.reduce((acc, column) => {
//       acc[column.field] = "";
//       return acc;
//     }, {});
//     const updatedRows = [...rows, newRow];
//     setRows(updatedRows);
//     if (onAddRow) onAddRow(newRow);
//   };

//   const handleDeleteRow = (index) => {
//     const updatedRows = rows.filter((_, i) => i !== index);
//     setRows(updatedRows);
//     if (onDeleteRow) onDeleteRow(index);
//   };

//   const handleInputChange = (e, index, field) => {
//     const updatedRows = [...rows];
//     updatedRows[index][field] = e.target.value;
  
//     if (field === "method") {
//       updatedRows[index].value = "";
//       updatedRows[index].formula = "";
//       updatedRows[index].percentageOf = "";
//       updatedRows[index].percentageOfIdSalaryHead = "";
//     }
  
//     if (field === "percentageOfIdSalaryHead") {
//       updatedRows[index].percentageOfIdSalaryHead = e.target.value;
//       const selectedOption = column.percentageOfOptions.find(option => option.value === e.target.value);
//       updatedRows[index].percentageOf = selectedOption ? selectedOption.label : "";
//     }
  
//     setRows(updatedRows);
//     if (onInputChange) onInputChange(updatedRows, index, field);
//   };
  

//   const renderDynamicField = (row, rowIndex, column) => {
//     switch (row.method) {
//       case "Percentage of":
//         return (
//           <div className="d-flex">
//             <select
//               className="form-select form-select-sm me-2"
//               style={{ width: "60%" }}
//               value={row.percentageOfIdSalaryHead || ""}
//               onChange={(e) => handleInputChange(e, rowIndex, "percentageOfIdSalaryHead")}
//             >
//               <option value="">Select</option>
//               {column.percentageOfOptions.map((option) => (
//                 <option key={option.value} value={option.value}>
//                   {option.label}
//                 </option>
//               ))}
//             </select>
//             <input
//               type="number"
//               className="form-control form-control-sm"
//               style={{ width: "40%" }}
//               value={row.value || ""}
//               onChange={(e) => handleInputChange(e, rowIndex, "value")}
//               placeholder="Value"
//             />
//           </div>
//         );
//       // ... (rest of the cases remain the same)
//     }
//   };
  
  

//   return (
//     <table className="table table-sm">
//       <thead>
//         <tr>
//           {columns.map((column, index) => (
//             <th key={index} style={{ width: column.width }}>
//               {column.header}
//             </th>
//           ))}
//           {rowActions && <th style={{ width: "10%" }}></th>}
//         </tr>
//       </thead>
//       <tbody>
//         {rows.map((row, rowIndex) => (
//           <tr key={rowIndex}>
//             {columns.map((column, colIndex) => (
//               <td key={colIndex}>
//                 {column.type === "select" ? (
//                   <select
//                     className="form-select form-select-sm"
//                     value={row[column.field]}
//                     onChange={(e) => handleInputChange(e, rowIndex, column.field)}
//                   >
//                     {column.options.map((option, optIndex) => (
//                       <option key={optIndex} value={option.value}>
//                         {option.label}
//                       </option>
//                     ))}
//                   </select>
//                 ) : column.type === "dynamic" ? (
//                   renderDynamicField(row, rowIndex, column)
//                 ) : (
//                   <input
//                     type={column.type}
//                     className="form-control form-control-sm"
//                     placeholder={column.placeholder}
//                     value={row[column.field]}
//                     onChange={(e) => handleInputChange(e, rowIndex, column.field)}
//                   />
//                 )}
//               </td>
//             ))}
//             {rowActions && (
//               <td>
//                 <div className="d-flex justify-content-center">
//                   {rowIndex === rows.length - 1 ? (
//                     <button
//                       className="btn btn-outline-primary border-0 btn-sm"
//                       onClick={handleAddRow}
//                     >
//                       <i className="bx bx-plus"></i>
//                     </button>
//                   ) : (
//                     <button
//                       className="btn btn-outline-danger btn-sm border-0"
//                       onClick={() => handleDeleteRow(rowIndex)}
//                     >
//                       <i className="bx bx-trash"></i>
//                     </button>
//                   )}
//                 </div>
//               </td>
//             )}
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   );
// };

// export default SmallTable;

// SmallTable.propTypes = {
//   initialRows: PropTypes.array,
//   columns: PropTypes.arrayOf(
//     PropTypes.shape({
//       header: PropTypes.string.isRequired,
//       field: PropTypes.string.isRequired,
//       type: PropTypes.string.isRequired,
//       options: PropTypes.array,
//       percentageOfOptions: PropTypes.array,
//       width: PropTypes.string,
//     })
//   ),
//   rowActions: PropTypes.bool,
//   onAddRow: PropTypes.func,
//   onDeleteRow: PropTypes.func,
//   onInputChange: PropTypes.func,
// };

  import React, { useState, useEffect } from "react";
  import PropTypes from "prop-types";

  const SmallTable = ({
    initialRows = [],
    columns = [],
    rowActions = true,
    onAddRow,
    onDeleteRow,
    onInputChange,
  }) => {
    const [rows, setRows] = useState(initialRows);

    useEffect(() => {
      setRows(initialRows);
    }, [initialRows]);

    const handleAddRow = () => {
      const newRow = columns.reduce((acc, column) => {
        acc[column.field] = "";
        return acc;
      }, {});
      const updatedRows = [...rows, newRow];
      setRows(updatedRows);
      if (onAddRow) onAddRow(newRow);
    };

    const handleDeleteRow = (index) => {
      const updatedRows = rows.filter((_, i) => i !== index);
      setRows(updatedRows);
      if (onDeleteRow) onDeleteRow(index);
    };

    const handleInputChange = (e, index, field) => {
      const updatedRows = [...rows];
      updatedRows[index][field] = e.target.value;

      if (field === "method") {
        updatedRows[index].value = "";
        updatedRows[index].formula = "";
        updatedRows[index].percentageOf = "";
        updatedRows[index].percentageOfIdSalaryHead = "";
      }

      if (field === "percentageOfIdSalaryHead") {
        updatedRows[index].percentageOfIdSalaryHead = e.target.value;
        const selectedOption = column.percentageOfOptions.find(
          (option) => option.value === e.target.value
        );
        updatedRows[index].percentageOf = selectedOption ? selectedOption.label : "";
      }

      setRows(updatedRows);
      if (onInputChange) onInputChange(updatedRows, index, field);
    };

    const renderDynamicField = (row, rowIndex, column) => {
      switch (row.method) {
        case "Percentage of":
          return (
            <div className="d-flex">
              <select
                className="form-select form-select-sm me-2"
                style={{ width: "60%" }}
                value={row.percentageOfIdSalaryHead || ""}
                onChange={(e) => handleInputChange(e, rowIndex, "percentageOfIdSalaryHead")}
              >
                {/* <option value="">Select</option>
                {column.percentageOfOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option> */}
                  <option value="">Select</option>
            {column.percentageOfOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {row.percentageOf && row.percentageOfIdSalaryHead === option.value
                  ? row.percentageOf
                  : option.label}
              </option>
                ))}
              </select>
              <input
                type="number"
                className="form-control form-control-sm"
                style={{ width: "40%" }}
                value={row.value || ""}
                onChange={(e) => handleInputChange(e, rowIndex, "value")}
                placeholder="Value"
              />
            </div>
          );
        case "Fixed Amount":
          return (
            <input
              type="number"
              className="form-control form-control-sm"
              value={row.value || ""}
              onChange={(e) => handleInputChange(e, rowIndex, "value")}
              placeholder="Fixed Amount"
            />
          );
        case "Custom Formula":
          return (
            <input
              type="text"
              className="form-control form-control-sm"
              value={row.formula || ""}
              onChange={(e) => handleInputChange(e, rowIndex, "formula")}
              placeholder="Custom Formula"
            />
          );
        default:
          return null;
      }
    };

    return (
      <table className="table table-sm">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index} style={{ width: column.width }}>
                {column.header}
              </th>
            ))}
            {rowActions && <th style={{ width: "10%" }}></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column, colIndex) => (
                <td key={colIndex}>
                  {column.type === "select" ? (
                    <select
                      className="form-select form-select-sm"
                      value={row[column.field]}
                      onChange={(e) => handleInputChange(e, rowIndex, column.field)}
                    >
                      {column.options.map((option, optIndex) => (
                        <option key={optIndex} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : column.type === "dynamic" ? (
                    renderDynamicField(row, rowIndex, column)
                  ) : (
                    <input
                      type={column.type}
                      className="form-control form-control-sm"
                      placeholder={column.placeholder}
                      value={row[column.field]}
                      onChange={(e) => handleInputChange(e, rowIndex, column.field)}
                    />
                  )}
                </td>
              ))}
              {rowActions && (
                <td>
                  <div className="d-flex justify-content-center">
                    {rowIndex === rows.length - 1 ? (
                      <button
                        className="btn btn-outline-primary border-0 btn-sm"
                        onClick={handleAddRow}
                      >
                        <i className="bx bx-plus"></i>
                      </button>
                    ) : (
                      <button
                        className="btn btn-outline-danger btn-sm border-0"
                        onClick={() => handleDeleteRow(rowIndex)}
                      >
                        <i className="bx bx-trash"></i>
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  export default SmallTable;

  SmallTable.propTypes = {
    initialRows: PropTypes.array,
    columns: PropTypes.arrayOf(
      PropTypes.shape({
        header: PropTypes.string.isRequired,
        field: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        options: PropTypes.array,
        percentageOfOptions: PropTypes.array,
        width: PropTypes.string,
      })
    ),
    rowActions: PropTypes.bool,
    onAddRow: PropTypes.func,
    onDeleteRow: PropTypes.func,
    onInputChange: PropTypes.func,
  };
