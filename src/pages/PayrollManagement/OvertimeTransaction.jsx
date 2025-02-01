import React from "react";

function OvertimeTransaction() {
  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">List of Overtime Transaction</h5>
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
              <div className="pb-2">
                <div className="form-check form-check-inline ">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="inlineRadioOptions"
                    id="inlineRadio1"
                    value="option1"
                    checked
                  />
                  <label className="form-check-label" for="inlineRadio1">
                    Action Pending
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
                    Action Completed options
                  </label>
                </div>
              </div>

              <div className="table-responsive ">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th className="checkbox_td">
                        <input type="checkbox" className="form-check-input" />
                      </th>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Start Time</th>
                      <th>Duration</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th className="text-center"> </th>
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
                      <td>Normal Overtime</td>
                      <td>22/12/2024</td>
                      <td>08:00pm</td>
                      <td>2Hrs </td>
                      <td>Pending works</td>
                      <td>
                        <span className="badge bg-label-warning">Pending</span>
                      </td>
                      <td></td>

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
                      <td>Normal Overtime</td>
                      <td>22/12/2024</td>
                      <td>08:00pm</td>
                      <td>2Hrs </td>
                      <td>Pending works</td>
                      <td>
                        <span className="badge bg-label-warning">Pending</span>
                      </td>
                      <td className="text-center">
                        <button className="btn btn-outline-primary border-0 btn-sm">
                          <i className="bx bx-paperclip"></i>
                        </button>
                      </td>

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
                <div className="text-center pt-3">
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm py-2 px-4 me-2"
                    data-bs-toggle="modal"
                    data-bs-target="#Approved_Overtime"
                  >
                    Approve Selected Record
                  </button>
                  <button
                    type="submit"
                    className="btn btn-reject  btn-sm py-2 px-4"
                    data-bs-dismiss="modal"
                    data-bs-toggle="modal"
                    data-bs-target="#Rejected_Overtime "
                  >
                    Reject Selected Record
                  </button>
                </div>
              </div>

              <div className="table-responsive d-none">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Start Time</th>
                      <th>Duration</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th className="text-center">Attachments </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>EPM0123</td>
                      <td>john</td>
                      <td>Normal Overtime</td>
                      <td>22/12/2024</td>
                      <td>08:00pm</td>
                      <td>2Hrs </td>
                      <td>Pending works</td>
                      <td>
                        <span className="badge bg-label-success">Approved</span>
                      </td>
                      <td className="text-center">
                        <button className="btn btn-outline-primary border-0 btn-sm">
                          <i className="bx bx-paperclip"></i>
                        </button>
                      </td>

                      {/* <!-- <td className="text-end">
                      <button type="button" className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0">
                        <span className="tf-icons bx bx-pencil"></span>
                      </button>
                    </td> --> */}
                    </tr>

                    <tr>
                      <td>EPM0123</td>
                      <td>john</td>
                      <td>Normal Overtime</td>
                      <td>22/12/2024</td>
                      <td>08:00pm</td>
                      <td>2Hrs </td>

                      <td>Pending works</td>
                      <td>
                        <span className="badge bg-label-danger">Rejected </span>
                      </td>
                      <td></td>

                      {/* <!-- <td className="text-end">
                      <button type="button" className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0">
                        <span className="tf-icons bx bx-pencil"></span>
                      </button>
                    </td> --> */}
                    </tr>
                    <tr>
                      <td>EPM0123</td>
                      <td>Normal Overtime</td>
                      <td>22/12/2024</td>
                      <td>08:00pm</td>
                      <td>2Hrs </td>

                      <td>Pending works</td>
                      <td>
                        <span className="badge bg-label-danger">Rejected </span>
                      </td>
                      <td></td>

                      {/* <!-- <td className="text-end">
                      <button type="button" className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0">
                        <span className="tf-icons bx bx-pencil"></span>
                      </button>
                    </td> --> */}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div
            className="modal fade"
            id="Add_OvertimeModal"
            tabindex="-1"
            aria-hidden="true"
          >
            <div
              className="modal-dialog modal-lg  modal-dialog-centered"
              role="document"
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="modalCenterTitle">
                    Add/Update Overtime Transaction
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body pt-1 accountDetail_card">
                  <div className="row m-0 mt-3">
                    <div className="col-md-6 p-2">
                      <label className="form-label mb-1">ID/Name</label>
                      <select className="form-select">
                        <option>Jhone</option>
                        <option>Mercy</option>
                      </select>
                    </div>
                    <div className="col-md-6 p-2">
                      <label className="form-label mb-1">Type</label>
                      <select className="form-select">
                        <option>Normal Overtime</option>
                        <option>Weekend Overtime</option>
                        <option>Public Holiday Overtime </option>
                      </select>
                    </div>
                  </div>
                  <div className="row m-0">
                    <div className="col-md-6 p-2">
                      <label className="form-label mb-1">Start Date and Time</label>
                      <div className="row m-0">
                        <div className="col-md-6 ps-0 pe-2">
                          <input
                            type="date"
                            className="form-control"
                            maxlength="50"
                          />
                        </div>
                        <div className="col-md-6 p-0 pe-2">
                          <input
                            type="time"
                            className="form-control ms-2"
                            maxlength="50"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 p-2">
                      <label className="form-label mb-1">End Date and Time</label>
                      <div className="row m-0">
                        <div className="col-md-6 ps-0 pe-2">
                          <input
                            type="date"
                            className="form-control"
                            maxlength="50"
                          />
                        </div>
                        <div className="col-md-6 p-0 pe-2">
                          <input
                            type="time"
                            className="form-control ms-2"
                            maxlength="50"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 p-2">
                      <label className="form-label mb-1">Duration</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="00"
                      />
                    </div>
                    <div className="col-md-6 p-2">
                      <label className="form-label mb-1">Reason for Overtime</label>
                      <input type="text" className="form-control" />
                    </div>
                    <div className="col-md-6 p-2">
                      <label className="form-label mb-1"> Attachments </label>
                      <input type="file" className="form-control" maxlength="50" />
                    </div>
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

          <div
            className="modal fade"
            id="Rejected_Overtime"
            tabindex="-1"
            aria-hidden="true"
          >
            <div
              className="modal-dialog modal-sm  modal-dialog-centered"
              role="document"
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Reason for rejection</h5>
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body pt-1 text-center">
                  <div className="text-start pb-3">
                    <textarea className="form-control" rows="8">
                      {" "}
                    </textarea>
                  </div>
                  <div className="text-center mb-5 d-none">
                    <div className="mb-4 text-danger">
                      <i className="bx bx-x-circle fs-2"></i>
                    </div>
                    <h6> Overtime Transaction Rejected</h6>
                  </div>
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
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div
            className="modal fade"
            id="Approved_Overtime"
            tabindex="-1"
            aria-hidden="true"
          >
            <div
              className="modal-dialog modal-sm  modal-dialog-centered"
              role="document"
            >
              <div className="modal-content">
                <div className="modal-header">
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body pt-1 text-center">
                  <div className="text-center mb-5">
                    <div className="mb-4 text-success">
                      <i className="bx bx-check-circle fs-2"></i>
                    </div>
                    <h6>
                      Are you want to <br /> Approve Selected Records
                    </h6>
                  </div>
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
                    Cancel
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

export default OvertimeTransaction;
