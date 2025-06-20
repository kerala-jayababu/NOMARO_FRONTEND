import { useState, useEffect, useRef } from "react";
import Card from "../../components/card";
import Input from "../../components/input";
import Button from "../../components/button";
import Select from "react-select";
import { DeleteIcon, AddIcon } from "../../components/icons";
import CommonService from "../../core/services/CommonService";
import ShiftManagementService from "../../core/services/ShiftManagementService";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import dayjs from 'dayjs';
import { showToast } from '../../components/ToastNotifications/toastUtils';
import { Modal as BootstrapModal} from "react-bootstrap";

const ShiftManagement = () => {
  const [shiftName, setShiftName] = useState("");
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

  const getShiftList = () => {
    setLoadingShift(true);
    ShiftManagementService.getShiftList()
    .then((res) => {
      const sortedShifts = (res.data.data || []).slice().sort((a, b) => a.idShift - b.idShift);
      setShifts(sortedShifts);
    }).finally(()=> setLoadingShift(false));
  };

  const handleShiftEdit = async (idShift) => {
    setLoadingEdit(true);
    const shift = shifts.find((s) => s.idShift === idShift);
    setShiftName(shift.shiftName);
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

    if (editingShiftId) {
      shiftPayload = { idShift: editingShiftId, shiftName };
      await ShiftManagementService.updateShift(shiftPayload);
    } else {
      shiftPayload = { shiftName };
      await ShiftManagementService.saveShift(shiftPayload);
      await getShiftList();
      const createdShift = shifts.find((s) => s.shiftName === shiftName);
      shiftPayload.idShift = createdShift?.idShift;
      setEditingShiftId(shiftPayload.idShift);
    }
   
    const updatedEmployeeRows = employeeRows.map((row) => ({
      ...row,
      idShift: shiftPayload.idShift,
    }));
    await ShiftManagementService.saveEmployeeInShift(updatedEmployeeRows);

    const updatedScheduleRows = scheduleRows.map((row) => ({
      ...row,
      idShift: shiftPayload.idShift,
      startTime: dayjs(row.startTime).format("HH:mm:ss"),
      endTime: dayjs(row.endTime).format("HH:mm:ss"),
      workDays: (row.workDays || []).join(','),
    }));
    await ShiftManagementService.saveScheduleInShift(updatedScheduleRows);

    await Promise.all([
      getEmployeeList(shiftPayload.idShift),
      getScheduleList(shiftPayload.idShift)
    ]);
    showToast("Shift saved successfully", "success");
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
    setConfirmMessage(`Are you sure you want to delete"?`);
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

  const handleDayToggle = (index, day) => {
    const updated = [...scheduleRows];
    const days = new Set(updated[index].workDays);
    if (days.has(day)) days.delete(day);
    else days.add(day);
    updated[index].workDays = [...days];
    setScheduleRows(updated);
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

  const handleDeleteSchedule = (idShiftSchedule) => {
    setConfirmMessage(`Are you sure you want to delete?`);
      setOnConfirm(() => async () => {
        try {
          setScheduleRows(scheduleRows.filter((s) => s.idShiftSchedule !== idShiftSchedule));
        } catch (err) {
          console.error("error in removing schedule ", err);
        }
      });
    setConfirmModalVisible(true);
  };

  const handleReset = () => {
    setShiftName("");
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
                  <span onClick={() => handleShiftEdit(shift.idShift)} style={{ cursor: "pointer" }}>✏️</span>
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
            <Input label="Shift Name" value={shiftName} onChange={(e) => setShiftName(e.target.value)} placeholder="Shift Name" />
          </Card>

          <Card title="Employees">
            <table className="table table-sm" style={{ tableLayout: "fixed", width: "100%" }}>
              <colgroup>
                <col style={{ width: "40%" }} />
                <col style={{ width: "25%" }} />
                <col style={{ width: "30%" }} />
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
                  <tr key={emp.idShiftEmployee}>
                    <td>
                      <Select ref={selectRef} options={employeesListOption} onChange={(selected) => handleEmployeeSelect(index, selected)} 
                      value={employeesListOption.find(opt => opt.value === emp.idEmployee) || null} placeholder="Select Employee"
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                      />
                    </td>
                    <td>{emp.employeeCode}</td>
                    <td>{emp.department}</td>
                    <td>
                      <DeleteIcon className="delete-icon" onClick={() => handleDeleteEmployee(emp.idEmployee)} />  
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={4} align="right">
                    <AddIcon className="add-icon" onClick={handleAddEmployeeRow}/>
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>

          <Card title="Schedules">
            <table className="table table-bordered" style={{ tableLayout: "fixed", width: "100%" }}>
              <colgroup>
                <col style={{ width: "35%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "40%" }} />
                <col style={{ width: "10%" }} />
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
                  <tr key={s.idShiftSchedule}>
                    <td>
                      <LocalizationProvider dateAdapter={AdapterDayjs} >
                        <div className="d-flex align-items-center gap-2">
                          <MobileTimePicker label="Start Time" value={s.startTime ? dayjs(s.startTime) : null}
                            onChange={(newValue) => {
                              const updated = [...scheduleRows];
                              updated[index].startTime = newValue;
                              setScheduleRows(updated);
                            }}
                            ampm={false}
                            minutesStep={1} />
                          <MobileTimePicker label="End Time" value={s.endTime ? dayjs(s.endTime) : null}
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
                            ampm={false}
                            minutesStep={1} />
                        </div>
                      </LocalizationProvider>   
                    </td>
                    <td>{getDuration(index)}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 10px' }}>
                        {daysOfWeek.map((day) => (
                        <label key={day} className="me-2" style={{ marginBottom: '10px' }}>
                          <input type="checkbox" checked={s.workDays.includes(day)} onChange={() => handleDayToggle(index, day)}/>
                          {' '}{day}
                        </label>
                        ))}
                    </div>
                    </td>
                    <td>
                      <DeleteIcon className="delete-icon" onClick={() => handleDeleteSchedule(s.idShiftSchedule)} />    
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={4} align="right">
                    <AddIcon className="add-icon" onClick={handleAddScheduleRow}/>
                  </td>
                </tr>
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
        </div>
      </div>
    </div>
  );
};

export default ShiftManagement;
