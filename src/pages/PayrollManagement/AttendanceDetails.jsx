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
import * as XLSX from "xlsx";

function AttendanceDetails() {
    const [attendanceDetails, setAttendanceDetails] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [employeesList, setEmployeesList] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(1000);
    const [filteredData, setFilteredData] = useState(attendanceDetails);
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const getInitialEndDate = () => {
        const startOfMonth = moment().startOf('month');
        const yesterday = moment().subtract(1, 'days');
        // If today is the 1st of the month, endDate should be the same as startDate
        if (moment().date() === 1) {
            return startOfMonth.format('MM-DD-YYYY');
        }
        return yesterday.format('MM-DD-YYYY');
    };

    const [startDate, setStartDate] = useState(moment(new Date()).format('MM-01-YYYY'));
    const [endDate, setEndDate] = useState(getInitialEndDate());
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
    const [clockInOutDetails, setClockInOutDetails] = useState([]);
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
        setClockInOutDetails([]);
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

    const getClockInOutDetailsForDate = (item) => {
        if (!item.attendanceDate || !item.idEmployee) {
            setShowDetailsModal(true);
            return;
        }

        const attendanceDate = moment(item.attendanceDate);
        const formattedDate = attendanceDate.format("YYYY-MM-DD");
        
        showLoader();
        ClockInOutService.getClockInOutData(
            item.idEmployee ?? '',
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

    const exportToExcel = () => {
        if (!attendanceDetails || attendanceDetails.length === 0) {
            toast.warning("No data available to export", {
                position: "top-right",
                autoClose: 2000,
            });
            return;
        }

        // Prepare data for Excel export
        const excelData = attendanceDetails.map((item) => {
            let statusDetailsText = '';
            if (item.timeSheetApprovalStatus === 'APPROVED') {
                statusDetailsText = item.timeSheetApprovalStatus;
            } else if (item.statusType === 'SHORTTIME') {
                statusDetailsText = item.reasonForShortTime || item.statusDetails || '';
            } else if (item.statusType === 'EXTRAHOURS') {
                statusDetailsText = item.statusDetails || '';
            } else if (item.statusType === 'UNAUTH') {
                statusDetailsText = item.statusDetails || '';
            } else {
                statusDetailsText = item.statusDetails || '';
            }

            // Handle special status types (INOUTMISS, UNAUTH, LEAVE)
            const isSpecialStatus = item.statusType === 'INOUTMISS' || item.statusType === 'UNAUTH' || item.statusType === 'LEAVE';

            return {
                "Emp Code": item.employeeCode || '',
                "Emp Name": item.employeeName || '',
                "Date": item.attendanceDate && moment(item.attendanceDate).isValid() 
                    ? moment(item.attendanceDate).format('MM-DD-YYYY') 
                    : '',
                "First In": (!isSpecialStatus && item.firstInDateTime && moment(item.firstInDateTime).isValid()) 
                    ? moment(item.firstInDateTime).format('hh:mm A') 
                    : (isSpecialStatus ? 'N/A' : ''),
                "Last Out": (!isSpecialStatus && item.lastOutDateTime && moment(item.lastOutDateTime).isValid()) 
                    ? moment(item.lastOutDateTime).format('hh:mm A') 
                    : (isSpecialStatus ? 'N/A' : ''),
                "Total Duration": !isSpecialStatus ? (item.totalDurationHoursText || '') : 'N/A',
                "Actual IN Hrs": !isSpecialStatus ? (item.actualHoursText || '') : 'N/A',
                "Status Details": statusDetailsText
            };
        });

        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelData);

        // Set column widths
        const columnWidths = [
            { wch: 12 }, // Emp Code
            { wch: 25 }, // Emp Name
            { wch: 12 }, // Date
            { wch: 12 }, // First In
            { wch: 12 }, // Last Out
            { wch: 15 }, // Total Duration
            { wch: 15 }, // Actual IN Hrs
            { wch: 40 }  // Status Details
        ];
        worksheet['!cols'] = columnWidths;

        // Style header row
        const headerRange = XLSX.utils.decode_range(worksheet['!ref']);
        for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
            if (!worksheet[cellAddress]) worksheet[cellAddress] = {};
            worksheet[cellAddress].s = {
                fill: { fgColor: { rgb: "CBD5E1" } },
                font: { bold: true, color: { rgb: "000000" } },
                alignment: { horizontal: "center", vertical: "center" }
            };
        }

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Details");

        // Generate filename with date range
        const fileName = `Attendance_Details_${moment(startDate).format('MM-DD-YYYY')}_to_${moment(endDate).format('MM-DD-YYYY')}.xlsx`;

        // Write file
        XLSX.writeFile(workbook, fileName);

        toast.success("Excel file downloaded successfully", {
            position: "top-right",
            autoClose: 2000,
        });
    }

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            <div className="row">
                <div className="col-lg-12">
                    <div className="card">
                        <div className="card-header d-flex align-items-center justify-content-between pb-3">
                            <div className="d-flex align-items-center gap-2">
                                <h5 className="m-0">List of Attendance details</h5>
                                <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={exportToExcel}
                                    disabled={!attendanceDetails || attendanceDetails.length === 0}
                                    title="Export to Excel"
                                    style={{ padding: '4px 8px', border: '1px solid #007bff' }}
                                >
                                    <i className="bx bx-file" style={{ fontSize: '18px' }}></i>
                                </button>
                            </div>
                            <div className="list_menu">
                                <div className="list_searchbox">
                                    <DatePicker className="form-control" dateFormat="MM/dd/yyyy" placeholderText={'From Date'}
                                        selected={startDate} onChange={(date) => setStartDate(date)} shouldCloseOnSelect={true} showMonthDropdown
                                        showYearDropdown dropdownMode="select" maxDate={today} />
                                </div>
                                <div className="list_searchbox">
                                    <DatePicker className="form-control" dateFormat="MM/dd/yyyy" placeholderText={'To Date'}
                                        selected={endDate} onChange={(date) => setEndDate(date)} shouldCloseOnSelect={true} showMonthDropdown minDate={startDate}
                                        maxDate={moment().subtract(1, 'days').toDate()} showYearDropdown dropdownMode="select" />
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
                                                        <a href='javascript:void(0)' style={{ color: 'navy' }} onClick={() => { getClockInOutDetailsForDate(item) }}>{item.attendanceDate && moment(item.attendanceDate).isValid() ? moment(item.attendanceDate).format('MM-DD-YYYY') : ''}</a>
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
                                                            <td>{item.firstInDateTime && moment(item.firstInDateTime).isValid() ? moment(item.firstInDateTime).format('hh:mm A') : ''}</td>
                                                            <td>{item.lastOutDateTime && moment(item.lastOutDateTime).isValid() ? moment(item.lastOutDateTime).format('hh:mm A') : ''}</td>
                                                            <td>{item.totalDurationHoursText}</td>
                                                            <td>{item.actualHoursText}</td>
                                                        </>
                                                    }
                                                    <td>{
                                                        item.timeSheetApprovalStatus == 'APPROVED' ? item.timeSheetApprovalStatus :
                                                            item.statusType == 'SHORTTIME' ? <span>{item.reasonForShortTime ?? item.statusDetails}</span> :
                                                                item.statusType == 'EXTRAHOURS' ? <span>{item.statusDetails}</span> :
                                                                    item.statusType == 'UNAUTH' ? <span style={{ color: 'brown' }}>{item.statusDetails}</span> :
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
                                    <td colSpan={2}>{selectedData?.employeeName}</td>
                                </tr>
                                <tr>
                                    <td><b>Attendance Date</b></td>
                                    <td colSpan={2}>{selectedData?.attendanceDate && moment(selectedData?.attendanceDate).isValid() ? moment(selectedData?.attendanceDate).format('MM-DD-YYYY') : 'NA'}</td>
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
                                    <td colSpan={2}>{selectedData?.totalDurationHoursText}</td>
                                </tr>
                                <tr>
                                    <td><b>Actual IN Hours</b></td>
                                    <td colSpan={2}>{selectedData?.actualHoursText}</td>
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
                        <button className="btn btn-outline-secondary btn-sm py-2 px-4" onClick={() => { setShowDetailsModal(false); resetValues(); setClockInOutDetails([]); }}>Close</button>
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