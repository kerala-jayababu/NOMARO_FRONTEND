import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

// Mock data for department queue
const mockDepartmentQueue = [
  {
    id: 1,
    caseId: "A004",
    empCode: "A004",
    employeeName: "Amy Singh",
    lwd: "2026-01-31",
    status: "Pending",
    departmentStatus: "Pending",
    dueAmount: 0,
    remarks: "Laptop return scheduled.",
    checklistItems: [
      { id: 1, item: "Return laptop / desktop & accessories", done: false, status: "Pending" },
      { id: 2, item: "Return ID card / access badge", done: true, status: "Done" },
      { id: 3, item: "Revoke email & system access (captured)", done: false, status: "Pending" },
      { id: 4, item: "Handover system credentials (captured)", done: true, status: "Done" },
    ],
  },
  {
    id: 2,
    caseId: "A012",
    empCode: "A012",
    employeeName: "Ravi Persaud",
    lwd: "2026-01-15",
    status: "Cleared",
    departmentStatus: "Cleared",
    dueAmount: 0,
    remarks: "All items cleared.",
    checklistItems: [
      { id: 1, item: "Return laptop / desktop & accessories", done: true, status: "Done" },
      { id: 2, item: "Return ID card / access badge", done: true, status: "Done" },
      { id: 3, item: "Revoke email & system access (captured)", done: true, status: "Done" },
      { id: 4, item: "Handover system credentials (captured)", done: true, status: "Done" },
    ],
  },
  {
    id: 3,
    caseId: "A015",
    empCode: "A015",
    employeeName: "Sarah Johnson",
    lwd: "2026-02-10",
    status: "Pending",
    departmentStatus: "Pending",
    dueAmount: 150,
    remarks: "Pending asset return.",
    checklistItems: [
      { id: 1, item: "Return laptop / desktop & accessories", done: false, status: "Pending" },
      { id: 2, item: "Return ID card / access badge", done: false, status: "Pending" },
      { id: 3, item: "Revoke email & system access (captured)", done: false, status: "Pending" },
      { id: 4, item: "Handover system credentials (captured)", done: false, status: "Pending" },
    ],
  },
];

