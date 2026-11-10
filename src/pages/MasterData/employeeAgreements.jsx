import { useEffect, useMemo, useRef, useState } from "react";
import { API } from "../../redux/api/utils";
import EmployeeManagementService from "../../core/services/EmployeeManagementService";
import { showToast } from "../../components/ToastNotifications/toastUtils";
import { DocumentPreview, ModalShell, formatSize } from "../EmployeeSelfPortal/ProfileChange/shared";
import { fmtUtc } from "../Public/AgreementReview";
import "../EmployeeSelfPortal/ProfileChange/profileChange.css";

const BASE = "/api/v1/EmployeeAgreement";

const STATUS = {
  SENT: { cls: "bg-label-info", label: "Sent" },
  VIEWED: { cls: "bg-label-primary", label: "Viewed" },
  ACCEPTED: { cls: "bg-label-success", label: "Accepted" },
  REJECTED: { cls: "bg-label-danger", label: "Rejected" },
  EXPIRED: { cls: "bg-label-warning", label: "Link expired" },
  CANCELLED: { cls: "bg-label-secondary", label: "Cancelled" },
};
const Badge = ({ s }) => <span className={`badge ${STATUS[s]?.cls || "bg-label-secondary"}`}>{STATUS[s]?.label || s}</span>;

const errorOf = async (e, fallback) => {
  try {
    if (e.response?.data instanceof Blob) return JSON.parse(await e.response.data.text()).message || fallback;
  } catch { /* use fallback */ }
  return e.response?.data?.message || fallback;
};

const employeeLabel = (e) => `${e.employeeCode || ""} · ${e.employeeName}`;

const emptyForm = { idEmployee: "", employeeText: "", agreementTitle: "", agreementVersion: "", idDocumentType: "", remarks: "", file: null };

