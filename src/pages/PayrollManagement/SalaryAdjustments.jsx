import React from 'react'

function SalaryAdjustments() {
  return (
    <div className="container-xxl flex-grow-1 container-p-y">
    <div className="row">
      <div className="col-lg-12">
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between pb-3">
            <h5 className="m-0">List of Salary Adjustments</h5>
            <button className="btn btn-primary btn-sm px-4" data-bs-toggle="modal"
              data-bs-target="#Add_PayAdjustments">Add</button>
          </div>
          <div className="card-body">
            <div className="table-responsive text-nowrap">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Emp. Code</th>
                    <th>Employee Name</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Adjustment Date</th>
                    <th>Adjustment Type</th>
                    <th>Taxable </th>
                    <th>Allocating Salary Month</th>
                    <th>Allocating Salary Head</th>
                    <th className="text-end">Amount</th>
                    <th>Remarks</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="table-border-bottom-0">
                  <tr>
                    <th>Emp01</th>
                    <td>John</td>
                    <td>Computer Science</td>
                    <td>Sr. Teacher</td>
                    <td>25/02/2025</td>
                    <td>Earning</td>
                    <td>Yes</td>
                    <td>December-2025</td>
                    <td>Overtime Allowance</td>
                    <td className="text-end">2000</td>
                    <td>Marriage Funtion</td>
                    <td className="text-end">
                      <button type="button" className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0">
                        <span className="tf-icons bx bx-pencil"></span>
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <th>Emp02</th>
                    <td>William</td>
                    <td>General Science</td>
                    <td>Jr. Teacher</td>
                    <td>02/02/2025</td>
                    <td>Deduction</td>
                    <td>Yes</td>
                    <td>January-2025</td>
                    <td>Basic Pay</td>
                    <td className="text-end">2500</td>
                    <td>House-warming</td>
                    <td className="text-end">
                      <button type="button" className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0">
                        <span className="tf-icons bx bx-pencil"></span>
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <th>Emp03</th>
                    <td>Charles</td>
                    <td>General Science</td>
                    <td>Jr. Teacher</td>
                    <td>15/02/2025</td>
                    <td>Earning</td>
                    <td>Yes</td>
                    <td>March-2025</td>
                    <td>Overtime Allowance</td>
                    <td className="text-end">2500</td>
                    <td>Personal Reason</td>
                    <td className="text-end">
                      <button type="button" className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0">
                        <span className="tf-icons bx bx-pencil"></span>
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <th>Emp04</th>
                    <td>David</td>
                    <td>General Science</td>
                    <td>Jr. Teacher</td>
                    <td>16/02/2025</td>
                    <td>Earning</td>
                    <td>Yes</td>
                    <td>April-2025</td>
                    <td>Overtime Allowance</td>
                    <td className="text-end">2500</td>
                    <td>Personal Reason</td>
                    <td className="text-end">
                      <button type="button" className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0">
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
      <div className="modal fade" id="Add_PayAdjustments" tabindex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg  modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="modalCenterTitle">Add/Update Salary Adjustment</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body  accountDetail_card">
              <form>
                <div className="row m-0">
                  <div className="col-md-6 p-2">
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

                  <div className="col-md-6 p-2">
                    <label className="form-label mb-1">Department</label>
                    <input type="text" className="form-control" readonly />
                  </div>

                  <div className="col-md-6 p-2">
                    <label className="form-label mb-1">Designation</label>
                    <input type="text" className="form-control" readonly />
                  </div>

                  <div className="col-md-6 p-2">
                    <label className="form-label mb-1">Pay Adjustment Date</label>
                    <input type="date" className="form-control" />
                  </div>

                  <div className="col-md-6 p-2">
                    <div>
                      <label className="form-label mb-1">Pay Adjustment Type</label>
                    </div>
                    <div className="form-check form-check-inline ">
                      <input className="form-check-input" type="radio" name="inlineRadioOptions" id="inlineRadio1"
                        value="option1" />
                      <label className="form-check-label" for="inlineRadio1">Earning</label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input className="form-check-input" type="radio" name="inlineRadioOptions" id="inlineRadio2"
                        value="option2" />
                      <label className="form-check-label" for="inlineRadio2"> Deduction </label>
                    </div>
                  </div>

                  <div className="col-md-6 p-2">
                    <div>
                      <label className="form-label mb-1">Taxable </label>
                    </div>
                    <div className="form-check form-check-inline ">
                      <input className="form-check-input" type="radio" name="Taxable" id="Taxable1"
                        value="option1" />
                      <label className="form-check-label" for="Taxable1">Yes</label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input className="form-check-input" type="radio" name="Taxable" id="Taxable2"
                        value="option2" />
                      <label className="form-check-label" for="Taxable2"> No </label>
                    </div>
                  </div>

                  <div className="col-md-6 p-2">
                    <label className="form-label mb-1">Allocating Salary Month</label>
                    <input className="form-control" type="month" maxlength="12" value="January-2025" />
                  </div>
                  <div className="col-md-6 p-2">
                    <label className="form-label mb-1">Allocating Salary Head</label>
                    <select className="form-select">
                      <option>Select Employee</option>
                      <option>Basic Pay </option>
                      <option>House Reant Allowance </option>
                      <option>Overtime Allowance</option>
                    </select>
                  </div>
                  <div className="col-md-6 p-2">
                    <label className="form-label mb-1">Amount</label>
                    <input className="form-control" type="text" maxlength="12" />
                  </div>
                  <div className="col-md-12 p-2">
                    <label className="form-label mb-1">Remarks</label>
                    <textarea className="form-control" rows="4" maxlength="500"></textarea>
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="submit" className="btn btn-primary btn-sm py-2 px-4 me-2">Submit</button>
              <button type="submit" className="btn btn-outline-secondary  btn-sm py-2 px-4"
                data-bs-dismiss="modal">Reset</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}

export default SalaryAdjustments