const OffboardingClearances = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [departmentQueue, setDepartmentQueue] = useState(mockDepartmentQueue);

  // Current department (mock - would come from logged-in user context)
  const currentDepartment = "IT";

  // Filter cases based on search
  const filteredCases = departmentQueue.filter((item) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      item.caseId?.toLowerCase().includes(search) ||
      item.empCode?.toLowerCase().includes(search) ||
      item.employeeName?.toLowerCase().includes(search)
    );
  });

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Get badge class based on status
  const getStatusBadgeClass = (status) => {
    if (!status) return "bg-label-secondary";
    const statusLower = status.toLowerCase();
    if (statusLower === "cleared" || statusLower === "done") return "bg-label-success";
    if (statusLower === "pending") return "bg-label-warning";
    return "bg-label-secondary";
  };

  // Handle View button click
  const handleView = (caseItem) => {
    setSelectedCase({ ...caseItem });
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCase(null);
  };

  // Handle save from modal
  const handleSave = (updatedCase) => {
    setDepartmentQueue((prev) =>
      prev.map((item) =>
        item.id === updatedCase.id ? updatedCase : item
      )
    );
    toast.success("Clearance checklist updated successfully!");
    handleCloseModal();
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
            <span className="text-muted">
              Dept: <strong>{currentDepartment}</strong>
            </span>
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
          {/* Table */}
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
                    LWD
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
                    <td colSpan={6} className="text-center py-4 text-muted">
                      No cases found
                    </td>
                  </tr>
                ) : (
                  filteredCases.map((caseItem) => (
                    <tr key={caseItem.id}>
                      <td>{caseItem.caseId}</td>
                      <td>{caseItem.empCode}</td>
                      <td>{caseItem.employeeName}</td>
                      <td>{formatDate(caseItem.lwd)}</td>
                      <td>
                        <span
                          className={`badge ${getStatusBadgeClass(
                            caseItem.status
                          )}`}
                        >
                          {caseItem.status}
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
        </div>
      </div>

      {/* Clearance Checklist Modal */}
      {showModal && selectedCase && (
        <ClearanceChecklistModal
          caseData={selectedCase}
          onClose={handleCloseModal}
          onSave={handleSave}
          formatDate={formatDate}
          getStatusBadgeClass={getStatusBadgeClass}
        />
      )}
    </div>
  );
};

// ============= CLEARANCE CHECKLIST MODAL =============
const ClearanceChecklistModal = ({
  caseData,
  onClose,
  onSave,
  formatDate,
  getStatusBadgeClass,
}) => {
  const [formData, setFormData] = useState({
    ...caseData,
    checklistItems: [...caseData.checklistItems],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Check if all checklist items are done
  const allItemsDone = formData.checklistItems.every((item) => item.done);

  // Auto-update department status when all items are done
  useEffect(() => {
    if (allItemsDone) {
      setFormData((prev) => ({
        ...prev,
        departmentStatus: "Cleared",
        status: "Cleared",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        departmentStatus: "Pending",
        status: "Pending",
      }));
    }
  }, [allItemsDone]);

  // Handle checkbox toggle
  const handleCheckboxChange = (itemId) => {
    setFormData((prev) => ({
      ...prev,
      checklistItems: prev.checklistItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              done: !item.done,
              status: !item.done ? "Done" : "Pending",
            }
          : item
      ),
    }));
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle save
  const handleSave = async () => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      onSave(formData);
      setIsSubmitting(false);
    }, 500);
  };

  // Handle reset
  const handleReset = () => {
    setFormData({
      ...caseData,
      checklistItems: [...caseData.checklistItems],
    });
  };

  return (
    <div
      className="modal fade"
      id="clearanceChecklistModal"
      tabIndex="-1"
      aria-hidden="true"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
    >
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
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
            {/* Employee Details */}
            <div className="mb-4">
              <label className="form-label text-muted">Employee</label>
              <input
                type="text"
                className="form-control"
                value={`${formData.empCode} - ${formData.employeeName}`}
                readOnly
              />
            </div>

            <div className="row mb-4">
              <div className="col-md-6">
                <label className="form-label text-muted">Department Status</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.departmentStatus}
                  readOnly
                />
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted">Due Amount (if any)</label>
                <input
                  type="number"
                  className="form-control"
                  name="dueAmount"
                  value={formData.dueAmount}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label text-muted">Remarks</label>
              <textarea
                className="form-control"
                name="remarks"
                rows="3"
                value={formData.remarks}
                onChange={handleInputChange}
                placeholder="Enter remarks..."
              ></textarea>
            </div>

            {/* Checklist Items Section */}
            <div className="mb-3">
              <h6 className="fw-bold mb-3">Checklist Items</h6>
              <div
                className="table-responsive"
                style={{ maxHeight: "300px", overflowY: "auto" }}
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
                          width: "60px",
                        }}
                      >
                        Done
                      </th>
                      <th
                        style={{
                          position: "sticky",
                          top: 0,
                          backgroundColor: "white",
                          zIndex: 1,
                        }}
                      >
                        Item
                      </th>
                      <th
                        style={{
                          position: "sticky",
                          top: 0,
                          backgroundColor: "white",
                          zIndex: 1,
                          width: "100px",
                          textAlign: "right",
                        }}
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="table-border-bottom-0">
                    {formData.checklistItems.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="form-check">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={item.done}
                              onChange={() => handleCheckboxChange(item.id)}
                            />
                          </div>
                        </td>
                        <td>{item.item}</td>
                        <td className="text-end">
                          <span
                            className={`badge ${getStatusBadgeClass(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OffboardingClearances;
