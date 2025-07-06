import React, { useEffect, useMemo, useState } from 'react';
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import CommonService from '../../core/services/CommonService';
import { Button, Form, Modal } from 'react-bootstrap';
import { toast } from "react-toastify";
import Utils from '../../utils/Utils';
import DatePicker from "react-datepicker";
import Select from 'react-select';
import Pagination from '../../components/pagination';
import { NumericFormat } from "react-number-format";
import ClockInOutService from '../../core/services/ClockInOutService';
import secureLocalStorage from 'react-secure-storage';
import { useLoader } from "../../components/LoaderContext";

function ClockInClockOut() {
  const [clockInDetails, setClockInDetails] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [filteredData, setFilteredData] = useState(clockInDetails);
  const totalPages = Math.ceil(clockInDetails.length / rowsPerPage);
  const [startDate, setStartDate] = useState(moment(new Date()).format('MM-01-YYYY'));
  // let endingDay = Utils.getLastDayFor(moment(startDate).format('YYYY-MM-DD'));
  // const [endDate, setEndDate] = useState(moment(new Date()).format(`DD-${endingDay}-YYYY`));
  const [endDate, setEndDate] = useState(moment(new Date()).format('MM-DD-YYYY'));
  const today = moment(new Date()).format('MM-DD-YYYY');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const filteredEmployees = [
    { label: "All employees", value: "" },
    ...(selectedDepartment === ''
      ? employeesList.map(emp => ({ label: emp.fullName, value: emp.idEmployee }))
      : employeesList.filter(emp => emp.idDepartment === parseInt(selectedDepartment))
        .map(emp => ({ label: emp.fullName, value: emp.idEmployee })))
  ];
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const { showLoader, hideLoader } = useLoader();
  const userData = JSON.parse(secureLocalStorage.getItem("user"));
  const [showModal, setShowModal] = useState(false);
  const [selectedData, setSelectedData] = useState({});
  const [selectedType, setSelectedType] = useState('');
  const [newTime, setNewTime] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    getEmployeesData();
    getDepartments();
  }, []);

  useEffect(() => {
    if (startDate != '' && endDate != '') {
      getClockInOutDetails();
    }
  }, [startDate, endDate, selectedEmployee, selectedDepartment]);

  const getClockInOutDetails = () => {
    if (!startDate || !endDate) {
      toast.warning("Please select both start and end dates", {
        position: "top-right",
        autoClose: 2000,
      });
      return;
    }

    const sDate = moment(startDate);
    const eDate = moment(endDate);
    const daysDifference = eDate.diff(sDate, 'days');

    if (daysDifference > 60) {
      toast.warning("Date range cannot be more than 60 days", {
        position: "top-right",
        autoClose: 2000,
      });

      return;
    }

    showLoader();
    const formattedStartDate = sDate.format("YYYY-MM-DD");
    const formattedEndDate = eDate.format("YYYY-MM-DD");
    ClockInOutService.getClockInOutData(selectedEmployee.value ?? '', selectedDepartment ?? '', formattedStartDate, formattedEndDate).then(res => {
      // ClockInOutService.getClockInOutData(1020, sDate, eDate).then(res => {
      setClockInDetails(res.data.data);
      hideLoader();
    }).catch(err => {
      setClockInDetails([]);
      hideLoader();
    });
  }

  const getDepartments = () => {
    CommonService.getDepartmentsList().then(res => {
      res.data.data.sort((a, b) => a.departmentName - b.departmentName);
      setDepartments(res.data.data);
    }).catch(err => {
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
    }).catch(err => {
    });
  };

  const checkMissingDetails = () => {
    const newTimeMoment = moment(newTime, 'hh:mm A');

    if (selectedType === 'IN') {
      let outTime = selectedData.outTime;

      const outTimeMoment = moment(outTime, 'hh:mm A');

      if (newTimeMoment.isSameOrBefore(outTimeMoment)) {
        saveMissingDetails();
      } else {
        toast.warning("Cannot enter time same or after out-time", {
          position: "top-right",
          autoClose: 2000,
        });
      }
    } else {
      let inTime = selectedData.inTime;

      const inTimeMoment = moment(inTime, 'hh:mm A');

      if (newTimeMoment.isSameOrAfter(inTimeMoment)) {
        saveMissingDetails();
      } else {
        toast.warning("Cannot enter time same or before in-time", {
          position: "top-right",
          autoClose: 2000,
        });
      }
    }
  };


  const saveMissingDetails = () => {
    const date = moment(selectedData.clockDate).format('YYYY-MM-DD');
    const time24hrWithSeconds = moment(newTime, 'hh:mm A').format('HH:mm:ss');
    let payload = {
      idClockDetail: selectedData.idClockDetails,
      idEmployee: selectedData.idEmployee,
      clockType: selectedType,
      time: date + ' ' + time24hrWithSeconds,
      reason: reason
    }
    ClockInOutService.saveMissingEntries([payload]).then(res => {
      if (res.data.status === 200) {
        toast.success("Data updated successfully", {
          position: "top-right",
          autoClose: 2000,
        });
        getClockInOutDetails();
        resetValues();
        setShowModal(false);
      }
    }).catch(err => {
    });
  }

  const resetValues = () => {
    setSelectedData({});
    setSelectedType('');
    setNewTime('');
    setReason('');
  }

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return clockInDetails.slice(startIndex, endIndex);
  }, [clockInDetails, currentPage, rowsPerPage]);

  const validPaySlips = clockInDetails.filter(slip => slip.employeeCode);

  const handlePageChange = (page) => setCurrentPage(page);


  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">List of Clock In-Clock Out details</h5>
              <div className="list_menu">
                <div className="list_searchbox">
                  <DatePicker className="form-control" dateFormat="MM/dd/yyyy" placeholderText={'From Date'}
                    selected={startDate} onChange={(date) => setStartDate(date)} showMonthDropdown
                    showYearDropdown dropdownMode="select" maxDate={today} />
                </div>
                <div className="list_searchbox">
                  <DatePicker className="form-control" dateFormat="MM/dd/yyyy" placeholderText={'To Date'}
                    selected={endDate} onChange={(date) => setEndDate(date)} showMonthDropdown minDate={startDate}
                    maxDate={today} showYearDropdown dropdownMode="select" />
                </div>
                <div className="list_searchbox">
                  <select
                    className="form-select"
                    value={selectedDepartment}
                    onChange={handleDepartmentChange}
                  >
                    <option value="">ALL Departments</option>
                    {departments.map(dept => (
                      <option key={dept.idDepartment} value={dept.idDepartment}>
                        {dept.departmentName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="list_searchbox" style={{ width: '200px', zIndex: '100' }}>
                  {/* <select className="form-select"
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}>
                    <option value="">ALL Employees</option>
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map(emp => (
                        <option key={emp.idEmployee} value={emp.idEmployee}>
                          {emp.fullName}
                        </option>
                      ))
                    ) : (
                      <option>No employees found</option>
                    )}
                  </select> */}
                  <Select
                    options={filteredEmployees}
                    isSearchable
                    onChange={(e) => { setSelectedEmployee(e) }}
                    value={selectedEmployee}
                    placeholder={'All Employees'}
                    className="textSize"
                    noOptionsMessage={() => "No employee available"}
                  />
                </div>
              </div>
            </div>

            <div className="card-body">
              <div className="table-responsive text-nowrap" style={{ maxHeight: '430px', overflow: 'auto' }}>
                <table className="CommonTableList table table-sm">
                  <thead>
                    <tr>
                      <th>Emp Code</th>
                      <th>Emp Name</th>
                      <th>Day</th>
                      <th>Date</th>
                      <th className='text-center'>IN</th>
                      <th className='text-center'>OUT</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody className="table-border-bottom-0">
                    {paginatedData?.length > 0 ? (
                      paginatedData?.map((item, index) => (
                        <tr key={index}>
                          <td>{item.employeeCode}</td>
                          <td>{item.employeeName}</td>
                          <td>{moment(item.clockDate).format('dddd')}</td>
                          <td>{moment(item.clockDate).format('MM-DD-YYYY')}</td>
                          {
                            (item.clockType == 'LEAVE' || item.clockType == 'UNAUTH') &&
                            <td colSpan={3} className='text-center' style={{ backgroundColor: 'lightcyan' }}>{item.statusDetails}</td>
                          }
                          {
                            (item.clockType != 'LEAVE' && item.clockType != 'UNAUTH') &&
                            <>
                              {
                                item.inTime != null &&
                                <td className='text-center'>{item.inTime}</td>
                              }
                              {
                                item.inTime == null &&
                                <td className='text-center'><a href='javascript:void(0)' style={{ color: 'red' }} onClick={() => { setSelectedData(item); setSelectedType('IN'); setShowModal(true) }}>Missing</a></td>
                              }
                              {
                                item.outTime != null &&
                                <td className='text-center'>{item.outTime}</td>
                              }
                              {
                                item.outTime == null &&
                                <td className='text-center'><a href='javascript:void(0)' style={{ color: 'red' }} onClick={() => { setSelectedData(item); setSelectedType('OUT'); setShowModal(true) }}>Missing</a></td>
                              }
                              <td>{item.totalHoursText || 'NA'}</td>
                            </>
                          }
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center">
                          <div className="Nodatafound_box">
                            <h6><i className="bx bx-search"></i> No data available!</h6>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="text-end pt-2">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div >

      <Modal
        show={showModal} onHide={() => { setShowModal(false) }} size='sm'
        aria-labelledby="contained-modal-title-vcenter"
        centered backdrop="static"
        keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>
            <h5>Add Missing details</h5>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="accountDetail_card">
            <div className="row m-0">
              <div className="col-md-12 p-2">
                <label className="form-label mb-1">Date: <b>{moment(selectedData?.clockDate).format('MM-DD-YYYY')}</b></label>
                {/* <label className="form-label mb-1">{moment(selectedData?.clockDate).format('MM-DD-YYYY')}</label> */}
              </div>

              <div className="col-md-12 p-2">
                <label className="form-label mb-1">Missing Type: <b>{selectedType}</b></label>
                {/* <label className="form-label mb-1">{selectedType}</label> */}
              </div>

              <div className="col-md-12 p-2">
                <label className="form-label mb-1">Actual time of entry</label>
                <input type="time" className="form-control"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)} />
              </div>

              <div className="col-md-12 p-2">
                <label className="form-label mb-1">Reason</label>
                <textarea
                  className="form-control"
                  rows="3"
                  maxLength="100" value={reason}
                  onChange={(e) => setReason(e.target.value)}>
                </textarea>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary btn-sm py-2 px-4 me-2" onClick={() => checkMissingDetails()}>Save</button>
            <button className="btn btn-outline-secondary  btn-sm py-2 px-4" onClick={() => { setShowModal(false); resetValues() }}>Close</button>
          </div>
        </Modal.Body>
      </Modal >

    </div >

  )
}

export default ClockInClockOut