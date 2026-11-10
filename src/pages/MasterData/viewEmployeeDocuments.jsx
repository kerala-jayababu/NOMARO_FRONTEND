import { useEffect, useMemo, useRef, useState } from "react";
import { API } from "../../redux/api/utils";
import EmployeeManagementService from "../../core/services/EmployeeManagementService";
import { showToast } from "../../components/ToastNotifications/toastUtils";
import { DocumentPreview, formatDate } from "../EmployeeSelfPortal/ProfileChange/shared";
import "../EmployeeSelfPortal/ProfileChange/profileChange.css";

const PAGE_SIZE = 25;
const BASE = "/api/v1/EmployeeDocumentViewer";

const validityOf = (validTill) => {
  if (!validTill) return null;
  const days = Math.floor((new Date(validTill).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);
  if (days < 0) return { cls: "bg-label-danger", text: "Expired" };
  if (days <= 30) return { cls: "bg-label-warning", text: `Expires in ${days} day${days === 1 ? "" : "s"}` };
  return null;
};

const ViewEmployeeDocuments = () => {
  const [docTypes, setDocTypes] = useState([]);
  const [filter, setFilter] = useState({ idDocumentType: "", search: "", employeeStatus: "Working", validity: "" });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const searchTimer = useRef(null);

  useEffect(() => {
    EmployeeManagementService.getDocumentTypes().then((res) => {
      if (!res.error) setDocTypes(res.data?.data || []);
    });
  }, []);

  const load = async (f) => {
    setLoading(true);
    try {
      const params = {};
      if (f.idDocumentType) params.idDocumentType = f.idDocumentType;
      if (f.search.trim()) params.search = f.search.trim();
      if (f.employeeStatus) params.employeeStatus = f.employeeStatus;
      if (f.validity) params.validity = f.validity;
      const res = await API.get(`${BASE}/GetDocuments`, { params });
      setRows(res.data?.data || []);
      setPage(1);
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to load documents", "error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  // reload when a filter changes; typing in search waits 400 ms
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(filter), 400);
    return () => clearTimeout(searchTimer.current);
  }, [filter]);

  const setF = (patch) => setFilter((p) => ({ ...p, ...patch }));

  const fetchFile = async (row) => {
    setBusyId(row.idEmployeeDocument);
    try {
      const res = await API.get(`${BASE}/DownloadDocument?id=${row.idEmployeeDocument}`, { responseType: "blob" });
      return { blob: res.data, contentType: res.headers["content-type"] || "", name: row.fileName || "document" };
    } catch (error) {
      let message = "The file could not be opened.";
      try { message = JSON.parse(await error.response.data.text()).message || message; } catch { /* keep default */ }
      showToast(message, "error");
      return null;
    } finally {
      setBusyId(null);
    }
  };

  const view = async (row) => {
    const file = await fetchFile(row);
    if (!file) return;
    if (file.contentType.startsWith("image/") || file.contentType === "application/pdf") setPreview(file);
    else download(file);
  };

  const download = (file) => {
    const url = URL.createObjectURL(file.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadRow = async (row) => {
    const file = await fetchFile(row);
    if (file) download(file);
  };

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const shown = useMemo(() => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [rows, page]);
  const employeeCount = useMemo(() => new Set(rows.map((r) => r.idEmployee)).size, [rows]);

  return (
    <div className="container-xxl flex-grow-1 container-p-y pc-page">
      <div className="pc-head"><h4>View Documents</h4></div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-md-4">
              <label className="form-label mb-1">Employee</label>
              <input className="form-control form-control-sm" placeholder="Search by name or employee code" maxLength={50}
                value={filter.search} onChange={(e) => setF({ search: e.target.value })} />
            </div>
            <div className="col-md-3">
              <label className="form-label mb-1">Document Type</label>
              <select className="form-select form-select-sm" value={filter.idDocumentType} onChange={(e) => setF({ idDocumentType: e.target.value })}>
                <option value="">All</option>
                {docTypes.map((t) => <option key={t.idDocumentType} value={t.idDocumentType}>{t.documentTypeName}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1">Validity</label>
              <select className="form-select form-select-sm" value={filter.validity} onChange={(e) => setF({ validity: e.target.value })}>
                <option value="">All</option>
                <option value="VALID">Valid / no expiry</option>
                <option value="EXPIRING">Expiring in 30 days</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label mb-1">Employee Status</label>
              <select className="form-select form-select-sm" value={filter.employeeStatus} onChange={(e) => setF({ employeeStatus: e.target.value })}>
                <option value="">All</option>
                <option value="Working">Working</option>
                <option value="NotWorking">Not Working</option>
              </select>
            </div>
            <div className="col-md-1">
              <button type="button" className="btn btn-sm btn-outline-secondary w-100"
                onClick={() => setFilter({ idDocumentType: "", search: "", employeeStatus: "Working", validity: "" })}>Reset</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header py-2 d-flex justify-content-between align-items-center">
          <span className="pc-sub">{loading ? "Loading..." : `${rows.length} document${rows.length === 1 ? "" : "s"} · ${employeeCount} employee${employeeCount === 1 ? "" : "s"}`}</span>
          {pages > 1 && (
            <div className="d-flex align-items-center gap-2">
              <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button>
              <span className="pc-sub">Page {page} of {pages}</span>
              <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page === pages} onClick={() => setPage(page + 1)}>›</button>
            </div>
          )}
        </div>
        <div className="table-responsive">
          <table className="table pc-table mb-0">
            <thead>
              <tr><th>Employee</th><th>Document Type</th><th>File</th><th>Remarks</th><th>Valid Till</th><th>Uploaded</th><th></th></tr>
            </thead>
            <tbody>
              {!loading && shown.length === 0 && (
                <tr><td colSpan={7} className="text-center pc-sub py-4">No documents match the filters.</td></tr>
              )}
              {shown.map((r) => {
                const v = validityOf(r.documentValidTill);
                return (
                  <tr key={r.idEmployeeDocument}>
                    <td>
                      <div className="fw-semibold">{r.employeeCode} · {r.employeeName}</div>
                      <div className="pc-sub">
                        {[r.departmentName, r.designationName].filter(Boolean).join(" · ")}
                        {r.currentStatus && r.currentStatus !== "Working" ? " · Not working" : ""}
                      </div>
                    </td>
                    <td>{r.documentTypeName || "—"}</td>
                    <td className="text-break" style={{ maxWidth: 240 }}>{r.fileName || <span className="pc-sub">No file</span>}</td>
                    <td className="text-break" style={{ maxWidth: 200 }}>{r.remarks || "—"}</td>
                    <td>
                      {formatDate(r.documentValidTill)}
                      {v && <div><span className={`badge ${v.cls}`}>{v.text}</span></div>}
                    </td>
                    <td>{formatDate(r.updatedAt || r.createdAt)}</td>
                    <td className="text-end text-nowrap">
                      {r.hasFile && (
                        <>
                          <button type="button" className="btn btn-sm btn-outline-primary me-1" disabled={busyId === r.idEmployeeDocument} onClick={() => view(r)}>
                            <i className="bx bx-show me-1"></i>View
                          </button>
                          <button type="button" className="btn btn-sm btn-outline-secondary" disabled={busyId === r.idEmployeeDocument} onClick={() => downloadRow(r)} title="Download">
                            <i className="bx bx-download"></i>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <DocumentPreview file={preview} onClose={() => setPreview(null)} />
    </div>
  );
};

export default ViewEmployeeDocuments;
