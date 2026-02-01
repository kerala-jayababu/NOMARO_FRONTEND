import React, { useState, useEffect, useContext, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { EmployeeContext } from "../EmployeeManagement";
import { getEmployeeBankAccountsByID } from "../../../../redux/reducers/employeeProfiles";
import { getEmployeeOvertimeConfigsByID } from "../../../../redux/reducers/employeeProfiles";
import { manageEmployeeBankAccount } from "../../../../redux/reducers/employeeProfiles";
import { manageEmployeeOvertimeConfigs } from "../../../../redux/reducers/employeeProfiles";
import { updateEmployeeDetails } from "../../../../redux/reducers/employeeProfiles";
import { getAllOptions } from "../../../../redux/reducers/getAllOptions";
import { getBudgetCodeById } from "../../../../redux/reducers/budgetCode";
import { getEmployeeDetailsByID } from "../../../../redux/reducers/getEmployeeDetails";
import { DeleteIcon, AddIcon } from "../../../../components/icons";
import { toast } from "react-toastify";
import { useLoader } from "../../../../components/LoaderContext";
import secureLocalStorage from "react-secure-storage";
export const BASE_URL = import.meta.env.VITE_API_URL;

const BankDetails = () => {
  const { employeeId, setHasUnsavedChanges } = useContext(EmployeeContext) || {};
  const id = employeeId;
  const dispatch = useDispatch();
  const { showLoader, hideLoader } = useLoader();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialData, setInitialData] = useState(null);

  const { banks, bankBranches, budgetCode, overTimesTypes } = useSelector(
    (state) => state.getAllOptions
  );
  const { options: employeeDetails } = useSelector(
    (state) => state.getEmployeeDetails
  );
  const { options: bankAccounts } = useSelector(
    (state) => state.employeeProfiles
  );
  const { options: overtimeConfigs } = useSelector(
    (state) => state.employeeProfiles
  );

  const [bankAccountsState, setBankAccountsState] = useState([]);
  const [overtimeDetails, setOvertimeDetails] = useState([
    {
      type: "",
      hourlyRate: "",
      appliedRate: "",
    },
  ]);
  const [overtimeOptions, setOvertimeOptions] = useState([]);
  const [disbursementType, setDisbursementType] = useState("PERCENTAGE");
  const [selectedBudgetCode, setSelectedBudgetCode] = useState("");
  const [childCount, setChildCount] = useState(0);
  const [phoneNumber2, setPhoneNumber2] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [editFileName, setEditFileName] = useState(null);
  const [branchesPerBank, setBranchesPerBank] = useState({});
  const [bankAccountErrors, setBankAccountErrors] = useState({});
  const [overtimeErrors, setOvertimeErrors] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    dispatch(getAllOptions());
    if (id) {
      loadEmployeeData();
    }
  }, [id, dispatch]);

  useEffect(() => {
    const fetchOvertimeTypes = async () => {
      const options = await getOvertimeTypes();
      setOvertimeOptions(options);
    };
    fetchOvertimeTypes();
  }, []);

  const getOvertimeTypes = async () => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      const response = await fetch(`${BASE_URL}/api/v1/Common/GetHolidayTypes`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const text = await response.text();
      if (!text) {
        return [];
      }

      const data = JSON.parse(text);
      return (
        data?.map((item) => {
          return {
            value: item.holidayType.toString(),
            label: item.holidayTypeName,
          };
        }) || []
      );
    } catch (error) {
      console.error("Error fetching overtime types:", error);
      return [];
    }
  };

  const loadEmployeeData = async () => {
    if (!id) return;
    try {
      showLoader();
      
      // Fetch employee details for child count, budget code, and phoneNumber2
      const detailsResult = await dispatch(getEmployeeDetailsByID(parseInt(id)));
      if (detailsResult.payload && detailsResult.payload.data) {
        setChildCount(detailsResult.payload.data.childrenCount || 0);
        if (detailsResult.payload.data.idBudgetCode) {
          setSelectedBudgetCode(detailsResult.payload.data.idBudgetCode.toString());
        }
        setPhoneNumber2(detailsResult.payload.data.phoneNumber2 || "");
      }

      // Fetch bank accounts and overtime configs
      const [bankAccountsResult, overtimeConfigsResult] = await Promise.all([
        dispatch(getEmployeeBankAccountsByID(parseInt(id))),
        dispatch(getEmployeeOvertimeConfigsByID(parseInt(id))),
      ]);

      // Handle bank accounts
      let mappedBankAccounts = [];
      if (
        bankAccountsResult.payload &&
        bankAccountsResult.payload.data &&
        bankAccountsResult.payload.data.length > 0
      ) {
        mappedBankAccounts = bankAccountsResult.payload.data.map(
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

        mappedBankAccounts.length > 0
          ? setDisbursementType(mappedBankAccounts[0].disbursementType)
          : setDisbursementType("PERCENTAGE");

        const loadBranchesForBanks = async () => {
          const bankIds = [
            ...new Set(mappedBankAccounts.map((account) => account.selectedBank)),
          ];

          for (const bankId of bankIds) {
            if (bankId && !branchesPerBank[bankId]) {
              const branches = await getFilteredBranches(bankId);
              setBranchesPerBank((prev) => ({
                ...prev,
                [bankId]: branches,
              }));
            }
          }
        };

        loadBranchesForBanks();
        setBankAccountsState(mappedBankAccounts);
      } else {
        const defaultBankAccount = {
          idEmployeeBankAccount: null,
          selectedBank: banks.length > 0 ? banks[0].value : "",
          selectedBranch: bankBranches.length > 0 ? bankBranches[0].value : "",
          accountNumber: "",
          salaryPercentageDistributed: "",
          currencyCode: "GYD",
        };
        mappedBankAccounts = [defaultBankAccount];
        setBankAccountsState([defaultBankAccount]);
      }

      // Handle overtime configs
      let mappedOvertimeDetails = [];
      if (
        overtimeConfigsResult.payload &&
        overtimeConfigsResult.payload.data &&
        overtimeConfigsResult.payload.data.length > 0
      ) {
        mappedOvertimeDetails = overtimeConfigsResult.payload.data.map(
          (config) => {
            const matchingOption = overtimeOptions.find(
              (opt) => opt.value === config.dayType
            );
            return {
              type: matchingOption?.value || config.dayType,
              hourlyRate: config.standardRate?.toString() || "",
              appliedRate: config.dayRate?.toString() || "",
              idEmployeeOvertimeConfig: config.idEmployeeOvertimeConfig || 0,
            };
          }
        );
        setOvertimeDetails(mappedOvertimeDetails);
      } else {
        const defaultOvertimeDetail = {
          type: "",
          hourlyRate: "",
          appliedRate: "",
        };
        mappedOvertimeDetails = [defaultOvertimeDetail];
        setOvertimeDetails([defaultOvertimeDetail]);
      }

      // Store initial data for comparison
      const initial = {
        bankAccounts: JSON.parse(JSON.stringify(mappedBankAccounts)),
        overtimeDetails: JSON.parse(JSON.stringify(mappedOvertimeDetails)),
        disbursementType: mappedBankAccounts.length > 0 ? mappedBankAccounts[0].disbursementType : "PERCENTAGE",
        selectedBudgetCode: detailsResult.payload?.data?.idBudgetCode?.toString() || "",
        childCount: detailsResult.payload?.data?.childrenCount || 0,
        phoneNumber2: detailsResult.payload?.data?.phoneNumber2 || "",
      };
      setInitialData(initial);
      if (setHasUnsavedChanges) {
        setHasUnsavedChanges(false);
      }

      hideLoader();
    } catch (error) {
      hideLoader();
      console.error("Error loading employee data:", error);
    }
  };

  const getFilteredBranches = async (bankId) => {
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

  const handleBankChange = async (value, index) => {
    const filteredBranches = await getFilteredBranches(value);
    setBranchesPerBank((prevState) => ({
      ...prevState,
      [value]: filteredBranches,
    }));
    setBankAccountsState((prevState) => {
      const newState = [...prevState];
      newState[index].selectedBank = value;
      newState[index].selectedBranch = "";
      
      // Check for unsaved changes
      if (setHasUnsavedChanges && initialData) {
        const hasChanges = JSON.stringify(newState) !== JSON.stringify(initialData.bankAccounts) ||
          disbursementType !== initialData.disbursementType ||
          selectedBudgetCode !== initialData.selectedBudgetCode ||
          childCount !== initialData.childCount ||
          JSON.stringify(overtimeDetails) !== JSON.stringify(initialData.overtimeDetails);
        setHasUnsavedChanges(hasChanges);
      }
      
      return newState;
    });
  };

  const handleBranchChange = (value, index) => {
    setBankAccountsState((prevState) => {
      const newState = [...prevState];
      newState[index].selectedBranch = value;
      
      // Check for unsaved changes
      if (setHasUnsavedChanges && initialData) {
        const hasChanges = JSON.stringify(newState) !== JSON.stringify(initialData.bankAccounts) ||
          disbursementType !== initialData.disbursementType ||
          selectedBudgetCode !== initialData.selectedBudgetCode ||
          childCount !== initialData.childCount ||
          JSON.stringify(overtimeDetails) !== JSON.stringify(initialData.overtimeDetails);
        setHasUnsavedChanges(hasChanges);
      }
      
      return newState;
    });
  };

  const handleInputChange = (e, index, field) => {
    const { value } = e.target;
    if (field === "accountNumber") {
      if (!/^[a-zA-Z0-9]{0,25}$/.test(value)) {
        return;
      }
    }
    setBankAccountsState((prevState) => {
      const newState = [...prevState];
      newState[index][field] = value;
      
      // Check for unsaved changes
      if (setHasUnsavedChanges && initialData) {
        const hasChanges = JSON.stringify(newState) !== JSON.stringify(initialData.bankAccounts) ||
          disbursementType !== initialData.disbursementType ||
          selectedBudgetCode !== initialData.selectedBudgetCode ||
          childCount !== initialData.childCount ||
          JSON.stringify(overtimeDetails) !== JSON.stringify(initialData.overtimeDetails);
        setHasUnsavedChanges(hasChanges);
      }
      
      return newState;
    });
    if (field === "salaryPercentageDistributed") {
      const salaryPercentageValidation = validateSalaryPercentage();
      setBankAccountErrors((prevErrors) => ({
        ...prevErrors,
        salaryPercentageTotal: salaryPercentageValidation.error,
      }));
    }
  };

  const handleAddRow = () => {
    setBankAccountsState((prevState) => {
      const newState = [
        ...prevState,
        {
          idEmployeeBankAccount: null,
          selectedBank: "",
          selectedBranch: "",
          accountNumber: "",
          salaryPercentageDistributed: "",
          currencyCode: "GYD",
        },
      ];
      
      // Check for unsaved changes
      if (setHasUnsavedChanges && initialData) {
        setHasUnsavedChanges(true);
      }
      
      return newState;
    });
    setBankAccountErrors((prevErrors) => ({
      ...prevErrors,
      salaryPercentageTotal: "",
    }));
  };

  const handleDeleteRow = (index) => {
    setBankAccountsState((prevState) => {
      let newState;
      if (prevState.length === 1) {
        newState = [
          {
            idEmployeeBankAccount: null,
            selectedBank: banks.length > 0 ? banks[0].value : "",
            selectedBranch: bankBranches.length > 0 ? bankBranches[0].value : "",
            accountNumber: "",
            salaryPercentageDistributed: "",
            currencyCode: "GYD",
          },
        ];
      } else {
        newState = prevState.filter((_, i) => i !== index);
      }
      
      // Check for unsaved changes
      if (setHasUnsavedChanges && initialData) {
        const hasChanges = JSON.stringify(newState) !== JSON.stringify(initialData.bankAccounts) ||
          disbursementType !== initialData.disbursementType ||
          selectedBudgetCode !== initialData.selectedBudgetCode ||
          childCount !== initialData.childCount ||
          JSON.stringify(overtimeDetails) !== JSON.stringify(initialData.overtimeDetails);
        setHasUnsavedChanges(hasChanges);
      }
      
      return newState;
    });
    const salaryPercentageValidation = validateSalaryPercentage();
    setBankAccountErrors((prevErrors) => ({
      ...prevErrors,
      salaryPercentageTotal: salaryPercentageValidation.error,
    }));
  };

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
    const lastIndex = newOvertimeDetails.length - 1;
    const newDayType = newOvertimeDetails[lastIndex].type;
    if (isDuplicateDayType(newDayType, lastIndex)) {
      setOvertimeErrors((prevErrors) => ({
        ...prevErrors,
        [`overtimeType_${lastIndex}`]: "Duplicate DayType values are not allowed.",
      }));
      return;
    }
    setOvertimeDetails(newOvertimeDetails);
    
    // Check for unsaved changes
    if (setHasUnsavedChanges && initialData) {
      setHasUnsavedChanges(true);
    }
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
      if (value === "WORKINGDAY") {
        newOvertimeDetails[index].appliedRate = "1.5";
      } else if (value === "HOLIDAY" || value === "Holiday") {
        newOvertimeDetails[index].appliedRate = "1.5";
      } else {
        newOvertimeDetails[index].appliedRate = "2.0";
      }
    } else {
      newOvertimeDetails[index][field] = value;
    }
    setOvertimeDetails(newOvertimeDetails);
    
    // Check for unsaved changes
    if (setHasUnsavedChanges && initialData) {
      const hasChanges = JSON.stringify(newOvertimeDetails) !== JSON.stringify(initialData.overtimeDetails) ||
        JSON.stringify(bankAccountsState) !== JSON.stringify(initialData.bankAccounts) ||
        disbursementType !== initialData.disbursementType ||
        selectedBudgetCode !== initialData.selectedBudgetCode ||
        childCount !== initialData.childCount;
      setHasUnsavedChanges(hasChanges);
    }
  };

  const handleDeleteOvertimeRow = (index) => {
    setOvertimeDetails((prevState) => {
      let newState;
      if (prevState.length === 1) {
        newState = [
          {
            idEmployeeOvertimeConfig: null,
            type: "",
            hourlyRate: "",
            appliedRate: "",
          },
        ];
      } else {
        newState = prevState.filter((_, i) => i !== index);
      }
      
      // Check for unsaved changes
      if (setHasUnsavedChanges && initialData) {
        const hasChanges = JSON.stringify(newState) !== JSON.stringify(initialData.overtimeDetails) ||
          JSON.stringify(bankAccountsState) !== JSON.stringify(initialData.bankAccounts) ||
          disbursementType !== initialData.disbursementType ||
          selectedBudgetCode !== initialData.selectedBudgetCode ||
          childCount !== initialData.childCount;
        setHasUnsavedChanges(hasChanges);
      }
      
      return newState;
    });
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

  const handleSubmit = async () => {
    if (isSubmitting || !id) return;

    const bankAccountCombinationValidation = validateBankAccountCombinations();
    if (!bankAccountCombinationValidation.isValid) {
      setBankAccountErrors((prevErrors) => ({
        ...prevErrors,
        bankAccountCombination: bankAccountCombinationValidation.error,
      }));
      return;
    }

    const bankAccountsValid = validateBankAccounts();
    const salaryPercentageValidation = validateSalaryPercentage();
    if (!salaryPercentageValidation.isValid) {
      setBankAccountErrors((prevErrors) => ({
        ...prevErrors,
        salaryPercentageTotal: salaryPercentageValidation.error,
      }));
      return;
    }

    if (!bankAccountsValid) {
      return;
    }

    const bankAccountPayload = bankAccountsState.map((account) => ({
      idEmployeeBankAccount: account.idEmployeeBankAccount || 0,
      idEmployee: parseInt(id),
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
    formData.append("EmployeeId", parseInt(id));
    formData.append("BudgetCodeId", parseInt(selectedBudgetCode, 10) || 0);
    formData.append("ChildCount", parseInt(childCount, 10));
    formData.append("PhoneNumber2", phoneNumber2 || "");
    if (attachmentFile) {
      formData.append("File", attachmentFile);
    }

    const overtimeConfigsPayload = overtimeDetails
      .filter((detail) => detail.type)
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
          idEmployee: parseInt(id),
          dayType: dayType,
          standardRate: parseFloat(detail.hourlyRate),
          dayRate: parseFloat(detail.appliedRate),
        };
      });

    setIsSubmitting(true);
    if (disbursementType == "PERCENTAGE") {
      try {
        const actions = [
          dispatch(manageEmployeeBankAccount(bankAccountPayload)),
          dispatch(updateEmployeeDetails(formData)),
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
          toast.error(errors.join(", "));
        } else {
          toast.success("Bank details saved successfully");
          if (setHasUnsavedChanges) {
            setHasUnsavedChanges(false);
          }
          loadEmployeeData();
          // Scroll to top
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch (error) {
        toast.error("Failed to save bank details");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      let accountLength = bankAccountPayload.length;
      if (
        accountLength < 2 ||
        bankAccountPayload[accountLength - 1].salaryPercentageDistributed != 0
      ) {
        toast.warning(
          "Required atleast 2 bank accounts with last row with amount 0 for type fixed amount"
        );
        setIsSubmitting(false);
      } else {
        try {
          const actions = [
            dispatch(manageEmployeeBankAccount(bankAccountPayload)),
            dispatch(updateEmployeeDetails(formData)),
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
            toast.error(errors.join(", "));
          } else {
            toast.success("Bank details saved successfully");
            if (setHasUnsavedChanges) {
              setHasUnsavedChanges(false);
            }
            loadEmployeeData();
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } catch (error) {
          toast.error("Failed to save bank details");
        } finally {
          setIsSubmitting(false);
        }
      }
    }
  };

  const handleReset = () => {
    if (id) {
      // Reload employee data to restore original state
      loadEmployeeData();
    } else {
      // Reset to empty state if no employee ID
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
      setOvertimeDetails([
        {
          type: "",
          hourlyRate: "",
          appliedRate: "",
        },
      ]);
      setSelectedBudgetCode("");
      setChildCount(0);
      setPhoneNumber2("");
      setBankAccountErrors({});
      setOvertimeErrors({});
      setAttachmentFile(null);
      setEditFileName(null);
      setInitialData(null);
      if (setHasUnsavedChanges) {
        setHasUnsavedChanges(false);
      }
    }
  };

  return (
    <div className="row">
      <div className="col-12">
        <h6>
          Bank Account Details
        </h6>

        <div className="mb-3">
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              name="disbursementType"
              id="percentageType"
              value="PERCENTAGE"
              checked={disbursementType === "PERCENTAGE"}
              onChange={() => {
                setDisbursementType("PERCENTAGE");
                if (setHasUnsavedChanges && initialData) {
                  setHasUnsavedChanges(true);
                }
              }}
            />
            <label className="form-check-label" htmlFor="percentageType">
              Percentage
            </label>
          </div>
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              name="disbursementType"
              id="fixedAmountType"
              value="FIXEDAMOUNT"
              checked={disbursementType === "FIXEDAMOUNT"}
              onChange={() => {
                setDisbursementType("FIXEDAMOUNT");
                if (setHasUnsavedChanges && initialData) {
                  setHasUnsavedChanges(true);
                }
              }}
            />
            <label className="form-check-label" htmlFor="fixedAmountType">
              Fixed Amount
            </label>
          </div>
        </div>

        <table className="table table-sm mb-0 border custom-table-emp-bank">
          <thead>
            <tr>
              <th className="bank-name">Bank Name</th>
              <th className="routing-number">Routing Number</th>
              <th className="account-number" style={{ width: "30%" }}>
                Account Number
              </th>
              <th className="salary-percentage">
                {disbursementType === "PERCENTAGE" ? "% Salary" : "Amount(G$)"}
              </th>
              <th className="currency">Currency</th>
              <th style={{ width: "10%" }}></th>
            </tr>
          </thead>
          <tbody>
            {bankAccountsState.length > 0 ? (
              bankAccountsState.map((bank, index) => (
                <React.Fragment key={index}>
                  <tr className="custom-row">
                    <td className="bank-name">
                      <select
                        className="form-select"
                        name="bankName"
                        value={bank.selectedBank}
                        onChange={(e) => handleBankChange(e.target.value, index)}
                      >
                        <option value="">Select</option>
                        {bankOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="routing-number">
                      <select
                        className="form-select"
                        name="branchName"
                        value={bank.selectedBranch}
                        onChange={(e) => handleBranchChange(e.target.value, index)}
                      >
                        <option value="">Select</option>
                        {(bank.selectedBank
                          ? branchesPerBank[bank.selectedBank] || []
                          : []
                        ).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="account-number">
                      <input
                        type="text"
                        className="form-control"
                        name="accountNumber"
                        value={bank.accountNumber}
                        maxLength="25"
                        onChange={(e) =>
                          handleInputChange(e, index, "accountNumber")
                        }
                      />
                    </td>
                    <td className="salary-percentage">
                      <input
                        type="text"
                        name="salaryPercentage"
                        className="form-control"
                        value={bank.salaryPercentageDistributed}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (disbursementType === "PERCENTAGE") {
                            if (
                              /^[0-9]*\.?[0-9]*$/.test(value) &&
                              (value === "" || parseFloat(value) <= 100)
                            ) {
                              handleInputChange(
                                e,
                                index,
                                "salaryPercentageDistributed"
                              );
                            }
                          } else {
                            if (/^\d{0,12}$/.test(value)) {
                              handleInputChange(
                                e,
                                index,
                                "salaryPercentageDistributed"
                              );
                            }
                          }
                        }}
                      />
                    </td>
                    <td className="currency">
                      <select
                        className="form-select"
                        name="currencyCode"
                        value={bank.currencyCode}
                        onChange={(e) =>
                          handleInputChange(e, index, "currencyCode")
                        }
                      >
                        <option value="">Select</option>
                        <option value="GYD">GYD</option>
                        <option value="USD">USD</option>
                      </select>
                    </td>
                    <td>
                      <div className="action-icons">
                        {bankAccountsState.length > 1 && (
                          <DeleteIcon
                            className="delete-icon"
                            onClick={() => handleDeleteRow(index)}
                          />
                        )}
                        {index === bankAccountsState.length - 1 && (
                          <AddIcon
                            className="add-icon"
                            onClick={handleAddRow}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                  {Object.keys(bankAccountErrors).some((key) =>
                    key.endsWith(`_${index}`)
                  ) && (
                    <tr>
                      <td className="error-message" colSpan="6">
                        <div>
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
                <td className="text-center no-accounts" colSpan="6">
                  No bank accounts found. Click '+' to add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {bankAccountErrors.salaryPercentageTotal && (
          <div className="text-danger mb-3">
            {bankAccountErrors.salaryPercentageTotal}
          </div>
        )}
        {bankAccountErrors.bankAccountCombination && (
          <div className="text-danger mb-3">
            {bankAccountErrors.bankAccountCombination}
          </div>
        )}

        <div className="row mt-4">
          <div className="col-md-8">
            <h6>
              Add Overtime Details
            </h6>
            <table className="table table-sm mb-0 border">
              <thead>
                <tr>
                  <th style={{ padding: "2px 2px" }}>Days</th>
                  <th style={{ padding: "2px 2px" }} className="text-nowrap">
                    Hourly Rate
                  </th>
                  <th style={{ padding: "2px 2px" }} className="text-nowrap">
                    Applied Rate
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {overtimeDetails.map((detail, index) => (
                  <React.Fragment key={index}>
                    <tr>
                      <td className="col-md-3" style={{ padding: "2px 2px" }}>
                        <select
                          className="form-select"
                          name="overtimeDays"
                          value={detail.type}
                          onChange={(e) =>
                            handleOvertimeChange(index, "type", e.target.value)
                          }
                        >
                          <option value="">Select</option>
                          {overtimeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="col-md-3" style={{ padding: "2px 2px" }}>
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
                      <td className="col-md-3" style={{ padding: "2px 2px" }}>
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
                      <td className="col-md-1" style={{ padding: "2px 2px" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          {overtimeDetails.length > 1 && (
                            <DeleteIcon
                              className="delete-icon"
                              onClick={() => handleDeleteOvertimeRow(index)}
                            />
                          )}
                          {index === overtimeDetails.length - 1 && (
                            <AddIcon
                              className="add-icon"
                              onClick={handleAddOvertimeRow}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                    {Object.keys(overtimeErrors).some((key) =>
                      key.endsWith(`_${index}`)
                    ) && (
                      <tr>
                        <td colSpan="4">
                          <div style={{ color: "red" }}>
                            {overtimeErrors[`overtimeType_${index}`] && (
                              <div>
                                {overtimeErrors[`overtimeType_${index}`]}
                              </div>
                            )}
                            {overtimeErrors[`hourlyRate_${index}`] && (
                              <div>{overtimeErrors[`hourlyRate_${index}`]}</div>
                            )}
                            {overtimeErrors[`appliedRate_${index}`] && (
                              <div>
                                {overtimeErrors[`appliedRate_${index}`]}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="col-md-4">
            <h6>
              Add Budget Code
            </h6>
            <label className="form-label mb-1" htmlFor="budgetCodeSelect">
              Budget Code
            </label>
            <select
              id="budgetCodeSelect"
              className="form-select"
              name="budgetCode"
              value={selectedBudgetCode}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedBudgetCode(value);
                if (setHasUnsavedChanges && initialData) {
                  const hasChanges = value !== initialData.selectedBudgetCode ||
                    JSON.stringify(bankAccountsState) !== JSON.stringify(initialData.bankAccounts) ||
                    JSON.stringify(overtimeDetails) !== JSON.stringify(initialData.overtimeDetails) ||
                    disbursementType !== initialData.disbursementType ||
                    childCount !== initialData.childCount;
                  setHasUnsavedChanges(hasChanges);
                }
              }}
            >
              <option value="">Select Budget Code</option>
              {budgetCodeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="row d-flex align-items-end mt-3">
              <div className="col-md-4">
                <label className="form-label mb-1" htmlFor="childCount">
                  Child Count
                </label>
                <input
                  type="text"
                  id="childCount"
                  name="childCount"
                  className="form-control"
                  value={childCount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value)) {
                      setChildCount(value);
                      if (setHasUnsavedChanges && initialData) {
                        const hasChanges = value !== initialData.childCount.toString() ||
                          JSON.stringify(bankAccountsState) !== JSON.stringify(initialData.bankAccounts) ||
                          JSON.stringify(overtimeDetails) !== JSON.stringify(initialData.overtimeDetails) ||
                          disbursementType !== initialData.disbursementType ||
                          selectedBudgetCode !== initialData.selectedBudgetCode;
                        setHasUnsavedChanges(hasChanges);
                      }
                    }
                  }}
                />
              </div>
              <div className="col-md-8">
                <label className="form-label mb-1">Attachments</label>
                <input
                  type="file"
                  id="tempFileDetails"
                  className="form-control"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setAttachmentFile(file);
                      setEditFileName(file.name);
                      if (setHasUnsavedChanges) {
                        setHasUnsavedChanges(true);
                      }
                    }
                  }}
                />
                {editFileName && (
                  <span className="badge bg-label-info p-1 mt-2 d-inline-block">
                    {editFileName} &nbsp;&nbsp;
                    <label
                      className="cursor"
                      onClick={() => {
                        setAttachmentFile(null);
                        setEditFileName(null);
                        document.getElementById("tempFileDetails").value = "";
                      }}
                    >
                      X
                    </label>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-12 text-end">
            <button
              className="btn btn-outline-secondary me-2"
              onClick={handleReset}
            >
              Reset
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (id ? "Updating..." : "Saving...") : (id ? "Update" : "Save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankDetails;

