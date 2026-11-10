import { useEffect, useMemo, useState } from "react";
import GeneralDocumentService, { saveBlob } from "../../core/services/GeneralDocumentService";
import { showToast } from "../../components/ToastNotifications/toastUtils";
import { DocumentPreview, formatDate, formatSize } from "./ProfileChange/shared";
import "./ProfileChange/profileChange.css";
import "../DocumentManagement/documentManagement.css";

/** Self Portal -> Documents: company documents published to employees, with view and acknowledgement. */
const MyDocuments = () => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState("ALL");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = async () => {
    setLoading(true);
    const res = await GeneralDocumentService.getMyDocuments();
    setLoading(false);
    if (res.error) {
      showToast(res.error, "error");
      return;
    }
    setDocs(res.data || []);
  };
  useEffect(() => { load(); }, []);

  const pending = docs.filter((d) => d.acknowledgementRequired && !d.acknowledgedDateTime);

  const shown = useMemo(() => {
    const s = search.trim().toLowerCase();
    return docs
      .filter((d) => show === "ALL" || (show === "PENDING" ? d.acknowledgementRequired && !d.acknowledgedDateTime : !!d.acknowledgedDateTime))
      .filter((d) => !s || `${d.title} ${d.typeName || ""} ${d.subtypeName || ""} ${d.documentCode || ""}`.toLowerCase().includes(s));
  }, [docs, show, search]);

  const open = async (doc, file, download = false) => {
    setBusy(file.idGeneralDocumentFile);
    const res = await GeneralDocumentService.viewMyFile(file.idGeneralDocumentFile, file.originalFileName);
    setBusy(null);
    if (res.error) return showToast(res.error, "error");
    // opening the file is what enables "Viewed and Acknowledged"
    setDocs((list) => list.map((d) => (d.idGeneralDocumentRecord === doc.idGeneralDocumentRecord && !d.firstViewedDateTime ? { ...d, firstViewedDateTime: new Date().toISOString() } : d)));
    const previewable = (file.mimeType || "").startsWith("image/") || file.mimeType === "application/pdf";
    if (previewable && !download) setPreview({ blob: res.blob, contentType: res.contentType, name: file.originalFileName });
    else saveBlob(res.blob, file.originalFileName);
    return null;
  };

  const acknowledge = async (doc) => {
    setBusy(`ack-${doc.idGeneralDocumentRecord}`);
    const res = await GeneralDocumentService.acknowledgeMyDocument(doc.idGeneralDocumentRecord);
    setBusy(null);
    if (res.error) return showToast(res.error, "error");
    showToast(res.message || "Acknowledged", "success");
    setDocs((list) => list.map((d) => (d.idGeneralDocumentRecord === doc.idGeneralDocumentRecord ? { ...d, acknowledgedDateTime: res.data } : d)));
    return null;
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y pc-page">
      <div className="pc-head d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h4>Documents</h4>
        <input className="form-control form-control-sm" style={{ maxWidth: 280 }} placeholder="Search documents" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {pending.length > 0 && (
        <div className="pc-banner bg-label-warning">
          {pending.length} document{pending.length === 1 ? " needs" : "s need"} your acknowledgement. Open each document, read it and click <b>Viewed and Acknowledged</b>.
        </div>
      )}

      <div className="pc-tabs mb-3" style={{ background: "#fff", borderRadius: 8 }}>
        {[["ALL", `All (${docs.length})`], ["PENDING", `To acknowledge (${pending.length})`], ["DONE", "Acknowledged"]].map(([k, l]) => (
          <button key={k} type="button" className={show === k ? "active" : ""} onClick={() => setShow(k)}>{l}</button>
        ))}
      </div>

      {loading && <div className="pc-sub">Loading...</div>}
      {!loading && shown.length === 0 && (
        <div className="card"><div className="card-body text-center pc-sub py-4">
          {docs.length === 0 ? "No documents have been published to you yet." : "No documents in this list."}
        </div></div>
      )}

      {shown.map((d) => {
        const needsAck = d.acknowledgementRequired && !d.acknowledgedDateTime;
        const viewed = !!d.firstViewedDateTime;
        return (
          <div key={d.idGeneralDocumentRecord} className={`dm-record ${needsAck ? "current" : ""}`}>
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
              <div>
                <div className="fw-semibold">{d.title}</div>
                <div className="pc-meta">
                  <span>{d.typeName}{d.subtypeName ? ` / ${d.subtypeName}` : ""}</span>
                  <span>{d.periodLabel || `Version ${d.versionNumber}`}</span>
                  <span>Published {formatDate(d.publishedDateTime)}</span>
                  {d.officeName && <span>{d.officeName}</span>}
                  {d.validTo && <span>Valid till {formatDate(d.validTo)}</span>}
                </div>
                {d.description && <div className="pc-sub mt-1">{d.description}</div>}
              </div>
              <div className="text-end">
                {d.acknowledgedDateTime ? (
                  <span className="badge bg-label-success"><i className="bx bx-check me-1"></i>Acknowledged on {formatDate(d.acknowledgedDateTime, true)}</span>
                ) : d.acknowledgementRequired ? (
                  <span className="badge bg-label-warning">Acknowledgement pending</span>
                ) : viewed ? (
                  <span className="badge bg-label-info">Viewed</span>
                ) : (
                  <span className="badge bg-label-secondary">New</span>
                )}
              </div>
            </div>

            <div className="mt-2">
              {d.files.map((f) => (
                <div key={f.idGeneralDocumentFile} className="pc-file">
                  <span className="text-break"><i className="bx bx-file me-1"></i>{f.originalFileName} <span className="pc-sub">({formatSize(f.fileSize)})</span></span>
                  <span className="text-nowrap">
                    <button type="button" className="btn btn-sm btn-outline-primary me-1" disabled={busy === f.idGeneralDocumentFile} onClick={() => open(d, f)}>
                      <i className="bx bx-show me-1"></i>View Document
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-secondary" disabled={busy === f.idGeneralDocumentFile} onClick={() => open(d, f, true)} title="Download">
                      <i className="bx bx-download"></i>
                    </button>
                  </span>
                </div>
              ))}
            </div>

            {needsAck && (
              <div className="d-flex justify-content-end align-items-center gap-2 mt-2 flex-wrap">
                {!viewed && <span className="pc-sub">Open the document first to enable acknowledgement.</span>}
                <button type="button" className="btn btn-sm btn-success" disabled={!viewed || busy === `ack-${d.idGeneralDocumentRecord}`} onClick={() => acknowledge(d)}>
                  <i className="bx bx-check-double me-1"></i>Viewed and Acknowledged
                </button>
              </div>
            )}
          </div>
        );
      })}

      <DocumentPreview file={preview} onClose={() => setPreview(null)} />
    </div>
  );
};

export default MyDocuments;
