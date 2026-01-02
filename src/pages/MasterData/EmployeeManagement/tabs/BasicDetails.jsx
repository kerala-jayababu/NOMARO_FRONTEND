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
  const { employeeId, setEmployeeId } = useContext(EmployeeContext) || {};
  const { showLoader, hideLoader } = useLoader();
  const dispatch = useDispatch();
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
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
  const [budgetCodeOptions, setBudgetCodeOptions] = useState([]);
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

  useEffect(() => {
    loadDepartmentsAndDesignations();
    loadReportingToOptions();
    loadBudgetCodes();
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
        idDepartment: detailedData.idDepartment
          ? detailedData.idDepartment.toString()
          : "",
        idDesignation: detailedData.idDesignation
          ? detailedData.idDesignation.toString()
          : "",
        emailID: detailedData.emailID ?? detailedData.emailId ?? "",
        phoneNumber1: detailedData.phoneNumber1 ?? "",
        phoneNumber2: detailedData.phoneNumber2 ?? "",
        whatsAppNumber: detailedData.whatsAppNumber ?? "",
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
          : "",
        currentStatus: detailedData.currentStatus ?? "Working",
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
    } catch (error) {
      hideLoader();
      console.error("Error loading employee data:", error);
      toast.error("Failed to load employee data");
    }
  };

  const phoneFields = ["phoneNumber1", "phoneNumber2", "whatsAppNumber"];
  const numericFields = ["zipCode", "taxIdNumber"];

  const handleEmployeeInputChange = (field, value) => {
    let sanitizedValue = value;

    if (typeof sanitizedValue === "string") {
      sanitizedValue = sanitizedValue.trimStart();
    }

    if (phoneFields.includes(field)) {
      sanitizedValue = sanitizedValue.replace(/[^\d-]/g, "").slice(0, 20);
    }

    if (numericFields.includes(field)) {
      if (field === "taxIdNumber") {
        sanitizedValue = sanitizedValue.replace(/[^\d-]/g, "");
      } else {
        sanitizedValue = sanitizedValue.replace(/\D/g, "");
      }
    }

    setEmployeeFormData((prev) => ({
      ...prev,
      [field]: sanitizedValue,
    }));

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
        toast.error(result.error.message || "Failed to save employee");
        return;
      }

      if (result.data?.success) {
        const message = editingEmployeeId ? "Employee updated successfully" : "Employee added successfully";
        toast.success(message);
        
        // If it's a new employee, update the employeeId in context
        if (!editingEmployeeId && result.data?.data?.idEmployee) {
          const newEmployeeId = result.data.data.idEmployee.toString();
          setEditingEmployeeId(newEmployeeId);
          if (setEmployeeId) {
            setEmployeeId(newEmployeeId);
          }
          // Reload the employee data to get all fields
          await loadEmployeeData(newEmployeeId);
        }
      } else {
        hideLoader();
        console.error("API returned success=false:", result.data);
        toast.error(result.data?.message || "Failed to save employee");
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
    setEmployeePhotoPreview(null);
    setEmployeePhotoFile(null);
  };

  return (
    <div className="row">
      <h6 className="mb-3">Basic Details</h6>
      <div className="col-12">
        <form onSubmit={handleSubmit}>
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
                className="form-control"
                maxDate={new Date()}
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                wrapperClassName="d-block"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label mb-1">Joining Date *</label>
              <DatePicker
                selected={employeeFormData.joiningDate}
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

          <div className="row mt-3">
            <div className="col-md-4">
              <label className="form-label mb-1" htmlFor="emailID">
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
                <div className="invalid-feedback d-block">{employeeFormErrors.emailID}</div>
              )}
            </div>
            <div className="col-md-4">
              <label className="form-label mb-1" htmlFor="phoneNumber1">
                Phone Number 1
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
              <label className="form-label mb-1" htmlFor="whatsAppNumber">
                WhatsApp Number
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
              <label className="form-label mb-1" htmlFor="address1">
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
              <label className="form-label mb-1" htmlFor="address2">
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
              <label className="form-label mb-1" htmlFor="address3">
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
                Zip Code
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

          <div className="row mt-3">
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
                <option value="">Select Reporting Manager</option>
                {reportingToOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label mb-1" htmlFor="currentStatus">
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
                <label className="form-label mb-1">Last Working Day</label>
                <DatePicker
                  selected={employeeFormData.lastWorkingDay}
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

          <div className="row mt-3">
            <div className="col-md-4">
              <label className="form-label mb-1" htmlFor="idBudgetCode">
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
            <div className="col-md-4">
              <label className="form-label mb-1" htmlFor="idNumber">
                ID Number
              </label>
              <input
                id="idNumber"
                name="idNumber"
                type="text"
                className="form-control"
                value={employeeFormData.idNumber}
                onChange={(e) => handleEmployeeInputChange("idNumber", e.target.value)}
              />
            </div>
          </div>

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

