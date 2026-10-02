import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine, LabelList,
} from "recharts";
import { useLoader } from "../../components/LoaderContext";
import SalaryDashboardService from "../../core/services/SalaryDashboardService";

// ── Formatting ───────────────────────────────────────────────────────────────

const inr = (v) => {
  const n = Math.round(Number(v) || 0);
  return (n < 0 ? "-₹" : "₹") + Math.abs(n).toLocaleString("en-IN");
};

// ₹1.06 Cr / ₹8.42 L / ₹12K
const inrShort = (v) => {
  const n = Number(v) || 0;
  const a = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  const trim = (s) => s.replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
  if (a >= 1e7) return `${sign}₹${trim((a / 1e7).toFixed(2))} Cr`;
  if (a >= 1e5) return `${sign}₹${trim((a / 1e5).toFixed(2))} L`;
  if (a >= 1e3) return `${sign}₹${trim((a / 1e3).toFixed(1))}K`;
  return `${sign}₹${Math.round(a)}`;
};

const pctChange = (cur, prev) => (prev ? ((cur - prev) / Math.abs(prev)) * 100 : null);
const signedPct = (v) => (v === null || v === undefined ? "" : `${v > 0 ? "+" : ""}${v.toFixed(1)}%`);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-") : "");

// ── Colours (series colours follow the entity, in a fixed order) ─────────────

const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];
const POSITIVE = "#2a78d6";
const NEGATIVE = "#e34948";
const TOTAL = "#898781";
const HEAT = ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b"];
const GRID = "#e9ecef";
const AXIS_TICK = { fontSize: 11, fill: "#8592a3" };

const TABS = [
  { id: "overview", label: "Payroll Overview" },
  { id: "department", label: "Department & Office" },
  { id: "statutory", label: "Statutory & Tax" },
  { id: "variance", label: "Variance & Exceptions" },
  { id: "distribution", label: "Salary Distribution" },
];

// ── Small building blocks ────────────────────────────────────────────────────

const ChartCard = ({ title, subtitle, children, className = "" }) => (
  <div className={`card h-100 ${className}`}>
    <div className="card-header pb-2">
      <h6 className="m-0">{title}</h6>
      {subtitle && <small className="text-muted">{subtitle}</small>}
    </div>
    <div className="card-body pt-2">{children}</div>
  </div>
);

const Tile = ({ label, value, note, big }) => (
  <div className="card h-100">
    <div className="card-body py-3">
      <div className="small text-muted">{label}</div>
      <div className={`fw-bold ${big ? "fs-3" : "fs-5"}`} style={{ color: "var(--heading-color)" }}>{value}</div>
      {note && <div className="small text-muted">{note}</div>}
    </div>
  </div>
);

const Empty = ({ text = "No data for the selected filters." }) => (
  <div className="text-center text-muted small py-5">{text}</div>
);

const MoneyTooltip = ({ active, payload, label, formatter = inr }) => {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => p.dataKey !== "base" && p.value !== undefined);
  return (
    <div className="bg-white border rounded shadow-sm px-3 py-2 small">
      <div className="text-muted mb-1">{label}</div>
      {rows.map((p) => (
        <div key={p.dataKey} className="d-flex align-items-center gap-2">
          <span style={{ width: 12, height: 3, background: p.color || p.fill, display: "inline-block" }} />
          <span className="text-muted">{p.name}</span>
          <b className="ms-auto ps-3">{formatter(p.value)}</b>
        </div>
      ))}
    </div>
  );
};

// ── Page ─────────────────────────────────────────────────────────────────────

