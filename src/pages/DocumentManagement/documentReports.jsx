import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import moment from "moment";
import GeneralDocumentService, { saveBlob } from "../../core/services/GeneralDocumentService";
import { showToast } from "../../components/ToastNotifications/toastUtils";
import { SCOPES, dateProps, toApiDate, formatDate, useDocumentLookups } from "./shared";

const PAGE_SIZE = 50;

const REPORTS = [
  { code: "EXPIRY", name: "Expiry / Renewal", icon: "bx-time-five", hint: "Current documents expired or expiring up to a date, with days left." },
  { code: "MISSING", name: "Missing / Pending", icon: "bx-error-circle", hint: "Documents never uploaded, and periods not uploaded for periodic documents." },
  { code: "COMPLIANCE", name: "Office Compliance", icon: "bx-check-shield", hint: "Valid, expiring, expired and missing counts with compliance % per office or type." },
  { code: "ACTIVITY", name: "Upload & Activity Log", icon: "bx-list-ul", hint: "Who registered, uploaded, corrected, marked or downloaded documents in a period." },
];

const ACTIONS = [
  ["CREATE", "Registered"], ["UPDATE", "Details changed"], ["UPLOAD", "Uploaded"], ["RECORD_UPDATE", "Record corrected"],
  ["MARK_INCORRECT", "Marked incorrect"], ["MARK_SUPERSEDED", "Marked superseded"], ["ACTIVATE", "Activated"], ["DEACTIVATE", "Deactivated"],
  ["VIEW", "Viewed"], ["DOWNLOAD", "Downloaded"], ["ZIP_DOWNLOAD", "Downloaded (ZIP)"],
];

const defaults = (code) => {
  const today = moment().startOf("day");
  switch (code) {
    case "EXPIRY": return { fromDate: null, toDate: today.clone().add(90, "days").toDate() };
    case "ACTIVITY": return { fromDate: today.clone().subtract(30, "days").toDate(), toDate: today.toDate() };
    default: return { fromDate: null, toDate: today.toDate() };
  }
};

const STATUS_CLS = {
  Expired: "bg-label-danger", Expiring: "bg-label-warning", "Due later": "bg-label-info",
  "Not uploaded": "bg-label-secondary", "No period uploaded": "bg-label-secondary",
};

const formatCell = (col, value, row, reportCode) => {
  if (value == null || value === "") return <span className="pc-sub">—</span>;
  switch (col.type) {
    case "date": return formatDate(value);
    case "datetime": return formatDate(value, true);
    case "percent": {
      const cls = value >= 90 ? "text-success" : value >= 70 ? "text-warning" : "text-danger";
      return <span className={`fw-semibold ${cls}`}>{Number(value).toFixed(1)}%</span>;
    }
    case "number":
      if (col.key === "days" && value < 0) return <span className="text-danger">{value}</span>;
      return value;
    default:
      if ((col.key === "status" || (reportCode === "MISSING" && col.key === "missing")) && STATUS_CLS[value]) {
        return <span className={`badge ${STATUS_CLS[value]}`}>{value}</span>;
      }
      return value;
  }
};

