import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllEmployeeDetails } from "../../redux/reducers/getAllEmployeeDetails";
import Grid from "../../components/Grid";
import Pagination from "../../components/pagination";
import StatusBadge from "../../components/statusBadge";
import Modal from "../../components/modal";
import { Modal as BootstrapModal } from "react-bootstrap";
import Table from "../../components/table";
import Label from "../../components/Label";
import { DeleteIcon, AddIcon } from "../../components/icons";
import { getEmployeeDetailsByID } from "../../redux/reducers/getEmployeeDetails";
import { getBudgetCodeById } from "../../redux/reducers/budgetCode";
import { getEmployeeBankAccountsByID } from "../../redux/reducers/employeeProfiles";
import { getAllOptions } from "../../redux/reducers/getAllOptions";
import { manageEmployeeBankAccount } from "../../redux/reducers/employeeProfiles";
import { deleteEmployeeAttachment } from "../../redux/reducers/employeeProfiles";
import { updateEmployeeDetails } from "../../redux/reducers/employeeProfiles";
import { getEmployeeOvertimeConfigsByID } from "../../redux/reducers/employeeProfiles";
import { manageEmployeeOvertimeConfigs } from "../../redux/reducers/employeeProfiles";
import { getEmployeeProfileByID } from "../../redux/reducers/getAllEmployeeProfiles";
import secureLocalStorage from "react-secure-storage";
export const BASE_URL = import.meta.env.VITE_API_URL;
import { toast } from "react-toastify";
import moment from "moment";
import CommonService from "../../core/services/CommonService";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useLoader } from "../../components/LoaderContext";
import { useNavigate } from "react-router-dom";

const EmployeeProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoader();
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
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
  const [branchesPerBank, setBranchesPerBank] = useState({});
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [isSubmittingEmployee, setIsSubmittingEmployee] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [addEmployeeAllowed, setAddEmployeeAllowed] = useState("YES");
  const [employeeFormData, setEmployeeFormData] = useState({
    employeeCode: "",
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    idNumber: "",
    taxIdNumber: "",
    idDepartment: "",
    idDesignation: "",
    emailID: "",
    phoneNumber1: "",
    phoneNumber2: "",
    whatsAppNumber: "",
    address1: "",
    address2: "",
    address3: "",
    city: "",
    state: "",
    zipCode: "",
    dateOfBirth: null,
    joiningDate: null,
    reportingTo: "",
    currentStatus: "Working",
    idBudgetCode: "",
    childrenCount: 0,
    overTimeAllowedStatus: false,
    employeePhoto: null,
    lastWorkingDay: null,
  });
  const [employeeFormErrors, setEmployeeFormErrors] = useState({});
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [reportingToOptions, setReportingToOptions] = useState([]);
  const [employeePhotoPreview, setEmployeePhotoPreview] = useState(null);
  const [employeePhotoFile, setEmployeePhotoFile] = useState(null);
  const [overtimeDetails, setOvertimeDetails] = useState([
    {
      type: "",
      hourlyRate: "",
      appliedRate: "",
    },
  ]);
  const [overtimeOptions, setOvertimeOptions] = useState([]);
  const [disbursementType, setDisbursementType] = useState("PERCENTAGE");

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

  useEffect(() => {
    showLoader();
    dispatch(getAllEmployeeDetails()).finally(() => {
      hideLoader();
    });
    loadDepartmentsAndDesignations();
    loadReportingToOptions();
    // Load AddEmployeeAllowed from local storage
    const addEmployeeAllowedValue = secureLocalStorage.getItem("AddEmployeeAllowed");
    if (addEmployeeAllowedValue) {
      setAddEmployeeAllowed(addEmployeeAllowedValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    if (showAddEmployeeModal) {
      const modal = document.getElementById("addEmployeeModal");
      if (modal) {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
      }
    }
  }, [showAddEmployeeModal]);

  useEffect(() => {
    const fetchOvertimeTypes = async () => {
      const options = await getOvertimeTypes();
      setOvertimeOptions(options);
    };

    fetchOvertimeTypes();
  }, []);

  const loadDepartmentsAndDesignations = async () => {
    try {
      const [deptRes, desigRes] = await Promise.all([
        CommonService.getDepartmentsList(),
        CommonService.getDesignationsList(),
      ]);
      if (deptRes.data?.data) {
        setDepartments(deptRes.data.data);
      }
      if (desigRes.data?.data) {
        setDesignations(desigRes.data.data);
      }
    } catch (error) {
      console.error("Error loading departments/designations:", error);
    }
  };

  const loadReportingToOptions = async () => {
    try {
      const res = await CommonService.getEmployeeList();
      if (res.data?.data) {
        const options = res.data.data.map((emp) => ({
          value: emp.idEmployee.toString(),
          label: emp.fullName,
        }));
        setReportingToOptions(options);
      }
    } catch (error) {
      console.error("Error loading reporting to options:", error);
    }
  };

  const departmentOptions = useMemo(
    () =>
      departments.map((dept) => ({
        value: dept.idDepartment.toString(),
        label: dept.departmentName,
      })),
    [departments]
  );

  const designationOptions = useMemo(
    () =>
      designations.map((desig) => ({
        value: desig.idDesignation.toString(),
        label: desig.designationName,
      })),
    [designations]
  );

  const genderOptions = [
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
    { value: "OTHER", label: "Other" },
  ];

  const statusOptions = [
    { value: "Working", label: "Working" },
    { value: "NotWorking", label: "Not Working" },
  ];

  const [editFileName, setEditFileName] = useState(null);
  const handlePageChange = (page) => setCurrentPage(page);

  const handleEditClick = (id) => {
    // Navigate to employee management with employee ID and basic-details tab
    navigate(`/dashboard/employee-management?id=${id}&tab=basic-details`);
  };

  const checkDayType = (dayType) => {
    switch (dayType) {
      case "WORKINGDAY":
        return "Workday";
        break;
      case "HOLIDAY":
        return "Holiday";
        break;
      default:
        return dayType;
        break;
    }
  };

  const handleButtonClick = (id) => {
    // Navigate to employee management with bank details tab
    navigate(`/dashboard/employee-management?id=${id}&tab=bank-details`);
  };

  const handleEmpCodeClick = (empCode) => {
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
      if (response.payload && response.payload.data) {
        setBankData(response.payload.data || 0); // Update child count state
      }
    });

    dispatch(getEmployeeOvertimeConfigsByID(empCode)).then((response) => {
      if (response.payload && response.payload.data) {
        setOverTimeData(response.payload.data || 0); // Update child count state
      }
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
      const mappedAccounts = bankAccounts.data?.map((account) => ({
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
      }));

      setBankAccountsState(mappedAccounts);

      const loadBranchesForBanks = async () => {
        const bankIds = [...new Set(mappedAccounts.map(account => account.selectedBank))];

        for (const bankId of bankIds) {
          if (bankId && !branchesPerBank[bankId]) {
            const branches = await getFilteredBranches(bankId);
            setBranchesPerBank(prev => ({
              ...prev,
              [bankId]: branches
            }));
          }
        }
      };

      loadBranchesForBanks();
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

  useEffect(() => { }, [bankAccountsState]);

  useEffect(() => { }, [selectedEmployee]);

  const employeeData =
    employees?.map((employee) => ({
      editId: employee.idEmployee,
      empCode: employee.employeeCode,
      name: employee.fullName,
      designation: employee.designation,
      department: employee.department,
      joiningDate: new Date(employee.joiningDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
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

  const getFilteredBranches = async (bankId) => {
    // Ensure bankId is an integer
    const parsedBankId = parseInt(bankId, 10);

    try {
      const response = await fetch(
        `${BASE_URL}/api/v1/Bank/GetBranchesOfBank?idBank=${parsedBankId}`
      );
      const data = await response.json();

      return data.data.map((branch) => ({
        value: branch.idBankBranches,
        label: branch.abaRoutingNumber,
      }));
    } catch (error) {
      console.error("Error fetching branches:", error);
      return [];
    }
  };

  const getOvertimeTypes = async () => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      const response = await fetch(
        `${BASE_URL}/api/v1/Common/GetHolidayTypes`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const text = await response.text();

      if (!text) {
        console.warn("Empty response from GetHolidayTypes");
        return [];
      }

      const data = JSON.parse(text);

      // Log the full response
      const result =
        data?.map((item) => {
          return {
            value: item.holidayType.toString(),
            label: item.holidayTypeName,
          };
        }) || [];

      return result;
    } catch (error) {
      console.error("Error fetching overtime types:", error);
      return [];
    }
  };

  const handleBankChange = async (value, index) => {
    const filteredBranches = await getFilteredBranches(value);

    setBranchesPerBank(prevState => ({
      ...prevState,
      [value]: filteredBranches
    }));

    setBankAccountsState((prevState) => {
      const newState = [...prevState];
      newState[index].selectedBank = value;
      newState[index].selectedBranch = "";
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
    // Revalidate total salary percentage when salaryPercentageDistributed changes
    if (field === "salaryPercentageDistributed") {
      const salaryPercentageValidation = validateSalaryPercentage();
      setBankAccountErrors((prevErrors) => ({
        ...prevErrors,
        salaryPercentageTotal: salaryPercentageValidation.error,
      }));
    }
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
    // Clear total salary percentage error when adding a new row
    setBankAccountErrors((prevErrors) => ({
      ...prevErrors,
      salaryPercentageTotal: "",
    }));
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
    // Revalidate total salary percentage when deleting a row
    const salaryPercentageValidation = validateSalaryPercentage();
    setBankAccountErrors((prevErrors) => ({
      ...prevErrors,
      salaryPercentageTotal: salaryPercentageValidation.error,
    }));
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
    return overtimeDetails.some(
      (detail, i) => i !== index && detail.type === dayType
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
      setOvertimeErrors((prevErrors) => ({
        ...prevErrors,
        [`overtimeType_${index}`]: "Duplicate DayType values are not allowed.",
      }));
      return;
    }

    setOvertimeErrors((prevErrors) => ({
      ...prevErrors,
      [`overtimeType_${index}`]: "",
    }));

    const newOvertimeDetails = [...overtimeDetails];

    if (field === "type") {
      newOvertimeDetails[index].type = value;
      // Directly assign raw value
      if (value === "WORKINGDAY") {
        newOvertimeDetails[index].appliedRate = "1.5";
      } else {
        newOvertimeDetails[index].appliedRate = "2.0";
      }


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
      if (disbursementType === "PERCENTAGE") {
        if (
          !account.salaryPercentageDistributed ||
          isNaN(parseFloat(account.salaryPercentageDistributed)) ||
          parseFloat(account.salaryPercentageDistributed) <= 0 ||
          parseFloat(account.salaryPercentageDistributed) > 100
        ) {
          isValid = false;
          errors[`salaryPercentage_${index}`] =
            "Salary percentage must be a number between 0 and 100.";
        }
      } else {
        if (
          !account.salaryPercentageDistributed ||
          isNaN(parseFloat(account.salaryPercentageDistributed)) ||
          parseFloat(account.salaryPercentageDistributed) < 0 ||
          account.salaryPercentageDistributed.length > 12
        ) {
          isValid = false;
          errors[`salaryPercentage_${index}`] =
            "Fixed amount must be a positive number with up to 12 digits.";
        }
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

  const validateSalaryPercentage = () => {
    if (disbursementType !== "PERCENTAGE") {
      return { isValid: true, error: "" };
    }

    const totalPercentage = bankAccountsState.reduce((sum, account) => {
      const percentage = parseFloat(account.salaryPercentageDistributed) || 0;
      return sum + percentage;
    }, 0);

    if (totalPercentage > 100) {
      return {
        isValid: false,
        error:
          "The total Salary Percentage Distributed must be less than or equal to 100.",
      };
    }

    return { isValid: true, error: "" };
  };

  const validateBankAccountCombinations = () => {
    const combinations = new Set();

    for (let i = 0; i < bankAccountsState.length; i++) {
      const account = bankAccountsState[i];
      const combinationKey = `${account.selectedBank}-${account.selectedBranch}`;
      if (combinations.has(combinationKey)) {
        return {
          isValid: false,
          error: "Duplicate Bank and BankBranch combination found.",
        };
      }

      combinations.add(combinationKey);
    }

    return { isValid: true, error: "" };
  };

  const [isDeleting, setIsDeleting] = useState(false);
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await dispatch(
        deleteEmployeeAttachment(selectedEmployee.idEmployee)
      );
      if (response?.payload?.success) {
        setAttachmentFile(null);
        setEditFileName(null);
        setShowConfirmModal(false);
      } else {
        console.error(
          "Delete failed:",
          response?.payload?.message || "Unknown error"
        );
      }
    } catch (error) {
      console.error("API error while deleting:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Validate bank account combinations
    const bankAccountCombinationValidation = validateBankAccountCombinations();
    if (!bankAccountCombinationValidation.isValid) {
      setBankAccountErrors((prevErrors) => ({
        ...prevErrors,
        bankAccountCombination: bankAccountCombinationValidation.error,
      }));
      return; // Stop submission if validation fails
    }

    const bankAccountsValid = validateBankAccounts();
    // const overtimeValid = validateOvertimeDetails();

    // Validate salary percentage distribution
    const salaryPercentageValidation = validateSalaryPercentage();
    if (!salaryPercentageValidation.isValid) {
      setBankAccountErrors((prevErrors) => ({
        ...prevErrors,
        salaryPercentageTotal: salaryPercentageValidation.error,
      }));
      return; // Stop submission if validation fails
    }

    if (!bankAccountsValid) {
      return; // Don't proceed with submission if validation fails
    }

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
      disbursementType: disbursementType,
      currencyCode: account.currencyCode,
    }));

    const formData = new FormData();
    formData.append("EmployeeId", selectedEmployee.idEmployee);
    formData.append("BudgetCodeId", parseInt(selectedBudgetCode, 10));
    formData.append("ChildCount", parseInt(childCount, 10));
    if (attachmentFile) {
      formData.append("File", attachmentFile);
    }

    // Only include overtime configs if they exist
    const overtimeConfigsPayload = overtimeDetails
      .filter(detail => detail.type)
      .map((detail) => {
        let dayType = detail.type;
        if (dayType == "Workday") {
          dayType = "WORKINGDAY";
        }
        if (dayType == "Holiday") {
          dayType = "HOLIDAY";
        }
        return {
          idEmployeeOvertimeConfig: detail.idEmployeeOvertimeConfig || 0,
          idEmployee: selectedEmployee.idEmployee,
          dayType: dayType,
          standardRate: parseFloat(detail.hourlyRate),
          dayRate: parseFloat(detail.appliedRate),
        };
      });

    setIsSubmitting(true);
    if (disbursementType == 'PERCENTAGE') {
      try {
        // Only dispatch overtime configs if there are any
        const actions = [
          dispatch(manageEmployeeBankAccount(bankAccountPayload)),
          dispatch(updateEmployeeDetails(formData))
        ];

        if (overtimeConfigsPayload.length > 0) {
          actions.push(dispatch(manageEmployeeOvertimeConfigs(overtimeConfigsPayload)));
        }

        const results = await Promise.all(actions);

        const errors = [];
        if (results[0].error) errors.push("Bank Account update failed");
        if (results[1].error) errors.push("Employee Details update failed");
        if (results[2] && results[2].error) errors.push("Overtime Configs update failed");

        if (errors.length > 0) {
          console.error("API Errors:", errors);
          return false;
        } else {
          setIsModalOpen(false); // Close the modal only on successful submission
          return true;
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        // Don't close the modal if there's an unexpected error
      } finally {
        setIsSubmitting(false);
      }
      dispatch(getAllEmployeeDetails());
    } else {
      let accountLength = bankAccountPayload.length;
      if (accountLength < 2 || bankAccountPayload[accountLength - 1].salaryPercentageDistributed != 0) {
        toast.warning("Required atleast 2 bank accounts with last row with amount 0 for type fixed amount", {
          position: 'top-right',
          autoClose: 5000
        });
        setIsSubmitting(false)
      } else {
        try {
          // Only dispatch overtime configs if there are any
          const actions = [
            dispatch(manageEmployeeBankAccount(bankAccountPayload)),
            dispatch(updateEmployeeDetails(formData))
          ];

          if (overtimeConfigsPayload.length > 0) {
            actions.push(dispatch(manageEmployeeOvertimeConfigs(overtimeConfigsPayload)));
          }

          const results = await Promise.all(actions);

          const errors = [];
          if (results[0].error) errors.push("Bank Account update failed");
          if (results[1].error) errors.push("Employee Details update failed");
          if (results[2] && results[2].error) errors.push("Overtime Configs update failed");

          if (errors.length > 0) {
            console.error("API Errors:", errors);
            return false;
          } else {
            setIsModalOpen(false); // Close the modal only on successful submission
            return true;
          }
        } catch (error) {
          console.error("Unexpected error:", error);
          // Don't close the modal if there's an unexpected error
        } finally {
          setIsSubmitting(false);
        }
        dispatch(getAllEmployeeDetails());
      }
    }
  };

  const handleReset = () => {
    // Reset bank accounts state
    setBankAccountsState([
      {
        idEmployeeBankAccount: null,
        selectedBank: banks.length > 0 ? banks[0].value : "",
        selectedBranch: bankBranches.length > 0 ? bankBranches[0].value : "",
        accountNumber: "",
        salaryPercentageDistributed: "",
        currencyCode: "GYD",
      },
    ]);

    // Reset overtime details state
    setOvertimeDetails([
      {
        type: "",
        hourlyRate: "",
        appliedRate: "",
      },
    ]);

    // Reset selected budget code
    setSelectedBudgetCode("");

    // Reset child count
    setChildCount(0);

    // Clear errors
    setBankAccountErrors({});
    setOvertimeErrors({});

    // Optionally, reset other states if needed
    // setSelectedEmployee(null);
    // setProfileData("");
    // setBankData("");
    // setOverTimeData("");
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
    ...(addEmployeeAllowed === "YES" ? [{ key: "actions" }] : []),
  ];

  const downloadFile = (id) => {
    const employee = employees?.find((emp) => emp.idEmployee === id);
    const item = employee?.attachmentBlobForchildcount;

    const base64Data = item;
    const fileName = employee.childCountDocumentFilePath || 'downloaded-file';

    // Convert Base64 to Blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/octet-stream' });

    // Create a download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName); // Set the file name
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  const phoneFields = ["phoneNumber1", "phoneNumber2", "whatsAppNumber"];
  const numericFields = ["zipCode", "taxIdNumber"];

  const handleEmployeeInputChange = (field, value) => {
    let sanitizedValue = value;

    if (typeof sanitizedValue === "string") {
      sanitizedValue = sanitizedValue.trimStart();
    }

    if (phoneFields.includes(field)) {
      // Allow digits and hyphens for phone numbers
      sanitizedValue = sanitizedValue.replace(/[^\d-]/g, "").slice(0, 20);
    }

    if (numericFields.includes(field)) {
      if (field === "taxIdNumber") {
        // Allow digits and hyphens for tax ID number
        sanitizedValue = sanitizedValue.replace(/[^\d-]/g, "");
      } else {
        sanitizedValue = sanitizedValue.replace(/\D/g, "");
      }
    }

    setEmployeeFormData((prev) => ({
      ...prev,
      [field]: sanitizedValue,
    }));
    // Clear error for this field
    if (employeeFormErrors[field]) {
      setEmployeeFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleEmployeePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setEmployeePhotoFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setEmployeePhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const validateEmployeeForm = () => {
    const errors = {};
    if (!employeeFormData.employeeCode) errors.employeeCode = "Employee Code is required";
    if (!employeeFormData.firstName) errors.firstName = "First Name is required";
    if (!employeeFormData.lastName) errors.lastName = "Last Name is required";
    if (!employeeFormData.gender) errors.gender = "Gender is required";
    if (!employeeFormData.idDepartment) errors.idDepartment = "Department is required";
    if (!employeeFormData.idDesignation) errors.idDesignation = "Designation is required";
    if (!employeeFormData.joiningDate) errors.joiningDate = "Joining Date is required";
    if (!employeeFormData.currentStatus) errors.currentStatus = "Current Status is required";

    if (employeeFormData.emailID && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employeeFormData.emailID)) {
      errors.emailID = "Invalid email format";
    }

    phoneFields.forEach((field) => {
      const value = employeeFormData[field];
      if (value) {
        // Check if value contains only digits and hyphens
        if (!/^[\d-]+$/.test(value)) {
          errors[field] = "Must contain only digits and hyphens";
        } else {
          // Count only digits for length validation
          const digitCount = value.replace(/-/g, "").length;
          if (digitCount < 7 || digitCount > 15) {
            errors[field] = "Must be 7-15 digits (hyphens allowed)";
          }
        }
      }
    });

    const numericFieldRules = [
      { field: "zipCode", regex: /^\d{3,10}$/, message: "Zip Code must be 3-10 digits" },
    ];

    numericFieldRules.forEach(({ field, regex, message }) => {
      const value = employeeFormData[field];
      if (value && !regex.test(value)) {
        errors[field] = message;
      }
    });

    // Special validation for taxIdNumber to allow hyphens
    if (employeeFormData.taxIdNumber) {
      const taxIdValue = employeeFormData.taxIdNumber;
      // Check if value contains only digits and hyphens
      if (!/^[\d-]+$/.test(taxIdValue)) {
        errors.taxIdNumber = "Tax ID Number must contain only digits and hyphens";
      } else {
        // Count only digits for length validation
        const digitCount = taxIdValue.replace(/-/g, "").length;
        if (digitCount < 3 || digitCount > 20) {
          errors.taxIdNumber = "Tax ID Number must be 3-20 digits (hyphens allowed)";
        }
      }
    }

    setEmployeeFormErrors(errors);
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const resetEmployeeForm = () => {
    setEmployeeFormData({
      employeeCode: "",
      firstName: "",
      middleName: "",
      lastName: "",
      gender: "",
      idNumber: "",
      taxIdNumber: "",
      idDepartment: "",
      idDesignation: "",
      emailID: "",
      phoneNumber1: "",
      phoneNumber2: "",
      whatsAppNumber: "",
      address1: "",
      address2: "",
      address3: "",
      city: "",
      state: "",
      zipCode: "",
      dateOfBirth: null,
      joiningDate: null,
      reportingTo: "",
      currentStatus: "Working",
      idBudgetCode: "",
      childrenCount: 0,
      overTimeAllowedStatus: false,
      employeePhoto: null,
      lastWorkingDay: null,
    });
    setEmployeeFormErrors({});
    setEditingEmployeeId(null);
    setEmployeePhotoPreview(null);
    setEmployeePhotoFile(null);
  };

  const handleEmployeeFormSubmit = async (e) => {
    e.preventDefault();

    const validationResult = validateEmployeeForm();
    if (!validationResult.isValid) {
      toast.error("Please fix the validation errors before submitting");
      // Scroll to first error field
      const firstErrorField = Object.keys(validationResult.errors)[0];
      if (firstErrorField) {
        setTimeout(() => {
          const errorElement = document.getElementById(firstErrorField) || 
                              document.querySelector(`[name="${firstErrorField}"]`);
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            errorElement.focus();
          }
        }, 100);
      }
      return false;
    }

    try {
      setIsSubmittingEmployee(true);
      showLoader();

      const {
        employeePhoto,
        ...payloadWithoutPhoto
      } = {
        ...employeeFormData,
        idDepartment: employeeFormData.idDepartment ? parseInt(employeeFormData.idDepartment) : null,
        idDesignation: employeeFormData.idDesignation ? parseInt(employeeFormData.idDesignation) : null,
        reportingTo: employeeFormData.reportingTo ? parseInt(employeeFormData.reportingTo) : null,
        idBudgetCode: employeeFormData.idBudgetCode ? parseInt(employeeFormData.idBudgetCode) : null,
        childrenCount: parseInt(employeeFormData.childrenCount) || 0,
        dateOfBirth: employeeFormData.dateOfBirth ? moment(employeeFormData.dateOfBirth).format("YYYY-MM-DD") : null,
        joiningDate: employeeFormData.joiningDate ? moment(employeeFormData.joiningDate).format("YYYY-MM-DD") : null,
        lastWorkingDay: employeeFormData.lastWorkingDay ? moment(employeeFormData.lastWorkingDay).format("YYYY-MM-DD") : null,
      };

      if (editingEmployeeId) {
        payloadWithoutPhoto.idEmployee = editingEmployeeId;
      }

      const formDataPayload = new FormData();

      Object.entries(payloadWithoutPhoto).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          formDataPayload.append(key, "");
        } else if (typeof value === "boolean") {
          formDataPayload.append(key, value ? "true" : "false");
        } else {
          formDataPayload.append(key, value);
        }
      });

      if (employeePhotoFile) {
        formDataPayload.append("employeePhoto", employeePhotoFile);
      } else if (employeePhoto) {
        formDataPayload.append("employeePhoto", employeePhoto);
      } else {
        formDataPayload.append("employeePhoto", "");
      }

      const result = editingEmployeeId
        ? await CommonService.updateEmployee(formDataPayload, editingEmployeeId)
        : await CommonService.saveEmployee(formDataPayload);

      if (result.error) {
        hideLoader();
        console.error("API Error:", result.error);
        toast.error(result.error.message || "Failed to save employee");
        return false;
      }

      if (result.data?.success) {
        toast.success(editingEmployeeId ? "Employee updated successfully" : "Employee added successfully");
        resetEmployeeForm();
        showLoader();
        dispatch(getAllEmployeeDetails()).finally(() => {
          hideLoader();
        });
        const modal = document.getElementById("addEmployeeModal");
        if (modal) {
          const bsModal = bootstrap.Modal.getInstance(modal);
          if (bsModal) bsModal.hide();
        }
        return true;
      } else {
        hideLoader();
        console.error("API returned success=false:", result.data);
        toast.error(result.data?.message || "Failed to save employee");
        return false;
      }
    } catch (error) {
      hideLoader();
      console.error("Error saving employee:", error);
      toast.error("An error occurred while saving employee");
      return false;
    } finally {
      setIsSubmittingEmployee(false);
    }
  };

  const handleOpenEditEmployeeProfile = async () => {
    if (!profileData?.idEmployee) {
      toast.error("Employee details not found");
      return;
    }

    const employeeId = profileData.idEmployee;
    let detailedData = {};

    try {
      showLoader();
      const response = await CommonService.getEmployeeById(employeeId);
      hideLoader();
      if (response.error) {
        console.error("Error fetching employee details for edit:", response.error);
        toast.error("Failed to fetch employee details");
      } else if (response.data?.data) {
        detailedData = response.data.data;
      }
    } catch (error) {
      hideLoader();
      console.error("Error fetching employee details for edit:", error);
      toast.error("Failed to fetch employee details");
    }

    const formatDateForForm = (value) =>
      value ? (moment(value).isValid() ? moment(value).format("YYYY-MM-DD") : null) : null;

    const employeePhotoValue =
      detailedData.employeePhoto ?? profileData?.attachmentBlob ?? null;

    setEmployeeFormData({
      employeeCode: detailedData.employeeCode ?? profileData.employeeCode ?? "",
      firstName: detailedData.firstName ?? profileData.firstName ?? "",
      middleName: detailedData.middleName ?? profileData.middleName ?? "",
      lastName: detailedData.lastName ?? profileData.lastName ?? "",
      gender: detailedData.gender ?? profileData.gender ?? "",
      idNumber: detailedData.idNumber ?? profileData.idNumber ?? "",
      taxIdNumber: detailedData.taxIdNumber ?? profileData.taxIdNumber ?? "",
      idDepartment: detailedData.idDepartment
        ? detailedData.idDepartment.toString()
        : profileData.idDepartment
        ? profileData.idDepartment.toString()
        : "",
      idDesignation: detailedData.idDesignation
        ? detailedData.idDesignation.toString()
        : profileData.idDesignation
        ? profileData.idDesignation.toString()
        : "",
      emailID: detailedData.emailID ?? detailedData.emailId ?? profileData.emailId ?? "",
      phoneNumber1: detailedData.phoneNumber1 ?? profileData.phoneNumber1 ?? "",
      phoneNumber2: detailedData.phoneNumber2 ?? profileData.phoneNumber2 ?? "",
      whatsAppNumber: detailedData.whatsAppNumber ?? profileData.whatsAppNumber ?? "",
      address1: detailedData.address1 ?? profileData.address1 ?? "",
      address2: detailedData.address2 ?? profileData.address2 ?? "",
      address3: detailedData.address3 ?? profileData.address3 ?? "",
      city: detailedData.city ?? profileData.city ?? "",
      state: detailedData.state ?? profileData.state ?? "",
      zipCode: detailedData.zipCode ?? profileData.zipCode ?? "",
      dateOfBirth: formatDateForForm(detailedData.dateOfBirth ?? profileData.dateOfBirth),
      joiningDate: formatDateForForm(detailedData.joiningDate ?? profileData.joiningDate),
      reportingTo: detailedData.reportingTo
        ? detailedData.reportingTo.toString()
        : profileData.reportingToId
        ? profileData.reportingToId.toString()
        : "",
      currentStatus: detailedData.currentStatus ?? profileData.currentStatus ?? "Working",
      idBudgetCode: detailedData.idBudgetCode
        ? detailedData.idBudgetCode.toString()
        : profileData.idBudgetCode
        ? profileData.idBudgetCode.toString()
        : "",
      childrenCount:
        detailedData.childrenCount ??
        profileData.childrenCount ??
        profileData.childCount ??
        0,
      overTimeAllowedStatus:
        typeof detailedData.overTimeAllowedStatus !== "undefined"
          ? detailedData.overTimeAllowedStatus === true || detailedData.overTimeAllowedStatus === "true"
          : typeof profileData.overTimeAllowedStatus !== "undefined"
          ? profileData.overTimeAllowedStatus === true || profileData.overTimeAllowedStatus === "true"
          : false,
      employeePhoto: employeePhotoValue,
      lastWorkingDay: formatDateForForm(
        detailedData.lastWorkingDay ?? profileData.lastWorkingDay
      ),
    });

    setEmployeeFormErrors({});
    setEmployeePhotoPreview(
      employeePhotoValue ? `data:image/jpeg;base64,${employeePhotoValue}` : null
    );
    setEmployeePhotoFile(null);
    setEditingEmployeeId(employeeId);

    const profileModalElement = document.getElementById("EMP_profileView");
    if (profileModalElement) {
      const profileModalInstance = bootstrap.Modal.getInstance(profileModalElement);
      if (profileModalInstance) {
        profileModalInstance.hide();
      }
    }

    setShowAddEmployeeModal(true);
  };

  const handleEmployeeModalClose = () => {
    resetEmployeeForm();
    setShowAddEmployeeModal(false);
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">List of Employees</h5>
              <div className="list_menu">
                {addEmployeeAllowed === "YES" && (
                  <button
                    className="btn btn-primary btn-sm px-4 me-2"
                    onClick={() => {
                      navigate("/dashboard/employee-management");
                    }}
                  >
                    Add New
                  </button>
                )}
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
                <>
                  <Grid
                    columns={columns}
                    data={paginatedEmployeeData}
                    onEditClick={handleEditClick}
                    onEmpCodeClick={handleEmpCodeClick}
                    onDownloadClick={downloadFile}
                    idKey="editId"
                    modalId="Add_EMP_Account"
                    popUpId="EMP_profileView"
                    employees={employees}
                  />
                  <div className="mt-3 mx-2">
                    <strong>No. of Active Employees: </strong>
                    {employees?.filter(emp => emp.currentStatus === 'Working').length || 0}
                  </div>
                </>
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
          data-bs-backdrop="static" // Prevents closing on outside click
          data-bs-keyboard="false" // Prevents closing on Esc key p
        >
          <div
            className="modal-dialog modal-xl modal-dialog-centered"
            role="document"
            data-bs-backdrop="static" // Prevents closing on outside click
            data-bs-keyboard="false" // Prevents closing on Esc key p
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
                      <img
                        src={
                          profileData?.attachmentBlob != null
                            ? `data:image/jpeg;base64,${profileData?.attachmentBlob}`
                            : "src/assets/avatar.jpg"
                        }
                      />
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
                      <label className="form-label mb-1">
                        Date of Birth, Gender
                      </label>
                      <p className="m-0">
                        {profileData?.dateOfBirth ? moment(profileData.dateOfBirth).format("MM/DD/YYYY") : "N/A"} -{" "}
                        {profileData?.gender ? profileData?.gender : "N/A"}
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
                      <label className="form-label mb-1">WhatsApp Number</label>
                      <p className="m-0">{profileData?.whatsAppNumber || "N/A"}</p>
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
                      <p className="m-0">
                        {new Date(
                          profileData?.joiningDate
                        ).toLocaleDateString()}
                      </p>
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
                      <p className="m-0">
                        <StatusBadge status={profileData?.currentStatus} />
                      </p>
                    </div>

                    <div className="col-lg-4 col-md-6 p-2">
                      <label className="form-label mb-1">SSN</label>
                      <p className="m-0">{profileData?.ssnNumber || "N/A"}</p>
                    </div>
                    <div className="col-lg-4 col-md-6 p-2">
                      <label className="form-label mb-1">Tax ID Number</label>
                      <p className="m-0">{profileData?.taxIdNumber || "N/A"}</p>
                    </div>
                    <div className="col-lg-4 col-md-6 p-2">
                      <label className="form-label mb-1">ID Number</label>
                      <p className="m-0">{profileData?.idNumber || "N/A"}</p>
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
                      Array.isArray(bankData) && bankData.length > 0
                        ? bankData[0]?.disbursementType === "PERCENTAGE"
                          ? "% Salary"
                          : "Amount(G$)"
                        : "Salary",
                      "Currency",
                    ]}
                    rows={(Array.isArray(bankData) ? bankData : []).map(
                      (account, index) => (
                        <tr key={index}>
                          <td>{account?.bankName ?? "-"}</td>
                          <td>{account?.branchName ?? "-"}</td>
                          <td>{account?.accountNumber ?? "-"}</td>
                          <td>
                            {account?.salaryPercentageDistributed ?? "-"}
                            {account?.disbursementType === "PERCENTAGE" ? " %" : ""}
                          </td>
                          <td>{account?.currencyCode ?? "-"}</td>
                        </tr>
                      )
                    )}
                  />
                  {/* <div className="text-end py-2 d-flex justify-content-end gap-2">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        navigate(`/dashboard/employee-management?id=${profileData?.idEmployee}&tab=bank-details`);
                      }}
                    >
                      <i className="bx bx-bank"></i> Manage Bank Details
                    </button>
                    {addEmployeeAllowed === "YES" && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={handleOpenEditEmployeeProfile}
                      >
                        <i className="bx bx-edit"></i> Edit Profile
                      </button>
                    )}
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      <BootstrapModal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        size="md"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        backdrop="static"
        keyboard={false}
      >
        <BootstrapModal.Header closeButton>
          <BootstrapModal.Title>
            <h5>Confirm Delete</h5>
          </BootstrapModal.Title>
        </BootstrapModal.Header>

        <BootstrapModal.Body>
          <div className="modal-body pt-1 text-center">
            <div className="text-center mb-4">
              <div className="mb-4 text-danger">
                <i className="bx bx-x-circle fs-2"></i>
              </div>
              <h6>Are you sure you want to remove this file?</h6>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-sm py-2 px-4 me-2"
              onClick={handleConfirmDelete}
              disabled={isDeleting} // optional loading state
            >
              {isDeleting ? "Deleting..." : "Confirm"}
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm py-2 px-4"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </button>
          </div>
        </BootstrapModal.Body>
      </BootstrapModal>

      {/* Add/Update Employee Modal */}
      <Modal
        id="addEmployeeModal"
        title={editingEmployeeId ? "Update Employee Profile" : "Add Employee Profile"}
        isOpen={showAddEmployeeModal}
        onClose={handleEmployeeModalClose}
        onSubmit={handleEmployeeFormSubmit}
        isSubmitting={isSubmittingEmployee}
        onReset={resetEmployeeForm}
        submitLabel={editingEmployeeId ? "Update" : "Submit"}
      >
        <div className="row">
          <div className="col-md-4">
            <label className="form-label mb-1" htmlFor="employeeCode">
              Employee Code *
            </label>
            <input
              id="employeeCode"
              name="employeeCode"
              type="text"
              className={`form-control${employeeFormErrors.employeeCode ? " is-invalid" : ""}`}
              value={employeeFormData.employeeCode}
              onChange={(e) => handleEmployeeInputChange("employeeCode", e.target.value)}
            />
            {employeeFormErrors.employeeCode && (
              <div className="invalid-feedback d-block">
                {employeeFormErrors.employeeCode}
              </div>
            )}
          </div>
          <div className="col-md-4">
            <label className="form-label mb-1">Department *</label>
            <select
              className={`form-select${employeeFormErrors.idDepartment ? " is-invalid" : ""}`}
              name="idDepartment"
              value={employeeFormData.idDepartment}
              onChange={(e) => handleEmployeeInputChange("idDepartment", e.target.value)}
            >
              <option value="">Select Department</option>
              {departmentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {employeeFormErrors.idDepartment && (
              <div className="text-danger">{employeeFormErrors.idDepartment}</div>
            )}
          </div>
          <div className="col-md-4">
            <label className="form-label mb-1">Designation *</label>
            <select
              className={`form-select${employeeFormErrors.idDesignation ? " is-invalid" : ""}`}
              name="idDesignation"
              value={employeeFormData.idDesignation}
              onChange={(e) => handleEmployeeInputChange("idDesignation", e.target.value)}
            >
              <option value="">Select Designation</option>
              {designationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {employeeFormErrors.idDesignation && (
              <div className="text-danger">{employeeFormErrors.idDesignation}</div>
            )}
          </div>

        </div>

        <div className="row">
          <div className="col-md-4">
            <label className="form-label mb-1 mt-2" htmlFor="firstName">
              First Name *
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              className={`form-control${employeeFormErrors.firstName ? " is-invalid" : ""}`}
              value={employeeFormData.firstName}
              onChange={(e) => handleEmployeeInputChange("firstName", e.target.value)}
            />
            {employeeFormErrors.firstName && (
              <div className="invalid-feedback d-block">
                {employeeFormErrors.firstName}
              </div>
            )}
          </div>
          <div className="col-md-4">
            <label className="form-label mb-1 mt-2" htmlFor="middleName">
              Middle Name
            </label>
            <input
              id="middleName"
              name="middleName"
              type="text"
              className="form-control"
              value={employeeFormData.middleName}
              onChange={(e) => handleEmployeeInputChange("middleName", e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label mb-1 mt-2" htmlFor="lastName">
              Last Name *
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              className={`form-control${employeeFormErrors.lastName ? " is-invalid" : ""}`}
              value={employeeFormData.lastName}
              onChange={(e) => handleEmployeeInputChange("lastName", e.target.value)}
            />
            {employeeFormErrors.lastName && (
              <div className="invalid-feedback d-block">
                {employeeFormErrors.lastName}
              </div>
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-md-4">
            <label className="form-label mb-1 mt-2">Gender *</label>
            <div>
              {genderOptions.map((option) => (
                <div className="form-check form-check-inline" key={option.value}>
                  <input
                    className="form-check-input"
                    type="radio"
                    name="gender"
                    id={`gender-${option.value}`}
                    value={option.value}
                    checked={employeeFormData.gender === option.value}
                    onChange={(e) => handleEmployeeInputChange("gender", e.target.value)}
                  />
            <label className="form-check-label" htmlFor={`gender-${option.value}`}>
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
            {employeeFormErrors.gender && (
              <div className="text-danger">{employeeFormErrors.gender}</div>
            )}
          </div>
          <div className="col-md-4">
            <label className="form-label mb-1 mt-2">Date of Birth</label>
            <DatePicker
              selected={
                employeeFormData.dateOfBirth
                  ? moment(employeeFormData.dateOfBirth, "YYYY-MM-DD").toDate()
                  : null
              }
              onChange={(date) => handleEmployeeInputChange("dateOfBirth", date)}
              dateFormat="MM/dd/yyyy"
              className="form-control"
              maxDate={new Date()}
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
              wrapperClassName="d-block"
            />
          </div>
          <div className="col-md-4">
            <label className="form-label mb-1 mt-2">Joining Date *</label>
            <DatePicker
              selected={
                employeeFormData.joiningDate
                  ? moment(employeeFormData.joiningDate, "YYYY-MM-DD").toDate()
                  : null
              }
              onChange={(date) => handleEmployeeInputChange("joiningDate", date)}
              dateFormat="MM/dd/yyyy"
              className="form-control"
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
              wrapperClassName="d-block"
            />
            {employeeFormErrors.joiningDate && (
              <div className="text-danger">{employeeFormErrors.joiningDate}</div>
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-md-4">
            <label className="form-label mb-1 mt-2" htmlFor="emailID">
              Email ID
            </label>
            <input
              id="emailID"
              name="emailID"
              type="email"
              className={`form-control${employeeFormErrors.emailID ? " is-invalid" : ""}`}
              value={employeeFormData.emailID}
              onChange={(e) => handleEmployeeInputChange("emailID", e.target.value)}
            />
            {employeeFormErrors.emailID && (
              <div className="invalid-feedback d-block">
                {employeeFormErrors.emailID}
              </div>
            )}
          </div>
          <div className="col-md-4">
            <label className="form-label mb-1 mt-2" htmlFor="phoneNumber1">
              Phone Number 1
            </label>
            <input
              id="phoneNumber1"
              name="phoneNumber1"
              type="text"
              className={`form-control${employeeFormErrors.phoneNumber1 ? " is-invalid" : ""}`}
              value={employeeFormData.phoneNumber1}
              onChange={(e) => handleEmployeeInputChange("phoneNumber1", e.target.value)}
            />
            {employeeFormErrors.phoneNumber1 && (
              <div className="invalid-feedback d-block">
                {employeeFormErrors.phoneNumber1}
              </div>
            )}
          </div>
          {/* <div className="col-md-4">
            <Input
              label="Phone Number 2"
              name="phoneNumber2"
              value={employeeFormData.phoneNumber2}
              onChange={(e) => handleEmployeeInputChange("phoneNumber2", e.target.value)}
            />
          </div> */}
          <div className="col-md-4">
            <label className="form-label mb-1 mt-2" htmlFor="whatsAppNumber">
              WhatsApp Number
            </label>
            <input
              id="whatsAppNumber"
              name="whatsAppNumber"
              type="text"
              className={`form-control${employeeFormErrors.whatsAppNumber ? " is-invalid" : ""}`}
              value={employeeFormData.whatsAppNumber}
              onChange={(e) => handleEmployeeInputChange("whatsAppNumber", e.target.value)}
            />
            {employeeFormErrors.whatsAppNumber && (
              <div className="invalid-feedback d-block">
                {employeeFormErrors.whatsAppNumber}
              </div>
            )}
          </div>
        </div>

        <div className="row">

          <div className="col-md-4">
            <label className="form-label mb-1 mt-2" htmlFor="address1">
              Address 1
            </label>
            <input
              id="address1"
              name="address1"
              type="text"
              className="form-control"
              value={employeeFormData.address1}
              onChange={(e) => handleEmployeeInputChange("address1", e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label mb-1 mt-2" htmlFor="address2">
              Address 2
            </label>
            <input
              id="address2"
              name="address2"
              type="text"
              className="form-control"
              value={employeeFormData.address2}
              onChange={(e) => handleEmployeeInputChange("address2", e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label mb-1 mt-2" htmlFor="address3">
              Address 3
            </label>
            <input
              id="address3"
              name="address3"
              type="text"
              className="form-control"
              value={employeeFormData.address3}
              onChange={(e) => handleEmployeeInputChange("address3", e.target.value)}
            />
          </div>
        </div>

        <div className="row">
          <div className="col-md-4">
            <label className="form-label mb-1 mt-2" htmlFor="city">
              City
            </label>
            <input
              id="city"
              name="city"
              type="text"
              className="form-control"
              value={employeeFormData.city}
              onChange={(e) => handleEmployeeInputChange("city", e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label mb-1 mt-2" htmlFor="state">
              State
            </label>
            <input
              id="state"
              name="state"
              type="text"
              className="form-control"
              value={employeeFormData.state}
              onChange={(e) => handleEmployeeInputChange("state", e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label mb-1 mt-2" htmlFor="zipCode">
              Zip Code
            </label>
            <input
              id="zipCode"
              name="zipCode"
              type="text"
              className={`form-control${employeeFormErrors.zipCode ? " is-invalid" : ""}`}
              value={employeeFormData.zipCode}
              onChange={(e) => handleEmployeeInputChange("zipCode", e.target.value)}
            />
            {employeeFormErrors.zipCode && (
              <div className="invalid-feedback d-block">
                {employeeFormErrors.zipCode}
              </div>
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-md-4">
            <label className="form-label mb-1 mt-2" htmlFor="reportingTo">
              Reporting To
            </label>
            <select
              id="reportingTo"
              className="form-select"
              name="reportingTo"
              value={employeeFormData.reportingTo}
              onChange={(e) => handleEmployeeInputChange("reportingTo", e.target.value)}
            >
              <option value="">Select Reporting Manager</option>
              {reportingToOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label mb-1 mt-2" htmlFor="currentStatus">
              Current Status *
            </label>
            <select
              id="currentStatus"
              className={`form-select${employeeFormErrors.currentStatus ? " is-invalid" : ""}`}
              name="currentStatus"
              value={employeeFormData.currentStatus}
              onChange={(e) => handleEmployeeInputChange("currentStatus", e.target.value)}
            >
              <option value="">Select Status</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {employeeFormErrors.currentStatus && (
              <div className="text-danger">{employeeFormErrors.currentStatus}</div>
            )}
          </div>
          {employeeFormData.currentStatus === "NotWorking" && (
            <div className="col-md-4">
              <label className="form-label mb-1 mt-2">Last Working Day</label>
              <DatePicker
                selected={
                  employeeFormData.lastWorkingDay
                    ? moment(employeeFormData.lastWorkingDay, "YYYY-MM-DD").toDate()
                    : null
                }
                onChange={(date) => handleEmployeeInputChange("lastWorkingDay", date)}
                dateFormat="MM/dd/yyyy"
                className="form-control"
                maxDate={new Date()}
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                wrapperClassName="d-block"
              />
            </div>
          )}
        </div>

        <div className="row">
          <div className="col-md-4">
            <label className="form-label mb-1 mt-2" htmlFor="idBudgetCode">
              Budget Code
            </label>
            <select
              id="idBudgetCode"
              className="form-select"
              name="idBudgetCode"
              value={employeeFormData.idBudgetCode}
              onChange={(e) => handleEmployeeInputChange("idBudgetCode", e.target.value)}
            >
              <option value="">Select Budget Code</option>
              {budgetCodeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label mb-1 mt-2" htmlFor="taxIdNumber">
              Tax ID Number
            </label>
            <input
              id="taxIdNumber"
              name="taxIdNumber"
              type="text"
              className={`form-control${employeeFormErrors.taxIdNumber ? " is-invalid" : ""}`}
              value={employeeFormData.taxIdNumber}
              onChange={(e) => handleEmployeeInputChange("taxIdNumber", e.target.value)}
            />
            {employeeFormErrors.taxIdNumber && (
              <div className="invalid-feedback d-block">
                {employeeFormErrors.taxIdNumber}
              </div>
            )}
          </div>
          <div className="col-md-4">
            <label className="form-label mb-1 mt-2" htmlFor="idNumber">
              ID Number
            </label>
            <input
              id="idNumber"
              name="idNumber"
              type="text"
              className={`form-control${employeeFormErrors.idNumber ? " is-invalid" : ""}`}
              value={employeeFormData.idNumber}
              onChange={(e) => handleEmployeeInputChange("idNumber", e.target.value)}
            />
            {employeeFormErrors.idNumber && (
              <div className="invalid-feedback d-block">
                {employeeFormErrors.idNumber}
              </div>
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-md-4">
            <label className="form-label mb-1 mt-2">Overtime Allowed Status</label>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={employeeFormData.overTimeAllowedStatus === true || employeeFormData.overTimeAllowedStatus === "true"}
                onChange={(e) => handleEmployeeInputChange("overTimeAllowedStatus", e.target.checked)}
              />
              <label className="form-check-label">
                {employeeFormData.overTimeAllowedStatus === true || employeeFormData.overTimeAllowedStatus === "true" ? "Yes" : "No"}
              </label>
            </div>
          </div>
          
        </div>

        <div className="row">
          <div className="col-md-4">
            <label className="form-label mb-1 mt-2">Employee Photo</label>
            <input
              type="file"
              id="employeePhotoInput"
              className="form-control"
              accept="image/*"
              onChange={handleEmployeePhotoChange}
            />
            {employeePhotoPreview && (
              <div className="mt-2">
                <img
                  src={employeePhotoPreview}
                  alt="Employee Photo Preview"
                  style={{
                    maxWidth: "120px",
                    maxHeight: "120px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    padding: "5px",
                    marginTop: "5px",
                  }}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger mt-2 d-block"
                  onClick={() => {
                    setEmployeePhotoPreview(null);
                      setEmployeePhotoFile(null);
                    handleEmployeeInputChange("employeePhoto", null);
                    const fileInput = document.getElementById('employeePhotoInput');
                    if (fileInput) fileInput.value = '';
                  }}
                >
                  Remove Photo
                </button>
              </div>
            )}
          </div>
        </div>


      </Modal>
    </div>
  );
};

export default EmployeeProfile;
