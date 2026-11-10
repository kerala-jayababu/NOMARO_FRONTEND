import { useEffect, useMemo, useRef, useState } from "react";
import { useAppNavigate } from "../../utils/useAppNavigate";
import GeneralDocumentService from "../../core/services/GeneralDocumentService";
import { showToast } from "../../components/ToastNotifications/toastUtils";
import {
  DocumentFormModal, UploadModal, ValidityBadge, MAINTENANCE_TYPES, SCOPES, VALIDITY, FREQUENCIES,
  labelOf, formatDate, useDocumentLookups, downloadZip,
} from "./shared";

const PAGE_SIZE = 25;
const emptyFilter = { search: "", idGeneralDocumentType: "", idGeneralDocumentSubtype: "", scope: "", idOffice: "", maintenanceType: "", includeInactive: false };

export const canManageDoc = (lookups, d) =>
  !!lookups && (lookups.allOffices || (d.scope === "OFFICE" && lookups.offices.some((o) => o.idOffice === d.idOffice)));

export const toServerFilter = (f) => ({
  search: f.search.trim() || null,
  idGeneralDocumentType: f.idGeneralDocumentType ? Number(f.idGeneralDocumentType) : null,
  idGeneralDocumentSubtype: f.idGeneralDocumentSubtype ? Number(f.idGeneralDocumentSubtype) : null,
  scope: f.scope || null,
  idOffice: f.idOffice ? Number(f.idOffice) : null,
  maintenanceType: f.maintenanceType || null,
  includeInactive: !!f.includeInactive,
});

