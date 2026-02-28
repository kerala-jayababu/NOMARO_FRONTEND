import { useState, useEffect, useRef } from "react";
import Card from "../../components/card";
import Input from "../../components/input";
import Button from "../../components/button";
import Select from "react-select";
import CommonService from "../../core/services/CommonService";
import ShiftManagementService from "../../core/services/ShiftManagementService";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import dayjs from 'dayjs';
import { showToast } from '../../components/ToastNotifications/toastUtils';

const ShiftManagement = () => {
  const [shiftName, setShiftName] = useState("");
  const [isRegularShiftJustTimeChange, setIsRegularShiftJustTimeChange] = useState(false);
  const [shifts, setShifts] = useState([]);
  const [editingShiftId, setEditingShiftId] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);

  const [employeeRows, setEmployeeRows] = useState([]);
  const [employeesListOption, setEmployeesListOption] = useState([]);
  const [employeeMap, setEmployeeMap] = useState({});

  const [scheduleRows, setScheduleRows] = useState([]);
  const daysOfWeek = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

  const selectRef = useRef();
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [loadingShift, setLoadingShift] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [onConfirm, setOnConfirm] = useState(() => () => {});
  const [errors, setErrors] = useState({});
  const [shiftNameError, setShiftNameError] = useState(false);
  const [employeeErrors, setEmployeeErrors] = useState(false);
  const [scheduleErrors, setScheduleErrors] = useState(false);
  const [workingDaysModal, setWorkingDaysModal] = useState({
    visible: false,
    index: null,
    selectedDays: [],
  });

  useEffect(() => {
    getEmployeeOptions();
    getShiftList();
  }, []);

  const getEmployeeOptions = () => {
    CommonService.getEmployeeList()
      .then((res) => {
        const data = res.data.data;
        const options = data.map((employee) => ({
          value: employee.idEmployee,
          label: employee.fullName,
        }));
        const empMap = {};
        data.forEach((e) => {
          empMap[e.idEmployee] = {
            code: e.employeeCode,
            department: e.department,
            name: e.fullName,
            idDepartment: e.idDepartment,
            idDesignation: e.idDesignation,
          };
        });
        setEmployeeMap(empMap);
        setEmployeesListOption(options);
      })
      .catch(() => {});
  };

  const getShiftList = async () => {
    setLoadingShift(true);
    try {
      const res = await ShiftManagementService.getShiftList();
      const sortedShifts = (res.data.data || []).slice().sort((a, b) => a.idShift - b.idShift);
      setShifts(sortedShifts);
      return sortedShifts;
    } finally {
      setLoadingShift(false);
    }
  };

  const handleShiftEdit = async (idShift) => {
    setLoadingEdit(true);
    const shift = shifts.find((s) => s.idShift === idShift);
    setShiftName(shift.shiftName);
    setIsRegularShiftJustTimeChange(shift.isRegularShiftJustTimeChange ?? false);
    setEditingShiftId(idShift);
    setSelectedShift(shift);

    try {
      await Promise.all([
        getEmployeeList(idShift),
        getScheduleList(idShift)
      ]);
    } catch (err) {
      console.error("Error loading shift data", err);
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleShiftSubmit = async () => {
    let shiftPayload;
    if (!validateForm()) return;
    let shiftResponse;
    if (editingShiftId) {
      shiftPayload = { idShift: editingShiftId, shiftName, isRegularShiftJustTimeChange };
      shiftResponse = await ShiftManagementService.updateShift(shiftPayload);
    } else {
      shiftPayload = { shiftName, isRegularShiftJustTimeChange };
      shiftResponse = await ShiftManagementService.saveShift(shiftPayload);
      const freshShifts = await getShiftList();
      const createdShift = freshShifts
        .filter((s) => s.shiftName === shiftName)
        .sort((a, b) => b.idShift - a.idShift)[0];
      shiftPayload.idShift = createdShift?.idShift;
      setEditingShiftId(shiftPayload.idShift);
    }
   
    const updatedEmployeeRows = employeeRows.map((row) => ({
      ...row,
      idShift: shiftPayload.idShift,
      shiftName: shiftName,
    }));
    let employeeRes = await ShiftManagementService.saveEmployeeInShift(updatedEmployeeRows);

    const updatedScheduleRows = scheduleRows.map((row) => ({
      ...row,
      idShift: shiftPayload.idShift,
      startTime: dayjs(row.startTime).format("HH:mm:ss"),
      endTime: dayjs(row.endTime).format("HH:mm:ss"),
      workDays: (row.workDays || []).join(','),
      shiftName: shiftName,
    }));
    let scheduleRes = await ShiftManagementService.saveScheduleInShift(updatedScheduleRows);

    await Promise.all([
      getEmployeeList(shiftPayload.idShift),
      getScheduleList(shiftPayload.idShift)
    ]);
    if(shiftResponse.data.success === true && employeeRes.data.success === true 
      && scheduleRes.data.success === true){
      showToast("Shift saved successfully", "success");
      handleReset();
    }
  };

  const handleAddEmployeeRow = () => {
    setEmployeeRows([...employeeRows, {
      idShift: selectedShift?.idShift,
      shiftName: selectedShift?.shiftName
    }]);
  };

  const handleEmployeeSelect = (index, selected) => {
    const id = selected.value;
    const emp = employeeMap[id];
    const updated = [...employeeRows];
    updated[index] = {
      ...updated[index],
      idEmployee: id,
      employeeCode: emp.code,
      department: emp.department,
      employeeName: emp.name,
      idDepartment: emp.idDepartment,
      idDesignation: emp.idDesignation,
    };
    setEmployeeRows(updated);
  };

  const handleDeleteEmployee = (idEmployee) => {
    setConfirmMessage(`Are you sure you want to delete this employee?`);
      setOnConfirm(() => async () => {
        try {
          setEmployeeRows(employeeRows.filter((emp) => emp.idEmployee !== idEmployee));
        } catch (err) {
          console.error("error in removing employee ", err);
        }
      });
    setConfirmModalVisible(true);
  };

  const handleAddScheduleRow = () => {
    setScheduleRows([...scheduleRows, {
      idShift: selectedShift?.idShift,
      shiftName: selectedShift?.shiftName,
      startTime: null,
      endTime: null,
      workDays: [],
    }]);
  };

  const handleOpenWorkingDaysModal = (index) => {
    setWorkingDaysModal({
      visible: true,
      index,
      selectedDays: [...scheduleRows[index].workDays],
    });
  };

  const toggleModalDay = (day) => {
    const updated = [...workingDaysModal.selectedDays];
    const idx = updated.indexOf(day);
    if (idx > -1) updated.splice(idx, 1);
    else updated.push(day);
    setWorkingDaysModal((prev) => ({ ...prev, selectedDays: updated }));
  };

  const saveWorkingDays = () => {
    const updated = [...scheduleRows];
    updated[workingDaysModal.index].workDays = [...workingDaysModal.selectedDays];
    setScheduleRows(updated);
    setWorkingDaysModal({ visible: false, index: null, selectedDays: [] });
  };

  const handleDeleteSchedule = (index) => {
    setConfirmMessage(`Are you sure you want to delete this schedule?`);
      setOnConfirm(() => async () => {
        try {
          const updated = [...scheduleRows];
          updated.splice(index, 1); // Remove by index
          setScheduleRows(updated);
        } catch (err) {
          console.error("error in removing schedule ", err);
        }
      });
    setConfirmModalVisible(true);
  };

  const handleReset = () => {
    setShiftName("");
    setIsRegularShiftJustTimeChange(false);
    setEditingShiftId(null);
    setEmployeeRows([]);
    setScheduleRows([]);
    };

  const getEmployeeList = (idShift) => {
    return ShiftManagementService.getEmployeeListByShiftId(idShift)
    .then((res) => {
        setEmployeeRows(res.data.data);
    });
  };

  const getScheduleList = (idShift) => {
    return ShiftManagementService.getScheduleListByShiftId(idShift)
    .then((res) => {
        const formatted = (res.data.data || []).map(s => ({
        ...s,
        startTime: dayjs(`2000-01-01 ${s.startTime}`, "YYYY-MM-DD HH:mm:ss"),
        endTime: dayjs(`2000-01-01 ${s.endTime}`, "YYYY-MM-DD HH:mm:ss"),
        workDays: s.workDays ? s.workDays.split(',') : [],
      }));
        setScheduleRows(formatted);
    });
  };

  const getDuration = (index) => {
    const from = scheduleRows[index].startTime;
    const to = scheduleRows[index].endTime;
    if (!from || !to || !dayjs.isDayjs(from) || !dayjs.isDayjs(to)) return "";
    let diff = to.diff(from, 'minute');
    if (diff < 0) diff += 24 * 60;
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours}h ${minutes}m`;
  };

  const validateForm = () => {
    let isValid = true;
    let errorMessages = [];

    // Shift Name
    if (!shiftName.trim()) {
      setShiftNameError(true);
      errorMessages.push("Shift Name is required.");
      isValid = false;
    } else {
      setShiftNameError(false);
    }

    // Employee list
    if (employeeRows.length === 0) {
      errorMessages.push("At least one employee must be added.");
      isValid = false;
    }

    const empErrors = employeeRows.map(emp =>
      !emp.employeeName || !emp.employeeCode || !emp.department
    );
    setEmployeeErrors(empErrors);

    if (empErrors.some(err => err)) {
      errorMessages.push("Some employee rows have missing fields.");
      isValid = false;
    }

    // Schedule list
    if (scheduleRows.length === 0) {
      errorMessages.push("At least one schedule must be added.");
      isValid = false;
    }

    const schedErrors = scheduleRows.map(s =>
      !s.startTime || !s.endTime || !dayjs(s.startTime).isValid() || !dayjs(s.endTime).isValid() || !(s.workDays?.length > 0)
    );
    setScheduleErrors(schedErrors);

    if (schedErrors.some(err => err)) {
      errorMessages.push("Some schedule rows have missing data.");
      isValid = false;
    }

    if (!isValid) {
      errorMessages.forEach(msg => showToast(msg, "error"));
    }

    return isValid;
  };


  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {loadingShift && (
        <div style={{position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(255, 255, 255, 0.7)", zIndex: 9999, display: "flex", alignItems: "center",
          justifyContent: "center",
          }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
           </div>
        </div>
      )}
      <div className="row">
        <div className="col-md-3">
          <Card title="List of Shifts">
            <ul className="list-group">
              {shifts.map((shift) => (
                <li key={shift.idShift} className="list-group-item d-flex justify-content-between align-items-center">
                  {shift.shiftName}
                  <span onClick={() => handleShiftEdit(shift.idShift)} style={{ cursor: "pointer" }} className="bx bx-pencil"></span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="col-md-9" style={{ position: "relative" }}>
            {loadingEdit && (
              <div style={{position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                    backgroundColor: "rgba(255, 255, 255, 0.7)", zIndex: 9999, display: "flex", alignItems: "center",
                    justifyContent: "center",
                }}
              >
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}
          <Card title="Add/Update Shifts">
            <div className="row g-2 justify-content-between">
              <div className="col-6">
                <Input label="Shift Name" value={shiftName} onChange={(e) => {setShiftName(e.target.value);setShiftNameError(false);}} placeholder="Shift Name" className={shiftNameError ? "is-invalid" : ""}/>
              </div>
              <div className="col-6 d-flex align-items-center gap-2" style={{paddingTop:'20px'}}>
                <input
                  type="checkbox"
                  id="isRegularShiftJustTimeChange"
                  className="form-check-input"
                  style={{ width: "1.1rem", height: "1.1rem", cursor: editingShiftId ? "not-allowed" : "pointer", flexShrink: 0 }}
                  checked={isRegularShiftJustTimeChange}
                  disabled={!!editingShiftId}
                  onChange={(e) => setIsRegularShiftJustTimeChange(e.target.checked)}
                />
                <label htmlFor="isRegularShiftJustTimeChange" className="form-check-label mb-0" style={{ cursor: editingShiftId ? "not-allowed" : "pointer" }}>
                   Regular Shift – Time Change Only
                </label>
              </div>
            </div>
            <br/>
            <label className="form-label mb-1"><b>Employees</b></label>
            <table className="table table-bordered table-sm" style={{ tableLayout: "fixed", width: "100%" }}>
              <colgroup>
                <col style={{ width: "40%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "30%" }} />
                <col style={{ width: "10%"}} />
              </colgroup>
              <thead>
                <tr>
                  <th>EMP Name</th>
                  <th>Emp Code</th>
                  <th>Department</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {employeeRows.map((emp, index) => (
                  <tr key={emp.idShiftEmployee} className={errors[`emp-${index}`] ? 'table-danger' : ''}>
                    <td>
                      <Select ref={selectRef} options={employeesListOption} onChange={(selected) => handleEmployeeSelect(index, selected)} 
                      value={employeesListOption.find(opt => opt.value === emp.idEmployee) || null} placeholder="Select Employee"
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                        className={employeeErrors[index] ? "is-invalid" : ""}
                      />
                    </td>
                    <td>{emp.employeeCode}</td>
                    <td>{emp.department}</td>
                    <td>
                      <div className="d-flex align-items-center" style={{ gap: "6px" }}>
                        <button className="btn btn-outline-danger border-0" style={{padding: "0.2rem 0.1rem", fontSize: "0.60rem", borderRadius:" 0.01rem"}} onClick={() => handleDeleteEmployee(emp.idEmployee)}>
                          <i className="bx bx-trash"></i>
                        </button>
                        {index === employeeRows.length - 1 && (
                          <button className="btn btn-outline-primary border-0" style={{padding: "0.2rem 0.1rem", fontSize: "0.60rem", borderRadius:" 0.1rem"}} onClick={handleAddEmployeeRow}>
                            <i className="bx bx-plus"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {employeeRows.length === 0?
                <tr>
                  <td colSpan={4} align="right">
                    <button className="btn btn-outline-primary border-0" style={{padding: "0.2rem 0.1rem", fontSize: "0.60rem", borderRadius:" 0.1rem"}} onClick={handleAddEmployeeRow}>
                      <i className="bx bx-plus"></i>
                    </button>
                  </td>
                </tr>:<tr></tr>
                }
              </tbody>
            </table>
            {errors.employeeRows && <div className="text-danger">Please add at least one employee</div>}
          <br/>
            <label className="form-label mb-1"><b>Schedules</b></label>
            <table className="table table-bordered" style={{ tableLayout: "fixed", width: "100%" }}>
              <colgroup>
                <col style={{ width: "20%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "45%" }} />
                <col style={{ width: "15%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Schedules</th>
                  <th>Duration</th>
                  <th>Working Days</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {scheduleRows.map((s, index) => (
                  <tr key={s.id} className={errors[`sch-${index}`] ? 'table-danger' : ''}>
                    <td>
                      <LocalizationProvider dateAdapter={AdapterDayjs} >
                        <div className={scheduleErrors[index] ? "border border-danger rounded p-2" : ""}>
                          <MobileTimePicker value={s.startTime ? dayjs(s.startTime) : null}
                            onChange={(newValue) => {
                              const updated = [...scheduleRows];
                              updated[index].startTime = newValue;
                              setScheduleRows(updated);
                            }}
                            ampm={true}
                            minutesStep={1} 
                            slotProps={{
                              textField: {
                                variant: 'standard', // or 'filled', or remove completely
                                InputLabelProps: {
                                  style: { fontSize: '0.6rem' }, // 👈 shrink the label size here
                                },
                                InputProps: {
                                  disableUnderline: true, // removes underline
                                  style: {
                                    border: 'none', // removes border
                                    backgroundColor: 'transparent', // optional
                                    padding: 0,
                                    fontSize: '0.80rem',
                                  },
                                },
                              },
                              popper: {
                                modifiers: [
                                  {
                                    name: 'offset',
                                    options: {
                                      offset: [0, 2],
                                    },
                                  },
                                ],
                                sx: {
                                  '& .MuiClock-root': {
                                    transform: 'scale(0.10)', // Reduce size
                                  },
                                  '& .MuiTypography-root': {
                                    fontSize: '0.10rem', // Reduce font inside clock
                                  },
                                },
                              },
                              openPickerIcon: {
                                sx: { fontSize: 12 } // ✅ Set desired icon size here
                              }
                            }}
                            />
                          <MobileTimePicker value={s.endTime ? dayjs(s.endTime) : null}
                            onChange={(newValue) => {
                              const updated = [...scheduleRows];
                              updated[index].endTime = newValue;
                              
                              if (updated[index].startTime && newValue) {
                                const from = dayjs(updated[index].startTime);
                                const to = dayjs(newValue);
                                const diff = to.diff(from, 'minute');
                                updated[index].totalDurationHours = Math.floor(diff / 60);
                                updated[index].totalDurationMinutes = diff % 60;
                              }
                              setScheduleRows(updated);
                            }}
                            ampm={true}
                            minutesStep={1} 
                            slotProps={{
                              textField: {
                                variant: 'standard', // or 'filled', or remove completely
                                InputLabelProps: {
                                  style: { fontSize: '0.6rem' }, // 👈 shrink the label size here
                                },
                                InputProps: {
                                  disableUnderline: true, // removes underline
                                  style: {
                                    border: 'none', // removes border
                                    backgroundColor: 'transparent', // optional
                                    padding: 0,
                                    fontSize: '0.80rem',
                                  },
                                },
                              },
                              popper: {
                                modifiers: [
                                  {
                                    name: 'offset',
                                    options: {
                                      offset: [0, 4],
                                    },
                                  },
                                ],
                                sx: {
                                  '& .MuiClock-root': {
                                    transform: 'scale(0.60)', // Reduce size
                                  },
                                  '& .MuiTypography-root': {
                                    fontSize: '0.60rem', // Reduce font inside clock
                                  },
                                },
                              },
                              openPickerIcon: {
                                sx: { fontSize: 12 } // ✅ Set desired icon size here
                              }
                            }}
                            />
                        </div>
                      </LocalizationProvider>   
                    </td>
                    <td>{getDuration(index)}</td>
                    <td onClick={() => handleOpenWorkingDaysModal(index)} style={{ cursor: 'pointer', fontSize: '0.8rem' }}>
                      {s.workDays.length > 0 ? s.workDays.join(', ') : <i className="text-muted">Click to select</i>}
                    </td>
                    <td>
                      <div className="d-flex align-items-center" style={{ gap: "6px" }}>
                        <button className="btn btn-outline-danger border-0" style={{padding: "0.1rem 0.1rem", fontSize: "0.6rem", borderRadius:" 0.1rem"}} onClick={() => handleDeleteSchedule(index)}>
                          <i className="bx bx-trash"></i>
                        </button>
                        {index === scheduleRows.length - 1 && !(isRegularShiftJustTimeChange && scheduleRows.length >= 1) && (
                          <button className="btn btn-outline-primary border-0" style={{padding: "0.1rem 0.1rem", fontSize: "0.6rem", borderRadius:" 0.1rem"}} onClick={handleAddScheduleRow}>
                            <i className="bx bx-plus"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {scheduleRows.length === 0 ?
                  <tr>
                    <td colSpan={4} align="right">
                      <button className="btn btn-outline-primary border-0" style={{padding: "0.2rem 0.1rem", fontSize: "0.60rem", borderRadius:" 0.1rem"}} onClick={handleAddScheduleRow}>
                        <i className="bx bx-plus"></i>
                      </button>
                    </td>
                  </tr>
                  : <tr></tr>
                }
                {isRegularShiftJustTimeChange && scheduleRows.length >= 1 && (
                  <tr>
                    <td colSpan={4}>
                      <small className="text-muted fst-italic">Only one schedule is allowed for a Regular Shift.</small>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>

          <div className="text-center mt-3">
            <Button className="btn btn-primary px-4 me-2" onClick={handleShiftSubmit}>Submit</Button>
            <Button className="btn btn-outline-secondary px-4" onClick={handleReset}>Reset</Button>
          </div>
          {confirmModalVisible && (
            <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} >
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Confirm Delete</h5>
                    <button type="button" className="btn-close" onClick={() => setConfirmModalVisible(false)}></button>
                  </div>
                  <div className="modal-body">
                    <p>{confirmMessage}</p>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-danger" onClick={() => { onConfirm();setConfirmModalVisible(false); }} >
                      Delete
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setConfirmModalVisible(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Working Days Modal */}
          {workingDaysModal.visible && (
            <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              <div className="modal-dialog" style={{width: "300px"}}>
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Select Working Days</h5>
                    <button type="button" className="btn-close" onClick={() => setWorkingDaysModal({ visible: false, index: null, selectedDays: [] })}></button>
                  </div>
                  <div className="modal-body">
                    <button className="btn btn-sm btn-outline-primary mb-2"
                      onClick={() => {
                        const allSelected = daysOfWeek.every(day => workingDaysModal.selectedDays.includes(day));
                        setWorkingDaysModal(prev => ({
                          ...prev,
                          selectedDays: allSelected ? [] : [...daysOfWeek],
                        }));
                      }}
                    >
                      {daysOfWeek.every(day => workingDaysModal.selectedDays.includes(day)) ? 'Unselect All' : 'Select All'}
                    </button>
                    {daysOfWeek.map((day) => (
                      <div key={day} className="form-check">
                        <input className="form-check-input" type="checkbox" id={day}
                          checked={workingDaysModal.selectedDays.includes(day)}
                          onChange={() => toggleModalDay(day)} />
                        <label className="form-check-label" htmlFor={day}>
                          {day}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-primary" onClick={saveWorkingDays}>Save</button>
                    <button className="btn btn-outline-secondary" onClick={() => setWorkingDaysModal({ visible: false, index: null, selectedDays: [] })}>Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShiftManagement;