function SalaryDashboard() {
  const { showLoader, hideLoader } = useLoader();
  const [filters, setFilters] = useState({ months: [], offices: [], departments: [] });
  const [idSalaryMonth, setIdSalaryMonth] = useState("");
  const [idOffice, setIdOffice] = useState("");
  const [idDepartment, setIdDepartment] = useState("");
  const [approvedOnly, setApprovedOnly] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState(null);

  useEffect(() => {
    showLoader();
    SalaryDashboardService.getFilterOptions().then((res) => {
      hideLoader();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      const options = res.data?.data || { months: [], offices: [], departments: [] };
      setFilters(options);
      if (options.months?.length) setIdSalaryMonth(String(options.months[0].idSalaryMonth));
    });
  }, []);

  useEffect(() => {
    if (!idSalaryMonth) return;
    showLoader();
    SalaryDashboardService.getSalaryDashboard({
      idSalaryMonth: Number(idSalaryMonth),
      idOffice: idOffice ? Number(idOffice) : null,
      idDepartment: idDepartment ? Number(idDepartment) : null,
      approvedOnly,
    }).then((res) => {
      hideLoader();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setData(res.data?.data || null);
    });
  }, [idSalaryMonth, idOffice, idDepartment, approvedOnly]);

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="card mb-3">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2 pb-3">
          <div>
            <h5 className="m-0">Salary Dashboard</h5>
            {data && (
              <small className="text-muted">
                {data.salaryMonthText}
                {data.previousMonthText ? ` · compared with ${data.previousMonthText}` : ""}
                {` · ${data.approvedOnly ? "approved salaries" : "all generated salaries (excluding rejected)"}`}
              </small>
            )}
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <select className="form-select form-select-sm" style={{ width: 140 }} value={idSalaryMonth}
              onChange={(e) => setIdSalaryMonth(e.target.value)} aria-label="Salary month">
              {filters.months.length === 0 && <option value="">No salary months</option>}
              {filters.months.map((m) => (
                <option key={m.idSalaryMonth} value={m.idSalaryMonth}>{m.salaryMonthText}</option>
              ))}
            </select>
            <select className="form-select form-select-sm" style={{ width: 190 }} value={idOffice}
              onChange={(e) => setIdOffice(e.target.value)} aria-label="Office">
              <option value="">All Offices</option>
              {filters.offices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <select className="form-select form-select-sm" style={{ width: 190 }} value={idDepartment}
              onChange={(e) => setIdDepartment(e.target.value)} aria-label="Department">
              <option value="">All Departments</option>
              {filters.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select className="form-select form-select-sm" style={{ width: 200 }} value={approvedOnly ? "1" : "0"}
              onChange={(e) => setApprovedOnly(e.target.value === "1")} aria-label="Salary status">
              <option value="1">Approved salaries</option>
              <option value="0">All generated salaries</option>
            </select>
          </div>
        </div>
        <div className="px-4">
          <ul className="nav nav-tabs" role="tablist" style={{ borderBottom: "none", gap: "0.25rem" }}>
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <li key={tab.id} className="nav-item" role="presentation">
                  <button type="button" role="tab" aria-selected={active}
                    className={`nav-link ${active ? "active" : ""}`}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      border: "none",
                      borderBottom: active ? "3px solid var(--primary-color)" : "3px solid transparent",
                      color: active ? "var(--primary-color)" : "#697a8d",
                      fontWeight: active ? 600 : 400,
                      padding: "0.5rem 1rem",
                      background: "transparent",
                    }}>
                    {tab.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {!data && <div className="card"><div className="card-body"><Empty text={filters.months.length ? "Loading…" : "No generated salaries found yet."} /></div></div>}

      {data && activeTab === "overview" && <OverviewTab data={data} />}
      {data && activeTab === "department" && <DepartmentTab data={data} />}
      {data && activeTab === "statutory" && <StatutoryTab data={data} />}
      {data && activeTab === "variance" && <VarianceTab data={data} />}
      {data && activeTab === "distribution" && <DistributionTab data={data} />}
    </div>
  );
}

// ── 1. Payroll overview ──────────────────────────────────────────────────────

