import React, { useMemo, useRef, useState } from "react";
import ProfileChangeService from "../../../core/services/ProfileChangeService";
import { showToast } from "../../../components/ToastNotifications/toastUtils";
import { CATEGORY_LABELS, ModalShell, formatDate, formatSize } from "./shared";

const MAX_FILE_MB = 2;
const ALLOWED = [".pdf", ".jpg", ".jpeg", ".png"];

// Current value of a field, as shown on My Profile
const currentValueOf = (type, column, profile, record) => {
  if (!type) return "";
  if (type.tableName === "Employees" || type.tableName === "EmployeeStatutoryDetails") {
    return profile?.values?.[`${type.tableName}.${column}`] || "";
  }
  if (!record) return "";
  switch (type.tableName) {
    case "EmployeeFamilyMembers":
      if (column === "DateOfBirth") return record.dateOfBirth ? formatDate(record.dateOfBirth) : "";
      if (column === "MarriageDate") return record.marriageDate ? formatDate(record.marriageDate) : "";
      if (column === "Relationship") return record.relationshipLabel || record.relationship || "";
      if (column === "IsDependent") return record.isDependent ? "Yes" : "No";
      if (column === "IsNominee") return record.isNominee ? "Yes" : "No";
      if (column === "NomineePercentage") return record.nomineePercentage != null ? `${record.nomineePercentage}%` : "";
      return record[column.charAt(0).toLowerCase() + column.slice(1)] || "";
    case "EmployeeBankAccounts":
      if (column === "IdBank") return record.bankName || "";
      if (column === "IdBankBranch") return record.branchName || "";
      if (column === "AccountNumber") return record.accountNumberMasked || "";
      if (column === "SalaryPercentageDistributed") return `${record.salaryPercentageDistributed}%`;
      return record[column.charAt(0).toLowerCase() + column.slice(1)] || "";
    case "EmployeeDocuments":
      if (column === "DocumentValidTill") return record.documentValidTill ? formatDate(record.documentValidTill) : "";
      if (column === "IdDocumentType") return record.documentTypeName || "";
      return record.remarks || "";
    default:
      return "";
  }
};

const recordsFor = (type, profile) => {
  if (!type?.needsRecord) return [];
  if (type.tableName === "EmployeeFamilyMembers")
    return (profile?.familyMembers || []).map((m) => ({ id: m.idEmployeeFamilyMember, label: `${m.relationshipLabel || m.relationship}: ${m.memberName}`, raw: m }));
  if (type.tableName === "EmployeeBankAccounts")
    return (profile?.bankAccounts || []).map((b) => ({
      id: b.idEmployeeBankAccount,
      label: `${b.bankName || "Bank"} · ${b.accountNumberMasked} (${b.salaryPercentageDistributed}%)`,
      raw: b,
    }));
  if (type.tableName === "EmployeeDocuments")
    return (profile?.documents || []).map((d) => ({
      id: d.idEmployeeDocument,
      label: `${d.documentTypeName || "Document"}${d.documentValidTill ? ` (valid till ${formatDate(d.documentValidTill)})` : ""}`,
      raw: d,
    }));
  return [];
};

/**
 * Create or edit a change request.
 * start = { categories: [...], typeCode, recordId } narrows what the employee can pick.
 * existing = request detail when editing a draft or answering a clarification.
 */
