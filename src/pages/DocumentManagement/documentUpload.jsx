import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import GeneralDocumentService from "../../core/services/GeneralDocumentService";
import { showToast } from "../../components/ToastNotifications/toastUtils";
import { DocumentFormModal, UploadModal, ValidityBadge, MAINTENANCE_TYPES, labelOf, formatDate, useDocumentLookups } from "./shared";
import { canManageDoc } from "./documentRegister";

/** Pick a registered document (or register a new one) and upload its file. */
const DocumentUpload = () => {
  const navigate = useNavigate();
  const { lookups, error: lookupError } = useDocumentLookups();
  const [search, setSearch] = useState("");
  const [idType, setIdType] = useState("");
  const [onlyPending, setOnlyPending] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadDoc, setUploadDoc] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [done, setDone] = useState([]);   // uploaded in this session
  const timer = useRef(null);

  const load = async () => {
    setLoading(true);
    const res = await GeneralDocumentService.getDocuments({
      search: search.trim() || null,
      idGeneralDocumentType: idType ? Number(idType) : null,
    });
    setLoading(false);
    if (res.error) { showToast(res.error, "error"); setRows([]); return; }
    setRows(res.data || []);
  };

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(load, 350);
    return () => clearTimeout(timer.current);
  }, [search, idType]);

  const list = useMemo(() => rows
    .filter((r) => canManageDoc(lookups, r))
    .filter((r) => !onlyPending || ["NO_RECORD", "EXPIRED", "EXPIRING"].includes(r.validityStatus))
    .slice(0, 200), [rows, lookups, onlyPending]);

  if (lookupError) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y pc-page">
        <div className="pc-head"><h4>Document Upload</h4></div>
        <div className="pc-banner bg-label-danger">{lookupError}</div>
      </div>
    );
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y pc-page">
      <div className="pc-head d-flex justify-content-between align-items-center mb-3">
        <h4>Document Upload</h4>
        {lookups?.canRegister && (
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setRegistering(true)}>
            <i className="bx bx-plus me-1"></i>Register New Document
          </button>
        )}
      </div>

      {lookups && !lookups.canUpload && (
        <div className="pc-banner bg-label-warning">You can view documents but do not have permission to upload.</div>
      )}

      {done.length > 0 && (
        <div className="pc-banner bg-label-success">
          Uploaded: {done.map((d, i) => (
            <span key={d.idGeneralDocument}>
              {i > 0 && ", "}
              <a href="#" onClick={(e) => { e.preventDefault(); navigate(`/dashboard/document-history/${d.idGeneralDocument}`); }}>{d.title}</a>
            </span>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-body py-3">
          <div className="row g-2 align-items-end mb-3">
            <div className="col-md-5">
              <label className="form-label mb-1">Find the document</label>
              <input className="form-control form-control-sm" placeholder="Title, code, reference no., tag" maxLength={100} autoFocus
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label mb-1">Type</label>
              <select className="form-select form-select-sm" value={idType} onChange={(e) => setIdType(e.target.value)}>
                <option value="">All</option>
                {(lookups?.types || []).map((t) => <option key={t.idGeneralDocumentType} value={t.idGeneralDocumentType}>{t.typeName}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-check mb-1">
                <input type="checkbox" className="form-check-input" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} />
                <span className="form-check-label">Only not uploaded / expiring / expired</span>
              </label>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table pc-table dm-table mb-0">
              <thead><tr><th>Document</th><th>Scope</th><th>Maintenance</th><th>Current</th><th>Validity</th><th></th></tr></thead>
              <tbody>
                {!loading && list.length === 0 && (
                  <tr><td colSpan={6} className="text-center pc-sub py-4">
                    No documents found.{lookups?.canRegister ? " Register the document first." : ""}
                  </td></tr>
                )}
                {list.map((r) => (
                  <tr key={r.idGeneralDocument}>
                    <td style={{ maxWidth: 320 }}>
                      <div className="dm-title text-break">{r.title}</div>
                      <div className="pc-sub">{r.documentCode} · {r.typeName}{r.subtypeName ? ` / ${r.subtypeName}` : ""}</div>
                    </td>
                    <td>{r.scope === "OFFICE" ? r.officeName : "Organisation"}</td>
                    <td>{labelOf(MAINTENANCE_TYPES, r.maintenanceType)}</td>
                    <td>{r.idCurrentRecord ? <>{r.periodLabel || `Version ${r.versionNumber}`}<div className="pc-sub">{formatDate(r.lastUploadedDateTime)}</div></> : <span className="pc-sub">—</span>}</td>
                    <td>{r.validTo && <div>{formatDate(r.validTo)}</div>}<ValidityBadge status={r.validityStatus} days={r.daysToExpiry} /></td>
                    <td className="text-end">
                      {lookups?.canUpload && (
                        <button type="button" className="btn btn-sm btn-primary" onClick={() => setUploadDoc(r)}>
                          <i className="bx bx-upload me-1"></i>Upload
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {list.length === 200 && <div className="pc-sub mt-2">Showing the first 200 documents. Narrow the search to find others.</div>}
        </div>
      </div>

      {registering && lookups && (
        <DocumentFormModal lookups={lookups} onClose={() => setRegistering(false)}
          onSaved={async (id) => {
            setRegistering(false);
            const res = await GeneralDocumentService.getDocument(id);
            if (!res.error && lookups.canUpload) setUploadDoc(res.data.document);
            load();
          }} />
      )}
      {uploadDoc && lookups && (
        <UploadModal lookups={lookups} document={uploadDoc} lastPeriod={uploadDoc.periodTo ? { periodTo: uploadDoc.periodTo } : null}
          onClose={() => setUploadDoc(null)}
          onSaved={() => {
            setDone((p) => [uploadDoc, ...p.filter((x) => x.idGeneralDocument !== uploadDoc.idGeneralDocument)].slice(0, 10));
            setUploadDoc(null);
            load();
          }} />
      )}
    </div>
  );
};

export default DocumentUpload;
