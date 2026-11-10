import React, { useCallback, useEffect, useState } from "react";
import ProfileChangeService from "../../core/services/ProfileChangeService";
import CommonService from "../../core/services/CommonService";
import { showToast } from "../../components/ToastNotifications/toastUtils";
import { useLoader } from "../../components/LoaderContext";
import {
  CATEGORY_LABELS, DocumentPreview, ModalShell, RequestDetailView, StatusBadge, formatDate,
} from "../EmployeeSelfPortal/ProfileChange/shared";
import "../EmployeeSelfPortal/ProfileChange/profileChange.css";

const SLA_DAYS = 5;
const emptyFilter = { status: "PENDING", category: "", idDepartment: "", fromDate: "", toDate: "", search: "" };

const ProfileChangeRequests = () => {
  const { showLoader, hideLoader } = useLoader();
  const [mode, setMode] = useState("MINE");
  const [canViewAll, setCanViewAll] = useState(false);
  const [counts, setCounts] = useState(null);
  const [filter, setFilter] = useState(emptyFilter);
  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [detail, setDetail] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [confirm, setConfirm] = useState(null);   // { action, conflict }
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState({});
  const [preview, setPreview] = useState(null);
  const [history, setHistory] = useState(null);

  const loadCounts = useCallback(async () => {
    const res = await ProfileChangeService.getDashboardCounts();
    if (!res.error) {
      setCounts(res.data?.data?.counts);
      setCanViewAll(!!res.data?.data?.canViewAll);
    }
  }, []);

  const loadRows = useCallback(async (m = mode, f = filter) => {
    showLoader();
    const params = { mode: m };
    if (m === "ALL") {
      Object.entries(f).forEach(([k, v]) => { if (v !== "" && v !== null) params[k] = v; });
    } else if (f.search) params.search = f.search;
    const res = await ProfileChangeService.getRequests(params);
    hideLoader();
    if (res.error) showToast(res.error, "error");
    else setRows(res.data?.data || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, filter]);

  useEffect(() => {
    loadCounts();
    loadRows("MINE", emptyFilter);
    CommonService.getDepartmentsList().then((r) => setDepartments(r?.data?.data || [])).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchMode = (m) => { setMode(m); loadRows(m, filter); };

  const openDetail = async (id) => {
    showLoader();
    const res = await ProfileChangeService.getRequestById(id);
    hideLoader();
    if (res.error) { showToast(res.error, "error"); return; }
    setDetail(res.data?.data);
    setRemarks("");
    setRevealed({});
    setHistory(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const backToList = () => { setDetail(null); loadRows(); loadCounts(); };

  const openDocument = async (doc) => {
    const res = await ProfileChangeService.downloadRequestDocument(doc.idProfileChangeRequestDocument);
    if (res.error) { showToast(res.error, "error"); return; }
    setPreview({ blob: res.data, contentType: res.contentType, name: doc.originalFileName });
  };

  const reveal = async (idDetail) => {
    const res = await ProfileChangeService.revealValue(idDetail);
    if (res.error) { showToast(res.error, "error"); return; }
    setRevealed((p) => ({ ...p, [idDetail]: res.data?.data }));
  };

  const loadHistory = async () => {
    const res = await ProfileChangeService.getEmployeeChangeHistory(detail.employee.idEmployee);
    if (res.error) { showToast(res.error, "error"); return; }
    setHistory(res.data?.data || []);
  };

  const startAction = (action) => {
    if ((action === "REJECT" || action === "CLARIFY") && !remarks.trim()) {
      showToast(action === "REJECT" ? "Enter the reason for rejection" : "Enter what the employee needs to provide", "error");
      return;
    }
    setConfirm({ action, conflict: action === "APPROVE" && detail.hasConflicts });
  };

  const doAction = async (confirmConflicts) => {
    const action = confirm.action;
    setBusy(true);
    const res = await ProfileChangeService.actionRequest({
      idProfileChangeRequest: detail.idProfileChangeRequest,
      action,
      remarks: remarks.trim() || null,
      confirmConflicts,
    });
    setBusy(false);
    if (res.error) {
      if (res.status === 409) { setConfirm({ action, conflict: true }); return; }
      setConfirm(null);
      showToast(res.error, "error");
      return;
    }
    setConfirm(null);
    showToast(res.data?.message || "Done", "success");
    backToList();
  };

  const approveLabel = detail?.isFinalLevel ? "Approve & Apply" : "Approve";

  const confirmBody = () => {
    if (!confirm) return null;
    if (confirm.action === "APPROVE") {
      return (
        <>
          {confirm.conflict && (
            <div className="pc-banner bad">
              The employee's record has changed since this request was submitted (rows marked red). Approving will overwrite the current values.
            </div>
          )}
          {detail.isFinalLevel ? (
            <>
              <p className="mb-2">These changes will be written to <b>{detail.employee.employeeCode} · {detail.employee.fullName}</b>'s records now:</p>
              <ul className="mb-2">
                {detail.changes.map((c) => (
                  <li key={c.idProfileChangeRequestDetail}>
                    {c.operation === "REMOVE" ? <>Remove <b>{c.oldValue}</b></> : <>{c.label}: <b>{c.newValue || "—"}</b></>}
                  </li>
                ))}
                {detail.documents.some((d) => d.idDocumentType) && <li>Documents with a document type are added to the employee's documents.</li>}
                <li>The previous values are kept in the change history, and the employee is notified.</li>
              </ul>
            </>
          ) : (
            <p className="mb-2">The request moves to level {(detail.currentLevel || 1) + 1} for the next approver. Nothing changes in the employee's records yet.</p>
          )}
          {remarks.trim() && <div className="pc-sub">Remarks: {remarks}</div>}
        </>
      );
    }
    return (
      <>
        <p className="mb-2">
          {confirm.action === "REJECT"
            ? "The request will be rejected. The employee's records stay unchanged."
            : "The request goes back to the employee, who can edit it and upload more documents. Resubmitting starts the approval again from level 1."}
        </p>
        <div className="pc-sub">Remarks sent to the employee: {remarks}</div>
      </>
    );
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y pc-page">
      {!detail && (
        <>
          <div className="pc-head">
            <h4>Profile Change Requests</h4>
            {canViewAll && (
              <div className="btn-group btn-group-sm">
                <button type="button" className={`btn ${mode === "MINE" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => switchMode("MINE")}>
                  Waiting for me{counts ? ` (${counts.waitingForMe})` : ""}
                </button>
                <button type="button" className={`btn ${mode === "ALL" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => switchMode("ALL")}>All requests</button>
              </div>
            )}
          </div>

          {counts && (
            <div className="pc-stats">
              <div className="pc-stat" style={{ borderLeftColor: "#0b72b9" }}><div className="n">{counts.waitingForMe}</div><div className="l">Waiting for me</div></div>
              {canViewAll && <div className="pc-stat" style={{ borderLeftColor: "#d48806" }}><div className="n">{counts.withEmployee}</div><div className="l">With employee (clarification)</div></div>}
              <div className="pc-stat" style={{ borderLeftColor: "#28a745" }}><div className="n">{counts.approved30Days}</div><div className="l">Approved · last 30 days</div></div>
              <div className="pc-stat" style={{ borderLeftColor: "#dc3545" }}><div className="n">{counts.rejected30Days}</div><div className="l">Rejected · last 30 days</div></div>
            </div>
          )}

          <div className="card mb-3">
            <div className="card-body">
              <div className="row g-2 align-items-end">
                <div className={mode === "ALL" ? "col-md-3" : "col-md-6"}>
                  <label className="form-label mb-1">Search</label>
                  <input className="form-control form-control-sm" placeholder="Employee code, name or request no." value={filter.search}
                    onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                    onKeyDown={(e) => { if (e.key === "Enter") loadRows(); }} />
                </div>
                {mode === "ALL" && (
                  <>
                    <div className="col-md-2">
                      <label className="form-label mb-1">Status</label>
                      <select className="form-select form-select-sm" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
                        <option value="">All</option>
                        <option value="PENDING">Pending</option>
                        <option value="CLARIFICATION REQUIRED">Clarification Required</option>
                        <option value="FINAL APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                    <div className="col-md-2">
                      <label className="form-label mb-1">Category</label>
                      <select className="form-select form-select-sm" value={filter.category} onChange={(e) => setFilter({ ...filter, category: e.target.value })}>
                        <option value="">All</option>
                        {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div className="col-md-2">
                      <label className="form-label mb-1">Department</label>
                      <select className="form-select form-select-sm" value={filter.idDepartment} onChange={(e) => setFilter({ ...filter, idDepartment: e.target.value })}>
                        <option value="">All</option>
                        {departments.map((d) => <option key={d.idDepartment} value={d.idDepartment}>{d.departmentName}</option>)}
                      </select>
                    </div>
                    <div className="col-md-1">
                      <label className="form-label mb-1">From</label>
                      <input type="date" className="form-control form-control-sm" value={filter.fromDate} onChange={(e) => setFilter({ ...filter, fromDate: e.target.value })} />
                    </div>
                    <div className="col-md-1">
                      <label className="form-label mb-1">To</label>
                      <input type="date" className="form-control form-control-sm" value={filter.toDate} onChange={(e) => setFilter({ ...filter, toDate: e.target.value })} />
                    </div>
                  </>
                )}
                <div className="col-md-1 d-flex gap-1">
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => loadRows()}>Go</button>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { setFilter(emptyFilter); loadRows(mode, emptyFilter); }}>Reset</button>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="table-responsive">
              <table className="table pc-table mb-0">
                <thead>
                  <tr><th>Request No.</th><th>Employee</th><th>Category / Type</th><th>Submitted</th><th>Level</th><th>Waiting</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={8} className="text-center pc-sub py-4">{mode === "MINE" ? "No requests are waiting for you." : "No requests match the filters."}</td></tr>
                  )}
                  {rows.map((r) => (
                    <tr key={r.idProfileChangeRequest}>
                      <td>{r.requestNumber}</td>
                      <td>
                        <div className="fw-semibold">{r.employeeCode} · {r.employeeName}</div>
                        <div className="pc-sub">{[r.departmentName, r.designationName].filter(Boolean).join(" · ")}</div>
                      </td>
                      <td>{CATEGORY_LABELS[r.requestCategory] || r.requestCategory}<div className="pc-sub">{r.requestTypeName}</div></td>
                      <td>{formatDate(r.submittedDate)}</td>
                      <td className="pc-sub">{r.totalLevels && (r.requestStatus === "SUBMITTED" || r.requestStatus === "INTERIM APPROVED") ? `${r.currentLevel || 1} of ${r.totalLevels}` : "—"}</td>
                      <td className={r.waitingDays > SLA_DAYS ? "text-danger fw-semibold" : "fw-semibold"}>
                        {r.waitingDays === null || r.waitingDays === undefined ? "—" : r.waitingDays === 0 ? "today" : `${r.waitingDays} day${r.waitingDays > 1 ? "s" : ""}`}
                      </td>
                      <td>
                        <StatusBadge status={r.requestStatus} />
                        {r.isResubmitted && <span className="badge bg-label-warning ms-1">Resubmitted</span>}
                      </td>
                      <td className="text-end">
                        <button type="button" className="btn btn-sm btn-primary" onClick={() => openDetail(r.idProfileChangeRequest)}>
                          {mode === "MINE" ? "Review" : "View"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {detail && (
        <>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
            <h5 className="m-0">{detail.requestNumber} · {detail.requestTypeName} <StatusBadge status={detail.requestStatus} /></h5>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={backToList}>← Back to list</button>
          </div>

          {detail.hasConflicts && detail.canAct && (
            <div className="pc-banner bad">
              The employee's record has changed since this request was submitted. Check the rows marked red before approving.
            </div>
          )}
          {detail.tableName === "EmployeeBankAccounts" && detail.canAct && detail.isFinalLevel && (
            <div className="pc-banner warn">
              Bank changes apply as soon as they are approved. If salary for this month has already been generated, it was paid to the old account.
            </div>
          )}
          {detail.requestStatus === "CLARIFICATION REQUIRED" && (
            <div className="pc-banner warn">Sent back to the employee: {detail.approverRemarks}</div>
          )}
          {detail.requestStatus === "REJECTED" && <div className="pc-banner bad">Rejected: {detail.approverRemarks}</div>}

          <div className="card mb-3"><div className="card-body pc-kv">
            <div><label>Employee</label><div>{detail.employee.employeeCode} · {detail.employee.fullName}</div></div>
            <div><label>Department / Designation</label><div>{[detail.employee.departmentName, detail.employee.designationName].filter(Boolean).join(" · ") || "—"}</div></div>
            <div><label>Reporting To</label><div>{detail.employee.reportingToName || "—"}</div></div>
            <div><label>Submitted</label><div>{formatDate(detail.submittedDate, true)}</div></div>
            <div><label>Current level</label><div>{detail.totalLevels ? `${detail.currentLevel || 1} of ${detail.totalLevels}${detail.isFinalLevel ? " (final)" : ""}` : "—"}</div></div>
            <div><label>Joined</label><div>{formatDate(detail.employee.joiningDate)}</div></div>
            <div style={{ gridColumn: "span 2" }}><label>Reason</label><div>{detail.reason || "—"}</div></div>
            {detail.employeeResponse && <div><label>Employee's response</label><div>{detail.employeeResponse}</div></div>}
          </div></div>

          <RequestDetailView detail={detail} mode="HR" onOpenDocument={openDocument} onReveal={reveal} revealed={revealed} />

          {detail.canAct && (
            <div className="card mb-3">
              <div className="card-body">
                <label className="form-label mb-1">Remarks <span className="pc-sub">(required for Reject and Clarification; shown to the employee)</span></label>
                <div className="pc-actionbar">
                  <textarea className="form-control form-control-sm" rows={2} maxLength={500} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                  <button type="button" className="btn btn-outline-danger" onClick={() => startAction("REJECT")}>✕ Reject</button>
                  <button type="button" className="btn btn-outline-warning" onClick={() => startAction("CLARIFY")}>↩ Send for Clarification</button>
                  <button type="button" className="btn btn-success" onClick={() => startAction("APPROVE")}>✓ {approveLabel}</button>
                </div>
              </div>
            </div>
          )}

          {canViewAll && (
            <div className="card mb-3">
              <div className="card-header py-2 d-flex justify-content-between align-items-center">
                <h6 className="m-0">Previous profile changes for this employee</h6>
                {!history && <button type="button" className="btn btn-sm btn-outline-secondary" onClick={loadHistory}>Show</button>}
              </div>
              {history && (
                <div className="card-body pt-2">
                  {history.length === 0 && <div className="pc-sub">No approved profile changes yet.</div>}
                  {history.map((h, i) => {
                    let info = null;
                    try { info = JSON.parse(h.details); } catch { info = null; }
                    const changes = info?.changes || info?.Changes || [];
                    return (
                      <div key={i} className="pc-file d-block">
                        <div className="fw-semibold">{info?.requestNumber || info?.RequestNumber} · {info?.requestType || info?.RequestType}</div>
                        <div className="pc-sub">{formatDate(h.actionTimestamp, true)} · approved by {h.actionBy}</div>
                        {changes.map((c, j) => (
                          <div key={j} className="small">{c.field || c.Field}: <span className="pc-old">{c.from || c.From || "—"}</span> → <span className="pc-new">{c.to || c.To || "—"}</span></div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {confirm && (
        <ModalShell
          title={confirm.action === "APPROVE" ? `${approveLabel} ${detail.requestNumber}?` : confirm.action === "REJECT" ? `Reject ${detail.requestNumber}?` : `Send ${detail.requestNumber} for clarification?`}
          size="sm"
          onClose={() => !busy && setConfirm(null)}
          footer={<>
            <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={() => setConfirm(null)}>Cancel</button>
            <button type="button" disabled={busy}
              className={`btn ${confirm.action === "APPROVE" ? "btn-success" : confirm.action === "REJECT" ? "btn-danger" : "btn-warning"}`}
              onClick={() => doAction(confirm.action === "APPROVE" && confirm.conflict)}>
              {busy ? "Please wait..." : confirm.action === "APPROVE" ? (confirm.conflict ? "Approve anyway" : "Confirm") : confirm.action === "REJECT" ? "Reject" : "Send to Employee"}
            </button>
          </>}
        >
          {confirmBody()}
        </ModalShell>
      )}
      <DocumentPreview file={preview} onClose={() => setPreview(null)} />
    </div>
  );
};

export default ProfileChangeRequests;
