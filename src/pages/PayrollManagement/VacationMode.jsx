import React, { useEffect, useState } from "react";
import {
  getEmployeeDetailsById,
  getVacationModeList,
  getEmployeeProfileById,
} from "../../utils/service";

function VacationModes() {
  const [vacationModes, setVacationModes] = useState([]);
  const [employeeDetails, setEmployeeDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // "add" or "edit"
  const [selectedVacation, setSelectedVacation] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const vacationData = await getVacationModeList();
        if (vacationData.success) {
          const employees = {};
          for (let item of vacationData.data) {
            if (!employees[item.idEmployee]) {
              const employeeData = await getEmployeeProfileById(
                item.idEmployee
              );
              if (employeeData.success && employeeData.data.length > 0) {
                employees[item.idEmployee] = employeeData.data[0];
              }
            }
          }
          setEmployeeDetails(employees);
          setVacationModes(vacationData.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Open Modal for Add/Edit
  const handleOpenModal = (type, vacation = null) => {
    setModalType(type);
    setSelectedVacation(vacation);
    setShowModal(true);
  };

  // Close Modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedVacation(null);
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">List of Employees on Vacation Mode</h5>
              <button
                className="btn btn-primary btn-sm px-4"
                onClick={() => handleOpenModal("add")}
              >
                Add
              </button>
            </div>
            <div className="card-body">
              {loading ? (
                <p>Loading...</p>
              ) : (
                <div className="table-responsive text-nowrap">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Emp. Code</th>
                        <th>Employee Name</th>
                        <th>Date From</th>
                        <th>Date To</th>
                        <th>Substitute</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody className="table-border-bottom-0">
                      {vacationModes.map((item) => (
                        <tr key={item.idVacationMode}>
                          <td>
                            {employeeDetails[item.idEmployee]?.employeeCode ||
                              "N/A"}
                          </td>
                          <td>
                            {employeeDetails[item.idEmployee]?.fullName ||
                              "N/A"}
                          </td>
                          <td>
                            {new Date(item.vacationFrom).toLocaleDateString()}
                          </td>
                          <td>
                            {new Date(item.vacationTo).toLocaleDateString()}
                          </td>
                          <td>
                            {employeeDetails[item.idSubstitueEmployee]
                              ?.fullName || "N/A"}
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
                              onClick={() => handleOpenModal("edit", item)}
                            >
                              <span className="tf-icons bx bx-pencil"></span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: "999",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            className="modal-content"
            style={{
              maxWidth: "600px",
              maxHeight: "80vh",
              margin: "auto",
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              zIndex: "1000",
              overflowY: "auto",
            }}
          >
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  {modalType === "add"
                    ? "Add Vacation Mode"
                    : "Edit Vacation Mode"}
                </h5>
                <button
                  className="btn-close"
                  onClick={handleCloseModal}
                ></button>
              </div>
              <div className="card-body">
                <form>
                  <div className="mb-2">
                    <label className="form-label mb-1">Employee Name</label>
                    <select className="form-select">
                      <option>Select Employee</option>
                      <option>johnny</option>
                      <option>John</option>
                      <option>William</option>
                    </select>
                  </div>
                  <div className="mb-2">
                    <label className="form-label mb-1">Vacation From</label>
                    <input
                      type="date"
                      className="form-control"
                      defaultValue={
                        selectedVacation?.vacationFrom
                          ? new Date(selectedVacation.vacationFrom)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label mb-1">Vacation To</label>
                    <input
                      type="date"
                      className="form-control"
                      defaultValue={
                        selectedVacation?.vacationTo
                          ? new Date(selectedVacation.vacationTo)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label mb-1">
                      Approval Authority Substituted to
                    </label>
                    <select className="form-select">
                      <option>Select</option>
                      <option>johnny</option>
                      <option>John</option>
                      <option>William</option>
                    </select>
                  </div>

                  <div className="mb-2">
                    <label className="form-label mb-1">
                      Reason for Vacation
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      maxLength="15"
                    />
                  </div>

                  <div className="text-center">
                    <button type="submit" className="btn btn-primary px-4 me-2">
                      {" "}
                      {modalType === "add" ? "Add" : "Save Changes"}
                    </button>
                    <button
                      type="submit"
                      className="btn btn-outline-secondary px-4"
                    >
                      Reset
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VacationModes;
{
  /* <div
className="modal fade show d-block"
style={{ background: "rgba(0,0,0,0.5)" }}
>
<div className="modal-dialog">
  <div className="modal-content">
    <div className="modal-header">
      <h5 className="modal-title">
        {modalType === "add"
          ? "Add Vacation Mode"
          : "Edit Vacation Mode"}
      </h5>
      <button
        className="btn-close"
        onClick={handleCloseModal}
      ></button>
    </div>
    <div className="modal-body">
      {/* Form Fields */
}
//       <form>
//         <div className="mb-3">
//           <label className="form-label">Employee Name</label>
//           <input
//             type="text"
//             className="form-control"
//             defaultValue={selectedVacation?.fullName || ""}
//           />
//         </div>
//         <div className="mb-3">
//           <label className="form-label">Date From</label>
//           <input
//             type="date"
//             className="form-control"
//             defaultValue={
//               selectedVacation?.vacationFrom
//                 ? new Date(selectedVacation.vacationFrom)
//                     .toISOString()
//                     .split("T")[0]
//                 : ""
//             }
//           />
//         </div>
//         <div className="mb-3">
//           <label className="form-label">Date To</label>
//           <input
//             type="date"
//             className="form-control"
//             defaultValue={
//               selectedVacation?.vacationTo
//                 ? new Date(selectedVacation.vacationTo)
//                     .toISOString()
//                     .split("T")[0]
//                 : ""
//             }
//           />
//         </div>
//         <div className="mb-3">
//           <label className="form-label">Substitute</label>
//           <input
//             type="text"
//             className="form-control"
//             defaultValue={selectedVacation?.substitute || ""}
//           />
//         </div>
//       </form>
//     </div>
//     <div className="modal-footer">
//       <button
//         className="btn btn-secondary"
//         onClick={handleCloseModal}
//       >
//         Cancel
//       </button>
//       <button className="btn btn-primary">
//         {modalType === "add" ? "Add" : "Save Changes"}
//       </button>
//     </div>
//   </div>
// </div>
// </div> */}
