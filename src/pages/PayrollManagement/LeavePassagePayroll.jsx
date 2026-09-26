import React, { useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import CommonService from '../../core/services/CommonService';
import LeavePassageService from '../../core/services/LeavePassageService';
import { Form, Modal } from 'react-bootstrap';
import Select from 'react-select';
import Pagination from '../../components/pagination';
import { useLoader } from '../../components/LoaderContext';
import { showToast } from '../../components/ToastNotifications/toastUtils';

function LeavePassagePayroll() {
    const [leavePassages, setLeavePassages] = useState([]);
    const [workYears, setWorkYears] = useState([]);
    const [salaryMonths, setSalaryMonths] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [departmentsList, setDepartmentsList] = useState([]);
    const [designationsList, setDesignationsList] = useState([]);
    const [selWorkYear, setSelWorkYear] = useState(null);
    const [selWorkYearData, setSelWorkYearData] = useState(null);
    const [requestStatus, setRequestStatus] = useState('');
    const [approvalStatus, setApprovalStatus] = useState('');
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showAddModal, setShowAddModal] = useState(false);
    const [validated, setValidated] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [addForm, setAddForm] = useState({ idSalaryMonth: '', remarks: '' });
    const { showLoader, hideLoader } = useLoader();

    const rowsPerPage = 10;
    const totalPages = Math.ceil(leavePassages.length / rowsPerPage);

    useEffect(() => {
        getWorkYears();
        getEmployees();
        CommonService.getDepartmentsList().then(r => { if (r?.data?.data) setDepartmentsList(r.data.data); });
        CommonService.getDesignationsList().then(r => { if (r?.data?.data) setDesignationsList(r.data.data); });
    }, []);

    useEffect(() => {
        if (selWorkYear) {
            getLeavePassages();
            getSalaryMonths();
        }
    }, [selWorkYear, requestStatus, approvalStatus]);

    const getWorkYears = async () => {
        const result = await CommonService.getAllWorkYears();
        if (!result.error && result.data) {
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth();
            let financialYear = currentYear;
            if (currentMonth < 3) financialYear = currentYear - 1;

            const filteredYears = result.data.filter(year => {
                const yearStart = parseInt(year.displayText.split('-')[0]);
                return yearStart >= (financialYear - 1) && yearStart <= (financialYear + 2);
            });

            setWorkYears(filteredYears);
            if (filteredYears.length > 0) {
                setSelWorkYear(filteredYears[0].idWorkYear);
                setSelWorkYearData(filteredYears[0]);
            }
        }
    };

    const getSalaryMonths = async () => {
        const result = await CommonService.getWorkYearSalaryMonths(selWorkYear);
        if (!result.error && result.data) {
            setSalaryMonths(result.data);
        } else {
            setSalaryMonths([]);
        }
    };

    const getEmployees = () => {
        CommonService.getEmployeeList().then(res => {
            const empData = res.data.data || [];
            const options = empData.map(emp => ({
                value: emp.idEmployee,
                label: emp.fullName,
                ...emp
            }));
            setEmployees(options);
        }).catch(() => {});
    };


    const getLeavePassages = () => {
        showLoader();
        LeavePassageService.getLeavePassageRequestsForHR(selWorkYear, requestStatus || 'ALL', searchText, approvalStatus || 'ALL')
            .then(res => {
                hideLoader();
                setLeavePassages(res.data.data || []);
                setCurrentPage(1);
            }).catch(() => {
                hideLoader();
                setLeavePassages([]);
            });
    };

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return leavePassages.slice(startIndex, startIndex + rowsPerPage);
    }, [leavePassages, currentPage]);

    const resetAddForm = () => {
        setSelectedEmployee(null);
        setAddForm({ idSalaryMonth: '', remarks: '' });
        setValidated(false);
    };

    const handleAddSubmit = () => {
        if (!selectedEmployee || !addForm.idSalaryMonth) {
            setValidated(true);
            showToast("Please fill all required fields", 'error');
            return;
        }

        const selectedMonth = salaryMonths.find(m => m.idSalaryMonth === parseInt(addForm.idSalaryMonth));
        const dept = departmentsList.find(d => d.idDepartment === selectedEmployee.idDepartment);
        const desig = designationsList.find(d => d.idDesignation === selectedEmployee.idDesignation);

        const payload = {
            idLeavePassage: 0,
            idEmployee: selectedEmployee.value,
            idFinancialYear: selWorkYear,
            idSalaryMonth: parseInt(addForm.idSalaryMonth),
            remarks: addForm.remarks,
            approvalStatus: 'SUBMITTED',
            leavePassageAmount: 0,
            employeeCode: selectedEmployee.employeeCode || '',
            employeeName: selectedEmployee.fullName || '',
            departmentName: dept?.departmentName || '',
            designationName: desig?.designationName || '',
            idDepartment: selectedEmployee.idDepartment || 0,
            idDesignation: selectedEmployee.idDesignation || 0,
            salaryMonthText: selectedMonth?.salaryMonthText || '',
            financialYearFrom: selWorkYearData?.dateFrom || selWorkYearData?.workDateFrom || selWorkYearData?.financialYearFrom || '',
            financialYearTo: selWorkYearData?.dateTo || selWorkYearData?.workDateTo || selWorkYearData?.financialYearTo || '',
            leavePassageAmountFromLeavePassageAmount: 0
        };

        LeavePassageService.addLeavePassage(payload).then(res => {
            if (res.data.success) {
                showToast('Leave Passage Request added successfully', 'success');
                setShowAddModal(false);
                resetAddForm();
                getLeavePassages();
            }
        }).catch(() => {});
    };

    const getApprovalBadge = (status) => {
        if (!status) return <span>—</span>;
        const classMap = {
            APPROVED: 'bg-label-success',
            SUBMITTED: 'bg-label-warning',
            REJECTED: 'bg-label-danger',
            PENDING: 'bg-label-secondary',
        };
        return (
            <span className={`badge ${classMap[status] || 'bg-label-secondary'}`}>
                {status.charAt(0) + status.slice(1).toLowerCase()}
            </span>
        );
    };

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between pb-3 flex-wrap gap-2">
                    <h5 className="m-0">Leave Passage Requests</h5>
                    <div className="list_menu flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-2">
                            <label className="mb-0 text-nowrap fw-semibold">Academic Year</label>
                            <select
                                className="form-select form-select-sm"
                                style={{ width: '130px' }}
                                value={selWorkYear || ''}
                                onChange={e => {
                                    const val = parseInt(e.target.value);
                                    setSelWorkYear(val);
                                    setSelWorkYearData(workYears.find(y => y.idWorkYear === val));
                                }}
                            >
                                {workYears.map(y => (
                                    <option key={y.idWorkYear} value={y.idWorkYear}>{y.displayText}</option>
                                ))}
                            </select>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <label className="mb-0 text-nowrap fw-semibold">Request Status</label>
                            <select
                                className="form-select form-select-sm"
                                style={{ width: '150px' }}
                                value={requestStatus}
                                onChange={e => setRequestStatus(e.target.value)}
                            >
                                <option value="ALL">All</option>
                                <option value="REQUESTED">Requested</option>
                                <option value="NOT REQUESTED">Not Requested</option>
                            </select>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <label className="mb-0 text-nowrap fw-semibold">Approval Status</label>
                            <select
                                className="form-select form-select-sm"
                                style={{ width: '140px' }}
                                value={approvalStatus}
                                onChange={e => setApprovalStatus(e.target.value)}
                            >
                                <option value="ALL">All</option>
                                <option value="SUBMITTED">Submitted</option>
                                <option value="APPROVED">Approved</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>
                        <div className="list_searchbox">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search"
                                value={searchText}
                                maxLength={30}
                                onChange={e => setSearchText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' ? getLeavePassages() : ''}
                            />
                            <i className="bx bx-search cursor" onClick={getLeavePassages}></i>
                        </div>
                        <button
                            className="btn btn-primary btn-sm px-3"
                            onClick={() => { resetAddForm(); setShowAddModal(true); }}
                        >
                            Add
                        </button>
                    </div>
                </div>
                <div className="card-body">
                    <div className="table-responsive text-nowrap">
                        <table className="table table-sm">
                            <thead>
                                <tr>
                                    <th>Emp Code</th>
                                    <th>Employee Name</th>
                                    <th>Department</th>
                                    <th>Joining Date</th>
                                    <th>Requested Month</th>
                                    <th>Approval Status</th>
                                </tr>
                            </thead>
                            <tbody className="table-border-bottom-0">
                                {paginatedData.length > 0 ? (
                                    paginatedData.map((item, i) => (
                                        <tr key={i}>
                                            <td className="text-primary">{item.employeeCode}</td>
                                            <td>{item.employeeName}</td>
                                            <td>{item.departmentName}</td>
                                            <td>{item.joiningDate ? moment(item.joiningDate).format('DD-MM-YYYY') : '—'}</td>
                                            <td>
                                                {item.salaryMonthText
                                                    ? <span className="badge bg-label-primary">{item.salaryMonthText}</span>
                                                    : <span>—</span>
                                                }
                                            </td>
                                            <td>{getApprovalBadge(item.approvalStatus)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="text-center">
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
                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                        </div>
                    )}
                </div>
            </div>

            <Modal show={showAddModal} onHide={() => { setShowAddModal(false); resetAddForm(); }} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Add Leave Passage Request</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="mb-3">
                        <Form.Label className="fw-semibold">Employee Name <span className="text-danger">*</span></Form.Label>
                        <Select
                            options={employees}
                            isSearchable
                            placeholder="-- Select Employee --"
                            value={selectedEmployee}
                            onChange={opt => setSelectedEmployee(opt)}
                            className={validated && !selectedEmployee ? 'is-invalid-select' : ''}
                        />
                        {validated && !selectedEmployee && (
                            <div className="text-danger mt-1" style={{ fontSize: '0.875em' }}>Employee is required</div>
                        )}
                    </div>
                    <div className="mb-3">
                        <Form.Label className="fw-semibold">Requested Month <span className="text-danger">*</span></Form.Label>
                        <Form.Select
                            value={addForm.idSalaryMonth}
                            onChange={e => setAddForm(prev => ({ ...prev, idSalaryMonth: e.target.value }))}
                        >
                            <option value="">-- Select Month --</option>
                            {salaryMonths.map(m => (
                                <option key={m.idSalaryMonth} value={m.idSalaryMonth}>{m.salaryMonthText}</option>
                            ))}
                        </Form.Select>
                        {validated && !addForm.idSalaryMonth && (
                            <div className="text-danger mt-1" style={{ fontSize: '0.875em' }}>Requested Month is required</div>
                        )}
                    </div>
                    <div className="mb-3">
                        <Form.Label className="fw-semibold">Remarks</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            placeholder="Enter any remarks or notes here..."
                            value={addForm.remarks}
                            onChange={e => setAddForm(prev => ({ ...prev, remarks: e.target.value }))}
                        />
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <button className="btn btn-outline-secondary px-4" onClick={resetAddForm}>Reset</button>
                    <button className="btn btn-dark px-4" onClick={handleAddSubmit}>Submit</button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default LeavePassagePayroll;
