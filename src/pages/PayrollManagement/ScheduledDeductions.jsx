import React, { useEffect, useState } from "react";
import ScheduledDeductionService from "../../core/services/ScheduledDeductionService";
import CommonService from "../../core/services/CommonService";
import { Form, Modal } from "react-bootstrap";
import { Months } from "../../core/constants/commons";
import { toast } from "react-toastify";
import moment from "moment";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function ScheduledDeductions() {
  const [scheduledDeductions, setScheduledDeductions] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [salaryHeadList, setSalaryHeadListList] = useState([]);
  const optionsMonth = Months;
  const [startDate, setStartDate] = useState(new Date());
  const [searchText, setSearchText] = useState('');
  const [newData, setNewData] = useState({
    idScheduledSalaryDeduction: 0,
    idEmployee: 0,
    totalAmount: null,
    deductionFromSalaryMonthDate: null,
    deductionToSalaryMonthDate: null,
    allocatingSalaryHead: 0,
    monthCount: 0,
    monthlyDeductableAmount: 0,
  });
  const [validated, setValidated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    getSalaryHeadData();
    getEmployeesData();
  }, []);

  useEffect(() => {
    getScheduledDeductions();
  }, [startDate, searchText]);

  useEffect(() => {
    const monthCount = calculateMonthCount(
      newData.deductionFromSalaryMonthDate,
      newData.deductionToSalaryMonthDate
    );
    const monthlyDeductableAmount = calculateMonthlyDeductableAmount(
      newData.totalAmount,
      monthCount
    );

    setNewData((prevData) => ({
      ...prevData,
      monthCount,
      monthlyDeductableAmount,
    }));
  }, [
    newData.deductionFromSalaryMonthDate,
    newData.deductionToSalaryMonthDate,
    newData.totalAmount,
  ]);

  const getScheduledDeductions = () => {
    const date = moment(startDate).format("YYYY-MM-DD");
    ScheduledDeductionService.getScheduledDeductionsData(date, searchText).then(res => {
      setScheduledDeductions(res.data.data);
    }).catch(err => {
    });
  }

  const getEmployeesData = () => {
    CommonService.getEmployeeList().then(res => {
      setEmployeesList(res.data.data);
    }).catch(err => {
    });
  }

  const getSalaryHeadData = () => {
    CommonService.getSalaryHeadList().then(res => {
      setSalaryHeadListList(res.data.data);
    }).catch(err => {
    });
  }

  const setupEdit = (item) => {
    setIsEdit(true);
    setNewData({
      idScheduledSalaryDeduction: item.idScheduledSalaryDeduction,
      idEmployee: item.idEmployee,
      totalAmount: item.totalAmount,
      deductionFromSalaryMonthDate: moment(new Date(item.deductionFromSalaryMonthDate)).format("MM/dd/yyyy"),
      deductionToSalaryMonthDate: moment(new Date(item.deductionToSalaryMonthDate)).format("MM/dd/yyyy"),
      allocatingSalaryHead: item.allocatingSalaryHead,
      monthCount: item.monthCount,
      monthlyDeductableAmount: item.monthlyDeductableAmount,
    });
    setShowModal(true);
  }

  const calculateMonthCount = (fromDate, toDate) => {
    if (fromDate && toDate) {
      const fromDateObj = new Date(fromDate);
      const toDateObj = new Date(toDate);

      let monthCount =
        (toDateObj.getFullYear() - fromDateObj.getFullYear()) * 12 +
        (toDateObj.getMonth() - fromDateObj.getMonth());

      return monthCount + 1;
    }
    return 0;
  };

  const calculateMonthlyDeductableAmount = (totalAmount, monthCount) => {
    if (totalAmount && monthCount) {
      return parseFloat((totalAmount / monthCount).toFixed(2));
    }
    return 0;
  };

  const saveScheduledDeductions = (e) => {
    e.preventDefault();
    if (!newData.idEmployee || !newData.allocatingSalaryHead) {
      setValidated(true);
      return;
    }
    let passData = newData;
    passData['deductionFromSalaryMonthDate'] = moment(passData['deductionFromSalaryMonthDate']).format('YYYY-MM-DD');
    passData['deductionToSalaryMonthDate'] = moment(passData['deductionToSalaryMonthDate']).format('YYYY-MM-DD');
    passData['deductionFromSalaryMonth'] = new Date(passData['deductionFromSalaryMonthDate']).getMonth() + 1;
    passData['deductionToSalaryMonth'] = new Date(passData['deductionToSalaryMonthDate']).getMonth() + 1;
    ScheduledDeductionService.saveScheduledDeductionsData(passData).then(res => {
      if (res.data.status === 200) {
        toast.success('Scheduled deductions added successfully', {
          position: 'top-right',
          autoClose: 2000
        });
        getScheduledDeductions();
        resetValues();
        setShowModal(false);
      }
    }).catch(err => {
      toast.error('Something went wrong!', {
        position: 'top-right',
        autoClose: 2000
      });
    });
  }

  const updateScheduledDeductions = (e) => {
    e.preventDefault();
    if (!newData.idEmployee || !newData.allocatingSalaryHead) {
      setValidated(true);
      return;
    }
    let passData = newData;
    passData['deductionFromSalaryMonthDate'] = moment(passData['deductionFromSalaryMonthDate']).format('YYYY-MM-DD');
    passData['deductionToSalaryMonthDate'] = moment(passData['deductionToSalaryMonthDate']).format('YYYY-MM-DD');
    passData['deductionFromSalaryMonth'] = new Date(passData['deductionFromSalaryMonthDate']).getMonth() + 1;
    passData['deductionToSalaryMonth'] = new Date(passData['deductionToSalaryMonthDate']).getMonth() + 1;
    ScheduledDeductionService.updateScheduledDeductionsData(passData).then(res => {
      if (res.data.status === 200) {
        toast.success('Scheduled deductions updated successfully', {
          position: 'top-right',
          autoClose: 2000
        });
        getScheduledDeductions();
        resetValues();
        setShowModal(false);
      }
    }).catch(err => {
      toast.error('Something went wrong!', {
        position: 'top-right',
        autoClose: 2000
      });
    });
  }

  const resetValues = () => {
    setValidated(false);
    setIsEdit(false);
    setNewData({
      idScheduledSalaryDeduction: 0,
      idEmployee: 0,
      totalAmount: null,
      deductionFromSalaryMonthDate: null,
      deductionToSalaryMonthDate: null,
      allocatingSalaryHead: 0,
      monthCount: 0,
      monthlyDeductableAmount: 0,
    });
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">List of Scheduled Deductions</h5>

              <div className="list_menu">
                <div className="list_searchbox">
                  <DatePicker className="form-control" dateFormat="MM/dd/yyyy" placeholderText={'Start Date'}
                    selected={startDate} onChange={(date) => setStartDate(date)} />
                </div>
                <div className="list_searchbox">
                  <input type="search" className="form-control" placeholder="Search" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
                  <i className="bx bx-search"></i>
                </div>
                <button className="btn btn-primary btn-sm px-4" onClick={() => setShowModal(true)}>Add</button>
              </div>

            </div>
            <div className="card-body">
              <div className="table-responsive text-nowrap">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Emp. Code</th>
                      <th>Employee Name</th>
                      <th>Designation</th>
                      <th>Date From</th>
                      <th>Date To</th>
                      <th className="text-center">No. of Months </th>
                      <th className="text-end">Monthly Deduction</th>
                      <th className="text-end">Total Deduction</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody className="table-border-bottom-0">
                    {scheduledDeductions?.length > 0 ? (
                      scheduledDeductions?.map((item, index) => (
                        <tr>
                          <th>{item?.employeeCode}</th>
                          <td>{item?.employeeName}</td>
                          <td>{item?.designationName}</td>
                          <td>{item?.deductionFromSalaryMonthText}</td>
                          <td>{item?.deductionToSalaryMonthText}</td>
                          <td className="text-center">{item.monthCount}</td>
                          <td className="text-end">{(item.monthlyDeductableAmount).toFixed(2)}</td>
                          <td className="text-end">{(item.totalAmount).toFixed(2)}</td>
                          <td className="text-end">
                            <button type="button" className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0" onClick={() => setupEdit(item)}>
                              <span className="tf-icons bx bx-pencil"></span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="12" className="text-center">
                          <div className="Nodatafound_box">
                            <h6>No data available!</h6>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <Modal
          show={showModal} onHide={() => { setShowModal(false); resetValues() }} size='md'
          aria-labelledby="contained-modal-title-vcenter"
          centered backdrop="static"
          keyboard={false}>
          <Modal.Header closeButton>
            <Modal.Title>
              <h5>Add/Update Scheduled Deductions</h5>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div className="accountDetail_card">
              <Form noValidate validated={validated}>
                <div className="mb-2">
                  <label className="form-label mb-1">Employee Name</label>
                  <select className="form-select" value={newData.idEmployee}
                    onChange={(e) => setNewData({ ...newData, idEmployee: e.target.value })} required>
                    <option value={''}>Select</option>
                    {
                      employeesList?.map((el) => (
                        <option value={el.idEmployee} key={el.idEmployee}>{el.fullName}</option>
                      ))
                    }
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label mb-1">Total Deduction</label>
                  <input className="form-control" type="number" value={newData.totalAmount}
                    onChange={(e) => setNewData({ ...newData, totalAmount: e.target.value })} required />
                </div>
                <div className="mb-2">
                  <label className="form-label mb-1">Salary Month From</label>
                  <div className="row m-0">
                    <div className="col-md-12 ps-0 pe-2">
                      <DatePicker className="form-control" dateFormat="MM/DD/YYYY" placeholderText={'From Date'}
                        selected={newData.deductionFromSalaryMonthDate} onChange={(date) => setNewData({ ...newData, deductionFromSalaryMonthDate: date })} />
                    </div>
                  </div>
                </div>
                <div className="mb-2">
                  <label className="form-label mb-1">Salary Month To</label>
                  <div className="row m-0">
                    <div className="col-md-12 ps-0 pe-2">
                      <DatePicker className="form-control" dateFormat="MM/DD/YYYY" placeholderText={'To Date'}
                        selected={newData.deductionToSalaryMonthDate} onChange={(date) => setNewData({ ...newData, deductionToSalaryMonthDate: date })} />
                    </div>
                  </div>
                </div>
                <div className="mb-2">
                  <label className="form-label mb-1">
                    Allocating Salary Head
                  </label>
                  <select className="form-select" value={newData.allocatingSalaryHead}
                    onChange={(e) => setNewData({ ...newData, allocatingSalaryHead: e.target.value })} required>
                    <option value={''}>Select</option>
                    {
                      salaryHeadList?.map((el) => (
                        <option value={el.idSalaryHead} key={el.idSalaryHead}>{el.salaryHeadName}</option>
                      ))
                    }
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label mb-1">No of Months</label>
                  <input className="form-control" type="number" disabled={true}
                    value={newData.monthCount}
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label mb-1">Monthly Deduction</label>
                  <input className="form-control" type="number" disabled={true}
                    value={newData.monthlyDeductableAmount}
                    required />
                </div>

              </Form>
            </div>
            <div className="modal-footer">
              {
                isEdit &&
                <button className="btn btn-primary btn-sm py-2 px-4 me-2" onClick={(e) => updateScheduledDeductions(e)}>Update</button>
              }
              {
                !isEdit &&
                <button className="btn btn-primary btn-sm py-2 px-4 me-2" onClick={(e) => saveScheduledDeductions(e)}>Submit</button>
              }
              <button className="btn btn-outline-secondary  btn-sm py-2 px-4" onClick={() => resetValues()}>Reset</button>
            </div>
          </Modal.Body>
        </Modal>

      </div>
    </div>
  );
}

export default ScheduledDeductions;
