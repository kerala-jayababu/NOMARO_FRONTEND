import React, { useEffect, useState } from "react";
import ProfileChangeService from "../../core/services/ProfileChangeService";
import { showToast } from "../../components/ToastNotifications/toastUtils";
import { useLoader } from "../../components/LoaderContext";
import { CATEGORY_LABELS } from "../EmployeeSelfPortal/ProfileChange/shared";
import "../EmployeeSelfPortal/ProfileChange/profileChange.css";

const AUTHORITY_TYPES = [
  { value: "ROLE", label: "Designation" },
  { value: "REPOFFICER", label: "Reporting officer" },
  { value: "EMPLOYEE", label: "Specific employee" },
];

const ProfileChangeSettings = () => {
  const { showLoader, hideLoader } = useLoader();
  const [types, setTypes] = useState([]);
  const [editing, setEditing] = useState({});
  const [workflows, setWorkflows] = useState([]);
  const [lookups, setLookups] = useState({ designations: [], employees: [] });

  const load = async () => {
    showLoader();
    const [t, w, l] = await Promise.all([
      ProfileChangeService.getRequestTypes(),
      ProfileChangeService.getWorkflows(),
      ProfileChangeService.getWorkflowLookups(),
    ]);
    hideLoader();
    if (t.error) showToast(t.error, "error"); else setTypes(t.data?.data || []);
    if (w.error) showToast(w.error, "error"); else setWorkflows(w.data?.data || []);
    if (!l.error) setLookups(l.data?.data || { designations: [], employees: [] });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveType = async (id) => {
    const row = editing[id];
    if (!row.requestTypeName?.trim()) { showToast("Name is required", "error"); return; }
    showLoader();
    const res = await ProfileChangeService.updateRequestType({
      idProfileChangeRequestType: id,
      requestTypeName: row.requestTypeName.trim(),
      proofRequired: row.proofRequired,
      proofHint: row.proofHint || null,
      displayOrder: Number(row.displayOrder) || 0,
      isActive: row.isActive,
    });
    hideLoader();
    if (res.error) { showToast(res.error, "error"); return; }
    showToast("Request type updated", "success");
    setEditing((p) => { const n = { ...p }; delete n[id]; return n; });
    load();
  };

  const setLevel = (code, index, patch) =>
    setWorkflows((list) => list.map((w) => (w.entityCode !== code ? w : {
      ...w,
      dirty: true,
      levels: w.levels.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    })));

  const addLevel = (code) =>
    setWorkflows((list) => list.map((w) => (w.entityCode !== code ? w : {
      ...w, dirty: true, levels: [...w.levels, { levelNumber: w.levels.length + 1, approvalAuthorityType: "ROLE", approvalAuthorityID: "" }],
    })));

  const removeLevel = (code, index) =>
    setWorkflows((list) => list.map((w) => (w.entityCode !== code ? w : {
      ...w, dirty: true, levels: w.levels.filter((_, i) => i !== index).map((l, i) => ({ ...l, levelNumber: i + 1 })),
    })));

  const saveWorkflow = async (w) => {
    if (w.levels.length === 0) { showToast("Add at least one approval level", "error"); return; }
    const bad = w.levels.findIndex((l) => l.approvalAuthorityType !== "REPOFFICER" && !l.approvalAuthorityID);
    if (bad >= 0) { showToast(`Level ${bad + 1}: select who approves`, "error"); return; }
    showLoader();
    const res = await ProfileChangeService.saveWorkflow({
      entityCode: w.entityCode,
      entityName: w.entityName,
      levels: w.levels.map((l, i) => ({
        levelNumber: i + 1,
        approvalAuthorityType: l.approvalAuthorityType,
        approvalAuthorityID: l.approvalAuthorityType === "REPOFFICER" ? 0 : Number(l.approvalAuthorityID),
      })),
    });
    hideLoader();
    if (res.error) { showToast(res.error, "error"); return; }
    showToast("Approval levels saved", "success");
    load();
  };

  const usedBy = (code) => types.filter((t) => t.entityCode === code).map((t) => t.requestTypeName).join(", ");

  return (
    <div className="container-xxl flex-grow-1 container-p-y pc-page">
      <div className="pc-head"><h4>Profile Change Settings</h4></div>

      <div className="card mb-3">
        <div className="card-header py-2"><h6 className="m-0">Approval Levels</h6></div>
        <div className="card-body">
          <div className="pc-sub mb-3">
            Each group of request types has its own approval chain. Level 1 approves first; the last level's approval updates the employee's records.
            Until a group has at least one level, employees can save drafts but cannot submit.
          </div>
          <div className="row g-3">
            {workflows.map((w) => (
              <div className="col-lg-4" key={w.entityCode}>
                <div className="border rounded p-3 h-100">
                  <div className="fw-semibold">{w.entityName}</div>
                  <div className="pc-sub mb-2">{usedBy(w.entityCode) || w.entityCode}</div>
                  {w.levels.length === 0 && <div className="pc-banner warn py-1">No approval levels yet.</div>}
                  {w.levels.map((l, i) => (
                    <div className="d-flex gap-1 align-items-center mb-2" key={i}>
                      <span className="badge bg-label-primary" style={{ minWidth: 28 }}>L{i + 1}</span>
                      <select className="form-select form-select-sm" style={{ maxWidth: 140 }} value={l.approvalAuthorityType}
                        onChange={(e) => setLevel(w.entityCode, i, { approvalAuthorityType: e.target.value, approvalAuthorityID: "" })}>
                        {AUTHORITY_TYPES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                      </select>
                      {l.approvalAuthorityType === "REPOFFICER" ? (
                        <span className="pc-sub flex-grow-1">of the previous actor</span>
                      ) : (
                        <select className="form-select form-select-sm" value={l.approvalAuthorityID || ""}
                          onChange={(e) => setLevel(w.entityCode, i, { approvalAuthorityID: e.target.value })}>
                          <option value="">Select</option>
                          {(l.approvalAuthorityType === "ROLE" ? lookups.designations : lookups.employees)
                            .map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      )}
                      <button type="button" className="btn btn-sm btn-outline-secondary" title="Remove level" onClick={() => removeLevel(w.entityCode, i)}>✕</button>
                    </div>
                  ))}
                  <div className="d-flex justify-content-between mt-2">
                    <button type="button" className="btn btn-sm btn-outline-primary" disabled={w.levels.length >= 5} onClick={() => addLevel(w.entityCode)}>+ Add level</button>
                    <button type="button" className="btn btn-sm btn-primary" disabled={!w.dirty} onClick={() => saveWorkflow(w)}>Save</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="pc-sub mt-2">
            "Designation" sends the request to every employee with that designation. "Reporting officer" means the reporting officer of the employee at level 1, and of the previous approver at later levels.
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header py-2"><h6 className="m-0">Request Types</h6></div>
        <div className="table-responsive">
          <table className="table table-sm pc-table mb-0">
            <thead>
              <tr><th>Category</th><th>Name</th><th>Proof required</th><th>Proof hint shown to employee</th><th>Order</th><th>Active</th><th></th></tr>
            </thead>
            <tbody>
              {types.map((t) => {
                const e = editing[t.idProfileChangeRequestType];
                const set = (patch) => setEditing((p) => ({ ...p, [t.idProfileChangeRequestType]: { ...p[t.idProfileChangeRequestType], ...patch } }));
                const fileOnly = t.tableName === "EmployeeDocuments";
                return (
                  <tr key={t.idProfileChangeRequestType}>
                    <td>{CATEGORY_LABELS[t.requestCategory] || t.requestCategory}<div className="pc-sub">{t.entityCode}</div></td>
                    <td>{e ? <input className="form-control form-control-sm" maxLength={100} value={e.requestTypeName} onChange={(x) => set({ requestTypeName: x.target.value })} /> : t.requestTypeName}</td>
                    <td>
                      {e && !fileOnly
                        ? <input type="checkbox" className="form-check-input" checked={e.proofRequired} onChange={(x) => set({ proofRequired: x.target.checked })} />
                        : t.proofRequired ? "Yes" : "No"}
                    </td>
                    <td>{e ? <input className="form-control form-control-sm" maxLength={250} value={e.proofHint || ""} onChange={(x) => set({ proofHint: x.target.value })} /> : (t.proofHint || "—")}</td>
                    <td style={{ width: 80 }}>{e ? <input type="number" className="form-control form-control-sm" value={e.displayOrder} onChange={(x) => set({ displayOrder: x.target.value })} /> : t.displayOrder}</td>
                    <td>
                      {e
                        ? <input type="checkbox" className="form-check-input" checked={e.isActive} onChange={(x) => set({ isActive: x.target.checked })} />
                        : <span className={`badge ${t.isActive ? "bg-label-success" : "bg-label-secondary"}`}>{t.isActive ? "Active" : "Inactive"}</span>}
                    </td>
                    <td className="text-end text-nowrap">
                      {e ? (
                        <>
                          <button type="button" className="btn btn-sm btn-primary me-1" onClick={() => saveType(t.idProfileChangeRequestType)}>Save</button>
                          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setEditing((p) => { const n = { ...p }; delete n[t.idProfileChangeRequestType]; return n; })}>Cancel</button>
                        </>
                      ) : (
                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => set({ ...t })}>Edit</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProfileChangeSettings;
