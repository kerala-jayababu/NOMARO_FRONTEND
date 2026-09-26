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

function EmployeeClockInOut() {
    const [clockInDetails, setClockInDetails] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [filteredData, setFilteredData] = useState(clockInDetails);
    const totalPages = Math.ceil(clockInDetails.length / rowsPerPage);
    const [startDate, setStartDate] = useState(moment().startOf('month').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(moment().endOf('month').format('YYYY-MM-DD'));
    const today = moment().format('DD-MM-YYYY');
    const [loading, setLoading] = useState(false);
    const { showLoader, hideLoader } = useLoader();
    const userData = JSON.parse(secureLocalStorage.getItem("user"));
    const [showModal, setShowModal] = useState(false);
    const [selectedData, setSelectedData] = useState({});
    const [selectedType, setSelectedType] = useState('');
    const [newTime, setNewTime] = useState('');
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);
    const [toggling, setToggling] = useState({});
    const [showConfirmSwapModal, setShowConfirmSwapModal] = useState(false);
    const [itemToSwap, setItemToSwap] = useState(null);

    useEffect(() => {
        if (startDate != '' && endDate != '') {
            getClockInOutDetails();
        }
    }, [startDate, endDate]);

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
        ClockInOutService.getClockInOutData(userData.idEmployee ?? 0, '', formattedStartDate, formattedEndDate).then(res => {
            setClockInDetails(res.data.data);
            hideLoader();
        }).catch(err => {
            setClockInDetails([]);
            hideLoader();
        });
    }

    const checkMissingDetails = () => {
        if (!newTime) {
            toast.warning("Please enter the actual time of entry", {
                position: "top-right",
                autoClose: 2000,
            });
            return;
        }

        // Input time is in 24-hour format (HH:mm), convert to moment
        const newTimeMoment = moment(newTime, 'HH:mm');

        if (!newTimeMoment.isValid()) {
            toast.warning("Please enter a valid time", {
                position: "top-right",
                autoClose: 2000,
            });
            return;
        }

        if (selectedType === 'IN') {
            let outTime = selectedData.outTime;

            if (outTime && outTime !== 'Missing') {
                const outTimeMoment = moment(outTime, 'hh:mm A');

                if (newTimeMoment.isSameOrAfter(outTimeMoment)) {
                    toast.warning("Cannot enter time same or after out-time", {
                        position: "top-right",
                        autoClose: 2000,
                    });
                    return;
                }
            }
            saveMissingDetails();
        } else {
            let inTime = selectedData.inTime;

            if (inTime && inTime !== 'Missing') {
                const inTimeMoment = moment(inTime, 'hh:mm A');

                if (newTimeMoment.isSameOrBefore(inTimeMoment)) {
                    toast.warning("Cannot enter time same or before in-time", {
                        position: "top-right",
                        autoClose: 2000,
                    });
                    return;
                }
            }
            saveMissingDetails();
        }
    };

    const saveMissingDetails = () => {
        if (saving) return; // Prevent multiple submissions

        setSaving(true);
        const date = moment(selectedData.clockDate).format('YYYY-MM-DD');
        // Input time is in 24-hour format (HH:mm), convert to HH:mm:ss
        const time24hrWithSeconds = moment(newTime, 'HH:mm').format('HH:mm:ss');
        
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
                resetValues();
                setShowModal(false);
                setSaving(false);
                // Refresh the data after a short delay to ensure backend has processed
                setTimeout(() => {
                    getClockInOutDetails();
                }, 500);
            } else {
                toast.error(res.data.message || "Failed to update data", {
                    position: "top-right",
                    autoClose: 2000,
                });
                setSaving(false);
            }
        }).catch(err => {
            toast.error(err.response?.data?.message || "An error occurred while saving. Please try again.", {
                position: "top-right",
                autoClose: 2000,
            });
            setSaving(false);
        });
    }

    const resetValues = () => {
        setSelectedData({});
        setSelectedType('');
        setNewTime('');
        setReason('');
        setSaving(false);
    }

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return clockInDetails.slice(startIndex, endIndex);
    }, [clockInDetails, currentPage, rowsPerPage]);

    const validPaySlips = clockInDetails.filter(slip => slip.employeeCode);

    const handlePageChange = (page) => setCurrentPage(page);

    const handleToggleMissingEntry = (item) => {
        if (!item.idClockDetails) {
            toast.warning("Invalid entry data", {
                position: "top-right",
                autoClose: 2000,
            });
            return;
        }

        // Prevent multiple clicks
        if (toggling[item.idClockDetails]) {
            return;
        }

        // Show confirmation modal
        setItemToSwap(item);
        setShowConfirmSwapModal(true);
    };

    const confirmSwap = () => {
        if (!itemToSwap || !itemToSwap.idClockDetails) {
            setShowConfirmSwapModal(false);
            setItemToSwap(null);
            return;
        }

        const idClockInDetail = itemToSwap.idClockDetails;
        setShowConfirmSwapModal(false);
        setToggling(prev => ({ ...prev, [idClockInDetail]: true }));

        ClockInOutService.toggleMissingEntry(idClockInDetail).then(res => {
            if (res.data && res.data.status === 200) {
                toast.success("Entry swapped successfully", {
                    position: "top-right",
                    autoClose: 2000,
                });
                // Refresh the data after a short delay
                setTimeout(() => {
                    getClockInOutDetails();
                }, 500);
            } else {
                toast.error(res.data?.message || "Failed to swap entry", {
                    position: "top-right",
                    autoClose: 2000,
                });
            }
            setToggling(prev => ({ ...prev, [idClockInDetail]: false }));
            setItemToSwap(null);
        }).catch(err => {
            toast.error(err.response?.data?.message || "An error occurred while swapping. Please try again.", {
                position: "top-right",
                autoClose: 2000,
            });
            setToggling(prev => ({ ...prev, [idClockInDetail]: false }));
            setItemToSwap(null);
        });
    };


    return (
        <>
            <div className="container-xxl flex-grow-1 container-p-y EmployeeClockInOutSection ShowBigDevice">
                <div className="row">
                    <div className="col-lg-12">
                        <div className="card">
                            <div className="card-header d-flex align-items-center justify-content-between pb-3">
                                <h5 className="m-0">List of Clock In-Clock Out details</h5>
                                <div className="list_menu">
                                    <div className="list_searchbox">
                                        <DatePicker className="form-control" dateFormat="dd-MM-yyyy" placeholderText={'From Date'}
                                            selected={startDate} onChange={(date) => setStartDate(date)} showMonthDropdown
                                            showYearDropdown dropdownMode="select" maxDate={today} />
                                    </div>
                                    <div className="list_searchbox">
                                        <DatePicker className="form-control" dateFormat="dd-MM-yyyy" placeholderText={'To Date'}
                                            selected={endDate} onChange={(date) => setEndDate(date)} showMonthDropdown minDate={startDate}
                                            maxDate={today} showYearDropdown dropdownMode="select" />
                                    </div>
                                </div>
                            </div>

                            <div className="card-body">
                                <div className="table-responsive text-nowrap" style={{ maxHeight: '430px', overflow: 'auto' }}>
                                    <table className="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Day</th>
                                                <th>Date</th>
                                                <th className='text-center'>IN</th>
                                                <th className='text-center'>OUT</th>
                                                <th>Duration</th>
                                                <th className='text-center'>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="table-border-bottom-0">
                                            {paginatedData?.length > 0 ? (
                                                paginatedData?.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>{moment(item.clockDate).format('dddd')}</td>
                                                        <td>{moment(item.clockDate).format('DD-MM-YYYY')}</td>
                                                        {
                                                            (item.clockType == 'LEAVE' || item.clockType == 'UNAUTH') &&
                                                            <td colSpan={3} className='text-center' style={{ backgroundColor: 'lightcyan' }}>{item.statusDetails}</td>
                                                        }
                                                        {
                                                            (item.clockType != 'LEAVE' && item.clockType != 'UNAUTH') &&
                                                            <>
                                                                {
                                                                    item.inTime === 'Missing' &&
                                                                    <td className='text-center' style={{ color: 'brown', cursor: 'pointer' }} onClick={() => { setSelectedData(item); setSelectedType('IN'); setShowModal(true) }}>Missing</td>
                                                                }
                                                                {
                                                                    item.inTime != null && item.inTime !== 'Missing' &&
                                                                    <td className='text-center'>{item.inTime}</td>
                                                                }
                                                                {
                                                                    item.inTime == null &&
                                                                    <td className='text-center'></td>
                                                                }
                                                                {
                                                                    item.outTime === 'Missing' &&
                                                                    <td className='text-center' style={{ color: 'brown', cursor: 'pointer' }} onClick={() => { setSelectedData(item); setSelectedType('OUT'); setShowModal(true) }}>Missing</td>
                                                                }
                                                                {
                                                                    item.outTime != null && item.outTime !== 'Missing' &&
                                                                    <td className='text-center'>{item.outTime}</td>
                                                                }
                                                                {
                                                                    item.outTime == null &&
                                                                    <td className='text-center'></td>
                                                                }
                                                                <td>{item.totalHoursText || 'NA'}</td>
                                                                <td className='text-center'>
                                                                    {item.remarks && item.remarks.startsWith('Wrong Entry') && (
                                                                        <button
                                                                            className="btn btn-sm btn-outline-primary"
                                                                            onClick={() => handleToggleMissingEntry(item)}
                                                                            disabled={toggling[item.idClockDetails]}
                                                                            title="Toggle Missing Entry"
                                                                            style={{ padding: '2px 8px', border: '1px solid #007bff' }}
                                                                        >
                                                                            <i className={`bx ${toggling[item.idClockDetails] ? 'bx-loader-alt bx-spin' : 'bx-transfer-alt'}`} style={{ fontSize: '18px' }}></i>
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            </>
                                                        }
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="6" className="text-center">
                                                        <div className="Nodatafound_box">
                                                            <h6><i className="bx bx-search"></i> No data available!</h6>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="text-end pt-2 112">
                                    {totalPages > 1 && (
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            onPageChange={handlePageChange}
                                            maxLength={5}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div >
            </div >
            <div className="EmployeeClockInOutSection ShowMobile">
                <div className="card">
                    <div className="card-header pb-3">
                        <h5 className='pt-2 pb-1'>List of Clock In-Clock Out details </h5>
                        <div className="list_menu">
                            <div className="list_searchbox">
                                <DatePicker className="form-control" dateFormat="dd-MM-yyyy" placeholderText={'From Date'}
                                    selected={startDate} onChange={(date) => setStartDate(date)} showMonthDropdown
                                    showYearDropdown dropdownMode="select" maxDate={today} />
                            </div>
                            <div className="list_searchbox">
                                <DatePicker className="form-control" dateFormat="dd-MM-yyyy" placeholderText={'To Date'}
                                    selected={endDate} onChange={(date) => setEndDate(date)} showMonthDropdown minDate={startDate}
                                    maxDate={today} showYearDropdown dropdownMode="select" />
                            </div>
                        </div>
                    </div>

                    <div className="card-body">
                        <div className='EmployeeClockInOutList'>
                            {paginatedData?.length > 0 ? (
                                paginatedData?.map((item, index) => (
                                    <>
                                        <div className='EmployeeClockInOutListRow' key={index}>
                                            <div className='row m-0'>
                                                <div className='col-4 px-0 py-1'>
                                                    <label>Day</label>
                                                    <p className='m-0'>{moment(item.clockDate).format('dddd')}</p>
                                                </div>
                                                <div className='col-8 px-0 py-1' >
                                                    <label>Date</label>
                                                    <p className='m-0'>{moment(item.clockDate).format('DD-MM-YYYY')}</p>
                                                </div>
                                                {
                                                    (item.clockType == 'LEAVE' || item.clockType == 'UNAUTH') &&
                                                    <div className='col-12 px-0 py-1' style={{ backgroundColor: 'lightcyan' }}>
                                                        <p className='m-0 text-center'>
                                                            {item.statusDetails}
                                                        </p>
                                                    </div>
                                                }
                                                {
                                                    (item.clockType != 'LEAVE' && item.clockType != 'UNAUTH') &&
                                                    <>
                                                        {
                                                            item.inTime === 'Missing' &&
                                                            <div className='col-4 px-0 py-1' >
                                                                <label>IN</label>
                                                                <p className='m-0' style={{ color: 'brown' }}>Missing</p>
                                                            </div>
                                                        }
                                                        {
                                                            item.inTime != null && item.inTime !== 'Missing' &&
                                                            <div className='col-4 px-0 py-1' >
                                                                <label>IN</label>
                                                                <p className='m-0'>{item.inTime}</p>
                                                            </div>
                                                        }
                                                        {
                                                            item.inTime == null &&
                                                            <div className='col-4 px-0 py-1' >
                                                                <label>IN</label>
                                                                <p className='m-0'></p>
                                                            </div>
                                                        }
                                                        {
                                                            item.outTime === 'Missing' &&
                                                            <div className='col-4 px-0 py-1' >
                                                                <label>OUT</label>
                                                                <p className='m-0' style={{ color: 'brown' }}>Missing</p>
                                                            </div>
                                                        }
                                                        {
                                                            item.outTime != null && item.outTime !== 'Missing' &&
                                                            <div className='col-4 px-0 py-1' >
                                                                <label>OUT</label>
                                                                <p className='m-0'>{item.outTime}</p>
                                                            </div>
                                                        }
                                                        {
                                                            item.outTime == null &&
                                                            <div className='col-4 px-0 py-1' >
                                                                <label>OUT</label>
                                                                <p className='m-0'></p>
                                                            </div>
                                                        }
                                                        <div className='col-4 px-0 py-1' >
                                                            <label>Duration</label>
                                                            <p className='m-0'>{item.totalHoursText || 'NA'}</p>
                                                        </div>
                                                        {
                                                            item.remarks && item.remarks.startsWith('Wrong Entry') && (
                                                                <div className='col-12 px-0 py-1' >
                                                                    <button
                                                                        className="btn btn-sm btn-outline-primary"
                                                                        onClick={() => handleToggleMissingEntry(item)}
                                                                        disabled={toggling[item.idClockDetails]}
                                                                        title="Toggle Missing Entry"
                                                                        style={{ padding: '4px 12px', border: '1px solid #007bff', width: '100%' }}
                                                                    >
                                                                        <i className={`bx ${toggling[item.idClockDetails] ? 'bx-loader-alt bx-spin' : 'bx-transfer-alt'}`} style={{ fontSize: '18px', marginRight: '8px' }}></i>
                                                                        {toggling[item.idClockDetails] ? 'Toggling...' : 'Toggle Entry'}
                                                                    </button>
                                                                </div>
                                                            )
                                                        }
                                                    </>
                                                }
                                            </div>
                                        </div>
                                    </>
                                ))
                            ) : (
                                <div className='EmployeeClockInOutListRow' >
                                    <div className="Nodatafound_box text-center py-4">
                                        <h6 className='m-0'><i className="bx bx-search"></i> No data available!</h6>
                                    </div>
                                </div>
                            )}

                        </div>

                        <div className="text-end pt-2">
                            <Pagination
                                className='1'
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    </div>
                </div>


            </div >
            <Modal
                show={showModal} 
                onHide={() => { 
                    if (!saving) {
                        setShowModal(false);
                        resetValues();
                    }
                }} 
                size='sm'
                aria-labelledby="contained-modal-title-vcenter"
                centered 
                backdrop="static"
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
                                <label className="form-label mb-1">Date: <b>{moment(selectedData?.clockDate).format('DD-MM-YYYY')}</b></label>
                                {/* <label className="form-label mb-1">{moment(selectedData?.clockDate).format('DD-MM-YYYY')}</label> */}
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
                        <button 
                            className="btn btn-primary btn-sm py-2 px-4 me-2" 
                            onClick={() => checkMissingDetails()}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button 
                            className="btn btn-outline-secondary btn-sm py-2 px-4" 
                            onClick={() => { setShowModal(false); resetValues() }}
                            disabled={saving}
                        >
                            Close
                        </button>
                    </div>
                </Modal.Body>
            </Modal >

            {/* Confirmation Modal for Swap Entry */}
            <Modal
                show={showConfirmSwapModal}
                onHide={() => {
                    setShowConfirmSwapModal(false);
                    setItemToSwap(null);
                }}
                size="sm"
                aria-labelledby="contained-modal-title-vcenter"
                centered
                backdrop="static"
                keyboard={false}
            >
                <Modal.Header className="border-0" closeButton>
                    <Modal.Title>
                        <h5>Confirm Toggle</h5>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="d-flex align-items-center justify-content-center shortDataHeight">
                        <div>
                            <p className="mb-2">Are you sure you want to toggle this entry?</p>
                            {itemToSwap && (
                                <div className="text-start">
                                    <p className="mb-1"><strong>Date:</strong> {moment(itemToSwap.clockDate).format('DD-MM-YYYY')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <button
                        type="button"
                        className="btn btn-secondary px-3"
                        onClick={() => {
                            setShowConfirmSwapModal(false);
                            setItemToSwap(null);
                        }}
                        autoFocus
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary px-3"
                        onClick={confirmSwap}
                    >
                        Confirm
                    </button>
                </Modal.Footer>
            </Modal>

        </>

    )
}

export default EmployeeClockInOut