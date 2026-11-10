import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import Utils from "../../utils/Utils";
import { toast } from "react-toastify";
import EmployeeCalendarService from "../../core/services/EmployeeCalendarService";
import "./HolidayCalendar.css";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PUBLIC_TYPE = "PUBLICHOLIDAY";

const typeLabel = (h) =>
  h.holidayTypeName ||
  (h.holidayType || "").toLowerCase().replace(/holiday$/, " holiday").replace(/\b\w/g, (c) => c.toUpperCase());

// Monday-first grid of whole weeks covering the month
const buildWeeks = (month) => {
  const start = month.clone().startOf("month");
  const end = month.clone().endOf("month");
  const gridStart = start.clone().subtract((start.isoWeekday() + 6) % 7, "days");
  const gridEnd = end.clone().add((7 - end.isoWeekday()) % 7, "days");
  const days = [];
  for (let d = gridStart.clone(); d.isSameOrBefore(gridEnd, "day"); d.add(1, "day")) days.push(d.clone());
  return days;
};

function MonthCard({ month, holidaysByDay, today }) {
  const days = buildWeeks(month);
  const count = Object.keys(holidaysByDay).filter((k) => moment(k).isSame(month, "month")).length;

  return (
    <div className="hc-month h-100">
      <div className="hc-month-head">
        <h3 className="hc-month-title">{month.format("MMMM YYYY")}</h3>
        <span className="hc-count">{count} {count === 1 ? "Holiday" : "Holidays"}</span>
      </div>
      <div className="hc-grid">
        {WEEKDAYS.map((w) => <div key={w} className="hc-weekday">{w}</div>)}
        {days.map((d) => {
          const key = d.format("YYYY-MM-DD");
          const list = holidaysByDay[key] || [];
          const isPublic = list.some((h) => (h.holidayType || "").toUpperCase() === PUBLIC_TYPE);
          const classes = ["hc-day"];
          if (!d.isSame(month, "month")) classes.push("hc-other");
          if (list.length) classes.push(isPublic ? "hc-public" : "hc-special");
          const isToday = d.isSame(today, "day") && d.isSame(month, "month");
          if (isToday) classes.push("hc-today");
          const title = list.map((h) => `${h.holidayDescription || typeLabel(h)} (${typeLabel(h)})`).join("\n");
          return (
            <div key={key} className={classes.join(" ")} title={title || undefined}>
              <span className="hc-num">{d.date()}</span>
              {list.length > 0 && <span className="hc-desc">{list.map((h) => h.holidayDescription || typeLabel(h)).join(", ")}</span>}
              {isToday && list.length === 0 && <span className="hc-dot" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HolidayCalendar() {
  // First of the left-hand month; the right-hand month is the next one
  const [startMonth, setStartMonth] = useState(() => moment().startOf("month"));
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const today = moment();
  const months = [startMonth.clone(), startMonth.clone().add(1, "month")];

  useEffect(() => {
    // Whole weeks shown in both grids, so neighbouring-month holidays are highlighted too
    const first = buildWeeks(months[0]);
    const second = buildWeeks(months[1]);
    const from = first[0].format("YYYY-MM-DD");
    const to = second[second.length - 1].format("YYYY-MM-DD");
    setLoading(true);
    EmployeeCalendarService.getHolidayCalendar(from, to).then((res) => {
      setLoading(false);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setHolidays(res.data?.data || []);
    });
  }, [startMonth.format("YYYY-MM")]);

  // Holidays of the two months shown, for the list below the calendars
  const listed = holidays
    .filter((h) => months.some((m) => moment(h.holidayDate).isSame(m, "month")))
    .sort((a, b) => moment(a.holidayDate).diff(moment(b.holidayDate)));

  const holidaysByDay = useMemo(() => {
    const map = {};
    holidays.forEach((h) => {
      const key = moment(h.holidayDate).format("YYYY-MM-DD");
      (map[key] = map[key] || []).push(h);
    });
    return map;
  }, [holidays]);

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="card">
        <div className="card-body p-4">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
            <div className="d-flex align-items-center gap-3">
              <div className="hc-icon"><i className="bx bx-calendar"></i></div>
              <div>
                <h2 className="hc-title">Holiday Calendar</h2>
                <p className="hc-subtitle">View public holidays and special holidays for the year.</p>
              </div>
            </div>
            <div className="hc-nav d-flex gap-2">
              <button type="button" className="btn btn-outline-secondary" onClick={() => setStartMonth(startMonth.clone().subtract(1, "month"))}>
                <i className="bx bx-chevron-left"></i> Previous
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setStartMonth(moment().startOf("month"))}>
                Today
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setStartMonth(startMonth.clone().add(1, "month"))}>
                Next <i className="bx bx-chevron-right"></i>
              </button>
            </div>
          </div>

          <div className="row g-4" style={{ opacity: loading ? 0.6 : 1, transition: "opacity .15s" }}>
            {months.map((m) => (
              <div key={m.format("YYYY-MM")} className="col-xl-6">
                <MonthCard month={m} holidaysByDay={holidaysByDay} today={today} />
              </div>
            ))}
          </div>

          <div className="hc-legend mt-4">
            <span><span className="hc-swatch" style={{ background: "#fdecee" }} />Public Holiday</span>
            <span><span className="hc-swatch" style={{ background: "#fff4dc" }} />Special Holiday</span>
            <span><span className="hc-swatch" style={{ background: "var(--primary-light)", boxShadow: "inset 0 0 0 2px var(--primary-color)" }} />Today</span>
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header pb-2">
          <h5 className="m-0">Holidays in {months[0].format("MMMM")} – {months[1].format("MMMM YYYY")}</h5>
        </div>
        <div className="card-body pt-2">
          {listed.length === 0 ? (
            <div className="text-muted text-center py-3">{loading ? "Loading…" : "No holidays in these months."}</div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr><th>Date</th><th>Day</th><th>Holiday</th><th>Type</th></tr>
                </thead>
                <tbody className="table-border-bottom-0">
                  {listed.map((h) => {
                    const isPublic = (h.holidayType || "").toUpperCase() === PUBLIC_TYPE;
                    return (
                      <tr key={h.idHoliday}>
                        <td>{Utils.formatDisplayDate(h.holidayDate)}</td>
                        <td>{moment(h.holidayDate).format("dddd")}</td>
                        <td>{h.holidayDescription || "—"}</td>
                        <td><span className={`badge ${isPublic ? "bg-label-danger" : "bg-label-warning"}`}>{typeLabel(h)}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HolidayCalendar;
