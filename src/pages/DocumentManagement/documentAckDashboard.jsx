import { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import GeneralDocumentService, { saveBlob } from "../../core/services/GeneralDocumentService";
import { showToast } from "../../components/ToastNotifications/toastUtils";
import { ModalShell } from "../EmployeeSelfPortal/ProfileChange/shared";
import { formatDate, useDocumentLookups, RemarksModal } from "./shared";

const COLORS = { acknowledged: "#71dd37", viewed: "#ffab00", notViewed: "#ff3e1d" };
const STATUS = {
  ACKNOWLEDGED: { cls: "bg-label-success", text: "Acknowledged" },
  VIEWED: { cls: "bg-label-warning", text: "Viewed, not acknowledged" },
  NOT_VIEWED: { cls: "bg-label-danger", text: "Not viewed" },
};

const pctColor = (p) => (p >= 90 ? COLORS.acknowledged : p >= 50 ? COLORS.viewed : COLORS.notViewed);

// Donut ("wheel") with the acknowledged % in the middle
const AckWheel = ({ acknowledged, viewed, notViewed, onSlice }) => {
  const total = acknowledged + viewed + notViewed;
  const data = [
    { key: "ACKNOWLEDGED", name: "Acknowledged", value: acknowledged, color: COLORS.acknowledged },
    { key: "VIEWED", name: "Viewed, not acknowledged", value: viewed, color: COLORS.viewed },
    { key: "NOT_VIEWED", name: "Not viewed", value: notViewed, color: COLORS.notViewed },
  ];
  const pct = total === 0 ? 0 : Math.round((acknowledged * 1000) / total) / 10;
  return (
    <div className="dm-wheel">
      <ResponsiveContainer width="100%" height={230}>
        <PieChart>
          <Pie data={total === 0 ? [{ name: "No data", value: 1, color: "#e4e6e8" }] : data.filter((d) => d.value > 0)}
            dataKey="value" nameKey="name" innerRadius={68} outerRadius={100} paddingAngle={total === 0 ? 0 : 2} stroke="#fff"
            onClick={(slice) => onSlice && slice?.payload?.key && onSlice(slice.payload.key)} isAnimationActive={false}>
            {(total === 0 ? [{ color: "#e4e6e8" }] : data.filter((d) => d.value > 0)).map((d, i) => <Cell key={i} fill={d.color} cursor={onSlice ? "pointer" : "default"} />)}
          </Pie>
          {total > 0 && <Tooltip formatter={(v, n) => [`${v} (${Math.round((v * 1000) / total) / 10}%)`, n]} />}
        </PieChart>
      </ResponsiveContainer>
      <div className="dm-wheel-center">
        <div className="n">{pct}%</div>
        <div className="l">acknowledged</div>
      </div>
      <div className="dm-legend">
        {data.map((d) => (
          <span key={d.key} role={onSlice ? "button" : undefined} onClick={() => onSlice && onSlice(d.key)}>
            <i style={{ background: d.color }}></i>{d.name}: <b>{d.value}</b>
          </span>
        ))}
      </div>
    </div>
  );
};

const EmployeesModal = ({ doc, initialTab, canRemind, onClose, onReminded }) => {
  const [rows, setRows] = useState(null);
  const [tab, setTab] = useState(initialTab || "NOT_ACK");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    GeneralDocumentService.getAckEmployees(doc.idGeneralDocument).then((res) => {
      if (res.error) { showToast(res.error, "error"); setRows([]); } else setRows(res.data || []);
    });
  }, [doc.idGeneralDocument]);

  const list = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (rows || [])
      .filter((r) => tab === "ALL" || (tab === "ACK" ? r.status === "ACKNOWLEDGED" : r.status !== "ACKNOWLEDGED"))
      .filter((r) => !s || `${r.employeeCode} ${r.employeeName} ${r.departmentName || ""} ${r.officeName || ""}`.toLowerCase().includes(s));
  }, [rows, tab, search]);

  const counts = {
    ACK: (rows || []).filter((r) => r.status === "ACKNOWLEDGED").length,
    NOT_ACK: (rows || []).filter((r) => r.status !== "ACKNOWLEDGED").length,
  };

  const exportList = async (status) => {
    setBusy(true);
    const res = await GeneralDocumentService.exportAckEmployees(doc.idGeneralDocument, status);
    setBusy(false);
    if (res.error) return showToast(res.error, "error");
    return saveBlob(res.blob, res.name || "Not_Acknowledged.xlsx");
  };

  return (
    <ModalShell
      title={`${doc.title} · ${doc.periodLabel || `Version ${doc.versionNumber}`}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-sm btn-outline-success" disabled={busy || counts.NOT_ACK === 0} onClick={() => exportList("NOT_ACKNOWLEDGED")}>
            <i className="bx bx-spreadsheet me-1"></i>Export Not Acknowledged
          </button>
          <button type="button" className="btn btn-sm btn-outline-secondary" disabled={busy || !rows?.length} onClick={() => exportList("ALL")}>Export All</button>
          {canRemind && doc.acknowledgementRequired && (
            <button type="button" className="btn btn-sm btn-primary" disabled={busy || counts.NOT_ACK === 0} onClick={() => setConfirm(true)}>
              <i className="bx bx-envelope me-1"></i>Email Not Acknowledged ({counts.NOT_ACK})
            </button>
          )}
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>Close</button>
        </>
      }
    >
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
        <div className="pc-tabs p-0" style={{ borderBottom: 0 }}>
          {[["NOT_ACK", `Not acknowledged (${counts.NOT_ACK})`], ["ACK", `Acknowledged (${counts.ACK})`], ["ALL", `All (${(rows || []).length})`]].map(([k, l]) => (
            <button key={k} type="button" className={tab === k ? "active" : ""} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        <input className="form-control form-control-sm" style={{ maxWidth: 240 }} placeholder="Search employee" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="table-responsive" style={{ maxHeight: "55vh" }}>
        <table className="table pc-table dm-table mb-0">
          <thead><tr><th>Employee</th><th>Department</th><th>Office</th><th>Email</th><th>Status</th><th>First Viewed</th><th>Acknowledged On</th></tr></thead>
          <tbody>
            {rows == null && <tr><td colSpan={7} className="text-center pc-sub py-4">Loading...</td></tr>}
            {rows != null && list.length === 0 && <tr><td colSpan={7} className="text-center pc-sub py-4">No employees.</td></tr>}
            {list.map((r) => (
              <tr key={r.idEmployee}>
                <td><div className="fw-semibold">{r.employeeName}</div><div className="pc-sub">{r.employeeCode}{r.designationName ? ` · ${r.designationName}` : ""}</div></td>
                <td>{r.departmentName || "—"}</td>
                <td>{r.officeName || "—"}</td>
                <td className="text-break">{r.email || <span className="text-danger">No email</span>}</td>
                <td><span className={`badge ${STATUS[r.status]?.cls}`}>{STATUS[r.status]?.text}</span></td>
                <td>{r.firstViewedDateTime ? formatDate(r.firstViewedDateTime, true) : "—"}</td>
                <td>{r.acknowledgedDateTime ? formatDate(r.acknowledgedDateTime, true) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {confirm && (
        <RemarksModal
          title="Send Reminder Email"
          message={`Send a reminder email to the ${counts.NOT_ACK} employee(s) who have not acknowledged "${doc.title}"?`}
          required={false}
          hideRemarks
          confirmLabel="Send Email"
          confirmClass="btn-primary"
          onClose={() => setConfirm(false)}
          onConfirm={async () => {
            const res = await GeneralDocumentService.sendAckReminders(doc.idGeneralDocument);
            if (res.error) { showToast(res.error, "error"); return false; }
            showToast(res.message, "success");
            onReminded?.();
            return true;
          }}
        />
      )}
    </ModalShell>
  );
};

const DocumentAckDashboard = () => {
  const { lookups } = useDocumentLookups();
  const [idType, setIdType] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [drill, setDrill] = useState(null);         // selected document for the wheel
  const [employees, setEmployees] = useState(null); // { doc, tab }
  const [remindAll, setRemindAll] = useState(false);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await GeneralDocumentService.getAckDashboard(idType ? Number(idType) : null);
    setLoading(false);
    if (res.error) { showToast(res.error, "error"); return; }
    setData(res.data);
    setDrill((d) => (d ? res.data.documents.find((x) => x.idGeneralDocument === d.idGeneralDocument) || null : null));
  };
  useEffect(() => { load(); }, [idType]);

  const docs = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (data?.documents || []).filter((d) => !s || `${d.title} ${d.documentCode} ${d.typeName || ""} ${d.subtypeName || ""}`.toLowerCase().includes(s));
  }, [data, search]);
  const ackDocs = (data?.documents || []).filter((d) => d.acknowledgementRequired);
  const pendingPeople = ackDocs.reduce((n, d) => n + d.viewedOnly + d.notViewed, 0);

  const wheel = drill
    ? { acknowledged: drill.acknowledged, viewed: drill.viewedOnly, notViewed: drill.notViewed }
    : { acknowledged: data?.totalAcknowledged || 0, viewed: data?.totalViewedOnly || 0, notViewed: data?.totalNotViewed || 0 };

  return (
    <div className="container-xxl flex-grow-1 container-p-y pc-page">
      <div className="pc-head d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h4>Document Acknowledgement Dashboard</h4>
        <div className="d-flex gap-2 flex-wrap">
          <select className="form-select form-select-sm" style={{ width: 220 }} value={idType} onChange={(e) => setIdType(e.target.value)}>
            <option value="">All document types</option>
            {(lookups?.types || []).map((t) => <option key={t.idGeneralDocumentType} value={t.idGeneralDocumentType}>{t.typeName}</option>)}
          </select>
          {data?.canSendReminder && (
            <button type="button" className="btn btn-sm btn-primary" disabled={pendingPeople === 0} onClick={() => setRemindAll(true)}>
              <i className="bx bx-envelope me-1"></i>Remind All Pending
            </button>
          )}
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-lg-5">
          <div className="card h-100">
            <div className="card-header py-2 d-flex justify-content-between align-items-center">
              <div>
                <span className={drill ? "pc-sub" : "fw-semibold"} role={drill ? "button" : undefined} onClick={() => setDrill(null)}>
                  {drill ? <u>Organisation</u> : "Organisation"}
                </span>
                {drill && <span className="fw-semibold"> › {drill.title}</span>}
              </div>
              {drill && <button type="button" className="btn btn-sm btn-link p-0" onClick={() => setDrill(null)}>Back</button>}
            </div>
            <div className="card-body pt-1">
              {drill && !drill.acknowledgementRequired && (
                <div className="pc-banner bg-label-info mb-1">This document does not need an acknowledgement; the wheel shows who viewed it.</div>
              )}
              <AckWheel {...wheel} onSlice={drill ? (k) => setEmployees({ doc: drill, tab: k === "ACKNOWLEDGED" ? "ACK" : "NOT_ACK" }) : null} />
              <div className="pc-sub text-center">
                {drill
                  ? `${drill.audience} employee${drill.audience === 1 ? "" : "s"} · click a slice to see them`
                  : `${ackDocs.length} document${ackDocs.length === 1 ? "" : "s"} needing acknowledgement · ${data?.totalExpected || 0} acknowledgements expected · click a document to drill down`}
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-7">
          <div className="card h-100">
            <div className="card-header py-2 fw-semibold">Documents by acknowledgement</div>
            <div className="card-body pt-1 dm-bars">
              {ackDocs.length === 0 && <div className="pc-sub py-4 text-center">{loading ? "Loading..." : "No published documents need acknowledgement."}</div>}
              {ackDocs.slice().sort((a, b) => a.acknowledgedPercent - b.acknowledgedPercent).map((d) => (
                <div key={d.idGeneralDocument} className={`dm-bar ${drill?.idGeneralDocument === d.idGeneralDocument ? "active" : ""}`} role="button" onClick={() => setDrill(d)}>
                  <div className="d-flex justify-content-between"><span className="text-truncate">{d.title}</span><b>{d.acknowledgedPercent}%</b></div>
                  <div className="dm-progress"><span style={{ width: `${d.acknowledgedPercent}%`, background: pctColor(d.acknowledgedPercent) }}></span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header py-2 d-flex justify-content-between align-items-center gap-2 flex-wrap">
          <span className="pc-sub">{loading ? "Loading..." : `${docs.length} published document${docs.length === 1 ? "" : "s"}`}</span>
          <input className="form-control form-control-sm" style={{ maxWidth: 260 }} placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="table-responsive">
          <table className="table pc-table dm-table mb-0">
            <thead><tr><th>Document</th><th>Version</th><th>Published</th><th>Office</th><th className="text-end">Employees</th><th style={{ minWidth: 200 }}>Acknowledged</th><th className="text-end">Viewed</th><th></th></tr></thead>
            <tbody>
              {!loading && docs.length === 0 && (
                <tr><td colSpan={8} className="text-center pc-sub py-4">No documents are visible to employees. Tick “Visible to All Employees” on a subtype in Document Subtypes.</td></tr>
              )}
              {docs.map((d) => (
                <tr key={d.idGeneralDocument} className={drill?.idGeneralDocument === d.idGeneralDocument ? "selected" : ""}>
                  <td style={{ maxWidth: 280 }}>
                    <div className="dm-title text-break">{d.title}</div>
                    <div className="pc-sub">{d.documentCode} · {d.typeName}{d.subtypeName ? ` / ${d.subtypeName}` : ""}</div>
                  </td>
                  <td>{d.periodLabel || `v${d.versionNumber}`}</td>
                  <td>{formatDate(d.publishedDateTime)}</td>
                  <td>{d.officeName || "Organisation"}</td>
                  <td className="text-end">{d.audience}</td>
                  <td>
                    {d.acknowledgementRequired ? (
                      <div role="button" title="Show employees" onClick={() => setEmployees({ doc: d, tab: "ACK" })}>
                        <div className="d-flex justify-content-between"><b style={{ color: pctColor(d.acknowledgedPercent) }}>{d.acknowledgedPercent}%</b><span className="pc-sub">{d.acknowledged} / {d.audience}</span></div>
                        <div className="dm-progress"><span style={{ width: `${d.acknowledgedPercent}%`, background: pctColor(d.acknowledgedPercent) }}></span></div>
                      </div>
                    ) : <span className="pc-sub">Not required</span>}
                  </td>
                  <td className="text-end" role="button" onClick={() => setEmployees({ doc: d, tab: "ALL" })}>{d.viewedPercent}%</td>
                  <td className="text-end text-nowrap">
                    <button type="button" className="btn btn-sm btn-outline-secondary me-1" title="Show on the wheel" onClick={() => setDrill(d)}><i className="bx bx-pie-chart-alt-2"></i></button>
                    <button type="button" className="btn btn-sm btn-outline-primary" title="Employees" onClick={() => setEmployees({ doc: d, tab: "NOT_ACK" })}><i className="bx bx-group"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {employees && (
        <EmployeesModal doc={employees.doc} initialTab={employees.tab} canRemind={data?.canSendReminder}
          onClose={() => setEmployees(null)} onReminded={load} />
      )}
      {remindAll && (
        <RemarksModal
          title="Remind All Pending"
          message={`Email every employee who has not acknowledged a published document (${pendingPeople} pending acknowledgement${pendingPeople === 1 ? "" : "s"}). Each employee gets one email listing all their pending documents.`}
          required={false}
          hideRemarks
          confirmLabel="Send Emails"
          confirmClass="btn-primary"
          onClose={() => setRemindAll(false)}
          onConfirm={async () => {
            const res = await GeneralDocumentService.sendAckReminders(null);
            if (res.error) { showToast(res.error, "error"); return false; }
            showToast(res.message, "success");
            return true;
          }}
        />
      )}
    </div>
  );
};

export default DocumentAckDashboard;
