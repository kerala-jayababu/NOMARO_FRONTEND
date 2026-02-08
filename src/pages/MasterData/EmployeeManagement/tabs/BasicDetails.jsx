import React, { useState, useEffect, useContext } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import { toast } from "react-toastify";
import CommonService from "../../../../core/services/CommonService";
import { EmployeeContext } from "../EmployeeManagement";
import { useLoader } from "../../../../components/LoaderContext";
import { useDispatch } from "react-redux";
import { getEmployeeProfileByID } from "../../../../redux/reducers/getAllEmployeeProfiles";

const BasicDetails = () => {
  const { employeeId, setEmployeeId, setHasUnsavedChanges, setEmployeeName } = useContext(EmployeeContext) || {};
  const { showLoader, hideLoader } = useLoader();
  const dispatch = useDispatch();
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [initialFormData, setInitialFormData] = useState(null);
  const [employeeFormData, setEmployeeFormData] = useState({
    employeeCode: "",
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    idNumber: "",
    taxIdNumber: "",
    nationalIDNumber: "",
    idDepartment: "",
    idDesignation: "",
    emailID: "",
    phoneNumber1: "",
    phoneNumber2: "",
    address1: "",
    address2: "",
    address3: "",
    city: "",
    state: "",
    zipCode: "",
    dateOfBirth: null,
    joiningDate: null,
    reportingTo: "0",
    currentStatus: "Working",
    employeeWorkType: "",
    idBudgetCode: "",
    childrenCount: 0,
    overTimeAllowedStatus: false,
    employeePhoto: null,
    lastWorkingDay: null,
    nationality: "",
    citizenShip: "",
    maritalStatus: "",
    passportNumber: "",
    workPhone: "",
    workEmail: "",
    homeEmail: "",
    emergencyContactPersonName: "",
    emergencyContactNumbers: "",
    whatsAppNumber: "",
  });

  const [employeeFormErrors, setEmployeeFormErrors] = useState({});
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [reportingToOptions, setReportingToOptions] = useState([]);
  const [budgetCodeOptions, setBudgetCodeOptions] = useState([]);
  const [workTypeOptions, setWorkTypeOptions] = useState([]);
  const [countryOptions, setCountryOptions] = useState([]);
  const [nationalityOptions, setNationalityOptions] = useState([]);
  const [employeePhotoPreview, setEmployeePhotoPreview] = useState(null);
  const [employeePhotoFile, setEmployeePhotoFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sample hardcoded data
  const genderOptions = [
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
    { value: "OTHER", label: "Other" },
  ];

  const statusOptions = [
    { value: "Working", label: "Working" },
    { value: "NotWorking", label: "Not Working" },
  ];

  const maritalStatusOptions = [
    { value: "Single", label: "Single" },
    { value: "Married", label: "Married" },
    { value: "Widowed", label: "Widowed" },
    { value: "Separated", label: "Separated" },
    { value: "Divorced", label: "Divorced" },
    { value: "Other", label: "Other" },
  ];

  useEffect(() => {
    loadDepartmentsAndDesignations();
    loadReportingToOptions();
    loadBudgetCodes();
    loadEmployeeWorkTypes();
    loadCountries();
    loadNationalities();
  }, []);

  // Load employee data when employeeId is available (for editing)
  useEffect(() => {
    if (employeeId) {
      loadEmployeeData(employeeId);
    }
  }, [employeeId]);

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
      // Fallback to sample data
      setDepartments([
        { idDepartment: 1, departmentName: "IT" },
        { idDepartment: 2, departmentName: "HR" },
        { idDepartment: 3, departmentName: "Finance" },
      ]);
      setDesignations([
        { idDesignation: 1, designationName: "Software Engineer" },
        { idDesignation: 2, designationName: "Manager" },
        { idDesignation: 3, designationName: "Analyst" },
      ]);
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
      setReportingToOptions([
        { value: "1", label: "John Doe" },
        { value: "2", label: "Jane Smith" },
      ]);
    }
  };

  const loadBudgetCodes = async () => {
    try {
      const res = await CommonService.getBudgetCodesList();
      if (res.data?.data) {
        const options = res.data.data.map((code) => ({
          value: code.idBudgetCode.toString(),
          label: code.budgetCode,
        }));
        setBudgetCodeOptions(options);
      }
    } catch (error) {
      console.error("Error loading budget codes:", error);
      // Fallback to sample data
      setBudgetCodeOptions([
        { value: "1", label: "BC001 - IT Budget" },
        { value: "2", label: "BC002 - HR Budget" },
        { value: "3", label: "BC003 - Finance Budget" },
      ]);
    }
  };

  const loadEmployeeWorkTypes = async () => {
    try {
      const res = await CommonService.getEmployeeWorkTypes();
      if (res.error) {
        throw new Error(res.error);
      }
      
      // Handle different response structures
      let workTypesData = [];
      if (res.data?.data) {
        workTypesData = Array.isArray(res.data.data) ? res.data.data : [];
      } else if (Array.isArray(res.data)) {
        workTypesData = res.data;
      }
      
      if (workTypesData.length > 0) {
        const options = workTypesData.map((workType) => ({
          value: workType.employeeTypeName || workType.workType || workType.value || workType.employeeWorkType || workType.idEmployeeWorkType?.toString(),
          label: workType.employeeTypeName || workType.workTypeName || workType.label || workType.displayName || workType.name || workType.workType || workType.value,
        }));
        setWorkTypeOptions(options);
      } else {
        // If no data returned, use fallback
        setWorkTypeOptions([
          { value: "Permanent", label: "Permanent" },
          { value: "Contract", label: "Contract" },
          { value: "Temporary", label: "Temporary" },
          { value: "Part-time", label: "Part-time" },
        ]);
      }
    } catch (error) {
      console.error("Error loading employee work types:", error);
      // Fallback to default values
      setWorkTypeOptions([
        { value: "Permanent", label: "Permanent" },
        { value: "Contract", label: "Contract" },
        { value: "Temporary", label: "Temporary" },
        { value: "Part-time", label: "Part-time" },
      ]);
    }
  };

  const loadCountries = async () => {
    try {
      const res = await CommonService.getCountries();
      if (res.error) {
        throw new Error(res.error);
      }
      
      // Handle different response structures
      let countriesData = [];
      if (res.data?.data) {
        countriesData = Array.isArray(res.data.data) ? res.data.data : [];
      } else if (Array.isArray(res.data)) {
        countriesData = res.data;
      }
      
      if (countriesData.length > 0) {
        // Map countries - use country name as both value and label to pass name to backend
        const options = countriesData.map((country) => ({
          value: country.countryName || country.name || country.country || country.value || "",
          label: country.countryName || country.name || country.country || country.label || country.value || "",
        }));
        setCountryOptions(options);
      } else {
        console.warn("No countries data returned from API");
        setCountryOptions([]);
      }
    } catch (error) {
      console.error("Error loading countries:", error);
      setCountryOptions([]);
    }
  };

  const loadNationalities = async () => {
    try {
      const res = await CommonService.getNationalities();
      if (res.error) {
        throw new Error(res.error);
      }
      
      // Handle different response structures
      let nationalitiesData = [];
      if (res.data?.data) {
        nationalitiesData = Array.isArray(res.data.data) ? res.data.data : [];
      } else if (Array.isArray(res.data)) {
        nationalitiesData = res.data;
      }
      
      if (nationalitiesData.length > 0) {
        // Map nationalities - use nationality name as both value and label to pass name to backend
        const options = nationalitiesData.map((nationality) => ({
          value: nationality.nationalityName || nationality.name || nationality.nationality || nationality.value || "",
          label: nationality.nationalityName || nationality.name || nationality.nationality || nationality.label || nationality.value || "",
        }));
        setNationalityOptions(options);
      } else {
        console.warn("No nationalities data returned from API");
        setNationalityOptions([]);
      }
    } catch (error) {
      console.error("Error loading nationalities:", error);
      setNationalityOptions([]);
    }
  };

  const loadEmployeeData = async (id) => {
    if (!id) return;

    try {
      showLoader();
      // Fetch both employee details and profile to get photo
      const [employeeResponse, profileResult] = await Promise.all([
        CommonService.getEmployeeById(id),
        dispatch(getEmployeeProfileByID(id)).catch(() => ({ payload: null }))
      ]);
      hideLoader();

      if (employeeResponse.error) {
        console.error("Error fetching employee details:", employeeResponse.error);
        toast.error("Failed to fetch employee details");
        return;
      }

      const detailedData = employeeResponse.data?.data;
      if (!detailedData) {
        toast.warning("Employee data not found");
        return;
      }

      // Get profile data for photo
      const profileData = profileResult?.payload?.data?.[0] || profileResult?.payload?.data || null;

      const formatDateForForm = (value) => {
        if (!value) return null;
        if (moment(value).isValid()) {
          return moment(value).toDate();
        }
        return null;
      };

      // Try multiple sources for the photo - check all possible fields
      const employeePhotoValue =
        detailedData.employeePhoto ??
        detailedData.attachmentBlob ??
        profileData?.attachmentBlob ??
        profileData?.employeePhoto ??
        null;

      setEmployeeFormData({
        employeeCode: detailedData.employeeCode ?? "",
        firstName: detailedData.firstName ?? "",
        middleName: detailedData.middleName ?? "",
        lastName: detailedData.lastName ?? "",
        gender: detailedData.gender ?? "",
        idNumber: detailedData.idNumber ?? "",
        taxIdNumber: detailedData.taxIdNumber ?? "",
        nationalIDNumber: detailedData.nationalIDNumber ?? detailedData.nationalIdNumber ?? "",
        idDepartment: detailedData.idDepartment
          ? detailedData.idDepartment.toString()
          : "",
        idDesignation: detailedData.idDesignation
          ? detailedData.idDesignation.toString()
          : "",
        emailID: detailedData.emailID ?? "",
        phoneNumber1: detailedData.phoneNumber1 ?? "",
        phoneNumber2: detailedData.phoneNumber2 ?? "",
        address1: detailedData.address1 ?? "",
        address2: detailedData.address2 ?? "",
        address3: detailedData.address3 ?? "",
        city: detailedData.city ?? "",
        state: detailedData.state ?? "",
        zipCode: detailedData.zipCode ?? "",
        dateOfBirth: formatDateForForm(detailedData.dateOfBirth),
        joiningDate: formatDateForForm(detailedData.joiningDate),
        reportingTo: detailedData.reportingTo
          ? detailedData.reportingTo.toString()
          : "0",
        currentStatus: detailedData.currentStatus ?? "Working",
        employeeWorkType: detailedData.employeeWorkType ?? "",
        idBudgetCode: detailedData.idBudgetCode
          ? detailedData.idBudgetCode.toString()
          : "",
        childrenCount: detailedData.childrenCount ?? 0,
        overTimeAllowedStatus:
          typeof detailedData.overTimeAllowedStatus !== "undefined"
            ? detailedData.overTimeAllowedStatus === true ||
            detailedData.overTimeAllowedStatus === "true"
            : false,
        employeePhoto: employeePhotoValue,
        lastWorkingDay: formatDateForForm(detailedData.lastWorkingDay),
        nationality: detailedData.nationality ?? "",
        citizenShip: detailedData.citizenShip ?? "",
        maritalStatus: detailedData.maritalStatus ?? "",
        passportNumber: detailedData.passportNumber ?? "",
        workPhone: "",
        workEmail: "",
        homeEmail: detailedData.homeEmail ?? "",
        emergencyContactPersonName: detailedData.emergencyContactPersonName ?? "",
        emergencyContactNumbers: detailedData.emergencyContactNumbers ?? "",
        whatsAppNumber: detailedData.whatsAppNumber ?? "",
      });

      // Set photo preview - handle different formats
      if (employeePhotoValue) {
        // Check if it's a non-empty string
        if (typeof employeePhotoValue === 'string') {
          const trimmedValue = employeePhotoValue.trim();
          if (trimmedValue.length > 0) {
            // Check if it already has a data URL prefix
            if (trimmedValue.startsWith('data:')) {
              setEmployeePhotoPreview(trimmedValue);
            } else {
              // Assume it's a base64 string and add the prefix
              setEmployeePhotoPreview(`data:image/jpeg;base64,${trimmedValue}`);
            }
          } else {
            setEmployeePhotoPreview(null);
          }
        } else {
          setEmployeePhotoPreview(null);
        }
      } else {
        setEmployeePhotoPreview(null);
      }
      setEditingEmployeeId(id);
      if (setEmployeeId) {
        setEmployeeId(id);
      }

      // Update employee name in parent component
      if (setEmployeeName) {
        const fullName = [
          detailedData.firstName || "",
          detailedData.middleName || "",
          detailedData.lastName || ""
        ].filter(Boolean).join(" ").trim();
        setEmployeeName(fullName || "");
      }

      // Store initial form data for comparison
      const initialData = {
        employeeCode: detailedData.employeeCode ?? "",
        firstName: detailedData.firstName ?? "",
        middleName: detailedData.middleName ?? "",
        lastName: detailedData.lastName ?? "",
        gender: detailedData.gender ?? "",
        idNumber: detailedData.idNumber ?? "",
        taxIdNumber: detailedData.taxIdNumber ?? "",
        nationalIDNumber: detailedData.nationalIDNumber ?? detailedData.nationalIdNumber ?? "",
        idDepartment: detailedData.idDepartment ? detailedData.idDepartment.toString() : "",
        idDesignation: detailedData.idDesignation ? detailedData.idDesignation.toString() : "",
        emailID: detailedData.emailId ?? "",
        phoneNumber1: detailedData.phoneNumber1 ?? "",
        phoneNumber2: detailedData.phoneNumber2 ?? "",
        address1: detailedData.address1 ?? "",
        address2: detailedData.address2 ?? "",
        address3: detailedData.address3 ?? "",
        city: detailedData.city ?? "",
        state: detailedData.state ?? "",
        zipCode: detailedData.zipCode ?? "",
        dateOfBirth: detailedData.dateOfBirth ? moment(detailedData.dateOfBirth).format("YYYY-MM-DD") : null,
        joiningDate: detailedData.joiningDate ? moment(detailedData.joiningDate).format("YYYY-MM-DD") : null,
        reportingTo: detailedData.reportingTo ? detailedData.reportingTo.toString() : "0",
        currentStatus: detailedData.currentStatus ?? "Working",
        employeeWorkType: detailedData.employeeWorkType ?? "",
        idBudgetCode: detailedData.idBudgetCode ? detailedData.idBudgetCode.toString() : "",
        childrenCount: detailedData.childrenCount ?? 0,
        overTimeAllowedStatus: typeof detailedData.overTimeAllowedStatus !== "undefined" ? (detailedData.overTimeAllowedStatus === true || detailedData.overTimeAllowedStatus === "true") : false,
        lastWorkingDay: detailedData.lastWorkingDay ? moment(detailedData.lastWorkingDay).format("YYYY-MM-DD") : null,
        nationality: detailedData.nationality ?? "",
        citizenShip: detailedData.citizenShip ?? "",
        maritalStatus: detailedData.maritalStatus ?? "",
        passportNumber: detailedData.passportNumber ?? "",
        workPhone: "",
        workEmail: "",
        homeEmail: detailedData.homeEmail ?? "",
        emergencyContactPersonName: detailedData.emergencyContactPersonName ?? "",
        emergencyContactNumbers: detailedData.emergencyContactNumbers ?? "",
        whatsAppNumber: detailedData.whatsAppNumber ?? "",
      };
      setInitialFormData(initialData);
      if (setHasUnsavedChanges) {
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      hideLoader();
      console.error("Error loading employee data:", error);
      toast.error("Failed to load employee data");
    }
  };

  const phoneFields = ["phoneNumber1", "phoneNumber2", "whatsAppNumber", "emergencyContactNumbers"];

  const handleEmployeeInputChange = (field, value) => {
    let sanitizedValue = value;

    if (typeof sanitizedValue === "string") {
      sanitizedValue = sanitizedValue.trimStart();
    }

    if (phoneFields.includes(field)) {
      sanitizedValue = sanitizedValue.replace(/[^\d-]/g, "").slice(0, 20);
    }

    // ZIP Code limited to 6 digits
    if (field === "zipCode") {
      sanitizedValue = sanitizedValue.replace(/\D/g, "").slice(0, 6);
    }

    setEmployeeFormData((prev) => {
      const newData = {
        ...prev,
        [field]: sanitizedValue,
      };

      // Update employee name if name fields change
      if (setEmployeeName && (field === "firstName" || field === "middleName" || field === "lastName")) {
        const fullName = [
          field === "firstName" ? sanitizedValue : newData.firstName,
          field === "middleName" ? sanitizedValue : newData.middleName,
          field === "lastName" ? sanitizedValue : newData.lastName
        ].filter(Boolean).join(" ").trim();
        setEmployeeName(fullName || "");
      }

      // Check for unsaved changes
      if (setHasUnsavedChanges && initialFormData) {
        const currentDataForComparison = {
          ...newData,
          dateOfBirth: newData.dateOfBirth ? moment(newData.dateOfBirth).format("YYYY-MM-DD") : null,
          joiningDate: newData.joiningDate ? moment(newData.joiningDate).format("YYYY-MM-DD") : null,
          lastWorkingDay: newData.lastWorkingDay ? moment(newData.lastWorkingDay).format("YYYY-MM-DD") : null,
          employeePhoto: newData.employeePhoto ? (typeof newData.employeePhoto === 'string' ? newData.employeePhoto : 'changed') : null
        };
        const initialDataForComparison = {
          ...initialFormData,
          employeePhoto: initialFormData.employeePhoto ? (typeof initialFormData.employeePhoto === 'string' ? initialFormData.employeePhoto : 'original') : null
        };
        const hasChanges = JSON.stringify(currentDataForComparison) !== JSON.stringify(initialDataForComparison);
        setHasUnsavedChanges(hasChanges);
      }

      return newData;
    });

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
    if (!file) return;

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
      if (setHasUnsavedChanges) {
        setHasUnsavedChanges(true);
      }
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

    if (employeeFormData.emailID && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employeeFormData.emailID)) {
      errors.emailID = "Invalid email format";
    }

    if (employeeFormData.emailID && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employeeFormData.emailID)) {
      errors.emailID = "Invalid email format";
    }

    if (employeeFormData.homeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employeeFormData.homeEmail)) {
      errors.homeEmail = "Invalid email format";
    }

    // Date of birth validation: 1950 to 2010 (age 16-75)
    if (employeeFormData.dateOfBirth) {
      const birthYear = moment(employeeFormData.dateOfBirth).year();
      if (birthYear < 1950 || birthYear > 2010) {
        errors.dateOfBirth = "Date of birth must be between 1950 and 2010";
      }
    }

    // Date of Joining: max 2-3 months in future
    if (employeeFormData.joiningDate) {
      const today = moment();
      const maxFutureDate = moment().add(3, 'months');
      if (moment(employeeFormData.joiningDate).isAfter(maxFutureDate)) {
        errors.joiningDate = "Date of Joining cannot be more than 3 months in the future";
      }

      // Date of Joining should not be earlier than Date of birth
      if (employeeFormData.dateOfBirth && moment(employeeFormData.joiningDate).isBefore(moment(employeeFormData.dateOfBirth))) {
        errors.joiningDate = "Date of Joining cannot be earlier than Date of Birth";
      }
    }

    setEmployeeFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmployeeForm()) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }

    setIsSubmitting(true);
    showLoader();
    try {
      const {
        employeePhoto,
        phoneNumber1: formPhoneNumber1,
        phoneNumber2: formPhoneNumber2,
        emailID: formEmailID,
        ...restFormData
      } = employeeFormData;

      const payloadWithoutPhoto = {
        ...restFormData,
        // Map form fields to backend fields: workPhone gets phoneNumber1, phoneNumber1 gets phoneNumber2, workEmail gets emailID
        phoneNumber1: formPhoneNumber1 || "",
        phoneNumber2: formPhoneNumber2 || "",
        workEmail: formEmailID || "",
        emailID: formEmailID || "",
        idDepartment: employeeFormData.idDepartment ? parseInt(employeeFormData.idDepartment) : null,
        idDesignation: employeeFormData.idDesignation ? parseInt(employeeFormData.idDesignation) : null,
        reportingTo: employeeFormData.reportingTo ? parseInt(employeeFormData.reportingTo) : 0,
        idBudgetCode: employeeFormData.idBudgetCode ? parseInt(employeeFormData.idBudgetCode) : null,
        childrenCount: parseInt(employeeFormData.childrenCount) || 0,
        dateOfBirth: employeeFormData.dateOfBirth ? moment(employeeFormData.dateOfBirth).format("YYYY-MM-DD") : null,
        joiningDate: employeeFormData.joiningDate ? moment(employeeFormData.joiningDate).format("YYYY-MM-DD") : null,
        lastWorkingDay: employeeFormData.lastWorkingDay ? moment(employeeFormData.lastWorkingDay).format("YYYY-MM-DD") : null,
      };

      if (editingEmployeeId) {
        payloadWithoutPhoto.idEmployee = parseInt(editingEmployeeId);
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
        const errorMessage = result.error.message || "Failed to save employee";
        // Check if it's a duplicate employee code error
        if (errorMessage.toLowerCase().includes("employee code") ||
          errorMessage.toLowerCase().includes("duplicate") ||
          errorMessage.toLowerCase().includes("already exists")) {
          toast.error("Employee Code Already Exists");
        } else {
          toast.error(errorMessage);
        }
        return;
      }

      if (result.data?.success) {
        const message = editingEmployeeId ? "Employee updated successfully" : "Employee added successfully";
        toast.success(message);

        // Reset unsaved changes flag
        if (setHasUnsavedChanges) {
          setHasUnsavedChanges(false);
        }

        // If it's a new employee, update the employeeId in context
        if (!editingEmployeeId && result.data?.data?.idEmployee) {
          const newEmployeeId = result.data.data.idEmployee.toString();
          setEditingEmployeeId(newEmployeeId);
          if (setEmployeeId) {
            setEmployeeId(newEmployeeId);
          }
          // Reload the employee data to get all fields
          await loadEmployeeData(newEmployeeId);
        } else {
          // Update employee name after successful save
          if (setEmployeeName) {
            const fullName = [
              employeeFormData.firstName || "",
              employeeFormData.middleName || "",
              employeeFormData.lastName || ""
            ].filter(Boolean).join(" ").trim();
            setEmployeeName(fullName || "");
          }

          // Update initial form data after successful save
          const currentData = {
            employeeCode: employeeFormData.employeeCode,
            firstName: employeeFormData.firstName,
            middleName: employeeFormData.middleName,
            lastName: employeeFormData.lastName,
            gender: employeeFormData.gender,
            idNumber: employeeFormData.idNumber,
            taxIdNumber: employeeFormData.taxIdNumber,
            nationalIDNumber: employeeFormData.nationalIDNumber,
            idDepartment: employeeFormData.idDepartment,
            idDesignation: employeeFormData.idDesignation,
            emailID: employeeFormData.emailID,
            phoneNumber1: employeeFormData.phoneNumber1,
            phoneNumber2: employeeFormData.phoneNumber2,
            address1: employeeFormData.address1,
            address2: employeeFormData.address2,
            address3: employeeFormData.address3,
            city: employeeFormData.city,
            state: employeeFormData.state,
            zipCode: employeeFormData.zipCode,
            dateOfBirth: employeeFormData.dateOfBirth ? moment(employeeFormData.dateOfBirth).format("YYYY-MM-DD") : null,
            joiningDate: employeeFormData.joiningDate ? moment(employeeFormData.joiningDate).format("YYYY-MM-DD") : null,
            reportingTo: employeeFormData.reportingTo,
            currentStatus: employeeFormData.currentStatus,
            employeeWorkType: employeeFormData.employeeWorkType,
            idBudgetCode: employeeFormData.idBudgetCode,
            childrenCount: employeeFormData.childrenCount,
            overTimeAllowedStatus: employeeFormData.overTimeAllowedStatus,
            lastWorkingDay: employeeFormData.lastWorkingDay ? moment(employeeFormData.lastWorkingDay).format("YYYY-MM-DD") : null,
            nationality: employeeFormData.nationality,
            citizenShip: employeeFormData.citizenShip,
            maritalStatus: employeeFormData.maritalStatus,
            passportNumber: employeeFormData.passportNumber,
            workPhone: "",
            workEmail: "",
            homeEmail: employeeFormData.homeEmail,
            emergencyContactPersonName: employeeFormData.emergencyContactPersonName,
            emergencyContactNumbers: employeeFormData.emergencyContactNumbers,
            whatsAppNumber: employeeFormData.whatsAppNumber,
          };
          setInitialFormData(currentData);
        }

        // Scroll to top after all operations complete
        setTimeout(() => {
          // Find the scrollable tab-content container
          const tabContent = document.querySelector('.tab-content');
          if (tabContent) {
            tabContent.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            // Fallback to window scroll
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 200);
      } else {
        hideLoader();
        console.error("API returned success=false:", result.data);
        const errorMessage = result.data?.message || "Failed to save employee";
        // Check if it's a duplicate employee code error
        if (errorMessage.toLowerCase().includes("employee code") ||
          errorMessage.toLowerCase().includes("duplicate") ||
          errorMessage.toLowerCase().includes("already exists")) {
          toast.error("Employee Code Already Exists");
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      hideLoader();
      console.error("Error saving employee:", error);
      toast.error("An error occurred while saving employee");
    } finally {
      setIsSubmitting(false);
      hideLoader();
    }
  };

  const handleReset = () => {
    setEmployeeFormData({
      employeeCode: "",
      firstName: "",
      middleName: "",
      lastName: "",
      gender: "",
      idNumber: "",
      taxIdNumber: "",
      nationalIDNumber: "",
      idDepartment: "",
      idDesignation: "",
      emailID: "",
      phoneNumber1: "",
      phoneNumber2: "",
      address1: "",
      address2: "",
      address3: "",
      city: "",
      state: "",
      zipCode: "",
      dateOfBirth: null,
      joiningDate: null,
      reportingTo: "0",
      currentStatus: "Working",
      employeeWorkType: "",
      idBudgetCode: "",
      childrenCount: 0,
      overTimeAllowedStatus: false,
      employeePhoto: null,
      lastWorkingDay: null,
      nationality: "",
      citizenShip: "",
      maritalStatus: "",
      passportNumber: "",
      workPhone: "",
      workEmail: "",
      homeEmail: "",
      emergencyContactPersonName: "",
      emergencyContactNumbers: "",
      whatsAppNumber: "",
    });
    setEmployeeFormErrors({});
    setEmployeePhotoPreview(null);
    setEmployeePhotoFile(null);
    setInitialFormData(null);
    if (setHasUnsavedChanges) {
      setHasUnsavedChanges(false);
    }
    if (setEmployeeName) {
      setEmployeeName("");
    }
  };

  return (
    <div className="row">
      {/* <h6 className="mb-3">Basic Info</h6> */}
      <div className="col-12">
        <form onSubmit={handleSubmit}>
          {/* Employment Details Section */}
          <div className="mb-4">
            <div className="bg-secondary p-2 mb-3">
              <h6 className="mb-0 text-white">Employment Details</h6>
            </div>
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
                  <div className="invalid-feedback d-block">{employeeFormErrors.employeeCode}</div>
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
                  {departments.map((dept) => (
                    <option key={dept.idDepartment} value={dept.idDepartment}>
                      {dept.departmentName}
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
                  {designations.map((desig) => (
                    <option key={desig.idDesignation} value={desig.idDesignation}>
                      {desig.designationName}
                    </option>
                  ))}
                </select>
                {employeeFormErrors.idDesignation && (
                  <div className="text-danger">{employeeFormErrors.idDesignation}</div>
                )}
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-md-4">
                <label className="form-label mb-1" htmlFor="firstName">
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
                  <div className="invalid-feedback d-block">{employeeFormErrors.firstName}</div>
                )}
              </div>
              <div className="col-md-4">
                <label className="form-label mb-1" htmlFor="middleName">
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
                <label className="form-label mb-1" htmlFor="lastName">
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
                  <div className="invalid-feedback d-block">{employeeFormErrors.lastName}</div>
                )}
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-md-4">
                <label className="form-label mb-1" htmlFor="employeeWorkType">
                  Work Type
                </label>
                <select
                  id="employeeWorkType"
                  className="form-select"
                  name="employeeWorkType"
                  value={employeeFormData.employeeWorkType}
                  onChange={(e) => handleEmployeeInputChange("employeeWorkType", e.target.value)}
                >
                  <option value="">Select Work Type</option>
                  {workTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label mb-1">Current Status</label>
                <div 
                  className="form-control"
                  style={{
                    backgroundColor: employeeFormData.currentStatus === "NotWorking" ? '#fffacd' : '#f8f9fa',
                    border: '1px solid #ced4da',
                    padding: '0.375rem 0.75rem',
                    minHeight: '38px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {employeeFormData.currentStatus === "Working" ? "Working" : 
                   employeeFormData.currentStatus === "NotWorking" ? "Not Working" : 
                   employeeFormData.currentStatus || "-"}
                </div>
              </div>
              {employeeFormData.currentStatus === "NotWorking" && (
                <div className="col-md-4">
                  <label className="form-label mb-1">Last Working Day</label>
                  <div 
                    className="form-control"
                    style={{
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #ced4da',
                      padding: '0.375rem 0.75rem',
                      minHeight: '38px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {employeeFormData.lastWorkingDay 
                      ? moment(employeeFormData.lastWorkingDay).format("DD.MM.YYYY")
                      : "-"}
                  </div>
                </div>
              )}
              {employeeFormData.currentStatus !== "NotWorking" && (
                <div className="col-md-4">
                  {/* Empty column when status is Working */}
                </div>
              )}
            </div>

            <div className="row mt-3">
              <div className="col-md-4">
                <label className="form-label mb-1">Joining Date *</label>
                <DatePicker
                  selected={employeeFormData.joiningDate}
                  onChange={(date) => handleEmployeeInputChange("joiningDate", date)}
                  dateFormat="MM/dd/yyyy"
                  className={`form-control${employeeFormErrors.joiningDate ? " is-invalid" : ""}`}
                  minDate={employeeFormData.dateOfBirth ? moment(employeeFormData.dateOfBirth).toDate() : undefined}
                  maxDate={moment().add(3, 'months').toDate()}
                  showYearDropdown
                  showMonthDropdown
                  dropdownMode="select"
                  wrapperClassName="d-block"
                />
                {employeeFormErrors.joiningDate && (
                  <div className="invalid-feedback d-block">{employeeFormErrors.joiningDate}</div>
                )}
              </div>
              <div className="col-md-4">
                <label className="form-label mb-1" htmlFor="reportingTo">
                  Reporting To
                </label>
                <select
                  id="reportingTo"
                  className="form-select"
                  name="reportingTo"
                  value={employeeFormData.reportingTo}
                  onChange={(e) => handleEmployeeInputChange("reportingTo", e.target.value)}
                >
                  <option value="0">Select Reporting Manager</option>
                  {reportingToOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                {/* Empty column for Reporting To alignment */}
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-md-4">
                <label className="form-label mb-1" htmlFor="nationalIDNumber">
                  National ID Number
                </label>
                <input
                  id="nationalIDNumber"
                  name="nationalIDNumber"
                  type="text"
                  className="form-control"
                  value={employeeFormData.nationalIDNumber}
                  onChange={(e) => handleEmployeeInputChange("nationalIDNumber", e.target.value)}
                  placeholder="Enter National ID Number"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label mb-1" htmlFor="idNumber">
                  NIS Number
                </label>
                <input
                  id="idNumber"
                  name="idNumber"
                  type="text"
                  className="form-control"
                  value={employeeFormData.idNumber}
                  onChange={(e) => handleEmployeeInputChange("idNumber", e.target.value)}
                  placeholder="Enter ID Number"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label mb-1" htmlFor="taxIdNumber">
                  Tax ID Number
                </label>
                <input
                  id="taxIdNumber"
                  name="taxIdNumber"
                  type="text"
                  className="form-control"
                  value={employeeFormData.taxIdNumber}
                  onChange={(e) => handleEmployeeInputChange("taxIdNumber", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Personal Details Section */}
          <div className="mb-4">
            <div className="bg-secondary p-2 mb-3">
              <h6 className="mb-0 text-white">Personal Details</h6>
            </div>
            <div className="row">
              <div className="col-md-4">
                <label className="form-label mb-1">Gender *</label>
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
                <label className="form-label mb-1">Date of Birth</label>
                <DatePicker
                  selected={employeeFormData.dateOfBirth}
                  onChange={(date) => handleEmployeeInputChange("dateOfBirth", date)}
                  dateFormat="MM/dd/yyyy"
                  className={`form-control${employeeFormErrors.dateOfBirth ? " is-invalid" : ""}`}
                  minDate={new Date(1950, 0, 1)}
                  maxDate={new Date(2010, 11, 31)}
                  showYearDropdown
                  showMonthDropdown
                  dropdownMode="select"
                  wrapperClassName="d-block"
                  yearDropdownItemNumber={100}
                />
                {employeeFormErrors.dateOfBirth && (
                  <div className="invalid-feedback d-block">{employeeFormErrors.dateOfBirth}</div>
                )}
              </div>
              <div className="col-md-4">
                <label className="form-label mb-1" htmlFor="maritalStatus">
                  Marital Status
                </label>
                <select
                  id="maritalStatus"
                  className="form-select"
                  name="maritalStatus"
                  value={employeeFormData.maritalStatus}
                  onChange={(e) => handleEmployeeInputChange("maritalStatus", e.target.value)}
                >
                  <option value="">Select Marital Status</option>
                  {maritalStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-md-4">
                <label className="form-label mb-1" htmlFor="nationality">
                  Nationality
                </label>
                <select
                  id="nationality"
                  name="nationality"
                  className="form-select"
                  value={employeeFormData.nationality}
                  onChange={(e) => handleEmployeeInputChange("nationality", e.target.value)}
                >
                  <option value="">Select Nationality</option>
                  {nationalityOptions.map((nationality) => (
                    <option key={nationality.value} value={nationality.value}>
                      {nationality.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label mb-1" htmlFor="citizenShip">
                  Citizenship
                </label>
                <select
                  id="citizenShip"
                  name="citizenShip"
                  className="form-select"
                  value={employeeFormData.citizenShip}
                  onChange={(e) => handleEmployeeInputChange("citizenShip", e.target.value)}
                >
                  <option value="">Select Citizenship</option>
                  {countryOptions.map((country) => (
                    <option key={country.value} value={country.value}>
                      {country.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label mb-1" htmlFor="passportNumber">
                  Passport Number
                </label>
                <input
                  id="passportNumber"
                  name="passportNumber"
                  type="text"
                  className="form-control"
                  value={employeeFormData.passportNumber}
                  onChange={(e) => handleEmployeeInputChange("passportNumber", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Contact Details Section */}
          <div className="mb-4">
            <div className="bg-secondary p-2 mb-3">
              <h6 className="mb-0 text-white">Contact Details</h6>
            </div>
            <div className="row">
              <div className="col-md-4">
                <label className="form-label mb-1" htmlFor="phoneNumber1">
                  Work Phone with Extn
                </label>
                <input
                  id="phoneNumber1"
                  name="phoneNumber1"
                  type="text"
                  className="form-control"
                  value={employeeFormData.phoneNumber1}
                  onChange={(e) => handleEmployeeInputChange("phoneNumber1", e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label mb-1" htmlFor="phoneNumber2">
                  Mobile Phone
                </label>
                <input
                  id="phoneNumber2"
                  name="phoneNumber2"
                  type="text"
                  className="form-control"
                  value={employeeFormData.phoneNumber2}
                  onChange={(e) => handleEmployeeInputChange("phoneNumber2", e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label mb-1" htmlFor="whatsAppNumber">
                  WhatsApp Phone
                </label>
                <input
                  id="whatsAppNumber"
                  name="whatsAppNumber"
                  type="text"
                  className="form-control"
                  value={employeeFormData.whatsAppNumber}
                  onChange={(e) => handleEmployeeInputChange("whatsAppNumber", e.target.value)}
                />
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-md-4">
                <label className="form-label mb-1" htmlFor="emailID">
                  Work Email
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
                  <div className="invalid-feedback d-block">{employeeFormErrors.emailID}</div>
                )}
              </div>
              <div className="col-md-4">
                <label className="form-label mb-1" htmlFor="homeEmail">
                  Home Email
                </label>
                <input
                  id="homeEmail"
                  name="homeEmail"
                  type="email"
                  className={`form-control${employeeFormErrors.homeEmail ? " is-invalid" : ""}`}
                  value={employeeFormData.homeEmail}
                  onChange={(e) => handleEmployeeInputChange("homeEmail", e.target.value)}
                />
                {employeeFormErrors.homeEmail && (
                  <div className="invalid-feedback d-block">{employeeFormErrors.homeEmail}</div>
                )}
              </div>
              <div className="col-md-4">
                {/* Empty column for Personal Email alignment */}
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-md-4">
                <label className="form-label mb-1" htmlFor="emergencyContactPersonName">
                  Emergency Contact Person Name
                </label>
                <input
                  id="emergencyContactPersonName"
                  name="emergencyContactPersonName"
                  type="text"
                  className="form-control"
                  value={employeeFormData.emergencyContactPersonName}
                  onChange={(e) => handleEmployeeInputChange("emergencyContactPersonName", e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label mb-1" htmlFor="emergencyContactNumbers">
                  Emergency Contact Number
                </label>
                <input
                  id="emergencyContactNumbers"
                  name="emergencyContactNumbers"
                  type="text"
                  className="form-control"
                  value={employeeFormData.emergencyContactNumbers}
                  onChange={(e) => handleEmployeeInputChange("emergencyContactNumbers", e.target.value)}
                />
              </div>
              <div className="col-md-4">
                {/* Empty column for Emergency Contact Numbers alignment */}
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-md-4">
                <label className="form-label mb-1" htmlFor="address1">
                  Address1
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
                <label className="form-label mb-1" htmlFor="address2">
                  Address2
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
                <label className="form-label mb-1" htmlFor="address3">
                  Address3
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

            <div className="row mt-3">
              <div className="col-md-4">
                <label className="form-label mb-1" htmlFor="city">
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
                <label className="form-label mb-1" htmlFor="state">
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
                <label className="form-label mb-1" htmlFor="zipCode">
                  ZipCode
                </label>
                <input
                  id="zipCode"
                  name="zipCode"
                  type="text"
                  className="form-control"
                  value={employeeFormData.zipCode}
                  onChange={(e) => handleEmployeeInputChange("zipCode", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Additional Fields */}
          <div className="row mt-3">
            <div className="col-md-4">
              <label className="form-label mb-1">Overtime Allowed Status</label>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={employeeFormData.overTimeAllowedStatus}
                  onChange={(e) => handleEmployeeInputChange("overTimeAllowedStatus", e.target.checked)}
                />
                <label className="form-check-label">
                  {employeeFormData.overTimeAllowedStatus ? "Yes" : "No"}
                </label>
              </div>
            </div>
            <div className="col-md-4">
              <label className="form-label mb-1">Employee Photo</label>
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

          <div className="row mt-4">
            <div className="col-12 text-end">
              <button type="button" className="btn btn-outline-secondary me-2" onClick={handleReset}>
                Reset
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? (employeeId ? "Updating..." : "Saving...") : (employeeId ? "Update" : "Save")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BasicDetails;

