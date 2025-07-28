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
import AttendanceService from '../../core/services/AttendanceService';
import { useLoader } from "../../components/LoaderContext";
import ConfirmationModal from '../../components/ConfirmationModal';
import { useNavigate } from 'react-router-dom';

function AttendanceDetails() {
    const [attendanceDetails, setAttendanceDetails] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [employeesList, setEmployeesList] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(1000);
    const [filteredData, setFilteredData] = useState(attendanceDetails);
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const [startDate, setStartDate] = useState(moment(new Date()).format('MM-01-YYYY'));
    const [endDate, setEndDate] = useState(moment(new Date()).format('MM-DD-YYYY'));
    const today = moment(new Date()).format('MM-DD-YYYY')
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const filteredEmployees = [
        { label: "All employees", value: "" },
        ...(selectedDepartment === ''
            ? employeesList.map(emp => ({ label: emp.fullName, value: emp.idEmployee }))
            : employeesList.filter(emp => emp.idDepartment === parseInt(selectedDepartment))
                .map(emp => ({ label: emp.fullName, value: emp.idEmployee })))
    ];
    const [loading, setLoading] = useState(false);
    const { showLoader, hideLoader } = useLoader();
    const userData = JSON.parse(secureLocalStorage.getItem("user"));
    const [showModal, setShowModal] = useState(false);
    const [selectedData, setSelectedData] = useState({});
    const [selectedType, setSelectedType] = useState('');
    const [newTime, setNewTime] = useState('');
    const [reason, setReason] = useState('');
    const [selectedRows, setSelectedRows] = useState([]);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        getEmployeesData();
        getDepartments();
    }, []);

    useEffect(() => {
        if (startDate != '' && endDate != '') {
            getAttendanceDetails();
        }
    }, [startDate, endDate, selectedDepartment, selectedEmployee]);

    const getAttendanceDetails = () => {
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

        // showLoader();
        const formattedStartDate = sDate.format("YYYY-MM-DD");
        const formattedEndDate = eDate.format("YYYY-MM-DD");

        AttendanceService.getAttendanceData(
            selectedEmployee.value ?? '',
            selectedDepartment ?? '',
            formattedStartDate,
            formattedEndDate
        ).then(res => {
            setAttendanceDetails(res.data.data);
            hideLoader();
        }).catch(err => {
            setAttendanceDetails([]);
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

    const saveShortTimeDetails = () => {
        if (reason != '') {
            let payload = {
                idDayAttendance: selectedData.idDayAttendance,
                idEmployee: selectedData.idEmployee,
                reasonForShortTime: reason
            }
            AttendanceService.saveShortTimeEntries(payload).then(res => {
                if (res.data.status === 200) {
                    getAttendanceDetails();
                    resetValues();
                    setShowModal(false);
                }
            }).catch(err => {
            });
        } else {
            toast.warning("Please provide a reason", {
                position: "top-right",
                autoClose: 2000,
            });
        }
    }

    const approveSelected = () => {
        AttendanceService.approveData(selectedRows).then(res => {
            if (res.data.status === 200) {
                getAttendanceDetails();
                setSelectedRows([]);
                resetValues();
            }
        }).catch(err => {
        });
    }

    const confirmApprove = (val) => {
        setShowConfirmation(false);
        if (val) {
            approveSelected();
        }
    };

    const resetValues = () => {
        setSelectedData({});
        setReason('');
    }

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return attendanceDetails.slice(startIndex, endIndex);
    }, [attendanceDetails, currentPage, rowsPerPage]);

    const handlePageChange = (page) => setCurrentPage(page);

    // Updated handler functions
    const handleRowSelect = (item) => {
        const selectedItem = {
            idDayAttendance: item.idDayAttendance,
            idEmployee: item.idEmployee,
            approvalStatus: 'APPROVED'
        };

        const isSelected = selectedRows.some(row =>
            row.idDayAttendance === item.idDayAttendance
        );

        if (isSelected) {
            setSelectedRows(selectedRows.filter(row =>
                row.idDayAttendance !== item.idDayAttendance
            ));
        } else {
            setSelectedRows([...selectedRows, selectedItem]);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allSelectedItems = attendanceDetails
                .filter(att => att.statusType !== 'INOUTMISS' && att.statusType !== 'UNAUTH' && att.timeSheetApprovalStatus !== 'APPROVED')
                .map(att => ({
                    idDayAttendance: att.idDayAttendance,
                    idEmployee: att.idEmployee,
                    approvalStatus: 'APPROVED'
                }));
            setSelectedRows(allSelectedItems);
        } else {
            setSelectedRows([]);
        }
    };

    const isAllSelected = attendanceDetails.length > 0 &&
        selectedRows.length === attendanceDetails.filter(att =>
            att.statusType !== 'INOUTMISS' && att.statusType !== 'UNAUTH' && att.timeSheetApprovalStatus !== 'APPROVED').length;

    const gotoOTTransactions = (item) => {
        const dataToSend = {
            actualDurationInHours: item.actualDurationInHours,
            actualDurationInMinutes: item.actualDurationInMinutes,
            actualHoursText: item.actualHoursText,
            allowedTolerenceInMinutes: item.allowedTolerenceInMinutes,
            attendanceDate: item.attendanceDate,
            deficitHours: item.deficitHours,
            departmentName: item.departmentName,
            designationName: item.designationName,
            employeeName: item.employeeName,
            expectedDurationInMinutes: item.expectedDurationInMinutes,
            expectedInDateTime: item.expectedInDateTime,
            expectedOutDateTime: item.expectedOutDateTime,
            firstInDateTime: item.firstInDateTime,
            idDayAttendance: item.idDayAttendance,
            idDepartment: item.idDepartment,
            idDesignation: item.idDesignation,
            idEmployee: item.idEmployee,
            idShiftSchedule: item.idShiftSchedule,
            lastOutDateTime: item.lastOutDateTime,
            minuteDifference: item.minuteDifference,
            reasonForShortTime: item.reasonForShortTime,
            regularDayType: item.regularDayType,
            statusDetails: item.statusDetails,
            statusType: item.statusType,
            timeSheetApprovalStatus: item.timeSheetApprovalStatus,
            totalDurationHoursText: item.totalDurationHoursText,
            totalDurationInHours: item.totalDurationInHours,
            totalDurationInMinutes: item.totalDurationInMinutes,
        };
        navigate("/dashboard/overtime-transactions", { state: dataToSend });
    }

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            <div className="row">
                <div className="col-lg-12">
                    <div className="card">
                        <div className="card-header d-flex align-items-center justify-content-between pb-3">
                            <h5 className="m-0">List of Attendance details</h5>
                            <div className="list_menu">
                                <div className="list_searchbox">
                                    <DatePicker className="form-control" dateFormat="MM/dd/yyyy" placeholderText={'From Date'}
                                        selected={startDate} onChange={(date) => setStartDate(date)} shouldCloseOnSelect={true} showMonthDropdown
                                        showYearDropdown dropdownMode="select" maxDate={today} />
                                </div>
                                <div className="list_searchbox">
                                    <DatePicker className="form-control" dateFormat="MM/dd/yyyy" placeholderText={'To Date'}
                                        selected={endDate} onChange={(date) => setEndDate(date)} shouldCloseOnSelect={true} showMonthDropdown minDate={startDate}
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
                                <div className="list_searchbox" style={{ width: '200px' }}>
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
                            {/* <div class="row m-0 align-items-center">
                                <div class="col-md-3 p-2">
                                    <div class="form-check form-check-inline ">
                                        <input class="form-check-input" type="radio" name="inlineRadioOptions" id="inlineRadio1"
                                            value="option1" checked />
                                        <label class="form-check-label" for="inlineRadio1">Show Missing Entry Days only</label>
                                    </div>

                                </div>
                                <div class="col-md-4 p-2">
                                    <div class="form-check form-check-inline">
                                        <input class="form-check-input" type="radio" name="inlineRadioOptions" id="inlineRadio2"
                                            value="option2" />
                                        <label class="form-check-label" for="inlineRadio2">Show Late Check-in/Early Check-out Records</label>
                                    </div>
                                </div>
                            </div> */}
                            <div className="table-responsive text-nowrap" style={{ maxHeight: '440px', overflow: 'auto' }}>
                                <table className="CommonTableList table table-sm">
                                    <thead>
                                        <tr>
                                            <th>
                                                <input
                                                    type="checkbox"
                                                    checked={isAllSelected}
                                                    onChange={handleSelectAll}
                                                    disabled={attendanceDetails.filter(att =>
                                                        att.statusType !== 'INOUTMISS' && att.statusType !== 'UNAUTH' && att.timeSheetApprovalStatus !== 'APPROVED'
                                                    ).length === 0}
                                                />
                                            </th>
                                            <th>Emp Code</th>
                                            <th>Emp Name</th>
                                            <th>Date</th>
                                            <th>First In</th>
                                            <th>Last Out</th>
                                            <th>Total Duration</th>
                                            <th>Actual IN Hrs</th>
                                            <th>Status Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="table-border-bottom-0">
                                        {paginatedData?.length > 0 ? (
                                            paginatedData?.map((item, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        {item.statusType !== 'INOUTMISS' && item.statusType !== 'UNAUTH' && item.timeSheetApprovalStatus !== 'APPROVED' && (
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedRows.some(row =>
                                                                    row.idDayAttendance === item.idDayAttendance
                                                                )}
                                                                onChange={() => handleRowSelect(item)}
                                                            />
                                                        )}
                                                    </td>
                                                    <td>{item.employeeCode}</td>
                                                    <td>{item.employeeName}</td>
                                                    <td>
                                                        <a href='javascript:void(0)' style={{ color: 'navy' }} onClick={() => { setSelectedData(item); setShowDetailsModal(true) }}>{moment(item.attendanceDate).format('MM-DD-YYYY')}</a>
                                                    </td>
                                                    {
                                                        item.statusType == 'INOUTMISS' &&
                                                        <>
                                                            <td colSpan={4} className='text-center' style={{ backgroundColor: 'lightcyan' }}>{item.statusDetails}</td>
                                                        </>
                                                    }
                                                    {
                                                        (item.statusType == 'UNAUTH' || item.statusType == 'LEAVE') &&
                                                        <>
                                                            <td colSpan={4} className='text-center' style={{ backgroundColor: 'lightcyan' }}>{item.statusDetails}</td>
                                                        </>
                                                    }
                                                    {
                                                        (item.statusType != 'UNAUTH' && item.statusType != 'LEAVE' && item.statusType != 'INOUTMISS') &&
                                                        <>
                                                            <td>{moment(item.firstInDateTime).format('hh:mm A')}</td>
                                                            <td>{moment(item.lastOutDateTime).format('hh:mm A')}</td>
                                                            <td>{item.totalDurationHoursText}</td>
                                                            <td>{item.actualHoursText}</td>
                                                        </>
                                                    }
                                                    <td>{
                                                        item.timeSheetApprovalStatus == 'APPROVED' ? item.timeSheetApprovalStatus :
                                                            item.statusType == 'SHORTTIME' ? <span>{item.reasonForShortTime ?? item.statusDetails}</span> :
                                                                item.statusType == 'EXTRAHOURS' ? <span>{item.statusDetails}</span> :
                                                                    item.statusDetails}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="9" className="text-center">
                                                    <div className="Nodatafound_box">
                                                        <h6><i className="bx bx-search"></i> No data available!</h6>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className='row'>
                                <div className='col-lg-4'>
                                    {/* <label style={{ marginTop: '15px' }}>
                                        Total records selected: {selectedRows.length} out of {
                                            attendanceDetails.filter(att =>
                                                att.statusType !== 'INOUTMISS' && att.statusType !== 'UNAUTH' && att.timeSheetApprovalStatus !== 'APPROVED'
                                            ).length
                                        }
                                    </label> */}
                                    <label style={{ marginTop: '15px' }}>
                                        Total records selected: {selectedRows.length} out of {attendanceDetails.length}
                                    </label>
                                </div>
                                <div className='col-lg-4'>
                                    <div className="text-center py-2">
                                        <button className="btn btn-primary btn-sm px-4"
                                            disabled={selectedRows.length === 0} onClick={() => { setShowConfirmation(true) }}>
                                            Approve selected
                                        </button> &nbsp;
                                    </div>
                                </div>
                                <div className='col-lg-4'></div>
                            </div>
                            {/* <div className="text-end pt-2">
                                <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                                />
                            </div> */}
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
                        <h5>Add short time details</h5>
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <div className="accountDetail_card">
                        <div className="row m-0">
                            <div className="col-md-12 p-2">
                                <label className="form-label mb-1">Employee Name: <b>{selectedData?.employeeName}</b></label>
                                {/* <label className="form-label mb-1">{moment(selectedData?.clockDate).format('MM-DD-YYYY')}</label> */}
                            </div>
                            <div className="col-md-12 p-2">
                                <label className="form-label mb-1">Date: <b>{moment(selectedData?.clockDate).format('MM-DD-YYYY')}</b></label>
                                {/* <label className="form-label mb-1">{moment(selectedData?.clockDate).format('MM-DD-YYYY')}</label> */}
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
                        <button className="btn btn-primary btn-sm py-2 px-4 me-2" onClick={() => saveShortTimeDetails()}>Save</button>
                        <button className="btn btn-outline-secondary  btn-sm py-2 px-4" onClick={() => { setShowModal(false); resetValues() }}>Close</button>
                    </div>
                </Modal.Body>
            </Modal >

            <Modal
                show={showDetailsModal} onHide={() => { setShowDetailsModal(false) }} size='md'
                aria-labelledby="contained-modal-title-vcenter"
                centered backdrop="static"
                keyboard={false}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <h5>Attendance details</h5>
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <div className="p-1">
                        <table className='AttendanceTable'>
                            <tbody>
                                <tr>
                                    <td><b>Employee Name</b></td>
                                    <td colSpan={2}>{selectedData?.employeeName}</td>
                                </tr>
                                <tr>
                                    <td><b>Attendance Date</b></td>
                                    <td colSpan={2}>{moment(selectedData?.attendanceDate).format('MM-DD-YYYY')}</td>
                                </tr>
                                <tr>
                                    <td><b>Expected Clock-in</b></td>
                                    <td colSpan={2}>{selectedData?.expectedInDateTime ? moment(selectedData?.expectedInDateTime).format('hh:mm A') : 'NA'}</td>
                                </tr>
                                <tr>
                                    <td><b>Expected Clock-out</b></td>
                                    <td colSpan={2}>{selectedData?.expectedOutDateTime ? moment(selectedData?.expectedOutDateTime).format('hh:mm A') : 'NA'}</td>
                                </tr>
                                <tr>
                                    <td><b>Actual Clock-in</b></td>
                                    <td colSpan={2}>{selectedData?.firstInDateTime ? moment(selectedData?.firstInDateTime).format('hh:mm A') : 'NA'}</td>
                                </tr>
                                <tr>
                                    <td><b>Actual Clock-out</b></td>
                                    <td colSpan={2}>{selectedData?.lastOutDateTime ? moment(selectedData?.lastOutDateTime).format('hh:mm A') : 'NA'}</td>
                                </tr>
                                <tr>
                                    <td><b>Total Duration</b></td>
                                    <td colSpan={2}>{selectedData?.totalDurationHoursText}</td>
                                </tr>
                                <tr>
                                    <td><b>Actual IN Hours</b></td>
                                    <td colSpan={2}>{selectedData?.actualHoursText}</td>
                                </tr>
                            </tbody>
                        </table>
                        <table className='AttendanceTable'>
                            <tbody>
                                <tr>
                                    <td><b>IN</b></td>
                                    <td><b>OUT</b></td>
                                    <td><b>Duration</b></td>
                                </tr>
                                <tr>
                                    <td>{selectedData?.firstInDateTime ? moment(selectedData?.firstInDateTime).format('hh:mm A') : 'NA'}</td>
                                    <td>{selectedData?.lastOutDateTime ? moment(selectedData?.lastOutDateTime).format('hh:mm A') : 'NA'}</td>
                                    <td>{selectedData?.totalDurationHoursText}</td>
                                </tr>
                            </tbody>
                        </table>
                        <table className='AttendanceTable'>
                            <tbody>
                                <tr>
                                    <td><b>Status Details</b></td>
                                    <td colSpan={2}>{
                                                        selectedData.timeSheetApprovalStatus == 'APPROVED' ? selectedData.timeSheetApprovalStatus :
                                                            selectedData.statusType == 'SHORTTIME' ? <span>{selectedData.reasonForShortTime ?? selectedData.statusDetails}</span> :
                                                                selectedData.statusType == 'EXTRAHOURS' ? <span>{selectedData.statusDetails}</span> :
                                                                    selectedData.statusDetails}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="text-center">
                        <button className="btn btn-outline-secondary btn-sm py-2 px-4" onClick={() => { setShowDetailsModal(false); resetValues() }}>Close</button>
                    </div>
                </Modal.Body>
            </Modal >

            {
                showConfirmation &&
                <ConfirmationModal
                    modalShow={true}
                    messageText={"Are you sure to approve selected items?"}
                    callbackModal={confirmApprove}
                    confirmBtn={"Confirm"}
                    CancelBtn={"Cancel"}
                />
            }

        </div >

    )
}

export default AttendanceDetails