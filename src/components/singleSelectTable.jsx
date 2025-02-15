// import React from "react";
// import PropTypes from "prop-types";

// const SingleSelectTable = ({
//   title,
//   headers,
//   data,
//   onSelect,
//   searchPlaceholder = "Search...",
// }) => {
//   return (
//     <div className="card ScreenpermissionCard mb-2 border">
//       <div className="card-header d-flex align-items-center justify-content-between px-3 py-3 border-bottom">
//         <h5 className="m-0">{title}</h5>
//         <div className="list_menu">
//           <div className="list_searchbox">
//             <input type="search" className="form-control" placeholder={searchPlaceholder} />
//             <i className="bx bx-search"></i>
//           </div>
//         </div>
//       </div>
//       <div className="card-body p-0">
//         <div className="table-responsive">
//           <table className="table table-sm">
//             <thead>
//               <tr>
//                 <th></th>
//                 {headers.map((header, index) => (
//                   <th key={index} className="text-nowrap">
//                     {header}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody className="table-border-bottom-0">
//               {data.map((row, rowIndex) => (
//                 <tr key={rowIndex}>
//                   <td>
//                     <input
//                       type="radio"
//                       className="form-check-input"
//                       value={row.id || rowIndex}
//                       name="flexRadioDefault"
//                       onChange={() => onSelect(row)}
//                     />
//                   </td>
//                   {Object.values(row).map((value, colIndex) => (
//                     <td key={colIndex}>{value}</td>
//                   ))}
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SingleSelectTable;

// SingleSelectTable.propTypes = {
//     title: PropTypes.string,
//     headers: PropTypes.array,
//     data: PropTypes.array,
//     onSelect: PropTypes.func,
//     searchPlaceholder: PropTypes.string,
//     };

const SingleSelectTable = ({
  title,
  headers,
  data,
  onSelect,
  searchPlaceholder = "Search...",
}) => {
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
            />
            <i className="bx bx-search"></i>
          </div>
        </div>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-sm">
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
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td>
                    <input
                      type="radio"
                      className="form-check-input"
                      value={row.id || rowIndex}
                      name="flexRadioDefault"
                      onChange={() => onSelect(row)}
                    />
                  </td>
                  {headers.map((header, colIndex) => {
                    // We explicitly map the row values to their corresponding headers.
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
