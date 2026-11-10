import { useState, useEffect, useContext, useCallback, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import { Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import { EmployeeContext } from "../EmployeeManagement";
import { API } from "../../../../redux/api/utils";
import { useLoader } from "../../../../components/LoaderContext";

// Employee Management -> Family Members: spouse, children, parents and others (EmployeeFamilyMembers)
const BASE = "/api/v1/EmployeeFamily";

const RELATIONSHIPS = [
  { value: "SPOUSE", label: "Spouse", gender: "", single: true },
  { value: "SON", label: "Son", gender: "MALE" },
  { value: "DAUGHTER", label: "Daughter", gender: "FEMALE" },
  { value: "FATHER", label: "Father", gender: "MALE", single: true },
  { value: "MOTHER", label: "Mother", gender: "FEMALE", single: true },
  { value: "FATHERINLAW", label: "Father-in-law", gender: "MALE", single: true },
  { value: "MOTHERINLAW", label: "Mother-in-law", gender: "FEMALE", single: true },
  { value: "BROTHER", label: "Brother", gender: "MALE" },
  { value: "SISTER", label: "Sister", gender: "FEMALE" },
  { value: "OTHER", label: "Other", gender: "" },
];
const CHILD = ["SON", "DAUGHTER"];
// Date of birth is optional; when given for these relationships the person must be at least 16 years old today
const ADULT = ["SPOUSE", "FATHER", "MOTHER", "FATHERINLAW", "MOTHERINLAW"];
const MIN_ADULT_AGE = 16;

const emptyForm = {
  relationship: "", memberName: "", gender: "", dateOfBirth: null, contactNumber: "", occupation: "",
  isDependent: false, isNominee: false, nomineePercentage: "", marriageDate: null, certificateNumber: "", divisionNumber: "", remarks: "",
};

const errorOf = (e, fallback) => e?.response?.data?.message || fallback;

const FamilyMembers = () => {
  const { employeeId, setHasUnsavedChanges } = useContext(EmployeeContext) || {};
  const { showLoader, hideLoader } = useLoader();
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const topRef = useRef(null);

  const load = useCallback(async () => {
    if (!employeeId) return;
    showLoader();
    try {
      const res = await API.get(`${BASE}/GetFamilyMembers`, { params: { idEmployee: employeeId } });
      setMembers(res.data?.data || []);
    } catch (e) {
      toast.error(errorOf(e, "Failed to load family members"));
    } finally {
      hideLoader();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  useEffect(() => { load(); }, [load]);

  const set = (field, value) => {
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === "relationship") {
        const r = RELATIONSHIPS.find((x) => x.value === value);
        if (r?.gender) next.gender = r.gender;
        if (value !== "SPOUSE") next.marriageDate = null;
      }
      if (field === "isNominee" && !value) next.nomineePercentage = "";
      return next;
    });
    if (setHasUnsavedChanges) setHasUnsavedChanges(true);
  };

  const reset = () => {
    setForm(emptyForm);
    setEditingId(null);
    if (setHasUnsavedChanges) setHasUnsavedChanges(false);
  };

  const openAdd = () => {
    if (!employeeId) { toast.warning("Please save employee basic details first"); return; }
    reset();
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;
    reset();
    setShowForm(false);
  };

  const edit = (m) => {
    setEditingId(m.idEmployeeFamilyMember);
    setForm({
      relationship: m.relationship || "",
      memberName: m.memberName || "",
      gender: m.gender || "",
      dateOfBirth: m.dateOfBirth ? new Date(m.dateOfBirth) : null,
      contactNumber: m.contactNumber || "",
      occupation: m.occupation || "",
      isDependent: !!m.isDependent,
      isNominee: !!m.isNominee,
      nomineePercentage: m.nomineePercentage ?? "",
      marriageDate: m.marriageDate ? new Date(m.marriageDate) : null,
      certificateNumber: m.certificateNumber || "",
      divisionNumber: m.divisionNumber || "",
      remarks: m.remarks || "",
    });
    setShowForm(true);
  };

  const usedSingles = members.filter((m) => m.idEmployeeFamilyMember !== editingId).map((m) => m.relationship)
    .filter((r) => RELATIONSHIPS.find((x) => x.value === r)?.single);

  const nomineeTotal = members
    .filter((m) => m.isNominee && m.idEmployeeFamilyMember !== editingId)
    .reduce((t, m) => t + (Number(m.nomineePercentage) || 0), 0) + (form.isNominee ? Number(form.nomineePercentage) || 0 : 0);

  const save = async () => {
    if (!employeeId) { toast.warning("Please save employee basic details first"); return; }
    if (!form.relationship) { toast.error("Select the relationship"); return; }
    if (!form.memberName.trim()) { toast.error("Enter the name"); return; }
    if (form.dateOfBirth && moment(form.dateOfBirth).isAfter(moment(), "day")) { toast.error("Date of birth cannot be in the future"); return; }
    if (form.dateOfBirth && ADULT.includes(form.relationship) && moment().diff(moment(form.dateOfBirth), "years") < MIN_ADULT_AGE) {
      toast.error(`A ${label(form.relationship).toLowerCase()} must be at least ${MIN_ADULT_AGE} years old as on today`); return;
    }
    if (form.contactNumber && !/^[0-9+\- ]{6,20}$/.test(form.contactNumber)) { toast.error("Contact number must be 6 to 20 digits"); return; }
    if (form.isNominee && form.nomineePercentage !== "" && (Number(form.nomineePercentage) < 0 || Number(form.nomineePercentage) > 100)) {
      toast.error("Nominee % must be between 0 and 100"); return;
    }
    if (nomineeTotal > 100) { toast.error(`Nominee shares would add up to ${nomineeTotal}%. The total cannot be more than 100%.`); return; }

    const payload = {
      idEmployeeFamilyMember: editingId || 0,
      idEmployee: Number(employeeId),
      relationship: form.relationship,
      memberName: form.memberName.trim(),
      gender: form.gender || null,
      dateOfBirth: form.dateOfBirth ? moment(form.dateOfBirth).format("YYYY-MM-DD") : null,
      contactNumber: form.contactNumber.trim() || null,
      occupation: form.occupation.trim() || null,
      isDependent: form.isDependent,
      isNominee: form.isNominee,
      nomineePercentage: form.isNominee && form.nomineePercentage !== "" ? Number(form.nomineePercentage) : null,
      marriageDate: form.relationship === "SPOUSE" && form.marriageDate ? moment(form.marriageDate).format("YYYY-MM-DD") : null,
      certificateNumber: form.certificateNumber.trim() || null,
      divisionNumber: form.divisionNumber.trim() || null,
      remarks: form.remarks.trim() || null,
    };
    setSaving(true);
    try {
      const res = await API.post(`${BASE}/AddOrUpdateFamilyMember`, payload);
      toast.success(res.data?.message || "Saved");
      reset();
      setShowForm(false);
      load();
    } catch (e) {
      toast.error(errorOf(e, "Failed to save family member"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    const id = deleteId;
    setDeleteId(null);
    showLoader();
    try {
      await API.delete(`${BASE}/DeleteFamilyMember`, { params: { id } });
      toast.success("Family member deleted");
      if (editingId === id) reset();
      load();
    } catch (e) {
      toast.error(errorOf(e, "Failed to delete family member"));
    } finally {
      hideLoader();
    }
  };

  const fmt = (d) => (d ? moment(d).format("DD-MM-YYYY") : "-");
  const age = (d) => (d ? moment().diff(moment(d), "years") : "-");
  const label = (code) => RELATIONSHIPS.find((r) => r.value === code)?.label || code;
  const isChild = CHILD.includes(form.relationship);
  const childCount = members.filter((m) => CHILD.includes(m.relationship)).length;
  const dateProps = { dateFormat: "dd-MM-yyyy", className: "form-control", showYearDropdown: true, showMonthDropdown: true, dropdownMode: "select", wrapperClassName: "d-block", maxDate: new Date() };

  return (
    <div className="row" ref={topRef}>
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="mb-0">Family Members</h6>
            <span className="text-muted small">{members.length} member{members.length === 1 ? "" : "s"} · {childCount} child{childCount === 1 ? "" : "ren"}</span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openAdd}><i className="bx bx-plus me-1"></i>Add Family Member</button>
        </div>
        <div className="pt-3">
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Relationship</th>
                  <th>Name</th>
                  <th>Date of Birth</th>
                  <th>Age</th>
                  <th>Contact</th>
                  <th>Dependent</th>
                  <th>Nominee</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 && (
                  <tr><td colSpan="8" className="text-center">No family members added yet</td></tr>
                )}
                {members.map((m) => (
                  <tr key={m.idEmployeeFamilyMember} className={editingId === m.idEmployeeFamilyMember ? "table-active" : ""}>
                    <td>{label(m.relationship)}</td>
                    <td>
                      {m.memberName}
                      {(m.occupation || m.certificateNumber) && (
                        <div className="text-muted small">{[m.occupation, m.certificateNumber && `Cert. ${m.certificateNumber}`].filter(Boolean).join(" · ")}</div>
                      )}
                    </td>
                    <td>{fmt(m.dateOfBirth)}</td>
                    <td>{age(m.dateOfBirth)}</td>
                    <td>{m.contactNumber || "-"}</td>
                    <td>{m.isDependent ? "Yes" : "No"}</td>
                    <td>{m.isNominee ? `Yes${m.nomineePercentage != null ? ` (${m.nomineePercentage}%)` : ""}` : "No"}</td>
                    <td width="12%" className="text-nowrap">
                      <button className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0 me-1" onClick={() => edit(m)} title="Edit">
                        <i className="bx bx-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-icon btn-outline-danger px-3 border-0" onClick={() => setDeleteId(m.idEmployeeFamilyMember)} title="Delete">
                        <i className="bx bx-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal show={showForm} onHide={closeForm} size="lg" centered backdrop="static" keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title as="h6">{editingId ? "Update Family Member" : "Add Family Member"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label mb-1">Relationship *</label>
                <select className="form-select" value={form.relationship} onChange={(e) => set("relationship", e.target.value)}>
                  <option value="">Select</option>
                  {RELATIONSHIPS.map((r) => (
                    <option key={r.value} value={r.value} disabled={usedSingles.includes(r.value)}>
                      {r.label}{usedSingles.includes(r.value) ? " (added)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label mb-1">Gender</label>
                <select className="form-select" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                  <option value="">Select</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="col-md-5">
                <label className="form-label mb-1">Name *</label>
                <input className="form-control" maxLength={100} value={form.memberName} onChange={(e) => set("memberName", e.target.value)} placeholder="Full name" />
              </div>
              <div className="col-md-4">
                <label className="form-label mb-1">Date of Birth <span className="text-muted small">(optional)</span></label>
                <DatePicker {...dateProps} selected={form.dateOfBirth} onChange={(d) => set("dateOfBirth", d)} placeholderText="Select date"
                  maxDate={ADULT.includes(form.relationship) ? moment().subtract(MIN_ADULT_AGE, "years").toDate() : new Date()} />
                {form.dateOfBirth && <div className="text-muted small">Age {age(form.dateOfBirth)} as on today</div>}
                {ADULT.includes(form.relationship) && !form.dateOfBirth && <div className="text-muted small">Must be at least {MIN_ADULT_AGE} years old</div>}
              </div>
              <div className="col-md-4">
                <label className="form-label mb-1">Contact Number</label>
                <input className="form-control" maxLength={20} value={form.contactNumber} onChange={(e) => set("contactNumber", e.target.value.replace(/[^\d+\- ]/g, ""))} />
              </div>
              {form.relationship === "SPOUSE" && (
                <div className="col-md-4">
                  <label className="form-label mb-1">Marriage Date</label>
                  <DatePicker {...dateProps} selected={form.marriageDate} onChange={(d) => set("marriageDate", d)} placeholderText="Select date" />
                </div>
              )}
              <div className={form.relationship === "SPOUSE" ? "col-md-12" : "col-md-4"}>
                <label className="form-label mb-1">Occupation</label>
                <input className="form-control" maxLength={100} value={form.occupation} onChange={(e) => set("occupation", e.target.value)} />
              </div>
              {isChild && (
                <>
                  <div className="col-md-4">
                    <label className="form-label mb-1">Certificate Number</label>
                    <input className="form-control" maxLength={20} value={form.certificateNumber} onChange={(e) => set("certificateNumber", e.target.value)} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label mb-1">Division Number</label>
                    <input className="form-control" maxLength={20} value={form.divisionNumber} onChange={(e) => set("divisionNumber", e.target.value)} />
                  </div>
                </>
              )}
              <div className="col-md-2 d-flex align-items-center gap-2 mt-4">
                <input type="checkbox" className="form-check-input m-0" id="fm-dependent" checked={form.isDependent} onChange={(e) => set("isDependent", e.target.checked)} />
                <label className="form-check-label" htmlFor="fm-dependent">Dependent</label>
              </div>
              <div className="col-md-2 d-flex align-items-center gap-2 mt-4">
                <input type="checkbox" className="form-check-input m-0" id="fm-nominee" checked={form.isNominee} onChange={(e) => set("isNominee", e.target.checked)} />
                <label className="form-check-label" htmlFor="fm-nominee">Nominee</label>
              </div>
              {form.isNominee && (
                <div className="col-md-4">
                  <label className="form-label mb-1">Nominee share % <span className="text-muted small">(all nominees together: {nomineeTotal}%)</span></label>
                  <input type="number" min="0" max="100" step="0.01" className="form-control" value={form.nomineePercentage} onChange={(e) => set("nomineePercentage", e.target.value)} />
                </div>
              )}
              <div className="col-12">
                <label className="form-label mb-1">Remarks</label>
                <input className="form-control" maxLength={250} value={form.remarks} onChange={(e) => set("remarks", e.target.value)} />
              </div>
            </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-outline-secondary" onClick={closeForm} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Saving..." : editingId ? "Update" : "Save"}</button>
        </Modal.Footer>
      </Modal>

      <Modal show={!!deleteId} onHide={() => setDeleteId(null)} size="sm" centered backdrop="static">
        <Modal.Header className="border-0" closeButton></Modal.Header>
        <Modal.Body><div className="d-flex align-items-center justify-content-center">Delete this family member?</div></Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-secondary px-3" onClick={() => setDeleteId(null)} autoFocus>Cancel</button>
          <button type="button" className="btn btn-primary px-3" onClick={confirmDelete}>Confirm</button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default FamilyMembers;
