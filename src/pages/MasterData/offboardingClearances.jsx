import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  fetchExitClearanceForDepartmentUser,
  fetchExitClearanceDetails,
  clearExitClearanceDetails,
  submitExitCaseDepartmentClearanceLines,
} from "../../redux/reducers/offboardingCases";
import Utils from "../../utils/Utils";

const OffboardingClearances = () => {
  const dispatch = useDispatch();
  const { departmentQueue, loading, error } = useSelector(
    (state) => state.offboardingCases,
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);

  // Fetch department queue on mount
  useEffect(() => {
    dispatch(fetchExitClearanceForDepartmentUser());
  }, [dispatch]);

  // Show error toast if any
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Filter cases based on search
  const filteredCases = departmentQueue.filter((item) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      item.employeeCode?.toLowerCase().includes(search) ||
      item.employeeName?.toLowerCase().includes(search) ||
      String(item.idExitCase)?.toLowerCase().includes(search)
    );
  });

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return Utils.formatDisplayDate(dateString);
  };

  // Get badge class based on status
  const getStatusBadgeClass = (status) => {
    if (!status) return "bg-label-secondary";
    const statusLower = status.toLowerCase();
    if (
      statusLower === "cleared" ||
      statusLower === "done" ||
      statusLower === "completed"
    )
      return "bg-label-success";
    if (statusLower === "pending") return "bg-label-warning";
    if (statusLower === "in_progress" || statusLower === "inprogress")
      return "bg-label-info";
    return "bg-label-secondary";
  };

  // Handle View button click
  const handleView = (caseItem) => {
    setSelectedCaseId(caseItem.idExitCase);
    setSelectedDepartmentId(caseItem.logginedEmployeeIdDepartment);
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCaseId(null);
    setSelectedDepartmentId(null);
    dispatch(clearExitClearanceDetails());
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Page Header */}
      <div className="pb-3">
        <h5 className="m-0">Offboarding Clearances</h5>
      </div>

      {/* My Department Queue Card */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between pb-3">
          <h5 className="m-0">My Department Queue</h5>
          <div className="d-flex align-items-center gap-3">
            <div className="list_searchbox">
              <input
                type="search"
                className="form-control"
                placeholder="Search by Case / Emp"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ minWidth: "200px" }}
              />
              <i className="bx bx-search"></i>
            </div>
          </div>
        </div>
        <div className="card-body">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          {/* Table */}
          {!loading && (
            <div
              className="table-responsive text-nowrap"
              style={{ maxHeight: "450px", overflowY: "auto" }}
            >
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th
                      style={{
                        position: "sticky",
                        top: 0,
                        backgroundColor: "white",
                        zIndex: 1,
                      }}
                    >
                      Case ID
                    </th>
                    <th
                      style={{
                        position: "sticky",
                        top: 0,
                        backgroundColor: "white",
                        zIndex: 1,
                      }}
                    >
                      Emp Code
                    </th>
                    <th
                      style={{
                        position: "sticky",
                        top: 0,
                        backgroundColor: "white",
                        zIndex: 1,
                      }}
                    >
                      Employee Name
                    </th>
                    <th
                      style={{
                        position: "sticky",
                        top: 0,
                        backgroundColor: "white",
                        zIndex: 1,
                      }}
                    >
                      Proposed LWD
                    </th>
                    <th
                      style={{
                        position: "sticky",
                        top: 0,
                        backgroundColor: "white",
                        zIndex: 1,
                      }}
                    >
                      Approved LWD
                    </th>
                    <th
                      style={{
                        position: "sticky",
                        top: 0,
                        backgroundColor: "white",
                        zIndex: 1,
                      }}
                    >
                      Status
                    </th>
                    <th
                      style={{
                        position: "sticky",
                        top: 0,
                        backgroundColor: "white",
                        zIndex: 1,
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="table-border-bottom-0">
                  {filteredCases.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted">
                        No cases found
                      </td>
                    </tr>
                  ) : (
                    filteredCases.map((caseItem) => (
                      <tr key={caseItem.idExitCase}>
                        <td>{caseItem.idExitCase}</td>
                        <td>{caseItem.employeeCode}</td>
                        <td>{caseItem.employeeName}</td>
                        <td>{formatDate(caseItem.proposedLWD)}</td>
                        <td>{formatDate(caseItem.approvedLWD)}</td>
                        <td>
                          <span
                            className={`badge ${getStatusBadgeClass(
                              caseItem.currentStatus,
                            )}`}
                          >
                            {caseItem.currentStatus}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-icon btn-outline-secondary border-0"
                            onClick={() => handleView(caseItem)}
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
          )}
        </div>
      </div>

      {/* Clearance Checklist Modal */}
      {showModal && selectedCaseId && (
        <ClearanceChecklistModal
          idExitCase={selectedCaseId}
          idDepartment={selectedDepartmentId}
          onClose={handleCloseModal}
          getStatusBadgeClass={getStatusBadgeClass}
        />
      )}
    </div>
  );
};

// ============= CLEARANCE CHECKLIST MODAL =============
const ClearanceChecklistModal = ({
  idExitCase,
  idDepartment,
  onClose,
  getStatusBadgeClass,
}) => {
  const dispatch = useDispatch();
  const { exitClearanceDetails, clearanceLoading, actionLoading } = useSelector(
    (state) => state.offboardingCases,
  );

  // Form state
  const [formData, setFormData] = useState({
    deptClearanceStatus: "PENDING",
    dueAmount: 0,
    checklist: [],
  });

  // Fetch clearance details when modal opens
  useEffect(() => {
    if (idExitCase && idDepartment) {
      dispatch(fetchExitClearanceDetails({ idExitCase, idDepartment }));
    }
  }, [dispatch, idExitCase, idDepartment]);

  // Initialize form data when clearance details load
  useEffect(() => {
    if (exitClearanceDetails?.departments?.length > 0) {
      const dept = exitClearanceDetails.departments[0];
      setFormData({
        deptClearanceStatus: dept.header?.deptClearanceStatus || "PENDING",
        dueAmount: dept.header?.dueAmount || 0,
        checklist:
          dept.checklist?.map((item) => ({
            ...item,
            deptClearanceStatus: item.deptClearanceStatus || "PENDING",
            remarks: item.remarks || "",
          })) || [],
      });
    }
  }, [exitClearanceDetails]);

  useEffect(() => {
    const modalElement = document.getElementById("clearanceChecklistModal");
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

  // Handle status change for cleared/not required
  const handleStatusChange = (index, status) => {
    setFormData((prev) => {
      const updatedChecklist = [...prev.checklist];
      updatedChecklist[index] = {
        ...updatedChecklist[index],
        deptClearanceStatus: status,
      };
      return { ...prev, checklist: updatedChecklist };
    });
  };

  // Handle remarks change for checklist item
  const handleRemarksChange = (index, value) => {
    setFormData((prev) => {
      const updatedChecklist = [...prev.checklist];
      updatedChecklist[index] = {
        ...updatedChecklist[index],
        remarks: value,
      };
      return { ...prev, checklist: updatedChecklist };
    });
  };

  // Handle form field changes
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle save
  const handleSave = async () => {
    // Check if all items have been marked (either CLEARED or NOTREQUIRED)
    const allItemsMarked = formData.checklist.every(
      (item) =>
        item.deptClearanceStatus === "CLEARED" ||
        item.deptClearanceStatus === "NOTREQUIRED",
    );

    const payload = {
      idExitCase,
      idDepartment,
      deptRemarks: "",
      dueAmount: parseFloat(formData.dueAmount) || 0,
      deptClearanceStatus: allItemsMarked ? "CLEARED" : "PENDING",
      markDepartmentCleared: allItemsMarked,
      clearanceLineUpdates: formData.checklist.map((item) => ({
        idExitCaseDepartmentClearanceLine:
          item.idExitCaseDepartmentClearanceLine,
        isCompleted:
          item.deptClearanceStatus === "CLEARED" ||
          item.deptClearanceStatus === "NOTREQUIRED",
        clearanceStatus: item.deptClearanceStatus,
        remarks: item.remarks || "",
      })),
    };

    try {
      const result = await dispatch(
        submitExitCaseDepartmentClearanceLines(payload),
      ).unwrap();
      if (result?.success !== false) {
        toast.success("Clearance submitted successfully");
        dispatch(fetchExitClearanceForDepartmentUser());
        onClose();
      } else {
        toast.error(result?.message || "Failed to submit clearance");
      }
    } catch (error) {
      toast.error(error?.message || "Failed to submit clearance");
    }
  };

  const exitCase = exitClearanceDetails?.exitCase;
  const department = exitClearanceDetails?.departments?.[0];
  const canEdit = department?.canEditChecklist || department?.canEditDeptHeader;

  return (
    <div
      className="modal fade"
      id="clearanceChecklistModal"
      tabIndex="-1"
      aria-hidden="true"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Clearance Checklist</h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            {clearanceLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : exitClearanceDetails ? (
              <>
                {/* Employee Info */}
                <div className="mb-3">
                  <label className="form-label text-muted small mb-1">
                    Employee
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={`${exitCase?.idEmployee || ""} - ${exitCase?.employeeName || ""}`}
                    disabled
                  />
                </div>

                {/* Department Status & Due Amount - Commented for now */}
                {/* <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted small mb-1">Department Status</label>
                    <select
                      className="form-select"
                      value={formData.deptClearanceStatus}
                      onChange={(e) => handleFieldChange("deptClearanceStatus", e.target.value)}
                      disabled={!department?.canEditDeptHeader}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="CLEARED">Cleared</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small mb-1">Due Amount (if any)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.dueAmount}
                      onChange={(e) => handleFieldChange("dueAmount", e.target.value)}
                      disabled={!department?.canEditDeptHeader}
                      min="0"
                    />
                  </div>
                </div> */}

                {/* Checklist Items */}
                <div className="mb-3">
                  <h6 className="fw-bold text-primary mb-3">Checklist Items</h6>

                  <div className="table-responsive">
                    <table className="table table-borderless mb-0">
                      <thead>
                        <tr className="border-bottom">
                          <th style={{ minWidth: "250px" }}>Item</th>
                          <th
                            style={{ minWidth: "100px", whiteSpace: "nowrap" }}
                          >
                            Status
                          </th>
                          <th style={{ minWidth: "250px" }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.checklist.length > 0 ? (
                          formData.checklist.map((item, index) => (
                            <tr
                              key={item.idExitCaseDepartmentClearanceLine}
                              className="border-bottom"
                            >
                              <td className="align-middle">
                                {item.checkListItem}
                              </td>
                              <td
                                className="align-middle"
                                style={{ whiteSpace: "nowrap" }}
                              >
                                <div className="d-flex gap-3">
                                  <div className="form-check">
                                    <input
                                      type="radio"
                                      className="form-check-input"
                                      name={`status-${item.idExitCaseDepartmentClearanceLine}`}
                                      id={`cleared-${item.idExitCaseDepartmentClearanceLine}`}
                                      checked={
                                        item.deptClearanceStatus ===
                                          "CLEARED" ||
                                        item.deptClearanceStatus === "Cleared"
                                      }
                                      onChange={() =>
                                        handleStatusChange(index, "CLEARED")
                                      }
                                      disabled={!department?.canEditChecklist}
                                    />
                                    <label
                                      className="form-check-label small"
                                      htmlFor={`cleared-${item.idExitCaseDepartmentClearanceLine}`}
                                    >
                                      Cleared
                                    </label>
                                  </div>
                                  <div className="form-check">
                                    <input
                                      type="radio"
                                      className="form-check-input"
                                      name={`status-${item.idExitCaseDepartmentClearanceLine}`}
                                      id={`notrequired-${item.idExitCaseDepartmentClearanceLine}`}
                                      checked={
                                        item.deptClearanceStatus ===
                                          "NOTREQUIRED" ||
                                        item.deptClearanceStatus ===
                                          "NotRequired"
                                      }
                                      onChange={() =>
                                        handleStatusChange(index, "NOTREQUIRED")
                                      }
                                      disabled={!department?.canEditChecklist}
                                    />
                                    <label
                                      className="form-check-label small"
                                      htmlFor={`notrequired-${item.idExitCaseDepartmentClearanceLine}`}
                                    >
                                      Not Required
                                    </label>
                                  </div>
                                </div>
                              </td>
                              <td className="align-middle">
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={item.remarks}
                                  onChange={(e) =>
                                    handleRemarksChange(index, e.target.value)
                                  }
                                  disabled={!department?.canEditChecklist}
                                  placeholder="Enter remarks"
                                />
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={3}
                              className="text-center text-muted py-3"
                            >
                              No checklist items
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Auto-status note */}
                {canEdit && (
                  <div className="d-flex justify-content-end gap-2 mb-3">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSave}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Submitting...
                        </>
                      ) : (
                        "Submit"
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4 text-muted">
                No clearance details found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OffboardingClearances;
