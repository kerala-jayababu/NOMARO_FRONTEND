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
import { getEmployeeProfileByID } from "../../redux/reducers/getAllEmployeeProfiles";

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
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const { banks, bankBranches, budgetCode, overTimesTypes } = useSelector(
    (state) => state.getAllOptions
  );
  const [bankAccountsState, setBankAccountsState] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [budgetCodeLabel, setBudgetCodeLabel] = useState("");
  const [bankAccountErrors, setBankAccountErrors] = useState({});
  const [overtimeErrors, setOvertimeErrors] = useState({});
  const [childCount, setChildCount] = useState(0);

  const [selectedBudgetCode, setSelectedBudgetCode] = useState("");
  const [profileData, setProfileData] = useState("");
  const [bankData, setBankData] = useState("");
  const [overTimeData, setOverTimeData] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
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
      // dispatch(getEmployeeDetailsByID(id));
      dispatch(getEmployeeDetailsByID(id)).then((response) => {
        if (response.payload && response.payload.data) {
          setChildCount(response.payload.data.childrenCount || 0); // Update child count state
        }
      });

      // dispatch(getEmployeeProfileByID(id)).then((response) => {
      //   if (response.payload && response.payload.data && response.payload.data.length > 0) {
      //     const employeeData = response.payload.data[0];
      //     setProfileData(employeeData);
      //     // Open the modal

      //   }
      // });

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


  const handleButtonClick = (id) => {
    setSelectedEmployee(null);
    setBankAccountsState([]);
    setOvertimeDetails([]);

    const employee = employees?.find((emp) => emp.idEmployee === id);
    if (employee) {
      setSelectedEmployee(employee);

      // Fetch employee details
      // dispatch(getEmployeeDetailsByID(id));
      dispatch(getEmployeeDetailsByID(id)).then((response) => {
        if (response.payload && response.payload.data) {
          setChildCount(response.payload.data.childrenCount || 0); // Update child count state
        }
      });

      // dispatch(getEmployeeProfileByID(id)).then((response) => {
      //   if (response.payload && response.payload.data && response.payload.data.length > 0) {
      //     const employeeData = response.payload.data[0];
      //     setProfileData(employeeData);
      //     // Open the modal

      //   }
      // });

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


  const handleEmpCodeClick = (empCode) => {
    console.log(`Emp Code clicked: ${empCode}`);
    // Dispatch the action to get employee profile by emp code
    dispatch(getEmployeeProfileByID(empCode)).then((response) => {
      if (
        response.payload &&
        response.payload.data &&
        response.payload.data.length > 0
      ) {
        const employeeData = response.payload.data[0];
        setProfileData(employeeData);
        // Open the modal or handle other actions here
      }
    });
    dispatch(getEmployeeBankAccountsByID(empCode)).then((response) => {
      console.log("Bank Accounts Response:", response);
      if (response.payload && response.payload.data) {
        setBankData(response.payload.data || 0); // Update child count state
      }
      console.log("Bank Data:", bankData);
    });

    dispatch(getEmployeeOvertimeConfigsByID(empCode)).then((response) => {
      console.log("Overtime Response:", response);
      if (response.payload && response.payload.data) {
        setOverTimeData(response.payload.data || 0); // Update child count state
      }
      console.log("OverTime Data:", overTimeData);
    });
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
        console.log(
          "Setting selectedBudgetCode from employeeDetails:",
          budgetCodeValue
        );
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

  useEffect(() => {}, [bankAccountsState]);

  useEffect(() => {}, [selectedEmployee]);

  const employeeData =
  employees?.map((employee) => ({
    editId: employee.idEmployee,
    empCode: employee.employeeCode,
    name: employee.fullName,
    designation: employee.designation,
    department: employee.department,
    joiningDate: new Date(employee.joiningDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }),
    status: employee.currentStatus,
    childCount: employee.childrenCount,
  })) || [];

  const filteredEmployeeData = useMemo(() => {
    if (!searchTerm) return employeeData;
  
    return employeeData.filter((employee) => {
      return (
        employee.empCode.toLowerCase().includes(searchTerm.toLowerCase()) || 
        employee.designation.toLowerCase().includes(searchTerm.toLowerCase()) || 
        employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [employeeData, searchTerm]);
  

  const rowsPerPage = 10; // Number of rows per page

  const totalPages = Math.ceil(filteredEmployeeData.length / rowsPerPage);

  const paginatedEmployeeData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredEmployeeData.slice(startIndex, endIndex);
  }, [filteredEmployeeData, currentPage, rowsPerPage]);

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
    
    if (field === "accountNumber") {
      // Allow only alphanumeric values and enforce max length of 25
      if (!/^[a-zA-Z0-9]{0,25}$/.test(value)) {
        return; // Do nothing if the input is invalid
      }
    }

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

  // const handleAddOvertimeRow = () => {
  //   setOvertimeDetails([
  //     ...overtimeDetails,
  //     {
  //       type: "",
  //       hourlyRate: "",
  //       appliedRate: "",
  //     },
  //   ]);
  // };

  const isDuplicateDayType = (dayType, index) => {
    console.log("Checking for duplicates in:", dayType);
    console.log("Checking for duplicates in index:", index, overtimeDetails);

    const dayTypeMapping = {
      1: "Workday",
      2: "Holiday",
    };

    const mappedDayType = dayTypeMapping[dayType];

    return overtimeDetails.some(
      (detail, i) => i !== index && detail.type === mappedDayType
    );
  };

  const handleAddOvertimeRow = () => {
    const newOvertimeDetails = [
      ...overtimeDetails,
      {
        type: "",
        hourlyRate: "",
        appliedRate: "",
      },
    ];

    // Check for duplicates in the new row
    const lastIndex = newOvertimeDetails.length - 1;
    const newDayType = newOvertimeDetails[lastIndex].type;

    console.log("Checking for duplicates in new row:", lastIndex);
    console.log(
      "Checking for duplicates in new type:",
      newOvertimeDetails[lastIndex].type
    );

    if (isDuplicateDayType(newDayType, lastIndex)) {
      setOvertimeErrors((prevErrors) => ({
        ...prevErrors,
        [`overtimeType_${lastIndex}`]:
          "Duplicate DayType values are not allowed.",
      }));
      return; // Prevent adding the row if duplicate is found
    }

    setOvertimeDetails(newOvertimeDetails);
  };

  const handleOvertimeChange = (index, field, value) => {
    if (field === "type" && isDuplicateDayType(value, index)) {
      console.log("Duplicate found for:", value);
      setOvertimeErrors((prevErrors) => ({
        ...prevErrors,
        [`overtimeType_${index}`]: "Duplicate DayType values are not allowed.",
      }));
      return; // Prevent updating the state if duplicate is found
    }

    // Clear any existing error for this field
    setOvertimeErrors((prevErrors) => ({
      ...prevErrors,
      [`overtimeType_${index}`]: "",
    }));

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

    // Clear errors for the deleted row
    setOvertimeErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      Object.keys(newErrors).forEach((key) => {
        if (key.endsWith(`_${index}`)) {
          delete newErrors[key];
        }
      });
      return newErrors;
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
        return false;
      } else {
        console.log("All updates successful");
        setIsModalOpen(false); // Close the modal only on successful submission
        return true;
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
                  <input
                    type="search"
                    className="form-control"
                    placeholder="Search by Emp. Code or Name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
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
                  data={paginatedEmployeeData}
                  onEditClick={handleEditClick}
                  onEmpCodeClick={handleEmpCodeClick}
                  idKey="editId"
                  modalId="Add_EMP_Account"
                  popUpId="EMP_profileView"
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
        <div
          className="modal fade"
          id="EMP_profileView"
          tabIndex="-1"
          aria-hidden="true"
        >
          <div
            className="modal-dialog modal-xl modal-dialog-centered"
            role="document"
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="modalCenterTitle">
                  Employee Profile View
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body pt-1 accountDetail_card">
                <div className="accountDetail_cardProfile">
                  <div className="avatar-upload">
                    <div className="avatar-preview">
                      <img src="src/assets/avatar.jpg" />
                    </div>
                  </div>

                  <div className="row m-0 mt-3">
                    <div className="col-lg-4 col-md-6 p-2">
                      <label className="form-label mb-1">Employee Code</label>
                      <p className="m-0">{profileData?.employeeCode}</p>
                    </div>
                    <div className="col-lg-4 col-md-6 p-2">
                      <label className="form-label mb-1">Employee Name</label>
                      <p className="m-0">{profileData?.fullName}</p>
                    </div>
                    <div className="col-lg-4 col-md-6 p-2">
                      <label className="form-label mb-1">Date of Birth, Gender</label>
                      <p className="m-0">
                        {profileData?.dob ? profileData.dob : "N/A"} - {profileData?.gender ? profileData?.gender : "N/A"}
                      </p>
                    </div>

                    <div className="col-lg-4 col-md-6 p-2">
                      <label className="form-label mb-1">Email ID</label>
                      <p className="m-0">{profileData?.emailId}</p>
                    </div>
                    <div className="col-lg-4 col-md-6 p-2">
                      <label className="form-label mb-1">Work Phone</label>
                      <p className="m-0">{profileData?.phoneNumber1}</p>
                    </div>
                    <div className="col-lg-4 col-md-6 p-2">
                      <label className="form-label mb-1">Mobile Number</label>
                      <p className="m-0">{profileData?.phoneNumber2}</p>
                    </div>

                    <div className="col-lg-4 col-md-6 p-2">
                      <label className="form-label mb-1">Department</label>
                      <p className="m-0">{profileData?.department}</p>
                    </div>
                    <div className="col-lg-4 col-md-6 p-2">
                      <label className="form-label mb-1">Designation</label>
                      <p className="m-0">{profileData?.designation}</p>
                    </div>
                    <div className="col-lg-4 col-md-6 p-2">
                      <label className="form-label mb-1">Joining Date</label>
                      <p className="m-0">{new Date(
                        profileData?.joiningDate
                      ).toLocaleDateString()}</p>
                    </div>


                    <div className="col-lg-4 col-md-6 p-2">
                      <label className="form-label mb-1">Address</label>
                      <p className="m-0">{profileData?.address}</p>
                    </div>
                    <div className="col-lg-4 col-md-6 p-2">
                      <label className="form-label mb-1">Reporting To</label>
                      <p className="m-0">{profileData?.reportingTo}</p>
                    </div>
                    <div className="col-lg-4 col-md-6 p-2">
                      <label className="form-label mb-1">Current Status</label>
                      <p className="m-0"><span className="badge bg-label-success">{profileData?.currentStatus}</span></p>
                    </div>

                    <div className="col-lg-4 col-md-6 p-2">
                      <label className="form-label mb-1">SSN</label>
                      <p className="m-0">{profileData?.ssn || "N/A"}</p>
                    </div>
                    <div className="col-lg-4 col-md-6 p-2">
                      <label className="form-label mb-1">Tax ID Number</label>
                      <p className="m-0">{profileData?.taxIdNumber || "N/A"}</p>
                    </div>
                    <div className="col-lg-4 col-md-6 p-2">
                      <label className="form-label mb-1">Budget Code </label>
                      <p className="m-0">{profileData?.budgetCode}</p>
                    </div>
                  </div>

                  <div className="row m-0">
                    <div className="col-md-10 p-2">
                      <div className="py-2">
                        <h6 className="fw-bold mb-0">Overtime Configuration</h6>
                      </div>
                      <Table
                        headers={["Days", "Hourly Rate", "Applied Rate"]}
                        rows={(Array.isArray(overTimeData)
                          ? overTimeData
                          : []
                        ).map((config, index) => (
                          <tr key={index}>
                            <td className="col-md-6">{config.dayType}</td>
                            <td className="col-md-3">{config.standardRate}</td>
                            <td className="col-md-3">{config.dayRate}</td>
                          </tr>
                        ))}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-2">
                  <div className="py-2">
                    <h6 className="fw-bold mb-0">Bank Account Details</h6>
                  </div>
                  <Table
                    headers={[
                      "Bank Name",
                      "Branch Name",
                      "Account Number",
                      "% Salary",
                      "Currency",
                    ]}
                    rows={(Array.isArray(bankData) ? bankData : []).map(
                      (account, index) => (
                        <tr key={index}>
                          <td>{account.idBank}</td>
                          <td>{account.idBankBranch}</td>
                          <td>{account.accountNumber}</td>
                          <td>{account.salaryPercentageDistributed}%</td>
                          <td>{account.currencyCode}</td>
                        </tr>
                      )
                    )}
                  />
                  <div className="text-end py-2">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        handleButtonClick(profileData?.idEmployee); // Set the selected employee ID
                        setIsModalOpen(true); // Open the modal
                      
                      }}
                      data-bs-toggle="modal"
                      data-bs-target="#Add_EMP_Account" // Add # prefix
                    >
                      <i className="bx bx-user"></i> Update Profile
                    </button>
                  </div>
                </div>
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
        employeeId={selectedEmployeeId}
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


        {/* Bank Account Details Table Component Starts */}
        <table className="table table-sm mb-0 border">
          <thead>
            <tr>
              <th>Bank Name</th>
              <th className="text-nowrap">Branch Name</th>
              <th className="text-nowrap">Account Number</th>
              <th className="text-nowrap">% Salary</th>
              <th className="text-nowrap">Currency</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {bankAccountsState.length > 0 ? (
              bankAccountsState.map((bank, index) => (
                <React.Fragment key={index}>
                  <tr>
                    <td className="col-md-3">
                        <Dropdown
                          options={[ ...bankOptions]}
                          name="bankName"
                          value={bank.selectedBank}
                          onChange={(e) => handleBankChange(e.target.value, index)}
                        />
                      </td>
                      <td className="col-md-3">
                        <Dropdown
                          options={[...branchOptions]}
                          name="branchName"
                          value={bank.selectedBranch}
                          onChange={(e) => handleBranchChange(e.target.value, index)}
                        />
                      </td>
                      <td className="col-md-3">
                        <input
                            type="text"
                            className="form-control"
                            name="accountNumber"
                            value={bank.accountNumber}
                            maxLength="25"
                            onChange={(e) => handleInputChange(e, index, "accountNumber")}
                          />

                      </td>

                      <td className="col-md-2">
                        <input
                            type="text"
                            name="salaryPercentage"
                            className="form-control"
                            value={bank.salaryPercentageDistributed}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^[0-9]*\.?[0-9]*$/.test(value)) {
                                handleInputChange(e, index, "salaryPercentageDistributed");
                              }
                            }}
                          />
                      </td>
                      
                      <td className="col-md-3">
                        <Dropdown
                            options={[{ value: "GYD", label: "GYD" }, { value: "USD", label: "USD" }]}
                            name="currency"
                            value={bank.currencyCode}
                            onChange={(e) => handleInputChange(e, index, "currencyCode")}
                          />
                          
                      </td>
                      <td className="col-md-1">
                      {index === bankAccountsState.length - 1 && <AddIcon onClick={handleAddRow} />}
                        {bankAccountsState.length > 1 && index < bankAccountsState.length - 1 && (
                              <DeleteIcon onClick={() => handleDeleteRow(index)} />
                            )}
                      </td>
                  </tr>
                  {Object.keys(bankAccountErrors).some((key) => key.endsWith(`_${index}`)) && (
                    <tr>
                      <td className="col-md-3">
                        <div style={{ color: "red" }}>
                          {bankAccountErrors[`idBank_${index}`] && <div>{bankAccountErrors[`idBank_${index}`]}</div>}
                          {bankAccountErrors[`idBankBranch_${index}`] && <div>{bankAccountErrors[`idBankBranch_${index}`]}</div>}
                          {bankAccountErrors[`accountNumber_${index}`] && <div>{bankAccountErrors[`accountNumber_${index}`]}</div>}
                          {bankAccountErrors[`salaryPercentage_${index}`] && <div>{bankAccountErrors[`salaryPercentage_${index}`]}</div>}
                          {bankAccountErrors[`currencyCode_${index}`] && <div>{bankAccountErrors[`currencyCode_${index}`]}</div>}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr >
                <td className="text-center col-md-6">No bank accounts found. Click '+' to add one.</td>
              </tr>
            )}
          </tbody>
        </table>



        {/* Bank Account Details Table Component Ends */}

      

        {/* Overtime Details & Budget Code */}
        <div className="row mt-4">
          <div className="col-md-8">
            <h6>
              <strong>Add Overtime Details</strong>
            </h6>



           {/* Table Component Begins*/}
           <table className="table table-sm mb-0 border">
            <thead>
              <tr>
                <th>Days</th>
                <th className="text-nowrap">Hourly Rate</th>
                <th className="text-nowrap">Applied Rate</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {overtimeDetails.map((detail, index) => (
                <React.Fragment key={index}>
                  <tr>
                    <td className="col-md-3">
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
                    <td className="col-md-3">
                      <input
                        type="text"
                        className="form-control"
                        maxLength="10"
                        name="hourlyRate"
                        value={detail.hourlyRate}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d{0,10}$/.test(value)) {
                            handleOvertimeChange(index, "hourlyRate", value);
                          }
                        }}
                      />
                    </td>
                    <td className="col-md-3">
                      <input
                        type="text"
                        maxLength="5"
                        name="appliedRate"
                        className="form-control"
                        value={detail.appliedRate}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d{0,2}(\.\d{0,2})?$/.test(value)) {
                            handleOvertimeChange(index, "appliedRate", value);
                          }
                        }}
                      />
                    </td>
                    <td className="col-md-1">
                      {index === overtimeDetails.length - 1 && (
                        <AddIcon onClick={handleAddOvertimeRow} />
                      )}
                      {overtimeDetails.length > 1 && index < overtimeDetails.length - 1 && (
                        <DeleteIcon onClick={() => handleDeleteOvertimeRow(index)} />
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
            </tbody>
          </table>


          {/* Table Component Ends*/}


          
          </div>
          <div className="col-md-4">
            <h6>
              <strong>Add Budget Code</strong>
            </h6>
            <Dropdown
              label="Budget Code"
              options={[
                ...budgetCodeOptions,
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
                value={childCount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) {
                    setChildCount(value);
                  }
                }}
              />
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EmployeeProfile;