const DocumentReports = () => {
  const navigate = useNavigate();
  const { lookups, error: lookupError } = useDocumentLookups();
  const [code, setCode] = useState("EXPIRY");
  const [filter, setFilter] = useState({
    ...defaults("EXPIRY"), idGeneralDocumentType: "", idGeneralDocumentSubtype: "", scope: "", idOffice: "",
    withinDays: "", groupBy: "OFFICE", action: "", includeViews: false,
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(null);   // {key, dir}

  const setF = (patch) => setFilter((p) => ({ ...p, ...patch }));

  const payload = () => ({
    reportCode: code,
    fromDate: toApiDate(filter.fromDate),
    toDate: toApiDate(filter.toDate),
    idGeneralDocumentType: filter.idGeneralDocumentType ? Number(filter.idGeneralDocumentType) : null,
    idGeneralDocumentSubtype: filter.idGeneralDocumentSubtype ? Number(filter.idGeneralDocumentSubtype) : null,
    scope: filter.scope || null,
    idOffice: filter.idOffice ? Number(filter.idOffice) : null,
    withinDays: filter.withinDays === "" ? null : Number(filter.withinDays),
    groupBy: filter.groupBy,
    action: filter.action || null,
    includeViews: !!filter.includeViews,
  });

  const run = async () => {
    if (filter.fromDate && filter.toDate && filter.toDate < filter.fromDate) return showToast("To date cannot be before From date.", "error");
    setLoading(true);
    const res = await GeneralDocumentService.getReport(payload());
    setLoading(false);
    if (res.error) {
      showToast(res.error, "error");
      return null;
    }
    setReport(res.data);
    setPage(1);
    setSort(null);
    return null;
  };

  const exportExcel = async () => {
    setExporting(true);
    const res = await GeneralDocumentService.exportReport(payload());
    setExporting(false);
    if (res.error) return showToast(res.error, "error");
    return saveBlob(res.blob, res.name?.endsWith(".xlsx") ? res.name : `${REPORTS.find((r) => r.code === code)?.name || "Report"}.xlsx`);
  };

  // switching report resets its dates and runs it
  const pick = (c) => {
    if (c === code) return;
    setCode(c);
    setReport(null);
    setSort(null);
    setF(defaults(c));
  };
  useEffect(() => {
    if (lookups) run();
  }, [code, lookups]);

  const rows = useMemo(() => {
    const list = report?.rows || [];
    if (!sort || !report) return list;
    const total = report.reportCode === "COMPLIANCE" ? list.filter((r) => r.group === "Total") : [];
    const body = list.filter((r) => !total.includes(r));
    const sorted = [...body].sort((a, b) => {
      const x = a[sort.key];
      const y = b[sort.key];
      if (x == null && y == null) return 0;
      if (x == null) return 1;
      if (y == null) return -1;
      const cmp = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return [...sorted, ...total];
  }, [report, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const shown = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const subtypes = (lookups?.subtypes || []).filter((s) => !filter.idGeneralDocumentType || String(s.idGeneralDocumentType) === String(filter.idGeneralDocumentType));
  const meta = REPORTS.find((r) => r.code === code);

  const dateLabels = {
    EXPIRY: ["Valid To from", "Valid To up to"],
    MISSING: ["Periods ending from", "As on"],
    COMPLIANCE: [null, "As on"],
    ACTIVITY: ["From", "To"],
  }[code];

  if (lookupError) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y pc-page">
        <div className="pc-head"><h4>Document Reports</h4></div>
        <div className="pc-banner bg-label-danger">{lookupError}</div>
      </div>
    );
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y pc-page">
      <div className="pc-head mb-3"><h4>Document Reports</h4></div>

      <div className="dm-reports mb-3">
        {REPORTS.map((r) => (
          <button key={r.code} type="button" className={`dm-report ${code === r.code ? "active" : ""}`} title={r.hint} onClick={() => pick(r.code)}>
            <i className={`bx ${r.icon}`}></i>
            <span className="fw-semibold">{r.name}</span>
          </button>
        ))}
      </div>

      <div className="card mb-3">
        <div className="card-body py-3">
          <div className="row g-2 align-items-end">
            {dateLabels[0] && (
              <div className="col-md-2">
                <label className="form-label mb-1">{dateLabels[0]}</label>
                <DatePicker {...dateProps} selected={filter.fromDate} onChange={(d) => setF({ fromDate: d })} />
              </div>
            )}
            <div className="col-md-2">
              <label className="form-label mb-1">{dateLabels[1]}</label>
              <DatePicker {...dateProps} isClearable={false} selected={filter.toDate} onChange={(d) => setF({ toDate: d })} />
            </div>
            {code === "COMPLIANCE" && (
              <>
                <div className="col-md-2">
                  <label className="form-label mb-1">Expiring within</label>
                  <select className="form-select form-select-sm" value={filter.withinDays} onChange={(e) => setF({ withinDays: e.target.value })}>
                    <option value="">{"Each document's alert days"}</option>
                    <option value="30">30 days</option>
                    <option value="60">60 days</option>
                    <option value="90">90 days</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label mb-1">Group by</label>
                  <select className="form-select form-select-sm" value={filter.groupBy} onChange={(e) => setF({ groupBy: e.target.value })}>
                    <option value="OFFICE">Office</option>
                    <option value="TYPE">Document type</option>
                  </select>
                </div>
              </>
            )}
            {code === "ACTIVITY" && (
              <div className="col-md-2">
                <label className="form-label mb-1">Action</label>
                <select className="form-select form-select-sm" value={filter.action} onChange={(e) => setF({ action: e.target.value })}>
                  <option value="">All changes</option>
                  {ACTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            )}
            <div className="col-md-2">
              <label className="form-label mb-1">Type</label>
              <select className="form-select form-select-sm" value={filter.idGeneralDocumentType}
                onChange={(e) => setF({ idGeneralDocumentType: e.target.value, idGeneralDocumentSubtype: "" })}>
                <option value="">All</option>
                {(lookups?.types || []).map((t) => <option key={t.idGeneralDocumentType} value={t.idGeneralDocumentType}>{t.typeName}</option>)}
              </select>
            </div>
            {code !== "COMPLIANCE" && (
              <div className="col-md-2">
                <label className="form-label mb-1">Subtype</label>
                <select className="form-select form-select-sm" value={filter.idGeneralDocumentSubtype} onChange={(e) => setF({ idGeneralDocumentSubtype: e.target.value })}>
                  <option value="">All</option>
                  {subtypes.map((s) => <option key={s.idGeneralDocumentSubtype} value={s.idGeneralDocumentSubtype}>{s.subtypeName}</option>)}
                </select>
              </div>
            )}
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
            <div className="col-12 d-flex justify-content-between align-items-center pt-1 flex-wrap gap-2">
              <div>
                {code === "ACTIVITY" && !filter.action && (
                  <label className="form-check mb-0">
                    <input type="checkbox" className="form-check-input" checked={filter.includeViews} onChange={(e) => setF({ includeViews: e.target.checked })} />
                    <span className="form-check-label">Include views and downloads</span>
                  </label>
                )}
              </div>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-sm btn-primary" disabled={loading} onClick={run}>
                  <i className="bx bx-play me-1"></i>{loading ? "Running..." : "Run Report"}
                </button>
                <button type="button" className="btn btn-sm btn-outline-success" disabled={exporting || !report || report.rows.length === 0} onClick={exportExcel}>
                  <i className="bx bx-spreadsheet me-1"></i>{exporting ? "Exporting..." : "Export to Excel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {report && (
        <div className="card">
          <div className="card-header py-2">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
              <div>
                <div className="fw-semibold">{report.title}</div>
                <div className="pc-sub">{report.criteria}</div>
              </div>
              {pages > 1 && (
                <div className="d-flex align-items-center gap-2">
                  <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button>
                  <span className="pc-sub">Page {page} of {pages}</span>
                  <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page === pages} onClick={() => setPage(page + 1)}>›</button>
                </div>
              )}
            </div>
            {report.summary?.length > 0 && (
              <div className="dm-summary mt-2">
                {report.summary.map((s) => (
                  <span key={s.key}><span className="pc-sub">{s.key}:</span> <b>{s.value}</b></span>
                ))}
                <span className="pc-sub">{rows.length} row{rows.length === 1 ? "" : "s"}</span>
              </div>
            )}
            {report.truncated && <div className="pc-banner bg-label-warning mt-2 mb-0">Only the first 10,000 rows are shown. Narrow the filters to see the rest.</div>}
          </div>
          <div className="table-responsive">
            <table className="table pc-table dm-table mb-0">
              <thead>
                <tr>
                  {report.columns.map((c) => (
                    <th key={c.key} role="button" className={["number", "percent"].includes(c.type) ? "text-end" : ""}
                      onClick={() => setSort((s) => ({ key: c.key, dir: s?.key === c.key && s.dir === "asc" ? "desc" : "asc" }))}>
                      {c.label}{sort?.key === c.key ? (sort.dir === "asc" ? " ▲" : " ▼") : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 && (
                  <tr><td colSpan={report.columns.length} className="text-center pc-sub py-4">{loading ? "Loading..." : "No rows for these filters."}</td></tr>
                )}
                {shown.map((r, i) => (
                  <tr key={i} className={report.reportCode === "COMPLIANCE" && r.group === "Total" ? "fw-semibold dm-total" : ""}>
                    {report.columns.map((c) => (
                      <td key={c.key} className={`${["number", "percent"].includes(c.type) ? "text-end" : ""} ${c.key === "details" ? "text-break" : ""}`}
                        style={c.key === "details" ? { maxWidth: 360, fontSize: "0.74rem" } : c.key === "title" ? { maxWidth: 260 } : undefined}>
                        {c.key === "title" && r.id ? (
                          <span className="dm-title">
                            <a href="#" onClick={(e) => { e.preventDefault(); navigate(`/dashboard/document-history/${r.id}`); }}>{r.title}</a>
                          </span>
                        ) : formatCell(c, r[c.key], r, report.reportCode)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!report && loading && <div className="pc-sub">Loading {meta?.name}...</div>}
    </div>
  );
};

export default DocumentReports;
