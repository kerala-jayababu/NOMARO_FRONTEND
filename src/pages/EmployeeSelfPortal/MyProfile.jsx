import React, { useCallback, useEffect, useState } from "react";
import { useAppNavigate } from "../../utils/useAppNavigate";
import ProfileChangeService from "../../core/services/ProfileChangeService";
import { showToast } from "../../components/ToastNotifications/toastUtils";
import { useLoader } from "../../components/LoaderContext";
import ChangeRequestModal from "./ProfileChange/ChangeRequestModal";
import { DocumentPreview, formatDate } from "./ProfileChange/shared";
import "./ProfileChange/profileChange.css";

const TABS = [
  { key: "personal", label: "Personal" },
  { key: "contact", label: "Contact & Address" },
  { key: "family", label: "Family" },
  { key: "identity", label: "Identity & Statutory" },
  { key: "bank", label: "Bank" },
  { key: "documents", label: "Documents" },
];

const E = "Employees";
const S = "EmployeeStatutoryDetails";

const SECTIONS = {
  personal: [
    {
      title: "Basic Information",
      categories: ["PERSONAL"],
      fields: [
        [E, "FirstName", "First Name"], [E, "MiddleName", "Middle Name"], [E, "LastName", "Last Name"],
        [E, "Gender", "Gender"], [E, "DateOfBirth", "Date of Birth"], [E, "MaritalStatus", "Marital Status"],
        [E, "Nationality", "Nationality"], [E, "CitizenShip", "Citizenship"],
      ],
    },
  ],
  contact: [
    {
      title: "Contact Details",
      categories: ["CONTACT"],
      fields: [[E, "PhoneNumber1", "Mobile"], [E, "PhoneNumber2", "Alternate Number"], [E, "WhatsAppNumber", "WhatsApp"], [E, "HomeEmail", "Personal Email"]],
    },
    {
      title: "Address",
      categories: ["ADDRESS"],
      fields: [[E, "Address1", "Address Line 1"], [E, "Address2", "Address Line 2"], [E, "Address3", "Address Line 3"], [E, "City", "City"], [E, "State", "State"], [E, "ZipCode", "PIN / Postal Code"]],
    },
    {
      title: "Emergency Contact",
      categories: ["EMERGENCY"],
      fields: [[E, "EmergencyContactPersonName", "Contact Person"], [E, "EmergencyContactNumbers", "Contact Number"]],
    },
  ],
  identity: [
    {
      title: "Identity",
      categories: ["IDENTITY"],
      fields: [[E, "PassportNumber", "Passport Number"], [E, "NationalIDNumber", "National ID"], [E, "TaxIdNumber", "Tax ID"], [E, "IdNumber", "ID Number"], [E, "WorkExpirationDate", "Work Permit / Visa Expiry"]],
    },
    {
      title: "Statutory (India)",
      categories: ["STATUTORY"],
      fields: [[S, "PAN", "PAN"], [S, "UAN", "UAN"], [S, "PFNumber", "PF Number"], [S, "ESINumber", "ESI Number"]],
    },
  ],
};

const initials = (name) => (name || "?").split(" ").filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase();

