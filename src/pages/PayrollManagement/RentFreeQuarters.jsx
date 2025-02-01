import React from "react";

function RentFreeQuarters() {
  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">
                List of Employee with Rent-Free Quarters Allowance
              </h5>
              <div className="list_menu">
                <div className="list_searchbox">
                  <input type="search" className="form-control" />
                  <i className="bx bx-search"></i>
                </div>
                <button
                  className="btn btn-primary btn-sm px-4"
                  data-bs-toggle="modal"
                  data-bs-target="#Add_OvertimeModal"
                >
                  Add
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive ">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th className="checkbox_td">
                        <input type="checkbox" className="form-check-input" />
                      </th>
                      <th>Emp. Code</th>
                      <th>Employee Name</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th className="text-end">Annual Rent</th>
                      <th className="text-end">Annual Tax</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        {" "}
                        <input type="checkbox" className="form-check-input" />
                      </td>
                      <td>EPM0123</td>
                      <td>john</td>
                      <td>Computer Science</td>
                      <td>Sr. Teacher</td>
                      <td className="text-end">4500</td>
                      <td className="text-end">200 </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
                        >
                          <span className="tf-icons bx bx-pencil"></span>
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        {" "}
                        <input type="checkbox" className="form-check-input" />
                      </td>
                      <td>EPM0123</td>
                      <td>john</td>
                      <td>General Science</td>
                      <td>Jr. Teacher</td>
                      <td className="text-end">5000</td>
                      <td className="text-end">210</td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
                        >
                          <span className="tf-icons bx bx-pencil"></span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div
              className="modal fade"
              id="Add_OvertimeModal"
              tabindex="-1"
              aria-hidden="true"
            >
              <div
                className="modal-dialog modal-md  modal-dialog-centered"
                role="document"
              >
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title" id="modalCenterTitle">
                      Add/Update Employee with Rent-Free Quarters Allowance
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      data-bs-dismiss="modal"
                      aria-label="Close"
                    ></button>
                  </div>
                  <div className="modal-body pt-1 accountDetail_card">
                    <div className="mb-2">
                      <label className="form-label mb-1">Employee Selection</label>
                      <input type="text" className="form-control" maxlength="50" />
                    </div>
                    <div className="mb-2">
                      <label className="form-label mb-1">
                        Total Annual Rent Free Quarters Allowance
                      </label>
                      <input type="text" className="form-control" maxlength="50" />
                    </div>
                    <div className="mb-2">
                      <label className="form-label mb-1">Duration</label>
                      <select className="form-select">
                        <option>Select</option>
                        <option>6 Months</option>
                        <option>12 Months</option>
                      </select>
                    </div>
                    <div className="mb-2">
                      <label className="form-label mb-1">Valid Date From</label>
                      <input type="date" className="form-control" maxlength="50" />
                    </div>
                    <div className="mb-2">
                      <label className="form-label mb-1">Monthly Rent</label>
                      <input
                        type="text"
                        className="form-control"
                        maxlength="50"
                        readonly
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label mb-1">
                        Annual Taxable Amount (40%)
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        maxlength="50"
                        readonly
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label mb-1">Monthly Tax</label>
                      <input
                        type="text"
                        className="form-control"
                        maxlength="50"
                        readonly
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm py-2 px-4 me-2"
                    >
                      Submit
                    </button>
                    <button
                      type="submit"
                      className="btn btn-outline-secondary  btn-sm py-2 px-4"
                      data-bs-dismiss="modal"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RentFreeQuarters;
