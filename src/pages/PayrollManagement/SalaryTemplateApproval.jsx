import React from "react";

function SalaryTemplateApproval() {
  return (
    <div className="container-xxl flex-grow-1 container-p-y">
    <div className="row">
      <div className="col-xl-12">
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between pb-1">
            <h5 className="m-0 d-flex align-items-center">
              List of Salary Template Approvals
            </h5>
          </div>
          <div className="card-body">
            <div className="row m-0 pb-2">
              <div className="col-md-3 p-2">
                <label>Entity Type</label>
                <select className="form-select form-select-sm ">
                  <option>Select</option>
                  <option>Salary Template</option>
                  <option>Employee Salary Configuration</option>
                  <option>Overtime Transaction</option>
                </select>
              </div>
              <div className="col-md-3 p-2">
                <label>Status</label>
                <select className="form-select form-select-sm ">
                  <option>Select Status</option>
                  <option>Approved</option>
                  {/* <!-- <option>Draft Generated</option> --> */}
                  <option>Submitted</option>
                  {/* <!-- <option>Not Generated</option> --> */}
                </select>
              </div>
              <div className="col-md-3 p-2">
                <label>From</label>
                <input type="date" className="form-control form-control-sm" />
              </div>
            </div>
            <div className="table-responsive ">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Entity Type</th>
                    <th>Details</th>
                    <th>Created By & Date</th>
                    <th>Current Status</th>
                    <th>Current Status Details</th>
                    <th><input type="checkbox" className="form-check-input" /></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="cursor">Salary Template</td>
                    <td>Security Salary</td>
                    <td>johnny <br/> 31/12/2024 04:00 PM</td>
                    <td>Submitted</td>
                    <td></td>
                    <td> <input type="checkbox" className="form-check-input" /></td>
                  </tr>
                  <tr>
                    <td className="cursor">Salary Template</td>
                    <td>Cleaning Staff</td>
                    <td>johnny <br/> 31/12/2024 04:00 PM</td>
                    <td>Submitted</td>
                    <td></td>
                    <td> <input type="checkbox" className="form-check-input" /></td>
                  </tr>
                  <tr>
                    <td className="cursor">Salary Template</td>
                    <td>Teacher</td>
                    <td>johnny <br/> 31/12/2024 04:00 PM</td>
                    <td>Submitted</td>
                    <td></td>
                    <td> <input type="checkbox" className="form-check-input" /></td>
                  </tr>
                  <tr>
                    <td className="cursor">Salary Template</td>
                    <td>Security Salary</td>
                    <td>johnny <br/> 31/12/2024 04:00 PM</td>
                    <td>Submitted</td>
                    <td></td>
                    <td> <input type="checkbox" className="form-check-input" /></td>
                  </tr>

                </tbody>
              </table>

              <div className="text-center pt-3">
                <button type="submit" className="btn btn-primary btn-sm py-2 px-4 me-2">Approve Selected
                  Records</button>
                <button type="submit" className="btn btn-primary btn-sm py-2 px-4 me-2">Reject Selected
                  Records</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}

export default SalaryTemplateApproval;