const MyProfile = () => {
  const navigate = useAppNavigate();
  const { showLoader, hideLoader } = useLoader();
  const [tab, setTab] = useState("personal");
  const [profile, setProfile] = useState(null);
  const [lookups, setLookups] = useState(null);
  const [modal, setModal] = useState(null);
  const [preview, setPreview] = useState(null);

  const load = useCallback(async () => {
    showLoader();
    const [p, l] = await Promise.all([ProfileChangeService.getMyProfile(), ProfileChangeService.getLookups()]);
    hideLoader();
    if (p.error) showToast(p.error, "error");
    else setProfile(p.data?.data);
    if (l.error) showToast(l.error, "error");
    else setLookups(l.data?.data);
    // loader functions are re-created on every render, so they are left out on purpose
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const pendingFor = (table, column, recordId = null) =>
    (profile?.pendingFields || []).find((p) => p.tableName === table && (column === "*" || p.columnName === column || p.columnName === "*") &&
      (recordId === null ? p.recordId === null : p.recordId === recordId));

  const openRequests = new Set((profile?.pendingFields || []).map((p) => p.idProfileChangeRequest)).size;

  const hasType = (code) => (lookups?.requestTypes || []).some((t) => t.requestTypeCode === code);
  const hasCategory = (cats) => (lookups?.requestTypes || []).some((t) => cats.includes(t.requestCategory) && !t.needsRecord);

  const openDocument = async (doc) => {
    const res = await ProfileChangeService.downloadMyDocument(doc.idEmployeeDocument);
    if (res.error) { showToast(res.error, "error"); return; }
    setPreview({ blob: res.data, contentType: res.contentType, name: doc.documentTypeName || "Document" });
  };

  const Pending = ({ p }) => (p ? <span className="pc-pending" title={`Request ${p.requestNumber || ""} is open`}>● Pending</span> : null);

  const FieldGrid = ({ section }) => (
    <>
      <div className="pc-section">
        <h6>{section.title}</h6>
        {hasCategory(section.categories) && (
          <button type="button" className="btn btn-sm btn-primary" onClick={() => setModal({ categories: section.categories })}>
            <i className="bx bx-edit-alt me-1"></i>Request Change
          </button>
        )}
      </div>
      <div className="pc-grid">
        {section.fields.map(([table, column, label]) => (
          <div className="pc-field" key={column}>
            <label>{label}<Pending p={pendingFor(table, column)} /></label>
            <div>{profile?.values?.[`${table}.${column}`] || "—"}</div>
          </div>
        ))}
      </div>
    </>
  );

  if (!profile) return <div className="container-xxl flex-grow-1 container-p-y pc-page"><div className="card"><div className="card-body">Loading...</div></div></div>;
  const emp = profile.employee;

  return (
    <div className="container-xxl flex-grow-1 container-p-y pc-page">
      <div className="pc-head">
        <h4>My Profile</h4>
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => navigate("/dashboard/my-change-requests")}>
          <i className="bx bx-transfer me-1"></i>My Change Requests{openRequests ? ` (${openRequests} open)` : ""}
        </button>
      </div>

      <div className="card mb-3">
        <div className="card-body pc-profile-card">
          {emp.photoBase64 ? <img className="pc-photo" src={emp.photoBase64} alt="" /> : <div className="pc-photo">{initials(emp.fullName)}</div>}
          <div style={{ flex: 1, minWidth: 220 }}>
            <h5 className="mb-1">{emp.fullName}</h5>
            <div className="pc-meta">
              <span>Employee Code <b>{emp.employeeCode || "—"}</b></span>
              <span>Department <b>{emp.departmentName || "—"}</b></span>
              <span>Designation <b>{emp.designationName || "—"}</b></span>
              <span>Grade <b>{emp.gradeName || "—"}</b></span>
              <span>Reporting To <b>{emp.reportingToName || "—"}</b></span>
              <span>Joined <b>{formatDate(emp.joiningDate)}</b></span>
              <span>Official Email <b>{emp.officialEmail || "—"}</b></span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="pc-tabs">
          {TABS.map((t) => (
            <button key={t.key} type="button" className={tab === t.key ? "active" : ""} onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </div>
        <div className="card-body">
          {openRequests > 0 && (
            <div className="pc-banner warn">
              You have {openRequests} open request{openRequests > 1 ? "s" : ""}. Fields under review are marked <span className="pc-pending">● Pending</span>.
            </div>
          )}
          <div className="pc-sub mb-3">
            Your details are read-only here. Use <b>Request Change</b> to send a change to HR. Your profile is updated after HR approves it.
            Official details (code, department, designation, grade, joining date and official email) are maintained by HR.
          </div>

          {SECTIONS[tab] && SECTIONS[tab].map((s) => <FieldGrid key={s.title} section={s} />)}

          {tab === "family" && (
            <>
              <div className="pc-section">
                <h6>Family Members</h6>
                {hasType("FAMILY_ADD") && (
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => setModal({ typeCode: "FAMILY_ADD" })}>
                    <i className="bx bx-plus me-1"></i>Add Family Member
                  </button>
                )}
              </div>
              <div className="table-responsive">
                <table className="table table-sm pc-table">
                  <thead><tr><th>Relationship</th><th>Name</th><th>Date of Birth</th><th>Gender</th><th>Dependent</th><th>Nominee</th><th></th></tr></thead>
                  <tbody>
                    {(profile.familyMembers || []).length === 0 && <tr><td colSpan={7} className="text-center pc-sub py-3">No family members recorded.</td></tr>}
                    {(profile.familyMembers || []).map((m) => {
                      const p = pendingFor("EmployeeFamilyMembers", "*", m.idEmployeeFamilyMember);
                      return (
                        <tr key={m.idEmployeeFamilyMember}>
                          <td>{m.relationshipLabel || m.relationship}</td>
                          <td>{m.memberName}<Pending p={p} /></td>
                          <td>{formatDate(m.dateOfBirth)}</td>
                          <td>{m.gender || "—"}</td>
                          <td>{m.isDependent ? "Yes" : "No"}</td>
                          <td>{m.isNominee ? `Yes${m.nomineePercentage != null ? ` (${m.nomineePercentage}%)` : ""}` : "No"}</td>
                          <td className="text-end text-nowrap">
                            {!p && hasType("FAMILY_EDIT") && <button type="button" className="btn btn-sm btn-outline-primary me-1" onClick={() => setModal({ typeCode: "FAMILY_EDIT", recordId: m.idEmployeeFamilyMember })}>Edit</button>}
                            {!p && hasType("FAMILY_REMOVE") && <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setModal({ typeCode: "FAMILY_REMOVE", recordId: m.idEmployeeFamilyMember })}>Remove</button>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === "bank" && (
            <>
              <div className="pc-section">
                <h6>Bank Accounts</h6>
                {hasType("BANK_ADD") && (
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => setModal({ typeCode: "BANK_ADD" })}>
                    <i className="bx bx-plus me-1"></i>Add Bank Account
                  </button>
                )}
              </div>
              <div className="table-responsive">
                <table className="table table-sm pc-table">
                  <thead><tr><th>Bank</th><th>Branch</th><th>Account No.</th><th>IFSC / Branch Code</th><th>Currency</th><th>Salary %</th><th></th></tr></thead>
                  <tbody>
                    {profile.bankAccounts.length === 0 && <tr><td colSpan={7} className="text-center pc-sub py-3">No bank account recorded.</td></tr>}
                    {profile.bankAccounts.map((b) => {
                      const p = pendingFor("EmployeeBankAccounts", "*", b.idEmployeeBankAccount);
                      return (
                        <tr key={b.idEmployeeBankAccount}>
                          <td>{b.bankName || "—"}<Pending p={p} /></td>
                          <td>{b.branchName || "—"}</td>
                          <td style={{ letterSpacing: 1 }}>{b.accountNumberMasked}</td>
                          <td>{b.branchCode || "—"}</td>
                          <td>{b.currencyCode}</td>
                          <td>{b.salaryPercentageDistributed}%</td>
                          <td className="text-end text-nowrap">
                            {!p && hasType("BANK_EDIT") && <button type="button" className="btn btn-sm btn-outline-primary me-1" onClick={() => setModal({ typeCode: "BANK_EDIT", recordId: b.idEmployeeBankAccount })}>Change</button>}
                            {!p && hasType("BANK_REMOVE") && profile.bankAccounts.length > 1 && <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setModal({ typeCode: "BANK_REMOVE", recordId: b.idEmployeeBankAccount })}>Remove</button>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="pc-sub">Account numbers are masked. Bank changes are approved by HR and payroll before they are used for salary.</div>
            </>
          )}

          {tab === "documents" && (
            <>
              <div className="pc-section">
                <h6>My Documents</h6>
                {hasType("DOC_ADD") && (
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => setModal({ typeCode: "DOC_ADD" })}>
                    <i className="bx bx-plus me-1"></i>Add Document
                  </button>
                )}
              </div>
              <div className="table-responsive">
                <table className="table table-sm pc-table">
                  <thead><tr><th>Document Type</th><th>Valid Till</th><th>Remarks</th><th>Added</th><th></th></tr></thead>
                  <tbody>
                    {profile.documents.length === 0 && <tr><td colSpan={5} className="text-center pc-sub py-3">No documents yet.</td></tr>}
                    {profile.documents.map((d) => {
                      const p = pendingFor("EmployeeDocuments", "*", d.idEmployeeDocument);
                      return (
                        <tr key={d.idEmployeeDocument}>
                          <td>{d.documentTypeName || "—"}<Pending p={p} /></td>
                          <td>{formatDate(d.documentValidTill)}</td>
                          <td>{d.remarks || "—"}</td>
                          <td>{formatDate(d.createdAt)}</td>
                          <td className="text-end text-nowrap">
                            {d.hasFile && <button type="button" className="btn btn-sm btn-outline-secondary me-1" onClick={() => openDocument(d)}>View</button>}
                            {!p && hasType("DOC_REPLACE") && <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setModal({ typeCode: "DOC_REPLACE", recordId: d.idEmployeeDocument })}>Replace</button>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {modal && lookups && (
        <ChangeRequestModal
          lookups={lookups}
          profile={profile}
          start={modal}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); load(); }}
        />
      )}
      <DocumentPreview file={preview} onClose={() => setPreview(null)} />
    </div>
  );
};

export default MyProfile;
