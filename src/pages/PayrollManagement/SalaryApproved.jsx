import React from "react";

function SalaryApproved() {
  return (
    <div classNameName="container-xxl flex-grow-1 container-p-y">
    <div classNameName="row">
      <div classNameName="col-xl-12">
        <div classNameName="card">
          <div classNameName="card-header d-flex align-items-center justify-content-between pb-1">
            <h5 classNameName="m-0 d-flex align-items-center">
              Salary Generation Approval for the month of <span classNameName="fw-bolder text-Focus ms-2">Dec
                2024</span>
            </h5>
          </div>
          <div classNameName="card-body">
            <div classNameName="p-2">
              <ul classNameName="SalaryApproveCount_ul">
                <li>
                  <div classNameName="card SalaryApproveCount">
                    <div classNameName="card-body">
                      <h5>Total Employees</h5>
                      <div classNameName="count">
                        200
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div classNameName="card SalaryApproveCount">
                    <div classNameName="card-body">
                      <h5>Approved</h5>
                      <div classNameName="count text-success">
                        70
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="card SalaryApproveCount">
                    <div className="card-body">
                      <h5>Submitted</h5>
                      <div className="count text-">
                        80
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="card SalaryApproveCount">
                    <div className="card-body">
                      <h5>Draft Generated</h5>
                      <div className="count text-warning">
                        80
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="card SalaryApproveCount">
                    <div className="card-body">
                      <h5>Pending</h5>
                      <div className="count text-info">
                        50
                      </div>
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
                    <td> <input type="checkbox" className="form-check-input" /></td>
                    <th>Emp. Code</th>
                    <th>Employee Name</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th className="text-end">Total Earnings</th>
                    <th className="text-end">Total Deductions</th>
                    <th className="text-end">Net Salary</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td> <input type="checkbox" className="form-check-input" /></td>
                    <td>EPM0120</td>
                    <td>johnny manziel</td>
                    <td>Administration</td>
                    <td>Director</td>
                    <td className="text-end">12,000</td>
                    <td className="text-end">2,000</td>
                    <td className="text-end">6,000</td>
                    <td><span className="badge bg-label-success">Approved</span></td>
                  </tr>
                  <tr>
                    <td> <input type="checkbox" className="form-check-input" /></td>
                    <td>EPM0121</td>
                    <td>johnny</td>
                    <td>Computer Science</td>
                    <td>Sr. Teacher</td>
                    <td className="text-end">12,000</td>
                    <td className="text-end">2,000</td>
                    <td className="text-end">6,000</td>
                    <td><span className="badge bg-label-warning">Draft Generated</span></td>
                  </tr>
                  <tr>
                    <td> <input type="checkbox" className="form-check-input" /></td>
                    <td>EPM0122</td>
                    <td>manziel</td>
                    <td>General Science</td>
                    <td>Jr. Teacher</td>
                    <td className="text-end">12,000</td>
                    <td className="text-end">2,000</td>
                    <td className="text-end">6,000</td>
                    <td><span className="badge bg-label-primary">Submitted</span></td>
                  </tr>
                  <tr>
                    <td> <input type="checkbox" className="form-check-input" /></td>
                    <td>EPM0123</td>
                    <td>manziel</td>
                    <td>General Science</td>
                    <td>Jr. Teacher</td>
                    <td className="text-end">12,000</td>
                    <td className="text-end">2,000</td>
                    <td className="text-end">6,000</td>
                    <td>
                      <span className="badge bg-label-info">Not Generated</span>
                    </td>
                  </tr>
                  <tr>
                    <td> <input type="checkbox" className="form-check-input" /></td>
                    <td>EPM0123</td>
                    <td>manziel</td>
                    <td>General Science</td>
                    <td>Jr. Teacher</td>
                    <td className="text-end">12,000</td>
                    <td className="text-end">2,000</td>
                    <td className="text-end">6,000</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td> <input type="checkbox" className="form-check-input" /></td>
                    <td>EPM0123</td>
                    <td>manziel</td>
                    <td>General Science</td>
                    <td>Jr. Teacher</td>
                    <td className="text-end">12,000</td>
                    <td className="text-end">2,000</td>
                    <td className="text-end">6,000</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td> <input type="checkbox" className="form-check-input" /></td>
                    <td>EPM0123</td>
                    <td>manziel</td>
                    <td>General Science</td>
                    <td>Jr. Teacher</td>
                    <td className="text-end">12,000</td>
                    <td className="text-end">2,000</td>
                    <td className="text-end">6,000</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td> <input type="checkbox" className="form-check-input" /></td>
                    <td>EPM0123</td>
                    <td>manziel</td>
                    <td>General Science</td>
                    <td>Jr. Teacher</td>
                    <td className="text-end">12,000</td>
                    <td className="text-end">2,000</td>
                    <td className="text-end">6,000</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
              <div className="text-center pt-3">
                <button type="submit" className="btn btn-primary btn-sm py-2 px-4 me-2">Approve Selected
                  Records</button>
                <button type="submit" className="btn btn-primary btn-sm py-2 px-4 me-2">Reject Selected
                  Records</button>
                <button type="submit" className="btn btn-primary btn-sm py-2 px-4 me-2">
                  Export to Excel for Detailed Review
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

export default SalaryApproved;
