import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GeneralDocumentService from "../../core/services/GeneralDocumentService";
import { showToast } from "../../components/ToastNotifications/toastUtils";
import { UploadModal, ValidityBadge, MAINTENANCE_TYPES, VALIDITY, labelOf, formatDate, useDocumentLookups } from "./shared";
import { canManageDoc } from "./documentRegister";

const ORDER = { EXPIRED: 0, EXPIRING: 1, NO_RECORD: 2, VALID: 3, NO_EXPIRY: 4 };
const ATTENTION = ["EXPIRED", "EXPIRING", "NO_RECORD"];
const OK = ["VALID", "NO_EXPIRY"];

const ExpiryMonitoring = () => {
  const navigate = useNavigate();
  const { lookups, error: lookupError } = useDocumentLookups();
  const [filter, setFilter] = useState({ withinDays: "", idGeneralDocumentType: "", idOffice: "", scope: "" });
  const [show, setShow] = useState("ATTENTION");
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadDoc, setUploadDoc] = useState(null);

  const load = async () => {
    const f = {
      withinDays: filter.withinDays === "" ? null : Number(filter.withinDays),
      idGeneralDocumentType: filter.idGeneralDocumentType ? Number(filter.idGeneralDocumentType) : null,
      idOffice: filter.idOffice ? Number(filter.idOffice) : null,
      scope: filter.scope || null,
    };
    setLoading(true);
    const [list, sum] = await Promise.all([
      GeneralDocumentService.getDocuments(f),
      GeneralDocumentService.getSummary(f),
    ]);
    setLoading(false);
    if (list.error) { showToast(list.error, "error"); setRows([]); } else setRows(list.data || []);
    if (!sum.error) setSummary(sum.data);
  };

  useEffect(() => { load(); }, [filter]);

  const setF = (patch) => setFilter((p) => ({ ...p, ...patch }));

  const shown = useMemo(() => rows
    .filter((r) => (show === "ATTENTION" ? ATTENTION.includes(r.validityStatus) : show === "OK" ? OK.includes(r.validityStatus) : r.validityStatus === show))
    .sort((a, b) => (ORDER[a.validityStatus] - ORDER[b.validityStatus]) || ((a.daysToExpiry ?? 0) - (b.daysToExpiry ?? 0)) || a.title.localeCompare(b.title)),
  [rows, show]);

  const exportCsv = () => {
    const head = ["Code", "Title", "Type", "Subtype", "Office", "Maintenance", "Current", "Reference No", "Valid To", "Status", "Days"];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = shown.map((r) => [
      r.documentCode, r.title, r.typeName, r.subtypeName, r.scope === "OFFICE" ? r.officeName : "Organisation", labelOf(MAINTENANCE_TYPES, r.maintenanceType),
      r.idCurrentRecord ? r.periodLabel || `Version ${r.versionNumber}` : "", r.referenceNumber, formatDate(r.validTo), VALIDITY[r.validityStatus]?.text, r.daysToExpiry,
    ].map(esc).join(","));
    const blob = new Blob([`\uFEFF${head.join(",")}\n${lines.join("\n")}`], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Document_Expiry_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  if (lookupError) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y pc-page">
        <div className="pc-head"><h4>Expiry Monitoring</h4></div>
        <div className="pc-banner bg-label-danger">{lookupError}</div>
      </div>
    );
  }

  const tiles = [
    { key: "EXPIRED", label: "Expired", n: summary?.expired, color: "#ff3e1d" },
    { key: "EXPIRING", label: filter.withinDays === "" ? "Expiring (alert period)" : `Expiring in ${filter.withinDays} days`, n: summary?.expiring, color: "#ffab00" },
    { key: "NO_RECORD", label: "Not uploaded", n: summary?.noRecord, color: "#a8b1bb" },
    { key: "ATTENTION", label: "Needs attention", n: summary ? summary.expired + summary.expiring + summary.noRecord : undefined, color: "#696cff" },
    { key: "OK", label: "Valid / no expiry", n: summary ? summary.valid + summary.noExpiry : undefined, color: "#71dd37" },
  ];

  return (
    <div className="container-xxl flex-grow-1 container-p-y pc-page">
      <div className="pc-head d-flex justify-content-between align-items-center mb-3">
        <h4>Expiry Monitoring</h4>
        <button type="button" className="btn btn-sm btn-outline-secondary" disabled={shown.length === 0} onClick={exportCsv}>
          <i className="bx bx-export me-1"></i>Export
        </button>
      </div>

      <div className="pc-stats">
        {tiles.map((t) => (
          <div key={t.label} className={`pc-stat ${t.key ? "clickable" : ""}`} style={{ borderLeftColor: t.color, outline: show === t.key ? `2px solid ${t.color}` : "none" }}
            role={t.key ? "button" : undefined} tabIndex={t.key ? 0 : undefined}
            onClick={() => t.key && setShow(t.key)} onKeyDown={(e) => { if (t.key && e.key === "Enter") setShow(t.key); }}>
            <div className="n">{t.n ?? "—"}</div>
            <div className="l">{t.label}</div>
          </div>
        ))}
      </div>

      <div className="card mb-3">
        <div className="card-body py-3">
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <label className="form-label mb-1">Expiring within</label>
              <select className="form-select form-select-sm" value={filter.withinDays} onChange={(e) => setF({ withinDays: e.target.value })}>
                <option value="">{"Each document's alert days"}</option>
                <option value="15">15 days</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
                <option value="180">180 days</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label mb-1">Type</label>
              <select className="form-select form-select-sm" value={filter.idGeneralDocumentType} onChange={(e) => setF({ idGeneralDocumentType: e.target.value })}>
                <option value="">All</option>
                {(lookups?.types || []).map((t) => <option key={t.idGeneralDocumentType} value={t.idGeneralDocumentType}>{t.typeName}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1">Scope</label>
              <select className="form-select form-select-sm" value={filter.scope} onChange={(e) => setF({ scope: e.target.value, idOffice: e.target.value === "ORGANIZATION" ? "" : filter.idOffice })}>
                <option value="">All</option>
                <option value="ORGANIZATION">Organisation</option>
                <option value="OFFICE">Office</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label mb-1">Office</label>
              <select className="form-select form-select-sm" value={filter.idOffice} disabled={filter.scope === "ORGANIZATION"} onChange={(e) => setF({ idOffice: e.target.value })}>
                <option value="">All</option>
                {(lookups?.offices || []).map((o) => <option key={o.idOffice} value={o.idOffice}>{o.officeName}</option>)}
              </select>
            </div>
            <div className="col-md-1">
              <button type="button" className="btn btn-sm btn-outline-secondary w-100" onClick={() => { setFilter({ withinDays: "", idGeneralDocumentType: "", idOffice: "", scope: "" }); setShow("ATTENTION"); }}>Reset</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header py-2"><span className="pc-sub">{loading ? "Loading..." : `${shown.length} document${shown.length === 1 ? "" : "s"}`}</span></div>
        <div className="table-responsive">
          <table className="table pc-table dm-table mb-0">
            <thead><tr><th>Document</th><th>Office</th><th>Current</th><th>Valid To</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {!loading && shown.length === 0 && <tr><td colSpan={6} className="text-center pc-sub py-4">{show === "ATTENTION" ? "Nothing needs attention." : "No documents."}</td></tr>}
              {shown.map((r) => (
                <tr key={r.idGeneralDocument}>
                  <td style={{ maxWidth: 320 }}>
                    <div className="dm-title text-break">
                      <a href="#" onClick={(e) => { e.preventDefault(); navigate(`/dashboard/document-history/${r.idGeneralDocument}`); }}>{r.title}</a>
                    </div>
                    <div className="pc-sub">{r.documentCode} · {r.typeName}{r.subtypeName ? ` / ${r.subtypeName}` : ""}</div>
                  </td>
                  <td>{r.scope === "OFFICE" ? r.officeName : "Organisation"}</td>
                  <td>{r.idCurrentRecord ? <>{r.periodLabel || `Version ${r.versionNumber}`}{r.referenceNumber && <div className="pc-sub">{r.referenceNumber}</div>}</> : <span className="pc-sub">—</span>}</td>
                  <td>{formatDate(r.validTo)}</td>
                  <td><ValidityBadge status={r.validityStatus} days={r.daysToExpiry} /></td>
                  <td className="text-end text-nowrap">
                    {lookups?.canUpload && canManageDoc(lookups, r) && (
                      <button type="button" className="btn btn-sm btn-primary me-1" onClick={() => setUploadDoc(r)}>
                        <i className="bx bx-upload me-1"></i>{r.idCurrentRecord ? "Renew" : "Upload"}
                      </button>
                    )}
                    <button type="button" className="btn btn-sm btn-outline-secondary" title="History" onClick={() => navigate(`/dashboard/document-history/${r.idGeneralDocument}`)}>
                      <i className="bx bx-history"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {uploadDoc && lookups && (
        <UploadModal lookups={lookups} document={uploadDoc} lastPeriod={uploadDoc.periodTo ? { periodTo: uploadDoc.periodTo } : null}
          onClose={() => setUploadDoc(null)} onSaved={() => { setUploadDoc(null); load(); }} />
      )}
    </div>
  );
};

export default ExpiryMonitoring;
