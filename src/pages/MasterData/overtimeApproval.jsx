import { useState, useMemo, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import Button from "../../components/button";
import { toast } from "react-toastify";
import {
  fetchOvertimeTransactionsFullDetails,
  fetchEmployeeOvertimeConfigs,
  fetchAllSalaryMonths,
  handleApprovalWorkflow,
} from "../../redux/reducers/overtimeApproval";

const OvertimeApproval = () => {
  const dispatch = useDispatch();
  const {
    overtimeTransactions,
    employeeOvertimeConfigs,
    salaryMonths,
    loading,
    error,
  } = useSelector((state) => state.overtimeApproval);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedItems, setSelectedItems] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // "APPROVED" or "REJECTED"
  const [isProcessing, setIsProcessing] = useState(false);

  // Track which employee configs have already been fetched to avoid duplicate calls
  const fetchedEmployeeIds = useRef(new Set());

  // Fetch main listing + salary months on mount
  useEffect(() => {
    dispatch(fetchOvertimeTransactionsFullDetails());
    dispatch(fetchAllSalaryMonths());
  }, [dispatch]);

  // Once transactions are loaded, fetch overtime configs for each unique employee
  useEffect(() => {
    const data = overtimeTransactions?.data;
    if (!data || data.length === 0) return;

    const uniqueEmployeeIds = [
      ...new Set(data.map((item) => item.idEmployee)),
    ];

    uniqueEmployeeIds.forEach((empId) => {
      if (!fetchedEmployeeIds.current.has(empId)) {
        fetchedEmployeeIds.current.add(empId);
        dispatch(fetchEmployeeOvertimeConfigs(empId));
      }
    });
  }, [overtimeTransactions, dispatch]);

  // Status filter options
  const statusOptions = [
    { value: "ALL", label: "All Status" },
    { value: "PENDING", label: "Pending" },
    { value: "SUBMITTED", label: "Submitted" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
  ];

  // Build a lookup map: idSalaryMonth → salaryMonthText
  const salaryMonthMap = useMemo(() => {
    const map = {};
    (Array.isArray(salaryMonths) ? salaryMonths : []).forEach((m) => {
      map[m.idSalaryMonth] = m.salaryMonthText;
    });
    return map;
  }, [salaryMonths]);

  // Get matching overtime config for employee + dayType
  const getOvertimeConfig = (idEmployee, dayType) => {
    const configs = employeeOvertimeConfigs[idEmployee];
    if (!configs || configs.length === 0) return null;
    return configs.find(
      (c) => c.dayType?.toUpperCase() === dayType?.toUpperCase()
    ) || null;
  };

  // Map API response to table-friendly structure
  const applicationsData = useMemo(() => {
    const data = overtimeTransactions?.data;
    if (!data) return [];

    return data.map((item) => {
      const config = getOvertimeConfig(item.idEmployee, item.dayType);
      const hourlyRate = config?.standardRate || null;
      const multiplier = config?.dayRate || null;
      const totalAmount =
        hourlyRate != null && multiplier != null
          ? hourlyRate * multiplier * (item.durationInHours || 0)
          : null;

      // Salary status
      let salaryStatus = "Yet to Account in Salary";
      if (item.idSalaryMonthAccounted != null) {
        const monthText =
          salaryMonthMap[item.idSalaryMonthAccounted] || item.idSalaryMonthAccounted;
        const amount = item.salaryAccountedAmount;
        salaryStatus = amount != null
          ? `Accounted on ${monthText} Salary (GYD ${amount.toLocaleString()})`
          : `Accounted on ${monthText} Salary`;
      }

      return {
        id: item.idOvertimeTransaction,
        idEmployee: item.idEmployee,
        employeeCode: item.employeeCode || "",
        employeeName: item.employeeName || "",
        designation: item.designation || "",
        department: item.department || "",
        startDate: item.startDate,
        startTime: item.startTime,
        endDate: item.endDate,
        endTime: item.endTime,
        durationInHours: item.durationInHours || 0,
        dayType: item.dayType || "",
        reason: item.reasonForOvertime || "",
        status: item.approvalStatus || "PENDING",
        hourlyRate,
        multiplier,
        totalAmount,
        salaryStatus,
        approvalCycles: (item.approvalCycles || []).map((cycle) => ({
          name: cycle.actionedByName || cycle.approvalAuthorityName || "-",
          level: cycle.levelNumber,
          statusLabel: cycle.approvalStatusName || "",
          status: cycle.approvalStatus || "Pending",
          actionDate: cycle.actionDate,
        })),
      };
    });
  }, [overtimeTransactions, employeeOvertimeConfigs, salaryMonthMap]);

  // Filter based on search query and status
  const filteredData = useMemo(() => {
    return applicationsData.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.employeeName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ||
        item.status.toUpperCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applicationsData, searchQuery, statusFilter]);

  // Only non-final items can be selected for approval/rejection
  const canTakeAction = (item) =>
    item.status !== "APPROVED" && item.status !== "REJECTED";

  const selectableItems = filteredData.filter(canTakeAction);

  // Handle select-all checkbox
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(selectableItems.map((item) => item.id));
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

  // Show confirmation modal before bulk action
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

  // Execute bulk approval/rejection after confirmation
  const executeBulkAction = async () => {
    if (!confirmAction || selectedItems.length === 0) return;

    const payload = selectedItems.map((id) => ({
      entityTablePrimaryKeyID: id,
      entityCode: "OVERTIME",
      status: confirmAction,
      rejectReason: "",
      leavePassageAmount: 0,
      idPayRollScreen: 0,
    }));

    try {
      setIsProcessing(true);
      const resultAction = await dispatch(handleApprovalWorkflow(payload));

      if (handleApprovalWorkflow.fulfilled.match(resultAction)) {
        if (resultAction.payload?.success !== false) {
          toast.success(
            `${selectedItems.length} OT transaction(s) ${confirmAction === "APPROVED" ? "approved" : "rejected"} successfully!`,
            { position: "top-right", autoClose: 3000 }
          );
          setSelectedItems([]);
          fetchedEmployeeIds.current.clear();
          dispatch(fetchOvertimeTransactionsFullDetails());
        } else {
          toast.error(resultAction.payload?.message || "Failed to process approval", {
            position: "top-right",
            autoClose: 4000,
          });
        }
      } else {
        toast.error(resultAction.payload?.message || "Failed to process approval", {
          position: "top-right",
          autoClose: 4000,
        });
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
    }
  };

  // Badge class helper
  const getStatusBadgeClass = (status) => {
    const s = (status || "").toUpperCase();
    if (s === "APPROVED" || s.includes("APPROVED")) return "bg-label-success";
    if (s === "REJECTED" || s.includes("REJECTED")) return "bg-label-danger";
    if (s === "PENDING" || s.includes("PENDING")) return "bg-label-warning";
    return "bg-label-secondary";
  };

  // Format dayType for display
  const formatDayType = (dayType) => {
    switch (dayType?.toUpperCase()) {
      case "WORKINGDAY":
        return "Working Day";
      case "PUBLICHOLIDAY":
        return "Public Holiday";
      case "HOLIDAY":
        return "Holiday";
      default:
        return dayType || "-";
    }
  };

  // Combine date + time into a displayable string
  const formatDateTimeCombined = (dateStr, timeStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const datePart = date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
    if (!timeStr) return datePart;
    const [hours, minutes] = timeStr.split(":");
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${datePart} ${String(h12).padStart(2, "0")}:${minutes} ${ampm}`;
  };

  // Format date with time from ISO string
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

  // Format date only
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
              <h5 className="m-0">Overtime Approvals</h5>
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
                <div className="col-md-4">
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
                <div className="col-md-4">
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

              {/* Overtime Approval Table */}
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-4 text-danger">{error}</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th className="text-center" style={{ width: "40px" }}>
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
                        <th style={{ minWidth: "200px" }}>Employee</th>
                        <th>Overtime Period</th>
                        <th>Approver & Payment Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.length === 0 ? (
                        <tr>
                          <td
                            colSpan="4"
                            className="text-center py-4 text-muted"
                          >
                            No overtime requests found
                          </td>
                        </tr>
                      ) : (
                        filteredData.map((item) => (
                          <tr key={item.id}>
                            {/* Checkbox */}
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

                            {/* Employee — stacked info */}
                            <td>
                              <div className="fw-medium">{item.employeeCode}</div>
                              <div>{item.employeeName}</div>
                              <div className="text-muted small">{item.designation}</div>
                              <div className="text-muted small">{item.department}</div>
                            </td>

                            {/* Overtime Period — stacked */}
                            <td>
                              <div>Start : {formatDateTimeCombined(item.startDate, item.startTime)}</div>
                              <div>Finish : {formatDateTimeCombined(item.endDate, item.endTime)}</div>
                              <div className="mt-1">Duration : {item.durationInHours} Hr{item.durationInHours !== 1 ? "s" : ""}</div>
                              <div>Day : {formatDayType(item.dayType)}</div>
                              {item.reason ? <div className="mt-1 text-muted small">Reason : {item.reason}</div> : null}
                            </td>

                            {/* Approver & Payment Details */}
                            <td className="p-0">
                              <table className="table table-sm table-bordered mb-0">
                                <thead className="table-light">
                                  <tr>
                                    <th className="small">Action By</th>
                                    <th className="small">Level</th>
                                    <th className="small">Status</th>
                                    <th className="small">Date</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.approvalCycles.map((cycle, idx) => (
                                    <tr key={idx}>
                                      <td>{cycle.name}</td>
                                      <td>{cycle.level}</td>
                                      <td>
                                        <span className={`badge ${getStatusBadgeClass(cycle.status)}`}>
                                          {cycle.status}
                                        </span>
                                      </td>
                                      <td>{cycle.actionDate ? formatDateTime(cycle.actionDate) : "-"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <div className="px-3 py-2">
                                {item.hourlyRate != null ? (
                                  <>
                                    <div className="fw-bold mb-1">Payment Details</div>
                                    <div>Hourly Rate : GYD {item.hourlyRate.toLocaleString()} | Multiplier : {item.multiplier} | Total Amount : {item.totalAmount != null ? item.totalAmount.toLocaleString() : "-"}</div>
                                    <div className="mt-1 small text-muted">{item.salaryStatus}</div>
                                  </>
                                ) : (
                                  <div className="small text-muted">{item.salaryStatus}</div>
                                )}
                              </div>
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
                  Confirm {confirmAction === "APPROVED" ? "Approval" : "Rejection"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                  }}
                  disabled={isProcessing}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-0">
                  Are you sure you want to {confirmAction === "APPROVED" ? "Approve" : "Reject"} all the{" "}
                  <strong>{selectedItems.length}</strong> OT Transaction{selectedItems.length !== 1 ? "s" : ""}?
                </p>
              </div>
              <div className="modal-footer">
                <Button
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                  }}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  className={`btn ${confirmAction === "APPROVED" ? "btn-primary" : "btn-danger"}`}
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

export default OvertimeApproval;
