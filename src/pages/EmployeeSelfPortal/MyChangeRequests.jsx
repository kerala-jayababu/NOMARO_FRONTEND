import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAppNavigate } from "../../utils/useAppNavigate";
import ProfileChangeService from "../../core/services/ProfileChangeService";
import { showToast } from "../../components/ToastNotifications/toastUtils";
import { useLoader } from "../../components/LoaderContext";
import ChangeRequestModal from "./ProfileChange/ChangeRequestModal";
import { CATEGORY_LABELS, DocumentPreview, ModalShell, RequestDetailView, StatusBadge, formatDate } from "./ProfileChange/shared";
import "./ProfileChange/profileChange.css";

const STAT_CARDS = [
  { key: "DRAFT", label: "Draft", color: "#8592a3", match: (s) => s === "DRAFT" },
  { key: "PENDING", label: "Pending Approval", color: "#0b72b9", match: (s) => s === "SUBMITTED" || s === "INTERIM APPROVED" },
  { key: "CLARIFY", label: "Clarification Required", color: "#d48806", match: (s) => s === "CLARIFICATION REQUIRED" },
  { key: "APPROVED", label: "Approved", color: "#28a745", match: (s) => s === "FINAL APPROVED" },
  { key: "REJECTED", label: "Rejected", color: "#dc3545", match: (s) => s === "REJECTED" },
];