const ChangeRequestModal = ({ lookups, profile, start = {}, existing = null, onClose, onDone }) => {
  const types = useMemo(() => {
    const all = lookups?.requestTypes || [];
    if (existing) return all.filter((t) => t.requestTypeCode === existing.requestTypeCode);
    if (start.typeCode) return all.filter((t) => t.requestTypeCode === start.typeCode);
    if (start.categories?.length) return all.filter((t) => start.categories.includes(t.requestCategory) && !t.needsRecord);
    return all.filter((t) => !t.needsRecord || recordsFor(t, profile).length > 0);
  }, [lookups, start, existing, profile]);

  const [typeCode, setTypeCode] = useState(existing?.requestTypeCode || start.typeCode || (types.length === 1 ? types[0].requestTypeCode : ""));
  const type = types.find((t) => t.requestTypeCode === typeCode);
  const [recordId, setRecordId] = useState(existing?.recordId || start.recordId || "");
  const [values, setValues] = useState(() => {
    const v = {};
    (existing?.changes || []).forEach((c) => {
      if (c.newValueRaw !== null && c.newValueRaw !== undefined) v[c.columnName] = c.newValueRaw;
    });
    return v;
  });
  const [reason, setReason] = useState(existing?.reason || "");
  const [response, setResponse] = useState(existing?.employeeResponse || "");
  const [newFiles, setNewFiles] = useState([]);
  const [removedDocs, setRemovedDocs] = useState([]);
  const [step, setStep] = useState("edit");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const fileInput = useRef(null);

  const isClarification = existing?.requestStatus === "CLARIFICATION REQUIRED";
  const records = recordsFor(type, profile);
  const record = records.find((r) => String(r.id) === String(recordId))?.raw;
  const keptDocs = (existing?.documents || []).filter((d) => !removedDocs.includes(d.idProfileChangeRequestDocument));
  const fileCount = keptDocs.length + newFiles.length;

  const selectedBank = values.IdBank || (record?.idBank ? String(record.idBank) : "");
  const branches = (lookups?.branches || []).filter((b) => !selectedBank || b.parentValue === String(selectedBank));

  const optionLabel = (field, value) => {
    if (!value) return "";
    const list = field.dataType === "bank" ? lookups.banks
      : field.dataType === "branch" ? lookups.branches
        : field.dataType === "doctype" ? lookups.documentTypes
          : field.options;
    return list?.find((o) => String(o.value) === String(value))?.label || value;
  };

  const display = (field, value) => {
    if (!value) return "";
    if (field.dataType === "date") return formatDate(value);
    if (["bank", "branch", "doctype", "gender", "marital", "relationship", "yesno"].includes(field.dataType)) return optionLabel(field, value);
    if (field.dataType === "decimal") return `${value}%`;
    return value;
  };

  const setValue = (column, value) => {
    setValues((prev) => {
      const next = { ...prev, [column]: value };
      if (column === "IdBank") next.IdBankBranch = "";
      return next;
    });
    setErrors((e) => ({ ...e, [column]: undefined }));
  };

  const changedFields = (type?.fields || []).filter((f) => (values[f.column] ?? "").toString().trim() !== "");

  const addFiles = (fileList) => {
    const list = Array.from(fileList || []);
    const accepted = [];
    for (const f of list) {
      const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
      if (!ALLOWED.includes(ext)) { showToast(`${f.name}: only PDF, JPG and PNG files are allowed`, "error"); continue; }
      if (f.size > MAX_FILE_MB * 1024 * 1024) { showToast(`${f.name}: the file must be ${MAX_FILE_MB} MB or smaller`, "error"); continue; }
      accepted.push({ file: f, docTypeId: "" });
    }
    if (fileCount + accepted.length > 5) { showToast("A request can have at most 5 documents", "error"); return; }
    setNewFiles((prev) => [...prev, ...accepted]);
    setErrors((e) => ({ ...e, files: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!type) e.type = "Select what you want to change";
    if (type?.needsRecord && !recordId) e.record = "Select the record";
    if (!reason.trim()) e.reason = "Enter the reason for the change";
    if (isClarification && !response.trim()) e.response = "Enter your response to HR";
    if (type && type.operation === "ADD") {
      type.fields.filter((f) => f.required).forEach((f) => {
        if (!(values[f.column] ?? "").toString().trim()) e[f.column] = `${f.label} is required`;
      });
    }
    if (type && type.operation === "UPDATE" && changedFields.length === 0 && !(type.tableName === "EmployeeDocuments" && fileCount > 0))
      e.form = "Enter at least one new value";
    if (type?.proofRequired && fileCount === 0) e.files = type.tableName === "EmployeeDocuments" ? "Upload the document" : "Upload the supporting document";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildForm = () => {
    const fd = new FormData();
    if (existing?.idProfileChangeRequest) fd.append("IdProfileChangeRequest", existing.idProfileChangeRequest);
    fd.append("RequestTypeCode", typeCode);
    if (type?.needsRecord && recordId) fd.append("RecordId", recordId);
    fd.append("Reason", reason.trim());
    if (isClarification) fd.append("EmployeeResponse", response.trim());
    const payload = {};
    changedFields.forEach((f) => { payload[f.column] = values[f.column].toString().trim(); });
    fd.append("ValuesJson", JSON.stringify(payload));
    removedDocs.forEach((id) => fd.append("RemoveDocumentIds", id));
    newFiles.forEach((f) => {
      fd.append("Files", f.file);
      fd.append("FileDocumentTypeIds", f.docTypeId || "0");
    });
    return fd;
  };

  const save = async (submit) => {
    if (submit && !validate()) { setStep("edit"); return; }
    if (!submit && !type) { setErrors({ type: "Select what you want to change" }); return; }
    setSaving(true);
    const res = submit
      ? await ProfileChangeService.saveAndSubmitRequest(buildForm())
      : await ProfileChangeService.saveRequest(buildForm());
    setSaving(false);
    if (res.error) {
      showToast(res.error, "error");
      // the draft was saved even though the submit failed: reopen it as an edit next time
      if (submit && res.body?.data) onDone?.(null, true);
      return;
    }
    showToast(res.data?.message || (submit ? "Request submitted" : "Draft saved"), "success");
    onDone?.(res.data?.data, submit);
  };

  const renderInput = (f) => {
    const v = values[f.column] ?? "";
    const common = {
      className: `${["gender", "marital", "relationship", "yesno", "bank", "branch", "doctype"].includes(f.dataType) ? "form-select form-select-sm" : "form-control form-control-sm"}${errors[f.column] ? " is-invalid" : ""}`,
      value: v,
      onChange: (e) => setValue(f.column, e.target.value),
    };
    const placeholderOption = <option value="">{type.operation === "ADD" ? "Select" : "(no change)"}</option>;
    switch (f.dataType) {
      case "date":
        return <input type="date" {...common} />;
      case "gender":
      case "marital":
      case "relationship":
      case "yesno":
        return <select {...common}>{placeholderOption}{(f.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
      case "bank":
        return <select {...common}>{placeholderOption}{lookups.banks.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
      case "branch":
        return <select {...common}>{placeholderOption}{branches.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
      case "doctype":
        return <select {...common}>{placeholderOption}{lookups.documentTypes.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
      case "decimal":
        return <input type="number" min="0" max="100" step="0.01" {...common} placeholder={type.operation === "ADD" ? "e.g. 100" : "(no change)"} />;
      default:
        return (
          <input
            type={f.dataType === "email" ? "email" : "text"}
            maxLength={f.maxLength}
            {...common}
            onChange={(e) => setValue(f.column, ["pan", "account"].includes(f.dataType) || f.column === "BranchCode" || f.column === "CurrencyCode" ? e.target.value.toUpperCase() : e.target.value)}
            placeholder={type.operation === "ADD" ? "" : "(no change)"}
          />
        );
    }
  };

  const title = existing
    ? isClarification ? `Respond to HR · ${existing.requestNumber}` : `Edit Draft${existing.requestNumber ? ` · ${existing.requestNumber}` : ""}`
    : "New Change Request";

  const footer = step === "edit" ? (
    <>
      <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>Close</button>
      {!isClarification && <button type="button" className="btn btn-outline-primary" onClick={() => save(false)} disabled={saving || !type}>Save Draft</button>}
      <button type="button" className="btn btn-primary" onClick={() => { if (validate()) setStep("review"); }} disabled={saving || !type}>Review &amp; Submit →</button>
    </>
  ) : (
    <>
      <button type="button" className="btn btn-outline-secondary" onClick={() => setStep("edit")} disabled={saving}>← Back</button>
      <button type="button" className="btn btn-primary" onClick={() => save(true)} disabled={saving}>
        {saving ? "Submitting..." : isClarification ? "Resubmit" : "Submit for Approval"}
      </button>
    </>
  );

  return (
    <ModalShell title={title} onClose={onClose} footer={footer} right={existing && <span className="badge bg-label-secondary">{existing.requestStatus}</span>}>
      <div className="pc-steps">
        <div className="on">1. What to change</div>
        <div className="on">2. New values &amp; proof</div>
        <div className={step === "review" ? "on" : ""}>3. Review &amp; submit</div>
      </div>

      {isClarification && existing.approverRemarks && (
        <div className="pc-banner bad"><b>HR needs more information:</b> {existing.approverRemarks}</div>
      )}

      {step === "edit" && (
        <>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label mb-1">Request Type *</label>
              <select
                className={`form-select form-select-sm${errors.type ? " is-invalid" : ""}`}
                value={typeCode}
                disabled={!!existing || types.length === 1}
                onChange={(e) => { setTypeCode(e.target.value); setValues({}); setRecordId(""); setErrors({}); }}
              >
                <option value="">Select</option>
                {types.map((t) => (
                  <option key={t.requestTypeCode} value={t.requestTypeCode}>
                    {CATEGORY_LABELS[t.requestCategory] || t.requestCategory} · {t.requestTypeName}
                  </option>
                ))}
              </select>
              {errors.type && <div className="text-danger small">{errors.type}</div>}
            </div>
            {type?.needsRecord && (
              <div className="col-md-6">
                <label className="form-label mb-1">Record *</label>
                <select
                  className={`form-select form-select-sm${errors.record ? " is-invalid" : ""}`}
                  value={recordId}
                  disabled={!!existing || !!start.recordId}
                  onChange={(e) => setRecordId(e.target.value)}
                >
                  <option value="">Select</option>
                  {records.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
                {errors.record && <div className="text-danger small">{errors.record}</div>}
              </div>
            )}
          </div>

          {type && type.operation === "REMOVE" && (
            <div className="pc-banner warn mt-3">
              This asks HR to remove <b>{records.find((r) => String(r.id) === String(recordId))?.label || "the selected record"}</b> from your profile.
              {type.tableName === "EmployeeBankAccounts" && " If only one account is left, it will receive 100% of your salary."}
            </div>
          )}

          {type && type.operation !== "REMOVE" && type.fields.length > 0 && (
            <div className="table-responsive mt-3">
              <table className="table table-sm pc-table mb-1">
                <thead>
                  <tr>
                    <th style={{ width: "26%" }}>Field</th>
                    {type.operation !== "ADD" && <th style={{ width: "30%" }}>Current Value</th>}
                    <th>{type.operation === "ADD" ? "Value" : "New Value"}</th>
                  </tr>
                </thead>
                <tbody>
                  {type.fields.map((f) => (
                    <tr key={f.column} className={(values[f.column] ?? "") !== "" ? "changed" : ""}>
                      <td>{f.label}{f.required && type.operation === "ADD" ? " *" : ""}</td>
                      {type.operation !== "ADD" && <td>{currentValueOf(type, f.column, profile, record) || "—"}</td>}
                      <td>
                        {renderInput(f)}
                        {errors[f.column] && <div className="text-danger small">{errors[f.column]}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="pc-sub">
                {type.operation === "ADD" ? "Fields marked * are required." : "Fill in only the fields you want to change. Changed rows are highlighted."}
                {type.tableName === "EmployeeBankAccounts" && " Set the salary % to 100 to move your full salary to this account."}
              </div>
              {errors.form && <div className="text-danger small mt-1">{errors.form}</div>}
            </div>
          )}

          <div className="row g-3 mt-1">
            <div className="col-md-6">
              <label className="form-label mb-1">Reason for change *</label>
              <textarea className={`form-control form-control-sm${errors.reason ? " is-invalid" : ""}`} rows={isClarification ? 2 : 4} maxLength={500}
                value={reason} onChange={(e) => { setReason(e.target.value); setErrors((x) => ({ ...x, reason: undefined })); }} />
              {errors.reason && <div className="text-danger small">{errors.reason}</div>}
              {isClarification && (
                <>
                  <label className="form-label mb-1 mt-2">Your response to HR *</label>
                  <textarea className={`form-control form-control-sm${errors.response ? " is-invalid" : ""}`} rows={2} maxLength={500}
                    value={response} onChange={(e) => { setResponse(e.target.value); setErrors((x) => ({ ...x, response: undefined })); }} />
                  {errors.response && <div className="text-danger small">{errors.response}</div>}
                </>
              )}
            </div>
            <div className="col-md-6">
              <label className="form-label mb-1">
                Supporting documents {type?.proofRequired ? "*" : "(optional)"}
                <span className="pc-sub"> PDF / JPG / PNG, max {MAX_FILE_MB} MB each</span>
              </label>
              {type?.proofHint && <div className="pc-sub mb-1">{type.proofHint}</div>}
              <div className="pc-drop" onClick={() => fileInput.current?.click()}
                onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}>
                <i className="bx bx-upload me-1"></i>Drag files here or <u>browse</u>
              </div>
              <input ref={fileInput} type="file" hidden multiple accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
              {keptDocs.map((d) => (
                <div className="pc-file" key={d.idProfileChangeRequestDocument}>
                  <span><i className="bx bx-file me-1"></i>{d.originalFileName}<span className="pc-sub"> · {formatSize(d.fileSize)} · uploaded</span></span>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setRemovedDocs((p) => [...p, d.idProfileChangeRequestDocument])}>✕</button>
                </div>
              ))}
              {newFiles.map((f, i) => (
                <div className="pc-file" key={`${f.file.name}-${i}`}>
                  <span className="text-truncate"><i className="bx bx-file me-1"></i>{f.file.name}<span className="pc-sub"> · {formatSize(f.file.size)}</span></span>
                  <div className="d-flex gap-1">
                    {type?.tableName !== "EmployeeDocuments" && (
                      <select className="form-select form-select-sm" style={{ width: 150 }} value={f.docTypeId}
                        onChange={(e) => setNewFiles((p) => p.map((x, j) => (j === i ? { ...x, docTypeId: e.target.value } : x)))}>
                        <option value="">Document type</option>
                        {lookups.documentTypes.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    )}
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setNewFiles((p) => p.filter((_, j) => j !== i))}>✕</button>
                  </div>
                </div>
              ))}
              {errors.files && <div className="text-danger small mt-1">{errors.files}</div>}
              {type?.tableName !== "EmployeeDocuments" && newFiles.length > 0 && (
                <div className="pc-sub mt-1">Files with a document type are added to your documents when HR approves.</div>
              )}
            </div>
          </div>
        </>
      )}

      {step === "review" && type && (
        <>
          <div className="pc-banner info">
            Check the details below. After you submit, the request goes to HR for approval, and your profile changes only when it is approved.
          </div>
          <table className="table table-sm pc-table">
            <thead><tr><th>Field</th>{type.operation === "UPDATE" && <th>Current</th>}<th>Requested</th></tr></thead>
            <tbody>
              <tr><td>Request</td>{type.operation === "UPDATE" && <td></td>}<td><b>{type.requestTypeName}</b>{record ? ` · ${records.find((r) => String(r.id) === String(recordId))?.label}` : ""}</td></tr>
              {type.operation === "REMOVE" && <tr className="changed"><td>Action</td><td className="text-danger fw-semibold">Remove this record</td></tr>}
              {changedFields.map((f) => (
                <tr key={f.column} className="changed">
                  <td>{f.label}</td>
                  {type.operation === "UPDATE" && <td className="pc-old">{currentValueOf(type, f.column, profile, record) || "—"}</td>}
                  <td className="pc-new">{display(f, values[f.column])}</td>
                </tr>
              ))}
              <tr><td>Reason</td>{type.operation === "UPDATE" && <td></td>}<td>{reason}</td></tr>
              {isClarification && <tr><td>Response to HR</td>{type.operation === "UPDATE" && <td></td>}<td>{response}</td></tr>}
              <tr>
                <td>Documents</td>{type.operation === "UPDATE" && <td></td>}
                <td>{[...keptDocs.map((d) => d.originalFileName), ...newFiles.map((f) => f.file.name)].join(", ") || "—"}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}
    </ModalShell>
  );
};

export default ChangeRequestModal;
