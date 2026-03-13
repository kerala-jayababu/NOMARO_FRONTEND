import React, { useState, useEffect, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import CommonService from "../../core/services/CommonService";
import LeaveManagementService from "../../core/services/LeaveManagementService";

// ── Constants ─────────────────────────────────────────────────────────────────

const TH_STYLE = {
  backgroundColor: "#0f3c54",
  color: "#fff",
  fontSize: 13,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const CHART_COLORS = [
  "#1e3a5f",
  "#4a90d9",
  "#4caf8a",
  "#e07b39",
  "#9c59b6",
  "#e74c3c",
  "#f39c12",
  "#1abc9c",
  "#3498db",
  "#2ecc71",
];

const KPI_BORDER_COLORS = ["#4a90d9", "#4caf8a", "#9c59b6", "#e07b39"];

const TABS = ["overview", "department", "designation", "employees"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveArray(res) {
  if (res.error) return [];
  const d = res.data;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d)) return d;
  return [];
}

function resolveObject(res) {
  if (res.error) return null;
  const d = res.data;
  if (d?.data && typeof d.data === "object" && !Array.isArray(d.data))
    return d.data;
  if (typeof d === "object" && !Array.isArray(d)) return d;
  return null;
}

// Returns [{ typeName, leaveCode }] — typeName used as data key, leaveCode as display label
function collectLeaveTypes(items) {
  const map = new Map();
  items.forEach((item) =>
    (item.leaveBreakdown || []).forEach((lb) => {
      if (!map.has(lb.leaveTypeName))
        map.set(lb.leaveTypeName, lb.leaveCode || lb.leaveTypeName);
    })
  );
  return Array.from(map.entries()).map(([typeName, leaveCode]) => ({ typeName, leaveCode }));
}

function getLeaveDayForType(item, typeName) {
  const lb = (item.leaveBreakdown || []).find(
    (x) => x.leaveTypeName === typeName
  );
  return lb?.totalDays ?? 0;
}

// ── Small shared components ───────────────────────────────────────────────────

function SpinnerRow({ cols }) {
  return (
    <tr>
      <td colSpan={cols} className="text-center py-3">
        <div
          className="spinner-border spinner-border-sm text-primary"
          role="status"
        />
      </td>
    </tr>
  );
}

function EmptyRow({ cols }) {
  return (
    <tr>
      <td colSpan={cols} className="text-center text-muted py-3">
        No records found.
      </td>
    </tr>
  );
}

function SectionHeading({ text }) {
  return (
    <h6 className="fw-bold mb-3">
      <span style={{ borderLeft: "3px solid #4a90d9", paddingLeft: 8 }}>
        {text}
      </span>
    </h6>
  );
}

function CenteredSpinner() {
  return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary" role="status" />
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, borderColor, loading }) {
  return (
    <div className="col-md-3 col-sm-6">
      <div className="card h-100" style={{ borderTop: `3px solid ${borderColor}` }}>
        <div className="card-body">
          <p className="text-muted mb-1" style={{ fontSize: 13 }}>
            {label}
          </p>
          <h3 className="fw-bold mb-1" style={{ fontSize: 15 }}>
            {loading ? (
              <span
                className="spinner-border spinner-border-sm text-primary"
                role="status"
              />
            ) : (
              value ?? "--"
            )}
          </h3>
          {sub && (
            <small className="text-muted" style={{ fontSize: 12 }}>
              {sub}
            </small>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ donutData, lineData, deptChartData, leaveTypes, loading }) {
  if (loading) return <CenteredSpinner />;

  return (
    <>
      <div className="row g-3 mb-3">
        {/* Donut – Leave Distribution */}
        <div className="col-lg-5">
          <div className="card h-100">
            <div className="card-body">
              <SectionHeading text="Leave Distribution by Type" />
              {donutData.length > 0 ? (
                <ResponsiveContainer width="100%" height={270}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={105}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {donutData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) =>
                        typeof v === "number" ? v.toLocaleString() : v
                      }
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 12 }}
                      iconType="circle"
                      iconSize={10}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted text-center py-5">No data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Line – Monthly Trend */}
        <div className="col-lg-7">
          <div className="card h-100">
            <div className="card-body">
              <SectionHeading text="Monthly Leave Trend" />
              {lineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={270}>
                  <LineChart
                    data={lineData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="Leave Days"
                      stroke="#4a90d9"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#4a90d9", strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted text-center py-5">No data available</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stacked Bar – Department Overview */}
      <div className="card">
        <div className="card-body">
          <SectionHeading text="Department-wise Leave Overview" />
          {deptChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={deptChartData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {leaveTypes.map(({ typeName, leaveCode }, i) => (
                  <Bar
                    key={typeName}
                    dataKey={typeName}
                    name={leaveCode}
                    stackId="a"
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted text-center py-5">No data available</p>
          )}
        </div>
      </div>
    </>
  );
}

// ── Department Tab ────────────────────────────────────────────────────────────

function DepartmentTab({ deptChartData, leaveTypes, departmentData, loading }) {
  if (loading) return <CenteredSpinner />;

  return (
    <>
      {/* Grouped Bar Chart */}
      <div className="card mb-3">
        <div className="card-body">
          <SectionHeading text="Department-wise Leave Breakdown" />
          {deptChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={deptChartData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {leaveTypes.map(({ typeName, leaveCode }, i) => (
                  <Bar
                    key={typeName}
                    dataKey={typeName}
                    name={leaveCode}
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted text-center py-5">No data available</p>
          )}
        </div>
      </div>

      {/* Summary Table */}
      <div className="card">
        <div className="card-body">
          <SectionHeading text="Department Summary Table" />
          <div className="table-responsive">
            <table className="table table-sm table-bordered mb-0 anual-leave-dashboard-table">
              <thead>
                <tr>
                  <th style={TH_STYLE}>Department</th>
                  {leaveTypes.map(({ typeName, leaveCode }) => (
                    <th key={typeName} style={TH_STYLE}>
                      {leaveCode}
                    </th>
                  ))}
                  <th style={TH_STYLE}>Total</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: 13 }}>
                {departmentData.length === 0 ? (
                  <EmptyRow cols={leaveTypes.length + 2} />
                ) : (
                  departmentData.map((dept, i) => {
                    const total = (dept.leaveBreakdown || []).reduce(
                      (sum, lb) => sum + (lb.totalDays || 0),
                      0
                    );
                    return (
                      <tr key={i}>
                        <td className="fw-semibold">{dept.departmentName}</td>
                        {leaveTypes.map(({ typeName }) => (
                          <td key={typeName}>{getLeaveDayForType(dept, typeName)}</td>
                        ))}
                        <td className="fw-bold text-primary">{total}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Designation Tab ───────────────────────────────────────────────────────────

function DesignationTab({ desigChartData, leaveTypes, designationData, loading }) {
  if (loading) return <CenteredSpinner />;

  return (
    <>
      {/* Grouped Bar Chart */}
      <div className="card mb-3">
        <div className="card-body">
          <SectionHeading text="Designation-wise Leave Breakdown" />
          {desigChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={desigChartData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {leaveTypes.map(({ typeName, leaveCode }, i) => (
                  <Bar
                    key={typeName}
                    dataKey={typeName}
                    name={leaveCode}
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted text-center py-5">No data available</p>
          )}
        </div>
      </div>

      {/* Summary Table */}
      <div className="card">
        <div className="card-body">
          <SectionHeading text="Designation Summary Table" />
          <div className="table-responsive">
            <table className="table table-sm table-bordered mb-0 anual-leave-dashboard-table">
              <thead>
                <tr>
                  <th style={TH_STYLE}>Designation</th>
                  {leaveTypes.map(({ typeName, leaveCode }) => (
                    <th key={typeName} style={TH_STYLE}>
                      {leaveCode}
                    </th>
                  ))}
                  <th style={TH_STYLE}>Total</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: 13 }}>
                {designationData.length === 0 ? (
                  <EmptyRow cols={leaveTypes.length + 2} />
                ) : (
                  designationData.map((desig, i) => {
                    const total = (desig.leaveBreakdown || []).reduce(
                      (sum, lb) => sum + (lb.totalDays || 0),
                      0
                    );
                    return (
                      <tr key={i}>
                        <td className="fw-semibold">{desig.designationName}</td>
                        {leaveTypes.map(({ typeName }) => (
                          <td key={typeName}>{getLeaveDayForType(desig, typeName)}</td>
                        ))}
                        <td className="fw-bold text-primary">{total}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Employees Tab ─────────────────────────────────────────────────────────────

function EmployeesTab({
  employeeData,
  leaveTypes,
  departments,
  designations,
  empFilters,
  onFilterChange,
  loading,
}) {
  return (
    <div className="card">
      <div className="card-body">
        {/* Header with filters */}
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <SectionHeading text="Employee Leave Details" />
          <div className="d-flex gap-2">
            <select
              className="form-select form-select-sm"
              style={{ minWidth: 160 }}
              value={empFilters.idDepartment}
              onChange={(e) =>
                onFilterChange({ ...empFilters, idDepartment: e.target.value })
              }
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.idDepartment} value={d.idDepartment}>
                  {d.departmentName}
                </option>
              ))}
            </select>
            <select
              className="form-select form-select-sm"
              style={{ minWidth: 160 }}
              value={empFilters.idDesignation}
              onChange={(e) =>
                onFilterChange({ ...empFilters, idDesignation: e.target.value })
              }
            >
              <option value="">All Designations</option>
              {designations.map((d) => (
                <option key={d.idDesignation} value={d.idDesignation}>
                  {d.designationName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-sm table-bordered mb-0 anual-leave-dashboard-table">
            <thead>
              <tr>
                <th style={TH_STYLE}>Employee</th>
                <th style={TH_STYLE}>Department</th>
                <th style={TH_STYLE}>Designation</th>
                {leaveTypes.map(({ typeName, leaveCode }) => (
                  <th key={typeName} style={TH_STYLE}>
                    {leaveCode}
                  </th>
                ))}
                <th style={TH_STYLE}>Total</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: 13 }}>
              {loading ? (
                <SpinnerRow cols={leaveTypes.length + 4} />
              ) : employeeData.length === 0 ? (
                <EmptyRow cols={leaveTypes.length + 4} />
              ) : (
                employeeData.map((emp, i) => (
                  <tr key={i}>
                    <td className="fw-semibold">{emp.employeeName || "--"}</td>
                    <td className="text-primary">{emp.departmentName || "--"}</td>
                    <td className="text-primary">{emp.designationName || "--"}</td>
                    {leaveTypes.map(({ typeName }) => (
                      <td key={typeName}>{getLeaveDayForType(emp, typeName)}</td>
                    ))}
                    <td className="fw-bold text-primary">
                      {emp.totalLeaveDays ?? 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

function AnnualLeaveDashboard() {
  const [workYears, setWorkYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Dashboard data
  const [kpiData, setKpiData] = useState(null);
  const [leaveTypeData, setLeaveTypeData] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [designationData, setDesignationData] = useState([]);
  const [employeeData, setEmployeeData] = useState([]);

  // Filter meta
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [empFilters, setEmpFilters] = useState({
    idDepartment: "",
    idDesignation: "",
  });

  // Loading flags
  const [dashLoading, setDashLoading] = useState(false);
  const [empLoading, setEmpLoading] = useState(false);

  // ── Load work years + filter meta on mount ────────────────────────────────

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const [yearsRes, deptsRes, desigRes] = await Promise.all([
        CommonService.getAllWorkYears(),
        CommonService.getDepartmentsList(),
        CommonService.getDesignationsList(),
      ]);

      if (!isMounted) return;

      if (!yearsRes.error) {
        const allYears = yearsRes.data?.data || yearsRes.data || [];

        // Determine current financial year start (July = month 7 is new FY)
        const now = new Date();
        const calYear = now.getFullYear();
        const fyStart = now.getMonth() + 1 >= 7 ? calYear : calYear - 1;

        // Keep: previous year, current year, next 2 years
        const allowed = new Set([fyStart - 1, fyStart, fyStart + 1, fyStart + 2]);
        const filtered = allYears.filter((y) => {
          const startYear = parseInt((y.displayText || "").split("-")[0], 10);
          return allowed.has(startYear);
        });

        // Fall back to all years if filter yields nothing (e.g. API format differs)
        const years = filtered.length > 0 ? filtered : allYears;
        setWorkYears(years);

        // Default to current financial year
        const currentYear =
          years.find((y) => {
            const startYear = parseInt((y.displayText || "").split("-")[0], 10);
            return startYear === fyStart;
          }) || years[0];

        if (currentYear) setSelectedYear(currentYear.idWorkYear);
      }

      if (!deptsRes.error) {
        setDepartments(deptsRes.data?.data || deptsRes.data || []);
      }

      if (!desigRes.error) {
        setDesignations(desigRes.data?.data || desigRes.data || []);
      }
    };

    init();
    return () => { isMounted = false; };
  }, []);

  // ── Load dashboard data when year changes ────────────────────────────────

  useEffect(() => {
    if (!selectedYear) return;

    let isMounted = true;
    setDashLoading(true);

    const load = async () => {
      try {
        const [kpiRes, leaveTypeRes, trendRes, deptRes, desigDataRes] =
          await Promise.all([
            LeaveManagementService.getKpiSummary(selectedYear),
            LeaveManagementService.getLeaveByType(selectedYear),
            LeaveManagementService.getMonthlyTrend(selectedYear),
            LeaveManagementService.getDepartmentSummary(selectedYear),
            LeaveManagementService.getDesignationSummary(selectedYear),
          ]);

        if (!isMounted) return;

        setKpiData(resolveObject(kpiRes));
        setLeaveTypeData(resolveArray(leaveTypeRes));
        setMonthlyTrend(resolveArray(trendRes));
        setDepartmentData(resolveArray(deptRes));
        setDesignationData(resolveArray(desigDataRes));
      } catch (err) {
        console.error("Annual Leave Dashboard load error:", err);
      } finally {
        if (isMounted) setDashLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [selectedYear]);

  // ── Load employees when tab active or filters change ─────────────────────

  useEffect(() => {
    if (activeTab !== "employees" || !selectedYear) return;

    let isMounted = true;
    setEmpLoading(true);

    const load = async () => {
      try {
        const params = { idYear: selectedYear };
        if (empFilters.idDepartment)
          params.IdDepartment = empFilters.idDepartment;
        if (empFilters.idDesignation)
          params.IdDesignation = empFilters.idDesignation;

        const res = await LeaveManagementService.getEmployeeLeaveDetails(params);
        if (!isMounted) return;
        setEmployeeData(resolveArray(res));
      } catch (err) {
        console.error("Employee leave details load error:", err);
        if (isMounted) setEmployeeData([]);
      } finally {
        if (isMounted) setEmpLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [activeTab, selectedYear, empFilters.idDepartment, empFilters.idDesignation]);

  // ── Derived / memoised data ───────────────────────────────────────────────

  const leaveTypes = useMemo(
    () => collectLeaveTypes(departmentData),
    [departmentData]
  );

  const desigLeaveTypes = useMemo(
    () => collectLeaveTypes(designationData),
    [designationData]
  );

  const empLeaveTypes = useMemo(
    () => collectLeaveTypes(employeeData),
    [employeeData]
  );

  const deptChartData = useMemo(() => {
    return departmentData.map((dept) => {
      const row = { name: dept.departmentName };
      (dept.leaveBreakdown || []).forEach((lb) => {
        row[lb.leaveTypeName] = lb.totalDays;
      });
      return row;
    });
  }, [departmentData]);

  const desigChartData = useMemo(() => {
    return designationData.map((d) => {
      const row = { name: d.designationName };
      (d.leaveBreakdown || []).forEach((lb) => {
        row[lb.leaveTypeName] = lb.totalDays;
      });
      return row;
    });
  }, [designationData]);

  const donutData = useMemo(
    () =>
      leaveTypeData.map((lt) => ({
        name: lt.leaveTypeName,
        value: lt.totalDays,
      })),
    [leaveTypeData]
  );

  const lineData = useMemo(
    () =>
      monthlyTrend.map((m) => ({
        name: m.monthName,
        value: m.totalLeaveDays,
      })),
    [monthlyTrend]
  );

  const kpi = kpiData || {};
  const selectedYearLabel =
    workYears.find((y) => y.idWorkYear === selectedYear)?.displayText || "";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <style>{`
        .anual-leave-dashboard-table thead th {
          color: #fff !important;
          background-color: #0f3c54 !important;
          font-weight: 700 !important;
          font-size: 13px;
          position: sticky;
          top: 0;
        }
      `}</style>
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold mb-0">Annual Leave Dashboard</h4>
        <select
          className="form-select form-select-sm"
          style={{ width: 170 }}
          value={selectedYear || ""}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {workYears.length === 0 && (
            <option value="">Loading years...</option>
          )}
          {workYears.map((y) => (
            <option key={y.idWorkYear} value={y.idWorkYear}>
              {y.displayText}
            </option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-3">
        <KpiCard
          label="Total Employees"
          value={kpi.totalEmployees}
          sub="Across all departments"
          borderColor={KPI_BORDER_COLORS[0]}
          loading={dashLoading}
        />
        <KpiCard
          label="Total Leave Days"
          value={kpi.totalLeaveDays}
          sub={selectedYearLabel}
          borderColor={KPI_BORDER_COLORS[1]}
          loading={dashLoading}
        />
        <KpiCard
          label="Avg Leave / Employee"
          value={kpi.avgLeavePerEmployee}
          sub="Days this year"
          borderColor={KPI_BORDER_COLORS[2]}
          loading={dashLoading}
        />
        <KpiCard
          label="Highest Leave Type"
          value={kpi.highestLeaveType}
          sub={
            kpi.highestLeaveTypeDays != null
              ? `${kpi.highestLeaveTypeDays} days total`
              : ""
          }
          borderColor={KPI_BORDER_COLORS[3]}
          loading={dashLoading}
        />
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-3">
        {TABS.map((tab) => (
          <li className="nav-item" key={tab}>
            <button
              className={`nav-link ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          </li>
        ))}
      </ul>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <OverviewTab
          donutData={donutData}
          lineData={lineData}
          deptChartData={deptChartData}
          leaveTypes={leaveTypes}
          loading={dashLoading}
        />
      )}

      {activeTab === "department" && (
        <DepartmentTab
          deptChartData={deptChartData}
          leaveTypes={leaveTypes}
          departmentData={departmentData}
          loading={dashLoading}
        />
      )}

      {activeTab === "designation" && (
        <DesignationTab
          desigChartData={desigChartData}
          leaveTypes={desigLeaveTypes}
          designationData={designationData}
          loading={dashLoading}
        />
      )}

      {activeTab === "employees" && (
        <EmployeesTab
          employeeData={employeeData}
          leaveTypes={empLeaveTypes}
          departments={departments}
          designations={designations}
          empFilters={empFilters}
          onFilterChange={setEmpFilters}
          loading={empLoading}
        />
      )}
    </div>
  );
}

export default AnnualLeaveDashboard;
