import { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import Grid from "../../components/grid";
import Button from "../../components/button";
import Dropdown from "../../components/Dropdown";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Pagination from "../../components/pagination";
import {
  fetchEmployeeLeaveSetup,
  fetchLeaveSetupOfAnEmployee,
  addUpdateEmployeeLeaveConfig,
  addOrUpdateEmployeeLeaveConfigDetails,
  fetchEmployeesNotConfiguredLeave,
  resetEmployeeLeaveSetup,
} from "../../redux/reducers/employeeLeaveConfig";
import { fetchLeaveTemplates, fetchLeaveTemplateById, fetchDesignationList } from "../../redux/reducers/leaveTemplate";
import { getAllEmployeeDetails } from "../../redux/reducers/getAllEmployeeDetails";
import CommonService from "../../core/services/CommonService";
import secureLocalStorage from "react-secure-storage";
import { toast } from "react-toastify";

const EmployeeLeaveConfig = () => {
  const dispatch = useDispatch();
  const { employeeLeaveSetupList, employeeLeaveSetup, loading, error } = useSelector(
    (state) => state.employeeLeaveConfig
  );
  const { leaveTemplates, designationList } = useSelector((state) => state.leaveTemplate);
  const { options: employeeList } = useSelector((state) => state.getAllEmployeeDetails);

  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [validFrom, setValidFrom] = useState(null);
  const [validTo, setValidTo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isEditing, setIsEditing] = useState(false);
  const [editingConfigId, setEditingConfigId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templateAllocations, setTemplateAllocations] = useState([]);
  const [formError, setFormError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [workYears, setWorkYears] = useState([]);

  // Fetch work years from API on component mount
  useEffect(() => {
    const fetchWorkYears = async () => {
      const result = await CommonService.getAllWorkYears();
      if (!result.error && result.data) {
        setWorkYears(result.data);
        // Set default year filter based on financial year (July 1 - June 30)
        if (result.data.length > 0 && !yearFilter) {
          const today = new Date();
          const currentMonth = today.getMonth() + 1; // 1-12
          const currentYear = today.getFullYear();

          // Financial year starts on July 1
          // If current month is July (7) or later, financial year starts with current year
          // If current month is before July (1-6), financial year started last year
          const financialYearStart = currentMonth >= 7 ? currentYear : currentYear - 1;

          const currentWorkYear = result.data.find((year) => {
            if (!year.displayText) return false;
            // Extract first year from displayText (handles both "2025-26" and "2025-2026" formats)
            const firstYear = year.displayText.split("-")[0];
            return firstYear === String(financialYearStart);
          });
          if (currentWorkYear) {
            setYearFilter(String(currentWorkYear.idWorkYear));
          } else {
            // Fallback to first work year if financial year not found
            setYearFilter(String(result.data[0].idWorkYear));
          }
        }
      }
    };
    fetchWorkYears();
  }, []);

  // Get previous, current, and next financial year start years
  const getRelevantYears = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentYear = today.getFullYear();

    // Financial year starts on July 1
    // If current month is July (7) or later, financial year starts with current year
    // If current month is before July (1-6), financial year started last year
    const financialYearStart = currentMonth >= 7 ? currentYear : currentYear - 1;

    return [
      financialYearStart - 1, // Previous year
      financialYearStart,     // Current year
      financialYearStart + 1  // Next year
    ];
  }, []);

  // Filter work years to only include previous, current, and next financial year
  const filteredWorkYears = useMemo(() => {
    return workYears.filter((year) => {
      if (!year.displayText) return false;
      const firstYear = parseInt(year.displayText.split("-")[0]);
      return getRelevantYears.includes(firstYear);
    });
  }, [workYears, getRelevantYears]);

  // Year filter options from API (only previous, current, next year)
  const yearFilterOptions = useMemo(() => {
    return filteredWorkYears.map((year) => ({
      value: String(year.idWorkYear),
      label: year.displayText,
    }));
  }, [filteredWorkYears]);

  // Fetch initial data on component mount
  useEffect(() => {
    // Only fetch APPROVED templates for the dropdown
    dispatch(fetchLeaveTemplates({ status: "APPROVED", idYear: "", searchText: "" }));
    dispatch(getAllEmployeeDetails());
    dispatch(fetchDesignationList());
  }, [dispatch]);

  // Designation filter options
  const designationFilterOptions = useMemo(() => {
    if (designationList && designationList.data) {
      return [
        { value: "", label: "All Designations" },
        ...designationList.data.map((d) => ({
          value: String(d.idDesignation),
          label: d.designationName,
        })),
      ];
    }
    return [{ value: "", label: "All Designations" }];
  }, [designationList]);

  // Fetch employee leave setup list when search query or year filter changes
  useEffect(() => {
    // Only fetch when yearFilter has a valid value
    if (yearFilter) {
      const idYear = parseInt(yearFilter);
      if (!isNaN(idYear)) {
        dispatch(fetchEmployeeLeaveSetup({ searchText: searchQuery, idYear }));
      }
    }
  }, [dispatch, searchQuery, yearFilter]);

  // Employee options for dropdown
  const employeeOptions = useMemo(() => {
    if (employeeList && employeeList.length > 0) {
      return [
        ...employeeList.map((emp) => ({
          value: String(emp.idEmployee),
          label: `${emp.employeeCode} - ${emp.fullName}`,
        })),
      ];
    }
  }, [employeeList]);

  // Template options for dropdown
  const templateOptions = useMemo(() => {
    if (leaveTemplates && leaveTemplates.data) {
      return [
        ...leaveTemplates.data.map((template) => ({
          value: String(template.idLeaveTemplate),
          label: `${template.idYear} - ${template.leaveTemplateName}`,
        })),
      ];
    }
    return [{ value: "", label: "Select Template" }];
  }, [leaveTemplates]);

  // Helper function to format date as MM/DD/YYYY with leading zeros
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Get employee leave setup data from API response
  const employeeLeaveData = useMemo(() => {
    if (!employeeLeaveSetupList || !employeeLeaveSetupList.data) return [];

    let data = employeeLeaveSetupList.data.map((setup) => {
      // Look up employee code from employeeList using idEmployee
      const employee = employeeList?.find((emp) => emp.idEmployee === setup.idEmployee);
      const employeeCode = setup.employeeCode || setup.empCode || employee?.employeeCode || "";
      const designationName = setup.designationName || employee?.designationName || "";
      const idDesignation = setup.idDesignation || employee?.idDesignation || null;

      return {
        idEmployeeLeaveConfig: setup.idEmployeeLeaveConfig,
        employeeCode: employeeCode,
        employeeName: setup.employeeName,
        designation: designationName,
        idDesignation: idDesignation,
        templateName: setup.leaveTemplateName,
        validFrom: formatDate(setup.effectiveFrom),
        validTo: formatDate(setup.effectiveTo),
        idEmployee: setup.idEmployee,
        idLeaveTemplate: setup.idLeaveTemplate,
        validFromRaw: setup.effectiveFrom,
        validToRaw: setup.effectiveTo,
        details: setup.details || [], // Store details array for template allocations
      };
    });

    // Apply designation filter
    if (designationFilter) {
      data = data.filter((item) => String(item.idDesignation) === designationFilter);
    }

    return data;
  }, [employeeLeaveSetupList, employeeList, designationFilter]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return employeeLeaveData.slice(startIndex, endIndex);
  }, [employeeLeaveData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(employeeLeaveData.length / rowsPerPage);

  const handlePageChange = (page) => setCurrentPage(page);

  const columns = [
    { key: "employeeCode", label: "Emp. Code" },
    { key: "employeeName", label: "Employee Name" },
    { key: "designation", label: "Designation" },
    { key: "templateName", label: "Template Name" },
    { key: "validFrom", label: "Valid From" },
    { key: "validTo", label: "Valid To" },
    { key: "actions", label: "" },
  ];

  const handleEdit = async (id) => {
    const setup = employeeLeaveData.find((s) => s.idEmployeeLeaveConfig === id);
    if (setup) {
      setSelectedEmployee(String(setup.idEmployee));
      setSelectedTemplate(String(setup.idLeaveTemplate));

      // Format dates for react-datepicker
      setValidFrom(setup.validFromRaw ? new Date(setup.validFromRaw) : null);
      setValidTo(setup.validToRaw ? new Date(setup.validToRaw) : null);
      setEditingConfigId(setup.idEmployeeLeaveConfig);
      setIsEditing(true);
      setShowModal(true);

      // Fetch detailed employee leave setup to get idEmployeeLeaveConfigDetails
      try {
        const detailResult = await dispatch(
          fetchLeaveSetupOfAnEmployee({
            IdEmployee: setup.idEmployee,
            idYear: parseInt(yearFilter)
          })
        );

        if (detailResult.payload && detailResult.payload.data) {
          const detailedSetup = detailResult.payload.data;
          // Find the matching config by idEmployeeLeaveConfig - check multiple possible field names
          const configDetails = detailedSetup.details || detailedSetup.employeeLeaveConfigDetails || detailedSetup.employeeLeaveConfigDetail || [];

          if (configDetails.length > 0) {
            const allocations = configDetails.map((detail) => {
              return {
                idEmployeeLeaveConfigDetails: detail.idEmployeeLeaveConfigDetails || detail.idEmployeeLeaveConfigDetail || detail.id || 0,
                idEmployeeLeaveConfig: setup.idEmployeeLeaveConfig,
                idLeaveTemplateDetail: detail.idLeaveTemplateDetail || detail.idLeaveTemplateDetails || 0,
                idLeaveType: detail.idLeaveType || 0,
                leaveTypeName: detail.leaveTypeName,
                allocatedDays: detail.allocatedDays || detail.allocatedDaysInYear || 0,
                carriedForwardDays: detail.maxCarryForwardDays || detail.carriedForwardDays || detail.carryForwardDays || 0,
              };
            });
            setTemplateAllocations(allocations);
            return;
          }
        }
      } catch (error) {
        console.error("Error fetching employee leave setup details:", error);
      }

      // Fallback: Use details from list API or fetch from template
      if (setup.details && setup.details.length > 0) {
        const allocations = setup.details.map((detail) => ({
          idEmployeeLeaveConfigDetails: detail.idEmployeeLeaveConfigDetails || detail.idEmployeeLeaveConfigDetail || detail.id || 0,
          idEmployeeLeaveConfig: setup.idEmployeeLeaveConfig,
          idLeaveTemplateDetail: detail.idLeaveTemplateDetail || detail.idLeaveTemplateDetails || 0,
          idLeaveType: detail.idLeaveType || 0,
          leaveTypeName: detail.leaveTypeName,
          allocatedDays: detail.allocatedDays || detail.allocatedDaysInYear || 0,
          carriedForwardDays: detail.maxCarryForwardDays || detail.carriedForwardDays || detail.carryForwardDays || 0,
        }));
        setTemplateAllocations(allocations);
      } else if (setup.idLeaveTemplate) {
        // If no details, fetch from template
        try {
          const templateResult = await dispatch(
            fetchLeaveTemplateById(setup.idLeaveTemplate)
          );

          if (templateResult.payload && templateResult.payload.data) {
            const templateDetails = templateResult.payload.data.leaveTemplateDetails || [];

            const allocations = templateDetails.map((detail) => ({
              idEmployeeLeaveConfigDetails: 0,
              idEmployeeLeaveConfig: setup.idEmployeeLeaveConfig,
              idLeaveTemplateDetail: detail.idLeaveTemplateDetails || 0,
              idLeaveType: detail.idLeaveType || 0,
              leaveTypeName: detail.leaveTypeName,
              allocatedDays: detail.maxLeavesPerYear || 0,
              carriedForwardDays: detail.isCarryForwardAllowed ? detail.maxCarryForwardDays || 0 : 0,
            }));

            setTemplateAllocations(allocations);
          }
        } catch (error) {
          console.error("Error fetching template details:", error);
          setTemplateAllocations([]);
        }
      }
    }
  };

  const handleAddNew = () => {
    handleReset();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    // Refresh the list first to set loading state and clear any error
    dispatch(fetchEmployeeLeaveSetup({ searchText: searchQuery, idYear: parseInt(yearFilter) }));
    // Reset form state without dispatching resetEmployeeLeaveSetup (to avoid showing error)
    setSelectedEmployee("");
    setSelectedTemplate("");
    setValidFrom(null);
    setValidTo(null);
    setFormError("");
    setIsEditing(false);
    setEditingConfigId(null);
    setTemplateAllocations([]);
  };

  const handleRowClick = async (id) => {
    // Use handleEdit for row click as well
    handleEdit(id);
  };

  // Update template allocations when template changes (only for new records, not when editing)
  useEffect(() => {
    const fetchTemplateAllocations = async () => {
      // Skip if we're editing - allocations are set by handleEdit with correct IDs
      if (isEditing) {
        return;
      }

      if (selectedTemplate) {
        try {
          const resultAction = await dispatch(
            fetchLeaveTemplateById(parseInt(selectedTemplate))
          );

          if (resultAction.payload && resultAction.payload.data) {
            const templateDetails = resultAction.payload.data.leaveTemplateDetails || [];

            // Map template details to allocation format with IDs for API
            const allocations = templateDetails.map((detail) => ({
              idEmployeeLeaveConfigDetails: 0,
              idEmployeeLeaveConfig: editingConfigId || 0,
              idLeaveTemplateDetail: detail.idLeaveTemplateDetails || 0,
              idLeaveType: detail.idLeaveType || 0,
              leaveTypeName: detail.leaveTypeName,
              allocatedDays: detail.maxLeavesPerYear || 0,
              carriedForwardDays: detail.isCarryForwardAllowed ? detail.maxCarryForwardDays || 0 : 0,
            }));

            setTemplateAllocations(allocations);
          }
        } catch (error) {
          console.error("Error fetching template details:", error);
          setTemplateAllocations([]);
        }
      } else {
        setTemplateAllocations([]);
      }
    };

    fetchTemplateAllocations();
  }, [selectedTemplate, dispatch, isEditing]);

  const getCurrentUserId = () => {
    const user = secureLocalStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      return userData.idEmployee || 1;
    }
    return 1;
  };

  // Helper function to convert date to ISO string preserving local date
  const toLocalISOString = (date) => {
    if (!date) return null;
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString();
  };

  const handleSubmit = async (fromDate, toDate) => {
    setFormError("");

    // Use passed dates or fall back to state
    const effectiveFromDate = fromDate || validFrom;
    const effectiveToDate = toDate || validTo;

    // Validation
    if (!selectedEmployee) {
      setFormError("Employee Name is required.");
      return;
    }

    if (!selectedTemplate) {
      setFormError("Template Name is required.");
      return;
    }

    if (!effectiveFromDate) {
      setFormError("Valid From date is required.");
      return;
    }

    if (!effectiveToDate) {
      setFormError("Valid To date is required.");
      return;
    }

    // Validate date range
    if (effectiveFromDate > effectiveToDate) {
      setFormError("Valid From date must be before Valid To date.");
      return;
    }

    const configData = {
      idEmployeeLeaveConfig: isEditing ? editingConfigId : 0,
      idEmployee: parseInt(selectedEmployee),
      idLeaveTemplate: parseInt(selectedTemplate),
      effectiveFrom: toLocalISOString(effectiveFromDate),
      effectiveTo: toLocalISOString(effectiveToDate),
      createdBy: getCurrentUserId(),
      createdAt: new Date().toISOString(),
      updatedBy: isEditing ? getCurrentUserId() : 0,
      updatedAt: isEditing ? new Date().toISOString() : new Date().toISOString(),
    };

    try {
      setIsSubmitting(true);
      const resultAction = await dispatch(addUpdateEmployeeLeaveConfig(configData));

      if (resultAction.payload && resultAction.payload.success) {
        toast.success(
          isEditing
            ? "Employee leave config updated successfully!"
            : "Employee leave config added successfully!",
          {
            position: "top-right",
            autoClose: 4000,
          }
        );
        setShowModal(false);
        handleReset();
        // Refresh the list
        dispatch(fetchEmployeeLeaveSetup({ searchText: searchQuery, idYear: parseInt(yearFilter) }));
      } else {
        toast.error(
          resultAction.payload?.message || "Failed to save employee leave config",
          {
            position: "top-right",
            autoClose: 4000,
          }
        );
        // Refresh the list to clear error state and show selected year data
        dispatch(fetchEmployeeLeaveSetup({ searchText: searchQuery, idYear: parseInt(yearFilter) }));
      }
    } catch (error) {
      console.error("Error saving employee leave config:", error);
      toast.error("Failed to save employee leave config", {
        position: "top-right",
        autoClose: 4000,
      });
      // Refresh the list to clear error state and show selected year data
      dispatch(fetchEmployeeLeaveSetup({ searchText: searchQuery, idYear: parseInt(yearFilter) }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedEmployee("");
    setSelectedTemplate("");
    setValidFrom(null);
    setValidTo(null);
    setFormError("");
    setIsEditing(false);
    setEditingConfigId(null);
    setTemplateAllocations([]);
    dispatch(resetEmployeeLeaveSetup());
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">List of Employee Leave Configurations</h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-2">
                  <select
                    className="form-select"
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                  >
                    {yearFilterOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <select
                    className="form-select"
                    value={designationFilter}
                    onChange={(e) => setDesignationFilter(e.target.value)}
                  >
                    {designationFilterOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <div className="list_searchbox">
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search by Emp. Code / Name"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <i className="bx bx-search"></i>
                  </div>
                </div>
                <div className="col-md-2 text-end">
                  <Button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAddNew}
                  >
                    <i className="bx bx-plus me-1"></i> Add
                  </Button>
                </div>
              </div>
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : error ? (
                <div className="text-danger text-center py-4">{error}</div>
              ) : (
                <Grid
                  columns={columns}
                  data={paginatedData}
                  idKey="idEmployeeLeaveConfig"
                  onEditClick={handleEdit}
                  onRowClick={handleRowClick}
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

      {/* Add/Update Employee Leave Setup Modal */}
      {showModal && (
        <EmployeeLeaveSetupModal
          isEditing={isEditing}
          selectedEmployee={selectedEmployee}
          setSelectedEmployee={setSelectedEmployee}
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
          validFrom={validFrom}
          setValidFrom={setValidFrom}
          validTo={validTo}
          setValidTo={setValidTo}
          employeeOptions={employeeOptions}
          templateOptions={templateOptions}
          templateAllocations={templateAllocations}
          setTemplateAllocations={setTemplateAllocations}
          formError={formError}
          setFormError={setFormError}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onClose={handleCloseModal}
          dispatch={dispatch}
          editingConfigId={editingConfigId}
          workYears={workYears}
        />
      )}
    </div>
  );
};

// Employee Leave Setup Modal Component
const EmployeeLeaveSetupModal = ({
  isEditing,
  selectedEmployee,
  setSelectedEmployee,
  selectedTemplate,
  setSelectedTemplate,
  validFrom,
  setValidFrom,
  validTo,
  setValidTo,
  employeeOptions,
  templateOptions,
  templateAllocations,
  setTemplateAllocations,
  formError,
  setFormError,
  isSubmitting,
  onSubmit,
  onClose,
  dispatch,
  editingConfigId,
  workYears,
}) => {
  const [savingAllocation, setSavingAllocation] = useState(false);
  const [selectedYear, setSelectedYear] = useState("");
  const [employeeJoiningDate, setEmployeeJoiningDate] = useState(null);
  const [modalEmployeeOptions, setModalEmployeeOptions] = useState([]);
  const modalRef = useRef(null);
  const onCloseRef = useRef(onClose);

  // Set default year based on financial year (July 1 - June 30) for Add mode
  useEffect(() => {
    if (!isEditing && workYears.length > 0 && !selectedYear) {
      const today = new Date();
      const currentMonth = today.getMonth() + 1; // 1-12
      const currentYear = today.getFullYear();

      // Financial year starts on July 1
      // If current month is July (7) or later, financial year starts with current year
      // If current month is before July (1-6), financial year started last year
      const financialYearStart = currentMonth >= 7 ? currentYear : currentYear - 1;

      const currentWorkYear = workYears.find((year) => {
        if (!year.displayText) return false;
        const firstYear = year.displayText.split("-")[0];
        return firstYear === String(financialYearStart);
      });

      if (currentWorkYear) {
        setSelectedYear(String(currentWorkYear.idWorkYear));
        // Also auto-populate dates
        const workDateFrom = new Date(currentWorkYear.workDateFrom);
        const workDateTo = new Date(currentWorkYear.workDateTo);
        setValidFrom(workDateFrom);
        setValidTo(workDateTo);

        // Fetch employees not configured for leave for default year
        dispatch(
          fetchEmployeesNotConfiguredLeave({ idWorkYear: currentWorkYear.idWorkYear })
        ).then((result) => {
          if (result.payload && result.payload.data) {
            const options = result.payload.data.map((emp) => ({
              value: String(emp.idemployee),
              label: `${emp.employeeCode} - ${emp.employeeName}`,
            }));
            setModalEmployeeOptions(options);
          }
        });
      }
    }
  }, [isEditing, workYears]);

  // Get previous, current, and next financial year start years
  const getRelevantYears = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentYear = today.getFullYear();

    // Financial year starts on July 1
    // If current month is July (7) or later, financial year starts with current year
    // If current month is before July (1-6), financial year started last year
    const financialYearStart = currentMonth >= 7 ? currentYear : currentYear - 1;

    return [
      financialYearStart - 1, // Previous year
      financialYearStart,     // Current year
      financialYearStart + 1  // Next year
    ];
  }, []);

  // Filter work years to only include previous, current, and next financial year
  const filteredWorkYears = useMemo(() => {
    return workYears.filter((year) => {
      if (!year.displayText) return false;
      const firstYear = parseInt(year.displayText.split("-")[0]);
      return getRelevantYears.includes(firstYear);
    });
  }, [workYears, getRelevantYears]);

  // Year dropdown options (only previous, current, next year)
  const yearOptions = useMemo(() => {
    return [
      { value: "", label: "Select Year" },
      ...filteredWorkYears.map((year) => ({
        value: String(year.idWorkYear),
        label: year.displayText,
        workDateFrom: year.workDateFrom,
        workDateTo: year.workDateTo,
      })),
    ];
  }, [filteredWorkYears]);

  // Compute min/max date range from selected work year
  const yearDateRange = useMemo(() => {
    if (selectedYear) {
      const yearData = workYears.find((y) => String(y.idWorkYear) === selectedYear);
      if (yearData) {
        return {
          minDate: new Date(yearData.workDateFrom),
          maxDate: new Date(yearData.workDateTo),
        };
      }
    }
    return { minDate: null, maxDate: null };
  }, [selectedYear, workYears]);

  // Helper function to normalize date (remove time component for comparison)
  const normalizeDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Helper function to check if Valid From is before joining date
  const isValidFromBeforeJoiningDate = (fromDate, joiningDate) => {
    if (!fromDate || !joiningDate) return false;
    const normalizedFrom = normalizeDate(fromDate);
    const normalizedJoining = normalizeDate(joiningDate);
    return normalizedFrom < normalizedJoining;
  };

  // Handle Year selection - auto-populate Valid From and Valid To, fetch unconfigured employees
  const handleYearChange = async (e) => {
    const yearId = e.target.value;
    setSelectedYear(yearId);
    setFormError("");
    setSelectedEmployee("");
    setModalEmployeeOptions([]);

    // Auto-populate dates for both Add and Update modes
    if (yearId) {
      const selectedYearData = workYears.find(
        (year) => String(year.idWorkYear) === yearId
      );
      if (selectedYearData) {
        const workDateFrom = new Date(selectedYearData.workDateFrom);
        const workDateTo = new Date(selectedYearData.workDateTo);
        setValidFrom(workDateFrom);
        setValidTo(workDateTo);
      }

      // Fetch employees not configured for leave for this year
      try {
        const result = await dispatch(
          fetchEmployeesNotConfiguredLeave({ idWorkYear: parseInt(yearId) })
        );
        if (result.payload && result.payload.data) {
          const options = result.payload.data.map((emp) => ({
            value: String(emp.idemployee),
            label: `${emp.employeeCode} - ${emp.employeeName}`,
          }));
          setModalEmployeeOptions(options);
        }
      } catch (error) {
        console.error("Error fetching unconfigured employees:", error);
      }
    } else {
      setValidFrom(null);
      setValidTo(null);
    }
  };

  // Auto-select Year dropdown based on validFrom when in edit mode
  useEffect(() => {
    if (isEditing && validFrom && workYears.length > 0 && !selectedYear) {
      const normalizedValidFrom = normalizeDate(validFrom);
      const matchingYear = workYears.find((year) => {
        const workDateFrom = normalizeDate(new Date(year.workDateFrom));
        const workDateTo = normalizeDate(new Date(year.workDateTo));
        return normalizedValidFrom >= workDateFrom && normalizedValidFrom <= workDateTo;
      });
      if (matchingYear) {
        setSelectedYear(String(matchingYear.idWorkYear));
      }
    }
  }, [isEditing, validFrom, workYears]);

  // Handle Employee selection - fetch joining date
  const handleEmployeeChange = async (e) => {
    const employeeId = e.target.value;
    setSelectedEmployee(employeeId);
    setFormError("");
    setEmployeeJoiningDate(null);

    if (employeeId) {
      try {
        const result = await CommonService.getEmployeeProfileById(employeeId);
        if (!result.error && result.data && result.data.data && result.data.data.length > 0) {
          const joiningDate = result.data.data[0]?.joiningDate;
          if (joiningDate) {
            const joiningDateObj = new Date(joiningDate);
            setEmployeeJoiningDate(joiningDateObj);

            // Validate existing Valid From against joining date
            if (validFrom && isValidFromBeforeJoiningDate(validFrom, joiningDateObj)) {
              const formattedJoiningDate = joiningDateObj.toLocaleDateString();
              setFormError(
                `Valid From date cannot be before employee's joining date (${formattedJoiningDate}).`
              );
            }
          }
        }
      } catch (error) {
        console.error("Error fetching employee profile:", error);
      }
    }
  };

  // Validate Valid From against joining date
  const handleValidFromChange = (date) => {
    setValidFrom(date);
    setFormError("");

    if (date && employeeJoiningDate && isValidFromBeforeJoiningDate(date, employeeJoiningDate)) {
      const formattedJoiningDate = employeeJoiningDate.toLocaleDateString();
      setFormError(
        `Valid From date cannot be before employee's joining date (${formattedJoiningDate}).`
      );
    }
  };

  // Helper function to calculate days between two dates
  const getDaysBetweenDates = (fromDate, toDate) => {
    if (!fromDate || !toDate) return 0;
    const from = normalizeDate(fromDate);
    const to = normalizeDate(toDate);
    const diffTime = Math.abs(to - from);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    return diffDays;
  };

  // Calculate total allocated days from all allocations (carried forward is always zero)
  const getTotalAllocatedDays = () => {
    return templateAllocations.reduce((total, allocation) => {
      return total + (allocation.allocatedDays || 0);
    }, 0);
  };

  // Submit with joining date validation
  const handleSubmitWithValidation = () => {
    // Clear previous error
    setFormError("");

    // Validate Valid From against joining date
    if (validFrom && employeeJoiningDate && isValidFromBeforeJoiningDate(validFrom, employeeJoiningDate)) {
      const formattedJoiningDate = employeeJoiningDate.toLocaleDateString();
      setFormError(
        `Valid From date cannot be before employee's joining date (${formattedJoiningDate}).`
      );
      return;
    }

    // Validate Total Allocated Days against date range
    if (validFrom && validTo && templateAllocations.length > 0) {
      const daysBetween = getDaysBetweenDates(validFrom, validTo);
      const totalAllocatedDays = getTotalAllocatedDays();

      if (totalAllocatedDays > daysBetween) {
        setFormError(
          `Total Allocated Days (${totalAllocatedDays}) cannot exceed the number of days between Valid From and Valid To (${daysBetween} days).`
        );
        return;
      }
    }

    // Call parent submit with current date values
    onSubmit(validFrom, validTo);
  };

  // Keep onCloseRef updated with latest onClose callback
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Initialize modal only once on mount
  useEffect(() => {
    const modalElement = document.getElementById("employeeLeaveSetupModal");
    if (modalElement && !modalRef.current) {
      modalRef.current = new bootstrap.Modal(modalElement, {
        focus: false,
        backdrop: "static",
        keyboard: false,
      });
      modalRef.current.show();

      const handleHidden = () => {
        if (onCloseRef.current) {
          onCloseRef.current();
        }
      };

      modalElement.addEventListener("hidden.bs.modal", handleHidden);

      return () => {
        modalElement.removeEventListener("hidden.bs.modal", handleHidden);
        if (modalRef.current) {
          modalRef.current.dispose();
          modalRef.current = null;
        }
      };
    }
  }, []);

  // Fetch joining date when modal opens with pre-selected employee (editing mode)
  useEffect(() => {
    const fetchJoiningDate = async () => {
      if (selectedEmployee && !employeeJoiningDate) {
        try {
          const result = await CommonService.getEmployeeProfileById(selectedEmployee);
          if (!result.error && result.data && result.data.data && result.data.data.length > 0) {
            const joiningDate = result.data.data[0]?.joiningDate;
            if (joiningDate) {
              const joiningDateObj = new Date(joiningDate);
              setEmployeeJoiningDate(joiningDateObj);

              // Validate existing Valid From against joining date
              if (validFrom && isValidFromBeforeJoiningDate(validFrom, joiningDateObj)) {
                const formattedJoiningDate = joiningDateObj.toLocaleDateString();
                setFormError(
                  `Valid From date cannot be before employee's joining date (${formattedJoiningDate}).`
                );
              }
            }
          }
        } catch (error) {
          console.error("Error fetching employee profile:", error);
        }
      }
    };

    fetchJoiningDate();
  }, [selectedEmployee]);

  const handleAllocationChange = async (index, newValue) => {
    const allocation = templateAllocations[index];
    const parsedValue = parseInt(newValue) || 0;

    // Update local state immediately
    const updatedAllocations = templateAllocations.map((item, i) =>
      i === index ? { ...item, allocatedDays: parsedValue } : item
    );
    setTemplateAllocations(updatedAllocations);

    // Only call API if we have an existing config (editing mode)
    if (isEditing && editingConfigId && allocation.idEmployeeLeaveConfig) {
      try {
        setSavingAllocation(true);
        const payload = {
          idEmployeeLeaveConfigDetails: allocation.idEmployeeLeaveConfigDetails || 0,
          idEmployeeLeaveConfig: allocation.idEmployeeLeaveConfig || editingConfigId,
          idLeaveTemplateDetail: allocation.idLeaveTemplateDetail || 0,
          idLeaveType: allocation.idLeaveType || 0,
          allocatedDaysInYear: parsedValue,
        };

        await dispatch(addOrUpdateEmployeeLeaveConfigDetails(payload));
      } catch (error) {
        console.error("Error updating allocation:", error);
        toast.error("Failed to update allocation", {
          position: "top-right",
          autoClose: 3000,
        });
      } finally {
        setSavingAllocation(false);
      }
    }
  };

  return (
    <div
      className="modal fade"
      id="employeeLeaveSetupModal"
      tabIndex="-1"
      aria-hidden="true"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
    >
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {isEditing ? "Update Employee Leave Configuration" : "Add Employee Leave Configuration"}
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label mb-1">Year</label>
                <select
                  className="form-select"
                  value={selectedYear}
                  onChange={handleYearChange}
                >
                  {yearOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <Dropdown
                  label="Employee Name"
                  name="employeeName"
                  options={isEditing ? employeeOptions : modalEmployeeOptions}
                  value={selectedEmployee}
                  onChange={handleEmployeeChange}
                />
              </div>
              <div className="col-md-6">
                <Dropdown
                  label="Template Name"
                  name="templateName"
                  options={templateOptions}
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                />
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label mb-1">Valid From</label>
                <br />
                <DatePicker
                  className="form-control"
                  dateFormat="MM/dd/yyyy"
                  placeholderText="Valid From"
                  selected={validFrom}
                  onChange={handleValidFromChange}
                  minDate={yearDateRange.minDate}
                  maxDate={yearDateRange.maxDate}
                  showYearDropdown
                  popperProps={{ strategy: "fixed" }}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label mb-1">Valid To</label>
                <br />
                <DatePicker
                  className="form-control"
                  dateFormat="MM/dd/yyyy"
                  placeholderText="Valid To"
                  selected={validTo}
                  onChange={(date) => setValidTo(date)}
                  minDate={yearDateRange.minDate}
                  maxDate={yearDateRange.maxDate}
                  showYearDropdown
                  popperProps={{ strategy: "fixed" }}
                />
              </div>
            </div>

            {formError && (
              <div className="alert alert-danger py-2 mb-2" role="alert">
                {formError}
              </div>
            )}

            <div className="mb-3">
              <h6 className="fw-bold mb-2">Template Allocations</h6>
              <div className="table-responsive">
                <table className="table table-bordered table-sm">
                  <thead>
                    <tr>
                      <th>Leave Type</th>
                      <th>No. of Days Allocated</th>
                      <th>No. of Days Carried Forward</th>
                      <th>Total Allocated Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templateAllocations.length > 0 ? (
                      templateAllocations.map((allocation, index) => (
                        <tr key={index}>
                          <td>{allocation.leaveTypeName || "-"}</td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={allocation.allocatedDays || 0}
                              onChange={(e) => handleAllocationChange(index, e.target.value)}
                              min="0"
                              style={{ width: "80px" }}
                            />
                          </td>
                          <td>0</td>
                          <td>
                            {allocation.allocatedDays || 0}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center text-muted">
                          {selectedTemplate
                            ? "No allocations available"
                            : "Select a template to view allocations"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary"
              data-bs-dismiss="modal"
            >
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmitWithValidation}
              disabled={isSubmitting || savingAllocation}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLeaveConfig;
