import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllEmployeeDetails } from "../../redux/reducers/getAllEmployeeDetails";
import Grid from "../../components/grid";
import Pagination from "../../components/pagination";
import StatusBadge from "../../components/statusBadge";
import Modal from "../../components/modal";
import Table from "../../components/table";
import Label from "../../components/label";
import { DeleteIcon, AddIcon } from "../../components/icons";
import Dropdown from "../../components/Dropdown";
import Input from "../../components/Input";
import { getEmployeeDetailsByID } from "../../redux/reducers/getEmployeeDetails";
import { getBudgetCodeById } from "../../redux/reducers/budgetCode";
import { getEmployeeBankAccountsByID } from "../../redux/reducers/employeeProfiles";
import { getAllOptions } from "../../redux/reducers/getAllOptions";
import { manageEmployeeBankAccount } from "../../redux/reducers/employeeProfiles";
import { updateEmployeeDetails } from "../../redux/reducers/employeeProfiles";
import { getEmployeeOvertimeConfigsByID } from "../../redux/reducers/employeeProfiles";
import { manageEmployeeOvertimeConfigs } from "../../redux/reducers/employeeProfiles";

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
  const { options: bankAccounts } = useSelector(
    (state) => state.employeeProfiles
  );

  const { options: overtimeConfigs } = useSelector(
    (state) => state.employeeProfiles
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const { banks, bankBranches, budgetCode, overTimesTypes } = useSelector(
    (state) => state.getAllOptions
  );
  const [bankAccountsState, setBankAccountsState] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [budgetCodeLabel, setBudgetCodeLabel] = useState("");
  const [bankAccountErrors, setBankAccountErrors] = useState({});
  const [overtimeErrors, setOvertimeErrors] = useState({});

  const [selectedBudgetCode, setSelectedBudgetCode] = useState("");
  const [overtimeDetails, setOvertimeDetails] = useState([
    {
      type: "",
      hourlyRate: "",
      appliedRate: "",
    },
  ]);

  const bankOptions = useMemo(
    () =>
      banks.map((bank) => ({
        value: bank.value,
        label: bank.displayName,
      })),
    [banks]
  );

  const branchOptions = useMemo(
    () =>
      bankBranches.map((branch) => ({
        value: branch.value,
        label: branch.displayName,
      })),
    [bankBranches]
  );

  const budgetCodeOptions = useMemo(
    () =>
      budgetCode?.map((code) => ({
        value: code.value.toString(),
        label: code.displayName,
      })),
    [budgetCode]
  );

  const overtimeOptions = useMemo(
    () =>
      overTimesTypes.map((type) => ({
        value: type.value.toString(),
        label:
          type.displayName === "Working Day" ? "Workday" : type.displayName,
      })),
    [overTimesTypes]
  );



  const totalPages = 5;

  useEffect(() => {
    dispatch(getAllEmployeeDetails());
  }, [dispatch]);

  const handlePageChange = (page) => setCurrentPage(page);

  const handleEditClick = (id) => {
    setSelectedEmployee(null);
    setBankAccountsState([]);
    setOvertimeDetails([]);

    const employee = employees?.find((emp) => emp.idEmployee === id);
    if (employee) {
      setSelectedEmployee(employee);

      // Fetch employee details
      dispatch(getEmployeeDetailsByID(id));

      // Fetch bank accounts and overtime configs simultaneously
      Promise.all([
        dispatch(getEmployeeBankAccountsByID(id)),
        dispatch(getEmployeeOvertimeConfigsByID(id)),
      ])
        .then(([bankAccountsResult, overtimeConfigsResult]) => {
          // Handle bank accounts
          if (
            bankAccountsResult.payload &&
            bankAccountsResult.payload.data &&
            bankAccountsResult.payload.data.length > 0
          ) {
            const mappedBankAccounts = bankAccountsResult.payload.data.map(
              (account) => ({
                ...account,
                selectedBank:
                  account.idBank != null ? account.idBank.toString() : "",
                selectedBranch:
                  account.idBankBranch != null
                    ? account.idBankBranch.toString()
                    : "",
                accountNumber: account.accountNumber || "",
                salaryPercentageDistributed:
                  account.salaryPercentageDistributed != null
                    ? account.salaryPercentageDistributed.toString()
                    : "",
                currencyCode: account.currencyCode || "GYD",
              })
            );
            setBankAccountsState(mappedBankAccounts);
          } else {
            setBankAccountsState([
              {
                idEmployeeBankAccount: null,
                selectedBank: banks.length > 0 ? banks[0].value : "",
                selectedBranch:
                  bankBranches.length > 0 ? bankBranches[0].value : "",
                accountNumber: "",
                salaryPercentageDistributed: "",
                currencyCode: "GYD",
              },
            ]);
          }

          // Handle overtime configs
          if (
            overtimeConfigsResult.payload &&
            overtimeConfigsResult.payload.data &&
            overtimeConfigsResult.payload.data.length > 0
          ) {
            const mappedOvertimeDetails =
              overtimeConfigsResult.payload.data.map((config) => {
                let dayType = config.dayType;
                if (dayType === "Working Day") {
                  dayType = "Workday";
                }
                const matchingOption = overtimeOptions.find(
                  (option) => option.label === dayType
                );
                return {
                  type: matchingOption ? matchingOption.label : dayType,
                  hourlyRate:
                    config.standardRate != null
                      ? config.standardRate.toString()
                      : "",
                  appliedRate:
                    config.dayRate != null ? config.dayRate.toString() : "",
                  idEmployeeOvertimeConfig:
                    config.idEmployeeOvertimeConfig || 0,
                };
              });
            setOvertimeDetails(mappedOvertimeDetails);
          } else {
            setOvertimeDetails([
              {
                type: "",
                hourlyRate: "",
                appliedRate: "",
              },
            ]);
          }
        })
        .catch((error) => {
          console.error("Error fetching employee data:", error);
        });

      if (employee.idBudgetCode) {
        const budgetCodeValue = employee.idBudgetCode.toString();
        console.log("Setting selectedBudgetCode:", budgetCodeValue);
        setSelectedBudgetCode(budgetCodeValue);
      }
    }
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (overtimeConfigs.data && Array.isArray(overtimeConfigs.data)) {
      const mappedOvertimeDetails = overtimeConfigs.data.map((config) => ({
        type: config.dayType || "",
        hourlyRate: config.standardRate ? config.standardRate.toString() : "",
        appliedRate: config.dayRate ? config.dayRate.toString() : "",
        idEmployeeOvertimeConfig: config.idEmployeeOvertimeConfig || 0,
      }));
      setOvertimeDetails(mappedOvertimeDetails);
    } else {
      setOvertimeDetails([
        {
          type: "",
          hourlyRate: "",
          appliedRate: "",
        },
      ]);
    }
  }, [overtimeConfigs.data]);

  useEffect(() => {
    if (employeeDetails.length > 0) {
      setSelectedEmployee(employeeDetails[0]);
    }
  }, [employeeDetails]);
  useEffect(() => {
    if (employeeDetails && employeeDetails.data) {
      setSelectedEmployee(employeeDetails.data);
      if (employeeDetails.data.idBudgetCode) {
        const budgetCodeValue = employeeDetails.data.idBudgetCode.toString();
        console.log("Setting selectedBudgetCode from employeeDetails:", budgetCodeValue);
        setSelectedBudgetCode(budgetCodeValue);
        // Fetch the budget code label if needed
        dispatch(getBudgetCodeById(employeeDetails.data.idBudgetCode));
      }
    }
  }, [employeeDetails, dispatch]);

  useEffect(() => {
    if (selectedBudgetCode) {
      const selectedBudgetCodeOption = budgetCodeOptions.find(
        (option) => option.value === selectedBudgetCode
      );
      if (selectedBudgetCodeOption) {
        setBudgetCodeLabel(selectedBudgetCodeOption.label);
      } else {
        // If the label is not found in the options, we might need to fetch it
        dispatch(getBudgetCodeById(parseInt(selectedBudgetCode, 10))).then(
          (action) => {
            if (action.payload && action.payload.data) {
              setBudgetCodeLabel(action.payload.data.budgetCode);
            }
          }
        );
      }
    }
  }, [selectedBudgetCode, budgetCodeOptions, dispatch]);

  useEffect(() => {
    if (
      bankAccounts.data &&
      bankAccounts.data.length > 0 &&
      Array.isArray(bankAccounts.data)
    ) {
      setBankAccountsState(
        bankAccounts.data?.map((account) => ({
          ...account,
          selectedBank: account.idBank != null ? account.idBank.toString() : "",
          selectedBranch:
            account.idBankBranch != null ? account.idBankBranch.toString() : "",
          accountNumber: account.accountNumber || "",
          salaryPercentageDistributed:
            account.salaryPercentageDistributed != null
              ? account.salaryPercentageDistributed.toString()
              : "",
          currencyCode: account.currencyCode || "GYD",
        }))
      );
    } else {
      setBankAccountsState([
        {
          idEmployeeBankAccount: null,
          selectedBank: banks.length > 0 ? banks[0].value.toString() : "",
          selectedBranch:
            bankBranches.length > 0 ? bankBranches[0].value.toString() : "",
          accountNumber: "",
          salaryPercentageDistributed: "",
          currencyCode: "GYD",
        },
      ]);
    }
  }, [bankAccounts.data, banks, bankBranches]);

  useEffect(() => {
    dispatch(getAllOptions());
  }, [dispatch]);

  useEffect(() => {
  }, [bankAccountsState]);

  useEffect(() => {
  }, [selectedEmployee]);

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

  const handleBankChange = (value, index) => {
    setBankAccountsState((prevState) => {
      const newState = [...prevState];
      newState[index].selectedBank = value;
      newState[index].selectedBranch =
        branchOptions.length > 0 ? branchOptions[0].value : "";
      return newState;
    });
  };
  const handleBranchChange = (value, index) => {
    setBankAccountsState((prevState) => {
      const newState = [...prevState];
      newState[index].selectedBranch = value;
      return newState;
    });
  };

  const handleInputChange = (e, index, field) => {
    const { value } = e.target;
    setBankAccountsState((prevState) => {
      const newState = [...prevState];
      newState[index][field] = value;
      return newState;
    });
  };

  const handleAddRow = () => {
    setBankAccountsState((prevState) => [
      ...prevState,
      {
        idEmployeeBankAccount: null,
        selectedBank: "", // Set to empty string initially
        selectedBranch: "", // Set to empty string initially
        accountNumber: "",
        salaryPercentageDistributed: "",
        currencyCode: "GYD",
      },
    ]);
  };

  const handleDeleteRow = (index) => {
    setBankAccountsState((prevState) => {
      if (prevState.length === 1) {
        return [
          {
            idEmployeeBankAccount: null,
            selectedBank: banks.length > 0 ? banks[0].value : "",
            selectedBranch:
              bankBranches.length > 0 ? bankBranches[0].value : "",
            accountNumber: "",
            salaryPercentageDistributed: "",
            currencyCode: "GYD",
          },
        ];
      }
      return prevState.filter((_, i) => i !== index);
    });
  };

  const handleAddOvertimeRow = () => {
    setOvertimeDetails([
      ...overtimeDetails,
      {
        type: "",
        hourlyRate: "",
        appliedRate: "",
      },
    ]);
  };

  const handleOvertimeChange = (index, field, value) => {
    const newOvertimeDetails = [...overtimeDetails];
    if (field === "type") {
      // Find the corresponding label (displayName) for the selected value
      const selectedOption = overtimeOptions.find(
        (option) => option.value === value
      );
      let newType = selectedOption ? selectedOption.label : value;
      // Ensure "Workday" is used in the frontend
      if (newType === "Working Day") {
        newType = "Workday";
      }
      newOvertimeDetails[index][field] = newType;
    } else {
      newOvertimeDetails[index][field] = value;
    }
    setOvertimeDetails(newOvertimeDetails);
  };

  const handleDeleteOvertimeRow = (index) => {
    setOvertimeDetails((prevState) => {
      if (prevState.length === 1) {
        return [
          {
            idEmployeeOvertimeConfig: null,
            type: "",
            hourlyRate: "",
            appliedRate: "",
          },
        ];
      }
      // Remove the item at the specified index
      return prevState.filter((_, i) => i !== index);
    });
  };

  const validateBankAccounts = () => {
    let isValid = true;
    let errors = {};

    bankAccountsState.forEach((account, index) => {
      if (!account.selectedBank) {
        isValid = false;
        errors[`idBank_${index}`] = "Bank is required.";
      }
      if (!account.selectedBranch) {
        isValid = false;
        errors[`idBankBranch_${index}`] = "Branch is required.";
      }
      if (!account.accountNumber) {
        isValid = false;
        errors[`accountNumber_${index}`] = "Account number is required.";
      }
      if (
        !account.salaryPercentageDistributed ||
        isNaN(parseFloat(account.salaryPercentageDistributed)) ||
        parseFloat(account.salaryPercentageDistributed) <= 0 ||
        parseFloat(account.salaryPercentageDistributed) >= 100
      ) {
        isValid = false;
        errors[`salaryPercentage_${index}`] =
          "Salary percentage must be a number greater than 0 and less than 100.";
      }
      if (!["GYD", "USD"].includes(account.currencyCode)) {
        isValid = false;
        errors[`currencyCode_${index}`] = "Currency must be 'GYD' or 'USD'.";
      }
    });
    setBankAccountErrors(errors);
    return isValid;
  };

  const validateOvertimeDetails = () => {
    let isValid = true;
    let errors = {};

    overtimeDetails.forEach((detail, index) => {
      if (!detail.type) {
        isValid = false;
        errors[`overtimeType_${index}`] = "Overtime type is required.";
      }
      if (
        !detail.hourlyRate ||
        isNaN(parseFloat(detail.hourlyRate)) ||
        parseFloat(detail.hourlyRate) <= 0
      ) {
        isValid = false;
        errors[`hourlyRate_${index}`] =
          "Hourly rate must be a number greater than 0.";
      }
      if (
        !detail.appliedRate ||
        isNaN(parseFloat(detail.appliedRate)) ||
        parseFloat(detail.appliedRate) <= 0
      ) {
        isValid = false;
        errors[`appliedRate_${index}`] =
          "Applied rate must be a number greater than 0.";
      }
    });
    setOvertimeErrors(errors);
    return isValid;
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const bankAccountsValid = validateBankAccounts();
    const overtimeValid = validateOvertimeDetails();

    if (!bankAccountsValid || !overtimeValid) {
      return; // Don't proceed with submission if validation fails
    }

    setIsSubmitting(true);

    const bankAccountPayload = bankAccountsState.map((account) => ({
      idEmployeeBankAccount: account.idEmployeeBankAccount || 0,
      idEmployee: selectedEmployee.idEmployee,
      idBank: parseInt(account.selectedBank, 10),
      idBankBranch: parseInt(account.selectedBranch, 10),
      accountNumber: account.accountNumber,
      branchCode: account.selectedBranch.toString(),
      salaryPercentageDistributed: parseFloat(
        account.salaryPercentageDistributed
      ),
      currencyCode: account.currencyCode,
    }));

    const employeeDetailsPayload = {
      employeeId: selectedEmployee.idEmployee,
      budgetCodeId: parseInt(selectedBudgetCode, 10) || 0,
      childCount: parseInt(employeeDetails.data.childrenCount, 10) || 0,
    };

    const overtimeConfigsPayload = overtimeDetails.map((detail) => {
      let dayType = detail.type;
      if (dayType === "Working day") {
        dayType = "Workday";
      }
      return {
        idEmployeeOvertimeConfig: detail.idEmployeeOvertimeConfig || 0,
        idEmployee: selectedEmployee.idEmployee,
        dayType: dayType,
        standardRate: parseFloat(detail.hourlyRate),
        dayRate: parseFloat(detail.appliedRate),
      };
    });

    try {
      const [bankAccountAction, employeeDetailsAction, overtimeConfigsAction] =
        await Promise.all([
          dispatch(manageEmployeeBankAccount(bankAccountPayload)),
          dispatch(updateEmployeeDetails(employeeDetailsPayload)),
          dispatch(manageEmployeeOvertimeConfigs(overtimeConfigsPayload)),
        ]);

      const errors = [];
      if (bankAccountAction.error) errors.push("Bank Account update failed");
      if (employeeDetailsAction.error)
        errors.push("Employee Details update failed");
      if (overtimeConfigsAction.error)
        errors.push("Overtime Configs update failed");

      if (errors.length > 0) {
        console.error("API Errors:", errors);
        // Don't close the modal if there are API errors
      } else {
        console.log("All updates successful");
        setIsModalOpen(false); // Close the modal only on successful submission
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      // Don't close the modal if there's an unexpected error
    } finally {
      setIsSubmitting(false);
    }
  };

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
    { key: "actions" },
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
      <Modal
        id="Add_EMP_Account"
        title="Add Employee Bank Account"
        onClose={() => {
          setSelectedEmployee(null);
          setBankAccountsState([
            {
              idEmployeeBankAccount: null,
              selectedBank: banks.length > 0 ? banks[0].value : "",
              selectedBranch:
                bankBranches.length > 0 ? bankBranches[0].value : "",
              accountNumber: "",
              salaryPercentageDistributed: "",
              currencyCode: "GYD",
            },
          ]);
          setIsModalOpen(false);
          setBankAccountErrors({}); // Clear errors when modal is closed
          setOvertimeErrors({}); // Clear errors when modal is closed
        }}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        isOpen={isModalOpen}
      >
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
          rows={
            bankAccountsState.length > 0 ? (
              bankAccountsState.map((bank, index) => (
                <React.Fragment
                  key={bank.idEmployeeBankAccount || `new-${index}`}
                >
                  <tr>
                    <td colSpan="6">
                      <div
                        style={{
                          display: "flex",
                          gap: "19px",
                          alignItems: "center",
                        }}
                      >
                        <Dropdown
                          options={[
                            { value: "", label: "Select an option" },
                            ...bankOptions,
                          ]}
                          name="bankName"
                          value={bank.selectedBank}
                          onChange={(e) =>
                            handleBankChange(e.target.value, index)
                          }
                          style={{ width: "20%" }}
                        />
                        <Dropdown
                          options={[
                            { value: "", label: "Select an option" },
                            ...branchOptions,
                          ]}
                          name="branchName"
                          value={bank.selectedBranch}
                          onChange={(e) =>
                            handleBranchChange(e.target.value, index)
                          }
                          style={{ width: "20%" }}
                        />
                        <Input
                          type="text"
                          name="accountNumber"
                          value={bank.accountNumber}
                          onChange={(e) =>
                            handleInputChange(e, index, "accountNumber")
                          }
                          style={{ width: "15%" }}
                        />
                        <Input
                          type="text"
                          name="salaryPercentage"
                          value={bank.salaryPercentageDistributed}
                          onChange={(e) =>
                            handleInputChange(
                              e,
                              index,
                              "salaryPercentageDistributed"
                            )
                          }
                          style={{ width: "15%" }}
                        />
                        <Dropdown
                          options={[
                            { value: "GYD", label: "GYD" },
                            { value: "USD", label: "USD" },
                          ]}
                          name="currency"
                          value={bank.currencyCode}
                          onChange={(e) =>
                            handleInputChange(e, index, "currencyCode")
                          }
                          style={{ width: "10%" }}
                        />
                        <AddIcon onClick={handleAddRow} />
                        {bankAccountsState.length > 1 && (
                          <DeleteIcon onClick={() => handleDeleteRow(index)} />
                        )}
                      </div>
                    </td>
                  </tr>
                  {Object.keys(bankAccountErrors).some((key) =>
                    key.endsWith(`_${index}`)
                  ) && (
                    <tr>
                      <td colSpan="6">
                        <div style={{ color: "red" }}>
                          {bankAccountErrors[`idBank_${index}`] && (
                            <div>{bankAccountErrors[`idBank_${index}`]}</div>
                          )}
                          {bankAccountErrors[`idBankBranch_${index}`] && (
                            <div>
                              {bankAccountErrors[`idBankBranch_${index}`]}
                            </div>
                          )}
                          {bankAccountErrors[`accountNumber_${index}`] && (
                            <div>
                              {bankAccountErrors[`accountNumber_${index}`]}
                            </div>
                          )}
                          {bankAccountErrors[`salaryPercentage_${index}`] && (
                            <div>
                              {bankAccountErrors[`salaryPercentage_${index}`]}
                            </div>
                          )}
                          {bankAccountErrors[`currencyCode_${index}`] && (
                            <div>
                              {bankAccountErrors[`currencyCode_${index}`]}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center">
                  No bank accounts found. Click &apos;+&apos; to add one.
                </td>
              </tr>
            )
          }
        />

        {/* Overtime Details & Budget Code */}
        <div className="row mt-4">
          <div className="col-md-8">
            <h6>
              <strong>Add Overtime Details</strong>
            </h6>
            <Table
              headers={["Days", "Hourly Rate", "Applied Rate", ""]}
              rows={overtimeDetails.map((detail, index) => (
                <React.Fragment key={index}>
                  <tr>
                    <td>
                      <Dropdown
                        options={overtimeOptions}
                        name="overtimeDays"
                        value={
                          overtimeOptions.find(
                            (option) => option.label === detail.type
                          )?.value || ""
                        }
                        onChange={(e) =>
                          handleOvertimeChange(index, "type", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <Input
                        type="text"
                        maxLength="12"
                        name="hourlyRate"
                        value={detail.hourlyRate}
                        onChange={(e) =>
                          handleOvertimeChange(
                            index,
                            "hourlyRate",
                            e.target.value
                          )
                        }
                      />
                    </td>
                    <td>
                      <Input
                        type="text"
                        maxLength="12"
                        name="appliedRate"
                        value={detail.appliedRate}
                        onChange={(e) =>
                          handleOvertimeChange(
                            index,
                            "appliedRate",
                            e.target.value
                          )
                        }
                      />
                    </td>
                    <td>
                      {index === overtimeDetails.length - 1 && (
                        <AddIcon onClick={handleAddOvertimeRow} />
                      )}
                      {overtimeDetails.length > 1 && (
                        <DeleteIcon
                          onClick={() => handleDeleteOvertimeRow(index)}
                        />
                      )}
                    </td>
                  </tr>
                  {Object.keys(overtimeErrors).some((key) =>
                    key.endsWith(`_${index}`)
                  ) && (
                    <tr>
                      <td colSpan="4">
                        <div style={{ color: "red" }}>
                          {overtimeErrors[`overtimeType_${index}`] && (
                            <div>{overtimeErrors[`overtimeType_${index}`]}</div>
                          )}
                          {overtimeErrors[`hourlyRate_${index}`] && (
                            <div>{overtimeErrors[`hourlyRate_${index}`]}</div>
                          )}
                          {overtimeErrors[`appliedRate_${index}`] && (
                            <div>{overtimeErrors[`appliedRate_${index}`]}</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            />
          </div>
          <div className="col-md-4">
            <h6>
              <strong>Add Budget Code</strong>
            </h6>
            <Dropdown
              label="Budget Code"
              options={[
                { value: "", label: "Select an option" },
                ...budgetCodeOptions
              ]}
              name="budgetCode"
              value={selectedBudgetCode}
              onChange={(e) => {
                const value = e.target.value;
                console.log("Budget Code Dropdown changed:", value);
                setSelectedBudgetCode(value);
                const selectedOption = budgetCodeOptions.find(
                  (option) => option.value === value
                );
                console.log("Selected Option:", selectedOption.label);  
                if (selectedOption) {
                  setBudgetCodeLabel(selectedOption.label);
                }
              }}
            />

            {employeeDetails.data && (
              <Input
                type="text"
                name="childCount"
                label="Child Count"
                value={employeeDetails.data.childrenCount}
                onChange={(e) =>
                  dispatch(
                    getEmployeeDetailsByID({
                      ...employeeDetails.data,
                      childrenCount: e.target.value,
                    })
                  )
                }
              />
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EmployeeProfile;
