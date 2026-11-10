import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import GeneralDocumentService from "../../core/services/GeneralDocumentService";
import { showToast } from "../../components/ToastNotifications/toastUtils";
import { DocumentPreview } from "../EmployeeSelfPortal/ProfileChange/shared";
import {
  DocumentFormModal, UploadModal, RemarksModal, ValidityBadge, RecordStatusBadge, MAINTENANCE_TYPES, FREQUENCIES,
  labelOf, formatDate, formatSize, useDocumentLookups, useFileOpener, downloadZip,
} from "./shared";

const ACTION_LABELS = {
  CREATE: "Registered",
  UPDATE: "Details changed",
  ACTIVATE: "Activated",
  DEACTIVATE: "Deactivated",
  UPLOAD: "Uploaded",
  RECORD_UPDATE: "Record corrected",
  MARK_INCORRECT: "Marked incorrect",
  MARK_SUPERSEDED: "Marked superseded",
  VIEW: "Viewed",
  DOWNLOAD: "Downloaded",
  ZIP_DOWNLOAD: "Downloaded (ZIP)",
};

// {"Title":{"From":"a","To":"b"},"Files":[...]} -> readable lines
const describe = (json) => {
  if (!json) return "";
  let data;
  try { data = JSON.parse(json); } catch { return json; }
  if (!data || typeof data !== "object") return String(data);
  const value = (v) => {
    if (v == null || v === "") return "—";
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) return formatDate(v);
    if (Array.isArray(v)) return v.length === 0 ? "—" : v.map((x) => (typeof x === "object" ? x.OriginalFileName || JSON.stringify(x) : x)).join(", ");
    if (typeof v === "object") return "From" in v || "To" in v ? `${value(v.From)} → ${value(v.To)}` : JSON.stringify(v);
    return String(v);
  };
  const source = data.Changes && typeof data.Changes === "object" ? { ...data, ...data.Changes, Changes: undefined } : data;
  return Object.entries(source)
    .filter(([, v]) => v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0))
    .map(([k, v]) => `${k.replace(/^Id/, "").replace(/([a-z])([A-Z])/g, "$1 $2")}: ${value(v)}`)
    .join("\n");
};

const KV = ({ label, children }) => (
  <div>
    <label>{label}</label>
    <div>{children || "—"}</div>
  </div>
);

