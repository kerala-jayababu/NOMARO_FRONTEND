import { useState, useEffect } from "react";
import { getEmployeeDetails } from "../../utils/service";

function SalaryConfiguration() {
  const [employeeData, setEmployeeData] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); // State for search input


  console.log(employeeData, "employeeData");

  // Fetch employee details on component mount
  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      try {
        const response = await getEmployeeDetails();
        console.log(response.data, "response");
        if (response.success) {
          setEmployeeData(response.data);
        } else {
          console.error(response.message);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchEmployeeDetails();
  }, []);

  const filteredTemplates = employeeData?.filter((template) =>
    template.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.department.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return ( 
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">List of Employee Salary Configuration</h5>
              <div className="list_menu">
              <div className="list_searchbox">
                  <input
                    type="search"
                    className="form-control"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <i className="bx bx-search"></i>
                </div>
                <button
                  className="btn btn-primary btn-sm px-4"
                  type="button"
                  data-bs-toggle="modal"
                  data-bs-target="#SalaryConfigurationModal"
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
                      <th className="text-nowrap">Employee Code</th>
                      <th className="text-nowrap">Employee Name</th>
                      <th>Designation</th>
                      <th>Joining Date</th>
                      <th>Total Earnings</th>
                      <th>Total Deductions</th>
                      <th>Net Salary</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTemplates?.length > 0 ? (
                      filteredTemplates.map((employee) => (
                        <tr key={employee.idEmployee}>
                          <td>
                            <span
                              className="cursor"
                              data-bs-toggle="modal"
                              data-bs-target="#modalCenter"
                            >
                              {employee.employeeCode}
                            </span>
                          </td>
                          <td className="text-nowrap">{employee.fullName}</td>
                          <td>{employee.designation}</td>
                          <td>
                            {new Date(
                              employee.joiningDate
                            ).toLocaleDateString()}
                          </td>
                          <td></td>
                          <td></td>
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
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center">
                          No records found
                        </td>
                      </tr>
                    )}
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
                      <li className="page-item active">
                        <a className="page-link" href="">
                          1
                        </a>
                      </li>
                      <li className="page-item">
                        <a className="page-link" href="">
                          2
                        </a>
                      </li>
                      <li className="page-item">
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
        </div>
      </div>

      <div
        className="modal fade"
        id="modalCenter"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div
          className="modal-dialog modal-xl  modal-dialog-centered"
          role="document"
        >
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="modalCenterTitle">
                Latest salary configurations
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body pt-1">
              <div className="px-2 mt-3">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Salary Head Name</th>
                      <th>Type</th>
                      <th>Calculation Details</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Basic Pay</td>
                      <td>Earnings</td>
                      <td></td>
                      <td>12,000.00</td>
                    </tr>
                    <tr>
                      <td>Dearness Allowance</td>
                      <td>Earnings</td>
                      <td>25% of Basic Pay</td>
                      <td>3,000.00</td>
                    </tr>
                    <tr>
                      <td>House Rent Allowance</td>
                      <td>Earnings</td>
                      <td>Fixed Amount</td>
                      <td>1000.00</td>
                    </tr>
                    <tr>
                      <td>Insurance</td>
                      <td>Deductions</td>
                      <td>10% of Basic Pay</td>
                      <td>1,200.00</td>
                    </tr>
                  </tbody>
                </table>
                <div className="total_salarycard">
                  <ul>
                    <li>
                      {" "}
                      <b>Total Earnings : 40,000</b>
                    </li>
                    <li>
                      <b>Total Deductions : 500</b>
                    </li>
                    <li>
                      {" "}
                      <b>Net Salary : 10,000</b>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="modal fade"
        id="SalaryConfigurationModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div
          className="modal-dialog modal-xl  modal-dialog-centered"
          role="document"
        >
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="modalCenterTitle">
                Add/Update Employee Salary Configuration
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
                <div className="col-md-4 p-2">
                  <label className="form-label mb-1">Employee Code</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value="Emp01"
                  />
                </div>
                <div className="col-md-4 p-2">
                  <label className="form-label mb-1">Employee Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value="Venu"
                  />
                </div>
                <div className="col-md-4 p-2">
                  <label className="form-label mb-1">Designation</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value="Designer"
                    readOnly
                  />
                </div>
                <div className="col-md-4 p-2">
                  <div>
                    <label className="form-label mb-1">Template Name </label>
                    <select className="form-select form-select-sm">
                      <option>Select Templates</option>
                      <option>Template 1</option>
                      <option>Template 2</option>
                      <option>Template 3</option>
                    </select>
                  </div>
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
                          <option selected>Percentage of</option>
                          <option>Fixed Amount</option>
                          <option>Custom Formula</option>
                        </select>
                      </td>
                      <td>
                        <div className="row px-1">
                          <div className="col-md-8 px-2">
                            <select className="form-select form-select-sm">
                              <option>Basic Pay</option>
                              <option>Dearness Allowance</option>
                            </select>
                          </div>
                          <div className="col-md-4 px-2">
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              maxLength="5"
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
                  </tbody>
                </table>

                <div className="total_salarycard">
                  <ul>
                    <li>
                      <b>Total Earnings :</b> 40,000
                    </li>
                    <li>
                      <b>Total Deductions :</b> 40,00
                    </li>
                    <li>
                      <b>Net Salary :</b> 15,000
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
  );
}

export default SalaryConfiguration;
