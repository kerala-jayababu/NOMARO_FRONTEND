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
import { useNavigate } from 'react-router-dom';

function EmployeeAttendance() {
    const [attendanceDetails, setAttendanceDetails] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(1000);
    const [filteredData, setFilteredData] = useState(attendanceDetails);
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const getInitialEndDate = () => {
        const startOfMonth = moment().startOf('month');
        const yesterday = moment().subtract(1, 'days');
        // If today is the 1st of the month, endDate should be the same as startDate
        if (moment().date() === 1) {
            return startOfMonth.format('YYYY-MM-DD');
        }
        return yesterday.format('YYYY-MM-DD');
    };

    const [startDate, setStartDate] = useState(moment().startOf('month').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(getInitialEndDate());
    const today = moment().format('MM-DD-YYYY');
    const [loading, setLoading] = useState(false);
    const { showLoader, hideLoader } = useLoader();
    const userData = JSON.parse(secureLocalStorage.getItem("user"));
    const [showModal, setShowModal] = useState(false);
    const [selectedData, setSelectedData] = useState({});
    const [selectedType, setSelectedType] = useState('');
    const [newTime, setNewTime] = useState('');
    const [reason, setReason] = useState('');
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [clockInOutDetails, setClockInOutDetails] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (startDate != '' && endDate != '') {
            getAttendanceDetails();
        }
    }, [startDate, endDate]);

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

        if (daysDifference < 0) {
            toast.warning("End date cannot be before start date", {
                position: "top-right",
                autoClose: 2000,
            });
            return;
        }

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

        AttendanceService.getAttendanceData(
            userData.idEmployee ?? 0,
            '',
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

    const saveShortTimeDetails = () => {
        if (reason != '') {
            let payload = {
                idDayAttendance: selectedData.idDayAttendance,
                idEmployee: selectedData.idEmployee,
                reasonForShortTime: reason
            }
            console.log(payload);
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

    const resetValues = () => {
        setSelectedData({});
        setReason('');
        setClockInOutDetails([]);
    }

    const getClockInOutDetailsForDate = (item) => {
        const attendanceDate = moment(item.attendanceDate || item.clockDate);
        if (!attendanceDate.isValid()) {
            setSelectedData(item);
            setShowDetailsModal(true);
            return;
        }

        const formattedDate = attendanceDate.format("YYYY-MM-DD");
        const employeeId = item.idEmployee ?? userData.idEmployee ?? '';
        
        showLoader();
        ClockInOutService.getClockInOutData(
            employeeId,
            item.idDepartment ?? '',
            formattedDate,
            formattedDate
        ).then(res => {
            setClockInOutDetails(res.data.data || []);
            setSelectedData(item);
            setShowDetailsModal(true);
            hideLoader();
        }).catch(err => {
            setClockInOutDetails([]);
            setSelectedData(item);
            setShowDetailsModal(true);
            hideLoader();
        });
    }

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return attendanceDetails.slice(startIndex, endIndex);
    }, [attendanceDetails, currentPage, rowsPerPage]);

    const handlePageChange = (page) => setCurrentPage(page);

    const formatMinuteDifference = (minutes) => {
        if (minutes == null || minutes === undefined) return '';
        
        const absMinutes = Math.abs(minutes);
        const isNegative = minutes < 0;
        const suffix = isNegative ? ' extra' : ' short';
        
        if (absMinutes < 60) {
            return `${absMinutes} minute${absMinutes !== 1 ? 's' : ''}${suffix}`;
        }
        
        const hours = Math.floor(absMinutes / 60);
        const remainingMinutes = absMinutes % 60;
        
        if (remainingMinutes === 0) {
            return `${hours} hour${hours !== 1 ? 's' : ''}${suffix}`;
        }
        
        return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}${suffix}`;
    };

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
        <>
            <div className="container-xxl flex-grow-1 container-p-y EmployeeAttendanceSection ShowBigDevice">
                <div className="row">
                    <div className="col-lg-12">
                        <div className="card">
                            <div className="card-header d-flex align-items-center justify-content-between pb-3">
                                <h5 className="m-0">List of Attendance details</h5>
                                <div className="list_menu">
                                    <div className="list_searchbox">
                                        <DatePicker className="form-control" dateFormat="MM/dd/yyyy" placeholderText={'From Date'}
                                            selected={startDate} onChange={(date) => setStartDate(date)} showMonthDropdown
                                            showYearDropdown dropdownMode="select" maxDate={today} />
                                    </div>
                                    <div className="list_searchbox">
                                        <DatePicker className="form-control" dateFormat="MM/dd/yyyy" placeholderText={'To Date'}
                                            selected={endDate} onChange={(date) => setEndDate(date)} showMonthDropdown minDate={startDate}
                                            maxDate={moment().subtract(1, 'days').toDate()} showYearDropdown dropdownMode="select" />
                                    </div>
                                </div>
                            </div>

                            <div className="card-body">
                                <div className="table-responsive text-nowrap" style={{ maxHeight: '500px', overflow: 'auto' }}>
                                    <table className="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Day</th>
                                                <th>Date</th>
                                                <th>First In</th>
                                                <th>Last Out</th>
                                                <th>Status Details</th>
                                            </tr>
                                        </thead>
                                        <tbody className="table-border-bottom-0">
                                            {paginatedData?.length > 0 ? (
                                                paginatedData?.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>{moment(item.attendanceDate).format('dddd')}</td>
                                                        <td>
                                                            <a href='javascript:void(0)' style={{ color: 'navy' }} onClick={() => { getClockInOutDetailsForDate(item) }}>{moment(item.attendanceDate).format('MM-DD-YYYY')}</a>
                                                        </td>
                                                        {
                                                            item.statusType == 'INOUTMISS' &&
                                                            <>
                                                                <td colSpan={2} className='text-center' style={{ backgroundColor: 'lightcyan' }}>{item.statusDetails}</td>
                                                            </>
                                                        }
                                                        {
                                                            (item.statusType == 'UNAUTH' || item.statusType == 'LEAVE') &&
                                                            <>
                                                                <td colSpan={2} className='text-center' style={{ backgroundColor: 'lightcyan' }}>{item.statusDetails}</td>
                                                            </>
                                                        }
                                                        {
                                                            (item.statusType != 'UNAUTH' && item.statusType != 'LEAVE' && item.statusType != 'INOUTMISS') &&
                                                            <>
                                                                <td>{item.firstInDateTime && moment(item.firstInDateTime).isValid() ? moment(item.firstInDateTime).format('HH:mm A') : 'NA'}</td>
                                                                <td>{item.lastOutDateTime && moment(item.lastOutDateTime).isValid() ? moment(item.lastOutDateTime).format('HH:mm A') : 'NA'}</td>
                                                            </>
                                                        }
                                                        <td>{item.statusType == 'SHORTTIME' ? <a href='javascript:void(0)' style={{ color: 'orange' }} onClick={() => { setSelectedData(item); setShowModal(true) }}>{item.reasonForShortTime ?? formatMinuteDifference(item.minuteDifference)}</a> :
                                                            item.statusType == 'EXTRAHOURS' ? <a href='javascript:void(0)' style={{ color: 'blue' }} onClick={() => { gotoOTTransactions(item) }}>{formatMinuteDifference(item.minuteDifference)}</a> :
                                                                item.timeSheetApprovalStatus == 'APPROVED' ? item.timeSheetApprovalStatus :
                                                                    formatMinuteDifference(item.minuteDifference)}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="text-center">
                                                        <div className="Nodatafound_box">
                                                            <h6><i className="bx bx-search"></i> No data available!</h6>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
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
            </div >

            <div className="EmployeeAttendanceSection ShowMobile">
                <div className="card">
                    <div className="card-header">
                        <h5 className='pt-2 pb-1'>List of Attendance details</h5>
                        <div className="list_menu">
                            <div className="list_searchbox">
                                <DatePicker className="form-control" dateFormat="MM/dd/yyyy" placeholderText={'From Date'}
                                    selected={startDate} onChange={(date) => setStartDate(date)} showMonthDropdown
                                    showYearDropdown dropdownMode="select" maxDate={today} />
                            </div>
                            <div className="list_searchbox">
                                <DatePicker className="form-control" dateFormat="MM/dd/yyyy" placeholderText={'To Date'}
                                    selected={endDate} onChange={(date) => setEndDate(date)} showMonthDropdown minDate={startDate}
                                    maxDate={moment().subtract(1, 'days').toDate()} showYearDropdown dropdownMode="select" />
                            </div>
                        </div>
                    </div>

                    <div className="card-body">
                        <div className='EmployeeAttendanceList'>
                            {paginatedData?.length > 0 ? (
                                paginatedData?.map((item, index) => (
                                    <div className='EmployeeAttendanceListRow' key={index}>
                                        <div className='row m-0'>
                                            <div className='col-4 px-0 py-1'>
                                                <label>Day</label>
                                                <p>{moment(item.clockDate).format('dddd')}</p>
                                            </div>
                                            <div className='col-8 px-0 py-1'>
                                                <label>Date</label>
                                                <p><a href='javascript:void(0)' style={{ color: 'navy' }} onClick={() => { getClockInOutDetailsForDate(item) }}>{moment(item.clockDate).format('MM-DD-YYYY')}</a></p>
                                            </div>

                                            {
                                                item.statusType == 'INOUTMISS' &&
                                                <div className='col-12 px-0 py-1'>
                                                    <label>Status Details</label>
                                                    <p className='text-center' style={{ backgroundColor: 'lightcyan' }}>{item.statusDetails}</p>
                                                </div>
                                            }
                                            {
                                                (item.statusType == 'UNAUTH' || item.statusType == 'LEAVE') &&
                                                <div className='col-12 px-0 py-1'>
                                                    <p className='text-center p-2' style={{ backgroundColor: 'lightcyan' }}>{item.statusDetails}</p>
                                                </div>
                                            }
                                            {
                                                (item.statusType != 'UNAUTH' && item.statusType != 'LEAVE' && item.statusType != 'INOUTMISS') &&
                                                <>
                                                    <div className='col-4 px-0 py-1'>
                                                        <label>First In</label>
                                                        <p>{item.firstInDateTime && moment(item.firstInDateTime).isValid() ? moment(item.firstInDateTime).format('HH:mm A') : 'NA'}</p>
                                                    </div>
                                                    <div className='col-4 px-0 py-1'>
                                                        <label>Last Out</label>
                                                        <p>{item.lastOutDateTime && moment(item.lastOutDateTime).isValid() ? moment(item.lastOutDateTime).format('HH:mm A') : 'NA'}</p>
                                                    </div>
                                                </>
                                            }
                                            <div className='col-12 px-0 py-1'>
                                                <label>Status Details</label>
                                                <p >{item.statusType == 'SHORTTIME' ? <a href='javascript:void(0)' style={{ color: 'orange' }} onClick={() => { setSelectedData(item); setShowModal(true) }}>{item.reasonForShortTime ?? formatMinuteDifference(item.minuteDifference)}</a> :
                                                    item.statusType == 'EXTRAHOURS' ? <a href='javascript:void(0)' style={{ color: 'blue' }} onClick={() => { gotoOTTransactions(item) }}>{formatMinuteDifference(item.minuteDifference)}</a> :
                                                        item.timeSheetApprovalStatus == 'APPROVED' ? item.timeSheetApprovalStatus :
                                                            formatMinuteDifference(item.minuteDifference)}</p>
                                            </div>
                                        </div>

                                    </div>
                                ))
                            ) : (
                                <div className='EmployeeAttendanceListRow'>
                                    <div className="Nodatafound_box text-center py-4">
                                        <h6 className='m-0'><i className="bx bx-search"></i> No data available!</h6>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

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
                show={showDetailsModal} onHide={() => { setShowDetailsModal(false) }} size='lg'
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
                        <table className='AttendanceTable' style={{ border: '1px solid #d3d3d3' }}>
                            <tbody>
                                <tr>
                                    <td><b>Employee Name</b></td>
                                    <td colSpan={2}>{selectedData?.employeeName || userData?.fullName || 'NA'}</td>
                                </tr>
                                <tr>
                                    <td><b>Attendance Date</b></td>
                                    <td colSpan={2}>{(selectedData?.attendanceDate && moment(selectedData?.attendanceDate).isValid()) ? moment(selectedData?.attendanceDate).format('MM-DD-YYYY') : (selectedData?.clockDate && moment(selectedData?.clockDate).isValid() ? moment(selectedData?.clockDate).format('MM-DD-YYYY') : 'NA')}</td>
                                </tr>
                                <tr>
                                    <td><b>Expected Clock-in</b></td>
                                    <td colSpan={2}>{selectedData?.expectedInDateTime && moment(selectedData?.expectedInDateTime).isValid() ? moment(selectedData?.expectedInDateTime).format('hh:mm A') : 'NA'}</td>
                                </tr>
                                <tr>
                                    <td><b>Expected Clock-out</b></td>
                                    <td colSpan={2}>{selectedData?.expectedOutDateTime && moment(selectedData?.expectedOutDateTime).isValid() ? moment(selectedData?.expectedOutDateTime).format('hh:mm A') : 'NA'}</td>
                                </tr>
                                <tr>
                                    <td><b>Actual Clock-in</b></td>
                                    <td colSpan={2}>{selectedData?.firstInDateTime && moment(selectedData?.firstInDateTime).isValid() ? moment(selectedData?.firstInDateTime).format('hh:mm A') : 'NA'}</td>
                                </tr>
                                <tr>
                                    <td><b>Actual Clock-out</b></td>
                                    <td colSpan={2}>{selectedData?.lastOutDateTime && moment(selectedData?.lastOutDateTime).isValid() ? moment(selectedData?.lastOutDateTime).format('hh:mm A') : 'NA'}</td>
                                </tr>
                                <tr>
                                    <td><b>Total Duration</b></td>
                                    <td colSpan={2}>{selectedData?.totalDurationHoursText || 'NA'}</td>
                                </tr>
                                <tr>
                                    <td><b>Actual IN Hours</b></td>
                                    <td colSpan={2}>{selectedData?.actualHoursText || 'NA'}</td>
                                </tr>
                            </tbody>
                        </table>
                        
                        {clockInOutDetails && clockInOutDetails.length > 0 && (
                            <div className="mt-3">
                                <table className='AttendanceTable' style={{ border: '1px solid #d3d3d3' }}>
                                    <tbody>
                                        <tr>
                                            <td><b>IN</b></td>
                                            <td><b>OUT</b></td>
                                            <td><b>Duration</b></td>
                                        </tr>
                                        {clockInOutDetails.map((item, index) => (
                                            <tr key={index}>
                                                {
                                                    (item.clockType == 'LEAVE' || item.clockType == 'UNAUTH') &&
                                                    <td colSpan={3} className='text-center' style={{ backgroundColor: 'lightcyan' }}>{item.statusDetails}</td>
                                                }
                                                {
                                                    (item.clockType != 'LEAVE' && item.clockType != 'UNAUTH') &&
                                                    <>
                                                        <td>
                                                            {item.inTime === 'Missing' ? (
                                                                <span style={{ color: 'brown' }}>Missing</span>
                                                            ) : (
                                                                item.inTime || 'NA'
                                                            )}
                                                        </td>
                                                        <td>
                                                            {item.outTime === 'Missing' ? (
                                                                <span style={{ color: 'brown' }}>Missing</span>
                                                            ) : (
                                                                item.outTime || 'NA'
                                                            )}
                                                        </td>
                                                        <td>{item.totalHoursText || 'NA'}</td>
                                                    </>
                                                }
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        
                        <table className='AttendanceTable' style={{ border: '1px solid #d3d3d3' }}>
                            <tbody>
                                <tr>
                                    <td><b>Status Details</b></td>
                                    <td colSpan={2}>{
                                                        selectedData.timeSheetApprovalStatus == 'APPROVED' ? selectedData.timeSheetApprovalStatus :
                                                            selectedData.statusType == 'SHORTTIME' ? <span>{selectedData.reasonForShortTime ?? formatMinuteDifference(selectedData.minuteDifference)}</span> :
                                                                selectedData.statusType == 'EXTRAHOURS' ? <span>{formatMinuteDifference(selectedData.minuteDifference)}</span> :
                                                                    selectedData.statusType == 'UNAUTH' ? <span style={{ color: 'brown' }}>{selectedData.statusDetails}</span> :
                                                                        formatMinuteDifference(selectedData.minuteDifference)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="text-center">
                        <button className="btn btn-outline-secondary btn-sm py-2 px-4" onClick={() => { setShowDetailsModal(false); resetValues() }}>Close</button>
                    </div>
                </Modal.Body>
            </Modal >
        </>

    )
}

export default EmployeeAttendance