const DocumentHistory = () => {
  const { id } = useParams();
  const [search, setSearch] = useSearchParams();
  const navigate = useNavigate();
  const { lookups } = useDocumentLookups();
  const { preview, setPreview, busy, open } = useFileOpener();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("records");
  const [showAll, setShowAll] = useState(true);
  const [modal, setModal] = useState(null);   // {kind, record}

  const load = useCallback(async () => {
    const res = await GeneralDocumentService.getDocument(id);
    if (res.error) setError(res.error);
    else { setDetail(res.data); setError(null); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // opened from "Register Document": go straight to the upload pop-up
  useEffect(() => {
    if (search.get("upload") === "1" && detail && lookups) {
      if (detail.canManage && lookups.canUpload) setModal({ kind: "upload" });
      setSearch({}, { replace: true });
    }
  }, [search, detail, lookups, setSearch]);

  if (error) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y pc-page">
        <div className="pc-head mb-3"><h4>Document History</h4></div>
        <div className="pc-banner bg-label-danger">{error}</div>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => navigate("/dashboard/document-register")}>Back to register</button>
      </div>
    );
  }
  if (!detail) return <div className="container-xxl flex-grow-1 container-p-y pc-page pc-sub">Loading...</div>;

  const d = detail.document;
  const manage = detail.canManage;
  const canUpload = manage && lookups?.canUpload && d.isActive;
  const canEdit = manage && lookups?.canEdit;
  const canMark = manage && lookups?.canMarkStatus;
  const records = showAll ? detail.records : detail.records.filter((r) => r.recordStatus === "ACTIVE");
  const latestPeriod = detail.records.filter((r) => r.recordStatus === "ACTIVE" && r.periodTo).sort((a, b) => (a.periodTo < b.periodTo ? 1 : -1))[0];

  const markStatus = (record, status) => setModal({ kind: "status", record, status });
  const after = () => { setModal(null); load(); };

  return (
    <div className="container-xxl flex-grow-1 container-p-y pc-page">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
        <div>
          <button type="button" className="btn btn-sm btn-link px-0" onClick={() => navigate(-1)}><i className="bx bx-chevron-left"></i>Back</button>
          <h4 className="mb-1">{d.title}</h4>
          <div className="pc-meta">
            <span>{d.documentCode}</span>
            <span>{d.typeName}{d.subtypeName ? ` / ${d.subtypeName}` : ""}</span>
            <span>{d.scope === "OFFICE" ? d.officeName : "Organisation"}</span>
            <span>{labelOf(MAINTENANCE_TYPES, d.maintenanceType)}{d.periodFrequency ? ` · ${labelOf(FREQUENCIES, d.periodFrequency)}` : ""}</span>
            {!d.isActive && <span className="badge bg-label-secondary">Inactive</span>}
            <ValidityBadge status={d.validityStatus} days={d.daysToExpiry} />
          </div>
          {d.description && <div className="mt-1 pc-sub">{d.description}</div>}
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {canUpload && (
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setModal({ kind: "upload" })}>
              <i className="bx bx-upload me-1"></i>{d.maintenanceType === "PERIODIC" ? "Upload Period" : d.idCurrentRecord ? "Upload New Version" : "Upload"}
            </button>
          )}
          {d.fileCount > 0 && (
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => downloadZip([d.idGeneralDocument], [])}>
              <i className="bx bx-download me-1"></i>Current Files
            </button>
          )}
          {canEdit && (
            <>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setModal({ kind: "edit" })}>
                <i className="bx bx-edit me-1"></i>Edit
              </button>
              <button type="button" className={`btn btn-sm ${d.isActive ? "btn-outline-danger" : "btn-outline-success"}`}
                onClick={() => setModal({ kind: d.isActive ? "deactivate" : "activate" })}>
                {d.isActive ? "Deactivate" : "Activate"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="pc-tabs">
          <button type="button" className={tab === "records" ? "active" : ""} onClick={() => setTab("records")}>Records ({detail.records.length})</button>
          <button type="button" className={tab === "audit" ? "active" : ""} onClick={() => setTab("audit")}>Audit Trail</button>
        </div>

        {tab === "records" && (
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="pc-sub">
                {d.maintenanceType === "PERIODIC"
                  ? "One record per period. The latest period is the current one."
                  : "The latest active record is the current one. Earlier uploads are kept as superseded."}
              </span>
              <label className="form-check mb-0">
                <input type="checkbox" className="form-check-input" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
                <span className="form-check-label">Show superseded / incorrect</span>
              </label>
            </div>

            {records.length === 0 && <div className="text-center pc-sub py-4">No files uploaded yet.</div>}

            {records.map((r) => (
              <div key={r.idGeneralDocumentRecord} className={`dm-record ${r.isCurrent ? "current" : ""} ${r.recordStatus !== "ACTIVE" ? "muted" : ""}`}>
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className="fw-semibold">Version {r.versionNumber}{r.periodLabel ? ` · ${r.periodLabel}` : ""}</span>
                    <RecordStatusBadge status={r.recordStatus} />
                    {r.isCurrent && <span className="badge bg-primary">Current</span>}
                    {r.recordStatus === "ACTIVE" && <ValidityBadge status={r.validityStatus} />}
                  </div>
                  <div className="d-flex gap-1 flex-wrap">
                    {r.files.length > 1 && (
                      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => downloadZip([], [r.idGeneralDocumentRecord])} title="Download all files of this record">
                        <i className="bx bx-archive"></i>
                      </button>
                    )}
                    {canEdit && r.recordStatus === "ACTIVE" && (
                      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setModal({ kind: "record", record: r })}>Correct Details</button>
                    )}
                    {canMark && r.recordStatus === "ACTIVE" && (
                      <button type="button" className="btn btn-sm btn-outline-warning" onClick={() => markStatus(r, "SUPERSEDED")}>Mark Superseded</button>
                    )}
                    {canMark && r.recordStatus !== "INCORRECT" && (
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => markStatus(r, "INCORRECT")}>Mark Incorrect</button>
                    )}
                  </div>
                </div>

                <div className="dm-kv">
                  {r.periodFrom && <KV label="Period">{formatDate(r.periodFrom)} to {formatDate(r.periodTo)}</KV>}
                  <KV label="Reference No.">{r.referenceNumber}</KV>
                  <KV label="Issuing Authority">{r.issuingAuthority}</KV>
                  <KV label="Issue Date">{formatDate(r.issueDate)}</KV>
                  <KV label="Valid From">{formatDate(r.validFrom)}</KV>
                  <KV label="Valid To">{r.validTo ? formatDate(r.validTo) : r.recordStatus === "ACTIVE" ? "No expiry" : null}</KV>
                  <KV label="Uploaded">{formatDate(r.uploadedDateTime, true)}{r.uploadedByName ? ` · ${r.uploadedByName}` : ""}</KV>
                </div>
                {r.remarks && <div className="mt-2"><span className="pc-sub">Remarks: </span>{r.remarks}</div>}
                {r.recordStatus !== "ACTIVE" && (r.statusRemarks || r.supersededByVersion) && (
                  <div className="mt-1 pc-sub">
                    {r.statusRemarks}
                    {r.statusChangedByName ? ` · ${r.statusChangedByName}` : ""}
                    {r.statusChangedDateTime ? ` · ${formatDate(r.statusChangedDateTime, true)}` : ""}
                  </div>
                )}
                {r.recordStatus === "ACTIVE" && r.statusRemarks && <div className="mt-1 pc-sub">{r.statusRemarks}</div>}

                <div className="mt-2">
                  {r.files.map((f) => (
                    <div key={f.idGeneralDocumentFile} className="pc-file">
                      <span className="text-break"><i className="bx bx-file me-1"></i>{f.originalFileName} <span className="pc-sub">({formatSize(f.fileSize)})</span></span>
                      <span className="text-nowrap">
                        <button type="button" className="btn btn-sm btn-outline-primary me-1" disabled={busy === f.idGeneralDocumentFile} onClick={() => open(f)}>
                          <i className="bx bx-show me-1"></i>View
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-secondary" disabled={busy === f.idGeneralDocumentFile} onClick={() => open(f, true)} title="Download">
                          <i className="bx bx-download"></i>
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "audit" && (
          <div className="table-responsive">
            <table className="table pc-table dm-audit mb-0">
              <thead><tr><th>Date / Time</th><th>Action</th><th>By</th><th>Details</th></tr></thead>
              <tbody>
                {detail.audit.length === 0 && <tr><td colSpan={4} className="text-center pc-sub py-4">No entries.</td></tr>}
                {detail.audit.map((a, i) => (
                  <tr key={i}>
                    <td className="text-nowrap">{formatDate(a.actionDateTime, true)}</td>
                    <td className="text-nowrap">{ACTION_LABELS[a.action] || a.action}{a.versionNumber ? ` · v${a.versionNumber}` : ""}</td>
                    <td>{a.actionByName || "—"}</td>
                    <td style={{ maxWidth: 480 }}><code>{describe(a.details)}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal?.kind === "upload" && lookups && (
        <UploadModal lookups={lookups} document={d} lastPeriod={latestPeriod} onClose={() => setModal(null)} onSaved={after} />
      )}
      {modal?.kind === "record" && lookups && (
        <UploadModal lookups={lookups} document={d} record={modal.record} onClose={() => setModal(null)} onSaved={after} />
      )}
      {modal?.kind === "edit" && lookups && (
        <DocumentFormModal lookups={lookups} document={d} onClose={() => setModal(null)} onSaved={after} />
      )}
      {modal?.kind === "status" && (
        <RemarksModal
          title={`Mark Version ${modal.record.versionNumber} ${modal.status === "INCORRECT" ? "Incorrect" : "Superseded"}`}
          message={modal.status === "INCORRECT"
            ? "Use this when the wrong file or details were uploaded. If this upload replaced an earlier record, that record becomes active again."
            : "The record stays in the history but is no longer treated as valid."}
          confirmLabel={modal.status === "INCORRECT" ? "Mark Incorrect" : "Mark Superseded"}
          confirmClass={modal.status === "INCORRECT" ? "btn-danger" : "btn-warning"}
          onClose={() => setModal(null)}
          onConfirm={async (remarks) => {
            const res = await GeneralDocumentService.setRecordStatus({ idGeneralDocumentRecord: modal.record.idGeneralDocumentRecord, status: modal.status, remarks });
            if (res.error) { showToast(res.error, "error"); return false; }
            showToast(res.message, "success");
            load();
            return true;
          }}
        />
      )}
      {(modal?.kind === "deactivate" || modal?.kind === "activate") && (
        <RemarksModal
          title={modal.kind === "deactivate" ? "Deactivate Document" : "Activate Document"}
          message={modal.kind === "deactivate"
            ? "Inactive documents are hidden from the register and expiry monitoring. Files and history are kept."
            : "The document will appear in the register and expiry monitoring again."}
          required={modal.kind === "deactivate"}
          confirmLabel={modal.kind === "deactivate" ? "Deactivate" : "Activate"}
          confirmClass={modal.kind === "deactivate" ? "btn-danger" : "btn-success"}
          onClose={() => setModal(null)}
          onConfirm={async (remarks) => {
            const res = await GeneralDocumentService.setDocumentActive(d.idGeneralDocument, modal.kind === "activate", remarks || null);
            if (res.error) { showToast(res.error, "error"); return false; }
            showToast(res.message, "success");
            load();
            return true;
          }}
        />
      )}
      <DocumentPreview file={preview} onClose={() => setPreview(null)} />
    </div>
  );
};

export default DocumentHistory;