const MyChangeRequests = () => {
  const navigate = useAppNavigate();
  const { showLoader, hideLoader } = useLoader();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("");
  const [detail, setDetail] = useState(null);
  const [profile, setProfile] = useState(null);
  const [lookups, setLookups] = useState(null);
  const [edit, setEdit] = useState(null);
  const [preview, setPreview] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const load = useCallback(async () => {
    showLoader();
    const res = await ProfileChangeService.getMyRequests();
    hideLoader();
    if (res.error) showToast(res.error, "error");
    else setRequests(res.data?.data || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id) => {
    showLoader();
    const res = await ProfileChangeService.getMyRequestById(id);
    hideLoader();
    if (res.error) { showToast(res.error, "error"); return; }
    setDetail(res.data?.data);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEdit = async () => {
    showLoader();
    const [p, l] = await Promise.all([
      profile ? Promise.resolve({ data: { data: profile } }) : ProfileChangeService.getMyProfile(),
      lookups ? Promise.resolve({ data: { data: lookups } }) : ProfileChangeService.getLookups(),
    ]);
    hideLoader();
    if (p.error || l.error) { showToast(p.error || l.error, "error"); return; }
    setProfile(p.data.data);
    setLookups(l.data.data);
    setEdit(detail);
  };

  const cancelRequest = async () => {
    setConfirmCancel(false);
    showLoader();
    const res = await ProfileChangeService.cancelRequest(detail.idProfileChangeRequest);
    hideLoader();
    if (res.error) { showToast(res.error, "error"); return; }
    showToast("Request cancelled", "success");
    setDetail(null);
    load();
  };

  const openDocument = async (doc) => {
    const res = await ProfileChangeService.downloadMyRequestDocument(doc.idProfileChangeRequestDocument);
    if (res.error) { showToast(res.error, "error"); return; }
    setPreview({ blob: res.data, contentType: res.contentType, name: doc.originalFileName });
  };

  const shown = useMemo(() => {
    const card = STAT_CARDS.find((c) => c.key === filter);
    return card ? requests.filter((r) => card.match(r.requestStatus)) : requests;
  }, [requests, filter]);

  const banner = (d) => {
    switch (d.requestStatus) {
      case "CLARIFICATION REQUIRED":
        return <div className="pc-banner bad"><b>HR needs more information:</b> {d.approverRemarks}</div>;
      case "REJECTED":
        return <div className="pc-banner bad"><b>Rejected:</b> {d.approverRemarks}</div>;
      case "FINAL APPROVED":
        return <div className="pc-banner ok">Approved on {formatDate(d.finalActionDate)}. Your profile has been updated.</div>;
      case "SUBMITTED":
      case "INTERIM APPROVED":
        return <div className="pc-banner info">Waiting for approval{d.totalLevels ? ` · level ${d.currentLevel || 1} of ${d.totalLevels}` : ""}.</div>;
      case "DRAFT":
        return <div className="pc-banner warn">This request is a draft and has not been sent to HR yet.</div>;
      default:
        return null;
    }
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y pc-page">
      <div className="pc-head">
        <h4>My Change Requests</h4>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate("/dashboard/my-profile")}>
          <i className="bx bx-plus me-1"></i>New Request (My Profile)
        </button>
      </div>

      {detail ? (
        <>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
            <h5 className="m-0">
              {detail.requestNumber || "Draft"} · {detail.requestTypeName} <StatusBadge status={detail.requestStatus} />
            </h5>
            <div className="d-flex gap-2">
              {detail.canCancel && <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setConfirmCancel(true)}>Cancel Request</button>}
              {detail.canEdit && (
                <button type="button" className="btn btn-sm btn-primary" onClick={openEdit}>
                  {detail.requestStatus === "CLARIFICATION REQUIRED" ? "Respond & Resubmit" : "Edit & Submit"}
                </button>
              )}
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setDetail(null)}>← Back to list</button>
            </div>
          </div>
          {banner(detail)}
          <div className="card mb-3"><div className="card-body pc-kv">
            <div><label>Category</label><div>{CATEGORY_LABELS[detail.requestCategory] || detail.requestCategory}</div></div>
            <div><label>Created</label><div>{formatDate(detail.createdDateTime, true)}</div></div>
            <div><label>Submitted</label><div>{formatDate(detail.submittedDate, true)}</div></div>
            <div style={{ gridColumn: "span 2" }}><label>Reason</label><div>{detail.reason || "—"}</div></div>
            {detail.employeeResponse && <div><label>Your response</label><div>{detail.employeeResponse}</div></div>}
          </div></div>
          <RequestDetailView detail={detail} mode="EMPLOYEE" onOpenDocument={openDocument} />
        </>
      ) : (
        <>
          <div className="pc-stats">
            {STAT_CARDS.map((c) => (
              <div key={c.key} className="pc-stat clickable" style={{ borderLeftColor: c.color, outline: filter === c.key ? `2px solid ${c.color}` : "none" }}
                onClick={() => setFilter(filter === c.key ? "" : c.key)}>
                <div className="n">{requests.filter((r) => c.match(r.requestStatus)).length}</div>
                <div className="l">{c.label}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="table-responsive">
              <table className="table pc-table mb-0">
                <thead>
                  <tr><th>Request No.</th><th>Category</th><th>Request Type</th><th>Submitted</th><th>Current Step</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {shown.length === 0 && (
                    <tr><td colSpan={7} className="text-center pc-sub py-4">No requests. Open My Profile and use Request Change to start one.</td></tr>
                  )}
                  {shown.map((r) => (
                    <tr key={r.idProfileChangeRequest}>
                      <td>{r.requestNumber || <span className="pc-sub">Draft</span>}</td>
                      <td>{CATEGORY_LABELS[r.requestCategory] || r.requestCategory}</td>
                      <td>{r.requestTypeName}</td>
                      <td>{formatDate(r.submittedDate)}</td>
                      <td className="pc-sub">
                        {(r.requestStatus === "SUBMITTED" || r.requestStatus === "INTERIM APPROVED") && r.totalLevels
                          ? `Level ${r.currentLevel || 1} of ${r.totalLevels}`
                          : r.requestStatus === "CLARIFICATION REQUIRED" ? "With you" : "—"}
                      </td>
                      <td><StatusBadge status={r.requestStatus} /></td>
                      <td className="text-end">
                        <button type="button" className={`btn btn-sm ${r.requestStatus === "CLARIFICATION REQUIRED" || r.requestStatus === "DRAFT" ? "btn-primary" : "btn-outline-secondary"}`}
                          onClick={() => openDetail(r.idProfileChangeRequest)}>
                          {r.requestStatus === "CLARIFICATION REQUIRED" ? "Respond" : r.requestStatus === "DRAFT" ? "Open" : "View"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {edit && lookups && profile && (
        <ChangeRequestModal
          lookups={lookups}
          profile={profile}
          existing={edit}
          onClose={() => setEdit(null)}
          onDone={async () => { const id = edit.idProfileChangeRequest; setEdit(null); await load(); openDetail(id); }}
        />
      )}
      {confirmCancel && (
        <ModalShell title="Cancel this request?" size="sm" onClose={() => setConfirmCancel(false)}
          footer={<>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setConfirmCancel(false)}>Keep it</button>
            <button type="button" className="btn btn-danger" onClick={cancelRequest}>Cancel Request</button>
          </>}>
          Request {detail?.requestNumber || "(draft)"} will be cancelled and HR will not review it.
        </ModalShell>
      )}
      <DocumentPreview file={preview} onClose={() => setPreview(null)} />
    </div>
  );
};

export default MyChangeRequests;
