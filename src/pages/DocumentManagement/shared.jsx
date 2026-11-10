import { useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import GeneralDocumentService, { saveBlob } from "../../core/services/GeneralDocumentService";
import { showToast } from "../../components/ToastNotifications/toastUtils";
import { ModalShell, formatDate, formatSize } from "../EmployeeSelfPortal/ProfileChange/shared";
import "../EmployeeSelfPortal/ProfileChange/profileChange.css";
import "./documentManagement.css";

export { formatDate, formatSize };

export const MAINTENANCE_TYPES = [
  { value: "FIXED", label: "Fixed", hint: "One valid document. A new upload replaces the previous one." },
  { value: "VERSION", label: "Version-controlled", hint: "Every upload is a new version. Older versions are kept as superseded." },
  { value: "PERIODIC", label: "Periodic", hint: "One document per period (month, year ...). Each period is kept." },
];
export const SCOPES = [
  { value: "ORGANIZATION", label: "Organisation" },
  { value: "OFFICE", label: "Office" },
];
export const FREQUENCIES = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "HALFYEARLY", label: "Half-yearly" },
  { value: "YEARLY", label: "Yearly" },
  { value: "OTHER", label: "Other" },
];
export const VALIDITY = {
  VALID: { cls: "bg-label-success", text: "Valid" },
  NO_EXPIRY: { cls: "bg-label-info", text: "No expiry" },
  EXPIRING: { cls: "bg-label-warning", text: "Expiring" },
  EXPIRED: { cls: "bg-label-danger", text: "Expired" },
  NO_RECORD: { cls: "bg-label-secondary", text: "Not uploaded" },
};
export const RECORD_STATUS = {
  ACTIVE: { cls: "bg-label-success", text: "Active" },
  SUPERSEDED: { cls: "bg-label-secondary", text: "Superseded" },
  INCORRECT: { cls: "bg-label-danger", text: "Incorrect" },
};

export const labelOf = (list, value) => list.find((x) => x.value === value)?.label || value || "—";

export const ValidityBadge = ({ status, days }) => {
  const v = VALIDITY[status];
  if (!v) return null;
  let text = v.text;
  if (status === "EXPIRING" && days != null) text = days === 0 ? "Expires today" : `Expires in ${days} day${days === 1 ? "" : "s"}`;
  if (status === "EXPIRED" && days != null) text = `Expired ${-days} day${days === -1 ? "" : "s"} ago`;
  return <span className={`badge ${v.cls}`}>{text}</span>;
};

export const RecordStatusBadge = ({ status }) => {
  const s = RECORD_STATUS[status] || { cls: "bg-label-secondary", text: status };
  return <span className={`badge ${s.cls}`}>{s.text}</span>;
};

export const toApiDate = (d) => (d ? moment(d).format("YYYY-MM-DD") : null);
export const fromApiDate = (s) => (s ? moment(s).toDate() : null);

export const dateProps = {
  dateFormat: "dd-MM-yyyy",
  className: "form-control form-control-sm",
  showYearDropdown: true,
  showMonthDropdown: true,
  dropdownMode: "select",
  wrapperClassName: "d-block",
  placeholderText: "dd-mm-yyyy",
  isClearable: true,
};

/** Lookups (types, subtypes, offices, permissions) shared by the document screens. */
export const useDocumentLookups = () => {
  const [lookups, setLookups] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    GeneralDocumentService.getLookups().then((res) => {
      if (res.error) setError(res.error);
      else setLookups(res.data);
    });
  }, []);
  return { lookups, error };
};

/** Opens a file: PDF / image in the preview, other types are downloaded. */
export const useFileOpener = () => {
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(null);
  const open = async (file, forceDownload = false) => {
    setBusy(file.idGeneralDocumentFile);
    const previewable = !forceDownload && ((file.mimeType || "").startsWith("image/") || file.mimeType === "application/pdf");
    const res = await GeneralDocumentService.downloadFile(file.idGeneralDocumentFile, previewable, file.originalFileName);
    setBusy(null);
    if (res.error) return showToast(res.error, "error");
    if (previewable) setPreview({ blob: res.blob, contentType: res.contentType, name: file.originalFileName });
    else saveBlob(res.blob, file.originalFileName);
    return null;
  };
  return { preview, setPreview, busy, open };
};

