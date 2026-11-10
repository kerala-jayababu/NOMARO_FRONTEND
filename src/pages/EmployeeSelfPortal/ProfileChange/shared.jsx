import React, { useEffect, useState } from "react";
import Utils from "../../../utils/Utils";
import "./profileChange.css";

export const CATEGORY_LABELS = {
  PERSONAL: "Personal",
  CONTACT: "Contact",
  ADDRESS: "Address",
  EMERGENCY: "Emergency Contact",
  IDENTITY: "Identity",
  STATUTORY: "Statutory",
  CHILDREN: "Children",
  FAMILY: "Family",
  BANK: "Bank",
  DOCUMENT: "Documents",
};

const STATUS = {
  DRAFT: { cls: "bg-label-secondary", label: "Draft" },
  SUBMITTED: { cls: "bg-label-info", label: "Submitted" },
  "INTERIM APPROVED": { cls: "bg-label-info", label: "Interim Approved" },
  "CLARIFICATION REQUIRED": { cls: "bg-label-warning", label: "Clarification Required" },
  "FINAL APPROVED": { cls: "bg-label-success", label: "Approved" },
  REJECTED: { cls: "bg-label-danger", label: "Rejected" },
  CANCELLED: { cls: "bg-label-secondary", label: "Cancelled" },
};

export const StatusBadge = ({ status }) => {
  const s = STATUS[status] || { cls: "bg-label-secondary", label: status };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
};

export const formatDate = (value, withTime = false) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const base = Utils.formatDisplayDate(value);
  if (!withTime) return base;
  return `${base} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export const formatSize = (bytes) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export const ModalShell = ({ title, onClose, children, footer, size = "", right = null }) => (
  <div className="pc-overlay" role="dialog" aria-modal="true">
    <div className={`pc-modal ${size}`}>
      <div className="pc-modal-h">
        <h5>{title}</h5>
        <div className="d-flex align-items-center gap-2">
          {right}
          <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
        </div>
      </div>
      <div className="pc-modal-b">{children}</div>
      {footer && <div className="pc-modal-f">{footer}</div>}
    </div>
  </div>
);

// Opens a downloaded blob inline (PDF / image) with a download button
export const DocumentPreview = ({ file, onClose }) => {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!file?.blob) return undefined;
    const u = URL.createObjectURL(file.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  if (!file) return null;
  const isImage = (file.contentType || "").startsWith("image/");
  return (
    <ModalShell
      title={file.name}
      size="xl"
      onClose={onClose}
      right={url && <a className="btn btn-sm btn-outline-primary" href={url} download={file.name}>Download</a>}
    >
      {url && (isImage
        ? <img className="pc-preview-img" src={url} alt={file.name} />
        : <iframe className="pc-preview" src={url} title={file.name} />)}
    </ModalShell>
  );
};

const historyClass = (h) => {
  if (h.isPending) return "pending";
  if (/Rejected/.test(h.action)) return "bad";
  if (/clarification|Cancelled/i.test(h.action)) return "warn";
  return "";
};

export const HistoryTimeline = ({ history }) => (
  <ul className="pc-tl">
    {(history || []).map((h, i) => (
      <li key={i} className={`it ${historyClass(h)}`}>
        <div className="t">{h.action}</div>
        <div className="pc-sub">
          {[h.actionBy, h.actionDate ? formatDate(h.actionDate, true) : null].filter(Boolean).join(" · ") || (h.isPending ? "Pending" : "")}
        </div>
        {h.remarks && <div className="note">{h.remarks}</div>}
      </li>
    ))}
  </ul>
);

/**
 * Requested changes + documents + approval history.
 * mode "HR" shows the value currently in the master and conflict highlights.
 */
export const RequestDetailView = ({ detail, mode, onOpenDocument, onReveal, revealed = {} }) => {
  if (!detail) return null;
  const isHr = mode === "HR";
  const showCurrent = isHr && detail.changes.some((c) => c.currentValue !== undefined && c.currentValue !== null);

  return (
    <div className="pc-split">
      <div>
        <div className="card mb-3">
          <div className="card-header d-flex justify-content-between align-items-center py-2">
            <h6 className="m-0">Requested Changes</h6>
            {detail.recordLabel && <span className="pc-sub">Record: {detail.recordLabel}</span>}
          </div>
          <div className="table-responsive">
            <table className="table table-sm pc-table mb-0">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>{detail.operation === "ADD" ? "" : "Value at request"}</th>
                  {showCurrent && <th>Current (master)</th>}
                  <th>Requested</th>
                </tr>
              </thead>
              <tbody>
                {detail.changes.length === 0 && (
                  <tr><td colSpan={4} className="text-center pc-sub py-3">No field changes (document only).</td></tr>
                )}
                {detail.changes.map((c) => (
                  <tr key={c.idProfileChangeRequestDetail} className={c.hasConflict ? "conflict" : "changed"}>
                    <td>{c.label}</td>
                    <td className={detail.operation === "ADD" ? "" : "pc-old"}>{detail.operation === "ADD" ? "" : (c.oldValue || "—")}</td>
                    {showCurrent && (
                      <td>
                        {c.currentValue || "—"}
                        {c.hasConflict && <div className="text-danger small">Changed since the request was submitted</div>}
                      </td>
                    )}
                    <td className={c.operation === "REMOVE" ? "text-danger fw-semibold" : "pc-new"}>
                      {revealed[c.idProfileChangeRequestDetail] || c.newValue || "—"}
                      {isHr && c.isSensitive && detail.canRevealSensitive && !revealed[c.idProfileChangeRequestDetail] && onReveal && (
                        <button type="button" className="pc-reveal" onClick={() => onReveal(c.idProfileChangeRequestDetail)}>Show</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-header py-2"><h6 className="m-0">Documents</h6></div>
          <div className="card-body pt-2">
            {detail.documents.length === 0 && <div className="pc-sub">No documents uploaded.</div>}
            {detail.documents.map((d) => (
              <div key={d.idProfileChangeRequestDocument} className="pc-file">
                <span>
                  <i className="bx bx-file me-1"></i>{d.originalFileName}
                  <span className="pc-sub"> · {formatSize(d.fileSize)}{d.documentTypeName ? ` · ${d.documentTypeName}` : ""} · {formatDate(d.uploadedOn)}</span>
                </span>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onOpenDocument(d)}>View</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-header py-2"><h6 className="m-0">Approval History</h6></div>
        <div className="card-body pt-3">
          <HistoryTimeline history={detail.history} />
        </div>
      </div>
    </div>
  );
};
