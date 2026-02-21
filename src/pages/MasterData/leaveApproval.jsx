import { useState, useMemo, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import Button from "../../components/button";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import {
  fetchLeaveApplicationsForApproval,
  approveLeaveApplication,
  rejectLeaveApplication,
  bulkApproveLeaveApplications,
  fetchLeaveDashboardEmployee,
  fetchLeaveApplicationDocuments,
} from "../../redux/reducers/leaveApproval";
import CommonService from "../../core/services/CommonService";

const LeaveApproval = () => {
  const dispatch = useDispatch();
  const { leaveApplications, loading, error, leaveDashboard, leaveDashboardLoading, leaveDocuments, leaveDocumentsLoading } = useSelector(
    (state) => state.leaveApproval
  );

  const handleDownloadDocument = (doc) => {
    try {
      if (!doc.fileBinary) {
        toast.error("File content is not available for download");
        return;
      }

      const mimeTypes = {
        JPG: "image/jpeg",
        JPEG: "image/jpeg",
        PNG: "image/png",
        GIF: "image/gif",
        PDF: "application/pdf",
        DOC: "application/msword",
        DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        XLS: "application/vnd.ms-excel",
        XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };

      const mimeType = mimeTypes[doc.fileType?.toUpperCase()] || "application/octet-stream";
      const byteCharacters = atob(doc.fileBinary);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.fileName || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to download file");
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("SUBMITTED");
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split("T")[0];
  });
  const [selectedItems, setSelectedItems] = useState([]);
  const [remarks, setRemarks] = useState({});
  const [bulkRemarks, setBulkRemarks] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [currentFinancialYearId, setCurrentFinancialYearId] = useState(null);

  // Ref to track processed application IDs (prevents duplicate actions before Redux refetch)
  const processedIdsRef = useRef(new Set());

  // Fetch work years and determine current financial year
  useEffect(() => {
    const fetchWorkYears = async () => {
      const result = await CommonService.getAllWorkYears();
      if (!result.error && result.data && result.data.length > 0) {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();
        const financialYearStart = currentMonth >= 7 ? currentYear : currentYear - 1;

        const currentWorkYear = result.data.find((year) => {
          if (!year.displayText) return false;
          const firstYear = year.displayText.split("-")[0];
          return firstYear === String(financialYearStart);
        });

        if (currentWorkYear) {
          setCurrentFinancialYearId(currentWorkYear.idWorkYear);
        } else {
          setCurrentFinancialYearId(result.data[0].idWorkYear);
        }
      }
    };
    fetchWorkYears();
  }, []);

  // Fetch leave applications on component mount and when filters change
  useEffect(() => {
    const approvalStatus = statusFilter === "ALL" || statusFilter === "" ? "" : statusFilter;
    dispatch(
      fetchLeaveApplicationsForApproval({
        approvalStatus,
        searchText: searchQuery,
        fromDate: dateFrom || "",
        toDate: "",
      })
    );
  }, [dispatch, statusFilter, searchQuery, dateFrom]);

  // Status options
  const statusOptions = [
    { value: "ALL", label: "All Status" },
    { value: "SUBMITTED", label: "Submitted" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  // Clear processed IDs when new data is fetched (fresh data from server)
  useEffect(() => {
    if (leaveApplications?.data) {
      processedIdsRef.current.clear();
    }
  }, [leaveApplications]);

  // Helper function to check if action can be taken on an application
  // Returns true only when: actionStatusByUser is null AND status is not CANCELLED or REJECTED
  // AND the application has not been processed in this session (prevents duplicate actions)
  const canTakeAction = (app) => {
    return (
      app.actionStatusByUser === null &&
      app.status !== "CANCELLED" &&
      app.status !== "REJECTED" &&
      !processedIdsRef.current.has(app.idLeaveApplication)
    );
  };

  // Get applications data from API response
  const applicationsData = useMemo(() => {
    if (!leaveApplications || !leaveApplications.data) {
      return [];
    }
    return leaveApplications.data.map((app) => ({
      idLeaveApplication: app.idLeaveApplication,
      idEmployee: app.idEmployee,
      idLeaveType: app.idLeaveType,
      employeeCode: app.employeeCode || app.idEmployee || "",
      employeeName: app.employeeName || "",
      designation: app.designationName || "",
      department: app.departmentName || "",
      leaveType: app.leaveTypeName || "",
      fromDate: app.fromDate,
      toDate: app.toDate,
      totalDays: app.totalLeaveDays || 0,
      isHalfDay: (app.totalLeaveDays || 0) < 1,
      status: app.approvalStatus || "PENDING",
      applicationStatus: app.applicationStatus || "",
      reason: app.reason || "",
      appliedOn: app.appliedOn || "",
      actionStatusByUser: app.actionStatusByUser,
      leaveApprovalHistories: app.leaveApprovalHistories || null,
      // These fields are not in the API response, using defaults
      totalLeaves: app.totalLeaves || 0,
      usedLeaves: app.usedLeaves || 0,
      pendingLeaves: app.pendingLeaves || 0,
      balanceLeaves: app.balanceLeaves || 0,
      documents: app.documents || [],
      hasDocuments: app.hasDocuments || false,
    }));
  }, [leaveApplications]);

  // Filter leave applications based on search (status filter is already applied in API call)
  const filteredApplications = useMemo(() => {
    return applicationsData;
  }, [applicationsData]);

  // Handle select all checkbox
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const selectableIds = filteredApplications
        .filter((app) => canTakeAction(app))
        .map((app) => app.idLeaveApplication);
      setSelectedItems(selectableIds);
    } else {
      setSelectedItems([]);
    }
  };

  // Handle individual checkbox
  const handleCheckbox = (id, checked) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, id]);
    } else {
      setSelectedItems((prev) => prev.filter((x) => x !== id));
    }
  };

  // Handle approve selected
  const handleApproveSelected = async () => {
    // Filter out already processed IDs
    const unprocessedIds = selectedItems.filter(id => !processedIdsRef.current.has(id));
    if (unprocessedIds.length === 0) return;

    try {
      const resultAction = await dispatch(
        bulkApproveLeaveApplications({
          idLeaveApplications: unprocessedIds,
          remarks: bulkRemarks,
        })
      );

      if (bulkApproveLeaveApplications.fulfilled.match(resultAction)) {
        if (resultAction.payload && resultAction.payload.success) {
          // Mark all as processed immediately to prevent duplicate actions
          unprocessedIds.forEach(id => processedIdsRef.current.add(id));
          toast.success(
            `${unprocessedIds.length} application(s) approved successfully!`,
            {
              position: "top-right",
              autoClose: 3000,
            }
          );
          setSelectedItems([]);
          setBulkRemarks("");
          // Refresh the list
          dispatch(
            fetchLeaveApplicationsForApproval({
              approvalStatus: statusFilter === "ALL" || statusFilter === "" ? "" : statusFilter,
              searchText: searchQuery,
              fromDate: "",
              toDate: "",
            })
          );
        } else {
          toast.error(
            resultAction.payload?.message || "Failed to approve applications",
            {
              position: "top-right",
              autoClose: 3000,
            }
          );
        }
      }
    } catch (error) {
      console.error("Error approving applications:", error);
      toast.error("Failed to approve applications", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Handle single approve
  const handleApprove = async (id) => {
    // Guard: prevent duplicate action if already processed
    if (processedIdsRef.current.has(id)) return;

    try {
      const app = applicationsData.find((a) => a.idLeaveApplication === id);
      const resultAction = await dispatch(
        approveLeaveApplication({
          idLeaveApplication: id,
          remarks: remarks[id] || "",
        })
      );

      if (approveLeaveApplication.fulfilled.match(resultAction)) {
        if (resultAction.payload && resultAction.payload.success) {
          // Mark as processed immediately to prevent duplicate actions
          processedIdsRef.current.add(id);
          toast.success(
            `Leave application for ${app?.employeeName} approved successfully!`,
            {
              position: "top-right",
              autoClose: 3000,
            }
          );
          // Refresh the list
          dispatch(
            fetchLeaveApplicationsForApproval({
              approvalStatus: statusFilter === "ALL" || statusFilter === "" ? "" : statusFilter,
              searchText: searchQuery,
              fromDate: "",
              toDate: "",
            })
          );
        } else {
          toast.error(
            resultAction.payload?.message || "Failed to approve application",
            {
              position: "top-right",
              autoClose: 3000,
            }
          );
        }
      }
    } catch (error) {
      console.error("Error approving application:", error);
      toast.error("Failed to approve application", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Handle reject with validation
  const handleReject = async (id) => {
    // Guard: prevent duplicate action if already processed
    if (processedIdsRef.current.has(id)) return;

    const remark = remarks[id] || "";
    if (!remark.trim()) {
      setValidationErrors((prev) => ({
        ...prev,
        [id]: "Remarks are mandatory for rejection",
      }));
      toast.error("Please enter remarks before rejecting", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      const app = applicationsData.find((a) => a.idLeaveApplication === id);
      const resultAction = await dispatch(
        rejectLeaveApplication({
          idLeaveApplication: id,
          remarks: remark,
        })
      );

      if (rejectLeaveApplication.fulfilled.match(resultAction)) {
        if (resultAction.payload && resultAction.payload.success) {
          // Mark as processed immediately to prevent duplicate actions
          processedIdsRef.current.add(id);
          toast.error(`Leave application for ${app?.employeeName} rejected`, {
            position: "top-right",
            autoClose: 3000,
          });
          setRemarks((prev) => ({ ...prev, [id]: "" }));
          setValidationErrors((prev) => ({ ...prev, [id]: "" }));
          // Refresh the list
          dispatch(
            fetchLeaveApplicationsForApproval({
              approvalStatus: statusFilter === "ALL" || statusFilter === "" ? "" : statusFilter,
              searchText: searchQuery,
              fromDate: "",
              toDate: "",
            })
          );
        } else {
          toast.error(
            resultAction.payload?.message || "Failed to reject application",
            {
              position: "top-right",
              autoClose: 3000,
            }
          );
        }
      }
    } catch (error) {
      console.error("Error rejecting application:", error);
      toast.error("Failed to reject application", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Handle remarks change
  const handleRemarksChange = (id, value) => {
    setRemarks((prev) => ({ ...prev, [id]: value }));
    if (validationErrors[id]) {
      setValidationErrors((prev) => ({ ...prev, [id]: "" }));
    }
  };

  // Get badge class based on status
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "APPROVED":
        return "bg-label-success";
      case "REJECTED":
        return "bg-label-danger";
      case "SUBMITTED":
        return "bg-label-info";
      case "PENDING":
        return "bg-label-warning";
      default:
        return "bg-label-secondary";
    }
  };

  // Open view modal
  const openViewModal = (app) => {
    setSelectedApplication(app);
    setShowViewModal(true);
    // Fetch leave dashboard for the employee using current financial year
    if (app.idEmployee && currentFinancialYearId) {
      dispatch(fetchLeaveDashboardEmployee({ idEmployee: app.idEmployee, idYear: currentFinancialYearId }));
    }
  };

  // Open documents modal
  const openDocumentsModal = (app) => {
    setSelectedApplication(app);
    setShowDocumentsModal(true);
    if (app.idLeaveApplication) {
      dispatch(fetchLeaveApplicationDocuments(app.idLeaveApplication));
    }
  };

  // Close modals
  const closeModals = () => {
    setShowViewModal(false);
    setShowDocumentsModal(false);
    setSelectedApplication(null);
  };

  // Handle approve from modal
  const handleApproveFromModal = () => {
    if (selectedApplication) {
      handleApprove(selectedApplication.idLeaveApplication);
      closeModals();
    }
  };

  // Handle reject from modal
  const handleRejectFromModal = () => {
    if (selectedApplication) {
      const remark = remarks[selectedApplication.idLeaveApplication] || "";
      if (!remark.trim()) {
        setValidationErrors((prev) => ({
          ...prev,
          [selectedApplication.idLeaveApplication]:
            "Remarks are mandatory for rejection",
        }));
        toast.error("Please enter remarks before rejecting", {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }
      handleReject(selectedApplication.idLeaveApplication);
      closeModals();
    }
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">Leave Approvals</h5>
            </div>
            <div className="card-body">
              {/* Header Controls */}
              <div className="row mb-3 align-items-end">
                <div className="col-md-3">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="selectAll"
                      checked={
                        selectedItems.length > 0 &&
                        selectedItems.length ===
                          filteredApplications.filter(
                            (app) => canTakeAction(app)
                          ).length
                      }
                      onChange={handleSelectAll}
                    />
                    <label className="form-check-label" htmlFor="selectAll">
                      Select All
                    </label>
                  </div>
                  {selectedItems.length > 0 && (
                    <div className="mt-2">
                      <input
                        type="text"
                        className="form-control form-control-sm mb-2"
                        placeholder="Bulk remarks (optional)"
                        value={bulkRemarks}
                        onChange={(e) => setBulkRemarks(e.target.value)}
                      />
                    </div>
                  )}
                  <Button
                    className="btn btn-primary btn-sm mt-2"
                    onClick={handleApproveSelected}
                    disabled={selectedItems.length === 0}
                  >
                    Approve Selected ({selectedItems.length})
                  </Button>
                </div>
                <div className="col-md-3">
                  <label className="form-label d-block mb-1">Date From</label>
                  <DatePicker
                    className="form-control"
                    dateFormat="MM/dd/yyyy"
                    placeholderText="Date"
                    selected={dateFrom}
                    onChange={(date) => {
                      setDateFrom(date ? date.toISOString().slice(0, 10) : "");
                    }}
                    showYearDropdown
                    maxDate={new Date()}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label mb-1">Status</label>
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
                <div className="col-md-3">
                  <label className="form-label mb-1">Search</label>
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
              </div>

              {/* Leave Approval Cards */}
              <div className="row" style={{ maxHeight: "calc(100vh - 300px)", overflowY: "auto" }}>
                {loading ? (
                  <div className="col-12 text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : error ? (
                  <div className="col-12 text-center py-4 text-danger">
                    {error}
                  </div>
                ) : filteredApplications.length === 0 ? (
                  <div className="col-12 text-center py-4 text-muted">
                    No leave applications found
                  </div>
                ) : (
                  filteredApplications.map((app) => (
                    <div
                      key={app.idLeaveApplication}
                      className="col-lg-4 col-md-6 mb-3"
                    >
                      <div className="card border h-100">
                        <div className="card-body d-flex flex-column">
                          {/* Top Section - Checkbox, Employee Info & Icons */}
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div className="d-flex align-items-start flex-grow-1">
                              <input
                                type="checkbox"
                                className="form-check-input me-3 mt-1"
                                checked={selectedItems.includes(
                                  app.idLeaveApplication
                                )}
                                onChange={(e) =>
                                  handleCheckbox(
                                    app.idLeaveApplication,
                                    e.target.checked
                                  )
                                }
                                disabled={!canTakeAction(app)}
                              />
                              <div>
                                <h6 className="mb-0 fw-bold">
                                  {app.employeeCode} {app.employeeName}
                                </h6>
                                <p className="text-muted mb-0 small">
                                  {app.designation}, {app.department}
                                </p>
                              </div>
                            </div>
                            <div className="d-flex">
                              <button
                                className="btn btn-sm btn-link p-1 text-dark"
                                onClick={() => openViewModal(app)}
                                title="View Details"
                              >
                                <i className="bx bx-show fs-5"></i>
                              </button>
                              {app.hasDocuments && (
                                <button
                                  className="btn btn-sm btn-link p-1 text-dark"
                                  onClick={() => openDocumentsModal(app)}
                                  title="View Documents"
                                >
                                  <i className="bx bx-paperclip fs-5"></i>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Leave Details - Two Column Layout */}
                          <div className="mb-3">
                            <div className="d-flex justify-content-between mb-2">
                              <small className="text-muted">Leave Type</small>
                              <span className="fw-medium">{app.leaveType}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                              <small className="text-muted">Period</small>
                              <span className="fw-medium text-end">
                                {new Date(app.fromDate).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })} to{" "}
                                {new Date(app.toDate).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}
                              </span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                              <small className="text-muted">Total Days</small>
                              <span className="fw-medium">{app.totalDays}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                              <small className="text-muted">Status</small>
                              <span
                                className={`badge ${getStatusBadgeClass(
                                  app.status
                                )}`}
                              >
                                {app.status}
                              </span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                              <small className="text-muted">Reason</small>
                              <span className="fw-medium text-end" style={{ maxWidth: "60%" }}>
                                {app.reason}
                              </span>
                            </div>
                          </div>

                          

                          {/* Remarks Field */}
                          <div className="mb-3 mt-auto">
                            <label className="form-label mb-1 small fw-medium">
                              Remarks (Required for rejection)
                            </label>
                            <textarea
                              className="form-control form-control-sm"
                              rows="2"
                              placeholder=""
                              value={remarks[app.idLeaveApplication] || ""}
                              onChange={(e) =>
                                handleRemarksChange(
                                  app.idLeaveApplication,
                                  e.target.value
                                )
                              }
                              disabled={!canTakeAction(app)}
                            ></textarea>
                            {validationErrors[app.idLeaveApplication] && (
                              <div className="text-danger small mt-1">
                                {validationErrors[app.idLeaveApplication]}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          {canTakeAction(app) && (
                              <div className="d-flex gap-2">
                                <Button
                                  className="btn btn-primary btn-sm flex-fill px-3 py-2"
                                  onClick={() =>
                                    handleApprove(app.idLeaveApplication)
                                  }
                                >
                                  Approve
                                </Button>
                                <Button
                                  className="btn btn-danger btn-sm flex-fill px-3 py-2"
                                  onClick={() =>
                                    handleReject(app.idLeaveApplication)
                                  }
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Application - View Modal */}
      {showViewModal && selectedApplication && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          //onClick={closeModals}
        >
          <div
            className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Leave Application - View</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModals}
                ></button>
              </div>
              <div className="modal-body">
                {/* Employee Details */}
                <div className="mb-4">
                  <h6 className="fw-bold border-bottom pb-2 mb-3">
                    Employee Details
                  </h6>
                  <div className="row">
                    <div className="col-md-6 mb-2">
                      <strong>Employee ID :</strong>{" "}
                      {selectedApplication.employeeCode}
                    </div>
                    <div className="col-md-6 mb-2">
                      <strong>Employee Name :</strong>{" "}
                      {selectedApplication.employeeName}
                    </div>
                    <div className="col-md-6 mb-2">
                      <strong>Department :</strong>{" "}
                      {selectedApplication.department}
                    </div>
                    <div className="col-md-6 mb-2">
                      <strong>Designation :</strong>{" "}
                      {selectedApplication.designation}
                    </div>
                    <div className="col-md-6 mb-2">
                      <strong>Leave Type :</strong>{" "}
                      {selectedApplication.leaveType}
                    </div>
                    <div className="col-md-6 mb-2">
                      <strong>Status :</strong>{" "}
                      <span
                        className={`badge ${getStatusBadgeClass(
                          selectedApplication.status
                        )}`}
                      >
                        {selectedApplication.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Leave Summary */}
                <div className="mb-4">
                  <h6 className="fw-bold border-bottom pb-2 mb-3">
                    Leave Summary
                  </h6>
                  {leaveDashboardLoading ? (
                    <div className="text-center py-3">
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : leaveDashboard && leaveDashboard.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-sm table-bordered">
                        <thead className="table-light">
                          <tr>
                            <th>Leave Type</th>
                            <th className="text-center">Allocated</th>
                            <th className="text-center">Taken</th>
                            <th className="text-center">Approved</th>
                            <th className="text-center">Rejected</th>
                            <th className="text-center">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaveDashboard.map((leave, index) => (
                            <tr key={index}>
                              <td>{leave.leaveTypeName}</td>
                              <td className="text-center">{leave.totalAllocated}</td>
                              <td className="text-center">{leave.totalTaken}</td>
                              <td className="text-center">{leave.totalApproved}</td>
                              <td className="text-center">{leave.totalRejected}</td>
                              <td className="text-center">{leave.totalBalance}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-muted">No leave summary available</div>
                  )}
                </div>

                {/* Request Details */}
                <div className="mb-4">
                  <h6 className="fw-bold border-bottom pb-2 mb-3">
                    Request Details
                  </h6>
                  <div className="row">
                    <div className="col-md-6 mb-2">
                      <strong>Period :</strong>{" "}
                      {new Date(
                        selectedApplication.fromDate
                      ).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}{" "}
                      -{" "}
                      {new Date(
                        selectedApplication.toDate
                      ).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}
                    </div>
                    <div className="col-md-6 mb-2">
                      <strong>Total Days :</strong>{" "}
                      {selectedApplication.totalDays}
                    </div>
                    <div className="col-md-6 mb-2">
                      <strong>Half Day :</strong>{" "}
                      {selectedApplication.isHalfDay ? "Yes" : "No"}
                    </div>
                  </div>
                  <div className="mt-3">
                    <strong>Reason :</strong>
                    <textarea
                      className="form-control mt-2"
                      rows="3"
                      value={selectedApplication.reason}
                      readOnly
                    ></textarea>
                  </div>
                </div>

                {/* Approval History */}
                {selectedApplication.leaveApprovalHistories && (
                  <div className="mb-4">
                    <h6 className="fw-bold border-bottom pb-2 mb-3">
                      Approval History
                    </h6>
                    <div className="table-responsive">
                      <table className="table table-sm table-bordered">
                        <thead className="table-light">
                          <tr>
                            <th>Action By</th>
                            <th>Level</th>
                            <th>Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            try {
                              const histories = JSON.parse(selectedApplication.leaveApprovalHistories);
                              return histories.map((history, index) => (
                                <tr key={index}>
                                  <td>{history.name || "-"}</td>
                                  <td>{history.level || "-"}</td>
                                  <td>
                                    <span className={`badge ${
                                      history.status === "APPROVED" ? "bg-label-success" :
                                      history.status === "REJECTED" ? "bg-label-danger" :
                                      history.status === "PENDING" ? "bg-label-warning" :
                                      "bg-label-secondary"
                                    }`}>
                                      {history.status || "-"}
                                    </span>
                                  </td>
                                  <td>
                                    {history.statusDate
                                      ? new Date(history.statusDate).toLocaleString("en-US", {
                                          month: "2-digit",
                                          day: "2-digit",
                                          year: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          hour12: true,
                                        })
                                      : "-"}
                                  </td>
                                </tr>
                              ));
                            } catch (e) {
                              return (
                                <tr>
                                  <td colSpan="4" className="text-center text-muted">
                                    No approval history available
                                  </td>
                                </tr>
                              );
                            }
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Remarks Field */}
                <div className="mb-3">
                  <label className="form-label">
                    Remarks{" "}
                    <span className="text-muted">
                      (Required for rejection)
                    </span>
                  </label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Enter remarks..."
                    value={remarks[selectedApplication.idLeaveApplication] || ""}
                    onChange={(e) =>
                      handleRemarksChange(
                        selectedApplication.idLeaveApplication,
                        e.target.value
                      )
                    }
                    disabled={!canTakeAction(selectedApplication)}
                  ></textarea>
                  {validationErrors[selectedApplication.idLeaveApplication] && (
                    <div className="text-danger small mt-1">
                      {validationErrors[selectedApplication.idLeaveApplication]}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                {canTakeAction(selectedApplication) && (
                    <>
                      <Button
                        className="btn btn-primary"
                        onClick={handleApproveFromModal}
                      >
                        Approve
                      </Button>
                      <Button
                        className="btn btn-danger"
                        onClick={handleRejectFromModal}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                <Button
                  className="btn btn-outline-secondary"
                  onClick={closeModals}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Documents Modal */}
      {showDocumentsModal && selectedApplication && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          //onClick={closeModals}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Application Documents</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModals}
                ></button>
              </div>
              <div className="modal-body">
                {leaveDocumentsLoading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : !leaveDocuments || leaveDocuments.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    No documents attached
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>File Type</th>
                          <th>File Name</th>
                          <th>Uploaded Date</th>
                          <th style={{ width: "80px", textAlign: "center" }}>Download</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaveDocuments.map((doc) => (
                          <tr key={doc.idLeaveApplicationDocument}>
                            <td>{doc.fileType}</td>
                            <td>{doc.fileName}</td>
                            <td>
                              {new Date(
                                doc.uploadedAt
                              ).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                title="Download"
                                onClick={() => handleDownloadDocument(doc)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                                  <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <Button
                  className="btn btn-outline-secondary"
                  onClick={closeModals}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveApproval;