export const downloadZip = async (documentIds, recordIds) => {
  const res = await GeneralDocumentService.downloadZip(documentIds, recordIds);
  if (res.error) {
    showToast(res.error, "error");
    return false;
  }
  saveBlob(res.blob, res.name || "Documents.zip");
  return true;
};

const Field = ({ label, required, children, hint, className = "col-md-6" }) => (
  <div className={className}>
    <label className="form-label mb-1">
      {label}
      {required && <span className="text-danger"> *</span>}
    </label>
    {children}
    {hint && <div className="dm-hint">{hint}</div>}
  </div>
);

/* ---------------------------------------------------------------- */
/* Register / edit a document                                        */
/* ---------------------------------------------------------------- */

const emptyDoc = {
  idGeneralDocument: 0,
  title: "",
  idGeneralDocumentType: "",
  idGeneralDocumentSubtype: "",
  scope: "ORGANIZATION",
  idOffice: "",
  maintenanceType: "FIXED",
  periodFrequency: "",
  validityRequired: false,
  expiryAlertDays: 30,
  description: "",
  tags: "",
};

export const DocumentFormModal = ({ lookups, document: doc, onClose, onSaved }) => {
  const isEdit = !!doc?.idGeneralDocument;
  const [form, setForm] = useState(() =>
    isEdit
      ? {
          ...emptyDoc,
          ...doc,
          idGeneralDocumentSubtype: doc.idGeneralDocumentSubtype || "",
          idOffice: doc.idOffice || "",
          periodFrequency: doc.periodFrequency || "",
          description: doc.description || "",
          tags: doc.tags || "",
        }
      : { ...emptyDoc, scope: lookups.allOffices ? "ORGANIZATION" : "OFFICE", idOffice: !lookups.allOffices && lookups.offices.length === 1 ? lookups.offices[0].idOffice : "" }
  );
  const [saving, setSaving] = useState(false);
  const set = (patch) => setForm((p) => ({ ...p, ...patch }));
  const hasRecords = isEdit && doc.recordCount > 0;

  const subtypes = lookups.subtypes.filter((s) => String(s.idGeneralDocumentType) === String(form.idGeneralDocumentType));

  // a subtype fills in the defaults (the user can still change them)
  const pickSubtype = (id) => {
    const s = lookups.subtypes.find((x) => String(x.idGeneralDocumentSubtype) === String(id));
    if (!s) return set({ idGeneralDocumentSubtype: id });
    const patch = {
      idGeneralDocumentSubtype: id,
      validityRequired: s.validityRequired,
      expiryAlertDays: s.expiryAlertDays,
    };
    if (!hasRecords) {
      patch.maintenanceType = s.defaultMaintenanceType;
      patch.periodFrequency = s.periodFrequency || "";
    }
    if (!isEdit && (lookups.allOffices || s.defaultScope === "OFFICE")) patch.scope = s.defaultScope;
    if (!form.title.trim()) patch.title = s.subtypeName;
    return set(patch);
  };

  const save = async () => {
    if (!form.title.trim()) return showToast("Enter the document title.", "error");
    if (!form.idGeneralDocumentType) return showToast("Select the document type.", "error");
    if (form.scope === "OFFICE" && !form.idOffice) return showToast("Select the office.", "error");
    if (form.maintenanceType === "PERIODIC" && !form.periodFrequency) return showToast("Select the period frequency.", "error");
    setSaving(true);
    const res = await GeneralDocumentService.saveDocument({
      idGeneralDocument: form.idGeneralDocument || 0,
      title: form.title.trim(),
      idGeneralDocumentType: Number(form.idGeneralDocumentType),
      idGeneralDocumentSubtype: form.idGeneralDocumentSubtype ? Number(form.idGeneralDocumentSubtype) : null,
      scope: form.scope,
      idOffice: form.scope === "OFFICE" ? Number(form.idOffice) : null,
      maintenanceType: form.maintenanceType,
      periodFrequency: form.maintenanceType === "PERIODIC" ? form.periodFrequency : null,
      validityRequired: !!form.validityRequired,
      expiryAlertDays: Number(form.expiryAlertDays) || 0,
      description: form.description.trim() || null,
      tags: form.tags.trim() || null,
    });
    setSaving(false);
    if (res.error) return showToast(res.error, "error");
    showToast(res.message || "Saved", "success");
    return onSaved(res.data);
  };

  const maintHint = MAINTENANCE_TYPES.find((m) => m.value === form.maintenanceType)?.hint;

  return (
    <ModalShell
      title={isEdit ? `Edit Document · ${doc.documentCode || ""}` : "Register Document"}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-sm btn-primary" disabled={saving} onClick={save}>
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Register"}
          </button>
        </>
      }
    >
      <div className="row g-3">
        <Field label="Document Type" required>
          <select className="form-select form-select-sm" value={form.idGeneralDocumentType}
            onChange={(e) => set({ idGeneralDocumentType: e.target.value, idGeneralDocumentSubtype: "" })}>
            <option value="">Select</option>
            {lookups.types.map((t) => <option key={t.idGeneralDocumentType} value={t.idGeneralDocumentType}>{t.typeName}</option>)}
            {isEdit && !lookups.types.some((t) => t.idGeneralDocumentType === doc.idGeneralDocumentType) && (
              <option value={doc.idGeneralDocumentType}>{doc.typeName} (inactive)</option>
            )}
          </select>
        </Field>
        <Field label="Subtype" hint={!form.idGeneralDocumentType ? "Select the type first" : subtypes.length === 0 ? "No subtypes for this type" : "Fills in the defaults below"}>
          <select className="form-select form-select-sm" value={form.idGeneralDocumentSubtype} disabled={!form.idGeneralDocumentType}
            onChange={(e) => pickSubtype(e.target.value)}>
            <option value="">None</option>
            {subtypes.map((s) => <option key={s.idGeneralDocumentSubtype} value={s.idGeneralDocumentSubtype}>{s.subtypeName}</option>)}
            {isEdit && doc.idGeneralDocumentSubtype && !subtypes.some((s) => s.idGeneralDocumentSubtype === doc.idGeneralDocumentSubtype) &&
              String(form.idGeneralDocumentType) === String(doc.idGeneralDocumentType) && (
              <option value={doc.idGeneralDocumentSubtype}>{doc.subtypeName} (inactive)</option>
            )}
          </select>
        </Field>
        <Field label="Title" required className="col-12">
          <input className="form-control form-control-sm" maxLength={200} value={form.title} onChange={(e) => set({ title: e.target.value })}
            placeholder="e.g. Trade Licence - Kochi Office" />
        </Field>
        <Field label="Scope" required>
          <div className="d-flex gap-3 pt-1">
            {SCOPES.map((s) => (
              <label key={s.value} className="form-check mb-0">
                <input type="radio" className="form-check-input" checked={form.scope === s.value}
                  disabled={s.value === "ORGANIZATION" && !lookups.allOffices}
                  onChange={() => set({ scope: s.value })} />
                <span className="form-check-label">{s.label}</span>
              </label>
            ))}
          </div>
          {!lookups.allOffices && <div className="dm-hint">Organisation documents are managed by users with access to all offices.</div>}
        </Field>
        <Field label="Office" required={form.scope === "OFFICE"}>
          <select className="form-select form-select-sm" value={form.idOffice} disabled={form.scope !== "OFFICE"}
            onChange={(e) => set({ idOffice: e.target.value })}>
            <option value="">{form.scope === "OFFICE" ? "Select" : "Not applicable"}</option>
            {lookups.offices.map((o) => <option key={o.idOffice} value={o.idOffice}>{o.officeName}</option>)}
          </select>
        </Field>
        <Field label="Maintenance Type" required hint={hasRecords ? "Cannot be changed after files are uploaded." : maintHint}>
          <select className="form-select form-select-sm" value={form.maintenanceType} disabled={hasRecords}
            onChange={(e) => set({ maintenanceType: e.target.value })}>
            {MAINTENANCE_TYPES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </Field>
        <Field label="Period Frequency" required={form.maintenanceType === "PERIODIC"}>
          <select className="form-select form-select-sm" value={form.periodFrequency} disabled={form.maintenanceType !== "PERIODIC"}
            onChange={(e) => set({ periodFrequency: e.target.value })}>
            <option value="">{form.maintenanceType === "PERIODIC" ? "Select" : "Not applicable"}</option>
            {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </Field>
        <Field label="Expiry Alert (days before)" hint="Shown as Expiring this many days before Valid To.">
          <input type="number" min={0} max={365} className="form-control form-control-sm" value={form.expiryAlertDays}
            onChange={(e) => set({ expiryAlertDays: e.target.value })} />
        </Field>
        <Field label=" ">
          <label className="form-check mt-1">
            <input type="checkbox" className="form-check-input" checked={!!form.validityRequired} onChange={(e) => set({ validityRequired: e.target.checked })} />
            <span className="form-check-label">Valid To date is mandatory on upload</span>
          </label>
        </Field>
        <Field label="Description" className="col-12">
          <textarea className="form-control form-control-sm" rows={2} maxLength={500} value={form.description} onChange={(e) => set({ description: e.target.value })} />
        </Field>
        <Field label="Tags" className="col-12" hint="Comma separated keywords used in search, e.g. municipality, renewal">
          <input className="form-control form-control-sm" maxLength={250} value={form.tags} onChange={(e) => set({ tags: e.target.value })} />
        </Field>
      </div>
    </ModalShell>
  );
};

/* ---------------------------------------------------------------- */
/* Upload a record (files + details) / correct a record's details     */
/* ---------------------------------------------------------------- */

const recordFromApi = (r) => ({
  periodLabel: r?.periodLabel || "",
  periodFrom: fromApiDate(r?.periodFrom),
  periodTo: fromApiDate(r?.periodTo),
  referenceNumber: r?.referenceNumber || "",
  issuingAuthority: r?.issuingAuthority || "",
  issueDate: fromApiDate(r?.issueDate),
  validFrom: fromApiDate(r?.validFrom),
  validTo: fromApiDate(r?.validTo),
  remarks: r?.remarks || "",
});

// Suggest the next period from the frequency: FY (Apr-Mar) for yearly, calendar month / quarter otherwise
const suggestPeriod = (frequency, last) => {
  const start = last?.periodTo ? moment(last.periodTo).add(1, "day") : moment().startOf("month");
  switch (frequency) {
    case "MONTHLY": {
      const s = start.clone().startOf("month");
      return { periodLabel: s.format("MMM YYYY"), periodFrom: s.toDate(), periodTo: s.clone().endOf("month").startOf("day").toDate() };
    }
    case "QUARTERLY": {
      const s = start.clone().startOf("quarter");
      return { periodLabel: `Q${s.quarter()} ${s.year()}`, periodFrom: s.toDate(), periodTo: s.clone().endOf("quarter").startOf("day").toDate() };
    }
    case "HALFYEARLY": {
      const s = start.clone().month(start.month() < 6 ? 0 : 6).startOf("month");
      return { periodLabel: `${s.month() === 0 ? "H1" : "H2"} ${s.year()}`, periodFrom: s.toDate(), periodTo: s.clone().add(5, "months").endOf("month").startOf("day").toDate() };
    }
    case "YEARLY": {
      const fy = last?.periodTo ? start.year() - (start.month() < 3 ? 1 : 0) : moment().year() - (moment().month() < 3 ? 1 : 0);
      const s = moment({ year: fy, month: 3, day: 1 });
      return { periodLabel: `FY ${fy}-${String((fy + 1) % 100).padStart(2, "0")}`, periodFrom: s.toDate(), periodTo: moment({ year: fy + 1, month: 2, day: 31 }).toDate() };
    }
    default:
      return {};
  }
};

export const UploadModal = ({ lookups, document: doc, record, lastPeriod, onClose, onSaved }) => {
  const isEdit = !!record;
  const periodic = doc.maintenanceType === "PERIODIC";
  const [form, setForm] = useState(() => {
    const base = recordFromApi(record);
    return isEdit || !periodic ? base : { ...base, ...suggestPeriod(doc.periodFrequency, lastPeriod) };
  });
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);
  const set = (patch) => setForm((p) => ({ ...p, ...patch }));
  const replacing = !isEdit && !periodic && doc.idCurrentRecord;

  const addFiles = (list) => {
    const allowed = lookups.allowedExtensions || [];
    const next = [...files];
    for (const f of Array.from(list)) {
      const ext = `.${(f.name.split(".").pop() || "").toLowerCase()}`;
      if (allowed.length && !allowed.includes(ext)) { showToast(`${f.name}: only ${allowed.join(", ")} files are allowed.`, "error"); continue; }
      if (f.size > lookups.maxFileSizeBytes) { showToast(`${f.name} is larger than ${formatSize(lookups.maxFileSizeBytes)}.`, "error"); continue; }
      if (f.size === 0) { showToast(`${f.name} is empty.`, "error"); continue; }
      if (next.some((x) => x.name === f.name && x.size === f.size)) continue;
      next.push(f);
    }
    if (next.length > lookups.maxFilesPerUpload) {
      showToast(`You can upload up to ${lookups.maxFilesPerUpload} files at a time.`, "error");
      next.length = lookups.maxFilesPerUpload;
    }
    setFiles(next);
  };

  const save = async () => {
    if (!isEdit && files.length === 0) return showToast("Select at least one file to upload.", "error");
    if (periodic && (!form.periodLabel.trim() || !form.periodFrom || !form.periodTo)) return showToast("Enter the period and its from / to dates.", "error");
    if (doc.validityRequired && !form.validTo) return showToast("Enter the Valid To date.", "error");
    if (form.validFrom && form.validTo && form.validTo < form.validFrom) return showToast("Valid To cannot be before Valid From.", "error");
    if (replacing && !form.remarks.trim()) return showToast("Enter remarks explaining why the document is being replaced.", "error");

    const values = {
      periodLabel: periodic ? form.periodLabel.trim() : null,
      periodFrom: periodic ? toApiDate(form.periodFrom) : null,
      periodTo: periodic ? toApiDate(form.periodTo) : null,
      referenceNumber: form.referenceNumber.trim() || null,
      issuingAuthority: form.issuingAuthority.trim() || null,
      issueDate: toApiDate(form.issueDate),
      validFrom: toApiDate(form.validFrom),
      validTo: toApiDate(form.validTo),
      remarks: form.remarks.trim() || null,
    };

    setSaving(true);
    let res;
    if (isEdit) {
      res = await GeneralDocumentService.updateRecord({ idGeneralDocumentRecord: record.idGeneralDocumentRecord, ...values });
    } else {
      const fd = new FormData();
      fd.append("IdGeneralDocument", doc.idGeneralDocument);
      Object.entries(values).forEach(([k, v]) => { if (v != null) fd.append(k.charAt(0).toUpperCase() + k.slice(1), v); });
      files.forEach((f) => fd.append("Files", f));
      res = await GeneralDocumentService.uploadRecord(fd);
    }
    setSaving(false);
    if (res.error) return showToast(res.error, "error");
    showToast(res.message || "Saved", "success");
    return onSaved(res.data);
  };

  return (
    <ModalShell
      title={isEdit ? `Correct Details · Version ${record.versionNumber}` : `Upload · ${doc.title}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-sm btn-primary" disabled={saving} onClick={save}>
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Upload"}
          </button>
        </>
      }
    >
      <div className="dm-docline mb-3">
        <span className="fw-semibold">{doc.documentCode}</span>
        <span>{doc.typeName}{doc.subtypeName ? ` / ${doc.subtypeName}` : ""}</span>
        <span>{doc.scope === "OFFICE" ? doc.officeName : "Organisation"}</span>
        <span>{labelOf(MAINTENANCE_TYPES, doc.maintenanceType)}{periodic ? ` · ${labelOf(FREQUENCIES, doc.periodFrequency)}` : ""}</span>
      </div>

      {replacing && (
        <div className="pc-banner bg-label-warning">
          This document already has a valid file (version {doc.versionNumber}). Uploading will mark it superseded; it stays in the history.
        </div>
      )}

      <div className="row g-3">
        {periodic && (
          <>
            <Field label="Period" required className="col-md-4">
              <input className="form-control form-control-sm" maxLength={50} value={form.periodLabel} onChange={(e) => set({ periodLabel: e.target.value })}
                placeholder="e.g. FY 2025-26" />
            </Field>
            <Field label="Period From" required className="col-md-4">
              <DatePicker {...dateProps} selected={form.periodFrom} onChange={(d) => set({ periodFrom: d })} />
            </Field>
            <Field label="Period To" required className="col-md-4">
              <DatePicker {...dateProps} selected={form.periodTo} minDate={form.periodFrom} onChange={(d) => set({ periodTo: d })} />
            </Field>
          </>
        )}
        <Field label="Reference / Certificate No." className="col-md-6">
          <input className="form-control form-control-sm" maxLength={100} value={form.referenceNumber} onChange={(e) => set({ referenceNumber: e.target.value })} />
        </Field>
        <Field label="Issuing Authority" className="col-md-6">
          <input className="form-control form-control-sm" maxLength={150} value={form.issuingAuthority} onChange={(e) => set({ issuingAuthority: e.target.value })} />
        </Field>
        <Field label="Issue Date" className="col-md-4">
          <DatePicker {...dateProps} selected={form.issueDate} maxDate={new Date()} onChange={(d) => set({ issueDate: d })} />
        </Field>
        <Field label="Valid From" className="col-md-4">
          <DatePicker {...dateProps} selected={form.validFrom} onChange={(d) => set({ validFrom: d })} />
        </Field>
        <Field label="Valid To" required={doc.validityRequired} className="col-md-4" hint={doc.validityRequired ? null : "Leave empty if it does not expire"}>
          <DatePicker {...dateProps} selected={form.validTo} minDate={form.validFrom} onChange={(d) => set({ validTo: d })} />
        </Field>
        <Field label="Remarks" required={!!replacing} className="col-12">
          <textarea className="form-control form-control-sm" rows={2} maxLength={500} value={form.remarks} onChange={(e) => set({ remarks: e.target.value })}
            placeholder={replacing ? "Why is it being replaced? e.g. Renewed for 2026-27" : ""} />
        </Field>

        {!isEdit && (
          <div className="col-12">
            <label className="form-label mb-1">Files<span className="text-danger"> *</span></label>
            <div
              className="pc-drop"
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === "Enter") inputRef.current?.click(); }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
            >
              <i className="bx bx-cloud-upload fs-4 d-block"></i>
              Click or drop files here · {(lookups.allowedExtensions || []).join(", ")} · up to {formatSize(lookups.maxFileSizeBytes)} each, {lookups.maxFilesPerUpload} files
            </div>
            <input ref={inputRef} type="file" multiple hidden accept={(lookups.allowedExtensions || []).join(",")}
              onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
            {files.map((f, i) => (
              <div key={`${f.name}-${i}`} className="pc-file">
                <span className="text-break"><i className="bx bx-file me-1"></i>{f.name} <span className="pc-sub">({formatSize(f.size)})</span></span>
                <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => setFiles(files.filter((_, j) => j !== i))}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ModalShell>
  );
};

/* ---------------------------------------------------------------- */
/* Remarks prompt (mark incorrect / superseded, deactivate)           */
/* ---------------------------------------------------------------- */

export const RemarksModal = ({ title, message, confirmLabel, confirmClass = "btn-danger", required = true, hideRemarks = false, onClose, onConfirm }) => {
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const confirm = async () => {
    if (required && !hideRemarks && !remarks.trim()) return showToast("Enter the remarks.", "error");
    setSaving(true);
    const ok = await onConfirm(remarks.trim());
    setSaving(false);
    if (ok) onClose();
    return null;
  };
  return (
    <ModalShell
      title={title}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className={`btn btn-sm ${confirmClass}`} disabled={saving} onClick={confirm}>{saving ? "Saving..." : confirmLabel}</button>
        </>
      }
    >
      {message && <p className="mb-2">{message}</p>}
      {!hideRemarks && (
        <>
          <label className="form-label mb-1">Remarks{required && <span className="text-danger"> *</span>}</label>
          <textarea className="form-control form-control-sm" rows={3} maxLength={500} value={remarks} onChange={(e) => setRemarks(e.target.value)} autoFocus />
        </>
      )}
    </ModalShell>
  );
};