function OverviewTab({ data }) {
  const s = data.summary;
  const p = data.previousSummary;
  const vsPrev = (cur, prev) => (p ? `${signedPct(pctChange(cur, prev))} vs ${data.previousMonthText}` : "");

  const trend = data.trend.map((t) => ({
    month: t.salaryMonthText,
    net: t.netPay,
    deductions: t.totalDeductions,
    employer: t.employerContribution,
    cost: t.employerCost,
    employees: t.employeesPaid,
  }));
  const departments = data.byDepartment.filter((d) => d.employees > 0);

  return (
    <>
      <div className="row g-3 mb-3">
        <div className="col-md-4 col-lg-4"><Tile big label="Total employer cost" value={inrShort(s.employerCost)} note={vsPrev(s.employerCost, p?.employerCost)} /></div>
        <div className="col-md-4 col-lg-4"><Tile big label="Net pay" value={inrShort(s.netPay)} note={vsPrev(s.netPay, p?.netPay)} /></div>
        <div className="col-md-4 col-lg-4"><Tile big label="Employees paid" value={s.employeesPaid.toLocaleString("en-IN")}
          note={p ? `${s.joinedPayroll} joined payroll · ${s.leftPayroll} left payroll` : ""} /></div>
        <div className="col-md-3"><Tile label="Gross earnings" value={inrShort(s.grossEarnings)} note={vsPrev(s.grossEarnings, p?.grossEarnings)} /></div>
        <div className="col-md-3"><Tile label="Employee deductions" value={inrShort(s.totalDeductions)} note={vsPrev(s.totalDeductions, p?.totalDeductions)} /></div>
        <div className="col-md-3"><Tile label="Average cost per employee" value={inr(s.averageCostPerEmployee)} note={vsPrev(s.averageCostPerEmployee, p?.averageCostPerEmployee)} /></div>
        <div className="col-md-3"><Tile label="Statutory (PF, ESI, PT, LWF, TDS)" value={inrShort(s.statutoryTotal)} note={vsPrev(s.statutoryTotal, p?.statutoryTotal)} /></div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-lg-8">
          <ChartCard title="Monthly employer cost" subtitle="Net pay + employee deductions + employer contributions">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} />
                <YAxis tickFormatter={inrShort} tick={AXIS_TICK} tickLine={false} axisLine={false} width={70} />
                <Tooltip content={<MoneyTooltip />} cursor={{ fill: "rgba(13,56,77,0.05)" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="net" name="Net pay" stackId="a" fill={SERIES[0]} maxBarSize={28} />
                <Bar dataKey="deductions" name="Employee deductions" stackId="a" fill={SERIES[1]} maxBarSize={28} />
                <Bar dataKey="employer" name="Employer contributions" stackId="a" fill={SERIES[2]} maxBarSize={28} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <div className="col-lg-4">
          <ChartCard title="Employer cost by department" subtitle={data.salaryMonthText}>
            {departments.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={Math.max(220, departments.length * 34)}>
                <BarChart data={departments} layout="vertical" margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={130} tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <Tooltip content={<MoneyTooltip />} cursor={{ fill: "rgba(13,56,77,0.05)" }} />
                  <Bar dataKey="employerCost" name="Employer cost" fill={SERIES[0]} maxBarSize={18} radius={[0, 4, 4, 0]}
                    label={{ position: "right", formatter: inrShort, fontSize: 11, fill: "#566a7f" }} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-8">
          <ChartCard title="Employees paid" subtitle="Number of employees with a salary each month">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} />
                <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
                <Tooltip content={<MoneyTooltip formatter={(v) => Number(v).toLocaleString("en-IN")} />} />
                <Line type="monotone" dataKey="employees" name="Employees paid" stroke={SERIES[0]} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <div className="col-lg-4">
          <ChartCard title="Salary status" subtitle={`${data.salaryMonthText} · all salary records`}>
            {data.statusCounts.length === 0 ? <Empty /> : (
              <table className="table table-sm mb-0">
                <tbody>
                  {data.statusCounts.map((c) => (
                    <tr key={c.name}>
                      <td>
                        <span className={`badge ${c.name.toUpperCase() === "APPROVED" ? "bg-label-success" : c.name.toUpperCase() === "REJECTED" ? "bg-label-danger" : "bg-label-warning"}`}>
                          {c.name}
                        </span>
                      </td>
                      <td className="text-end fw-semibold">{c.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ChartCard>
        </div>
      </div>
    </>
  );
}

// ── 2. Department & office ───────────────────────────────────────────────────

function DepartmentTab({ data }) {
  const departments = [...new Set(data.departmentOffice.map((c) => c.departmentName))].sort();
  const offices = [...new Set(data.departmentOffice.map((c) => c.officeName))].sort();
  const cell = (d, o) => data.departmentOffice.find((c) => c.departmentName === d && c.officeName === o);
  const max = Math.max(1, ...data.departmentOffice.map((c) => c.employerCost));
  const heatIndex = (v) => Math.min(HEAT.length - 1, Math.floor((v / max) * HEAT.length * 0.999));

  const perEmployee = data.byDepartment
    .filter((d) => d.employees > 0)
    .map((d) => ({ name: d.name, value: d.employerCost / d.employees, employees: d.employees }))
    .sort((a, b) => b.value - a.value);

  const change = data.byDepartment
    .map((d) => ({ name: d.name, value: d.employerCost - d.previousEmployerCost }))
    .filter((d) => d.value !== 0)
    .sort((a, b) => b.value - a.value);
  // Symmetric axis with head-room so the value labels never run into the department names
  const changeMax = Math.max(1, ...change.map((c) => Math.abs(c.value))) * 1.4;

  const officeTrend = data.trend.map((t, i) => {
    const row = { month: t.salaryMonthText };
    data.byOffice.forEach((o) => { row[`o${o.id ?? "na"}`] = o.employerCostTrend[i]; });
    return row;
  });

  return (
    <>
      <div className="card mb-3">
        <div className="card-header pb-2">
          <h6 className="m-0">Employer cost: department × office</h6>
          <small className="text-muted">{data.salaryMonthText} · darker = higher cost · hover a cell for headcount</small>
        </div>
        <div className="card-body pt-2">
          {departments.length === 0 ? <Empty /> : (
            <div className="table-responsive">
              <table className="table table-sm mb-0" style={{ borderCollapse: "separate", borderSpacing: 2 }}>
                <thead>
                  <tr>
                    <th>Department</th>
                    {offices.map((o) => <th key={o} className="text-end">{o}</th>)}
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((d) => {
                    const total = data.departmentOffice.filter((c) => c.departmentName === d).reduce((a, c) => a + c.employerCost, 0);
                    return (
                      <tr key={d}>
                        <td>{d}</td>
                        {offices.map((o) => {
                          const c = cell(d, o);
                          if (!c) return <td key={o} className="text-end text-muted">—</td>;
                          const idx = heatIndex(c.employerCost);
                          return (
                            <td key={o} className="text-end rounded" title={`${c.employees} employees · ${inr(c.employerCost)}`}
                              style={{ background: HEAT[idx], color: idx >= 3 ? "#fff" : "#0b0b0b" }}>
                              {inrShort(c.employerCost)}
                            </td>
                          );
                        })}
                        <td className="text-end fw-semibold">{inrShort(total)}</td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td className="fw-semibold">Total</td>
                    {offices.map((o) => (
                      <td key={o} className="text-end fw-semibold">
                        {inrShort(data.departmentOffice.filter((c) => c.officeName === o).reduce((a, c) => a + c.employerCost, 0))}
                      </td>
                    ))}
                    <td className="text-end fw-bold">{inrShort(data.summary.employerCost)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-lg-6">
          <ChartCard title="Cost per employee by department" subtitle={`Company average ${inr(data.summary.averageCostPerEmployee)}`}>
            {perEmployee.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={Math.max(220, perEmployee.length * 34)}>
                <BarChart data={perEmployee} layout="vertical" margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={140} tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <Tooltip content={<MoneyTooltip />} cursor={{ fill: "rgba(13,56,77,0.05)" }} />
                  <Bar dataKey="value" name="Cost per employee" fill={SERIES[0]} maxBarSize={18} radius={[0, 4, 4, 0]}
                    label={{ position: "right", formatter: inrShort, fontSize: 11, fill: "#566a7f" }} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
        <div className="col-lg-6">
          <ChartCard title="Change in employer cost vs previous month" subtitle={data.previousMonthText ? `${data.salaryMonthText} vs ${data.previousMonthText}` : "No previous month"}>
            {change.length === 0 ? <Empty text="No change from the previous month." /> : (
              <ResponsiveContainer width="100%" height={Math.max(220, change.length * 34)}>
                <BarChart data={change} layout="vertical" margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
                  <XAxis type="number" hide domain={[-changeMax, changeMax]} />
                  <YAxis type="category" dataKey="name" width={140} tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <ReferenceLine x={0} stroke="#c3c2b7" />
                  <Tooltip content={<MoneyTooltip />} cursor={{ fill: "rgba(13,56,77,0.05)" }} />
                  <Bar dataKey="value" name="Change" maxBarSize={18}
                    label={{ position: "right", formatter: inrShort, fontSize: 11, fill: "#566a7f" }}>
                    {change.map((c) => <Cell key={c.name} fill={c.value >= 0 ? POSITIVE : NEGATIVE} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </div>

      <ChartCard title="Employer cost by office" subtitle="Monthly employer cost per office">
        {data.byOffice.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={officeTrend} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} />
              <YAxis tickFormatter={inrShort} tick={AXIS_TICK} tickLine={false} axisLine={false} width={70} />
              <Tooltip content={<MoneyTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {data.byOffice.slice(0, SERIES.length).map((o, i) => (
                <Line key={o.name} type="monotone" dataKey={`o${o.id ?? "na"}`} name={o.name}
                  stroke={SERIES[i]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </>
  );
}

// ── 3. Statutory & tax ───────────────────────────────────────────────────────

function StatutoryTab({ data }) {
  const visible = data.statutory.filter((s) => s.code !== "LWF" || s.total !== 0 || s.previousTotal !== 0);
  const total = visible.reduce((a, s) => a + s.total, 0);
  const trend = data.trend.map((t) => ({ month: t.salaryMonthText, pf: t.pf, esi: t.esi, pt: t.pt, lwf: t.lwf, tds: t.tds }));
  const showLwf = visible.some((s) => s.code === "LWF");
  const today = new Date();

  const status = (s) => {
    if (!s.dueDate) return <span className="text-muted">As per state schedule</span>;
    const due = new Date(s.dueDate);
    const days = Math.ceil((due - today) / 86400000);
    if (days < 0) return <span className="text-muted">Was due {fmtDate(due)}</span>;
    return (
      <span className={days <= 7 ? "text-warning fw-semibold" : ""}>
        {fmtDate(due)} <small className="text-muted">({days === 0 ? "today" : `in ${days} days`})</small>
      </span>
    );
  };

  return (
    <>
      <div className="row g-3 mb-3">
        {visible.map((s) => (
          <div key={s.code} className="col">
            <Tile label={s.name} value={inrShort(s.total)}
              note={`${s.employees} employees${data.previousMonthText ? ` · ${signedPct(pctChange(s.total, s.previousTotal))} vs ${data.previousMonthText}` : ""}`} />
          </div>
        ))}
      </div>

      <div className="row g-3 mb-3">
        <div className="col-lg-7">
          <ChartCard title="Remittance summary" subtitle={`${data.salaryMonthText} salary · usual due dates`}>
            <table className="table table-sm mb-0">
              <thead>
                <tr><th>Liability</th><th className="text-end">Employee</th><th className="text-end">Employer</th><th className="text-end">Total</th><th>Due by</th></tr>
              </thead>
              <tbody>
                {visible.map((s) => (
                  <tr key={s.code}>
                    <td>{s.name}</td>
                    <td className="text-end">{inr(s.employeeShare)}</td>
                    <td className="text-end">{s.employerShare ? inr(s.employerShare) : "—"}</td>
                    <td className="text-end fw-semibold">{inr(s.total)}</td>
                    <td>{status(s)}</td>
                  </tr>
                ))}
                <tr>
                  <td className="fw-semibold">Total</td>
                  <td className="text-end fw-semibold">{inr(visible.reduce((a, s) => a + s.employeeShare, 0))}</td>
                  <td className="text-end fw-semibold">{inr(visible.reduce((a, s) => a + s.employerShare, 0))}</td>
                  <td className="text-end fw-bold">{inr(total)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
            <div className="small text-muted mt-2">Due dates follow the usual rules (TDS by the 7th, PF and ESI by the 15th of the next month). Check the actual payment status in your records.</div>
          </ChartCard>
        </div>
        <div className="col-lg-5">
          <ChartCard title="Employee vs employer share" subtitle="Who bears each statutory amount">
            <ResponsiveContainer width="100%" height={Math.max(220, visible.length * 40)}>
              <BarChart data={visible} layout="vertical" margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="code" width={50} tick={AXIS_TICK} tickLine={false} axisLine={false} />
                <Tooltip content={<MoneyTooltip />} cursor={{ fill: "rgba(13,56,77,0.05)" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="employeeShare" name="Employee (deducted from pay)" stackId="a" fill={SERIES[0]} maxBarSize={18} />
                <Bar dataKey="employerShare" name="Employer (company cost)" stackId="a" fill={SERIES[1]} maxBarSize={18} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      <ChartCard title="Statutory outflow by month" subtitle="PF and ESI include the employer share">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={trend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} />
            <YAxis tickFormatter={inrShort} tick={AXIS_TICK} tickLine={false} axisLine={false} width={70} />
            <Tooltip content={<MoneyTooltip />} cursor={{ fill: "rgba(13,56,77,0.05)" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="pf" name="PF" stackId="a" fill={SERIES[0]} maxBarSize={28} />
            <Bar dataKey="esi" name="ESI" stackId="a" fill={SERIES[1]} maxBarSize={28} />
            <Bar dataKey="pt" name="Professional Tax" stackId="a" fill={SERIES[2]} maxBarSize={28} />
            {showLwf && <Bar dataKey="lwf" name="LWF" stackId="a" fill={SERIES[4]} maxBarSize={28} />}
            <Bar dataKey="tds" name="TDS" stackId="a" fill={SERIES[3]} maxBarSize={28} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </>
  );
}

// ── 4. Variance & exceptions ─────────────────────────────────────────────────

function VarianceTab({ data }) {
  const [showAll, setShowAll] = useState(false);

  // Waterfall: an invisible "base" bar lifts each step to where the previous one ended
  const bridge = useMemo(() => {
    let running = 0;
    return data.grossBridge.map((step) => {
      if (step.isTotal) {
        running = step.amount;
        return { label: step.label, base: 0, value: step.amount, amount: step.amount, kind: "total", text: inrShort(step.amount) };
      }
      const start = running;
      running += step.amount;
      return {
        label: step.label, base: Math.min(start, running), value: Math.abs(step.amount), amount: step.amount,
        kind: step.amount >= 0 ? "up" : "down", text: `${step.amount >= 0 ? "+" : ""}${inrShort(step.amount)}`,
      };
    });
  }, [data.grossBridge]);

  // Start the axis a little below the lowest point so small changes stay visible
  const low = bridge.length ? Math.min(...bridge.map((b) => (b.kind === "total" ? b.value : b.base))) : 0;
  const yMin = low > 0 ? Math.floor((low * 0.9) / 1000) * 1000 : 0;

  const heads = data.headChanges.filter((h) => h.change !== 0).slice(0, 12);
  const employees = showAll ? data.employeeChanges : data.employeeChanges.slice(0, 15);

  if (!data.previousMonthText) {
    return <div className="card"><div className="card-body"><Empty text="There is no previous salary month to compare with." /></div></div>;
  }

  return (
    <>
      <div className="row g-3 mb-3">
        <div className="col-lg-8">
          <ChartCard title="Gross salary bridge" subtitle={`What changed gross earnings from ${data.previousMonthText} to ${data.salaryMonthText}`}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={bridge} margin={{ top: 20, right: 10, left: 10, bottom: 30 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="label" tick={{ ...AXIS_TICK, fontSize: 10 }} tickLine={false} interval={0} angle={-15} textAnchor="end" />
                <YAxis domain={[yMin, "auto"]} allowDataOverflow tickFormatter={inrShort} tick={AXIS_TICK} tickLine={false} axisLine={false} width={70} />
                <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                  <div className="bg-white border rounded shadow-sm px-3 py-2 small">
                    <div className="text-muted mb-1">{label}</div>
                    <b>{payload[0].payload.kind === "total" ? inr(payload[0].payload.amount) : `${payload[0].payload.amount >= 0 ? "+" : ""}${inr(payload[0].payload.amount)}`}</b>
                  </div>
                ) : null} cursor={{ fill: "rgba(13,56,77,0.05)" }} />
                <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} />
                <Bar dataKey="value" stackId="w" maxBarSize={44} radius={[4, 4, 0, 0]}>
                  {bridge.map((b) => <Cell key={b.label} fill={b.kind === "total" ? TOTAL : b.kind === "up" ? POSITIVE : NEGATIVE} />)}
                  <LabelList dataKey="text" position="top" style={{ fontSize: 11, fill: "#566a7f" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="small text-muted d-flex gap-3">
              <span><span className="d-inline-block me-1 rounded" style={{ width: 10, height: 10, background: TOTAL }} />Month total</span>
              <span><span className="d-inline-block me-1 rounded" style={{ width: 10, height: 10, background: POSITIVE }} />Increase</span>
              <span><span className="d-inline-block me-1 rounded" style={{ width: 10, height: 10, background: NEGATIVE }} />Decrease</span>
            </div>
          </ChartCard>
        </div>
        <div className="col-lg-4">
          <ChartCard title="Salary heads that changed" subtitle={`${data.salaryMonthText} vs ${data.previousMonthText}`}>
            {heads.length === 0 ? <Empty text="No salary head changed." /> : (
              <div className="table-responsive" style={{ maxHeight: 320, overflowY: "auto" }}>
                <table className="table table-sm mb-0">
                  <thead><tr><th>Salary head</th><th className="text-end">Change</th></tr></thead>
                  <tbody>
                    {heads.map((h) => (
                      <tr key={`${h.salaryHeadName}-${h.headType}`}>
                        <td>
                          {h.salaryHeadName}
                          <div className="small text-muted">{h.headType.replace("_", " ").toLowerCase()}</div>
                        </td>
                        <td className="text-end fw-semibold" style={{ color: h.change >= 0 ? POSITIVE : NEGATIVE }}>
                          {h.change >= 0 ? "+" : ""}{inr(h.change)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ChartCard>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center pb-2">
          <div>
            <h6 className="m-0">Employees to review</h6>
            <small className="text-muted">Net pay changed by 10% or more vs {data.previousMonthText} · {data.employeeChanges.length} {data.employeeChanges.length === 1 ? "employee" : "employees"} · largest change first</small>
          </div>
          {data.employeeChanges.length > 15 && (
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowAll(!showAll)}>
              {showAll ? "Show top 15" : `Show all ${data.employeeChanges.length}`}
            </button>
          )}
        </div>
        <div className="card-body pt-2">
          {employees.length === 0 ? <Empty text="No employee's net pay changed by 10% or more." /> : (
            <div className="table-responsive text-nowrap scroll-grid">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Emp. Code</th><th>Name</th><th>Department</th><th>Designation</th><th>Office</th>
                    <th className="text-end">{data.previousMonthText} Net</th><th className="text-end">{data.salaryMonthText} Net</th>
                    <th className="text-end">Change</th><th>Main reasons</th>
                  </tr>
                </thead>
                <tbody className="table-border-bottom-0">
                  {employees.map((e) => (
                    <tr key={e.idEmployee}>
                      <td>{e.employeeCode}</td>
                      <td>{e.employeeName}</td>
                      <td>{e.departmentName}</td>
                      <td>{e.designationName}</td>
                      <td>{e.officeName}</td>
                      <td className="text-end">{inr(e.previousNetPay)}</td>
                      <td className="text-end">{inr(e.netPay)}</td>
                      <td className="text-end fw-semibold" style={{ color: e.changePercent >= 0 ? POSITIVE : NEGATIVE }}>{signedPct(e.changePercent)}</td>
                      <td style={{ whiteSpace: "normal", minWidth: 240 }}>{e.reasons || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── 5. Salary distribution ───────────────────────────────────────────────────

function DistributionTab({ data }) {
  const s = data.summary;
  const bands = data.salaryBands;
  const ranges = data.designationRanges;
  const rangeMax = Math.max(1, ...ranges.map((r) => r.maximum));
  const avgByDepartment = data.byDepartment
    .filter((d) => d.employees > 0)
    .map((d) => ({ name: d.name, value: d.grossEarnings / d.employees, employees: d.employees }))
    .sort((a, b) => b.value - a.value);
  const largestBand = [...bands].sort((a, b) => b.employees - a.employees)[0];

  return (
    <>
      <div className="row g-3 mb-3">
        <div className="col-md-3"><Tile label="Employees paid" value={s.employeesPaid.toLocaleString("en-IN")} note={data.salaryMonthText} /></div>
        <div className="col-md-3"><Tile label="Average gross per employee" value={inr(s.employeesPaid ? s.grossEarnings / s.employeesPaid : 0)} note="Gross earnings ÷ employees" /></div>
        <div className="col-md-3"><Tile label="Largest salary band" value={largestBand?.employees ? largestBand.label : "—"} note={largestBand?.employees ? `${largestBand.employees} employees` : ""} /></div>
        <div className="col-md-3"><Tile label="Designations paid" value={ranges.length} note="With at least one salary" /></div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-lg-6">
          <ChartCard title="Employees by monthly gross salary band" subtitle={data.salaryMonthText}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bands} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="label" tick={{ ...AXIS_TICK, fontSize: 10 }} tickLine={false} interval={0} />
                <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} />
                <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                  <div className="bg-white border rounded shadow-sm px-3 py-2 small">
                    <div className="text-muted mb-1">{label}</div>
                    <div><b>{payload[0].payload.employees}</b> employees</div>
                    <div className="text-muted">Gross {inr(payload[0].payload.grossEarnings)}</div>
                  </div>
                ) : null} cursor={{ fill: "rgba(13,56,77,0.05)" }} />
                <Bar dataKey="employees" name="Employees" fill={SERIES[0]} maxBarSize={40} radius={[4, 4, 0, 0]}
                  label={{ position: "top", fontSize: 11, fill: "#566a7f" }} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <div className="col-lg-6">
          <ChartCard title="Pay range by designation" subtitle="Minimum, average and maximum monthly gross">
            {ranges.length === 0 ? <Empty /> : (
              <div style={{ maxHeight: 300, overflowY: "auto" }}>
                {ranges.map((r) => (
                  <div key={r.name} className="d-flex align-items-center gap-2 mb-2" title={`${r.employees} employees · min ${inr(r.minimum)} · avg ${inr(r.average)} · max ${inr(r.maximum)}`}>
                    <div className="small text-truncate" style={{ width: 150 }}>{r.name}</div>
                    <div className="flex-grow-1 position-relative" style={{ height: 18 }}>
                      <div className="position-absolute rounded" style={{
                        top: 7, height: 4, background: "#c3c2b7",
                        left: `${(r.minimum / rangeMax) * 100}%`, width: `${Math.max(0.5, ((r.maximum - r.minimum) / rangeMax) * 100)}%`,
                      }} />
                      <div className="position-absolute rounded-circle" style={{
                        top: 3, width: 12, height: 12, marginLeft: -6, background: SERIES[0], boxShadow: "0 0 0 2px #fff",
                        left: `${(r.average / rangeMax) * 100}%`,
                      }} />
                    </div>
                    <div className="small text-end fw-semibold" style={{ width: 80 }}>{inrShort(r.average)}</div>
                  </div>
                ))}
                <div className="small text-muted mt-2">
                  <span className="d-inline-block me-1 rounded" style={{ width: 14, height: 4, background: "#c3c2b7", verticalAlign: "middle" }} />Min – max range
                  <span className="d-inline-block ms-3 me-1 rounded-circle" style={{ width: 10, height: 10, background: SERIES[0], verticalAlign: "middle" }} />Average (value on the right)
                </div>
              </div>
            )}
          </ChartCard>
        </div>
      </div>

      <ChartCard title="Average gross salary by department" subtitle={data.salaryMonthText}>
        {avgByDepartment.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={Math.max(220, avgByDepartment.length * 34)}>
            <BarChart data={avgByDepartment} layout="vertical" margin={{ top: 0, right: 70, left: 10, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={160} tick={AXIS_TICK} tickLine={false} axisLine={false} />
              <Tooltip content={<MoneyTooltip />} cursor={{ fill: "rgba(13,56,77,0.05)" }} />
              <Bar dataKey="value" name="Average gross" fill={SERIES[0]} maxBarSize={18} radius={[0, 4, 4, 0]}
                label={{ position: "right", formatter: inrShort, fontSize: 11, fill: "#566a7f" }} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </>
  );
}

export default SalaryDashboard;
