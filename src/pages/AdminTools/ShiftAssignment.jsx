import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import ShiftManagementService from "../../core/services/ShiftManagementService";
import { showToast } from '../../components/ToastNotifications/toastUtils';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isoWeek);

const ShiftAssignment = () => {
  const [weekStart, setWeekStart] = useState(dayjs().startOf('isoWeek'));
  const [selectedShift, setSelectedShift] = useState(null);
  const [shiftOptions, setShiftOptions] = useState([]);
  const [scheduleList, setScheduleList] = useState([]);
  const [shiftTimes, setShiftTimes] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [existingAssignments, setExistingAssignments] = useState({});
  const [popupInfo, setPopupInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const today = dayjs().startOf('day');

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    weekStart.add(i, 'day')
  );

  const isPastWeek = weekStart.endOf('week').isBefore(today);

  useEffect(() => {
      getShiftList();
    }, []);

  const getShiftList = () => {
    setLoading(true);
      ShiftManagementService.getShiftList()
      .then((res) => {
      const sorted = (res.data.data || []).sort((a, b) => a.idShift - b.idShift);
      setShiftOptions(sorted.map(shift => ({ value: shift.idShift, label: shift.shiftName })));
      })
      .finally(() => setLoading(false));
    };

  const getScheduleList = (idShift) => ShiftManagementService.getScheduleListByShiftId(idShift);

  const getEmployeeList = (idShift) => {
    return ShiftManagementService.getEmployeeListByShiftId(idShift).then(res => {
      setEmployeeList(res.data.data || []);
      });
    };

  const handleChangeShift = async (e) => {
    const selected = shiftOptions.find(opt => opt.value === parseInt(e.target.value));
    setSelectedShift(selected);
    setWeekStart(dayjs().startOf('isoWeek'));
    setLoading(true);

    const scheduleRes = await getScheduleList(selected?.value);
    const formattedSchedules = (scheduleRes.data.data || []).map(s => ({
          ...s,
          startTime: dayjs(`2000-01-01 ${s.startTime}`, "YYYY-MM-DD HH:mm:ss"),
          endTime: dayjs(`2000-01-01 ${s.endTime}`, "YYYY-MM-DD HH:mm:ss"),
          workDays: s.workDays ? s.workDays.split(',') : [],
        }));
    setScheduleList(formattedSchedules);
    setShiftTimes(formattedSchedules.map(s => `${s.startTime.format("h:mm A")} to ${s.endTime.format("h:mm A")}`));

    await getEmployeeList(selected.value);

    ShiftManagementService.getShiftAssignments(selected.value).then(res => {
      const assignmentMap = {};
      const existingMap = {};

      (res.data.data || []).forEach(entry => {
        const dateStr = dayjs(entry.startDate).format("YYYY-MM-DD");
        const schedule = formattedSchedules.find(s => s.idShiftSchedule === entry.idShiftSchedule);
        if (!schedule) return;

        const slot = `${schedule.startTime.format("h:mm A")} to ${schedule.endTime.format("h:mm A")}`;
        const key = `${dateStr}|${slot}`;

        if (!assignmentMap[key]) assignmentMap[key] = [];
        assignmentMap[key].push(entry.idEmployee);

        if (!existingMap[key]) existingMap[key] = {};
        existingMap[key][entry.idEmployee] = entry.idShiftAssignment;
      });

      setAssignments(assignmentMap);
      setExistingAssignments(existingMap);
    }).finally(() => setLoading(false));
  };

  const handleCellClick = (date, slot) => {
    if (isPastWeek || date.isBefore(today, 'day')) return;
    const schedule = scheduleList[shiftTimes.indexOf(slot)];
    if (!schedule?.workDays.includes(date.format('dddd').toUpperCase())) return;
    setPopupInfo({ date, slot });
  };

  const getAssignedEmployees = (date, slot) => {
    const key = `${date.format("YYYY-MM-DD")}|${slot}`;
    return assignments[key] || [];
  };

  const toggleEmployeeSelection = (idEmployee, e) => {
    const key = `${popupInfo.date.format("YYYY-MM-DD")}|${popupInfo.slot}`;
    const current = assignments[key] || [];
    const isSelected = current.includes(idEmployee);
    const isChecked = e.target.checked;
    let updated = [];
    if(isChecked){
      updated = isSelected
        ? current.filter(id => id !== idEmployee)
        : current.length < 5 ? [...current, idEmployee] : current;
    } else {
      updated = current.filter(id => id !== idEmployee);
    }

    setAssignments(prev => {
      const newMap = { ...prev };
      if (updated.length > 0) {
        newMap[key] = updated;
      } else {
        delete newMap[key];
      }
      return newMap;
    });

    setExistingAssignments(prev => {
      const prevKey = prev[key] || {};
      if (!isSelected) {
        if(isChecked) {
          return {
            ...prev,
            [key]: { ...prevKey, [idEmployee]: prevKey[idEmployee] ?? null }
          };
        } else {
            return Object.fromEntries(
              Object.entries(prev).filter(([_, empMap]) => !(idEmployee in empMap))
            );
        }
      } else {
        const newEntry = { ...prevKey };
        delete newEntry[idEmployee];
        if (Object.keys(newEntry).length === 0) {
          const newMap = { ...prev };
          delete newMap[key];
          return newMap;
        }
        return { ...prev, [key]: newEntry };
      }
    });
  };

  const handleSubmit = () => {
    if (isPastWeek) return alert("Cannot submit past week shifts.");

    const payload = [];

    Object.entries(assignments).forEach(([key, employeeIds]) => {
      if (!employeeIds || employeeIds.length === 0) return;

      const [dateStr, slotLabel] = key.split("|");
      const scheduleIndex = shiftTimes.findIndex(t => t === slotLabel);
      const schedule = scheduleList[scheduleIndex];

      employeeIds.forEach(empId => {
        const employee = employeeList.find(e => e.idEmployee === empId);
        const existingId = existingAssignments?.[key]?.[empId] ?? null;

        if (employee && schedule) {
          payload.push({
            idShiftAssignment: existingId,
            idEmployee: empId,
            idShift: selectedShift?.value,
            idShiftSchedule: schedule.idShiftSchedule,
            startDate: dayjs(dateStr).format('YYYY-MM-DD'),
            endDate: dayjs(dateStr).format('YYYY-MM-DD'),
            totalDurationMinutes: schedule.endTime.diff(schedule.startTime, 'minute'),
            totalDurationHours: parseFloat((schedule.endTime.diff(schedule.startTime, 'minute') / 60).toFixed(2)),
            attendanceStatus: true,
            employeeCode: employee.employeeCode,
            employeeName: employee.employeeName,
            shiftName: selectedShift.label,
            department: employee.department,
            designation: employee.designation,
            idDepartment: employee.idDepartment,
            idDesignation: employee.idDesignation
          });
        }
      });
    });

    setLoading(true);
    ShiftManagementService.saveShiftAssignments(payload)
      .then(() => showToast("Shift assignments saved successfully.", "success"))
      .catch(err => {
        console.error("Save failed:", err);
        showToast("Error saving shift assignments.", "error");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {loading && (
        <div style={{position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(255, 255, 255, 0.7)", zIndex: 9999, display: "flex", alignItems: "center",
          justifyContent: "center",}}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      <h5 className="mb-3">Shift Assignment</h5>

      <div className="d-flex align-items-center mb-3 gap-3">
        <div style={{ width: '300px' }}>
          <label className="form-label fw-bold">Shift Name</label>
          <select className="form-select" onChange={handleChangeShift}>
            <option value="">Choose Shift</option>
            {shiftOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="ms-auto d-flex align-items-center gap-2">
          <button className="btn btn-sm btn-outline-primary" onClick={() => setWeekStart(prev => prev.subtract(7, 'day'))}><strong>←</strong></button>
          <button className="btn btn-sm btn-outline-primary" onClick={() => setWeekStart(dayjs().startOf('isoWeek'))}><strong>Current Week</strong></button>
          <button className="btn btn-sm btn-outline-primary" onClick={() => setWeekStart(prev => prev.add(7, 'day'))}><strong>→</strong></button>
        </div>
      </div>

      <table className="table table-bordered text-center" style={{ tableLayout: "fixed", width: "100%" }}>
        <colgroup>
          <col style={{ width: "12.5%" }} />
          <col style={{ width: "12.5%" }} />
          <col style={{ width: "12.5%" }} />
          <col style={{ width: "12.5%" }} />
          <col style={{ width: "12.5%" }} />
          <col style={{ width: "12.5%" }} />
          <col style={{ width: "12.5%" }} />
          <col style={{ width: "12.5%" }} />
        </colgroup>
        <thead className="table-light">
          <tr>
            <th style={{ minWidth: '180px' }}>Shift Time</th>
            {weekDays.map(day => (
              <th
                key={day.format('YYYY-MM-DD')}
                style={{
                  minWidth: '180px',
                  backgroundColor: day.isSame(today, 'day') ? '#d1e7dd' : undefined,
                  color: day.isSame(today, 'day') ? '#0f5132' : undefined
                }}
              >
                {day.format('DD MMM')}<br />{day.format('dddd')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shiftTimes.map((slot, index) => (
            <tr key={slot} style={{height: '100px'}}>
              <td><strong>{slot}</strong></td>
              {weekDays.map(day => {
                const dateStr = day.format('YYYY-MM-DD');
                const schedule = scheduleList[index];
                const isWorkDay = schedule?.workDays.includes(day.format('dddd').toUpperCase());
                const isDisabled = isPastWeek || !isWorkDay || day.isBefore(today, 'day');
                const assigned = getAssignedEmployees(day, slot);
                return (
                  <td
                    key={`${dateStr}|${slot}`}
                    onClick={() => handleCellClick(day, slot)}
                    style={{
                      backgroundColor: isDisabled ? '#eee' : assigned.length ? '#e7f1ff' : 'white',
                      color: isDisabled ? '#999' : '#000',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      padding: '10px',
                      minWidth: '150px',
                      textAlign: 'left',
                      verticalAlign: 'top',
                    }}
                  >
                    {assigned.map(idEmployee => {
                      const emp = employeeList.find(e => e.idEmployee === idEmployee);
                      return (
                        <div key={idEmployee} style={{ fontSize: '10px', paddingBottom: '5px' }}>
                          {emp?.employeeName.substring(0, 20)}
                        </div>
                      );
                    })}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <button className="btn btn-primary mt-3" onClick={handleSubmit}>Submit</button>

      {popupInfo && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Assign Employees</h5>
                <button type="button" className="btn-close" onClick={() => setPopupInfo(null)}></button>
              </div>
              <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <div className="row">
                  <ul className="list-group">
                    {employeeList.length> 0 ? (
                      employeeList.map(emp => {
                      const key = `${popupInfo.date.format("YYYY-MM-DD")}|${popupInfo.slot}`;
                      const current = assignments[key] || [];
                      const isChecked = current.includes(emp.idEmployee);

                      return (
                        <li key={emp.idEmployee} className="list-group-item">
                            <label>
                              <input type="checkbox" className="me-2"checked={isChecked}
                                onChange={(e) => toggleEmployeeSelection(emp.idEmployee, e)} />
                                {emp.employeeName}
                            </label>
                        </li>
                      );f
                    })) : (
                      <tr>
                        <td colSpan={3} className="text-start">
                          <div className="Nodatafound_box p-2">
                            <h6 className='m-0'>
                              No Employees added to the Shift!
                            </h6>
                          </div>
                        </td>
                      </tr>
                    )}
                  </ul>
                </div>
                <div className="text-end mt-3">
                  <button className="btn btn-primary" onClick={() => setPopupInfo(null)}>Save & Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftAssignment;
