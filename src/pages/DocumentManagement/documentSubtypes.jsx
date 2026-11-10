import { useEffect, useMemo, useState } from "react";
import GeneralDocumentService from "../../core/services/GeneralDocumentService";
import { showToast } from "../../components/ToastNotifications/toastUtils";
import { ModalShell } from "../EmployeeSelfPortal/ProfileChange/shared";
import { MAINTENANCE_TYPES, SCOPES, FREQUENCIES, labelOf } from "./shared";

const empty = {
  idGeneralDocumentSubtype: 0, idGeneralDocumentType: "", subtypeCode: "", subtypeName: "", description: "",
  defaultMaintenanceType: "FIXED", defaultScope: "ORGANIZATION", periodFrequency: "", validityRequired: false, visibleToAllEmployees: false, acknowledgementRequired: false,
  expiryAlertDays: 30, displayOrder: 0, isActive: true,
};

const DocumentSubtypes = () => {
  const [types, setTypes] = useState([]);
  const [rows, setRows] = useState([]);
  const [idType, setIdType] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [edit, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    GeneralDocumentService.getTypeOptions().then((res) => { if (!res.error) setTypes(res.data || []); });
  }, []);

  const load = async () => {
    setLoading(true);
    const res = await GeneralDocumentService.getSubtypes(idType ? Number(idType) : null);
    setLoading(false);
    if (res.error) { showToast(res.error, "error"); return; }
    setRows(res.data || []);
  };
  useEffect(() => { load(); }, [idType]);

  const shown = useMemo(() => {
    const s = search.trim().toLowerCase();
    return s ? rows.filter((r) => `${r.subtypeCode} ${r.subtypeName} ${r.typeName} ${r.description || ""}`.toLowerCase().includes(s)) : rows;
  }, [rows, search]);

  const set = (patch) => setEdit((p) => ({ ...p, ...patch }));

  const save = async () => {
    if (!edit.idGeneralDocumentType) return showToast("Select the document type.", "error");
    if (!edit.subtypeCode.trim()) return showToast("Enter the subtype code.", "error");
    if (!edit.subtypeName.trim()) return showToast("Enter the subtype name.", "error");
    if (edit.defaultMaintenanceType === "PERIODIC" && !edit.periodFrequency) return showToast("Select the period frequency.", "error");
    setSaving(true);
    const res = await GeneralDocumentService.saveSubtype({
      ...edit,
      idGeneralDocumentType: Number(edit.idGeneralDocumentType),
      subtypeCode: edit.subtypeCode.trim().toUpperCase(),
      subtypeName: edit.subtypeName.trim(),
      description: edit.description?.trim() || null,
      periodFrequency: edit.defaultMaintenanceType === "PERIODIC" ? edit.periodFrequency : null,
      expiryAlertDays: Number(edit.expiryAlertDays) || 0,
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
        <h4>Document Subtypes</h4>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => setEdit({ ...empty, idGeneralDocumentType: idType })}>
          <i className="bx bx-plus me-1"></i>Add Subtype
        </button>
      </div>

      <div className="card">
        <div className="card-header py-2 d-flex justify-content-between align-items-center gap-2 flex-wrap">
          <div className="d-flex gap-2 flex-wrap">
            <select className="form-select form-select-sm" style={{ maxWidth: 260 }} value={idType} onChange={(e) => setIdType(e.target.value)}>
              <option value="">All types</option>
              {types.map((t) => <option key={t.idGeneralDocumentType} value={t.idGeneralDocumentType}>{t.typeName}{t.isActive ? "" : " (inactive)"}</option>)}
            </select>
            <input className="form-control form-control-sm" style={{ maxWidth: 260 }} placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <span className="pc-sub">{loading ? "Loading..." : `${shown.length} subtype${shown.length === 1 ? "" : "s"}`}</span>
        </div>
        <div className="table-responsive">
          <table className="table pc-table dm-table mb-0">
            <thead><tr><th>Type</th><th>Code</th><th>Subtype</th><th>Maintenance</th><th>Scope</th><th>Valid To</th><th>Alert</th><th>Employees</th><th>Documents</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {!loading && shown.length === 0 && <tr><td colSpan={11} className="text-center pc-sub py-4">No subtypes.</td></tr>}
              {shown.map((r) => (
                <tr key={r.idGeneralDocumentSubtype} className={r.isActive ? "" : "inactive"}>
                  <td>{r.typeName}</td>
                  <td>{r.subtypeCode}</td>
                  <td>
                    <div className="fw-semibold">{r.subtypeName}</div>
                    {r.description && <div className="pc-sub text-break" style={{ maxWidth: 260 }}>{r.description}</div>}
                  </td>
                  <td>{labelOf(MAINTENANCE_TYPES, r.defaultMaintenanceType)}{r.periodFrequency ? <div className="pc-sub">{labelOf(FREQUENCIES, r.periodFrequency)}</div> : null}</td>
                  <td>{labelOf(SCOPES, r.defaultScope)}</td>
                  <td>{r.validityRequired ? "Mandatory" : "Optional"}</td>
                  <td>{r.expiryAlertDays} d</td>
                  <td>
                    {r.visibleToAllEmployees ? <span className="badge bg-label-info">Visible</span> : <span className="pc-sub">—</span>}
                    {r.acknowledgementRequired && <span className="badge bg-label-warning ms-1">Ack</span>}
                  </td>
                  <td>{r.documentCount}</td>
                  <td><span className={`badge ${r.isActive ? "bg-label-success" : "bg-label-secondary"}`}>{r.isActive ? "Active" : "Inactive"}</span></td>
                  <td className="text-end">
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setEdit({ ...r, description: r.description || "", periodFrequency: r.periodFrequency || "" })}>
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
          title={edit.idGeneralDocumentSubtype ? "Edit Subtype" : "Add Subtype"}
          onClose={() => setEdit(null)}
          footer={
            <>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setEdit(null)}>Cancel</button>
              <button type="button" className="btn btn-sm btn-primary" disabled={saving} onClick={save}>{saving ? "Saving..." : "Save"}</button>
            </>
          }
        >
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label mb-1">Document Type<span className="text-danger"> *</span></label>
              <select className="form-select form-select-sm" value={edit.idGeneralDocumentType} disabled={edit.documentCount > 0}
                onChange={(e) => set({ idGeneralDocumentType: e.target.value })}>
                <option value="">Select</option>
                {types.filter((t) => t.isActive || String(t.idGeneralDocumentType) === String(edit.idGeneralDocumentType))
                  .map((t) => <option key={t.idGeneralDocumentType} value={t.idGeneralDocumentType}>{t.typeName}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label mb-1">Code<span className="text-danger"> *</span></label>
              <input className="form-control form-control-sm text-uppercase" maxLength={20} value={edit.subtypeCode}
                onChange={(e) => set({ subtypeCode: e.target.value.replace(/[^A-Za-z0-9_]/g, "") })} />
            </div>
            <div className="col-md-3">
              <label className="form-label mb-1">Display Order</label>
              <input type="number" className="form-control form-control-sm" value={edit.displayOrder} onChange={(e) => set({ displayOrder: e.target.value })} />
            </div>
            <div className="col-12">
              <label className="form-label mb-1">Subtype Name<span className="text-danger"> *</span></label>
              <input className="form-control form-control-sm" maxLength={100} value={edit.subtypeName} onChange={(e) => set({ subtypeName: e.target.value })} />
            </div>
            <div className="col-12">
              <label className="form-label mb-1">Description</label>
              <textarea className="form-control form-control-sm" rows={2} maxLength={250} value={edit.description} onChange={(e) => set({ description: e.target.value })} />
            </div>
            <div className="col-12 pc-sub">Defaults for new documents of this subtype (can be changed per document):</div>
            <div className="col-md-4">
              <label className="form-label mb-1">Maintenance Type</label>
              <select className="form-select form-select-sm" value={edit.defaultMaintenanceType} onChange={(e) => set({ defaultMaintenanceType: e.target.value })}>
                {MAINTENANCE_TYPES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <div className="dm-hint">{MAINTENANCE_TYPES.find((m) => m.value === edit.defaultMaintenanceType)?.hint}</div>
            </div>
            <div className="col-md-4">
              <label className="form-label mb-1">Period Frequency</label>
              <select className="form-select form-select-sm" value={edit.periodFrequency} disabled={edit.defaultMaintenanceType !== "PERIODIC"}
                onChange={(e) => set({ periodFrequency: e.target.value })}>
                <option value="">{edit.defaultMaintenanceType === "PERIODIC" ? "Select" : "Not applicable"}</option>
                {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label mb-1">Scope</label>
              <select className="form-select form-select-sm" value={edit.defaultScope} onChange={(e) => set({ defaultScope: e.target.value })}>
                {SCOPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label mb-1">Expiry Alert (days)</label>
              <input type="number" min={0} max={365} className="form-control form-control-sm" value={edit.expiryAlertDays} onChange={(e) => set({ expiryAlertDays: e.target.value })} />
            </div>
            <div className="col-md-8 d-flex align-items-end gap-4">
              <label className="form-check mb-1">
                <input type="checkbox" className="form-check-input" checked={edit.validityRequired} onChange={(e) => set({ validityRequired: e.target.checked })} />
                <span className="form-check-label">Valid To mandatory</span>
              </label>
              <label className="form-check mb-1">
                <input type="checkbox" className="form-check-input" checked={edit.isActive} onChange={(e) => set({ isActive: e.target.checked })} />
                <span className="form-check-label">Active</span>
              </label>
            </div>
            <div className="col-12 pc-sub">Employee access:</div>
            <div className="col-md-6">
              <label className="form-check mb-0">
                <input type="checkbox" className="form-check-input" checked={!!edit.visibleToAllEmployees}
                  onChange={(e) => set({ visibleToAllEmployees: e.target.checked, acknowledgementRequired: e.target.checked ? edit.acknowledgementRequired : false })} />
                <span className="form-check-label">Visible to All Employees</span>
              </label>
              <div className="dm-hint">Current version is shown in Self Portal → Documents. Office documents only to that office&apos;s staff.</div>
            </div>
            <div className="col-md-6">
              <label className="form-check mb-0">
                <input type="checkbox" className="form-check-input" checked={!!edit.acknowledgementRequired} disabled={!edit.visibleToAllEmployees}
                  onChange={(e) => set({ acknowledgementRequired: e.target.checked })} />
                <span className="form-check-label">Acknowledgement Required</span>
              </label>
              <div className="dm-hint">Employees must open the document and click &quot;Viewed and Acknowledged&quot;. Each new version needs a new acknowledgement.</div>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
};

export default DocumentSubtypes;
