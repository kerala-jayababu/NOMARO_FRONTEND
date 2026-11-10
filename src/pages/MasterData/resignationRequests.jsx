import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { API } from "../../redux/api/utils";
import Utils from "../../utils/Utils";
import { showToast } from "../../components/ToastNotifications/toastUtils";
import { ViewExitCaseModal, getUserRoleType } from "./offboardingCases";
import "../EmployeeSelfPortal/ProfileChange/profileChange.css";

// Resignation requests for the logged-in user's role. Review and actions use the same
// exit case window as Offboarding Cases (reporting officer -> HR executive -> HR head).

const ROLE_LABEL = { REPOFFICER: "Reporting Officer", HREXECUTIVE: "HR Executive", HRHEAD: "HR Head" };

const STATUS_LABEL = {
  INITIATED: "Submitted",
  REPOFFICERAPPROVED: "Approved by reporting officer",
  REPOFFICERREJECTED: "Rejected by reporting officer",
  INCLEARANCE: "In clearance",
  READYFORCLOSURE: "Ready for closure",
  COMPLETED: "Completed",
};

const PENDING_LABEL = {
  REPOFFICER: "Reporting officer",
  HROFFICER: "HR executive",
  HRMANAGER: "HR head",
  HRHEAD: "HR head",
  CLEARANCE: "Department clearance",
  EMPLOYEE: "Employee",
};

const key = (s) => (s || "").replace(/[\s_]/g, "").toUpperCase();
const statusText = (s) => STATUS_LABEL[key(s)] || (s ? s.replace(/([a-z])([A-Z])/g, "$1 $2") : "—");
const isClosed = (s) => ["COMPLETED", "REPOFFICERREJECTED"].includes(key(s)) || /reject/i.test(s || "");

const badgeClass = (s) => {
  const k = key(s);
  if (k === "COMPLETED") return "bg-label-success";
  if (k.includes("REJECT")) return "bg-label-danger";
  if (k.includes("APPROVED") || k === "READYFORCLOSURE") return "bg-label-primary";
  if (k === "INCLEARANCE") return "bg-label-warning";
  return "bg-label-info";
};

// Same rule as the Offboarding Cases review window
const waitingForMe = (row, roleType) => {
  const pending = (row.pendingWith || "").toUpperCase();
  const status = (row.exitStatus || "").toLowerCase();
  if (roleType === "REPOFFICER") return pending === "REPOFFICER";
  if (roleType === "HREXECUTIVE") return pending === "HROFFICER";
  if (roleType === "HRHEAD")
    return pending === "HRHEAD" || pending === "HRMANAGER" || status.includes("readyforclosure") ||
      status.includes("ready for closure") || status.includes("pending hr head") || status.includes("pending hrhead");
  return false;
};

const fmt = (d) => (d ? Utils.formatDisplayDate(d) : "—");

