import React, { useEffect, useMemo, useState } from "react";
import ScheduledDeductionService from "../../core/services/ScheduledDeductionService";
import CommonService from "../../core/services/CommonService";
import { Form, Modal } from "react-bootstrap";
import { Months } from "../../core/constants/commons";
import { toast } from "react-toastify";
import moment from "moment";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Utils from "../../utils/Utils";
import Select from 'react-select';
import Pagination from "../../components/pagination";

function ScheduledDeductions() {
  const [scheduledDeductions, setScheduledDeductions] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [salaryHeadList, setSalaryHeadList] = useState([]);
  const [salaryMonthsListFrom, setSalaryMonthsListFrom] = useState([]);
  const [salaryMonthsListTo, setSalaryMonthsListTo] = useState([]);
  const optionsMonth = Months;
  const [startDate, setStartDate] = useState(new Date('01-01-2025'));
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
  const [employeesListOption, setEmployeesListOption] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [salaryMonthsList, setSalaryMonthsList] = useState([]);
  const [filteredMonthsList, setFilteredMonthsList] = useState(salaryMonthsList);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(scheduledDeductions.length / rowsPerPage);

  useEffect(() => {
    getSalaryHeadData();
    getEmployeesData();
    getSalaryMonths();
  }, []);

  useEffect(() => {
    getScheduledDeductions();
  }, [startDate]);

  useEffect(() => {
    const selected = employeesListOption.find(option => option.value === newData.idEmployee);
    setSelectedEmployee(selected);
  }, [newData.idEmployee]);

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

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return scheduledDeductions.slice(startIndex, endIndex);
  }, [scheduledDeductions, currentPage, rowsPerPage]);

  const getScheduledDeductions = () => {
    const date = moment(startDate).format("YYYY-MM-DD");
    ScheduledDeductionService.getScheduledDeductionsData(date, searchText).then(res => {
      setScheduledDeductions(res.data.data);
    }).catch(err => {
      setScheduledDeductions([]);
    });
  }

  const getEmployeesData = () => {
    CommonService.getEmployeeList().then(res => {
      setEmployeesList(res.data.data);
      const options = res.data.data.map(employee => ({
        value: employee.idEmployee,
        label: employee.fullName,
      }));
      setEmployeesListOption(options);
    }).catch(err => {
    });
  }

  const getSalaryHeadData = () => {
    CommonService.getSalaryHeadList().then(res => {
      const salHead = res.data.data;
      const filterred = salHead.filter(el => el.headType === "DEDUCTION");
      setSalaryHeadList(filterred);
    }).catch(err => {
    });
  }

  const getSalaryMonths = () => {
    CommonService.getAllSalaryMonths().then(res => {
      const salMonths = res.data;
      // const filterredFrom = salMonths.slice(0, 12);
      // const filterredTo = salMonths.slice(0, 60);
      // setSalaryMonthsListFrom(filterredFrom);
      // setSalaryMonthsListTo(filterredTo);
      setSalaryMonthsList(salMonths);
    }).catch(err => {
    });
  }

  const setupEdit = (item) => {
    setIsEdit(true);
    setNewData({
      idScheduledSalaryDeduction: item.idScheduledSalaryDeduction,
      idEmployee: item.idEmployee,
      totalAmount: item.totalAmount,
      deductionFromSalaryMonthDate: item.deductionFromSalaryMonthDate,
      deductionToSalaryMonthDate: item.deductionToSalaryMonthDate,
      allocatingSalaryHead: item.allocatingSalaryHead,
      monthCount: item.monthCount,
      monthlyDeductableAmount: item.monthlyDeductableAmount,
    });
    const selected = employeesListOption.find(option => option.value === newData.idEmployee);
    setSelectedEmployee(selected);
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
    setSelectedEmployee(null)
  }

  const handleChange = (selectedOption) => {
    setNewData((prevData) => ({
      ...prevData,
      idEmployee: selectedOption.value
    }));
  };

  const handleMonthFromChange = (e) => {
    const selectedDate = e.target.value;
    const selectedId = (salaryMonthsList.find(el => el.salaryMonthDate == selectedDate)).idSalaryMonth;
    setNewData({
      ...newData,
      deductionFromSalaryMonthDate: selectedDate,
      deductionToSalaryMonthDate: '',
    });
    if (selectedId) {
      const filteredList = salaryMonthsList.filter(
        (el) => el.idSalaryMonth > parseInt(selectedId, 10)
      );

      setFilteredMonthsList(filteredList);
    } else {
      setFilteredMonthsList(salaryMonthsList);
    }
  };

  const handleMonthToChange = (e) => {
    setNewData({
      ...newData,
      deductionToSalaryMonthDate: e.target.value,
    });
  };

  const handlePageChange = (page) => setCurrentPage(page);

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
                    selected={startDate} onChange={(date) => setStartDate(date)} showYearDropdown />
                </div>
                <div className="list_searchbox">
                  <input type="text" className="form-control" placeholder="Search" value={searchText} maxLength={30}
                    onChange={(e) => {
                      setSearchText(e.target.value);
                      if (e.target.value === "") {
                        getScheduledDeductions();
                      }
                    }}
                    onKeyDown={e => e.key === 'Enter' ? getScheduledDeductions() : ''} />
                  <i className="bx bx-search cursor" onClick={() => getScheduledDeductions()}></i>
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
                      <th className="text-end"></th>
                    </tr>
                  </thead>
                  <tbody className="table-border-bottom-0">
                    {paginatedData?.length > 0 ? (
                      paginatedData?.map((item, index) => (
                        <tr>
                          <td>{item?.employeeCode}</td>
                          <td>{item?.employeeName}</td>
                          <td>{item?.designationName}</td>
                          <td>{item?.deductionFromSalaryMonthText}</td>
                          <td>{item?.deductionToSalaryMonthText}</td>
                          <td className="text-center">{item.monthCount}</td>
                          <td className="text-end">{Utils.formattedNumber(item.monthlyDeductableAmount)}</td>
                          <td className="text-end">{Utils.formattedNumber(item.totalAmount)}</td>
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
                            <h6><i className="bx bx-search"></i> No data available!</h6>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="text-end pt-2">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
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

                  <Select
                    options={employeesListOption}
                    isSearchable
                    onChange={handleChange}
                    value={selectedEmployee}
                    placeholder={'Select Employee'}
                    className="textSize" required
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label mb-1">Total Deduction</label>
                  <input className="form-control" type="number" value={newData.totalAmount} min="0" max="999999999999"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d{0,12}$/.test(value)) {
                        setNewData({ ...newData, totalAmount: value });
                      }
                    }} required />
                </div>
                <div className="mb-2">
                  <label className="form-label mb-1">Salary Month From</label>

                  <select
                    className="form-select"
                    value={newData.deductionFromSalaryMonthDate}
                    onChange={handleMonthFromChange}
                    required
                  >
                    <option value={''}>Select</option>
                    {salaryMonthsList.map((el) => (
                      <option value={el.salaryMonthDate} key={el.salaryMonthDate}>
                        {el.salaryMonthText}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label mb-1">Salary Month To</label>

                  <select
                    className="form-select"
                    value={newData.deductionToSalaryMonthDate}
                    onChange={handleMonthToChange}
                    required
                  >
                    <option value={''}>Select</option>
                    {filteredMonthsList.map((el) => (
                      <option value={el.salaryMonthDate} key={el.salaryMonthDate}>
                        {el.salaryMonthText}
                      </option>
                    ))}
                  </select>
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
                    value={newData.monthlyDeductableAmount.toFixed(2)}
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
