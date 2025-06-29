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
    const [startDate, setStartDate] = useState(moment(new Date()).format('MM-01-YYYY'));
    const [endDate, setEndDate] = useState(moment(new Date()).format('MM-DD-YYYY'));
    const today = moment(new Date()).format('MM-DD-YYYY')
    const [loading, setLoading] = useState(false);
    const { showLoader, hideLoader } = useLoader();
    const userData = JSON.parse(secureLocalStorage.getItem("user"));
    const [showModal, setShowModal] = useState(false);
    const [selectedData, setSelectedData] = useState({});
    const [selectedType, setSelectedType] = useState('');
    const [newTime, setNewTime] = useState('');
    const [reason, setReason] = useState('');
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

        if (daysDifference > 30) {
            toast.warning("Date range cannot be more than 30 days", {
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
    }

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return attendanceDetails.slice(startIndex, endIndex);
    }, [attendanceDetails, currentPage, rowsPerPage]);

    const handlePageChange = (page) => setCurrentPage(page);

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
                                        selected={startDate} onChange={(date) => setStartDate(date)} showMonthDropdown
                                        showYearDropdown dropdownMode="select" maxDate={today} />
                                </div>
                                <div className="list_searchbox">
                                    <DatePicker className="form-control" dateFormat="MM/dd/yyyy" placeholderText={'To Date'}
                                        selected={endDate} onChange={(date) => setEndDate(date)} showMonthDropdown minDate={startDate}
                                        maxDate={today} showYearDropdown dropdownMode="select" />
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
                                            <th className='text-center'>First In</th>
                                            <th className='text-center'>Last Out</th>
                                            <th>Status Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="table-border-bottom-0">
                                        {paginatedData?.length > 0 ? (
                                            paginatedData?.map((item, index) => (
                                                <tr key={index}>
                                                    <td>{moment(item.clockDate).format('dddd')}</td>
                                                    <td>{moment(item.clockDate).format('MM-DD-YYYY')}</td>
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
                                                            <td>{moment(item.firstInDateTime).format('HH:mm A')}</td>
                                                            <td>{moment(item.lastOutDateTime).format('HH:mm A')}</td>
                                                        </>
                                                    }
                                                    <td>{item.statusType == 'SHORTTIME' ? <a href='javascript:void(0)' style={{ color: 'orange' }} onClick={() => { setSelectedData(item); setShowModal(true) }}>{item.statusDetails}</a> :
                                                        item.statusType == 'EXTRAHOURS' ? <a href='javascript:void(0)' style={{ color: 'blue' }} onClick={() => { gotoOTTransactions(item) }}>{item.statusDetails}</a> :
                                                            item.timeSheetApprovalStatus == 'APPROVED' ? item.timeSheetApprovalStatus :
                                                                item.statusDetails}</td>
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

        </div >

    )
}

export default EmployeeAttendance