import React, { useState, useEffect, useCallback } from "react";
import moment from "moment";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { API } from "../../redux/api/utils";
import CommonService from "../../core/services/CommonService";
<style>
{`
thead th, .table thead th, .deduct-table-container thead th {
color: #fff !important;
}
`}
</style>

const today = moment().format("YYYY-MM-DD");

const formatDate = (dateStr) => {
  if (!dateStr) return "--";
  const m = moment(dateStr);
  return m.isValid() ? m.format("DD-MM-YYYY") : dateStr;
};

const STATUS_OPTIONS = ["ALL", "SUBMITTED", "APPROVED", "REJECTED", "CANCELLED"];

const STATUS_BADGE = {
  APPROVED: "bg-success",
  REJECTED: "bg-danger",
  CANCELLED: "bg-secondary",
  SUBMITTED: "bg-warning text-dark",
};

const TH_STYLE = {
  backgroundColor: "#0f3c54",
  color: "#fff",
  fontSize: 13,
  fontWeight: 700,
};

const LABEL_STYLE = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: "capitalize",
  letterSpacing: "0.5px",
};

function LeaveDashboard() {
  const [todaySummary, setTodaySummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [todayList, setTodayList] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);

  const [viewMode, setViewMode] = useState("TODAY"); // "TODAY" | "ALL"
  const [activeCard, setActiveCard] = useState("LEAVE"); // "LEAVE" | "WORKFROMHOME" | "NOTCHECKEDIN"

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [filters, setFilters] = useState({
    from: moment().subtract(7, "days").format("YYYY-MM-DD"),
    to: today,
    idDepartment: "",
    idDesignation: "",
    status: "ALL",
    searchText: "",
  });

  // ── API ──────────────────────────────────────────────────────────────────

  const fetchTodaySummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await API.get(`/api/v1/LeaveManagement/GetTodaySummary?date=${today}`);
      if (res?.data?.data) setTodaySummary(res.data.data);
    } catch (err) {
      console.error("GetTodaySummary failed", err);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const fetchTodayDetails = useCallback(async (queryType) => {
    setTableLoading(true);
    try {
      const res = await API.get(
        `/api/v1/LeaveManagement/GetTodayStatusDetails?Date=${today}&QueryType=${queryType}`
      );
      setTodayList(res?.data?.data || []);
    } catch (err) {
      console.error("GetTodayStatusDetails failed", err);
      setTodayList([]);
    } finally {
      setTableLoading(false);
    }
  }, []);

  const fetchNotCheckedIn = useCallback(async () => {
    setTableLoading(true);
    try {
      const res = await API.get(`/api/v1/LeaveManagement/GetNotClockedInWithShiftAsync?Date=${today}`);
      setTodayList(res?.data?.data || []);
    } catch (err) {
      console.error("GetNotClockedInWithShiftAsync failed", err);
      setTodayList([]);
    } finally {
      setTableLoading(false);
    }
  }, []);

  const fetchLeaveRequests = useCallback(async (f) => {
    setTableLoading(true);
    try {
      const params = new URLSearchParams({
        from: f.from,
        to: f.to,
        idDepartment: f.idDepartment || "",
        idDesignation: f.idDesignation || "",
        status: f.status,
        searchText: f.searchText,
      });
      const res = await API.get(`/api/v1/LeaveManagement/GetLeaveRequests?${params}`);
      setLeaveRequests(res?.data?.data || []);
    } catch (err) {
      console.error("GetLeaveRequests failed", err);
      setLeaveRequests([]);
    } finally {
      setTableLoading(false);
    }
  }, []);

  // ── Init ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchTodaySummary();
    fetchTodayDetails("LEAVE");
    CommonService.getDepartmentsList().then((r) => {
      if (r?.data?.data) setDepartments(r.data.data);
    });
    CommonService.getDesignationsList().then((r) => {
      if (r?.data?.data) setDesignations(r.data.data);
    });
  }, [fetchTodaySummary, fetchTodayDetails]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleCardClick = (type) => {
    setActiveCard(type);
    setViewMode("TODAY");
    if (type === "LEAVE") fetchTodayDetails("LEAVE");
    else if (type === "WORKFROMHOME") fetchTodayDetails("WORKFROMHOME");
    else fetchNotCheckedIn();
  };

  const handleShowAllRequests = () => {
    setViewMode("ALL");
    fetchLeaveRequests(filters);
  };

  const handleShowTodayOnly = () => {
    setViewMode("TODAY");
    if (activeCard === "LEAVE") fetchTodayDetails("LEAVE");
    else if (activeCard === "WORKFROMHOME") fetchTodayDetails("WORKFROMHOME");
    else fetchNotCheckedIn();
  };

  const handleSearch = () => fetchLeaveRequests(filters);

  // ── Export ────────────────────────────────────────────────────────────────

  const handleExport = () => {
    const rows = viewMode === "ALL" ? leaveRequests : todayList;
    if (!rows.length) { toast.warning("No data available to export"); return; }

    let data;
    if (viewMode === "ALL") {
      data = rows.map((r) => ({
        "EMP CODE": r.employeeCode || "--", EMPLOYEE: r.employeeName || "--",
        DEPARTMENT: r.department || "--", DESIGNATION: r.designation || "--",
        "LEAVE TYPE": r.leaveTypeName || "--", FROM: formatDate(r.fromDate),
        TO: formatDate(r.toDate), DAYS: r.totalLeaveDays ?? "--",
        STATUS: r.approvalStatus || "--", CONTACT: r.phoneNumber1 || "--",
      }));
    } else if (activeCard === "NOTCHECKEDIN") {
      data = rows.map((r) => ({
        "EMP CODE": r.employeeCode || "--", EMPLOYEE: r.employeeName || "--",
        DEPARTMENT: r.departmentName || "--", DESIGNATION: r.designationName || "--",
        CONTACT: r.emailId || "--",
      }));
    } else {
      data = rows.map((r) => ({
        "EMP CODE": r.employeeCode || "--", EMPLOYEE: r.employeeName || "--",
        DEPARTMENT: r.department || "--", DESIGNATION: r.designation || "--",
        CONTACT: r.phoneNumber1 || "--",
      }));
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Leave Dashboard");
    XLSX.writeFile(wb, `Leave_Dashboard_${moment().format("DD-MM-YYYY")}.xlsx`);
    toast.success("Exported successfully");
  };

  // ── Section labels ────────────────────────────────────────────────────────

  const sectionTitle =
    viewMode === "ALL" ? "All Leave Requests"
    : activeCard === "LEAVE" ? "Employees on Leave Today"
    : activeCard === "WORKFROMHOME" ? "Employees Working From Home"
    : "Employees Not Checked In";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
     <>
      <style>
        {`
          .leave-dashboard-table thead th {
            color: #fff !important;
            background-color: #0f3c54 !important;
            font-weight: 700 !important;
            font-size: 13px;
            position: sticky;
            top: 0;
          }
        `}
      </style>
      
    <div className="container-xxl flex-grow-1 container-p-y">

      {/* ── Page title row ─────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div>
          <h4 className="fw-bold mb-1">Leave Dashboard</h4>
        </div>
        <button
          className="btn btn-sm btn-primary px-3"
          onClick={handleExport}
        >
          <i class="bx bx-download"></i> Export Excel
        </button>
      </div>

      {/* ── Stats bar ──────────────────────────────────────────────────── */}
      <div className="card mb-3">
        <div className="card-body py-2 px-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <span className="fw-semibold me-2" style={{ fontSize: 14 }}>
              Today at a glance
            </span>
            <span style={{ fontSize: 13 }}>
              {moment().format("M/D/YYYY")}
            </span>
          </div>
          <div className="d-flex flex-wrap gap-2">
            {/* On Leave Today */}
            <button
              className={`btn rounded-pill px-3 ${
                activeCard === "LEAVE" && viewMode === "TODAY"
                  ? "btn-primary"
                  : "btn-outline-secondary"
              }`}
              onClick={() => handleCardClick("LEAVE")}
            >
              On Leave Today&nbsp;&nbsp;
              <strong>{summaryLoading ? "--" : (todaySummary?.onLeaveToday ?? 0)}</strong>
            </button>

            {/* Unauthorized Absent */}
            <button
              className={`btn rounded-pill px-3 ${
                activeCard === "NOTCHECKEDIN" && viewMode === "TODAY"
                  ? "btn-primary"
                  : "btn-outline-secondary"
              }`}
              onClick={() => handleCardClick("NOTCHECKEDIN")}
            >
              Not Clocked In&nbsp;&nbsp;
              <strong>{summaryLoading ? "--" : (todaySummary?.unauthorizedAbsentToday ?? 0)}</strong>
            </button>

            {/* Work From Home Today */}
            <button
              className={`btn rounded-pill px-3 ${
                activeCard === "WORKFROMHOME" && viewMode === "TODAY"
                  ? "btn-primary"
                  : "btn-outline-secondary"
              }`}
              onClick={() => handleCardClick("WORKFROMHOME")}
            >
              Work From Home Today&nbsp;&nbsp;
              <strong>{summaryLoading ? "--" : (todaySummary?.workFromHomeToday ?? 0)}</strong>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main card ──────────────────────────────────────────────────── */}
      <div className="card">
        {/* Card header: section title + toggle button */}
        <div className="card-header d-flex align-items-start justify-content-between pt-3 pb-2">
          <div>
            <h6 className="fw-bold mb-1">{sectionTitle}</h6>
          </div>
          <button
            className="btn btn-sm btn-primary rounded-pill px-3"
            onClick={viewMode === "TODAY" ? handleShowAllRequests : handleShowTodayOnly}
          >
            {viewMode === "TODAY" ? "Show All Requests" : "Show Today Only"}
          </button>
        </div>

        <div className="card-body pt-2">
          {/* Filters — only in ALL mode */}
          {viewMode === "ALL" && (
            <div className="row align-items-end g-2 mb-3">
              <div className="col-auto">
                <label className="form-label mb-1" style={LABEL_STYLE}>Period From</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={filters.from}
                  onChange={(e) => {
                    const updated = { ...filters, from: e.target.value };
                    setFilters(updated);
                    fetchLeaveRequests(updated);
                  }}
                />
              </div>
              <div className="col-auto">
                <label className="form-label mb-1" style={LABEL_STYLE}>Period To</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={filters.to}
                  onChange={(e) => {
                    const updated = { ...filters, to: e.target.value };
                    setFilters(updated);
                    fetchLeaveRequests(updated);
                  }}
                />
              </div>
              <div className="col-auto">
                <label className="form-label mb-1" style={LABEL_STYLE}>Department</label>
                <select
                  className="form-select form-select-sm"
                  value={filters.idDepartment}
                  onChange={(e) => {
                    const updated = { ...filters, idDepartment: e.target.value };
                    setFilters(updated);
                    fetchLeaveRequests(updated);
                  }}
                >
                  <option value="">All</option>
                  {departments.map((d) => (
                    <option key={d.idDepartment} value={d.idDepartment}>
                      {d.departmentName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label mb-1" style={LABEL_STYLE}>Designation</label>
                <select
                  className="form-select form-select-sm"
                  value={filters.idDesignation}
                  onChange={(e) => {
                    const updated = { ...filters, idDesignation: e.target.value };
                    setFilters(updated);
                    fetchLeaveRequests(updated);
                  }}
                >
                  <option value="">All</option>
                  {designations.map((d) => (
                    <option key={d.idDesignation} value={d.idDesignation}>
                      {d.designationName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-auto">
                <label className="form-label mb-1" style={LABEL_STYLE}>Status</label>
                <select
                  className="form-select form-select-sm"
                  value={filters.status}
                  onChange={(e) => {
                    const updated = { ...filters, status: e.target.value };
                    setFilters(updated);
                    fetchLeaveRequests(updated);
                  }}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="col-auto">
                <label className="form-label mb-1" style={LABEL_STYLE}>Search</label>
                <div className="input-group input-group-sm">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Name / code "
                    style={{ minWidth: 180 }}
                    value={filters.searchText}
                    onChange={(e) => setFilters((f) => ({ ...f, searchText: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <button className="btn btn-primary" onClick={handleSearch}>
                    Search
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="table-responsive" style={{ maxHeight: "55vh", overflowY: "auto" }}>
            {viewMode === "TODAY" ? (
              <table className="table table-sm table-bordered mb-0 leave-dashboard-table">
                <thead className="text-white">
                  <tr>
                    <th style={TH_STYLE}>Emp. Code</th>
                    <th style={TH_STYLE}>Employee Name</th>
                    <th style={TH_STYLE}>Department</th>
                    <th style={TH_STYLE}>Designation</th>
                    {activeCard !== "NOTCHECKEDIN" && (
                      <th style={TH_STYLE}>Status</th>
                    )}
                  </tr>
                </thead>
                <tbody style={{ fontSize: 13 }}>
                  {tableLoading ? (
                    <tr>
                      <td colSpan="5" className="text-center py-3">
                        <div className="spinner-border spinner-border-sm text-primary" role="status" />
                      </td>
                    </tr>
                  ) : todayList.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-3">
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    todayList.map((row, i) => (
                      <tr key={i}>
                        <td>{row.employeeCode || "--"}</td>
                        <td>{row.employeeName || "--"}</td>
                        <td>
                          {activeCard === "NOTCHECKEDIN"
                            ? row.departmentName || "--"
                            : row.department || "--"}
                        </td>
                        <td>
                          {activeCard === "NOTCHECKEDIN"
                            ? row.designationName || "--"
                            : row.designation || "--"}
                        </td>
                        {activeCard !== "NOTCHECKEDIN" && (
                          <td>
                            <span
                              className={`badge ${
                                STATUS_BADGE[(row.approvalStatus || "").toUpperCase()] || "bg-info"
                              }`}
                            >
                              {row.approvalStatus || "--"}
                            </span>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="table table-sm table-bordered mb-0 leave-dashboard-table">
                <thead className="text-white">
                  <tr>
                    <th style={{...TH_STYLE,width:'102px'}}>Emp. Code</th>
                    <th style={TH_STYLE}>Employee Name</th>
                    <th style={TH_STYLE}>Department</th>
                    <th style={TH_STYLE}>Designation</th>
                    <th style={TH_STYLE}>Leave Type</th>
                    <th style={{...TH_STYLE,width:'100px'}}>From</th>
                    <th style={{...TH_STYLE,width:'100px'}}>To</th>
                    <th style={TH_STYLE}>Days</th>
                    <th style={TH_STYLE}>Status</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: 13 }}>
                  {tableLoading ? (
                    <tr>
                      <td colSpan="10" className="text-center py-3">
                        <div className="spinner-border spinner-border-sm text-primary" role="status" />
                      </td>
                    </tr>
                  ) : leaveRequests.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="text-center text-muted py-3">
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    leaveRequests.map((row, i) => (
                      <tr key={i}>
                        <td>{row.employeeCode || "--"}</td>
                        <td>{row.employeeName || "--"}</td>
                        <td>{row.department || "--"}</td>
                        <td>{row.designation || "--"}</td>
                        <td>{row.leaveTypeName || "--"}</td>
                        <td>{formatDate(row.fromDate)}</td>
                        <td>{formatDate(row.toDate)}</td>
                        <td>{row.totalLeaveDays ?? "--"}</td>
                        <td>
                          <span
                            className={`badge ${
                              STATUS_BADGE[(row.approvalStatus || "").toUpperCase()] || "bg-info"
                            }`}
                          >
                            {row.approvalStatus || "--"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default LeaveDashboard;