const ResignationRequests = () => {
  const dispatch = useDispatch();
  const { actionLoading } = useSelector((state) => state.offboardingCases);
  const roleType = getUserRoleType();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("MINE");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { roleType };
      if (fromDate) params.initiationDate = fromDate;
      const res = await API.get("/api/v1/EmployeeOffBoarding/GetResignationRequests", { params });
      setRows(res.data?.data || []);
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to load resignation requests", "error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [roleType, fromDate]);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => ({
    mine: rows.filter((r) => waitingForMe(r, roleType)).length,
    open: rows.filter((r) => !isClosed(r.exitStatus)).length,
    completed: rows.filter((r) => key(r.exitStatus) === "COMPLETED").length,
    rejected: rows.filter((r) => /reject/i.test(r.exitStatus || "")).length,
  }), [rows, roleType]);

  const statuses = useMemo(() => [...new Set(rows.map((r) => r.exitStatus).filter(Boolean))], [rows]);

  const shown = useMemo(() => {
    const s = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (view === "MINE" && !waitingForMe(r, roleType)) return false;
      if (view === "OPEN" && isClosed(r.exitStatus)) return false;
      if (status && r.exitStatus !== status) return false;
      if (!s) return true;
      return [r.employeeCode, r.employeeName, r.caseNumber, r.employeeDepartmentName]
        .some((v) => (v || "").toLowerCase().includes(s));
    });
  }, [rows, view, status, search, roleType]);

  const closeModal = useCallback(() => setSelected(null), []);

  const card = (k, label, n, color) => (
    <div className="pc-stat clickable" style={{ borderLeftColor: color, outline: view === k ? `2px solid ${color}` : "none" }} onClick={() => setView(k)}>
      <div className="n">{n}</div><div className="l">{label}</div>
    </div>
  );

  return (
    <div className="container-xxl flex-grow-1 container-p-y pc-page">
      <div className="pc-head">
        <h4>Resignation Requests</h4>
        <span className="badge bg-label-primary">Viewing as {ROLE_LABEL[roleType] || roleType}</span>
      </div>

      <div className="pc-stats">
        {card("MINE", "Waiting for my action", counts.mine, "#0b72b9")}
        {card("OPEN", "In progress", counts.open, "#d48806")}
        {card("ALL", "All requests", rows.length, "#8592a3")}
        <div className="pc-stat" style={{ borderLeftColor: "#28a745" }}><div className="n">{counts.completed}</div><div className="l">Completed</div></div>
        <div className="pc-stat" style={{ borderLeftColor: "#dc3545" }}><div className="n">{counts.rejected}</div><div className="l">Rejected</div></div>
      </div>

      <div className="card mb-3"><div className="card-body">
        <div className="row g-2 align-items-end">
          <div className="col-md-5">
            <label className="form-label mb-1">Search</label>
            <input className="form-control form-control-sm" placeholder="Employee name or code, case number, department" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="col-md-3">
            <label className="form-label mb-1">Status</label>
            <select className="form-select form-select-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              {statuses.map((s) => <option key={s} value={s}>{statusText(s)}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label mb-1">Submitted from</label>
            <input type="date" className="form-control form-control-sm" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="col-md-2 d-flex gap-1">
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { setSearch(""); setStatus(""); setFromDate(""); setView("MINE"); }}>Reset</button>
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={load} title="Refresh"><i className="bx bx-refresh"></i></button>
          </div>
        </div>
      </div></div>

      <div className="card">
        <div className="table-responsive">
          <table className="table pc-table mb-0">
            <thead>
              <tr><th>Case No.</th><th>Employee</th><th>Exit Type / Reason</th><th>Submitted</th><th>Proposed LWD</th><th>Approved LWD</th><th>Notice</th><th>Status</th><th>Pending With</th><th></th></tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={10} className="text-center pc-sub py-4">Loading...</td></tr>}
              {!loading && shown.length === 0 && (
                <tr><td colSpan={10} className="text-center pc-sub py-4">
                  {view === "MINE" ? "No resignation requests are waiting for your action." : "No resignation requests match the filters."}
                </td></tr>
              )}
              {!loading && shown.map((r) => {
                const mine = waitingForMe(r, roleType);
                return (
                  <tr key={r.idExitCase}>
                    <td>{r.caseNumber}</td>
                    <td>
                      <div className="fw-semibold">{r.employeeCode} · {r.employeeName}</div>
                      <div className="pc-sub">{[r.employeeDepartmentName, r.employeeDesignationName].filter(Boolean).join(" · ")}</div>
                    </td>
                    <td>{r.exitTypeName || "—"}<div className="pc-sub">{r.exitReasonName}</div></td>
                    <td>{fmt(r.initiationDate)}</td>
                    <td>{fmt(r.proposedLWD)}</td>
                    <td>{fmt(r.approvedLWD)}</td>
                    <td className="text-nowrap">
                      {r.effectiveNoticeDays ?? r.policyNoticeDays ?? "—"}{(r.effectiveNoticeDays ?? r.policyNoticeDays) != null ? " days" : ""}
                      {r.isNoticeOverridden && <div className="pc-sub">overridden</div>}
                    </td>
                    <td><span className={`badge ${badgeClass(r.exitStatus)}`}>{statusText(r.exitStatus)}</span></td>
                    <td>{PENDING_LABEL[(r.pendingWith || "").toUpperCase()] || r.pendingWith || "—"}
                      {r.reportingOfficerName && (r.pendingWith || "").toUpperCase() === "REPOFFICER" && <div className="pc-sub">{r.reportingOfficerName}</div>}
                    </td>
                    <td className="text-end">
                      <button type="button" className={`btn btn-sm ${mine ? "btn-primary" : "btn-outline-secondary"}`} onClick={() => setSelected(r)}>
                        {mine ? "Review" : "View"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <ViewExitCaseModal
          exitCase={selected}
          roleType={roleType}
          onClose={closeModal}
          onRefresh={load}
          dispatch={dispatch}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
};

export default ResignationRequests;
