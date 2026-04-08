import React, { useEffect, useMemo, useRef, useState } from 'react';
import moment from "moment";
import CommonService from '../../core/services/CommonService';
import { Button, Form, Modal } from 'react-bootstrap';
import { toast } from "react-toastify";
import Utils from '../../utils/Utils';
import Pagination from '../../components/pagination';
import { NumericFormat } from "react-number-format";
import LeavePassageService from '../../core/services/LeavePassageService';
import { useLoader } from '../../components/LoaderContext';
import secureLocalStorage from 'react-secure-storage';

function LeavePassageAmount() {
    const [leavePassages, setLeavePassages] = useState([]);
    const [originalLeavePassages, setOriginalLeavePassages] = useState([]);
    const [workYearsList, setWorkYearsList] = useState([]);
    const [salaryMonths, setSalaryMonths] = useState([]);
    const [selFinancialYear, setSelFinancialYear] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isDataChanged, setIsDataChanged] = useState(false);
    const [showReversalModal, setShowReversalModal] = useState(false);
    const [selectedReversalItem, setSelectedReversalItem] = useState(null);
    const [reversalForm, setReversalForm] = useState({ reversalMonth: '', reversalAmount: '', remarks: '' });
    const [reversalType, setReversalType] = useState('reversal');
    const rowsPerPage = 10;
    const totalPages = Math.ceil(leavePassages.length / rowsPerPage);
    const { showLoader, hideLoader } = useLoader();
    const userData = JSON.parse(secureLocalStorage.getItem("user"));

    useEffect(() => {
        getWorkYears();
    }, []);

    useEffect(() => {
        if (selFinancialYear != null) {
            setLeavePassages([]);
            getLeavePassages();
            getSalaryMonths();
        }
    }, [selFinancialYear]);

    const getWorkYears = async () => {
        const result = await CommonService.getAllWorkYears();
        if (!result.error && result.data) {
            // Filter to show: 1 past year + current year + 2 future years
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth();

            // Determine financial year (assuming April-March or similar)
            let financialYear = currentYear;
            if (currentMonth < 3) { // January to March
                financialYear = currentYear - 1;
            }

            // Filter to show years from (financialYear - 1) to (financialYear + 2)
            const filteredYears = result.data.filter(year => {
                const yearStart = parseInt(year.displayText.split('-')[0]);
                return yearStart >= (financialYear - 1) && yearStart <= (financialYear + 2);
            });

            setWorkYearsList(filteredYears);
            // Set default to current year if available
            if (filteredYears.length > 0 && !selFinancialYear) {
                setSelFinancialYear(filteredYears[0].idWorkYear);
            }
        } else {
            setWorkYearsList([]);
        }
    }

    const getSalaryMonths = async () => {
        const result = await CommonService.getWorkYearSalaryMonths(selFinancialYear);
        if (!result.error && result.data) {
            setSalaryMonths(result.data);
        } else {
            setSalaryMonths([]);
        }
    };

    const getLeavePassages = () => {
        setCurrentPage(1);
        showLoader();
        setOriginalLeavePassages([]);
        LeavePassageService.getLeavePassagesAmountsList(searchText, selFinancialYear).then(res => {
            hideLoader();
            setLeavePassages(res.data.data);
            setOriginalLeavePassages(JSON.parse(JSON.stringify(res.data.data)));
            setIsDataChanged(false);
        }).catch(err => {
            hideLoader();
            setLeavePassages([]);
            setOriginalLeavePassages([]);
        });
    }

    const handlePageChange = (page) => setCurrentPage(page);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return leavePassages.slice(startIndex, endIndex);
    }, [leavePassages, currentPage, rowsPerPage]);

    const checkDataChanged = (updatedData) => {
        const hasChanges = updatedData.some((item, i) => {
            const originalItem = originalLeavePassages[i];
            const currentVal = String(item.leavePassageAmount || '');
            const originalVal = String(originalItem?.leavePassageAmount || '');
            const amountChanged = currentVal !== originalVal;
            const paidMonthChanged = (item.paidIdSalaryMonth || null) !== (originalItem?.paidIdSalaryMonth || null);
            return amountChanged || paidMonthChanged;
        });
        setIsDataChanged(hasChanges);
    };

    const handleAmountChange = (index, value) => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const actualIndex = startIndex + index;
        const updatedLeavePassages = [...leavePassages];
        updatedLeavePassages[actualIndex].leavePassageAmount = value;
        setLeavePassages(updatedLeavePassages);
        checkDataChanged(updatedLeavePassages);
    }

    const handlePaidMonthChange = (index, value) => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const actualIndex = startIndex + index;
        const updatedLeavePassages = [...leavePassages];
        updatedLeavePassages[actualIndex].paidIdSalaryMonth = value ? parseInt(value) : null;
        setLeavePassages(updatedLeavePassages);
        checkDataChanged(updatedLeavePassages);
    };

    const saveLeavePassageAmounts = () => {
        const payload = leavePassages
            .filter((item) => {
                const originalItem = originalLeavePassages.find(orig => orig.idEmployee === item.idEmployee);
                if (!originalItem) return false;

                const currentVal = String(item.leavePassageAmount || '');
                const originalVal = String(originalItem.leavePassageAmount || '');
                const amountChanged = currentVal !== originalVal;
                const paidMonthChanged = (item.paidIdSalaryMonth || null) !== (originalItem.paidIdSalaryMonth || null);

                return amountChanged || paidMonthChanged;
            })
            .map(item => ({
                idLeavePassageAmount: item.idLeavePassageAmount || 0,
                idEmployee: item.idEmployee,
                amount: item.leavePassageAmount === '' ? null : (item.leavePassageAmount ? parseFloat(item.leavePassageAmount) : 0),
                idFinancialYear: parseInt(selFinancialYear),
                financialYearFrom: item.financialYearFrom,
                financialYearTo: item.financialYearTo,
                paidIdSalaryMonth: item.paidIdSalaryMonth || 0,
                createdBy: userData?.idEmployee || 0,
                createdOn: new Date().toISOString(),
                modifiedBy: userData?.idEmployee || 0,
                modifiedDate: new Date().toISOString()
            }));

        if (payload.length === 0) {
            toast.info("No changes to save");
            return;
        }

        LeavePassageService.saveLeavePassagesAmounts(payload).then(res => {
            console.log(res)
            if (res.data.success) {
                getLeavePassages();
            }
        }).catch(err => {
        });
    }

    const resetChanges = () => {
        setLeavePassages(JSON.parse(JSON.stringify(originalLeavePassages)));
        setIsDataChanged(false);
    }

    const openReversalModal = (item) => {
        setSelectedReversalItem(item);
        setReversalForm({ reversalMonth: '', reversalAmount: '', remarks: '' });
        setReversalType('reversal');
        setShowReversalModal(true);
    };

    const validReversalMonths = useMemo(() => {
        const startOfCurrentMonth = moment().startOf('month');
        return salaryMonths.filter(month =>
            moment(month.salaryMonthDate).isSameOrAfter(startOfCurrentMonth)
        );
    }, [salaryMonths]);

    const submitReversal = () => {
        if (!reversalForm.reversalMonth) {
            toast.warning("Please select a leave passage reversal salary month");
            return;
        }

        const selectedMonth = salaryMonths.find(m => m.idSalaryMonth === parseInt(reversalForm.reversalMonth));
        if (selectedMonth && moment(selectedMonth.salaryMonthDate).isBefore(moment().startOf('month'))) {
            toast.warning("Please select a current or future salary month for reversal");
            return;
        }

        if (!reversalForm.reversalAmount) {
            toast.warning("Please enter a reversal amount");
            return;
        }
        if (parseFloat(reversalForm.reversalAmount) > parseFloat(selectedReversalItem.leavePassageAmount)) {
            toast.warning("Reversal amount cannot be greater than LP amount.");
            return;
        }
        if (!reversalForm.remarks.trim()) {
            toast.warning("Please enter remarks");
            return;
        }

        const payload = [{
            idLeavePassageAmount: 0,
            idEmployee: selectedReversalItem.idEmployee,
            idFinancialYear: parseInt(selFinancialYear),
            reversalMonth: parseInt(reversalForm.reversalMonth),
            reversalAmount: parseFloat(reversalForm.reversalAmount),
            remarks: reversalForm.remarks,
            createdBy: userData?.idEmployee || 0,
            createdOn: new Date().toISOString(),
            modifiedBy: userData?.idEmployee || 0,
            modifiedDate: new Date().toISOString()
        }];

        const apiCall = reversalType === 'addition'
            ? LeavePassageService.submitLeavePassageAddition(payload)
            : LeavePassageService.submitLeavePassageReversal(payload);

        apiCall.then(res => {
            if (res.data.success) {
                setShowReversalModal(false);
                getLeavePassages();
            }
        }).catch(err => {});
    };

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            <div className="row">
                <div className="col-lg-12">
                    <div className="card">
                        <div className="card-header d-flex align-items-center justify-content-between pb-3">
                            <h5 className="m-0">Leave Passage Amounts</h5>

                            <div className="list_menu">
                                <div className="list_searchbox">
                                    <select
                                        className="form-select"
                                        value={selFinancialYear || ''}
                                        onChange={(e) => setSelFinancialYear(e.target.value ? parseInt(e.target.value) : null)}
                                        style={{ width: '250px' }}
                                    >
                                        <option value={''}>Select Year</option>
                                        {workYearsList.map(year => (
                                            <option key={year.idWorkYear} value={year.idWorkYear}>
                                                {year.displayText}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="list_searchbox">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search"
                                        value={searchText}
                                        maxLength={30}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' ? getLeavePassages() : ''}
                                    />
                                    <i className="bx bx-search cursor" onClick={() => getLeavePassages()}></i>
                                </div>
                                <div className="d-flex gap-2">
                                    <button
                                        className="btn btn-outline-secondary btn-sm px-3"
                                        onClick={resetChanges}
                                        disabled={!isDataChanged}
                                    >
                                        Reset
                                    </button>
                                    <button
                                        className="btn btn-primary btn-sm px-4"
                                        onClick={saveLeavePassageAmounts}
                                        disabled={!isDataChanged}
                                    >
                                        Submit
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive text-nowrap">
                                <table className="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Emp. Code</th>
                                            <th>Employee Name</th>
                                            <th>Department</th>
                                            <th>Joining Date</th>
                                            <th>Requested Month</th>
                                            <th>Status</th>
                                            <th className="text-end">LP Amount</th>
                                            <th>Paid Month</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody className="table-border-bottom-0">
                                        {paginatedData?.length > 0 ? (
                                            paginatedData?.map((item, index) => {
                                                const isNegativeAmount = parseFloat(item?.leavePassageAmount) < 0;
                                                return (
                                                <tr key={index} style={isNegativeAmount ? { backgroundColor: '#f0f0f0' } : {}}>
                                                    <td>{item?.employeeCode}</td>
                                                    <td>{item?.employeeName}</td>
                                                    <td>{item?.departmentName}</td>
                                                    <td>{item?.joiningDate ? moment(item.joiningDate).format("MM/DD/YYYY") : 'N/A'}</td>
                                                    <td>{item?.requestedMonthName || '-'}</td>
                                                    <td>{item?.lpRequestApprovalStatus ? item.lpRequestApprovalStatus.charAt(0).toUpperCase() + item.lpRequestApprovalStatus.slice(1).toLowerCase() : '-'}</td>
                                                    <td className="text-end">
                                                        <NumericFormat
                                                            key={`${item.idEmployee}-${index}`}
                                                            className="form-control-sm text-end"
                                                            value={item?.leavePassageAmount || ''}
                                                            onValueChange={(values) => {
                                                                const { value } = values;
                                                                handleAmountChange(index, value);
                                                            }}
                                                            decimalScale={2}
                                                            allowNegative={true}
                                                            thousandSeparator={true}
                                                            allowLeadingZeros={false}
                                                            placeholder="Add amount"
                                                            maxLength={12}
                                                            style={{ width: '120px' }}
                                                        />
                                                    </td>
                                                    <td>
                                                        <select
                                                            className="form-select form-select-sm"
                                                            style={{ minWidth: '150px' }}
                                                            value={item?.paidIdSalaryMonth || ''}
                                                            onChange={(e) => handlePaidMonthChange(index, e.target.value)}
                                                        >
                                                            <option value="">-- Select --</option>
                                                            {salaryMonths.map(month => (
                                                                <option key={month.idSalaryMonth} value={month.idSalaryMonth}>
                                                                    {month.salaryMonthText}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        {!isNegativeAmount && originalLeavePassages.find(orig => orig.idEmployee === item.idEmployee)?.paidIdSalaryMonth ? (
                                                            <button
                                                                className="btn btn-sm btn-icon btn-outline-danger"
                                                                title="Payment Reversal"
                                                                onClick={() => openReversalModal(item)}
                                                            >
                                                                <i className="bx bx-transfer-alt"></i>
                                                            </button>
                                                        ) : null}
                                                    </td>
                                                </tr>
                                                );
                                            })
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
                            {leavePassages.length > 0 && (
                                <div className="text-end pt-2">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={handlePageChange}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Reversal / Addition Modal */}
            <Modal show={showReversalModal} onHide={() => setShowReversalModal(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Leave Passage Reversal or Addition</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedReversalItem && (
                        <>
                            <div className="row mb-3">
                                <div className="col-6">
                                    <div className="p-2 rounded" style={{ backgroundColor: '#f5f5f9' }}>
                                        <span className="fw-semibold text-primary">Emp Code:</span> {selectedReversalItem.employeeCode}
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="p-2 rounded" style={{ backgroundColor: '#f5f5f9' }}>
                                        <span className="fw-semibold text-primary">Employee Name:</span> {selectedReversalItem.employeeName}
                                    </div>
                                </div>
                            </div>
                            <div className="row mb-3">
                                <div className="col-6">
                                    <div className="p-2 rounded" style={{ backgroundColor: '#f5f5f9' }}>
                                        <span className="fw-semibold text-primary">Designation:</span> {selectedReversalItem.designationName}
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="p-2 rounded" style={{ backgroundColor: '#f5f5f9' }}>
                                        <span className="fw-semibold text-primary">Department:</span> {selectedReversalItem.departmentName}
                                    </div>
                                </div>
                            </div>
                            <div className="mb-3 d-flex gap-4">
                                <Form.Check
                                    type="radio"
                                    id="type-reversal"
                                    label="Reversal"
                                    name="reversalType"
                                    value="reversal"
                                    checked={reversalType === 'reversal'}
                                    onChange={() => setReversalType('reversal')}
                                />
                                <Form.Check
                                    type="radio"
                                    id="type-addition"
                                    label="Addition"
                                    name="reversalType"
                                    value="addition"
                                    checked={reversalType === 'addition'}
                                    onChange={() => setReversalType('addition')}
                                />
                            </div>
                            <div className="mb-3">
                                <Form.Label className="fw-semibold">
                                    {reversalType === 'addition' ? 'Addition' : 'Reversal'} Salary Month <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Select
                                    value={reversalForm.reversalMonth}
                                    onChange={(e) => setReversalForm(prev => ({ ...prev, reversalMonth: e.target.value }))}
                                >
                                    <option value="">Select Month</option>
                                    {validReversalMonths.map(month => (
                                        <option key={month.idSalaryMonth} value={month.idSalaryMonth}>
                                            {month.salaryMonthText}
                                        </option>
                                    ))}
                                </Form.Select>
                            </div>
                            <div className="mb-3">
                                <Form.Label className="fw-semibold">{reversalType === 'addition' ? 'Addition' : 'Reversal'} Amount <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="number"
                                    placeholder="Enter amount"
                                    value={reversalForm.reversalAmount}
                                    onChange={(e) => setReversalForm(prev => ({ ...prev, reversalAmount: e.target.value }))}
                                />
                            </div>
                            <div className="mb-3">
                                <Form.Label className="fw-semibold">Remarks <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    placeholder="Enter remarks"
                                    value={reversalForm.remarks}
                                    onChange={(e) => setReversalForm(prev => ({ ...prev, remarks: e.target.value }))}
                                />
                            </div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <button
                        className="btn btn-primary"
                        onClick={submitReversal}
                    >
                        Submit
                    </button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}

export default LeavePassageAmount;
