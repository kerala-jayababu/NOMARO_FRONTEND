import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import secureLocalStorage from "react-secure-storage";
import {
  fetchResignationRequests,
  submitReportingOfficerAction,
  clearSelectedExitCase,
  fetchOffboardingClearanceTemplates,
  fetchClearanceTemplateDepartments,
} from "../../redux/reducers/offboardingCases";

// Helper to get user role type from logged in user
const getUserRoleType = () => {
  const storedUser = secureLocalStorage.getItem("user");
  if (storedUser) {
    const userData = JSON.parse(storedUser);
    // Map user role to API roleType
    console.log(userData);
    return userData?.roleType || "REPOFFICER";
  }
  return "REPOFFICER";
};

const OffboardingCases = () => {
  const dispatch = useDispatch();
  const {
    resignationRequests,
    loading,
    actionLoading,
  } = useSelector((state) => state.offboardingCases);

  const [searchQuery, setSearchQuery] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);

  // Get role type from logged in user
  const roleType = getUserRoleType();

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchResignationRequests({ roleType }));
  }, [dispatch, roleType]);

  // Filter Exit Cases based on search
  const filteredRequests = resignationRequests.filter((request) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      request.employeeCode?.toLowerCase().includes(search) ||
      request.employeeName?.toLowerCase().includes(search) ||
      request.caseNumber?.toLowerCase().includes(search) ||
      request.exitStatus?.toLowerCase().includes(search)
    );
  });

  // Calculate status counts from current data
  const statusCounts = {
    pending: resignationRequests.filter(r => r.pendingWith === roleType || r.pendingWith === "HROFFICER").length,
    approved: resignationRequests.filter(r => r.exitStatus?.includes("Approved")).length,
    total: resignationRequests.length,
  };

  // Get badge class based on status
  const getStatusBadgeClass = (status) => {
    if (!status) return "bg-label-secondary";
    const statusLower = status.toLowerCase();
    if (statusLower.includes("approved")) return "bg-label-success";
    if (statusLower.includes("rejected")) return "bg-label-danger";
    if (statusLower.includes("pending")) return "bg-label-warning";
    if (statusLower.includes("submitted")) return "bg-label-info";
    if (statusLower.includes("clearance")) return "bg-label-primary";
    return "bg-label-secondary";
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  // Open view modal
  const handleView = (exitCase) => {
    setSelectedCase(exitCase);
    setShowViewModal(true);
  };

  // Close modals
  const closeModals = () => {
    setShowViewModal(false);
    setSelectedCase(null);
    dispatch(clearSelectedExitCase());
  };

  // Refresh data
  const refreshData = () => {
    dispatch(fetchResignationRequests({ roleType }));
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Page Header */}
      <div className="pb-3">
        <h5 className="m-0">Offboarding Cases</h5>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-lg-4 col-md-6 col-sm-6 mb-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-md me-3 bg-label-primary">
                  <span className="avatar-initial rounded">
                    <i className="bx bx-file"></i>
                  </span>
                </div>
                <div>
                  <h6 className="mb-0">{statusCounts.total}</h6>
                  <small className="text-muted">Total Cases</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-md-6 col-sm-6 mb-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-md me-3 bg-label-warning">
                  <span className="avatar-initial rounded">
                    <i className="bx bx-time-five"></i>
                  </span>
                </div>
                <div>
                  <h6 className="mb-0">{statusCounts.pending}</h6>
                  <small className="text-muted">Pending Action</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-md-6 col-sm-6 mb-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar avatar-md me-3 bg-label-success">
                  <span className="avatar-initial rounded">
                    <i className="bx bx-check-double"></i>
                  </span>
                </div>
                <div>
                  <h6 className="mb-0">{statusCounts.approved}</h6>
                  <small className="text-muted">Approved</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exit Cases Listing */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between pb-3">
          <h5 className="m-0">Exit Cases</h5>
        </div>
        <div className="card-body">
          {/* Filters */}
          <div className="row mb-3 justify-content-end">
            <div className="col-md-4">
              <div className="list_searchbox">
                <input
                  type="search"
                  className="form-control"
                  placeholder="Search by Emp Code / Name / Case No"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <i className="bx bx-search"></i>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive text-nowrap" style={{ maxHeight: "450px", overflowY: "auto" }}>
            <table className="table table-sm">
              <thead>
                <tr>
                  <th style={{ position: "sticky", top: 0, backgroundColor: "white", zIndex: 1 }}>
                    Case No
                  </th>
                  <th style={{ position: "sticky", top: 0, backgroundColor: "white", zIndex: 1 }}>
                    Emp Code
                  </th>
                  <th style={{ position: "sticky", top: 0, backgroundColor: "white", zIndex: 1 }}>
                    Employee Name
                  </th>
                  <th style={{ position: "sticky", top: 0, backgroundColor: "white", zIndex: 1 }}>
                    Department
                  </th>
                  <th style={{ position: "sticky", top: 0, backgroundColor: "white", zIndex: 1 }}>
                    Exit Type
                  </th>
                  <th style={{ position: "sticky", top: 0, backgroundColor: "white", zIndex: 1 }}>
                    Proposed LWD
                  </th>
                  <th style={{ position: "sticky", top: 0, backgroundColor: "white", zIndex: 1 }}>
                    Status
                  </th>
                  <th style={{ position: "sticky", top: 0, backgroundColor: "white", zIndex: 1 }}>
                    Pending With
                  </th>
                  <th style={{ position: "sticky", top: 0, backgroundColor: "white", zIndex: 1 }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="table-border-bottom-0">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4 text-muted">
                      No Exit Cases found
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((exitCase) => (
                    <tr key={exitCase.idExitCase}>
                      <td>{exitCase.caseNumber}</td>
                      <td>{exitCase.employeeCode}</td>
                      <td>{exitCase.employeeName}</td>
                      <td>{exitCase.employeeDepartmentName}</td>
                      <td>{exitCase.exitTypeName}</td>
                      <td>{formatDate(exitCase.proposedLWD)}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(exitCase.exitStatus)}`}>
                          {exitCase.exitStatus}
                        </span>
                      </td>
                      <td>{exitCase.pendingWith}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-icon btn-outline-secondary border-0"
                          onClick={() => handleView(exitCase)}
                          title="View"
                        >
                          <i className="bx bx-show"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View Exit Case Modal */}
      {showViewModal && selectedCase && (
        <ViewExitCaseModal
          exitCase={selectedCase}
          roleType={roleType}
          onClose={closeModals}
          onRefresh={refreshData}
          dispatch={dispatch}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
};

// ============= VIEW EXIT CASE MODAL =============
const ViewExitCaseModal = ({
  exitCase,
  roleType,
  onClose,
  onRefresh,
  dispatch,
  actionLoading,
}) => {
  const {
    offboardingClearanceTemplates,
    clearanceTemplateDepartments,
    templateLoading,
  } = useSelector((state) => state.offboardingCases);

  const [handOverNotes, setHandOverNotes] = useState("");
  const [approvedLWD, setApprovedLWD] = useState(
    exitCase.approvedLWD
      ? new Date(exitCase.approvedLWD).toISOString().split("T")[0]
      : exitCase.proposedLWD
      ? new Date(exitCase.proposedLWD).toISOString().split("T")[0]
      : ""
  );
  const [selectedClearanceTemplate, setSelectedClearanceTemplate] = useState(
    exitCase.idClearanceTemplate || ""
  );

  // Check if user is HR (HREXECUTIVE or HRHEAD)
  const isHRRole = roleType === "HREXECUTIVE" || roleType === "HRHEAD";

  useEffect(() => {
    const modalElement = document.getElementById("viewExitCaseModal");
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

  // Fetch clearance templates when modal opens for HR roles
  useEffect(() => {
    if (isHRRole) {
      dispatch(fetchOffboardingClearanceTemplates());
    }
  }, [dispatch, isHRRole]);

  // Fetch clearance template departments when template is selected
  useEffect(() => {
    if (selectedClearanceTemplate) {
      dispatch(fetchClearanceTemplateDepartments(selectedClearanceTemplate));
    }
  }, [dispatch, selectedClearanceTemplate]);

  // Handle clearance template change
  const handleClearanceTemplateChange = (e) => {
    const templateId = e.target.value;
    setSelectedClearanceTemplate(templateId);
  };

  // Group clearance departments by idDepartment and count checklist items
  const groupedDepartments = clearanceTemplateDepartments.reduce((acc, item) => {
    const deptId = item.idDepartment;
    if (!acc[deptId]) {
      acc[deptId] = {
        idDepartment: deptId,
        checklistItems: [],
        count: 0,
      };
    }
    acc[deptId].checklistItems.push(item);
    acc[deptId].count += 1;
    return acc;
  }, {});

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  // Get badge class based on status
  const getStatusBadgeClass = (status) => {
    if (!status) return "bg-label-secondary";
    const statusLower = status.toLowerCase();
    if (statusLower.includes("approved")) return "bg-label-success";
    if (statusLower.includes("rejected")) return "bg-label-danger";
    if (statusLower.includes("pending")) return "bg-label-warning";
    if (statusLower.includes("submitted")) return "bg-label-info";
    return "bg-label-secondary";
  };

  // Handle Approve Action
  const handleApprove = async () => {
    if (!approvedLWD) {
      toast.error("Please select approved LWD");
      return;
    }

    try {
      const result = await dispatch(
        submitReportingOfficerAction({
          idExitCase: exitCase.idExitCase,
          idEmployee: exitCase.idEmployee,
          approvedLWD: new Date(approvedLWD).toISOString(),
          handOverNotes: handOverNotes,
          action: "Approve",
        })
      );
      if (result.payload?.success) {
        toast.success(result.payload?.message || "Exit case approved successfully!");
        onRefresh();
        onClose();
      } else {
        toast.error(result.payload?.message || "Failed to approve exit case");
      }
    } catch (error) {
      toast.error("Failed to approve exit case");
    }
  };

  // Handle Reject Action
  const handleReject = async () => {
    if (!handOverNotes.trim()) {
      toast.error("Please provide handover notes / remarks for rejection");
      return;
    }

    try {
      const result = await dispatch(
        submitReportingOfficerAction({
          idExitCase: exitCase.idExitCase,
          idEmployee: exitCase.idEmployee,
          approvedLWD: approvedLWD ? new Date(approvedLWD).toISOString() : null,
          handOverNotes: handOverNotes,
          action: "Reject",
        })
      );
      if (result.payload?.success) {
        toast.success(result.payload?.message || "Exit case rejected!");
        onRefresh();
        onClose();
      } else {
        toast.error(result.payload?.message || "Failed to reject exit case");
      }
    } catch (error) {
      toast.error("Failed to reject exit case");
    }
  };

  // Check if actions should be shown based on role type and pending status
  const canTakeAction = () => {
    if (roleType === "REPOFFICER" && exitCase.pendingWith === "REPOFFICER") return true;
    if (roleType === "HREXECUTIVE" && exitCase.pendingWith === "HROFFICER") return true;
    if (roleType === "HRHEAD" && exitCase.pendingWith === "HRHEAD") return true;
    return false;
  };

  return (
    <div
      className="modal fade"
      id="viewExitCaseModal"
      tabIndex="-1"
      aria-hidden="true"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              Exit Case - {exitCase.caseNumber}
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            {/* Employee Details */}
            <div className="mb-4">
              <h6 className="fw-bold border-bottom pb-2 mb-3">
                Employee Details
              </h6>
              <div className="row">
                <div className="col-md-4 mb-2">
                  <strong>Employee Code:</strong> {exitCase.employeeCode}
                </div>
                <div className="col-md-4 mb-2">
                  <strong>Employee Name:</strong> {exitCase.employeeName}
                </div>
                <div className="col-md-4 mb-2">
                  <strong>Department:</strong> {exitCase.employeeDepartmentName}
                </div>
                <div className="col-md-4 mb-2">
                  <strong>Designation:</strong> {exitCase.employeeDesignationName}
                </div>
                <div className="col-md-4 mb-2">
                  <strong>Reporting Officer:</strong> {exitCase.reportingOfficerName}
                </div>
                <div className="col-md-4 mb-2">
                  <strong>Rep. Officer Dept:</strong> {exitCase.reportingOfficerDepartmentName}
                </div>
              </div>
            </div>

            {/* Exit Details */}
            <div className="mb-4">
              <h6 className="fw-bold border-bottom pb-2 mb-3">
                Exit Details
              </h6>
              <div className="row">
                <div className="col-md-4 mb-2">
                  <strong>Exit Type:</strong> {exitCase.exitTypeName}
                </div>
                <div className="col-md-4 mb-2">
                  <strong>Exit Reason:</strong> {exitCase.exitReasonName}
                </div>
                <div className="col-md-4 mb-2">
                  <strong>Initiation Date:</strong> {formatDate(exitCase.initiationDate)}
                </div>
                <div className="col-md-4 mb-2">
                  <strong>Proposed LWD:</strong> {formatDate(exitCase.proposedLWD)}
                </div>
                <div className="col-md-4 mb-2">
                  <strong>Approved LWD:</strong> {formatDate(exitCase.approvedLWD)}
                </div>
                <div className="col-md-4 mb-2">
                  <strong>Status:</strong>{" "}
                  <span className={`badge ${getStatusBadgeClass(exitCase.exitStatus)}`}>
                    {exitCase.exitStatus}
                  </span>
                </div>
                <div className="col-md-4 mb-2">
                  <strong>Pending With:</strong> {exitCase.pendingWith}
                </div>
              </div>
            </div>

            {/* Notice Period Details */}
            <div className="mb-4">
              <h6 className="fw-bold border-bottom pb-2 mb-3">
                Notice Period Details
              </h6>
              <div className="row">
                <div className="col-md-4 mb-2">
                  <strong>Notice Policy:</strong> {exitCase.noticePolicyName}
                </div>
                <div className="col-md-4 mb-2">
                  <strong>Policy Notice Days:</strong> {exitCase.policyNoticeDays}
                </div>
                <div className="col-md-4 mb-2">
                  <strong>Effective Notice Days:</strong> {exitCase.effectiveNoticeDays}
                </div>
                <div className="col-md-4 mb-2">
                  <strong>Notice Overridden:</strong> {exitCase.isNoticeOverridden ? "Yes" : "No"}
                </div>
              </div>
            </div>

            {/* Employee's Reason */}
            <div className="mb-4">
              <h6 className="fw-bold border-bottom pb-2 mb-3">
                Employee's Reason for Exit
              </h6>
              <textarea
                className="form-control"
                rows="3"
                value={exitCase.employeeReasonDetails || ""}
                readOnly
              ></textarea>
            </div>

            {/* Clearance Details (if available) */}
            {exitCase.clearanceTemplateName && (
              <div className="mb-4">
                <h6 className="fw-bold border-bottom pb-2 mb-3">
                  Clearance Details
                </h6>
                <div className="row">
                  <div className="col-md-6 mb-2">
                    <strong>Clearance Template:</strong> {exitCase.clearanceTemplateName}
                  </div>
                  <div className="col-md-6 mb-2">
                    <strong>Clearance Initiated On:</strong> {formatDate(exitCase.clearanceInitiatedOn)}
                  </div>
                </div>
                {exitCase.clearanceTemplateDescription && (
                  <div className="row">
                    <div className="col-12 mb-2">
                      <strong>Description:</strong> {exitCase.clearanceTemplateDescription}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Clearance Setup Section - Only show for HR roles */}
            {isHRRole && (
              <div className="mb-4">
                <h6 className="fw-bold border-bottom pb-2 mb-3">
                  Clearance Setup (HR)
                </h6>
                <div className="row mb-3">
                  <div className="col-12">
                    <label className="form-label text-muted">Clearance Template</label>
                    <select
                      className="form-select"
                      value={selectedClearanceTemplate}
                      onChange={handleClearanceTemplateChange}
                    >
                      <option value="">Select Clearance Template</option>
                      {offboardingClearanceTemplates.map((template) => (
                        <option key={template.idClearanceTemplate} value={template.idClearanceTemplate}>
                          {template.templateName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Display Clearance Departments grouped by department */}
                {selectedClearanceTemplate && (
                  <>
                    <p className="text-muted small mb-3">
                      Assign one clearance owner per department (Phase 1). Owners will action the checklist in <strong>Offboarding Clearances</strong>.
                    </p>
                    {templateLoading ? (
                      <div className="text-center py-3">
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : Object.keys(groupedDepartments).length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Department</th>
                              <th>Checklist Items</th>
                              <th>Dept Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.values(groupedDepartments).map((dept) => (
                              <tr key={dept.idDepartment}>
                                <td>Department {dept.idDepartment}</td>
                                <td>{dept.count}</td>
                                <td>
                                  <span className="badge bg-label-secondary">Not Started</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted text-center py-2">No departments found for this template</p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Action Section - Only show if user can take action */}
            {canTakeAction() && (
              <div className="mb-4">
                <h6 className="fw-bold border-bottom pb-2 mb-3">
                  Take Action
                </h6>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Approved LWD <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={approvedLWD}
                      onChange={(e) => setApprovedLWD(e.target.value)}
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-12 mb-3">
                    <label className="form-label">
                      Handover Notes / Remarks{" "}
                      <span className="text-muted">(Required for rejection)</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Enter handover notes or remarks..."
                      value={handOverNotes}
                      onChange={(e) => setHandOverNotes(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            {canTakeAction() && (
              <>
                <button
                  type="button"
                  className="btn btn-primary me-2"
                  onClick={handleApprove}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                      Processing...
                    </>
                  ) : (
                    "Approve"
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-danger me-2"
                  onClick={handleReject}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                      Processing...
                    </>
                  ) : (
                    "Reject"
                  )}
                </button>
              </>
            )}
            <button
              type="button"
              className="btn btn-outline-secondary"
              data-bs-dismiss="modal"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OffboardingCases;
