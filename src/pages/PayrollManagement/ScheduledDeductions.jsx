import React from "react";

function ScheduledDeductions() {
  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">List of Scheduled Deductions</h5>
              <div className="list_menu">
                <div className="list_searchbox">
                  <input type="search" className="form-control" />
                  <i className="bx bx-search"></i>
                </div>
                <button
                  className="btn btn-primary btn-sm px-4"
                  data-bs-toggle="modal"
                  data-bs-target="#Add_MaternityLeaveSalary"
                >
                  Add
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive text-nowrap">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Emp. Code</th>
                      <th>Employee Name</th>
                      <th>Designation</th>
                      <th>Date From</th>
                      <th>Date To</th>
                      <th>No. of Months </th>
                      <th className="text-end">Monthly Deduction</th>
                      <th className="text-end">Total Deduction</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody className="table-border-bottom-0">
                    <tr>
                      <td>Emp001</td>
                      <td>John</td>
                      <td>Sr. Teacher </td>
                      <td>10/12/2024</td>
                      <td>10/01/2025</td>
                      <td>5</td>
                      <td className="text-end">3,000</td>
                      <td className="text-end">15,000</td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
                          data-bs-toggle="modal"
                          data-bs-target="#Add_MaternityLeaveSalary"
                        >
                          <span className="tf-icons bx bx-pencil"></span>
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td>Emp002</td>
                      <td>William</td>
                      <td>Sr. Teacher </td>
                      <td>21/12/2024</td>
                      <td>05/01/2025</td>
                      <td>6</td>
                      <td className="text-end">4,000</td>
                      <td className="text-end">24,000</td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
                          data-bs-toggle="modal"
                          data-bs-target="#Add_MaternityLeaveSalary"
                        >
                          <span className="tf-icons bx bx-pencil"></span>
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td>Emp003</td>
                      <td>Charles</td>
                      <td>Dept Head</td>
                      <td>25/12/2024</td>
                      <td>02/01/2025</td>
                      <td>9</td>
                      <td className="text-end">3,500</td>
                      <td className="text-end">31,500</td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
                          data-bs-toggle="modal"
                          data-bs-target="#Add_MaternityLeaveSalary"
                        >
                          <span className="tf-icons bx bx-pencil"></span>
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td>Emp004</td>
                      <td>David</td>
                      <td>Director</td>
                      <td>28/12/2024</td>
                      <td>09/01/2025</td>
                      <td>12</td>
                      <td className="text-end">2,000</td>
                      <td className="text-end">48,000</td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
                          data-bs-toggle="modal"
                          data-bs-target="#Add_MaternityLeaveSalary"
                        >
                          <span className="tf-icons bx bx-pencil"></span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div
          className="modal fade"
          id="Add_MaternityLeaveSalary"
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
                  Add/Update Scheduled Deductions
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body  accountDetail_card">
                <form>
                  {/* <!-- <div className="mb-2">
                  <label className="form-label mb-1">Employee Code</label>
                  <select className="form-select">
                    <option>Select Employee Code</option>
                    <option>Emp01</option>
                    <option>Emp02</option>
                    <option>Emp03</option>
                    <option>Emp04</option>
                    <option>Emp05</option>
                  </select>
                </div> --> */}
                  <div className="mb-2">
                    <label className="form-label mb-1">Employee Name</label>
                    <select className="form-select">
                      <option>Select Employee</option>
                      <option>John</option>
                      <option>William</option>
                      <option>Charles</option>
                      <option>David</option>
                      <option>Thomas</option>
                    </select>
                  </div>
                  <div className="mb-2">
                    <label className="form-label mb-1">Total Deduction</label>
                    <input className="form-control" type="text" value="" />
                  </div>
                  <div className="mb-2">
                    <label className="form-label mb-1">Salary Month From</label>
                    <input
                      type="month"
                      className="form-control"
                      value="January-2025"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label mb-1">Salary Month To</label>
                    <input
                      type="month"
                      className="form-control"
                      value="December-2025"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label mb-1">
                      Allocating Salary Head
                    </label>
                    <input
                      type="month"
                      className="form-control"
                      value="December-2025"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label mb-1">No of Months</label>
                    <input
                      className="form-control"
                      type="text"
                      value="5"
                      readonly
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label mb-1">Monthly Deduction</label>
                    <input className="form-control" type="text" readonly />
                  </div>
                </form>
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
  );
}

export default ScheduledDeductions;
