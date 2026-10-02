import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import ShiftManagementService from "../../core/services/ShiftManagementService";
import ShiftSetupService from "../../core/services/ShiftSetupService";
import { showToast } from '../../components/ToastNotifications/toastUtils';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isoWeek);

const ShiftAssignment = () => {
  const [weekStart, setWeekStart] = useState(dayjs().startOf('isoWeek'));
  const [selectedShift, setSelectedShift] = useState(null);
  const [officeOptions, setOfficeOptions] = useState([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState("");
  const [shiftOptions, setShiftOptions] = useState([]);
  const [scheduleList, setScheduleList] = useState([]);
  const [shiftTimes, setShiftTimes] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [existingAssignments, setExistingAssignments] = useState({});
  const [popupInfo, setPopupInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const today = dayjs().startOf('day');

  // Copy modal state
  const [copyModalInfo, setCopyModalInfo] = useState(null); // { sourceDate: dayjs }
  const [copyTargetDates, setCopyTargetDates] = useState([]);
  const [showCopyConfirm, setShowCopyConfirm] = useState(false);

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    weekStart.add(i, 'day')
  );

  const isPastWeek = weekStart.endOf('week').isBefore(today);

  useEffect(() => {
    let isMounted = true;

    const getOfficeOptions = async () => {
    setLoading(true);
      try {
        const response = await ShiftSetupService.getShiftSetupDetails();
        if (!isMounted) return;
        if (response.error || !response.data?.success) {
          showToast(response.error || response.data?.message || "Unable to load offices.", "error");
          return;
        }

        setOfficeOptions(
          (response.data.data || []).map((office) => ({
            value: office.idOffice,
            label: `${office.officeCode} - ${office.officeName}`,
          })),
        );
      } catch {
        if (isMounted) showToast("Unable to load offices.", "error");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    getOfficeOptions();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChangeOffice = async (event) => {
    const officeId = event.target.value;
    setSelectedOfficeId(officeId);
    setSelectedShift(null);
    setShiftOptions([]);
    setScheduleList([]);
    setShiftTimes([]);
    setEmployeeList([]);
    setAssignments({});
    setExistingAssignments({});

    if (!officeId) return;

    setLoading(true);
    try {
      const response = await ShiftManagementService.getShiftList(Number(officeId));
      if (response.error) return;
      if (!response.data?.success) {
        showToast(response.data?.message || "Unable to load shifts for this office.", "error");
        return;
      }

      const sorted = (response.data.data || []).slice().sort((a, b) => a.idShift - b.idShift);
      setShiftOptions(sorted.map((shift) => ({ value: shift.idShift, label: shift.shiftName })));
    } finally {
      setLoading(false);
    }
  };

  const getScheduleList = (idShift) => ShiftManagementService.getScheduleListByShiftId(idShift);

  const loadAssignments = async (idShift, schedules) => {
    const res = await ShiftManagementService.getShiftAssignments(idShift);
    const assignmentMap = {};
    const existingMap = {};
    (res.data.data || []).forEach(entry => {
      const dateStr = dayjs(entry.startDate).format("YYYY-MM-DD");
      const schedule = schedules.find(s => s.idShiftSchedule === entry.idShiftSchedule);
      if (!schedule) return;
      const slot = `${schedule.startTime.format("h:mm A")} to ${schedule.endTime.format("h:mm A")}`;
      const key = `${dateStr}|${slot}`;
      if (!assignmentMap[key]) assignmentMap[key] = [];
      if (!assignmentMap[key].includes(entry.idEmployee))
        assignmentMap[key].push(entry.idEmployee);
      if (!existingMap[key]) existingMap[key] = {};
      existingMap[key][entry.idEmployee] = entry.idShiftAssignment;
    });
    setAssignments(assignmentMap);
    setExistingAssignments(existingMap);
  };

  const getEmployeeList = (idShift) => {
    return ShiftManagementService.getEmployeeListByShiftId(idShift).then(res => {
      setEmployeeList(res.data.data || []);
      });
    };

  const handleChangeShift = async (e) => {
    const selected = shiftOptions.find(opt => opt.value === parseInt(e.target.value));
    setSelectedShift(selected);
    setWeekStart(dayjs().startOf('isoWeek'));
    if (!selected) {
      setScheduleList([]);
      setShiftTimes([]);
      setEmployeeList([]);
      setAssignments({});
      setExistingAssignments({});
      return;
    }

    setLoading(true);
    try {
      const scheduleRes = await getScheduleList(selected.value);
      const formattedSchedules = (scheduleRes.data.data || []).map(s => ({
          ...s,
          startTime: dayjs(`2000-01-01 ${s.startTime}`, "YYYY-MM-DD HH:mm:ss"),
          endTime: dayjs(`2000-01-01 ${s.endTime}`, "YYYY-MM-DD HH:mm:ss"),
          workDays: s.workDays ? s.workDays.split(',') : [],
        }));
      setScheduleList(formattedSchedules);
      setShiftTimes(formattedSchedules.map(s => `${s.startTime.format("h:mm A")} to ${s.endTime.format("h:mm A")}`));

      await getEmployeeList(selected.value);
      await loadAssignments(selected.value, formattedSchedules);
    } catch {
      showToast("Unable to load shift assignment details.", "error");
    } finally {
      setLoading(false);
    }
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
    const isChecked = e.target.checked;

    setAssignments(prev => {
      const current = prev[key] || [];
      let updated;
      if (isChecked) {
        updated = current.includes(idEmployee)
          ? current
          : [...current, idEmployee];
      } else {
        updated = current.filter(id => id !== idEmployee);
      }
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
      if (isChecked) {
        return {
          ...prev,
          [key]: { ...prevKey, [idEmployee]: prevKey[idEmployee] ?? null }
        };
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

  // Check if a date column has any assignments
  const dateHasAssignments = (day) => {
    const dateStr = day.format('YYYY-MM-DD');
    return Object.keys(assignments).some(key => key.startsWith(`${dateStr}|`));
  };

  const handleOpenCopyModal = (day, e) => {
    e.stopPropagation();
    setCopyModalInfo({ sourceDate: day });
    setCopyTargetDates([]);
  };

  const toggleCopyTargetDate = (day) => {
    const dateStr = day.format('YYYY-MM-DD');
    setCopyTargetDates(prev =>
      prev.includes(dateStr)
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  const handleCopyAssignments = async () => {
    if (!copyModalInfo || copyTargetDates.length === 0) return;
    setShowCopyConfirm(false);
    setLoading(true);

    try {
      const results = await Promise.all(
        copyTargetDates.map(targetDate =>
          ShiftManagementService.copyShiftAssignmentsByDate({
            idShif: selectedShift?.value,
            sourceDate: copyModalInfo.sourceDate.format('YYYY-MM-DDTHH:mm:ss'),
            targetDate: dayjs(targetDate).format('YYYY-MM-DDTHH:mm:ss'),
          })
        )
      );

      const allSuccess = results.every(r => !r.error);
      if (allSuccess) {
        showToast("Shift assignments copied successfully.", "success");
        setCopyModalInfo(null);
        setCopyTargetDates([]);
        await loadAssignments(selectedShift.value, scheduleList);
      } else {
        showToast("Failed to copy some assignments.", "error");
      }
    } catch {
      showToast("Error copying shift assignments.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndClose = () => {
    const key = `${popupInfo.date.format("YYYY-MM-DD")}|${popupInfo.slot}`;
    const employeeIds = assignments[key] || [];
    const dateStr = popupInfo.date.format("YYYY-MM-DD");
    const scheduleIndex = shiftTimes.findIndex(t => t === popupInfo.slot);
    const schedule = scheduleList[scheduleIndex];
    const payload = [];

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

    setLoading(true);
    ShiftManagementService.saveShiftAssignments(payload)
      .then(() => {
        showToast("Shift assignments saved successfully.", "success");
        setPopupInfo(null);
      })
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
          <label className="form-label fw-bold">Office</label>
          <select
            className="form-select"
            value={selectedOfficeId}
            onChange={handleChangeOffice}
            disabled={loading && officeOptions.length === 0}
          >
            <option value="">Choose Office</option>
            {officeOptions.map((office) => (
              <option key={office.value} value={office.value}>{office.label}</option>
            ))}
          </select>
        </div>
        <div style={{ width: '300px' }}>
          <label className="form-label fw-bold">Shift Name</label>
          <select
            className="form-select"
            value={selectedShift?.value || ""}
            onChange={handleChangeShift}
            disabled={!selectedOfficeId || loading}
          >
            <option value="">Choose Shift</option>
            {shiftOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="ms-auto d-flex align-items-center gap-2">
          <button className="btn btn-sm btn-outline-primary" onClick={() => setWeekStart(prev => prev.subtract(7, 'day'))}><strong style={{ fontSize: '1.5rem', lineHeight: .5 }}>←</strong></button>
          <button className="btn btn-sm btn-outline-primary" onClick={() => setWeekStart(dayjs().startOf('isoWeek'))}><strong>Current Week</strong></button>
          <button className="btn btn-sm btn-outline-primary" onClick={() => setWeekStart(prev => prev.add(7, 'day'))}><strong style={{ fontSize: '1.5rem', lineHeight: .5 }}>→</strong></button>
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
                  color: day.isSame(today, 'day') ? '#0f5132' : undefined,
                  position: 'relative',
                }}
              >
                {day.format('DD MMM')}<br />{day.format('dddd')}
                {selectedShift && dateHasAssignments(day) && (
                  <span
                    title="Copy shifts"
                    onClick={(e) => handleOpenCopyModal(day, e)}
                    style={{ position: 'absolute', top: 6, right: 8, cursor: 'pointer', fontSize: 14, color: '#0d6efd' }}
                  >
                    <i className="bx bx-copy" />
                  </span>
                )}
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
                      verticalAlign: 'middle',
                    }}
                  >
                    {assigned.map(idEmployee => {
                      const emp = employeeList.find(e => e.idEmployee === idEmployee);
                      return (
                        <div key={idEmployee} style={{ fontSize: '10px', paddingBottom: '5px', alignContent: 'center'}}>
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


      {/* Copy Shift Assignments Modal */}
      {copyModalInfo && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 480 }}>
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: '#0f3c54', color: '#fff', borderRadius: '8px 8px 0 0' }}>
                <div>
                  <h5 className="modal-title mb-0" style={{ color: '#fff' }}>Copy shift assignments</h5>
                  <span style={{ color: '#fff', fontSize: 15, fontWeight: 500 }}>{selectedShift?.label}</span>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setCopyModalInfo(null)} />
              </div>
              <div className="modal-body">
                {/* Copying From */}
                <p className="fw-semibold mb-2" style={{ fontSize: 11, letterSpacing: 1 }}>COPYING FROM</p>
                <div className="d-flex align-items-center gap-3 p-3 mb-4 rounded" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                  <div className="text-center rounded p-2" style={{ backgroundColor: '#0f3c54', color: '#fff', minWidth: 48 }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase' }}>{copyModalInfo.sourceDate.format('MMM')}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{copyModalInfo.sourceDate.format('DD')}</div>
                  </div>
                  <div>
                    <div className="fw-semibold">{copyModalInfo.sourceDate.format('dddd, MMM D')}</div>
                    <div style={{ fontSize: 13 }}>All shifts will be copied</div>
                  </div>
                </div>

                {/* Copy To */}
                <p className="fw-semibold mb-2" style={{ fontSize: 11, letterSpacing: 1 }}>COPY TO — SELECT DATES</p>
                <div className="d-flex gap-2 flex-wrap mb-2">
                  {Array.from({ length: 12 }, (_, i) => (copyModalInfo.sourceDate.isAfter(dayjs(), 'day') ? copyModalInfo.sourceDate : dayjs()).add(i, 'day')).map(day => {
                    const dateStr = day.format('YYYY-MM-DD');
                    const isSource = dateStr === copyModalInfo.sourceDate.format('YYYY-MM-DD');
                    const isSelected = copyTargetDates.includes(dateStr);
                    return (
                      <button
                        key={dateStr}
                        onClick={() => !isSource && toggleCopyTargetDate(day)}
                        disabled={isSource}
                        style={{
                          width: 60,
                          border: isSource ? '1px solid #ccc' : isSelected ? 'none' : '1px solid #ccc',
                          borderRadius: 8,
                          padding: '6px 4px',
                          backgroundColor: isSource ? '#e9ecef' : isSelected ? '#0f3c54' : '#fff',
                          color: isSource ? '#aaa' : isSelected ? '#fff' : '#333',
                          cursor: isSource ? 'default' : 'pointer',
                          fontSize: 13,
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: 10, textTransform: 'uppercase' }}>{day.format('ddd')}</div>
                        <div style={{ fontWeight: 700 }}>{day.format('D')}</div>
                        <div style={{ fontSize: 9, textTransform: 'uppercase' }}>{day.format('MMM')}</div>
                        {isSource && <div style={{ fontSize: 9, color: '#aaa' }}>SOURCE</div>}
                      </button>
                    );
                  })}
                </div>
                {copyTargetDates.length > 0 && (
                  <p className="mt-2" style={{ fontSize: 12 }}>
                    Copying to: {copyTargetDates.map(d => dayjs(d).format('ddd MMM D')).join(', ')}
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={() => setCopyModalInfo(null)}>Cancel</button>
                <button
                  className="btn btn-primary"
                  style={{ backgroundColor: '#0f3c54', borderColor: '#0f3c54' }}
                  disabled={copyTargetDates.length === 0}
                  onClick={() => setShowCopyConfirm(true)}
                >
                  Copy assignments
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Copy Confirmation Modal */}
      {showCopyConfirm && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1080 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 400 }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Copy</h5>
                <button type="button" className="btn-close" onClick={() => setShowCopyConfirm(false)} />
              </div>
              <div className="modal-body">
                Are you sure you want to copy shift assignments to selected dates?
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={() => setShowCopyConfirm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCopyAssignments}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {popupInfo && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Assign Employees</h5>
                <button type="button" className="btn-close" onClick={() => setPopupInfo(null)}></button>
              </div>
              <div className="modal-body" style={{ maxHeight: '550px', overflowY: 'auto' }}>
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
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={handleSaveAndClose}>Save & Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftAssignment;
