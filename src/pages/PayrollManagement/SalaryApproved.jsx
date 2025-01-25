import React from "react";

function SalaryApproved() {
  return (
    <div class="container-xxl flex-grow-1 container-p-y">
    <div class="row">
      <div class="col-xl-12">
        <div class="card">
          <div class="card-header d-flex align-items-center justify-content-between pb-1">
            <h5 class="m-0 d-flex align-items-center">
              Salary Generation Approval for the month of <span class="fw-bolder text-Focus ms-2">Dec
                2024</span>
            </h5>
          </div>
          <div class="card-body">
            <div class="p-2">
              <ul class="SalaryApproveCount_ul">
                <li>
                  <div class="card SalaryApproveCount">
                    <div class="card-body">
                      <h5>Total Employees</h5>
                      <div class="count">
                        200
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div class="card SalaryApproveCount">
                    <div class="card-body">
                      <h5>Approved</h5>
                      <div class="count text-success">
                        70
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div class="card SalaryApproveCount">
                    <div class="card-body">
                      <h5>Submitted</h5>
                      <div class="count text-">
                        80
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div class="card SalaryApproveCount">
                    <div class="card-body">
                      <h5>Draft Generated</h5>
                      <div class="count text-warning">
                        80
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div class="card SalaryApproveCount">
                    <div class="card-body">
                      <h5>Pending</h5>
                      <div class="count text-info">
                        50
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
            <div class="row m-0 pb-2">
              <div class="col-md-4 p-2">
                <select class="form-select form-select-sm ">
                  <option>All Employees</option>
                  <option>Filter Designation Based</option>
                  <option>Filter Department Based</option>
                </select>
              </div>
              <div class="col-md-4 p-2">
                <select class="form-select form-select-sm ">
                  <option>Select Designation</option>
                  <option>Director</option>
                  <option>Dept Head</option>
                  <option>Sr. Teacher</option>
                  <option>Jr. Teacher</option>
                  <option>Junior Executive</option>
                </select>
              </div>
              <div class="col-md-4 p-2">
                <select class="form-select form-select-sm ">
                  <option>Select Status</option>
                  <option>Approved</option>
                  <option>Draft Generated</option>
                  <option>Submitted</option>
                  <option>Not Generated</option>
                </select>
              </div>
            </div>
            <div class="table-responsive ">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <td> <input type="checkbox" class="form-check-input" /></td>
                    <th>Emp. Code</th>
                    <th>Employee Name</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th class="text-end">Total Earnings</th>
                    <th class="text-end">Total Deductions</th>
                    <th class="text-end">Net Salary</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td> <input type="checkbox" class="form-check-input" /></td>
                    <td>EPM0120</td>
                    <td>johnny manziel</td>
                    <td>Administration</td>
                    <td>Director</td>
                    <td class="text-end">12,000</td>
                    <td class="text-end">2,000</td>
                    <td class="text-end">6,000</td>
                    <td><span class="badge bg-label-success">Approved</span></td>
                  </tr>
                  <tr>
                    <td> <input type="checkbox" class="form-check-input" /></td>
                    <td>EPM0121</td>
                    <td>johnny</td>
                    <td>Computer Science</td>
                    <td>Sr. Teacher</td>
                    <td class="text-end">12,000</td>
                    <td class="text-end">2,000</td>
                    <td class="text-end">6,000</td>
                    <td><span class="badge bg-label-warning">Draft Generated</span></td>
                  </tr>
                  <tr>
                    <td> <input type="checkbox" class="form-check-input" /></td>
                    <td>EPM0122</td>
                    <td>manziel</td>
                    <td>General Science</td>
                    <td>Jr. Teacher</td>
                    <td class="text-end">12,000</td>
                    <td class="text-end">2,000</td>
                    <td class="text-end">6,000</td>
                    <td><span class="badge bg-label-primary">Submitted</span></td>
                  </tr>
                  <tr>
                    <td> <input type="checkbox" class="form-check-input" /></td>
                    <td>EPM0123</td>
                    <td>manziel</td>
                    <td>General Science</td>
                    <td>Jr. Teacher</td>
                    <td class="text-end">12,000</td>
                    <td class="text-end">2,000</td>
                    <td class="text-end">6,000</td>
                    <td>
                      <span class="badge bg-label-info">Not Generated</span>
                    </td>
                  </tr>
                  <tr>
                    <td> <input type="checkbox" class="form-check-input" /></td>
                    <td>EPM0123</td>
                    <td>manziel</td>
                    <td>General Science</td>
                    <td>Jr. Teacher</td>
                    <td class="text-end">12,000</td>
                    <td class="text-end">2,000</td>
                    <td class="text-end">6,000</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td> <input type="checkbox" class="form-check-input" /></td>
                    <td>EPM0123</td>
                    <td>manziel</td>
                    <td>General Science</td>
                    <td>Jr. Teacher</td>
                    <td class="text-end">12,000</td>
                    <td class="text-end">2,000</td>
                    <td class="text-end">6,000</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td> <input type="checkbox" class="form-check-input" /></td>
                    <td>EPM0123</td>
                    <td>manziel</td>
                    <td>General Science</td>
                    <td>Jr. Teacher</td>
                    <td class="text-end">12,000</td>
                    <td class="text-end">2,000</td>
                    <td class="text-end">6,000</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td> <input type="checkbox" class="form-check-input" /></td>
                    <td>EPM0123</td>
                    <td>manziel</td>
                    <td>General Science</td>
                    <td>Jr. Teacher</td>
                    <td class="text-end">12,000</td>
                    <td class="text-end">2,000</td>
                    <td class="text-end">6,000</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
              <div class="text-center pt-3">
                <button type="submit" class="btn btn-primary btn-sm py-2 px-4 me-2">Approve Selected
                  Records</button>
                <button type="submit" class="btn btn-primary btn-sm py-2 px-4 me-2">Reject Selected
                  Records</button>
                <button type="submit" class="btn btn-primary btn-sm py-2 px-4 me-2">
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
