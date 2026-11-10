import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import EmployeeCalendarService from "../core/services/EmployeeCalendarService";
import ConfirmationModal from "./ConfirmationModal";
import Utils from "../utils/Utils";

const UPCOMING_DAYS = 7;

const fmtDayMonth = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-GB", { month: "short" });
  const format = Utils.DATE_PICKER_FORMAT.toLowerCase();
  return format.indexOf("mm") < format.indexOf("dd")
    ? `${month} ${day}`
    : `${day} ${month}`;
};
const fmtDate = (d) => Utils.formatDisplayDate(d);
const fmtTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${Utils.formatDisplayDate(date)} ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
};
const initials = (name) => (name || "").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
const yearsText = (y) => `${y} ${y === 1 ? "Year" : "Years"}`;

const Avatar = ({ person, tone }) => (
  <div className="avatar flex-shrink-0 me-3">
    {person.employeePhoto ? (
      <img src={`data:image/jpeg;base64,${person.employeePhoto}`} alt="" className="rounded-circle" style={{ objectFit: "cover" }} />
    ) : (
      <span className={`avatar-initial rounded-circle ${tone}`}>{initials(person.employeeName)}</span>
    )}
  </div>
);

Avatar.propTypes = { person: PropTypes.object.isRequired, tone: PropTypes.string };