const DocumentRegister = () => {
  const navigate = useAppNavigate();
  const { lookups, error: lookupError } = useDocumentLookups();
  const [filter, setFilter] = useState(emptyFilter);
  const [validity, setValidity] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [editDoc, setEditDoc] = useState(null);     // {} = new
  const [uploadDoc, setUploadDoc] = useState(null);
  const [zipping, setZipping] = useState(false);
  const timer = useRef(null);

  const load = async (f) => {
    setLoading(true);
    const res = await GeneralDocumentService.getDocuments(toServerFilter(f));
    setLoading(false);
    if (res.error) {
      showToast(res.error, "error");
      setRows([]);
      return;
    }
    setRows(res.data || []);
    setPage(1);
    setSelected(new Set());
  };

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => load(filter), 350);
    return () => clearTimeout(timer.current);
  }, [filter]);

  const setF = (patch) => setFilter((p) => ({ ...p, ...patch }));

  const counts = useMemo(() => {
    const c = { ALL: rows.length };
    Object.keys(VALIDITY).forEach((k) => { c[k] = rows.filter((r) => r.validityStatus === k).length; });
    return c;
  }, [rows]);

  const filtered = useMemo(() => (validity ? rows.filter((r) => r.validityStatus === validity) : rows), [rows, validity]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const shown = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);
  const subtypes = (lookups?.subtypes || []).filter((s) => !filter.idGeneralDocumentType || String(s.idGeneralDocumentType) === String(filter.idGeneralDocumentType));

  const selectable = (r) => r.fileCount > 0;
  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const pageIds = shown.filter(selectable).map((r) => r.idGeneralDocument);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const togglePage = () => setSelected((prev) => {
    const next = new Set(prev);
    pageIds.forEach((id) => (allOnPage ? next.delete(id) : next.add(id)));
    return next;
  });

  const zip = async (ids) => {
    setZipping(true);
    await downloadZip(ids, []);
    setZipping(false);
  };

  const exportCsv = () => {
    const head = ["Code", "Title", "Type", "Subtype", "Scope", "Office", "Maintenance", "Frequency", "Version", "Period", "Reference No", "Valid From", "Valid To", "Status", "Files", "Last Upload", "Active"];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = filtered.map((r) => [
      r.documentCode, r.title, r.typeName, r.subtypeName, labelOf(SCOPES, r.scope), r.officeName, labelOf(MAINTENANCE_TYPES, r.maintenanceType),
      r.periodFrequency ? labelOf(FREQUENCIES, r.periodFrequency) : "", r.versionNumber, r.periodLabel, r.referenceNumber,
      formatDate(r.validFrom), formatDate(r.validTo), VALIDITY[r.validityStatus]?.text, r.fileCount, formatDate(r.lastUploadedDateTime), r.isActive ? "Yes" : "No",
    ].map(esc).join(","));
    const blob = new Blob([`\uFEFF${head.join(",")}\n${lines.join("\n")}`], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Document_Register_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  if (lookupError) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y pc-page">
        <div className="pc-head"><h4>Document Register</h4></div>
        <div className="pc-banner bg-label-danger">{lookupError}</div>
      </div>
    );
  }

  const tiles = [
    { key: "", label: "All documents", n: counts.ALL, color: "#8592a3" },
    { key: "VALID", label: "Valid", n: counts.VALID, color: "#71dd37" },
    { key: "NO_EXPIRY", label: "No expiry", n: counts.NO_EXPIRY, color: "#03c3ec" },
    { key: "EXPIRING", label: "Expiring", n: counts.EXPIRING, color: "#ffab00" },
    { key: "EXPIRED", label: "Expired", n: counts.EXPIRED, color: "#ff3e1d" },
    { key: "NO_RECORD", label: "Not uploaded", n: counts.NO_RECORD, color: "#a8b1bb" },
  ];

  return (
    <div className="container-xxl flex-grow-1 container-p-y pc-page">
      <div className="pc-head d-flex justify-content-between align-items-center mb-3">
        <h4>Document Register</h4>
        {lookups?.canRegister && (
          <button type="button" className="btn btn-sm btn-primary" onClick={() => setEditDoc({})}>
            <i className="bx bx-plus me-1"></i>Register Document
          </button>
        )}
      </div>

      <div className="pc-stats">
        {tiles.map((t) => (
          <div key={t.key || "all"} className="pc-stat clickable" style={{ borderLeftColor: t.color, outline: validity === t.key ? `2px solid ${t.color}` : "none" }}
            role="button" tabIndex={0} onClick={() => { setValidity(t.key); setPage(1); }}
            onKeyDown={(e) => { if (e.key === "Enter") { setValidity(t.key); setPage(1); } }}>
            <div className="n">{t.n ?? 0}</div>
            <div className="l">{t.label}</div>
          </div>
        ))}
      </div>

      <div className="card mb-3">
        <div className="card-body py-3">
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <label className="form-label mb-1">Search</label>
              <input className="form-control form-control-sm" placeholder="Title, code, reference no., tag" maxLength={100}
                value={filter.search} onChange={(e) => setF({ search: e.target.value })} />
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1">Type</label>
              <select className="form-select form-select-sm" value={filter.idGeneralDocumentType}
                onChange={(e) => setF({ idGeneralDocumentType: e.target.value, idGeneralDocumentSubtype: "" })}>
                <option value="">All</option>
                {(lookups?.types || []).map((t) => <option key={t.idGeneralDocumentType} value={t.idGeneralDocumentType}>{t.typeName}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1">Subtype</label>
              <select className="form-select form-select-sm" value={filter.idGeneralDocumentSubtype} onChange={(e) => setF({ idGeneralDocumentSubtype: e.target.value })}>
                <option value="">All</option>
                {subtypes.map((s) => <option key={s.idGeneralDocumentSubtype} value={s.idGeneralDocumentSubtype}>{s.subtypeName}</option>)}
              </select>
            </div>
            <div className="col-md-1">
              <label className="form-label mb-1">Scope</label>
              <select className="form-select form-select-sm" value={filter.scope} onChange={(e) => setF({ scope: e.target.value, idOffice: e.target.value === "ORGANIZATION" ? "" : filter.idOffice })}>
                <option value="">All</option>
                {SCOPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1">Office</label>
              <select className="form-select form-select-sm" value={filter.idOffice} disabled={filter.scope === "ORGANIZATION"} onChange={(e) => setF({ idOffice: e.target.value })}>
                <option value="">All</option>
                {(lookups?.offices || []).map((o) => <option key={o.idOffice} value={o.idOffice}>{o.officeName}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1">Maintenance</label>
              <select className="form-select form-select-sm" value={filter.maintenanceType} onChange={(e) => setF({ maintenanceType: e.target.value })}>
                <option value="">All</option>
                {MAINTENANCE_TYPES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="col-md-12 d-flex justify-content-between align-items-center pt-1">
              <label className="form-check mb-0">
                <input type="checkbox" className="form-check-input" checked={filter.includeInactive} onChange={(e) => setF({ includeInactive: e.target.checked })} />
                <span className="form-check-label">Include inactive documents</span>
              </label>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-sm btn-outline-secondary" disabled={filtered.length === 0} onClick={exportCsv}>
                  <i className="bx bx-export me-1"></i>Export
                </button>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { setFilter(emptyFilter); setValidity(""); }}>Reset</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header py-2 d-flex justify-content-between align-items-center">
          <span className="pc-sub">{loading ? "Loading..." : `${filtered.length} document${filtered.length === 1 ? "" : "s"}`}</span>
          {pages > 1 && (
            <div className="d-flex align-items-center gap-2">
              <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button>
              <span className="pc-sub">Page {page} of {pages}</span>
              <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page === pages} onClick={() => setPage(page + 1)}>›</button>
            </div>
          )}
        </div>
        <div className="table-responsive">
          <table className="table pc-table dm-table mb-0">
            <thead>
              <tr>
                <th style={{ width: 32 }}>
                  <input type="checkbox" className="form-check-input" checked={allOnPage} disabled={pageIds.length === 0} onChange={togglePage} title="Select this page" />
                </th>
                <th>Document</th><th>Type</th><th>Scope</th><th>Maintenance</th><th>Current</th><th>Validity</th><th>Files</th><th></th>
              </tr>
            </thead>
            <tbody>
              {!loading && shown.length === 0 && (
                <tr><td colSpan={9} className="text-center pc-sub py-4">No documents match the filters.</td></tr>
              )}
              {shown.map((r) => {
                const manage = canManageDoc(lookups, r);
                return (
                  <tr key={r.idGeneralDocument} className={`${r.isActive ? "" : "inactive"} ${selected.has(r.idGeneralDocument) ? "selected" : ""}`}>
                    <td>
                      <input type="checkbox" className="form-check-input" disabled={!selectable(r)} checked={selected.has(r.idGeneralDocument)}
                        onChange={() => toggle(r.idGeneralDocument)} title={selectable(r) ? "" : "No file uploaded"} />
                    </td>
                    <td style={{ maxWidth: 280 }}>
                      <div className="dm-title text-break">
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate(`/dashboard/document-history/${r.idGeneralDocument}`); }}>{r.title}</a>
                      </div>
                      <div className="pc-sub">{r.documentCode}{r.isActive ? "" : " · Inactive"}{r.tags ? ` · ${r.tags}` : ""}</div>
                    </td>
                    <td>
                      <div>{r.typeName}</div>
                      <div className="pc-sub">{r.subtypeName || ""}</div>
                    </td>
                    <td>{r.scope === "OFFICE" ? r.officeName : "Organisation"}</td>
                    <td>
                      <div>{labelOf(MAINTENANCE_TYPES, r.maintenanceType)}</div>
                      {r.periodFrequency && <div className="pc-sub">{labelOf(FREQUENCIES, r.periodFrequency)}</div>}
                    </td>
                    <td>
                      {r.idCurrentRecord ? (
                        <>
                          <div>{r.periodLabel || `Version ${r.versionNumber}`}</div>
                          <div className="pc-sub">{r.referenceNumber ? `${r.referenceNumber} · ` : ""}{formatDate(r.lastUploadedDateTime)}</div>
                        </>
                      ) : <span className="pc-sub">—</span>}
                    </td>
                    <td>
                      {r.validTo && <div>{formatDate(r.validTo)}</div>}
                      <ValidityBadge status={r.validityStatus} days={r.daysToExpiry} />
                    </td>
                    <td>{r.fileCount || "—"}</td>
                    <td className="text-end text-nowrap">
                      {lookups?.canUpload && manage && r.isActive && (
                        <button type="button" className="btn btn-sm btn-outline-primary me-1" onClick={() => setUploadDoc(r)} title="Upload">
                          <i className="bx bx-upload"></i>
                        </button>
                      )}
                      <button type="button" className="btn btn-sm btn-outline-secondary me-1" title="History and files"
                        onClick={() => navigate(`/dashboard/document-history/${r.idGeneralDocument}`)}>
                        <i className="bx bx-history"></i>
                      </button>
                      {r.fileCount > 0 && (
                        <button type="button" className="btn btn-sm btn-outline-secondary me-1" title="Download current files" disabled={zipping} onClick={() => zip([r.idGeneralDocument])}>
                          <i className="bx bx-download"></i>
                        </button>
                      )}
                      {lookups?.canEdit && manage && (
                        <button type="button" className="btn btn-sm btn-outline-secondary" title="Edit details" onClick={() => setEditDoc(r)}>
                          <i className="bx bx-edit"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {selected.size > 0 && (
          <div className="dm-actionbar">
            <span>{selected.size} document{selected.size === 1 ? "" : "s"} selected</span>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setSelected(new Set())}>Clear</button>
              <button type="button" className="btn btn-sm btn-primary" disabled={zipping} onClick={() => zip([...selected])}>
                <i className="bx bx-archive me-1"></i>{zipping ? "Preparing..." : "Download ZIP"}
              </button>
            </div>
          </div>
        )}
      </div>

      {editDoc && lookups && (
        <DocumentFormModal lookups={lookups} document={editDoc.idGeneralDocument ? editDoc : null} onClose={() => setEditDoc(null)}
          onSaved={(id) => {
            const isNew = !editDoc.idGeneralDocument;
            setEditDoc(null);
            if (isNew && lookups.canUpload) navigate(`/dashboard/document-history/${id}?upload=1`);
            else load(filter);
          }} />
      )}
      {uploadDoc && lookups && (
        <UploadModal lookups={lookups} document={uploadDoc} lastPeriod={uploadDoc.periodTo ? { periodTo: uploadDoc.periodTo } : null}
          onClose={() => setUploadDoc(null)} onSaved={() => { setUploadDoc(null); load(filter); }} />
      )}
    </div>
  );
};

export default DocumentRegister;
