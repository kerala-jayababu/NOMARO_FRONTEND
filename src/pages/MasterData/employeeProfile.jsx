import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllEmployeeDetails } from "../../redux/reducers/getAllEmployeeDetails";
import Grid from "../../components/grid";
import Pagination from "../../components/pagination";
import StatusBadge from "../../components/statusBadge";
import Modal from "../../components/modal";
import Table from "../../components/table";
import Label from "../../components/label";
import { DeleteIcon, AddIcon } from "../../components/icons";
import Dropdown from "../../components/dropdown";
import Input from "../../components/input";
import { getEmployeeDetailsByID } from "../../redux/reducers/getEmployeeDetails";
import { getBudgetCodeById } from "../../redux/reducers/budgetCode";
import { getEmployeeBankAccountsByID } from "../../redux/reducers/employeeProfiles";

const EmployeeProfile = () => {
  const dispatch = useDispatch();
  const {
    options: employees,
    loading,
    error,
  } = useSelector((state) => state.getAllEmployeeDetails);
  const { options: employeeDetails } = useSelector(
    (state) => state.getEmployeeDetails
  );
  const { options: bankAccounts } = useSelector(state => state.employeeProfiles);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  console.log("bankAccounts", bankAccounts);

  const [budgetCodes, setBudgetCodes] = useState({});

  const totalPages = 5;

  useEffect(() => {
    dispatch(getAllEmployeeDetails());
  }, [dispatch]);

  const handlePageChange = (page) => setCurrentPage(page);
  const handleEditClick = (id) => {
    setSelectedEmployee(null);
    const employee = employees?.find((emp) => emp.idEmployee === id);
    if (employee) {
      console.log("Employee selected:", id);
      setSelectedEmployee(employee);
      dispatch(getEmployeeDetailsByID(id));
      dispatch(getEmployeeBankAccountsByID(id)); // Fetch bank accounts
    }
  };

  useEffect(() => {
    if (employeeDetails.length > 0) {
      setSelectedEmployee(employeeDetails[0]); // Replace instead of merging
    }
  }, [employeeDetails]);

  useEffect(() => {
    if (employeeDetails && employeeDetails.data?.idBudgetCode) {
      dispatch(getBudgetCodeById(employeeDetails.data.idBudgetCode)).then(
        (res) => {
          if (res.payload?.data?.budgetCode) {
            setBudgetCodes((prev) => ({
              ...prev,
              [employeeDetails.data.idEmployee]: res.payload.data.budgetCode,
            }));
          }
        }
      );
    }
  }, [selectedEmployee, dispatch]);

  const employeeData =
    employees?.map((employee) => ({
      editId: employee.idEmployee,
      empCode: employee.employeeCode,
      name: employee.fullName,
      designation: employee.designation,
      department: employee.department,
      joiningDate: new Date(employee.joiningDate).toLocaleDateString(),
      status: employee.currentStatus,
      childCount: employee.childrenCount,
    })) || [];

  const columns = [
    { key: "empCode", label: "Emp. Code" },
    { key: "name", label: "Employee Name" },
    { key: "designation", label: "Designation" },
    { key: "department", label: "Department" },
    { key: "joiningDate", label: "Joining Date" },
    {
      key: "status",
      label: "Current Status",
      render: (status) => <StatusBadge status={status} />,
    },
    { key: "actions", label: "Actions" },
  ];

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">List of Employee Profile View</h5>
              <div className="list_menu">
                <div className="list_searchbox">
                  <input type="search" className="form-control" />
                  <i className="bx bx-search"></i>
                </div>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <p>Loading...</p>
              ) : error ? (
                <p className="text-danger">{error}</p>
              ) : (
                <Grid
                  columns={columns}
                  data={employeeData}
                  onEditClick={handleEditClick}
                  idKey="editId"
                  modalId="Add_EMP_Account"
                />
              )}
              <div className="text-end pt-2">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Adding Employee Bank Account */}
      <Modal id="Add_EMP_Account" title="Add Employee Bank Account">
        <div className="row m-0 mb-3">
          {selectedEmployee && (
            <>
              <Label
                text="Employee Code"
                value={selectedEmployee.employeeCode}
              />
              <Label text="Employee Name" value={selectedEmployee.fullName} />
              <Label text="Designation" value={selectedEmployee.designation} />
            </>
          )}
        </div>

        <h6>
          <strong>Bank Account Details</strong>
        </h6>

        <Table
          headers={[
            "Bank Name",
            "Branch Name",
            "Account Number",
            "% Salary",
            "Currency",
            "",
          ]}
          rows={bankAccounts.data?.map((bank) => (
            <tr key={bank.idEmployeeBankAccount}>
              <td>
                <Dropdown
                  // label="Bank Name"
                  options={[
                    { value: bank.idBank, label: `Bank ${bank.idBank}` },
                  ]}
                  name="bankName"
                />
              </td>
              <td>
                <Dropdown
                  // label="Branch Name"
                  options={[{ value: bank.branchCode, label: bank.branchCode }]}
                  name="branchName"
                />
              </td>
              <td>
                <Input
                  type="text"
                  name="accountNumber"
                  // label="Account Number"
                  value={bank.accountNumber}
                  readOnly
                />
              </td>
              <td>
                <Input
                  type="text"
                  name="salaryPercentage"
                  // label="% Salary"
                  value={bank.salaryPercentageDistributed}
                  readOnly
                />
              </td>
              <td>
                <Dropdown
                  // label="Currency"
                  options={[
                    { value: bank.currencyCode, label: bank.currencyCode },
                  ]}
                  name="currency"
                />
              </td>
              <td>
                <AddIcon onClick={() => console.log("test")} /> {/* Add Row */}
                <DeleteIcon onClick={() => console.log("Delete row")} />{" "}
              </td>
            </tr>
          ))}
        />

        {/* Overtime Details & Budget Code */}
        <div className="row mt-4">
          <div className="col-md-8">
            <h6>
              <strong>Add Overtime Details</strong>
            </h6>
            <Table
              headers={["Days", "Hourly Rate", "Applied Rate", ""]}
              rows={[
                <tr key={1}>
                  <td>
                    <Dropdown
                      label="Days"
                      options={[
                        { value: "Workday", label: "Workday" },
                        { value: "Holiday", label: "Holiday" },
                        { value: "Public Holiday", label: "Public Holiday" },
                      ]}
                      name="overtimeDays"
                    />
                  </td>
                  <td>
                    <Input
                      type="text"
                      maxLength="12"
                      name="hourlyRate"
                      label="Hourly Rate"
                    />
                  </td>
                  <td>
                    <Input
                      type="text"
                      maxLength="12"
                      name="appliedRate"
                      label="Applied Rate"
                    />
                  </td>
                  <td>
                    <button className="btn btn-outline-danger btn-sm border-0">
                      <i className="bx bx-trash" />
                    </button>
                  </td>
                </tr>,
              ]}
            />
          </div>
          <div className="col-md-4">
            <h6>
              <strong>Add Budget Code</strong>
            </h6>
            <Dropdown
              label="Budget Code"
              options={[
                {
                  value: budgetCodes[selectedEmployee?.idEmployee] || "",
                  label: budgetCodes[selectedEmployee?.idEmployee] || "Select",
                },
              ]}
              name="budgetCode"
              value={budgetCodes[selectedEmployee?.idEmployee] || ""}
              onChange={(e) =>
                setBudgetCodes((prev) => ({
                  ...prev,
                  [selectedEmployee?.idEmployee]: e.target.value,
                }))
              }
            />

            {employeeDetails.data && (
              <>
                <Input
                  type="text"
                  name="childCount"
                  label="Child Count"
                  value={employeeDetails.data.childrenCount}
                  onChange={(e) =>
                    setSelectedEmployee({
                      ...selectedEmployee,
                      childrenCount: e.target.value,
                    })
                  }
                />
              </>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EmployeeProfile;