/** One card: a list of employees for a birthday / anniversary section. */
const CelebrationCard = ({ title, icon, tone, people, emptyText, renderRight, renderAction }) => (
  <div className="card h-100">
    <div className="card-header d-flex align-items-center justify-content-between pb-2">
      <h6 className="m-0 d-flex align-items-center">
        <span className={`badge ${tone} rounded p-1 me-2`}><i className={`bx ${icon}`}></i></span>
        {title}
      </h6>
      <span className={`badge rounded-pill ${tone}`}>{people.length}</span>
    </div>
    <div className="card-body pt-2" style={{ maxHeight: 340, overflowY: "auto" }}>
      {people.length === 0 ? (
        <div className="text-muted small text-center py-4">{emptyText}</div>
      ) : (
        <ul className="list-unstyled mb-0">
          {people.map((p) => (
            <li key={p.idEmployee} className="d-flex align-items-center py-2 border-bottom">
              <Avatar person={p} tone={tone} />
              <div className="flex-grow-1 me-2" style={{ minWidth: 0 }}>
                <div className="fw-semibold text-truncate">{p.employeeName}</div>
                <small className="text-muted d-block text-truncate">
                  {[p.designationName, p.departmentName].filter(Boolean).join(" · ") || p.employeeCode}
                </small>
              </div>
              <div className="text-end flex-shrink-0">
                {renderRight(p)}
                {renderAction && <div className="mt-1">{renderAction(p)}</div>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);

CelebrationCard.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  tone: PropTypes.string.isRequired,
  people: PropTypes.array.isRequired,
  emptyText: PropTypes.string.isRequired,
  renderRight: PropTypes.func.isRequired,
  renderAction: PropTypes.func,
};

/**
 * Today's and upcoming birthdays and work anniversaries.
 * allowSend = true on the Payroll page: today's rows get a "Send Wishes" email action.
 */
function Celebrations({ allowSend = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null); // { person, occasion }
  const [sending, setSending] = useState({}); // key -> true while sending

  const load = () => {
    setLoading(true);
    EmployeeCalendarService.getCelebrations(UPCOMING_DAYS).then((res) => {
      setLoading(false);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setData(res.data?.data || null);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const keyOf = (person, occasion) => `${occasion}-${person.idEmployee}`;

  const send = (person, occasion) => {
    const key = keyOf(person, occasion);
    setSending((s) => ({ ...s, [key]: true }));
    EmployeeCalendarService.sendCongratulationsEmail(person.idEmployee, occasion).then((res) => {
      setSending((s) => ({ ...s, [key]: false }));
      if (res.error) {
        toast.error(res.error);
        if (/already sent/i.test(res.error)) load();
        return;
      }
      toast.success(res.data?.message || "Email sent");
      // Mark as sent straight away so it cannot be sent twice
      const sentOn = res.data?.data || new Date().toISOString();
      const listKey = occasion === "BIRTHDAY" ? "todaysBirthdays" : "todaysWorkAnniversaries";
      setData((d) => ({
        ...d,
        [listKey]: d[listKey].map((p) => (p.idEmployee === person.idEmployee ? { ...p, emailSentOn: sentOn } : p)),
      }));
    });
  };

  const sendAction = (occasion) => (person) => {
    if (person.emailSentOn) {
      return (
        <span className="badge bg-label-success" title={`Sent on ${fmtTime(person.emailSentOn)}`}>
          <i className="bx bx-check me-1"></i>Wishes sent
        </span>
      );
    }
    if (!person.hasEmail) return <span className="badge bg-label-secondary">No email</span>;
    const busy = sending[keyOf(person, occasion)];
    return (
      <button type="button" className="btn btn-sm btn-outline-primary py-0 px-2" disabled={busy}
        onClick={() => setConfirm({ person, occasion })}>
        <i className="bx bx-envelope me-1"></i>{busy ? "Sending…" : "Send Wishes"}
      </button>
    );
  };

  const confirmCallback = (ok) => {
    const c = confirm;
    setConfirm(null);
    if (ok && c) send(c.person, c.occasion);
  };

  const inDays = (p) => (p.daysAway === 1 ? "Tomorrow" : `in ${p.daysAway} days`);

  if (loading && !data) {
    return <div className="text-center text-muted py-5">Loading…</div>;
  }
  if (!data) return null;

  return (
    <>
      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <CelebrationCard title="Today's Birthdays" icon="bx-cake" tone="bg-label-danger"
            people={data.todaysBirthdays} emptyText="No birthdays today."
            renderRight={() => <span className="badge bg-label-danger">Today</span>}
            renderAction={allowSend ? sendAction("BIRTHDAY") : null} />
        </div>
        <div className="col-lg-6">
          <CelebrationCard title="Upcoming Birthdays" icon="bx-calendar-event" tone="bg-label-warning"
            people={data.upcomingBirthdays} emptyText={`No birthdays in the next ${data.upcomingDays} days.`}
            renderRight={(p) => (
              <>
                <div className="fw-semibold">{fmtDayMonth(p.occasionDate)}</div>
                <small className="text-muted">{inDays(p)}</small>
              </>
            )} />
        </div>
      </div>
      <div className="row g-4">
        <div className="col-lg-6">
          <CelebrationCard title="Today's Work Anniversaries" icon="bx-award" tone="bg-label-primary"
            people={data.todaysWorkAnniversaries} emptyText="No work anniversaries today."
            renderRight={(p) => (
              <>
                <div className="fw-semibold">{yearsText(p.yearsOfService)}</div>
                <small className="text-muted">Joined {fmtDate(p.joiningDate)}</small>
              </>
            )}
            renderAction={allowSend ? sendAction("WORKANNIVERSARY") : null} />
        </div>
        <div className="col-lg-6">
          <CelebrationCard title="Upcoming Work Anniversaries" icon="bx-briefcase-alt-2" tone="bg-label-info"
            people={data.upcomingWorkAnniversaries} emptyText={`No work anniversaries in the next ${data.upcomingDays} days.`}
            renderRight={(p) => (
              <>
                <div className="fw-semibold">{yearsText(p.yearsOfService)} – {fmtDayMonth(p.occasionDate)}</div>
                <small className="text-muted">{inDays(p)}</small>
              </>
            )} />
        </div>
      </div>

      {confirm && (
        <ConfirmationModal
          modalShow={true}
          title={confirm.occasion === "BIRTHDAY" ? "Birthday Wishes" : "Work Anniversary Wishes"}
          messageText={`Send a congratulations email to ${confirm.person.employeeName}?`}
          callbackModal={confirmCallback}
          confirmBtn="Send"
          CancelBtn="Cancel"
        />
      )}
    </>
  );
}

Celebrations.propTypes = { allowSend: PropTypes.bool };

export default Celebrations;
