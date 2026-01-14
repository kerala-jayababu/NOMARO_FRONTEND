import React, { useEffect, useState } from "react";
import EmployeeManagementService from "../../core/services/EmployeeManagementService";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useLoader } from "../../components/LoaderContext";
import { toast } from "react-toastify";
import moment from "moment";

const ServiceApproval = () => {
  const { showLoader, hideLoader } = useLoader();
  const [serviceChanges, setServiceChanges] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingItemId, setRejectingItemId] = useState(null);
  const [isBulkReject, setIsBulkReject] = useState(false);

  // Filter states
  const [status, setStatus] = useState("ALL");
  const [changeType, setChangeType] = useState("ALL");
  const [dateFrom, setDateFrom] = useState(null);
  const [searchText, setSearchText] = useState("");

  // Dropdown options
  const statusOptions = [
    { value: "SUBMITTED", label: "SUBMITTED" },
    { value: "APPROVED", label: "APPROVED" },
    { value: "ALL", label: "All" },
  ];

  const changeTypeOptions = [
    { value: "ALL", label: "All" },
    { value: "DESIGNATION", label: "Designation" },
    { value: "DEPARTMENT", label: "Department" },
    { value: "EMPLOYMENTTYPE", label: "Employee Type" },
    { value: "REPOFFICER", label: "Reporting Officer" },
  ];

  useEffect(() => {
    loadServiceChanges();
  }, [status, changeType, dateFrom, searchText]);

  const loadServiceChanges = async () => {
    try {
      showLoader();
      const params = {
        Status: status,
        ChangeType: changeType,
        DateFrom: dateFrom ? moment(dateFrom).format("YYYY-MM-DD") : "",
        SearchText: searchText || "",
      };

      const result = await EmployeeManagementService.getEmployeeServiceChangesForApproval(params);
      
      if (result.error) {
        toast.error(result.error || "Failed to load service changes");
        setServiceChanges([]);
      } else {
        setServiceChanges(result.data?.data || []);
      }
    } catch (error) {
      toast.error("Failed to load service changes");
      console.error("Error loading service changes:", error);
      setServiceChanges([]);
    } finally {
      hideLoader();
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const selectableItems = serviceChanges
        .filter((item) => item.approvalStatus?.toUpperCase() === "SUBMITTED")
        .map((item) => item.idEmployeeServiceChange);
      setSelectedItems(selectableItems);
      handelCheckboxCheck(true);
    } else {
      setSelectedItems([]);
      handelCheckboxCheck(false);
    }
  };

  const handelCheckboxCheck = (checked) => {
    Array.from(document.querySelectorAll(".data-checkbox")).forEach((item) => {
      if (!item.disabled) {
        item.checked = checked;
      }
    });
  };

  const handleItemCheckbox = (e, itemId) => {
    if (e.target.checked) {
      setSelectedItems((prev) => [...prev, itemId]);
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== itemId));
    }
  };

  const handleApproveSelected = async () => {
    if (selectedItems.length === 0) {
      toast.error("Please select at least one record to approve");
      return;
    }

    try {
      showLoader();
      const result = await EmployeeManagementService.approveServiceChanges(
        selectedItems,
        "APPROVED",
        ""
      );
      if (result.error) {
        toast.error(result.error || "Failed to approve service changes");
      } else {
        toast.success("Service changes approved successfully");
        setSelectedItems([]);
        loadServiceChanges();
      }
    } catch (error) {
      toast.error("Failed to approve service changes");
      console.error("Error approving service changes:", error);
    } finally {
      hideLoader();
    }
  };

  const handleRejectSelected = () => {
    if (selectedItems.length === 0) {
      toast.error("Please select at least one record to reject");
      return;
    }
    setIsBulkReject(true);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleApproveItem = async (itemId) => {
    try {
      showLoader();
      const result = await EmployeeManagementService.approveServiceChanges(
        [itemId],
        "APPROVED",
        ""
      );
      if (result.error) {
        toast.error(result.error || "Failed to approve service change");
      } else {
        toast.success("Service change approved successfully");
        loadServiceChanges();
      }
    } catch (error) {
      toast.error("Failed to approve service change");
      console.error("Error approving service change:", error);
    } finally {
      hideLoader();
    }
  };

  const handleRejectItem = (itemId) => {
    setIsBulkReject(false);
    setRejectingItemId(itemId);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }

    try {
      showLoader();
      const itemIds = isBulkReject ? selectedItems : [rejectingItemId];
      const result = await EmployeeManagementService.approveServiceChanges(
        itemIds,
        "REJECTED",
        rejectReason.trim()
      );
      if (result.error) {
        toast.error(result.error || "Failed to reject service changes");
      } else {
        toast.success(
          isBulkReject
            ? "Service changes rejected successfully"
            : "Service change rejected successfully"
        );
        setSelectedItems([]);
        setRejectReason("");
        setShowRejectModal(false);
        setRejectingItemId(null);
        setIsBulkReject(false);
        loadServiceChanges();
      }
    } catch (error) {
      toast.error("Failed to reject service changes");
      console.error("Error rejecting service changes:", error);
    } finally {
      hideLoader();
    }
  };

  const handleSearch = () => {
    loadServiceChanges();
  };

  const getChangeTypeLabel = (changeType) => {
    const changeTypeMap = {
      REPOFFICER: "Reporting Officer",
      DEPARTMENT: "Department",
      DESIGNATION: "Designation",
      EMPLOYMENTTYPE: "Employee Type",
    };
    return changeTypeMap[changeType] || changeType;
  };

  const getStatusBadgeClass = (status) => {
    const statusUpper = status?.toUpperCase();
    if (statusUpper === "APPROVED") {
      return "bg-primary";
    } else if (statusUpper === "REJECTED") {
      return "bg-danger";
    } else if (statusUpper === "SUBMITTED") {
      return "bg-warning";
    }
    return "bg-secondary";
  };

  const selectableItems = serviceChanges.filter(
    (item) => item.approvalStatus?.toUpperCase() === "SUBMITTED"
  );

  const isAllSelected =
    selectableItems.length > 0 &&
    selectedItems.length === selectableItems.length;

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between px-3 py-3">
          <h5 className="m-0">Service Approval</h5>
        </div>
        <div className="card-body">
          {/* Filters Section */}
          <div className="row mb-3">
            <div className="col-md-3">
              <label className="form-label mb-1">Status</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label mb-1">Change Type</label>
              <select
                className="form-select"
                value={changeType}
                onChange={(e) => setChangeType(e.target.value)}
              >
                {changeTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label mb-1">Date From</label>
              <DatePicker
                selected={dateFrom}
                onChange={(date) => setDateFrom(date)}
                dateFormat="dd-MM-yyyy"
                className="form-control"
                placeholderText="DD-MM-YYYY"
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                wrapperClassName="d-block"
                minDate={moment("2026-01-01").toDate()}
                maxDate={new Date()}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label mb-1">Search</label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Employee name"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                />
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={handleSearch}
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Actions Section */}
          <div className="row mb-3">
            <div className="col-md-12 d-flex align-items-center gap-2">
              <button
                className="btn btn-primary"
                onClick={handleApproveSelected}
                disabled={selectedItems.length === 0}
              >
                Approve Selected
              </button>
              <button
                className="btn btn-outline-primary"
                onClick={handleRejectSelected}
                disabled={selectedItems.length === 0}
              >
                Reject Selected
              </button>
              {selectedItems.length > 0 && (
                <span className="text-muted ms-2">
                  Select records to approve
                </span>
              )}
            </div>
          </div>

          {/* Table Section */}
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Employee Code</th>
                  <th>Employee Name</th>
                  {/* <th>Designation</th>
                  <th>Department</th> */}
                  <th>Change Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th width="12%">Effective Date</th>
                  {/* <th>Created By</th> */}
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {serviceChanges.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="text-center py-4 text-muted">
                      No service changes found
                    </td>
                  </tr>
                ) : (
                  serviceChanges.map((item) => {
                    const isSubmitted = item.approvalStatus?.toUpperCase() === "SUBMITTED";
                    const isChecked = selectedItems.includes(item.idEmployeeServiceChange);
                    
                    return (
                      <tr key={item.idEmployeeServiceChange}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input data-checkbox"
                            checked={isChecked}
                            disabled={!isSubmitted}
                            onChange={(e) =>
                              handleItemCheckbox(e, item.idEmployeeServiceChange)
                            }
                          />
                        </td>
                        <td>{item.employeeCode || "-"}</td>
                        <td>{item.employeeName || "-"}</td>
                        {/* <td>{item.designation || "-"}</td>
                        <td>{item.department || "-"}</td> */}
                        <td>{getChangeTypeLabel(item.changeType)}</td>
                        <td>{item.fromValue || "-"}</td>
                        <td>{item.toValue || "-"}</td>
                        <td width="12%">
                          {item.changeValidFrom
                            ? moment(item.changeValidFrom).format("DD-MMM-YYYY")
                            : "-"}
                        </td>
                        {/* <td>{item.createdBy || "-"}</td> */}
                        <td>
                          <span
                            className={`badge ${getStatusBadgeClass(
                              item.approvalStatus
                            )}`}
                          >
                            {item.approvalStatus || "SUBMITTED"}
                          </span>
                        </td>
                        <td>
                          {isSubmitted && (
                            <div className="d-flex gap-1">
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() =>
                                  handleApproveItem(item.idEmployeeServiceChange)
                                }
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() =>
                                  handleRejectItem(item.idEmployeeServiceChange)
                                }
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reject Reason</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason("");
                    setRejectingItemId(null);
                    setIsBulkReject(false);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Rejection Reason</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter rejection reason..."
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleRejectConfirm}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason("");
                    setRejectingItemId(null);
                    setIsBulkReject(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceApproval;
