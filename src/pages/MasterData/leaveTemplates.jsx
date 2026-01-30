import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Grid from "../../components/grid";
import Button from "../../components/button";
import Input from "../../components/input";
import Label from "../../components/Label";
import Dropdown from "../../components/Dropdown";
import Pagination from "../../components/pagination";
import {
  fetchLeaveTemplates,
  addUpdateLeaveTemplate,
  fetchLeaveTemplateById,
  addUpdateLeaveTemplateDetails,
  fetchDesignationList,
  fetchLeaveTemplateDetailById,
  submitLeaveTemplateForApproval,
  resetLeaveTemplateDetailById
} from "../../redux/reducers/leaveTemplate";
import { fetchLeaveTypes } from "../../redux/reducers/leaveType";
import CommonService from "../../core/services/CommonService";
import secureLocalStorage from "react-secure-storage";
import { toast } from "react-toastify";

const LeaveTemplates = () => {
  const dispatch = useDispatch();
  const { leaveTemplates, loading, error } = useSelector((state) => state.leaveTemplate);

  const [templateName, setTemplateName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [templateNameError, setTemplateNameError] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workYears, setWorkYears] = useState([]);

  // Fetch work years from API on component mount
  useEffect(() => {
    const fetchWorkYears = async () => {
      const result = await CommonService.getAllWorkYears();
      if (!result.error && result.data) {
        setWorkYears(result.data);
      }
    };
    fetchWorkYears();
  }, []);

  // Year options from API for form dropdown
  const yearOptions = useMemo(() => {
    return workYears.map((year) => ({
      value: String(year.idWorkYear),
      label: year.displayText,
    }));
  }, [workYears]);

  // Year filter options from API with "All Years" option
  const yearFilterOptions = useMemo(() => {
    return [
      { value: "", label: "All Years" },
      ...workYears.map((year) => ({
        value: String(year.idWorkYear),
        label: year.displayText,
      })),
    ];
  }, [workYears]);

  // Status options (matching API values)
  const statusOptions = [
    { value: "ALL", label: "All" },
    { value: "DRAFT", label: "Draft" },
    { value: "SUBMITTED", label: "Submitted" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
  ];

  // Fetch leave templates on component mount and when filters change
  useEffect(() => {
    const status = statusFilter || "ALL";
    const idYear = yearFilter || "";
    const searchText = searchQuery || "";

    dispatch(fetchLeaveTemplates({ status, idYear, searchText }));
  }, [dispatch, statusFilter, yearFilter, searchQuery]);

  // Helper function to get displayText from idWorkYear
  const getYearDisplayText = (idYear) => {
    const yearData = workYears.find((y) => y.idWorkYear === idYear);
    return yearData ? yearData.displayText : String(idYear);
  };

  // Get templates data from API response
  const templatesData = useMemo(() => {
    if (!leaveTemplates || !leaveTemplates.data) return [];

    return leaveTemplates.data.map((template) => ({
      idLeaveTemplate: template.idLeaveTemplate,
      idYear: template.idYear,
      year: getYearDisplayText(template.idYear),
      templateName: template.leaveTemplateName,
      description: template.leaveTemplateDesc || "",
      status: (template.approvlStatus || "DRAFT").toUpperCase(),
      viewDetails: template.idLeaveTemplate,
    }));
  }, [leaveTemplates, workYears]);

  const paginatedTemplates = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return templatesData.slice(startIndex, endIndex);
  }, [templatesData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(templatesData.length / rowsPerPage);

  const handlePageChange = (page) => setCurrentPage(page);

  const getStatusBadgeClass = (status) => {
    const upperStatus = status?.toUpperCase();
    switch (upperStatus) {
      case "APPROVED":
        return "bg-label-success";
      case "SUBMITTED":
        return "bg-label-info";
      case "REJECTED":
        return "bg-label-danger";
      case "DRAFT":
      default:
        return "bg-label-warning";
    }
  };

  const formatStatusLabel = (status) => {
    if (!status) return "Draft";
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case "DRAFT":
        return "Draft";
      case "SUBMITTED":
        return "Submitted";
      case "APPROVED":
        return "Approved";
      case "REJECTED":
        return "Rejected";
      default:
        // Handle any format by capitalizing first letter
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }
  };

  const columns = [
    { key: "year", label: "Year" },
    { key: "templateName", label: "Template Name" },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <span className={`badge ${getStatusBadgeClass(value)}`}>
          {formatStatusLabel(value)}
        </span>
      ),
    },
    {
      key: "viewDetails",
      label: "Template Details",
      render: (id) => (
        <button
          type="button"
          className="btn btn-sm btn-link p-0"
          onClick={() => handleViewDetails(id)}
        >
          View
        </button>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (_, row) => (
        row.status !== "APPROVED" && (
          <div className="text-end">
            <button
              type="button"
              className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
              onClick={() => handleEdit(row.idLeaveTemplate)}
            >
              <span className="bx bx-pencil"></span>
            </button>
          </div>
        )
      ),
    },
  ];

  const handleEdit = (id) => {
    const template = templatesData.find((t) => t.idLeaveTemplate === id);
    if (template) {
      setTemplateName(template.templateName);
      setDescription(template.description);
      setSelectedYear(String(template.idYear));
      setStatus(template.status);
      setEditingTemplateId(template.idLeaveTemplate);
      setIsEditing(true);
    }
  };

  const handleViewDetails = (id) => {
    const template = templatesData.find((t) => t.idLeaveTemplate === id);
    setSelectedTemplate(template);
    setShowDetailsModal(true);
  };

  const getCurrentUserId = () => {
    const user = secureLocalStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      return userData.idEmployee || 1;
    }
    return 1;
  };

  const handleSubmit = async () => {
    setTemplateNameError("");

    if (!templateName.trim()) {
      setTemplateNameError("Template Name is required.");
      return;
    }

    if (!selectedYear) {
      setTemplateNameError("Year is required.");
      return;
    }

    const templateData = {
      idLeaveTemplate: isEditing ? editingTemplateId : 0,
      leaveTemplateName: templateName,
      leaveTemplateDesc: description || "",
      idYear: parseInt(selectedYear),
      createdBy: getCurrentUserId(),
      approvlStatus: "DRAFT",
    };

    try {
      setIsSubmitting(true);
      const resultAction = await dispatch(addUpdateLeaveTemplate(templateData));

      if (resultAction.payload && resultAction.payload.success) {
        toast.success(
          isEditing
            ? "Leave template updated successfully!"
            : "Leave template added successfully!",
          {
            position: 'top-right',
            autoClose: 4000
          }
        );
        handleReset();
        // Refresh the list
        const status = statusFilter || "ALL";
        const idYear = yearFilter || "";
        const searchText = searchQuery || "";
        dispatch(fetchLeaveTemplates({ status, idYear, searchText }));
      } else {
        toast.error(resultAction.payload?.message || "Failed to save leave template", {
          position: 'top-right',
          autoClose: 4000
        });
      }
    } catch (error) {
      console.error("Error saving leave template:", error);
      toast.error("Failed to save leave template", {
        position: 'top-right',
        autoClose: 4000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTemplateName("");
    setDescription("");
    setSelectedYear("");
    setStatus("DRAFT");
    setTemplateNameError("");
    setIsEditing(false);
    setEditingTemplateId(null);
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">List of Leave Templates</h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-3">
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
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    {statusOptions.map((opt) => (
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
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <i className="bx bx-search"></i>
                  </div>
                </div>
              </div>
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : error ? (
                <div className="text-danger text-center py-4">{error}</div>
              ) : (
                <Grid
                  columns={columns}
                  data={paginatedTemplates}
                  idKey="idLeaveTemplate"
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

        <div className="col-lg-4">
          <div className="card">
            <div className="card-header pb-3">
              <h5 className="m-0">Add / Update Leave Template</h5>
            </div>
            <div className="card-body">
              <Dropdown
                label="Year"
                name="year"
                options={yearOptions}
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              />
              <Input
                label="Template Name"
                name="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                maxLength="100"
                error={templateNameError}
              />
              <div className="form-group mb-2">
                <Label text="Description" />
                <textarea
                  className="form-control"
                  rows="3"
                  maxLength="500"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ marginTop: "7px" }}
                ></textarea>
              </div>
              <div className="form-group mb-3">
                <label className="form-label mb-1">Status</label>
                <input
                  type="text"
                  className="form-control"
                  value={formatStatusLabel(status)}
                  readOnly
                  disabled
                  style={{ marginTop: "7px", backgroundColor: "#e9ecef" }}
                />
              </div>
              <div className="text-center">
                <Button
                  type="button"
                  className="btn btn-primary px-4 me-2"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
                <Button
                  type="button"
                  className="btn btn-outline-secondary px-4"
                  onClick={handleReset}
                  disabled={isSubmitting}
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDetailsModal && selectedTemplate && (
        <TemplateDetailsModal
          template={selectedTemplate}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedTemplate(null);
          }}
        />
      )}
    </div>
  );
};

const TemplateDetailsModal = ({ template, onClose }) => {
  const dispatch = useDispatch();
  const { leaveTemplateDetails } = useSelector((state) => state.leaveTemplate);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [showLeaveTypeModal, setShowLeaveTypeModal] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState(null);

  useEffect(() => {
    // Fetch leave template details by ID
    if (template?.idLeaveTemplate) {
      dispatch(fetchLeaveTemplateById(template.idLeaveTemplate));
    }
  }, [dispatch, template?.idLeaveTemplate]);

  useEffect(() => {
    // Update leaveTypes when leaveTemplateDetails is fetched
    if (leaveTemplateDetails && leaveTemplateDetails.data) {
      const mappedLeaveTypes = leaveTemplateDetails.data.leaveTemplateDetails?.map((detail) => ({
        idLeaveTemplateDetails: detail.idLeaveTemplateDetails,
        idLeaveTemplate: detail.idLeaveTemplate,
        idLeaveType: detail.idLeaveType,
        leaveType: detail.leaveTypeName,
        leaveCode: detail.leaveCode,
        paid: detail.isPaid ? "Yes" : "No",
        maxPerYear: detail.maxLeavesPerYear,
        maxPerMonth: detail.maxLeavesPerMonth,
        carryForward: detail.isCarryForwardAllowed ? "Yes" : "No",
        approvalLevels: detail.requiredApprovalLevel,
        status: "Active",
        // Store full details for editing
        fullDetails: detail,
      })) || [];
      setLeaveTypes(mappedLeaveTypes);
    }
  }, [leaveTemplateDetails]);

  useEffect(() => {
    const modalElement = document.getElementById("templateDetailsModal");
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement, {
        focus: false,        // 🔑 CRITICAL
        backdrop: 'static',
        keyboard: false
      });
      modal.show();

      modalElement.addEventListener("hidden.bs.modal", onClose);
      return () => {
        modal.dispose();
        modalElement.removeEventListener("hidden.bs.modal", onClose);
      };
    }
  }, [onClose]);

  const getStatusBadgeClass = (status) => {
    return status === "Active" ? "bg-label-success" : "bg-label-warning";
  };

  const handleEditLeaveType = (id) => {
    const leaveType = leaveTypes.find((lt) => lt.idLeaveTemplateDetails === id);
    setSelectedLeaveType(leaveType);
    setShowLeaveTypeModal(true);
  };

  const handleAddLeaveType = () => {
    dispatch(resetLeaveTemplateDetailById());
    setSelectedLeaveType(null);
    setShowLeaveTypeModal(true);
  };

  const handleLeaveTypeSaved = () => {
    // Refresh the template details after saving
    if (template?.idLeaveTemplate) {
      dispatch(fetchLeaveTemplateById(template.idLeaveTemplate));
    }
  };

  const handleSubmitForApproval = async () => {
    if (!template?.idLeaveTemplate) {
      toast.error("No leave template selected", {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    try {
      const resultAction = await dispatch(submitLeaveTemplateForApproval(template.idLeaveTemplate));

      if (submitLeaveTemplateForApproval.fulfilled.match(resultAction)) {
        if (resultAction.payload && resultAction.payload.success) {
          toast.success("Leave template submitted for approval successfully!", {
            position: 'top-right',
            autoClose: 4000
          });
          // Refresh the template list
          const status = statusFilter || "ALL";
          const idYear = yearFilter || "";
          const searchText = searchQuery || "";
          dispatch(fetchLeaveTemplates({ status, idYear, searchText }));
        } else {
          toast.error(resultAction.payload?.message || "Failed to submit for approval", {
            position: 'top-right',
            autoClose: 4000
          });
        }
      } else if (submitLeaveTemplateForApproval.rejected.match(resultAction)) {
        const errorMsg = resultAction.payload?.message || resultAction.error?.message || "Failed to submit for approval";
        toast.error(errorMsg, {
          position: 'top-right',
          autoClose: 4000
        });
      }
    } catch (error) {
      console.error("Error submitting for approval:", error);
      toast.error("Failed to submit for approval", {
        position: 'top-right',
        autoClose: 4000
      });
    }
  };

  return (
    <>
      <div
        className="modal fade"
        id="templateDetailsModal"
        tabIndex="-1"
        aria-hidden="true"
        data-bs-backdrop="static"
        data-bs-keyboard="false"
        style={{
        zIndex: 1100
        }}
      >
        <div className="modal-dialog modal-xl modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Template Details</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label fw-bold">Year:</label>
                  <p>{template.year}</p>
                </div>
                <div className="col-md-8">
                  <label className="form-label fw-bold">Template Name:</label>
                  <p>{template.templateName}</p>
                </div>
              </div>

              <div className="mb-3">
                <h6 className="fw-bold">Leave Types in Template</h6>
                <div className="table-responsive">
                  <table className="table table-bordered table-sm">
                    <thead>
                      <tr>
                        <th>Leave Type</th>
                        <th>Paid</th>
                        <th>Max / Year</th>
                        <th>Max / Month</th>
                        <th>Carry Forward</th>
                        <th>Approval Levels</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveTypes.length > 0 ? (
                        leaveTypes.map((lt) => (
                          <tr key={lt.idLeaveTemplateDetails}>
                            <td>{lt.leaveType}</td>
                            <td>{lt.paid}</td>
                            <td>{lt.maxPerYear}</td>
                            <td>{lt.maxPerMonth}</td>
                            <td>{lt.carryForward}</td>
                            <td>{lt.approvalLevels}</td>
                            <td>
                              <span className={`badge ${getStatusBadgeClass(lt.status)}`}>
                                {lt.status}
                              </span>
                            </td>
                            <td>
                              {template.status !== "APPROVED" && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-icon btn-outline-secondary px-2 border-0"
                                  onClick={() => handleEditLeaveType(lt.idLeaveTemplateDetails)}
                                >
                                  <span className="bx bx-pencil"></span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="text-center">
                            No leave types added yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {template.status !== "APPROVED" && (
                  <div className="d-flex justify-content-between mt-2">
                    <Button
                      type="button"
                      className="btn btn-primary px-4"
                      onClick={handleSubmitForApproval}
                    >
                      Submit for Approval
                    </Button>
                    <Button
                      type="button"
                      className="btn btn-primary px-4"
                      onClick={handleAddLeaveType}
                    >
                      Add Leave Type
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showLeaveTypeModal && (
        <LeaveTypeModal
          leaveType={selectedLeaveType}
          templateYear={template.year}
          templateIdYear={template.idYear}
          templateId={template.idLeaveTemplate}
          onClose={() => {
            setShowLeaveTypeModal(false);
            setSelectedLeaveType(null);
          }}
          onSave={handleLeaveTypeSaved}
        />
      )}
    </>
  );
};

const LeaveTypeModal = ({ leaveType, templateYear, templateIdYear, templateId, onClose, onSave }) => {
  const dispatch = useDispatch();
  const { designationList, leaveTemplateDetailById } = useSelector((state) => state.leaveTemplate);
  const { leaveTypes: leaveTypesList } = useSelector((state) => state.leaveType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailsLoaded, setDetailsLoaded] = useState(false);

  // Use API fetched details if available, otherwise use the passed fullDetails
  const fullDetails = leaveTemplateDetailById?.data || leaveType?.fullDetails;

  const [year, setYear] = useState(templateYear || "");
  const [idLeaveType, setIdLeaveType] = useState(fullDetails?.idLeaveType ? String(fullDetails.idLeaveType) : "");
  const [selectedLeaveType, setSelectedLeaveType] = useState(fullDetails?.leaveTypeName || "");
  const [leaveCode, setLeaveCode] = useState(fullDetails?.leaveCode || "");
  const [status, setStatus] = useState("Active");
  const [isPaid, setIsPaid] = useState(fullDetails?.isPaid !== false ? "Yes" : "No");
  const [salaryDeduction, setSalaryDeduction] = useState(fullDetails?.salaryDeductionPercent ? String(fullDetails.salaryDeductionPercent) : "");
  const [approvalLevels, setApprovalLevels] = useState(fullDetails?.requiredApprovalLevel || 1);
  const [maxPerYear, setMaxPerYear] = useState(fullDetails?.maxLeavesPerYear ? String(fullDetails.maxLeavesPerYear) : "");
  const [maxPerMonth, setMaxPerMonth] = useState(fullDetails?.maxLeavesPerMonth ? String(fullDetails.maxLeavesPerMonth) : "");
  const [backdatedAllowed, setBackdatedAllowed] = useState(fullDetails?.allowBackdatedLeave ? "Yes" : "No");
  const [backdateLimit, setBackdateLimit] = useState(fullDetails?.backdateLimitDays ? String(fullDetails.backdateLimitDays) : "");
  const [allowHalfDay, setAllowHalfDay] = useState(fullDetails?.allowHalfDay ? "Yes" : "No");
  const [carryForwardAllowed, setCarryForwardAllowed] = useState(fullDetails?.isCarryForwardAllowed ? "Yes" : "No");
  const [carryForwardLimit, setCarryForwardLimit] = useState(fullDetails?.maxCarryForwardDays ? String(fullDetails.maxCarryForwardDays) : "");
  const [applicableGender, setApplicableGender] = useState(fullDetails?.applicableGender || "BOTH");
  const [includeHolidaysBetween, setIncludeHolidaysBetween] = useState(fullDetails?.includeHolidaysBetween ? "Yes" : "No");
  const [requiresDocument, setRequiresDocument] = useState(fullDetails?.requiresDocument ? "Yes" : "No");
  const [docRequiredAfterDays, setDocRequiredAfterDays] = useState(fullDetails?.documentRequiredAfterDays ? String(fullDetails.documentRequiredAfterDays) : "");

  // Approval workflow state
  const [approvers, setApprovers] = useState([
    { level: 1, approverType: "ROLE", approver: "" },
    { level: 2, approverType: "ROLE", approver: "" },
    { level: 3, approverType: "ROLE", approver: "" },
    { level: 4, approverType: "ROLE", approver: "" },
  ]);

  const leaveTypeOptions = useMemo(() => {
    if (leaveTypesList && leaveTypesList.data) {
      return [
        { value: "", label: "Select Leave Type" },
        ...leaveTypesList.data.map((lt) => ({
          value: String(lt.idLeaveType),
          label: lt.leaveTypeName,
          code: lt.leaveCode,
        })),
      ];
    }
    return [{ value: "", label: "Select Leave Type" }];
  }, [leaveTypesList]);

  const roleOptions = useMemo(() => {
    if (designationList && designationList.data) {
      return [
        { value: "", label: "Select Role" },
        ...designationList.data.map((designation) => ({
          value: String(designation.idDesignation),
          label: designation.designationName,
        })),
      ];
    }
    return [{ value: "", label: "Select Role" }];
  }, [designationList]);

  // Fetch designation list and leave types on mount
  useEffect(() => {
    dispatch(fetchDesignationList());
    dispatch(fetchLeaveTypes());
  }, [dispatch]);

  // Reset form fields when adding new (leaveType is null)
  useEffect(() => {
    if (!leaveType) {
      setYear(templateYear || "");
      setIdLeaveType("");
      setSelectedLeaveType("");
      setLeaveCode("");
      setStatus("Active");
      setIsPaid("Yes");
      setSalaryDeduction("");
      setApprovalLevels(1);
      setMaxPerYear("");
      setMaxPerMonth("");
      setBackdatedAllowed("No");
      setBackdateLimit("");
      setAllowHalfDay("No");
      setCarryForwardAllowed("No");
      setCarryForwardLimit("");
      setApplicableGender("BOTH");
      setIncludeHolidaysBetween("No");
      setRequiresDocument("No");
      setDocRequiredAfterDays("");
      setApprovers([
        { level: 1, approverType: "ROLE", approver: "" },
        { level: 2, approverType: "ROLE", approver: "" },
        { level: 3, approverType: "ROLE", approver: "" },
        { level: 4, approverType: "ROLE", approver: "" },
      ]);
      setDetailsLoaded(false);
    }
  }, [leaveType, templateYear]);

  // Fetch complete leave template detail when editing
  useEffect(() => {
    if (leaveType?.idLeaveTemplateDetails && !detailsLoaded) {
      dispatch(fetchLeaveTemplateDetailById(leaveType.idLeaveTemplateDetails));
      setDetailsLoaded(true);
    }
  }, [dispatch, leaveType?.idLeaveTemplateDetails, detailsLoaded]);

  // Update form fields when API data is loaded
  useEffect(() => {
    if (leaveTemplateDetailById?.data && leaveType?.idLeaveTemplateDetails) {
      const detail = leaveTemplateDetailById.data;

      // Update all form fields
      setYear(templateYear || "");
      setIdLeaveType(detail.idLeaveType ? String(detail.idLeaveType) : "");
      setSelectedLeaveType(detail.leaveTypeName || "");
      setLeaveCode(detail.leaveCode || "");
      setIsPaid(detail.isPaid ? "Yes" : "No");
      setSalaryDeduction(detail.salaryDeductionPercent ? String(detail.salaryDeductionPercent) : "");
      setApprovalLevels(detail.requiredApprovalLevel || 1);
      setMaxPerYear(detail.maxLeavesPerYear ? String(detail.maxLeavesPerYear) : "");
      setMaxPerMonth(detail.maxLeavesPerMonth ? String(detail.maxLeavesPerMonth) : "");
      setBackdatedAllowed(detail.allowBackdatedLeave ? "Yes" : "No");
      setBackdateLimit(detail.backdateLimitDays ? String(detail.backdateLimitDays) : "");
      setAllowHalfDay(detail.allowHalfDay ? "Yes" : "No");
      setCarryForwardAllowed(detail.isCarryForwardAllowed ? "Yes" : "No");
      setCarryForwardLimit(detail.maxCarryForwardDays ? String(detail.maxCarryForwardDays) : "");
      setApplicableGender(detail.applicableGender || "BOTH");
      setIncludeHolidaysBetween(detail.includeHolidaysBetween ? "Yes" : "No");
      setRequiresDocument(detail.requiresDocument ? "Yes" : "No");
      setDocRequiredAfterDays(detail.documentRequiredAfterDays ? String(detail.documentRequiredAfterDays) : "");

      // Update approvers from workflow details
      if (detail.leaveWorkFlowDetails && detail.leaveWorkFlowDetails.length > 0) {
        const updatedApprovers = [
          { level: 1, approverType: "ROLE", approver: "" },
          { level: 2, approverType: "ROLE", approver: "" },
          { level: 3, approverType: "ROLE", approver: "" },
          { level: 4, approverType: "ROLE", approver: "" },
        ];

        detail.leaveWorkFlowDetails.forEach((workflow) => {
          const index = workflow.levelNumber - 1;
          if (index >= 0 && index < 4) {
            // Convert approvalAuthorityID to string to match dropdown value format
            const approverId = workflow.approvalAuthorityID ? String(workflow.approvalAuthorityID) : "";
            updatedApprovers[index] = {
              level: workflow.levelNumber,
              approverType: workflow.approvalAuthorityType || "ROLE",
              approver: approverId,
            };
            console.log(`Setting approver for level ${workflow.levelNumber}: ID=${approverId}, Type=${workflow.approvalAuthorityType}`);
          }
        });

        console.log("Loaded workflow details:", detail.leaveWorkFlowDetails);
        console.log("Updated approvers:", updatedApprovers);
        console.log("Current roleOptions:", roleOptions);

        setApprovers(updatedApprovers);
      }
    }
  }, [leaveTemplateDetailById, leaveType?.idLeaveTemplateDetails, templateYear, roleOptions]);

  // Handle leave type selection
  const handleLeaveTypeChange = (e) => {
    const selectedId = e.target.value;
    setIdLeaveType(selectedId);

    // Find the selected leave type to get its name and code
    const selected = leaveTypeOptions.find(opt => opt.value === selectedId);
    if (selected) {
      setSelectedLeaveType(selected.label);
      setLeaveCode(selected.code || "");
    }
  };

  // Don't use Bootstrap Modal JS for nested modals - just manage with React state
  useEffect(() => {
    // Ensure body has modal-open class
    document.body.classList.add('modal-open');

    return () => {
      // Keep modal-open if parent modal is still open
      const parentModal = document.getElementById("templateDetailsModal");
      if (parentModal && parentModal.classList.contains('show')) {
        document.body.classList.add('modal-open');
      }
    };
  }, []);

  const handleSubmit = async () => {
    // Validation: Leave type must be selected
    if (!idLeaveType) {
      toast.error("Please select a leave type", {
        position: 'top-right',
        autoClose: 4000
      });
      return;
    }

    // Build workflow details
    const leaveWorkFlowDetails = approvalLevels > 0 ? approvers.slice(0, approvalLevels).map((approver, index) => ({
      idWorkFlowConfigDetail: 0,
      idWorkFlowConfig: 0,
      levelNumber: index + 1,
      approvalAuthorityType: approver.approverType,
      approvalAuthorityID: approver.approverType === "ROLE" ? parseInt(approver.approver) || 0 : 0,
      approvalStatusName: "APPROVED",
    })) : [];

    const payload = {
      idLeaveTemplateDetails: fullDetails?.idLeaveTemplateDetails || 0,
      idLeaveTemplate: templateId,
      idLeaveType: parseInt(idLeaveType) || 0,
      leaveTypeName: selectedLeaveType,
      leaveCode: leaveCode,
      idYear: templateIdYear,
      effectiveFrom: new Date().toISOString(),
      effectiveTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      applicableGender: applicableGender,
      isPaid: isPaid === "Yes",
      salaryDeductionPercent: isPaid === "No" ? parseFloat(salaryDeduction) || 0 : 0,
      allowHalfDay: allowHalfDay === "Yes",
      requiresApproval: approvalLevels > 0,
      requiredApprovalLevel: parseInt(approvalLevels) || 0,
      requiresDocument: requiresDocument === "Yes",
      documentRequiredAfterDays: requiresDocument === "Yes" ? parseInt(docRequiredAfterDays) || 0 : 0,
      isCarryForwardAllowed: carryForwardAllowed === "Yes",
      maxCarryForwardDays: carryForwardAllowed === "Yes" ? parseInt(carryForwardLimit) || 0 : 0,
      includeHolidaysBetween: includeHolidaysBetween === "Yes",
      maxLeavesPerYear: parseInt(maxPerYear) || 0,
      maxLeavesPerMonth: parseInt(maxPerMonth) || 0,
      allowBackdatedLeave: backdatedAllowed === "Yes",
      backdateLimitDays: backdatedAllowed === "Yes" ? parseInt(backdateLimit) || 0 : 0,
      leaveWorkFlowDetails: leaveWorkFlowDetails,
    };

    try {
      setIsSubmitting(true);
      console.log("Submitting payload:", JSON.stringify(payload, null, 2));
      const resultAction = await dispatch(addUpdateLeaveTemplateDetails(payload));
      console.log("API Response:", resultAction);
      console.log("Result type:", resultAction.type);
      console.log("Result meta:", resultAction.meta);

      // Check if the action was fulfilled (not rejected)
      if (addUpdateLeaveTemplateDetails.fulfilled.match(resultAction)) {
        // Success - check payload structure
        console.log("Action fulfilled - payload:", resultAction.payload);

        if (resultAction.payload && (resultAction.payload.success === true || resultAction.payload.success === "true")) {
          toast.success(
            fullDetails ? "Leave type updated successfully!" : "Leave type added successfully!",
            {
              position: 'top-right',
              autoClose: 4000
            }
          );
          onSave();
          handleClose();
        } else {
          // API returned but without success flag
          const errorMsg = resultAction.payload?.message || "Failed to save leave type - no success flag";
          console.error("Save failed - no success flag:", resultAction.payload);
          toast.error(errorMsg, {
            position: 'top-right',
            autoClose: 4000
          });
        }
      } else if (addUpdateLeaveTemplateDetails.rejected.match(resultAction)) {
        // Request was rejected
        const errorMsg = resultAction.payload?.message || resultAction.error?.message || "Failed to save leave type";
        console.error("Request rejected:", errorMsg, resultAction.payload);
        toast.error(errorMsg, {
          position: 'top-right',
          autoClose: 4000
        });
      }
    } catch (error) {
      console.error("Error saving leave type:", error);
      toast.error(error.message || "Failed to save leave type", {
        position: 'top-right',
        autoClose: 4000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIdLeaveType("");
    setSelectedLeaveType("");
    setLeaveCode("");
    setStatus("Active");
    setIsPaid("Yes");
    setSalaryDeduction("");
    setApprovalLevels(0);
    setMaxPerYear("");
    setMaxPerMonth("");
    setBackdatedAllowed("No");
    setBackdateLimit("");
    setAllowHalfDay("No");
    setCarryForwardAllowed("No");
    setCarryForwardLimit("");
    setApplicableGender("BOTH");
    setIncludeHolidaysBetween("No");
    setRequiresDocument("No");
    setDocRequiredAfterDays("");
    setApprovers([
      { level: 1, approverType: "ROLE", approver: "" },
      { level: 2, approverType: "ROLE", approver: "" },
      { level: 3, approverType: "ROLE", approver: "" },
      { level: 4, approverType: "ROLE", approver: "" },
    ]);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <>
      {/* Custom backdrop for nested modal */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1110,
          pointerEvents: 'none',
        }}
      />
      <div
        className="modal show d-block"
        id="leaveTypeModal"
        tabIndex="-1"
        role="dialog"
        style={{
          zIndex: 1120,
          display: 'block',
          pointerEvents: 'auto'
        }}
      >
        <div className="modal-dialog modal-xl modal-dialog-centered">
          <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Add / Update Template Leave Type</h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <h6 className="fw-bold mb-3">Basic</h6>
            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label mb-1">Year</label>
                <input
                  type="text"
                  className="form-control"
                  value={year}
                  readOnly
                  disabled
                  style={{ marginTop: "7px", backgroundColor: "#e9ecef" }}
                />
              </div>
              <div className="col-md-4">
                <Dropdown
                  label="Leave Type"
                  name="leaveType"
                  options={leaveTypeOptions}
                  value={idLeaveType}
                  onChange={handleLeaveTypeChange}
                  disabled={!!fullDetails}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label mb-1">Status</label>
                <input
                  type="text"
                  className="form-control"
                  value={status}
                  readOnly
                  disabled
                  style={{ marginTop: "7px", backgroundColor: "#e9ecef" }}
                />
              </div>
            </div>

            
              <div className="row mb-3">
                <div className="col-md-4">
                  <Dropdown
                    label="Paid"
                    name="paid"
                    options={[
                      { value: "Yes", label: "Yes" },
                      { value: "No", label: "No" },
                    ]}
                    value={isPaid}
                    onChange={(e) => setIsPaid(e.target.value)}
                  />
                </div>
                {isPaid === "No" && (
                <div className="col-md-4">
                  <Input
                    label="Salary Deduction %"
                    name="salaryDeduction"
                    type="number"
                    value={salaryDeduction}
                    onChange={(e) => setSalaryDeduction(e.target.value)}
                  />
                </div> 
                )}
              </div>

            <hr />
            <h6 className="fw-bold mb-3">Approval Workflow</h6>
            <div className="row mb-3">
              <div className="col-md-4">
                <Dropdown
                  label="No. of Approval Levels"
                  name="approvalLevels"
                  options={[
                    { value: "1", label: "1" },
                    { value: "2", label: "2" },
                    { value: "3", label: "3" },
                    { value: "4", label: "4" },
                  ]}
                  value={String(approvalLevels)}
                  onChange={(e) => setApprovalLevels(Number(e.target.value))}
                />
              </div>
            </div>

            {Array.from({ length: approvalLevels }, (_, i) => i + 1).map((level) => (
              <div key={level} className="row mb-2">
                <div className="col-md-3">
                  <label className="form-label mb-1">Approver Level {level}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={`Level ${level}`}
                    readOnly
                    disabled
                    style={{ marginTop: "7px", backgroundColor: "#e9ecef" }}
                  />
                </div>
                <div className="col-md-3">
                  <Dropdown
                    label="Approver Type"
                    name={`approverType${level}`}
                    options={[
                      { value: "ROLE", label: "ROLE" },
                      { value: "REPOFFICER", label: "REPOFFICER" },
                    ]}
                    value={approvers[level - 1].approverType}
                    onChange={(e) => {
                      const newApprovers = [...approvers];
                      newApprovers[level - 1].approverType = e.target.value;
                      newApprovers[level - 1].approver = "";
                      setApprovers(newApprovers);
                    }}
                  />
                </div>
                <div className="col-md-6">
                  {approvers[level - 1].approverType === "REPOFFICER" ? (
                    <div className="form-group mb-2">
                      <label className="form-label mb-1">Approver</label>
                      <input
                        type="text"
                        className="form-control"
                        value=""
                        disabled
                        readOnly
                        style={{ marginTop: "7px", backgroundColor: "#e9ecef" }}
                      />
                    </div>
                  ) : (
                    <Dropdown
                      label="Approver"
                      name={`approver${level}`}
                      options={roleOptions}
                      value={approvers[level - 1].approver}
                      onChange={(e) => {
                        const newApprovers = [...approvers];
                        newApprovers[level - 1].approver = e.target.value;
                        setApprovers(newApprovers);
                      }}
                    />
                  )}
                </div>
              </div>
            ))}

            <hr />
            <h6 className="fw-bold mb-3">Limits & Dates</h6>
            <div className="row mb-3">
              <div className="col-md-3">
                <Input
                  label="Max Leaves Per Year"
                  name="maxPerYear"
                  type="number"
                  value={maxPerYear}
                  onChange={(e) => setMaxPerYear(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <Input
                  label="Max Leaves Per Month"
                  name="maxPerMonth"
                  type="number"
                  value={maxPerMonth}
                  onChange={(e) => setMaxPerMonth(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <Dropdown
                  label="Backdated Leave Allowed"
                  name="backdatedAllowed"
                  options={[
                    { value: "Yes", label: "Yes" },
                    { value: "No", label: "No" },
                  ]}
                  value={backdatedAllowed}
                  onChange={(e) => setBackdatedAllowed(e.target.value)}
                />
              </div>
              {backdatedAllowed === "Yes" && (
                <div className="col-md-3">
                  <Input
                    label="Backdate Limit (days)"
                    name="backdateLimit"
                    type="number"
                    placeholder="e.g., 2"
                    value={backdateLimit}
                    onChange={(e) => setBackdateLimit(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="row mb-3">
              <div className="col-md-4">
                <Dropdown
                  label="Allow Half Day"
                  name="allowHalfDay"
                  options={[
                    { value: "Yes", label: "Yes" },
                    { value: "No", label: "No" },
                  ]}
                  value={allowHalfDay}
                  onChange={(e) => setAllowHalfDay(e.target.value)}
                />
              </div>
            </div>

            <hr />
            <h6 className="fw-bold mb-3">Eligibility & Rules</h6>
            <div className="row mb-3">
              <div className="col-md-3">
                <Dropdown
                  label="Applicable Gender"
                  name="applicableGender"
                  options={[
                    { value: "BOTH", label: "Both" },
                    { value: "MALE", label: "Male" },
                    { value: "FEMALE", label: "Female" },
                  ]}
                  value={applicableGender}
                  onChange={(e) => setApplicableGender(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <Dropdown
                  label="Include Holidays Between"
                  name="includeHolidaysBetween"
                  options={[
                    { value: "Yes", label: "Yes" },
                    { value: "No", label: "No" },
                  ]}
                  value={includeHolidaysBetween}
                  onChange={(e) => setIncludeHolidaysBetween(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <Dropdown
                  label="Requires Document"
                  name="requiresDocument"
                  options={[
                    { value: "Yes", label: "Yes" },
                    { value: "No", label: "No" },
                  ]}
                  value={requiresDocument}
                  onChange={(e) => setRequiresDocument(e.target.value)}
                />
              </div>
              {requiresDocument === "Yes" && (
                <div className="col-md-3">
                  <Input
                    label="Doc Required After Days"
                    name="docRequiredAfterDays"
                    type="number"
                    placeholder="e.g., 2"
                    value={docRequiredAfterDays}
                    onChange={(e) => setDocRequiredAfterDays(e.target.value)}
                  />
                </div>
              )}
            </div>

            <hr />
            <h6 className="fw-bold mb-3">Carry Forward</h6>
            <div className="row mb-3">
              <div className="col-md-4">
                <Dropdown
                  label="Carry Forward Allowed"
                  name="carryForwardAllowed"
                  options={[
                    { value: "Yes", label: "Yes" },
                    { value: "No", label: "No" },
                  ]}
                  value={carryForwardAllowed}
                  onChange={(e) => setCarryForwardAllowed(e.target.value)}
                />
              </div>
              {carryForwardAllowed === "Yes" && (
                <div className="col-md-4">
                  <Input
                    label="Max Carry Forward Days"
                    name="carryForwardLimit"
                    type="number"
                    value={carryForwardLimit}
                    onChange={(e) => setCarryForwardLimit(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <Button
              type="button"
              className="btn btn-primary btn-sm py-2 px-4 me-2"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
            <Button
              type="button"
              className="btn btn-outline-secondary btn-sm py-2 px-4"
              onClick={handleReset}
              disabled={isSubmitting}
            >
              Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default LeaveTemplates;
