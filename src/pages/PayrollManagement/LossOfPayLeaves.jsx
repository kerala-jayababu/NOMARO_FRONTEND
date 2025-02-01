import React from "react";

function LossOfPayLeaves() {
  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-8 ">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">List of Loss Of Pay Leaves</h5>
              <button className="btn btn-primary btn-sm px-4">Add</button>
            </div>
            <div className="card-body">
              <div className="table-responsive text-nowrap">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Remarks</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody className="table-border-bottom-0">
                    <tr>
                      <td>John</td>
                      <td>25/02/2025</td>
                      <td>Full Day</td>
                      <td>Marriage Funtion</td>
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
                      <td>William</td>
                      <td>02/02/2025</td>
                      <td>Half Day</td>
                      <td>House-warming</td>
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
                      <td>Charles</td>
                      <td>15/02/2025</td>
                      <td>Half Day</td>
                      <td>Personal Reason</td>
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
                      <td>David</td>
                      <td>16/02/2025</td>
                      <td>Full Day</td>
                      <td>Personal Reason</td>

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
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Add/Update Loss Of Pay Leaves</h5>
            </div>
            <div className="card-body">
              <form>
                <div className="mb-2">
                  <label className="form-label mb-1">Employee</label>
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
                  <label className="form-label mb-1">Loss Of Pay Date</label>
                  <input type="date" className="form-control" maxlength="50" />
                </div>
                <div className="mb-2">
                  <div className="form-check form-check-inline ">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="inlineRadioOptions"
                      id="inlineRadio1"
                      value="option1"
                    />
                    <label className="form-check-label" for="inlineRadio1">
                      Full Day
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="inlineRadioOptions"
                      id="inlineRadio2"
                      value="option2"
                    />
                    <label className="form-check-label" for="inlineRadio2">
                      {" "}
                      Half Day{" "}
                    </label>
                  </div>
                </div>
                <div className="mb-2">
                  <label className="form-label mb-1">Remarks</label>
                  <textarea className="form-control" rows="5"></textarea>
                </div>

                <div className="text-center">
                  <button type="submit" className="btn btn-primary px-4 me-2">
                    Submit
                  </button>
                  <button type="submit" className="btn btn-outline-secondary px-4">
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LossOfPayLeaves;
