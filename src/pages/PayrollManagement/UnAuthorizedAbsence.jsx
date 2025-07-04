import { useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import DatePicker from "react-datepicker";
import UnAuthorizedAbsenceService from "../../core/services/UnAuthorizedAbsenceService";
import secureLocalStorage from 'react-secure-storage';
import CommonService from "../../core/services/CommonService";

function UnAuthorizedAbsence() {

  const userData = JSON.parse(secureLocalStorage.getItem("user") || "{}");
  const todayMoment = moment();
  const today = todayMoment.toDate();
  const schoolYearStart = todayMoment.month() >= 6
    ? moment(`${todayMoment.year()}-07-01`)
    : moment(`${todayMoment.year() - 1}-07-01`);
  const [startDate, setStartDate] = useState(schoolYearStart.toDate());
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [absences, setAbsences] = useState([]);
  const [totalAbsence, setTotalAbsence] = useState(0);
  const currentAuth = secureLocalStorage.getItem("currentAuth");
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employeesList, setEmployeesList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const filteredEmployees = selectedDepartment === ''
    ? employeesList
    : employeesList.filter(emp => emp.idDepartment === parseInt(selectedDepartment));

  useEffect(() => {
    getEmployeeLeaveReport();
    getEmployeesData();
    getDepartments();
  }, []);

  useEffect(() => {
    getEmployeeLeaveReport();
  }, [startDate, endDate]);

  const getEmployeeLeaveReport = () => {
    setLoading(true);
    UnAuthorizedAbsenceService.getEmployeeUnauthorizedAbsences(userData.idEmployee ?? 0, moment(startDate).format("YYYY-MM-DD"), moment(endDate).format("YYYY-MM-DD"))
    .then((res) => {
      const data = res.data.data || [];
      setAbsences(data);
      setTotalAbsence(data.length);
    }).finally(()=> setLoading(false));
  }

  const getDepartments = () => {
    CommonService.getDepartmentsList().then(res => {
        res.data.data.sort((a, b) => a.departmentName - b.departmentName);
        setDepartments(res.data.data);
    }).catch(() => {
    });
  };
  
      const handleDepartmentChange = (e) => {
          setSelectedDepartment(e.target.value);
          setSelectedEmployee('');
      };
  
      const getEmployeesData = () => {
          CommonService.getEmployeeList().then(res => {
              res.data.data.sort((a, b) => a.fullName - b.fullName);
              setEmployeesList(res.data.data);
          }).catch(() => {
          });
      };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {loading && (
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
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">UnAuthorized Absence</h5>
              <div className="list_menu">
                <div className="list_searchbox">
                  <div><label>Date From</label></div>
                  <DatePicker className="form-control" dateFormat="MM/dd/yyyy" placeholderText={"From Date"}
                    selected={startDate} onChange={(date) => setStartDate(date)} showMonthDropdown
                    showYearDropdown dropdownMode="select" maxDate={today}
                  />
                </div>
                <div className="list_searchbox">
                  <div><label>Date To</label></div>
                  <DatePicker className="form-control" dateFormat="MM/dd/yyyy" placeholderText={"To Date"}
                    selected={endDate} onChange={(date) => setEndDate(date)} showMonthDropdown minDate={startDate}
                    maxDate={today} showYearDropdown dropdownMode="select"
                  />
                </div>
                  {(currentAuth === 'PAYROLL') ? (
                    <>
                      <div className="list_searchbox">
                        <select className="form-select" value={selectedDepartment} onChange={handleDepartmentChange}>
                          <option value="">All Departments</option>
                          {departments.map(dept => (
                            <option key={dept.idDepartment} value={dept.idDepartment}> 
                              {dept.departmentName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="list_searchbox" style={{ width: '200px' }}>
                        <select className="form-select" value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}>
                          <option value="">All Employees</option>
                          {filteredEmployees.length > 0 ? (
                            filteredEmployees.map(emp => (
                              <option key={emp.idEmployee} value={emp.idEmployee}>
                                {emp.fullName}
                              </option>
                            ))
                          ) : (
                            <option>No employees found</option>
                          )}
                        </select>
                      </div>
                    </>
                  ): (<></>)}
              </div>
            </div>

            <div className="card-body">
              <div className="table-responsive text-nowrap" style={{ maxHeight: "440px", overflow: "auto" }}>
                <table className="table table-sm">
                  <thead>
                    <tr>
                      {(currentAuth !== 'PAYROLL') ? (
                        <>
                          <th>Absent Date</th>
                          <th>Day</th>
                        </>
                      ) : (
                        <>
                          <th>Emp Code</th>
                          <th>Emp Name</th>
                          <th>Shift Type</th>
                          <th>Date</th>
                          <th>Aging</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="table-border-bottom-0">
                    {currentAuth !== 'PAYROLL' && absences.length > 0 ? (
                      <>
                        {absences.map((absence) => (
                          <tr key={absence.idEmployeeLeave+'_'+absence.absentDate}>
                            <td>{moment(absence.absentDate).format("MM/DD/YYYY")}</td>
                            <td>{moment(absence.absentDate).format("dddd")}</td>
                          </tr>
                        ))}
                        <tr className="table-info text-center">
                          <td colSpan={4} className="fw-bold"  >{totalAbsence} Unauthorized Absence</td>
                        </tr>
                      </>
                      ) : (
                        <tr>
                          <td colSpan={currentAuth !== 'PAYROLL'? 5 : 3} className="text-center">
                            <div className="Nodatafound_box p-2">
                              <h6 className='m-0'>
                                There is no unauthorized absence for the given period
                              </h6>
                            </div>
                          </td>
                        </tr>
                      )
                    }
                  </tbody>
                </table>
                {currentAuth !== 'PAYROLL' && absences.length !== 0 ? (
                  <><div className='red' style={{color : 'red'}}>Apply leaves in Bamboo HR for the above unathorized absence.</div></>
                ) :(<></>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

}

export default UnAuthorizedAbsence;
