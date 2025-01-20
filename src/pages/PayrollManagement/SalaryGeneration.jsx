import React from "react";

function SalaryGeneration() {
  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-xl-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-1">
              <h5 className="m-0">
                Salary Generation for the Month of{" "}
                <span className="fw-bolder text-Focus">Dec 2024</span>
              </h5>
            </div>
            <div className="card-body">
              <div className="p-2">
                <ul className="SalaryApproveCount_ul">
                  <li>
                    <div className="card SalaryApproveCount">
                      <div className="card-body">
                        <h5>Total Employees</h5>
                        <div className="count">200</div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="card SalaryApproveCount">
                      <div className="card-body">
                        <h5>Approved</h5>
                        <div className="count text-success">70</div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="card SalaryApproveCount">
                      <div className="card-body">
                        <h5>Submitted</h5>
                        <div className="count text-">80</div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="card SalaryApproveCount">
                      <div className="card-body">
                        <h5>Draft Generated</h5>
                        <div className="count text-warning">80</div>
                      </div>
                    </div>
                  </li>

                  <li>
                    <div className="card SalaryApproveCount">
                      <div className="card-body">
                        <h5>Pending</h5>
                        <div className="count text-info">50</div>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="row m-0 pb-2">
                <div className="col-md-4 p-2">
                  <select className="form-select form-select-sm ">
                    <option>All Employees</option>
                    <option>Filter Designation Based</option>
                    <option>Filter Department Based</option>
                  </select>
                </div>
                <div className="col-md-4 p-2">
                  <select className="form-select form-select-sm ">
                    <option>Select Designation</option>
                    <option>Director</option>
                    <option>Dept Head</option>
                    <option>Sr. Teacher</option>
                    <option>Jr. Teacher</option>
                    <option>Junior Executive</option>
                  </select>
                </div>
                <div className="col-md-4 p-2">
                  <select className="form-select form-select-sm ">
                    <option>Select Status</option>
                    <option>Approved</option>
                    <option>Draft Generated</option>
                    <option>Submitted</option>
                    <option>Not Generated</option>
                  </select>
                </div>
              </div>

              <div className="table-responsive ">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Emp Code</th>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th className="text-end">Total Earnings</th>
                      <th className="text-end">Total Deductions</th>
                      <th className="text-end">Net Salary</th>
                      <th>Status</th>
                      <th>
                        <input type="checkbox" className="form-check-input" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>EPM0120</td>
                      <td>johnny manziel</td>
                      <td>Administration</td>
                      <td>Director</td>
                      <td className="text-end">12,000</td>
                      <td className="text-end">2,000</td>
                      <td className="text-end">6,000</td>
                      <td>
                        <span className="badge bg-label-success">Approved</span>
                      </td>

                      <td>
                        {" "}
                        <input type="checkbox" className="form-check-input" />
                      </td>
                    </tr>
                    <tr>
                      <td>EPM0121</td>
                      <td>johnny</td>
                      <td>Computer Science</td>
                      <td>Sr. Teacher</td>
                      <td className="text-end">12,000</td>
                      <td className="text-end">2,000</td>
                      <td className="text-end">6,000</td>
                      <td>
                        <span className="badge bg-label-primary">Submitted</span>
                      </td>

                      <td>
                        {" "}
                        <input type="checkbox" className="form-check-input" />
                      </td>
                    </tr>
                    <tr>
                      <td>EPM0122</td>
                      <td>manziel</td>
                      <td>General Science</td>
                      <td>Jr. Teacher</td>
                      <td className="text-end">12,000</td>
                      <td className="text-end">2,000</td>
                      <td className="text-end">6,000</td>
                      <td>
                        <span className="badge bg-label-warning">
                          Draft Generated
                        </span>
                      </td>

                      <td>
                        {" "}
                        <input type="checkbox" className="form-check-input" />
                      </td>
                    </tr>
                    <tr>
                      <td>EPM0123</td>
                      <td>John</td>
                      <td>General Science</td>
                      <td>Jr. Teacher</td>
                      <td className="text-end">12,000</td>
                      <td className="text-end">2,000</td>
                      <td className="text-end">6,000</td>
                      <td>
                        <span className="badge bg-label-info">Not Generated</span>
                      </td>

                      <td>
                        {" "}
                        <input type="checkbox" className="form-check-input" />
                      </td>
                    </tr>
                    <tr>
                      <td>EPM0123</td>
                      <td>manziel</td>
                      <td>General Science</td>
                      <td>Jr. Teacher</td>
                      <td className="text-end">12,000</td>
                      <td className="text-end">2,000</td>
                      <td className="text-end">6,000</td>
                      <td></td>

                      <td>
                        {" "}
                        <input type="checkbox" className="form-check-input" />
                      </td>
                    </tr>
                    <tr>
                      <td>EPM0123</td>
                      <td>manziel</td>
                      <td>General Science</td>
                      <td>Jr. Teacher</td>
                      <td className="text-end">12,000</td>
                      <td className="text-end">2,000</td>
                      <td className="text-end">6,000</td>
                      <td></td>

                      <td>
                        {" "}
                        <input type="checkbox" className="form-check-input" />
                      </td>
                    </tr>
                    <tr>
                      <td>EPM0123</td>
                      <td>manziel</td>
                      <td>General Science</td>
                      <td>Jr. Teacher</td>
                      <td className="text-end">12,000</td>
                      <td className="text-end">2,000</td>
                      <td className="text-end">6,000</td>
                      <td></td>

                      <td>
                        {" "}
                        <input type="checkbox" className="form-check-input" />
                      </td>
                    </tr>
                    <tr>
                      <td>EPM0123</td>
                      <td>manziel</td>
                      <td>General Science</td>
                      <td>Jr. Teacher</td>
                      <td className="text-end">12,000</td>
                      <td className="text-end">2,000</td>
                      <td className="text-end">6,000</td>
                      <td></td>

                      <td>
                        {" "}
                        <input type="checkbox" className="form-check-input" />
                      </td>
                    </tr>
                    <tr>
                      <td>EPM0123</td>
                      <td>manziel</td>
                      <td>General Science</td>
                      <td>Jr. Teacher</td>
                      <td className="text-end">12,000</td>
                      <td className="text-end">2,000</td>
                      <td className="text-end">6,000</td>
                      <td></td>

                      <td>
                        {" "}
                        <input type="checkbox" className="form-check-input" />
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="text-center pt-3">
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm py-2 px-4 me-2"
                  >
                    Generate Draft Salary
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm py-2 px-4 me-2"
                  >
                    Undo Draft Salary Generation
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm py-2 px-4 me-2"
                  >
                    Export to Excel for Review
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm py-2 px-4 me-2"
                  >
                    Submit for Approval
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalaryGeneration;
