import React, { useCallback, useEffect, useMemo, useState } from "react";
import moment from "moment";
import "./LiveDashboard.css";
import CommonService from "../../core/services/CommonService";
import LiveDashboardService from "../../core/services/LiveDashboardService";

const defaultStats = {
  totalEmployees: 0,
  clockedInTotal: 0,
  ontimeClockIn: 0,
  lateClockIn: 0,
  presentOnSite: 0,
  presentOffSite: 0,
  absentTotal: 0,
  authorized: 0,
  unAuthorized: 0,
};

const formatTimestamp = () => {
  const options = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };
  return new Intl.DateTimeFormat("en-US", options).format(new Date());
};

const formatTimeDisplay = (value) => {
  if (!value || value === "--") {
    return "--";
  }
  const parsed = moment(value);
  if (!parsed.isValid()) {
    return value;
  }
  return parsed.format("hh:mm A");
};

function LiveDashboard() {
  const [departments, setDepartments] = useState([
    { idDepartment: "all", departmentName: "All Departments" },
  ]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("all");
  const [stats, setStats] = useState(defaultStats);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [detailRows, setDetailRows] = useState([]);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [activeDetailType, setActiveDetailType] = useState("TOTALEMPLOYEES");
  const [activeDetailKey, setActiveDetailKey] = useState(
    "TOTALEMPLOYEES|Total Employees"
  );
  const [selectedDetailLabel, setSelectedDetailLabel] = useState(
    "Total Employees"
  );

  useEffect(() => {
    let isMounted = true;

    const loadDepartments = async () => {
      try {
        const res = await CommonService.getDepartmentsList();
        if (isMounted && res?.data?.data) {
          const deptList = res.data.data.map((dept) => ({
            idDepartment: String(dept.idDepartment),
            departmentName: dept.departmentName,
          }));
          setDepartments([
            { idDepartment: "all", departmentName: "All Departments" },
            ...deptList,
          ]);
        }
      } catch (error) {
        console.error("Failed to load departments:", error);
      }
    };

    const loadStats = async () => {
      setIsStatsLoading(true);
      try {
        const res = await LiveDashboardService.getAttendanceSummary(new Date());
        if (isMounted && res?.data?.data) {
          const apiData = res.data.data;
          setStats({
            totalEmployees: apiData.totalEmployees ?? apiData.TotalEmployees ?? 0,
            clockedInTotal:
              apiData.clockedInTotal ?? apiData.ClockedInTotal ?? 0,
            ontimeClockIn:
              apiData.ontimeClockIn ?? apiData.OntimeClockIn ?? 0,
            lateClockIn: apiData.lateClockIn ?? apiData.LateClockIn ?? 0,
            presentOnSite:
              apiData.presentOnSite ?? apiData.PresentOnSite ?? 0,
            presentOffSite:
              apiData.presentOffSite ?? apiData.PresentOffSite ?? 0,
            absentTotal: apiData.absentTotal ?? apiData.AbsentTotal ?? 0,
            authorized: apiData.authorized ?? apiData.Authorized ?? 0,
            unAuthorized: apiData.unAuthorized ?? apiData.UnAuthorized ?? 0,
          });
        }
      } catch (error) {
        console.error("Failed to load live attendance summary:", error);
      } finally {
        if (isMounted) {
          setIsStatsLoading(false);
        }
      }
    };

    loadDepartments();
    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const normalizeDetailRow = useCallback((row) => {
    const getValue = (keys, fallback = "--") => {
      for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
          return row[key];
        }
      }
      return fallback;
    };

    const statusLabel = getValue(
      ["empStatus", "EmpStatus", "status", "Status"],
      "--"
    );
    const normalizedStatus = String(statusLabel).toLowerCase();
    let tone = "secondary";
    if (normalizedStatus.includes("unauthorized") || normalizedStatus.includes("not")||normalizedStatus.includes("off")||normalizedStatus.includes("late")) {
      tone = "danger";
    } else if (normalizedStatus.includes("absent")) {
      tone = "warning";
    } else if (
      normalizedStatus.includes("premise") ||
      normalizedStatus.includes("ontime") ||
      normalizedStatus.includes("authorized")
    ) {
      tone = "success";
    }

    return {
      code: getValue(["employeeCode", "EmployeeCode", "empCode", "EmpCode"]),
      employee: getValue([
        "employee",
        "employeeName",
        "Employee",
        "EmployeeName",
      ]),
      department: getValue([
        "department",
        "departmentName",
        "Department",
        "DepartmentName",
      ]),
      email: getValue(["email", "emailID"]),
      phone: getValue(["phone", "Phone", "phoneNumber", "phoneNumber1"]),
      statusLabel,
      statusTone: tone,
      checkIn: formatTimeDisplay(
        getValue(["firstCheckInTime", "CheckIn", "clockInTime", "ClockInTime"])
      ),
      checkOut: formatTimeDisplay(
        getValue([
        "lastCheckOutTime",
        "CheckOut",
        "clockOutTime",
        "ClockOutTime",
        ])
      ),
    };
  }, []);

  const fetchDetails = useCallback(
    async (detailType, detailLabel) => {
      if (!detailType) {
        return;
      }
      setIsDetailsLoading(true);
      setSelectedDetailLabel(detailLabel || "Details");
      setActiveDetailType(detailType);
      setActiveDetailKey(`${detailType}|${detailLabel || "Details"}`);
      try {
        const res = await LiveDashboardService.getAttendanceDetails(
          new Date(),
          detailType
        );
        if (res?.data?.data) {
          const normalized = res.data.data.map((row) =>
            normalizeDetailRow(row)
          );
          setDetailRows(normalized);
        } else {
          setDetailRows([]);
        }
      } catch (error) {
        console.error("Failed to load live dashboard details:", error);
        setDetailRows([]);
      } finally {
        setIsDetailsLoading(false);
      }
    },
    [normalizeDetailRow]
  );

  useEffect(() => {
    fetchDetails("TOTALEMPLOYEES", "Total Employees");
  }, [fetchDetails]);

  const summaryCards = useMemo(
    () => [
      {
        title: "Total Employees",
        icon: "bx bx-group",
        iconClass: "text-primary",
        stats: [
          {
            label: "Total",
            value: stats.totalEmployees,
            detailType: "TOTALEMPLOYEES",
            detailLabel: "Total Employees",
          },
        ],
      },
      {
        title: "Clocked-In",
        icon: "bx bx-time-five",
        iconClass: "text-success",
        stats: [
          {
            label: "Total",
            value: stats.clockedInTotal,
            detailType: "CLOCKEDINTOTAL",
            detailLabel: "Clocked-In - Total",
          },
          {
            label: "On Time",
            value: stats.ontimeClockIn,
            valueClass: "text-success",
            detailType: "CLOCKEDINTOTAL-ONTIME",
            detailLabel: "Clocked-In - On Time",
          },
          {
            label: "Late",
            value: stats.lateClockIn,
            valueClass: "text-danger",
            detailType: "CLOCKEDINTOTAL-LATE",
            detailLabel: "Clocked-In - Late",
          },
        ],
      },
      {
        title: "Present",
        icon: "bx bx-check-circle",
        iconClass: "text-success",
        stats: [
          {
            label: "On-Site",
            value: stats.presentOnSite,
            valueClass: "text-success",
            detailType: "PRESENT-ONSITE",
            detailLabel: "Present - On Site",
          },
          {
            label: "Off-Site",
            value: stats.presentOffSite,
            valueClass: "text-danger",
              detailType: "PRESENT-OFFSITE",
            detailLabel: "Present - Off Site",
          },
        ],
      },
      {
        title: "Absent",
        icon: "bx bx-calendar-x",
        iconClass: "text-warning",
        stats: [
          {
            label: "Total",
            value: stats.absentTotal,
            detailType: "ABSENT-TOTAL",
            detailLabel: "Absent - Total",
          },
          {
            label: "Authorized",
            value: stats.authorized,
            valueClass: "text-success",
            detailType: "ABSENT-AUTHORIZED",
            detailLabel: "Absent - Authorized",
          },
          {
            label: "Unauthorized",
            value: stats.unAuthorized,
            valueClass: "text-danger",
            detailType: "ABSENT-UNAUTHORIZED",
            detailLabel: "Absent - Unauthorized",
          },
        ],
      },
    ],
    [stats]
  );

  const selectedDepartmentName = useMemo(() => {
    if (selectedDepartmentId === "all") {
      return "All Departments";
    }
    return (
      departments.find(
        (dept) => String(dept.idDepartment) === String(selectedDepartmentId)
      )?.departmentName || "All Departments"
    );
  }, [selectedDepartmentId, departments]);

  const filteredRows = useMemo(() => {
    if (selectedDepartmentName === "All Departments") {
      return detailRows;
    }
    return detailRows.filter(
      (row) => row.department === selectedDepartmentName
    );
  }, [selectedDepartmentName, detailRows]);

  const handleDepartmentChange = (event) => {
    setSelectedDepartmentId(event.target.value);
  };

  const handleStatClick = (stat) => {
    if (!stat.detailType) {
      return;
    }
    fetchDetails(stat.detailType, stat.detailLabel || stat.label);
  };

  return (
    <div className="container-fluid p-2 live-dashboard">
      <div className="page-header">
        Live Dashboard... {formatTimestamp()}
      </div>

      <div className="card-box">
        <div className="filter-box">
          <label htmlFor="department">Department:</label>
          <select
            id="department"
            className="form-select"
            style={{ width: 200 }}
            value={selectedDepartmentId}
            onChange={handleDepartmentChange}
          >
            {departments.map((dept) => (
              <option key={dept.idDepartment} value={dept.idDepartment}>
                {dept.departmentName}
              </option>
            ))}
          </select>
        </div>

        <div className="summary-row mb-4">
          {summaryCards.map((card) => (
            <div className="card-summary" key={card.title}>
              <div className="card-summaryHead">
                <div className={`icon ${card.iconClass}`}>
                  <i className={card.icon}></i>
                </div>
                <h5>{card.title}</h5>
              </div>
              <div className="card-summaryBody">
                <div className="sub-summary-count">
                  <ul>
                    {card.stats.map((stat) => {
                      const statKey = `${stat.detailType}|${
                        stat.detailLabel || stat.label
                      }`;
                      const isActive = statKey === activeDetailKey;
                      const clickable = Boolean(stat.detailType);
                      const itemClass = [
                        stat.valueClass,
                        clickable ? "stat-clickable" : "",
                        isActive ? "active" : "",
                      ]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <li
                          key={`${card.title}-${stat.label}`}
                          className={itemClass}
                          onClick={() => handleStatClick(stat)}
                        >
                          <h5 className={stat.valueClass}>
                            {isStatsLoading ? "--" : stat.value}
                          </h5>
                          <p className={stat.valueClass}>{stat.label}</p>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0">Live Attendance Status</h5>
          <span
            className="fw-bold "
            style={{ fontSize: "14px" }}
          >
            Showing: {selectedDetailLabel}
          </span>
        </div>
        <div className="table-responsive table-scroll">
          <table className="table table-sm table-bordered">
            <thead
              style={{
                backgroundColor: "#0f3c54",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              <tr> 
                <th >Emp Code</th>
                <th >Employee</th>
                <th >Department</th>
                <th >Email</th>
                <th >Phone</th>
                <th >Status</th>
                <th >Clock-In</th>
                <th >Clock-Out</th>
              </tr>
            </thead>
            <tbody>
              {isDetailsLoading ? (
                <tr>
                  <td colSpan="8" className="text-center">
                    Loading details...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted">
                    No records found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => (
                  <tr key={`${row.code}-${index}`}>
                    <td>{row.code}</td>
                    <td>{row.employee}</td>
                    <td>{row.department}</td>
                    <td>{row.email}</td>
                    <td>{row.phone}</td>
                    <td>
                      <span className={`fw-bold text-${row.statusTone}`}>
                        {row.statusLabel}
                      </span>
                    </td>
                    <td>{row.checkIn}</td>
                    <td>{row.checkOut}</td>
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

export default LiveDashboard;

