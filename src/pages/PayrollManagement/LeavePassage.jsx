import React, { useEffect, useMemo, useState } from 'react';
import secureLocalStorage from 'react-secure-storage';
import moment from 'moment';
import CommonService from '../../core/services/CommonService';
import LeavePassageService from '../../core/services/LeavePassageService';
import Pagination from "../../components/pagination";
import { Form, Modal, Spinner } from 'react-bootstrap';
import Select from 'react-select';
import { useDispatch } from "react-redux";
import { getEmployeeDetailsByID } from "../../redux/reducers/getEmployeeDetails";
import { showToast } from '../../components/ToastNotifications/toastUtils';

const LeavePassage = () => {
  const dispatch = useDispatch();
  const userData = JSON.parse(secureLocalStorage.getItem("user") || "{}");
  const [leavePassages, setLeavePassages] = useState([]);
  const [salaryMonths, setSalaryMonths] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [validated, setValidated] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [formSalaryMonth, setFormSalaryMonth] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [newData, setNewData] = useState({
    idLeavePassage: 0,
    idEmployee: 0,
    idFinancialYear: 0,
    idSalaryMonth: 0,
    remarks: "",
    approvalStatus: "",
    employeeCode: 0,
    employeeName: "",
    departmentName: "",
    designationName: "",
    idDepartment: 0,
    idDesignation: 0,
    salaryMonthText: "",
    financialYearFrom: "",
    financialYearTo: "",
  });

  const rowsPerPage = 10;
  const totalPages = Math.ceil((leavePassages?.length || 0) / rowsPerPage);

  useEffect(() => {
    (async () => {
      await getAllSalaryMonths();
      await getFinancialYears();
      await getEmployeeDetails();
    })();
  }, []);

  useEffect(() => {
    getLeavePassagesByEmployeeId();
  }, [refreshCounter]);  

  const handleFormSalaryMonthChange = (option) => {
    setFormSalaryMonth(option);
    const selectedDate = moment(option.label);
    const matched = financialYears.find((fy) => {
      const from = moment(fy.financialYearFrom);
      const to = moment(fy.financialYearTo);
      return selectedDate.isSameOrAfter(from) && selectedDate.isSameOrBefore(to);
    });

    setNewData((prevData) => ({
      ...prevData,
      salaryMonthText: option.label,
      idSalaryMonth: option.value,
      idFinancialYear: matched?.idFinancialYear ?? 0,
      financialYearFrom: matched?.financialYearFrom ?? "",
      financialYearTo: matched?.financialYearTo ?? "",
    }));
  };

  const getAllSalaryMonths = async () => {
    try {
      const res = await CommonService.getAllSalaryMonths();
      const options = (res.data || []).map(month => ({
        value: month.idSalaryMonth,
        label: month.salaryMonthText
      }));
      const currentMonth = moment();
      const filteredSalaryMonths = options.filter(option => {
        const date = moment(option.label, 'MMMM, YYYY');
        return (
          date.isValid() &&
          date.year() === currentMonth.year() && 
          date.month() >= currentMonth.month()
        );
      });
      setSalaryMonths(filteredSalaryMonths);
    } catch (err) {
      console.error('Failed to load salary months', err);
    }
  };

  const getLeavePassagesByEmployeeId = async () => {
    setLoading(true);
    try {
      const res = await LeavePassageService.getLeavePassagesByEmployeeId(userData.idEmployee ?? 0);
      setLeavePassages(res.data.data || []);
      setCurrentPage(1);
    } catch {
      setLeavePassages([]);
    } finally {
      setLoading(false);
  }
  };

  const getFinancialYears = async () => {
    try {
      const res = await CommonService.getAllFinancialYears();
      setFinancialYears(res.data || []);
    } catch (err) {
      console.error('Failed to load financial years', err);
    }
  };

  const getEmployeeDetails = async () => {
    try {
      const response = await dispatch(getEmployeeDetailsByID(userData.idEmployee));
        if (response.payload && response.payload.data) {
        const empData = response.payload.data;
        setEmployeeData(empData);
        setNewDataValues(empData);
        }
    } catch (err) {
      console.error('Failed to get employee details', err);
    }
  };

  const setNewDataValues = (empData = employeeData) => {
    if (!empData) return;
    setNewData({
      idLeavePassage: 0,
      idEmployee: userData.idEmployee,
      idFinancialYear: 0,
      idSalaryMonth: 0,
      remarks: "",
      approvalStatus: "",
      employeeCode: empData.employeeCode,
      employeeName: empData.fullName,
      departmentName: empData.department,
      designationName: empData.designation,
      idDepartment: empData.idDepartment,
      idDesignation: empData.idDesignation,
      salaryMonthText: "",
      financialYearFrom: "",
      financialYearTo: "",
    });
  };

  const handlePageChange = (page) => setCurrentPage(page);

  const paginatedData = useMemo(() => {
    const getDate = (monthText) => new Date(`01 ${monthText}`);
    const sortedData = [...leavePassages].sort((a, b) =>
      getDate(a.salaryMonthText) - getDate(b.salaryMonthText)
    );
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [leavePassages, currentPage]);

  const resetValues = () => {
    setValidated(false);
    setIsEdit(false);
    setFormSalaryMonth(null);
    setNewDataValues();
  };

  const saveLeavePassage = async (e) => {
    e.preventDefault();
    if (!newData.salaryMonthText || !newData.remarks) {
      setValidated(true);
      showToast("Please fill all required fields", 'error');
      return;
    }
    setLoading(true);
    try {
      const formData = { ...newData, approvalStatus: 'SUBMITTED' };
      if(validateForm(formData, "ADD")){
        const res = await LeavePassageService.addLeavePassage(formData);
        if (res.data.success) {
          showToast('Leave Passage added successfully', 'success');
          setShowModal(false);
          resetValues();
        }
      }
    } catch (err) {
      showToast("Something went wrong: " + err, 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateLeavePassage = async (e) => {
    e.preventDefault();
    if (!newData.salaryMonthText || !newData.remarks) {
      setValidated(true);
      return;
    }
    setLoading(true);
    try {
      const formData = { ...newData, approvalStatus: 'SUBMITTED' };
      if(validateForm(formData, "EDIT")){
        const res = await LeavePassageService.updateLeavePassage(formData);
        if (res.data.success) {
          showToast('Leave Passage updated successfully', 'success');
          setShowModal(false);
          resetValues();
        }
      }
    } catch (err) {
      showToast("Something went wrong: " + err, 'error');
    } finally {
      setLoading(false);
    }
  };

  const setupEdit = (item) => {
    setIsEdit(true);
    setNewData({ ...item });
    setFormSalaryMonth({
      value: item.idSalaryMonth,
      label: item.salaryMonthText
    });
    setShowModal(true);
  };

  const validateForm = (formData, mode) => {
    const currentFY = getFinancialYear(formData.salaryMonthText);
    const duplicateRecord = leavePassages.some((entry) => {
      const sameEmployee = entry.employeeCode === formData.employeeCode;
      const sameFY = getFinancialYear(entry.salaryMonthText) === currentFY;
      const isDifferentRecord = entry.idLeavePassage !== formData.idLeavePassage;
  
      if (sameEmployee && sameFY) {
        if (mode === 'ADD') return true;
        if (mode === 'EDIT' && isDifferentRecord) return true;
        if (mode === 'EDIT' && !isDifferentRecord) {
          return entry.approvalStatus === 'APPROVED';
        }
      }
      return false;
    });
  
    if (duplicateRecord) {
      showToast(`Leave Passage already claimed for ${currentFY}`, 'error');
      return false;
    }
    return true;
  };

  const getFinancialYear = (monthStr) => {
    const date = moment(monthStr, 'YYYY-MM');
    return date.year();
  };

  return (
    <div className="container-fluid p-0 LeavePassageSection">
      <div className="row m-0">
        <div className="col-lg-12 p-0">
          <div className="card w-100 mx-0">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Leave Passage</h5>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginLeft: 'auto' }}
                onClick={() => {
                  resetValues();
                  setShowModal(true);
                }}>
                  + Add New
                </button>
              </div>
            <div className="card-body p-1">
                {loading ? (
                <div className="text-start">
                    <Spinner animation="border"/>
                  </div>
                ) : (
                  <>
                  <div className="table-responsive">
                    <table className="table table-sm" style={{ borderCollapse: 'collapse', border: 'none' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left' }}>Month</th>
                          <th style={{ textAlign: 'left' }}>Amount</th>
                          <th style={{ textAlign: 'left' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedData.length > 0 ? (
                          paginatedData.map((item) => (
                            <tr key={item.idLeavePassage}>
                              <td style={{ textAlign: 'left' }}>
                                {item.salaryMonthText}
                              </td>
                              <td style={{ textAlign: 'left' }}>
                                {item.leavePassageAmount === null ? 0 : item.leavePassageAmount}
                              </td>
                              <td style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span
                                  className={`badge ${
                                    item.approvalStatus === 'APPROVED'
                                      ? 'bg-label-success'
                                      : item.approvalStatus === 'SUBMITTED'
                                      ? 'bg-label-warning'
                                      : item.approvalStatus === 'REJECTED'
                                      ? 'bg-label-danger'
                                      : 'bg-label-primary'
                                  }`}
                                >
                                  {item.approvalStatus}
                                </span>
                                <button
                                  className="btn btn-sm btn-link p-0"
                                  disabled={item.approvalStatus === 'APPROVED'}
                                  onClick={() => setupEdit(item)}
                                  aria-label="Edit Leave Passage"
                                  title="Edit Leave Passage"
                                >
                                  <i className="bx bx-pencil fs-5"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="text-start">
                              <div className="Nodatafound_box p-2">
                                <h6 className='m-0'>
                                  <i className="bx bx-search"></i> No data available!
                                </h6>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              </div>
            <div className="text-start pt-2">
                <Pagination currentPage={currentPage} totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
            </div>
          </div>
          {showModal &&
            <Modal
              show={showModal}
              onHide={() => { setShowModal(false); resetValues(); }}
              size='lg'
            aria-labelledby="contained-modal-title-vcenter" centered backdrop="static" keyboard={false}>
            <Modal.Header closeButton>
              <Modal.Title>
                <h5>{isEdit? 'Update Leave Passage' : 'Add Leave Passage'}</h5>
              </Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <div className="accountDetail_card">
                <Form noValidate validated={validated}>
                  <div className="accountDetail_card">
                    <div className="row m-0">
                      <div className="col-12 p-2">
                        <label className="form-label mb-1">Employee Name</label>
                        <p>{newData?.employeeName}</p>
                      </div>
                      <div className="col-md-4 p-2">
                        <label className="form-label mb-1">Salary Month<span className="text-danger">*</span></label>
                        <Select
                          options={salaryMonths}
                          isSearchable
                          onChange={handleFormSalaryMonthChange}
                          value={formSalaryMonth}
                          placeholder="Select Salary Month"
                          className={`textSize ${validated && !formSalaryMonth ? 'is-invalid-select' : ''}`} required
                        />
                        {validated && !formSalaryMonth && (
                            <div className='red' style={{color : 'red'}}>Salary Month is required</div>
                        )}
                      </div>
                      <div className="col-md-6 px-2 d-flex flex-column">
                        <label className="form-label mb-1">Remarks<span className="text-danger">*</span></label>
                        <textarea className="form-control" rows={5}
                          value={newData.remarks} maxLength="100"
                          onChange={(e) => setNewData({ ...newData, remarks: e.target.value })}
                        />
                        <small className = "text-muted mt-1">{100 - newData.remarks.length} / 100 characters remaining</small>
                        {validated && !newData.remarks && (
                          <div className="text-danger mt-1">Remarks is required</div>
                        )}

                      <div className="mt-2 d-flex">
                          <button className="btn btn-secondary me-2" type="button"
                          onClick={() => { setShowModal(false); resetValues(); }}>
                        Cancel
                        </button>
                        <button className="btn btn-primary" type="button"
                          onClick={(e) => {
                              isEdit ? updateLeavePassage(e) : saveLeavePassage(e);
                              setRefreshCounter(prev => prev + 1);
                            }}>
                          {isEdit ? 'Update' : 'Submit'}
                        </button>
                      </div>
                      </div>
                    </div>
                  </div>
                </Form>
              </div>
            </Modal.Body>
          </Modal>}
        </div>
      </div>
    </div>
  );
};

export default LeavePassage;