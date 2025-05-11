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
  const [refreshFlag, setRefreshFlag] = useState(false);
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
      await getLeavePassagesByEmployeeId();
      setNewDataValues();
    })();
  }, [])

  useEffect(() => {
    if (employeeData) {
      setNewDataValues();
    }
  }, [employeeData]); 

  useEffect(() => {
    console.log("Fetching Leave Passages...");
    (async () => {
    await getLeavePassagesByEmployeeId();
    })();
  }, [refreshFlag]);  

  const handleFormSalaryMonthChange = (option) => {
    setFormSalaryMonth(option); // set whole object: { value, label }
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
      idFinancialYear: matched.idFinancialYear,
      financialYearFrom: matched.financialYearFrom,
      financialYearTo: matched.financialYearTo
    }));
  };

  const getAllSalaryMonths = async () => {
    try {
      const res = await CommonService.getAllSalaryMonths();
      const options = (res.data || []).map(month => ({
        value: month.idSalaryMonth,
        label: month.salaryMonthText
      }));
      setSalaryMonths(options);
    } catch (err) {
      console.error('Failed to load salary months', err);
    }
  };

  const getLeavePassagesByEmployeeId = async () => {
    setLoading(true);
    await LeavePassageService.getLeavePassagesByEmployeeId(userData.idEmployee?? 0).then(res => {
      setLeavePassages(res.data.data || []);
      setCurrentPage(1);
    }).catch(() => {
      setLeavePassages([]);
    })
    .finally(() => {
      setLoading(false);
    });
  }

  const getLeavePassagesList = () => {
    setLoading(true);
    LeavePassageService.getLeavePassagesList(userData.employeeCode?? "", null).then(res => {
      setLeavePassages(res.data.data || []);
      setCurrentPage(1);
    }).catch(() => {
      setLeavePassages([]);
    })
    .finally(() => {
      setLoading(false);
    });
  }

  const handlePageChange = (page) => setCurrentPage(page);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return leavePassages.slice(startIndex, startIndex + rowsPerPage);
  }, [leavePassages, currentPage]);

  const resetValues = () => {
    setValidated(false);
    setIsEdit(false);
    setFormSalaryMonth(null);
    setNewData({
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
  }

  const getFinancialYears = async () => {
    try {
      const res = await CommonService.getAllFinancialYears();
      setFinancialYears(res.data || []);
    } catch (err) {
      console.error('Failed to load financial months', err);
    }
  }

  const getEmployeeDetails = async () => {
    try {
      await dispatch(getEmployeeDetailsByID(userData.idEmployee)).then((response) => {
        if (response.payload && response.payload.data) {
          setEmployeeData(response.payload.data);
        }
      });
    } catch (err) {
      console.error('Failed to get employee details', err);
    }
  }

  const setNewDataValues = () => {
    setNewData({
      idLeavePassage: 0,
      idEmployee: userData.idEmployee,
      idFinancialYear: 0,
      idSalaryMonth: 0,
      remarks: "",
      approvalStatus: "",
      employeeCode: employeeData.employeeCode,
      employeeName: employeeData.fullName,
      departmentName: employeeData.department,
      designationName: employeeData.designation,
      idDepartment: employeeData.idDepartment,
      idDesignation: employeeData.idDesignation,
      salaryMonthText: "",
      financialYearFrom: "",
      financialYearTo: "",
    });
  }

  const saveLeavePassage = async (e) => {
    e.preventDefault();
    const isFormValid = newData.salaryMonthText && newData.remarks;
    if (!isFormValid) {
      setValidated(true);
      showToast("Please fill all required fields", 'warning');
      return;
    }
    setLoading(true);
    try {
      const formData = { ...newData, approvalStatus: 'SUBMITTED' };
      if(validateForm(formData)){
        const res = await LeavePassageService.addLeavePassage(formData);
        if (res.data.status === 200) {
          showToast.success('Leave Passage added successfully');
          setRefreshFlag(prev => !prev);
          setShowModal(false);
        }
      }
    } catch (err) {
      showToast("Something went wrong: " + err, 'error');
    } finally {
      setLoading(false);
    }
  }

  const updateLeavePassage = async (e) => {
    e.preventDefault();
    if (!newData.salaryMonthText || !newData.remarks) {
      setValidated(true);
      return;
    }
    setLoading(true);
    try {
      const formData = { ...newData, approvalStatus: 'SUBMITTED' };
      if(validateForm(formData)){
        const res = await LeavePassageService.updateLeavePassage(formData);
        if (res.data.status === 200) {
          showToast.success('Leave Passage updated successfully');
          setRefreshFlag(prev => !prev);
          setShowModal(false);
        }
      }
    } catch (err) {
      showToast("Something went wrong: " + err, 'error');
    } finally {
      setLoading(false);
    }
  }

  const setupEdit = (item) => {
    setIsEdit(true);
    setNewData({ ...item });
    setFormSalaryMonth({
      value: item.idSalaryMonth,
      label: item.salaryMonthText
    });
    setShowModal(true);
  }

  const validateForm = (formData) => {
    const currentFY = getFinancialYear(formData.salaryMonthText);
    const alreadyClaimedInOtherRecord = leavePassages.some((entry) => {
      const sameEmployee = entry.employeeCode === formData.employeeCode;
      const sameFY = getFinancialYear(entry.salaryMonthText) === currentFY;
      return sameEmployee && sameFY;
    });
  
    if (alreadyClaimedInOtherRecord) {
      showToast(`Leave Passage already claimed for FY ${currentFY}`, 'error');
      return false;
    }
    return true;
  }

  const getFinancialYear = (monthStr) => {
    const date = moment(monthStr, 'YYYY-MM');
    const year = date.year();
    const month = date.month() + 1;
    return month <= 3
      ? `${year - 1}-${year}`
      : `${year}-${year + 1}`;
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">Leave Passage</h5>
              <div className="list_menu">
                <button
                  className="btn btn-primary btn-sm px-4" onClick={() => {setShowModal(true); setNewDataValues();}}>
                  Add Leave Passage
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                {loading ? (
                  <div className="text-center">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : (
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Employee Name</th>
                      <th>Salary Month</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody className="table-border-bottom-0">
                    {paginatedData.length > 0 ? (
                      paginatedData.map((item) => (
                        <tr key={item.idLeavePassage}>
                          <td>{item.employeeName}</td>
                          <td>{item.salaryMonthText?moment(item.salaryMonthText).format("MM/DD/YYYY"):''}</td>
                          <td>
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
                          </td>
                          <td className="text-end">
                            {
                              item.approvalStatus != 'APPROVED' &&
                              <button type="button" className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0" onClick={() => setupEdit(item)}>
                                <span className="tf-icons bx bx-pencil"></span>
                              </button>
                            }
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center">
                          <div className="Nodatafound_box">
                            <h6>
                              <i className="bx bx-search"></i> No data available!
                            </h6>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                )}
              </div>
              <div className="text-end pt-2">
                <Pagination currentPage={currentPage} totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>
          </div>
          {showModal &&
          <Modal show={showModal} onHide={() => { setShowModal(false); resetValues() }} size='lg'
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
                      <div className="col-md-6 p-2">
                        <label className="form-label mb-1">Employee Name</label>
                        <input
                            type="text"
                            className="form-control"
                            value={newData.employeeName}
                            disabled
                          />
                      </div>
                      <div className="col-md-6 p-2">
                        <label className="form-label mb-1">Department Name</label>
                        <input
                            type="text"
                            className="form-control"
                            value={newData.departmentName}
                            disabled
                          />
                      </div>
                      <div className="col-md-6 p-2">
                        <label className="form-label mb-1">Designation Name</label>
                          <input
                              type="text"
                              className="form-control"
                          value={newData.designationName}
                          disabled
                          />
                      </div>
                        <div className="col-md-6 p-2">
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
                              <div className='red'>Salary Month is required</div>
                          )}
                      </div>
                      <div className="col-md-6 p-2">
                        <label className="form-label mb-1">Remarks</label>
                        <textarea className="form-control" rows={5}
                          value={newData.remarks} maxLength="100"
                          onChange={(e) => setNewData({ ...newData, remarks: e.target.value })}
                        />
                        <small>{100 - newData.remarks.length} / 100 characters remaining</small>
                      </div>
                    </div>
                  </div>
                </Form>
              </div>
            </Modal.Body>

              <Modal.Footer>
                <button className="btn btn-secondary btn-sm" onClick={() => { setShowModal(false); resetValues(); }}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={(e) => {
                    isEdit ? updateLeavePassage(e) : saveLeavePassage(e);
                    setShowModal(false);
                    resetValues();
                    setRefreshFlag(prev => !prev);
                  }}
                >
                  {isEdit ? 'Update' : 'Submit'}
                </button>

              </Modal.Footer>
          </Modal>}
        </div>
      </div>
    </div>
  );
};

export default LeavePassage;