// embeddedEmployeeId: used inside Employee Management (Agreements tab) for one employee
const EmployeeAgreements = ({ embeddedEmployeeId = null }) => {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState({ search: "", status: "" });
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  const [form, setForm] = useState(null);
  const [sending, setSending] = useState(false);
  const [detail, setDetail] = useState(null);
  const [cancel, setCancel] = useState(null);
  const [preview, setPreview] = useState(null);
  const timer = useRef(null);
  const fileInput = useRef(null);

  const load = async (f = filter) => {
    setLoading(true);
    try {
      const params = {};
      if (embeddedEmployeeId) params.idEmployee = embeddedEmployeeId;
      if (f.search.trim()) params.search = f.search.trim();
      if (f.status) params.status = f.status;
      const res = await API.get(`${BASE}/GetAgreements`, { params });
      setRows(res.data?.data || []);
    } catch (e) {
      showToast(await errorOf(e, "Failed to load agreements"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => load(filter), 350);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, embeddedEmployeeId]);

  const openSend = async () => {
    setForm({ ...emptyForm, idEmployee: embeddedEmployeeId || "" });
    if (!employees.length) {
      try {
        const res = await API.get(`${BASE}/GetEmployees`);
        const list = res.data?.data || [];
        setEmployees(list);
        const fixed = list.find((e) => String(e.idEmployee) === String(embeddedEmployeeId));
        if (fixed) setForm((f) => ({ ...f, employeeText: employeeLabel(fixed) }));
      } catch (e) { showToast(await errorOf(e, "Failed to load employees"), "error"); }
    } else if (embeddedEmployeeId) {
      const fixed = employees.find((e) => String(e.idEmployee) === String(embeddedEmployeeId));
      if (fixed) setForm((f) => ({ ...f, employeeText: employeeLabel(fixed) }));
    }
    if (!docTypes.length) {
      const res = await EmployeeManagementService.getDocumentTypes();
      if (!res.error) setDocTypes(res.data?.data || []);
    }
  };

  const selected = useMemo(() => employees.find((e) => String(e.idEmployee) === String(form?.idEmployee)), [employees, form]);
  const selectedEmails = selected ? [selected.officialEmail, selected.personalEmail].filter(Boolean) : [];

  const pickEmployee = (text) => {
    const match = employees.find((e) => employeeLabel(e) === text);
    setForm((f) => ({ ...f, employeeText: text, idEmployee: match ? match.idEmployee : "" }));
  };

  const send = async () => {
    if (!form.idEmployee) { showToast("Select the employee from the list", "error"); return; }
    if (!form.agreementTitle.trim()) { showToast("Enter the agreement title", "error"); return; }
    if (!form.file) { showToast("Attach the agreement PDF", "error"); return; }
    if (!selectedEmails.length) { showToast("This employee has no email address", "error"); return; }
    const fd = new FormData();
    fd.append("IdEmployee", form.idEmployee);
    fd.append("AgreementTitle", form.agreementTitle.trim());
    if (form.agreementVersion.trim()) fd.append("AgreementVersion", form.agreementVersion.trim());
    if (form.idDocumentType) fd.append("IdDocumentType", form.idDocumentType);
    if (form.remarks.trim()) fd.append("Remarks", form.remarks.trim());
    fd.append("File", form.file);
    setSending(true);
    try {
      const res = await API.post(`${BASE}/SendAgreement`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      showToast(res.data?.message || "Agreement sent", "success");
      setForm(null);
      load();
    } catch (e) {
      showToast(await errorOf(e, "The agreement could not be sent"), "error");
      load();
    } finally {
      setSending(false);
    }
  };

  const openDetail = async (id) => {
    try {
      const res = await API.get(`${BASE}/GetAgreementById?id=${id}`);
      setDetail(res.data?.data);
    } catch (e) { showToast(await errorOf(e, "Failed to load the agreement"), "error"); }
  };

  const resend = async (row) => {
    try {
      const res = await API.post(`${BASE}/ResendAgreement?id=${row.idEmployeeAgreement}`);
      showToast(res.data?.message || "Resent", "success");
      setDetail(null);
      load();
    } catch (e) { showToast(await errorOf(e, "Could not resend"), "error"); }
  };

  const doCancel = async () => {
    if (!cancel.reason.trim()) { showToast("Enter the reason", "error"); return; }
    try {
      const res = await API.post(`${BASE}/CancelAgreement?id=${cancel.row.idEmployeeAgreement}&reason=${encodeURIComponent(cancel.reason.trim())}`);
      showToast(res.data?.message || "Cancelled", "success");
      setCancel(null);
      setDetail(null);
      load();
    } catch (e) { showToast(await errorOf(e, "Could not cancel"), "error"); }
  };

  const getFile = async (url, name, show) => {
    try {
      const res = await API.get(url, { responseType: "blob" });
      const file = { blob: res.data, contentType: res.headers["content-type"] || "application/pdf", name };
      if (show) { setPreview(file); return; }
      const u = URL.createObjectURL(file.blob);
      const a = document.createElement("a");
      a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 1000);
    } catch (e) { showToast(await errorOf(e, "The file could not be opened"), "error"); }
  };

  const pending = (s) => s === "SENT" || s === "VIEWED" || s === "EXPIRED";

  return (
    <div className={embeddedEmployeeId ? "pc-page" : "container-xxl flex-grow-1 container-p-y pc-page"}>
      <div className="pc-head">
        {embeddedEmployeeId
          ? <div className="pc-sub">Policies and agreements sent to this employee for electronic acceptance.</div>
          : <h4>Employee Agreements</h4>}
        <button type="button" className="btn btn-primary btn-sm" onClick={openSend}><i className="bx bx-send me-1"></i>Send Agreement</button>
      </div>

      <div className="card mb-3"><div className="card-body">
        <div className="row g-2 align-items-end">
          <div className="col-md-6" style={{ display: embeddedEmployeeId ? "none" : undefined }}>
            <label className="form-label mb-1">Search</label>
            <input className="form-control form-control-sm" placeholder="Employee name or code, or agreement title" value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })} />
          </div>
          <div className="col-md-3">
            <label className="form-label mb-1">Status</label>
            <select className="form-select form-select-sm" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
              <option value="">All</option>
              <option value="PENDING">Waiting for response</option>
              <option value="VIEWED">Viewed, not responded</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Link expired</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div></div>

      <div className="card">
        <div className="table-responsive">
          <table className="table pc-table mb-0">
            <thead><tr><th>Employee</th><th>Agreement</th><th>Sent</th><th>Link valid till</th><th>Status</th><th>Responded</th><th></th></tr></thead>
            <tbody>
              {!loading && rows.length === 0 && <tr><td colSpan={7} className="text-center pc-sub py-4">No agreements yet. Use Send Agreement to send one.</td></tr>}
              {rows.map((r) => (
                <tr key={r.idEmployeeAgreement}>
                  <td><div className="fw-semibold">{r.employeeCode} · {r.employeeName}</div><div className="pc-sub">{r.departmentName}</div></td>
                  <td>
                    <div>{r.agreementTitle}{r.agreementVersion ? ` (${r.agreementVersion})` : ""}</div>
                    <div className="pc-sub">{r.documentTypeName ? `${r.documentTypeName} · ` : ""}{r.originalFileName}</div>
                  </td>
                  <td>{fmtUtc(r.sentOnUtc)}</td>
                  <td>{r.status === "ACCEPTED" || r.status === "REJECTED" || r.status === "CANCELLED" ? "—" : fmtUtc(r.linkExpiresOnUtc)}</td>
                  <td><Badge s={r.status} /></td>
                  <td>{fmtUtc(r.respondedOnUtc) || "—"}</td>
                  <td className="text-end text-nowrap">
                    <button type="button" className="btn btn-sm btn-outline-primary me-1" onClick={() => openDetail(r.idEmployeeAgreement)}>Details</button>
                    {r.hasCertificate && (
                      <button type="button" className="btn btn-sm btn-outline-success" title="Certificate"
                        onClick={() => getFile(`${BASE}/DownloadCertificate?id=${r.idEmployeeAgreement}`, `Certificate_AGR-${r.idEmployeeAgreement}.pdf`, true)}>
                        <i className="bx bx-badge-check"></i>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {form && (
        <ModalShell title="Send Agreement for Acceptance" onClose={() => !sending && setForm(null)}
          footer={<>
            <button type="button" className="btn btn-outline-secondary" disabled={sending} onClick={() => setForm(null)}>Close</button>
            <button type="button" className="btn btn-primary" disabled={sending} onClick={send}>{sending ? "Sending..." : "Send to Employee"}</button>
          </>}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label mb-1">Employee *</label>
              <input className="form-control form-control-sm" list="agreement-employees" placeholder="Type name or code" value={form.employeeText}
                disabled={!!embeddedEmployeeId} onChange={(e) => pickEmployee(e.target.value)} />
              <datalist id="agreement-employees">
                {employees.map((e) => <option key={e.idEmployee} value={employeeLabel(e)} />)}
              </datalist>
              {selected && (
                <div className="pc-sub mt-1">
                  {selectedEmails.length ? <>Will be emailed to: <b>{selectedEmails.join(", ")}</b></> : <span className="text-danger">No email address on record</span>}
                </div>
              )}
            </div>
            <div className="col-md-6">
              <label className="form-label mb-1">Document Type</label>
              <select className="form-select form-select-sm" value={form.idDocumentType} onChange={(e) => setForm({ ...form, idDocumentType: e.target.value })}>
                <option value="">—</option>
                {docTypes.map((t) => <option key={t.idDocumentType} value={t.idDocumentType}>{t.documentTypeName}</option>)}
              </select>
            </div>
            <div className="col-md-8">
              <label className="form-label mb-1">Agreement Title *</label>
              <input className="form-control form-control-sm" maxLength={200} placeholder="e.g. Code of Conduct Policy" value={form.agreementTitle}
                onChange={(e) => setForm({ ...form, agreementTitle: e.target.value })} />
            </div>
            <div className="col-md-4">
              <label className="form-label mb-1">Version</label>
              <input className="form-control form-control-sm" maxLength={20} placeholder="e.g. v1.0" value={form.agreementVersion}
                onChange={(e) => setForm({ ...form, agreementVersion: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label mb-1">Agreement PDF * <span className="pc-sub">max 10 MB</span></label>
              <div className="pc-drop" onClick={() => fileInput.current?.click()}>
                {form.file ? <><i className="bx bx-file me-1"></i>{form.file.name} · {formatSize(form.file.size)}</> : <><i className="bx bx-upload me-1"></i>Choose the PDF</>}
              </div>
              <input ref={fileInput} type="file" hidden accept=".pdf,application/pdf" onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                if (!f.name.toLowerCase().endsWith(".pdf")) { showToast("Only PDF files can be sent", "error"); return; }
                if (f.size > 10 * 1024 * 1024) { showToast("The PDF must be 10 MB or smaller", "error"); return; }
                setForm((x) => ({ ...x, file: f }));
              }} />
            </div>
            <div className="col-md-6">
              <label className="form-label mb-1">Remarks (internal)</label>
              <textarea className="form-control form-control-sm" rows={3} maxLength={500} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
            </div>
          </div>
          <div className="pc-banner info mt-3 mb-0">
            The employee receives the PDF with a Review Agreement link. They read it, confirm with a one-time code sent to their email, type their name and accept or reject.
            The document cannot be changed after it is sent; send a new version instead.
          </div>
        </ModalShell>
      )}

      {detail && (
        <ModalShell title={`AGR-${String(detail.idEmployeeAgreement).padStart(6, "0")} · ${detail.agreementTitle}`} onClose={() => setDetail(null)}
          right={<Badge s={detail.status} />}
          footer={<>
            {pending(detail.status) && <button type="button" className="btn btn-outline-danger" onClick={() => setCancel({ row: detail, reason: "" })}>Cancel Agreement</button>}
            {pending(detail.status) && <button type="button" className="btn btn-outline-primary" onClick={() => resend(detail)}>Resend New Link</button>}
            <button type="button" className="btn btn-outline-secondary" onClick={() => getFile(`${BASE}/DownloadAgreement?id=${detail.idEmployeeAgreement}`, detail.originalFileName, true)}>View Document</button>
            {detail.hasCertificate && (
              <button type="button" className="btn btn-success" onClick={() => getFile(`${BASE}/DownloadCertificate?id=${detail.idEmployeeAgreement}`, `Certificate_AGR-${detail.idEmployeeAgreement}.pdf`, false)}>Download Certificate</button>
            )}
          </>}>
          <div className={`pc-banner ${detail.trailIntact ? "ok" : "bad"}`}>
            {detail.trailIntact ? "Evidence trail verified: no entry has been changed." : "Warning: the evidence trail does not verify. An entry may have been changed in the database."}
          </div>
          <div className="pc-kv mb-3">
            <div><label>Employee</label><div>{detail.employeeCode} · {detail.employeeName}</div></div>
            <div><label>Sent to</label><div>{detail.sentTo}</div></div>
            <div><label>Sent on / by</label><div>{fmtUtc(detail.sentOnUtc)} · {detail.sentByName || "—"}</div></div>
            <div><label>File</label><div>{detail.originalFileName} · {formatSize(detail.fileSize)}</div></div>
            <div style={{ gridColumn: "span 2" }}><label>Document SHA-256</label><div className="text-break small">{detail.fileHash}</div></div>
            {detail.respondedOnUtc && <>
              <div><label>Responded on</label><div>{fmtUtc(detail.respondedOnUtc)}</div></div>
              <div><label>Name typed</label><div>{detail.responseName}</div></div>
              <div><label>IP address</label><div>{detail.responseIPAddress}</div></div>
              {detail.responseRemarks && <div style={{ gridColumn: "span 3" }}><label>Employee remarks</label><div>{detail.responseRemarks}</div></div>}
            </>}
            {detail.cancelReason && <div style={{ gridColumn: "span 3" }}><label>Cancel reason</label><div>{detail.cancelReason}</div></div>}
            {detail.remarks && <div style={{ gridColumn: "span 3" }}><label>Internal remarks</label><div>{detail.remarks}</div></div>}
          </div>
          <h6>Evidence trail</h6>
          <div className="table-responsive" style={{ maxHeight: 320 }}>
            <table className="table table-sm pc-table mb-0">
              <thead><tr><th>Time</th><th>Event</th><th>By</th><th>IP</th><th>Details</th></tr></thead>
              <tbody>
                {detail.events.map((e, i) => (
                  <tr key={i}>
                    <td className="text-nowrap">{fmtUtc(e.eventTimeUtc)}</td>
                    <td>{e.eventType.replace(/_/g, " ")}</td>
                    <td>{e.actorName || e.actorType}</td>
                    <td>{e.ipAddress || ""}</td>
                    <td className="text-break small">{e.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ModalShell>
      )}

      {cancel && (
        <ModalShell title="Cancel this agreement?" size="sm" onClose={() => setCancel(null)}
          footer={<>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setCancel(null)}>Keep</button>
            <button type="button" className="btn btn-danger" onClick={doCancel}>Cancel Agreement</button>
          </>}>
          <p className="mb-2">The employee's link stops working. This is recorded in the evidence trail.</p>
          <label className="form-label mb-1">Reason *</label>
          <textarea className="form-control form-control-sm" rows={2} maxLength={500} value={cancel.reason} onChange={(e) => setCancel({ ...cancel, reason: e.target.value })} />
        </ModalShell>
      )}

      <DocumentPreview file={preview} onClose={() => setPreview(null)} />
    </div>
  );
};

export default EmployeeAgreements;
