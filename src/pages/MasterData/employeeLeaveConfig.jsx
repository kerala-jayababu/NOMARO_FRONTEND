import { useState, useEffect, useMemo } from "react";
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
  resetEmployeeLeaveSetup,
} from "../../redux/reducers/employeeLeaveConfig";
import { fetchLeaveTemplates, fetchLeaveTemplateById } from "../../redux/reducers/leaveTemplate";
import { getAllEmployeeDetails } from "../../redux/reducers/getAllEmployeeDetails";
import CommonService from "../../core/services/CommonService";
import secureLocalStorage from "react-secure-storage";
import { toast } from "react-toastify";

const EmployeeLeaveConfig = () => {
  const dispatch = useDispatch();
  const { employeeLeaveSetupList, employeeLeaveSetup, loading, error } = useSelector(
    (state) => state.employeeLeaveConfig
  );
  const { leaveTemplates } = useSelector((state) => state.leaveTemplate);
  const { options: employeeList } = useSelector((state) => state.getAllEmployeeDetails);

  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [validFrom, setValidFrom] = useState(null);
  const [validTo, setValidTo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("");
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
        // Set default year filter to first work year if available
        if (result.data.length > 0 && !yearFilter) {
          setYearFilter(String(result.data[0].idWorkYear));
        }
      }
    };
    fetchWorkYears();
  }, []);

  // Year filter options from API
  const yearFilterOptions = useMemo(() => {
    return workYears.map((year) => ({
      value: String(year.idWorkYear),
      label: year.displayText,
    }));
  }, [workYears]);

  // Fetch initial data on component mount
  useEffect(() => {
    dispatch(fetchEmployeeLeaveSetup({ searchText: searchQuery, idYear: parseInt(yearFilter) }));
    dispatch(fetchLeaveTemplates({ status: "ALL", idYear: "", searchText: "" }));
    dispatch(getAllEmployeeDetails());
  }, [dispatch]);

  // Fetch employee leave setup list when search query or year filter changes
  useEffect(() => {
    dispatch(fetchEmployeeLeaveSetup({ searchText: searchQuery, idYear: parseInt(yearFilter) }));
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

  // Get employee leave setup data from API response
  const employeeLeaveData = useMemo(() => {
    if (!employeeLeaveSetupList || !employeeLeaveSetupList.data) return [];

    return employeeLeaveSetupList.data.map((setup) => {
      // Look up employee code from employeeList using idEmployee
      const employee = employeeList?.find((emp) => emp.idEmployee === setup.idEmployee);
      const employeeCode = setup.employeeCode || setup.empCode || employee?.employeeCode || "";

      return {
        idEmployeeLeaveConfig: setup.idEmployeeLeaveConfig,
        employeeCode: employeeCode,
        employeeName: setup.employeeName,
      templateName: setup.leaveTemplateName,
      validFrom: setup.effectiveFrom ? new Date(setup.effectiveFrom).toLocaleDateString() : "",
      validTo: setup.effectiveTo ? new Date(setup.effectiveTo).toLocaleDateString() : "",
      idEmployee: setup.idEmployee,
      idLeaveTemplate: setup.idLeaveTemplate,
      validFromRaw: setup.effectiveFrom,
      validToRaw: setup.effectiveTo,
      details: setup.details || [], // Store details array for template allocations
      };
    });
  }, [employeeLeaveSetupList, employeeList]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return employeeLeaveData.slice(startIndex, endIndex);
  }, [employeeLeaveData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(employeeLeaveData.length / rowsPerPage);

  const handlePageChange = (page) => setCurrentPage(page);

  const columns = [
    { key: "employeeCode", label: "Employee Code" },
    { key: "employeeName", label: "Employee Name" },
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
    handleReset();
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

  const handleSubmit = async () => {
    setFormError("");

    // Validation
    if (!selectedEmployee) {
      setFormError("Employee Name is required.");
      return;
    }

    if (!selectedTemplate) {
      setFormError("Template Name is required.");
      return;
    }

    if (!validFrom) {
      setFormError("Valid From date is required.");
      return;
    }

    if (!validTo) {
      setFormError("Valid To date is required.");
      return;
    }

    // Validate date range
    if (validFrom > validTo) {
      setFormError("Valid From date must be before Valid To date.");
      return;
    }

    const configData = {
      idEmployeeLeaveConfig: isEditing ? editingConfigId : 0,
      idEmployee: parseInt(selectedEmployee),
      idLeaveTemplate: parseInt(selectedTemplate),
      effectiveFrom: validFrom.toISOString(),
      effectiveTo: validTo.toISOString(),
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
      }
    } catch (error) {
      console.error("Error saving employee leave config:", error);
      toast.error("Failed to save employee leave config", {
        position: "top-right",
        autoClose: 4000,
      });
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
              <h5 className="m-0">List of Employee Leave Setup</h5>
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
                <div className="col-md-8">
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

  // Year dropdown options
  const yearOptions = useMemo(() => {
    return [
      { value: "", label: "Select Year" },
      ...workYears.map((year) => ({
        value: String(year.idWorkYear),
        label: year.displayText,
        workDateFrom: year.workDateFrom,
        workDateTo: year.workDateTo,
      })),
    ];
  }, [workYears]);

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

  // Handle Year selection - auto-populate Valid From and Valid To (only for new records)
  const handleYearChange = (e) => {
    const yearId = e.target.value;
    setSelectedYear(yearId);
    setFormError("");

    // Only auto-populate dates when NOT in edit mode
    if (!isEditing) {
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
      } else {
        setValidFrom(null);
        setValidTo(null);
      }
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

    // Call parent submit
    onSubmit();
  };

  useEffect(() => {
    const modalElement = document.getElementById("employeeLeaveSetupModal");
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement, {
        focus: false,
        backdrop: "static",
        keyboard: false,
      });
      modal.show();

      modalElement.addEventListener("hidden.bs.modal", onClose);
      return () => {
        modal.dispose();
        modalElement.removeEventListener("hidden.bs.modal", onClose);
      };
    }
  }, [onClose]);

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

        const result = await dispatch(addOrUpdateEmployeeLeaveConfigDetails(payload));

        if (result.payload && result.payload.success) {
          toast.success("Allocation updated successfully!", {
            position: "top-right",
            autoClose: 2000,
          });
        }
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
              {isEditing ? "Update Employee Leave Setup" : "Add Employee Leave Setup"}
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <div className="row">
              <div className="col-md-6">
                <Dropdown
                  label="Employee Name"
                  name="employeeName"
                  options={employeeOptions}
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
              <div className="col-md-4">
                <label className="form-label mb-1">Valid From</label>
                <br />
                <DatePicker
                  className="form-control"
                  dateFormat="MM/dd/yyyy"
                  placeholderText="Valid From"
                  selected={validFrom}
                  onChange={handleValidFromChange}
                  showYearDropdown
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
                  showYearDropdown
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
                              disabled={savingAllocation}
                            />
                          </td>
                          <td>{allocation.carriedForwardDays || 0}</td>
                          <td>
                            {(allocation.allocatedDays || 0) +
                              (allocation.carriedForwardDays || 0)}
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
