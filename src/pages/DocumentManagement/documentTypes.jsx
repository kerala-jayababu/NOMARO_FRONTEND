import { useEffect, useMemo, useState } from "react";
import GeneralDocumentService from "../../core/services/GeneralDocumentService";
import { showToast } from "../../components/ToastNotifications/toastUtils";
import { ModalShell } from "../EmployeeSelfPortal/ProfileChange/shared";
import "../EmployeeSelfPortal/ProfileChange/profileChange.css";
import "./documentManagement.css";

const empty = { idGeneralDocumentType: 0, typeCode: "", typeName: "", description: "", displayOrder: 0, isActive: true };

const DocumentTypes = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [edit, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await GeneralDocumentService.getTypes();
    setLoading(false);
    if (res.error) { showToast(res.error, "error"); return; }
    setRows(res.data || []);
  };
  useEffect(() => { load(); }, []);

  const shown = useMemo(() => {
    const s = search.trim().toLowerCase();
    return s ? rows.filter((r) => `${r.typeCode} ${r.typeName} ${r.description || ""}`.toLowerCase().includes(s)) : rows;
  }, [rows, search]);

  const set = (patch) => setEdit((p) => ({ ...p, ...patch }));

  const save = async () => {
    if (!edit.typeCode.trim()) return showToast("Enter the type code.", "error");
    if (!edit.typeName.trim()) return showToast("Enter the type name.", "error");
    setSaving(true);
    const res = await GeneralDocumentService.saveType({
      ...edit,
      typeCode: edit.typeCode.trim().toUpperCase(),
      typeName: edit.typeName.trim(),
      description: edit.description?.trim() || null,
      displayOrder: Number(edit.displayOrder) || 0,
    });
    setSaving(false);
    if (res.error) return showToast(res.error, "error");
    showToast(res.message, "success");
    setEdit(null);
    return load();
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y pc-page">
      <div className="pc-head d-flex justify-content-between align-items-center mb-3">
        <h4>Document Types</h4>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => setEdit({ ...empty, displayOrder: rows.length + 1 })}>
          <i className="bx bx-plus me-1"></i>Add Type
        </button>
      </div>

      <div className="card">
        <div className="card-header py-2 d-flex justify-content-between align-items-center gap-2">
          <input className="form-control form-control-sm" style={{ maxWidth: 300 }} placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          <span className="pc-sub">{loading ? "Loading..." : `${shown.length} type${shown.length === 1 ? "" : "s"}`}</span>
        </div>
        <div className="table-responsive">
          <table className="table pc-table dm-table mb-0">
            <thead><tr><th>Order</th><th>Code</th><th>Type</th><th>Description</th><th>Subtypes</th><th>Documents</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {!loading && shown.length === 0 && <tr><td colSpan={8} className="text-center pc-sub py-4">No document types.</td></tr>}
              {shown.map((r) => (
                <tr key={r.idGeneralDocumentType} className={r.isActive ? "" : "inactive"}>
                  <td>{r.displayOrder}</td>
                  <td>{r.typeCode}</td>
                  <td className="fw-semibold">{r.typeName}</td>
                  <td className="text-break" style={{ maxWidth: 320 }}>{r.description || "—"}</td>
                  <td>{r.subtypeCount}</td>
                  <td>{r.documentCount}</td>
                  <td><span className={`badge ${r.isActive ? "bg-label-success" : "bg-label-secondary"}`}>{r.isActive ? "Active" : "Inactive"}</span></td>
                  <td className="text-end">
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setEdit({ ...r, description: r.description || "" })}>
                      <i className="bx bx-edit"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {edit && (
        <ModalShell
          title={edit.idGeneralDocumentType ? "Edit Document Type" : "Add Document Type"}
          size="sm"
          onClose={() => setEdit(null)}
          footer={
            <>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setEdit(null)}>Cancel</button>
              <button type="button" className="btn btn-sm btn-primary" disabled={saving} onClick={save}>{saving ? "Saving..." : "Save"}</button>
            </>
          }
        >
          <div className="row g-3">
            <div className="col-6">
              <label className="form-label mb-1">Code<span className="text-danger"> *</span></label>
              <input className="form-control form-control-sm text-uppercase" maxLength={20} value={edit.typeCode}
                onChange={(e) => set({ typeCode: e.target.value.replace(/[^A-Za-z0-9_]/g, "") })} />
            </div>
            <div className="col-6">
              <label className="form-label mb-1">Display Order</label>
              <input type="number" className="form-control form-control-sm" value={edit.displayOrder} onChange={(e) => set({ displayOrder: e.target.value })} />
            </div>
            <div className="col-12">
              <label className="form-label mb-1">Type Name<span className="text-danger"> *</span></label>
              <input className="form-control form-control-sm" maxLength={100} value={edit.typeName} onChange={(e) => set({ typeName: e.target.value })} />
            </div>
            <div className="col-12">
              <label className="form-label mb-1">Description</label>
              <textarea className="form-control form-control-sm" rows={2} maxLength={250} value={edit.description} onChange={(e) => set({ description: e.target.value })} />
            </div>
            <div className="col-12">
              <label className="form-check mb-0">
                <input type="checkbox" className="form-check-input" checked={edit.isActive} onChange={(e) => set({ isActive: e.target.checked })} />
                <span className="form-check-label">Active</span>
              </label>
              {!edit.isActive && edit.documentCount > 0 && <div className="dm-hint">Existing documents keep this type; it cannot be chosen for new documents.</div>}
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
};

export default DocumentTypes;
