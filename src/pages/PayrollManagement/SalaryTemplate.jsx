import React from "react";
import '../../../public/assets/vendor/css/theme-default.css'

function SalaryTemplate() {
  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">List of Salary Templates</h5>
              <div className="list_menu">
                <div className="list_searchbox">
                  <input type="search" className="form-control" />
                  <i className="bx bx-search"></i>
                </div>
                <button
                  className="btn btn-primary btn-sm px-4"
                  type="button"
                  data-bs-toggle="modal"
                  data-bs-target="#modalCenter"
                >
                  Add
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th className="text-nowrap">Template Name</th>
                      <th>Description </th>

                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-nowrap"> Monthly Template </td>
                      <td>
                        Pay your employees easily and on time with customizable
                        payroll templates.
                      </td>
                      <td>
                        <span className="badge bg-label-success">Enabled</span>
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
                        >
                          <span className=" bx bx-pencil"></span>
                        </button>
                      </td>
                    </tr>

                    <tr>
                      <td>Basic Template</td>
                      <td>
                        Pay your employees easily and on time with customizable
                        payroll templates.
                      </td>
                      <td>
                        <span className="badge bg-label-warning">Disabled</span>
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-icon btn-outline-secondar y px-3 border-0"
                        >
                          <span className=" bx bx-pencil"></span>
                        </button>
                      </td>
                    </tr>

                    <tr>
                      <td>Allowance Template</td>
                      <td>
                        Pay your employees easily and on time with customizable
                        payroll templates.
                      </td>
                      <td>
                        <span className="badge bg-label-warning">Disabled</span>
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
                        >
                          <span className=" bx bx-pencil"></span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="text-end pt-2">
                  <nav aria-label="Page navigation">
                    <ul className="pagination justify-content-end">
                      <li className="page-item first">
                        <a className="page-link" href="">
                          <i className="tf-icon bx bx-chevrons-left"></i>
                        </a>
                      </li>
                      <li className="page-item prev">
                        <a className="page-link" href="">
                          <i className="tf-icon bx bx-chevron-left"></i>
                        </a>
                      </li>
                      <li className="page-item">
                        <a className="page-link" href="">
                          1
                        </a>
                      </li>
                      <li className="page-item">
                        <a className="page-link" href="">
                          2
                        </a>
                      </li>
                      <li className="page-item active">
                        <a className="page-link" href="">
                          3
                        </a>
                      </li>
                      <li className="page-item">
                        <a className="page-link" href="">
                          4
                        </a>
                      </li>
                      <li className="page-item">
                        <a className="page-link" href="">
                          5
                        </a>
                      </li>
                      <li className="page-item next">
                        <a className="page-link" href="">
                          <i className="tf-icon bx bx-chevron-right"></i>
                        </a>
                      </li>
                      <li className="page-item last">
                        <a className="page-link" href="">
                          <i className="tf-icon bx bx-chevrons-right"></i>
                        </a>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            </div>
          </div>

          <div
            className="modal fade"
            id="modalCenter"
            tabindex="-1"
            aria-hidden="true"
          >
            <div
              className="modal-dialog modal-xl modal-dialog-centered"
              role="document"
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="modalCenterTitle">
                    Add/Update Salary Template
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body pt-1">
                  <div className="row m-0">
                    <div className="col-md-6 p-2">
                      <div className="form-check mb-1">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          value=""
                          id="flexCheckDefault"
                        />
                        <label className="form-check-label" for="flexCheckDefault">
                          Copy form templates
                        </label>
                      </div>
                      <div className="mb-2">
                        <select className="form-select form-select-sm">
                          <option>Select Templates</option>
                          <option>Template 1</option>
                          <option>Template 2</option>
                          <option>Template 3</option>
                        </select>
                      </div>

                      <div>
                        <label className="form-label mb-1">
                          Template Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          maxlength="50"
                        />
                      </div>
                    </div>
                    <div className="col-md-6 p-2">
                      <label className="form-label mb-1">Description </label>
                      <textarea
                        className="form-control form-control-sm"
                        rows="5"
                        maxlength="500"
                      ></textarea>
                    </div>
                  </div>
                  <div className="px-2">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Salary Head Name</th>
                          <th>Calculation Method</th>
                          <th></th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <select className="form-select form-select-sm">
                              <option>Select Salary Head Name</option>
                              <option selected>Basic pay </option>
                              <option>Dearness Allowance </option>
                              <option>House Reant Allowance </option>
                              <option>Overtime Allowance </option>
                            </select>
                          </td>
                          <td>
                            <select className="form-select form-select-sm">
                              <option>Percentage of</option>
                              <option>Fixed Amount</option>
                              <option>Custom Formula</option>
                            </select>
                          </td>
                          <td>
                            <div className="row px-1">
                              <div className="col-md-8 px-2">
                                <select className="form-select form-select-sm">
                                  <option>Basic Pay</option>
                                  <option>Dearness Allowance </option>
                                </select>
                              </div>
                              <div className="col-md-4 px-2">
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  maxlength="5"
                                  placeholder="value"
                                />
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex">
                              <button className="btn btn-outline-primary border-0 btn-sm me-2 ">
                                <i className="bx bx-plus"></i>
                              </button>
                              <button className="btn btn-outline-danger btn-sm border-0">
                                <i className="bx bx-trash "></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <select className="form-select form-select-sm">
                              <option>Select Salary Head Name</option>
                              <option>Basic pay </option>
                              <option selected>Dearness Allowance </option>
                              <option>House Reant Allowance </option>
                              <option>Overtime Allowance </option>
                            </select>
                          </td>
                          <td>
                            <select className="form-select form-select-sm">
                              <option>Percentage of</option>
                              <option selected>Fixed Amount</option>
                              <option>Custom Formula</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              placeholder="Amount"
                            />
                          </td>
                          <td>
                            <div className="d-flex">
                              <button className="btn btn-outline-primary border-0 btn-sm me-2">
                                <i className="bx bx-plus"></i>
                              </button>
                              <button className="btn btn-outline-danger btn-sm border-0">
                                <i className="bx bx-trash "></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <select className="form-select form-select-sm">
                              <option>Select Salary Head Name</option>
                              <option>Basic pay </option>
                              <option>Dearness Allowance </option>
                              <option selected>House Reant Allowance </option>
                              <option>Overtime Allowance </option>
                            </select>
                          </td>
                          <td>
                            <select className="form-select form-select-sm">
                              <option>Percentage of</option>
                              <option>Fixed Amount</option>
                              <option selected>Custom Formula</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Formula"
                            />
                          </td>
                          <td>
                            <button className="btn btn-outline-primary border-0 btn-sm">
                              <i className="bx bx-plus"></i>
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <select className="form-select form-select-sm">
                              <option>Select Salary Head Name</option>
                              <option>Basic pay </option>
                              <option>Dearness Allowance </option>
                              <option selected>House Reant Allowance </option>
                              <option>Overtime Allowance </option>
                            </select>
                          </td>
                          <td>
                            <select className="form-select form-select-sm">
                              <option>Percentage of</option>
                              <option>Fixed Amount</option>
                              <option selected>Custom Formula</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Formula"
                            />
                          </td>
                          <td>
                            <button className="btn btn-outline-primary border-0 btn-sm">
                              <i className="bx bx-plus"></i>
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <select className="form-select form-select-sm">
                              <option>Select Salary Head Name</option>
                              <option>Basic pay </option>
                              <option>Dearness Allowance </option>
                              <option selected>House Reant Allowance </option>
                              <option>Overtime Allowance </option>
                            </select>
                          </td>
                          <td>
                            <select className="form-select form-select-sm">
                              <option>Percentage of</option>
                              <option>Fixed Amount</option>
                              <option selected>Custom Formula</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Formula"
                            />
                          </td>
                          <td>
                            <button className="btn btn-outline-primary border-0 btn-sm">
                              <i className="bx bx-plus"></i>
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <select className="form-select form-select-sm">
                              <option>Select Salary Head Name</option>
                              <option>Basic pay </option>
                              <option>Dearness Allowance </option>
                              <option selected>House Reant Allowance </option>
                              <option>Overtime Allowance </option>
                            </select>
                          </td>
                          <td>
                            <select className="form-select form-select-sm">
                              <option>Percentage of</option>
                              <option>Fixed Amount</option>
                              <option selected>Custom Formula</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Formula"
                            />
                          </td>
                          <td>
                            <button className="btn btn-outline-primary border-0 btn-sm">
                              <i className="bx bx-plus"></i>
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <select className="form-select form-select-sm">
                              <option>Select Salary Head Name</option>
                              <option>Basic pay </option>
                              <option>Dearness Allowance </option>
                              <option selected>House Reant Allowance </option>
                              <option>Overtime Allowance </option>
                            </select>
                          </td>
                          <td>
                            <select className="form-select form-select-sm">
                              <option>Percentage of</option>
                              <option>Fixed Amount</option>
                              <option selected>Custom Formula</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Formula"
                            />
                          </td>
                          <td>
                            <button className="btn btn-outline-primary border-0 btn-sm">
                              <i className="bx bx-plus"></i>
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <select className="form-select form-select-sm">
                              <option>Select Salary Head Name</option>
                              <option>Basic pay </option>
                              <option>Dearness Allowance </option>
                              <option selected>House Reant Allowance </option>
                              <option>Overtime Allowance </option>
                            </select>
                          </td>
                          <td>
                            <select className="form-select form-select-sm">
                              <option>Percentage of</option>
                              <option>Fixed Amount</option>
                              <option selected>Custom Formula</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Formula"
                            />
                          </td>
                          <td>
                            <button className="btn btn-outline-primary border-0 btn-sm">
                              <i className="bx bx-plus"></i>
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <select className="form-select form-select-sm">
                              <option>Select Salary Head Name</option>
                              <option>Basic pay </option>
                              <option>Dearness Allowance </option>
                              <option selected>House Reant Allowance </option>
                              <option>Overtime Allowance </option>
                            </select>
                          </td>
                          <td>
                            <select className="form-select form-select-sm">
                              <option>Percentage of</option>
                              <option>Fixed Amount</option>
                              <option selected>Custom Formula</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Formula"
                            />
                          </td>
                          <td>
                            <button className="btn btn-outline-primary border-0 btn-sm">
                              <i className="bx bx-plus"></i>
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <select className="form-select form-select-sm">
                              <option>Select Salary Head Name</option>
                              <option>Basic pay </option>
                              <option>Dearness Allowance </option>
                              <option selected>House Reant Allowance </option>
                              <option>Overtime Allowance </option>
                            </select>
                          </td>
                          <td>
                            <select className="form-select form-select-sm">
                              <option>Percentage of</option>
                              <option>Fixed Amount</option>
                              <option selected>Custom Formula</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Formula"
                            />
                          </td>
                          <td>
                            <button className="btn btn-outline-primary border-0 btn-sm">
                              <i className="bx bx-plus"></i>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="total_salarycard">
                      <ul>
                        <li>
                          <b>Total Earnings : </b> 80,000
                        </li>
                        <li>
                          <b>Total Deductions : </b> 20,00
                        </li>
                        <li>
                          <b>Net Salary : </b> 120,220
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm py-2 px-4 me-2"
                  >
                    Submit for Approval
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm py-2 px-4 me-2"
                  >
                    Submit for Approval
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
  );
}

export default SalaryTemplate;
