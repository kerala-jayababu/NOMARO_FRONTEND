import { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Button from "../../components/button";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import {
  fetchForgotCardEntryDetailsForApproval,
  handleForgotCardApprovalWorkflow,
} from "../../redux/reducers/forgotCardApproval";

const ForgotCardApproval = () => {
  const dispatch = useDispatch();
  const { forgotCardEntries, loading, error } = useSelector(
    (state) => state.forgotCardApproval
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("SUBMITTED");
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 15);
    return date.toISOString().split("T")[0];
  });
  const [selectedItems, setSelectedItems] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectReasonError, setRejectReasonError] = useState("");

  const statusOptions = [
    { value: "ALL", label: "All Status" },
    { value: "SUBMITTED", label: "Submitted" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
  ];

  useEffect(() => {
    dispatch(
      fetchForgotCardEntryDetailsForApproval({
        dateFrom: dateFrom || "",
        approvalStatus: statusFilter === "ALL" ? "" : statusFilter,
      })
    );
  }, [dispatch, dateFrom, statusFilter]);

  const applicationsData = useMemo(() => {
    const data = forgotCardEntries?.data;
    if (!data) return [];

    return data.map((item) => ({
      id: item.idClockInDetail,
      idEmployee: item.idemployee,
      employeeName: item.employeeName || "",
      designation: item.designationName || "",
      department: item.departmentName || "",
      entryDate: item.forgotCardEntryDate,
      entryTime: item.entryTime,
      exitTime: item.exitTime,
      reason: item.reason || "",
      statusDetails: item.statusDetails || "",
      approvalStatus: item.approvalStatus || "",
    }));
  }, [forgotCardEntries]);

  const filteredData = useMemo(() => {
    return applicationsData.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.designation.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [applicationsData, searchQuery]);

  const canTakeAction = (item) => {
    return (item.approvalStatus || "").toUpperCase() === "SUBMITTED";
  };

  const selectableItems = filteredData.filter(canTakeAction);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(selectableItems.map((item) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleCheckbox = (id, checked) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, id]);
    } else {
      setSelectedItems((prev) => prev.filter((x) => x !== id));
    }
  };

  const handleApproveSelected = () => {
    if (selectedItems.length === 0) return;
    setConfirmAction("APPROVED");
    setShowConfirmModal(true);
  };

  const handleRejectSelected = () => {
    if (selectedItems.length === 0) return;
    setConfirmAction("REJECTED");
    setShowConfirmModal(true);
  };

  const executeBulkAction = async () => {
    if (!confirmAction || selectedItems.length === 0) return;

    if (confirmAction === "REJECTED" && !rejectReason.trim()) {
      setRejectReasonError("Reason for rejection is mandatory");
      return;
    }

    const payload = selectedItems.map((id) => ({
      entityTablePrimaryKeyID: id,
      entityCode: "FORGOTCARD",
      status: confirmAction,
      rejectReason: confirmAction === "REJECTED" ? rejectReason.trim() : "",
      leavePassageAmount: 0,
      idPayRollScreen: 0,
    }));

    try {
      setIsProcessing(true);
      const resultAction = await dispatch(
        handleForgotCardApprovalWorkflow(payload)
      );

      if (handleForgotCardApprovalWorkflow.fulfilled.match(resultAction)) {
        if (resultAction.payload?.success !== false) {
          toast.success(
            `${selectedItems.length} forgot card entry(s) ${
              confirmAction === "APPROVED" ? "approved" : "rejected"
            } successfully!`,
            { position: "top-right", autoClose: 3000 }
          );
          setSelectedItems([]);
          dispatch(
            fetchForgotCardEntryDetailsForApproval({
              dateFrom: dateFrom || "",
              approvalStatus: statusFilter === "ALL" ? "" : statusFilter,
            })
          );
        } else {
          toast.error(
            resultAction.payload?.message || "Failed to process approval",
            { position: "top-right", autoClose: 4000 }
          );
        }
      } else {
        toast.error(
          resultAction.payload?.message || "Failed to process approval",
          { position: "top-right", autoClose: 4000 }
        );
      }
    } catch (error) {
      toast.error("Failed to process approval", {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setIsProcessing(false);
      setShowConfirmModal(false);
      setConfirmAction(null);
      setRejectReason("");
      setRejectReasonError("");
    }
  };

  const getStatusBadgeClass = (status) => {
    const s = (status || "").toUpperCase();
    if (s === "APPROVED" || s.includes("APPROVED")) return "bg-label-success";
    if (s === "REJECTED" || s.includes("REJECTED")) return "bg-label-danger";
    if (s === "SUBMITTED" || s === "PENDING") return "bg-label-warning";
    return "bg-label-secondary";
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const datePart = d.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
    const timePart = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${datePart} ${timePart}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">Forgot Card Approvals</h5>
            </div>
            <div className="card-body">
              {/* Header Controls */}
              <div className="row mb-3 align-items-end">
                <div className="col-md-4 d-flex align-items-center gap-2">
                  <Button
                    className={`btn btn-primary btn-sm${
                      selectedItems.length === 0 ? " disabled" : ""
                    }`}
                    onClick={handleApproveSelected}
                  >
                    Approve Selected ({selectedItems.length})
                  </Button>
                  <Button
                    className={`btn btn-danger btn-sm${
                      selectedItems.length === 0 ? " disabled" : ""
                    }`}
                    onClick={handleRejectSelected}
                  >
                    Reject Selected ({selectedItems.length})
                  </Button>
                </div>
                <div className="col-md-2" style={{ zIndex: 2 }}>
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
                      placeholder="Search by Name / Department"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <i className="bx bx-search"></i>
                  </div>
                </div>
              </div>

              {/* Forgot Card Approval Table */}
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-4 text-danger">{error}</div>
              ) : (
                <div
                  className="table-responsive"
                  style={{ maxHeight: "calc(100vh - 300px)", overflowY: "auto" }}
                >
                  <table className="table table-striped table-bordered">
                    <thead
                      className="table-light"
                      style={{ position: "sticky", top: 0, zIndex: 1 }}
                    >
                      <tr>
                        <th
                          className="text-center"
                          style={{ width: "40px" }}
                        >
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={
                              selectableItems.length > 0 &&
                              selectedItems.length === selectableItems.length
                            }
                            onChange={handleSelectAll}
                            disabled={selectableItems.length === 0}
                          />
                        </th>
                        <th style={{ width: "200px" }}>Employee</th>
                        <th>Designation</th>
                        <th style={{ width: "150px" }}>Reason</th>
                        <th>Date</th>
                        <th>Entry Time</th>
                        <th>Exit Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.length === 0 ? (
                        <tr>
                          <td
                            colSpan="8"
                            className="text-center py-4 text-muted"
                          >
                            No forgot card entry requests found
                          </td>
                        </tr>
                      ) : (
                        filteredData.map((item) => (
                          <tr key={item.id}>
                            <td className="text-center align-middle">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={selectedItems.includes(item.id)}
                                onChange={(e) =>
                                  handleCheckbox(item.id, e.target.checked)
                                }
                                disabled={!canTakeAction(item)}
                              />
                            </td>
                            <td>{item.employeeName}</td>
                            <td>{item.designation}</td>
                            <td style={{ width: "150px" }}>{item.reason}</td>
                            <td>{formatDate(item.entryDate)}</td>
                            <td>{formatDateTime(item.entryTime)}</td>
                            <td>{formatDateTime(item.exitTime)}</td>
                            <td>
                              <span
                                className={`badge ${getStatusBadgeClass(
                                  item.approvalStatus
                                )}`}
                              >
                                {item.approvalStatus}
                              </span>
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
        </div>
      </div>

      {/* Bulk Confirmation Modal */}
      {showConfirmModal && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Confirm{" "}
                  {confirmAction === "APPROVED" ? "Approval" : "Rejection"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                    setRejectReason("");
                    setRejectReasonError("");
                  }}
                  disabled={isProcessing}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-0">
                  Are you sure you want to{" "}
                  {confirmAction === "APPROVED" ? "Approve" : "Reject"} all the{" "}
                  <strong>{selectedItems.length}</strong> forgot card entry(s)?
                </p>
                {confirmAction === "REJECTED" && (
                  <div className="mt-3">
                    <label className="form-label mb-1 fw-medium">
                      Reason for Rejection{" "}
                      <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className={`form-control ${
                        rejectReasonError ? "is-invalid" : ""
                      }`}
                      rows="3"
                      placeholder="Enter reason for rejection..."
                      value={rejectReason}
                      onChange={(e) => {
                        setRejectReason(e.target.value);
                        if (rejectReasonError) setRejectReasonError("");
                      }}
                      disabled={isProcessing}
                    ></textarea>
                    {rejectReasonError && (
                      <div className="invalid-feedback">
                        {rejectReasonError}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <Button
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                    setRejectReason("");
                    setRejectReasonError("");
                  }}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  className={`btn ${
                    confirmAction === "APPROVED" ? "btn-primary" : "btn-danger"
                  }`}
                  onClick={executeBulkAction}
                  disabled={isProcessing}
                >
                  {isProcessing
                    ? "Processing..."
                    : confirmAction === "APPROVED"
                    ? "Approve"
                    : "Reject"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForgotCardApproval;
