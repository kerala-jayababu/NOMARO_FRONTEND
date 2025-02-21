import React, { useEffect, useState } from 'react';
import SalaryAdjustmentService from '../../core/services/SalaryAdjustmentService';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import CommonService from '../../core/services/CommonService';
import { Button, Form, Modal } from 'react-bootstrap';
import { toast } from "react-toastify";
import Utils from '../../utils/Utils';
// import DatePicker from '../../components/datePicker';
import Select from 'react-select';

function SalaryAdjustments() {
  const [employeesList, setEmployeesList] = useState([]);
  const [employeesListOption, setEmployeesListOption] = useState([]);
  const [salaryHeadList, setSalaryHeadList] = useState([]);
  const [salaryHeadListToShow, setSalaryHeadListToShow] = useState([]);
  const [empDescDept, setEmpDescDept] = useState('');
  const [salaryAdjustments, setSalaryAdjustments] = useState([]);
  const [salaryMonthsList, setSalaryMonthsList] = useState([]);
  const [startDate, setStartDate] = useState(new Date('01-01-2025'));
  const [searchText, setSearchText] = useState('');
  const [newData, setNewData] = useState({
    idSalaryAdjustment: 0,
    idEmployee: 0,
    idDepartment: 0,
    idDesignation: 0,
    payAdjustmentDate: "",
    payAdjustmentDetails: "",
    allocatingSalaryHead: 0,
    earningOrDeduction: "",
    allocatingSalaryMonth: 0,
    isTaxable: "",
    amount: 0,
    remarks: ""
  });
  const [validated, setValidated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    getEmployeesData();
    getSalaryHeadData();
    getSalaryMonths();
  }, []);

  useEffect(() => {
    getSalaryAdjustments();
  }, [startDate]);

  useEffect(() => {
    if (newData.idEmployee == 0 || newData.idEmployee == "") {
      setNewData((prevData) => ({
        ...prevData,
        idDepartment: "",
        idDesignation: "",
      }));
      return;
    }
    console.log(newData.idEmployee);
    const empDetails = employeesList.find(emp => emp.idEmployee == newData.idEmployee);
    setNewData((prevData) => ({
      ...prevData,
      idDepartment: empDetails.idDepartment,
      idDesignation: empDetails.idDesignation,
    }));
    setEmpDescDept(empDetails.department + ', ' + empDetails.designation);
    const selected = employeesListOption.find(option => option.value === newData.idEmployee);
    setSelectedEmployee(selected);
  }, [newData.idEmployee]);

  useEffect(() => {
    if (newData.earningOrDeduction == "") return;
    const salHead = salaryHeadList.filter(sal => sal.headType == (newData.earningOrDeduction == 'E' ? 'EARNING' : 'DEDUCTION'));
    setSalaryHeadListToShow(salHead);
  }, [newData.earningOrDeduction]);

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
      setSalaryHeadList(res.data.data);
    }).catch(err => {
    });
  }

  const getSalaryMonths = () => {
    CommonService.getAllSalaryMonths().then(res => {
      const salMonths = res.data;
      const filterred = salMonths.slice(0, 12);
      setSalaryMonthsList(filterred);
    }).catch(err => {
    });
  }

  const getSalaryAdjustments = () => {
    const date = moment(startDate).format("YYYY-MM-DD");
    SalaryAdjustmentService.getSalaryAdjustmentsData(date, searchText).then(res => {
      setSalaryAdjustments(res.data.data);
    }).catch(err => {
      setSalaryAdjustments([]);
    });
  }

  const setupEdit = (item) => {
    setIsEdit(true);
    setNewData({
      idSalaryAdjustment: item.idSalaryAdjustment,
      idEmployee: item.idEmployee,
      idDepartment: item.idDepartment,
      idDesignation: item.idDesignation,
      payAdjustmentDate: item.payAdjustmentDate,
      payAdjustmentDetails: item.payAdjustmentDetails,
      allocatingSalaryHead: item.allocatingSalaryHead,
      earningOrDeduction: item.earningOrDeduction,
      allocatingSalaryMonth: item.allocatingSalaryMonth,
      isTaxable: item.isTaxable == true ? 'Yes' : 'No',
      amount: item.amount,
      remarks: item.remarks,
    });
    const selected = employeesListOption.find(option => option.value === newData.idEmployee);
    setSelectedEmployee(selected);
    setShowModal(true);
  }

  const saveSalaryAdjustments = (e) => {
    e.preventDefault();
    if (!newData.idEmployee || !newData.allocatingSalaryMonth) {
      setValidated(true);
      return;
    }
    let passData = newData;
    passData['isTaxable'] = passData['isTaxable'] == 'Yes' ? true : false;
    SalaryAdjustmentService.saveSalaryAdjustmentsData(passData).then(res => {
      if (res.data.status === 200) {
        toast.success('Salary adjustments added successfully', {
          position: 'top-right',
          autoClose: 2000
        });
        getSalaryAdjustments();
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

  const updateSalaryAdjustments = (e) => {
    e.preventDefault();
    if (!newData.idEmployee || !newData.allocatingSalaryMonth) {
      setValidated(true);
      return;
    }
    let passData = newData;
    passData['isTaxable'] = passData['isTaxable'] == 'Yes' ? true : false;
    SalaryAdjustmentService.updateSalaryAdjustmentsData(passData).then(res => {
      if (res.data.status === 200) {
        toast.success('Salary adjustments updated successfully', {
          position: 'top-right',
          autoClose: 2000
        });
        getSalaryAdjustments();
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
    setEmpDescDept('')
    setNewData({
      idSalaryAdjustment: 0,
      idEmployee: 0,
      idDepartment: 0,
      idDesignation: 0,
      payAdjustmentDate: "",
      payAdjustmentDetails: "",
      allocatingSalaryHead: 0,
      earningOrDeduction: "",
      allocatingSalaryMonth: 0,
      isTaxable: "",
      amount: 0,
      remarks: ""
    });
    setSelectedEmployee(null)
  }

  const handleChange = (selectedOption) => {
    setNewData((prevData) => ({
      ...prevData,
      idEmployee: selectedOption.value
    }));
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">List of Salary Adjustments</h5>

              <div className="list_menu">
                <div className="list_searchbox">
                  <DatePicker className="form-control" dateFormat="MM/dd/yyyy" placeholderText={'Start Date'}
                    selected={startDate} onChange={(date) => setStartDate(date)} />
                  {/* <DatePicker
                    id="startDate"
                    name="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  /> */}
                </div>
                <div className="list_searchbox">
                  <input type="text" className="form-control" placeholder="Search" value={searchText}
                    onChange={(e) => {
                      setSearchText(e.target.value);
                      if (e.target.value === "") {
                        getSalaryAdjustments();
                      }
                    }}
                    onKeyDown={e => e.key === 'Enter' ? getSalaryAdjustments() : ''} />
                  <i className="bx bx-search cursor" onClick={() => getSalaryAdjustments()}></i>
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
                      <th>Department</th>
                      <th>Designation</th>
                      <th>Adjustment Date</th>
                      <th>Adjustment Type</th>
                      <th>Taxable </th>
                      <th>Allocating Salary Month</th>
                      <th>Allocating Salary Head</th>
                      <th className="text-end">Amount</th>
                      {/* <th>Remarks</th> */}
                      <th className="text-end"></th>
                    </tr>
                  </thead>
                  <tbody className="table-border-bottom-0">
                    {salaryAdjustments?.length > 0 ? (
                      salaryAdjustments?.map((item, index) => (
                        <tr>
                          <td>{item?.employeeCode}</td>
                          <td>{item?.employeeName}</td>
                          <td>{item?.departmentName}</td>
                          <td>{item?.designationName}</td>
                          <td>{moment(item?.payAdjustmentDate).format("MM/DD/YYYY")}</td>
                          <td>{item.earningOrDeduction === 'E' ? 'Earnings' : 'Deductions'}</td>
                          <td>{item?.isTaxable ? 'Yes' : 'No'}</td>
                          <td>{item?.allocatingSalaryMonthText}</td>
                          <td>{item?.allcoatingSalaryHeadName}</td>
                          <td className="text-end">{Utils.formattedNumber(item?.amount)}</td>
                          {/* <td>{item?.remarks}</td> */}
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
            </div>
          </div>
        </div>

        <Modal
          show={showModal} onHide={() => { setShowModal(false); resetValues() }} size='lg'
          aria-labelledby="contained-modal-title-vcenter"
          centered backdrop="static"
          keyboard={false}>
          <Modal.Header closeButton>
            <Modal.Title>
              <h5>Add/Update Salary Adjustment</h5>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div className="accountDetail_card">
              <Form noValidate validated={validated}>
                <div className="row m-0">
                  <div className="col-md-6 p-2">
                    <label className="form-label mb-1">Employee Name</label>
                    {/* <select className="form-select" value={newData.idEmployee}
                      onChange={(e) => setNewData({ ...newData, idEmployee: e.target.value })} required>
                      <option value={''}>Select</option>
                      {
                        employeesList?.map((el) => (
                          <option value={el.idEmployee} key={el.idEmployee}>{el.fullName}</option>
                        ))
                      }
                    </select> */}
                    <Select
                      options={employeesListOption}
                      isSearchable
                      onChange={handleChange} 
                      value={selectedEmployee}
                      placeholder={'Select Employee'}
                    />
                  </div>

                  {/* <div className="col-md-6 p-2">
                    <label className="form-label mb-1">Department</label>
                    <select className="form-select" value={newData.idDepartment}
                      onChange={(e) => setNewData({ ...newData, idDepartment: e.target.value })} required disabled>
                      <option value={''}></option>
                      {
                        departmentsList?.map((el) => (
                          <option value={el.idDepartment} key={el.idDepartment}>{el.departmentName}</option>
                        ))
                      }
                    </select>
                  </div>

                  <div className="col-md-6 p-2">
                    <label className="form-label mb-1">Designation</label>
                    <select className="form-select" value={newData.idDesignation}
                      onChange={(e) => setNewData({ ...newData, idDesignation: e.target.value })} required disabled>
                      <option value={''}></option>
                      {
                        designationsList?.map((el) => (
                          <option value={el.idDesignation} key={el.idDesignation}>{el.designationName}</option>
                        ))
                      }
                    </select>
                  </div> */}
                  <div className="col-md-6 p-2">
                    <label className="form-label mb-1">Department, Designation</label>
                    <input className='form-control' value={empDescDept} disabled />
                  </div>

                  <div className="col-md-6 p-2">
                    <label className="form-label mb-1">Salary Adjustment Date</label>
                    <div className="row m-0">
                      <div className="col-md-12 ps-0 pe-2">
                        <DatePicker className="form-control" selected={newData.payAdjustmentDate}
                          onChange={(date) => setNewData({ ...newData, payAdjustmentDate: date })}
                          required wrapperClassName="datePicker"
                          dateFormat="MM/dd/yyyy"
                          placeholderText='Select Date' />
                        {/* <DatePicker
                          id="payAdjustmentDate"
                          name="payAdjustmentDate"
                          value={newData.payAdjustmentDate}
                          onChange={(e) => setNewData({ ...newData, payAdjustmentDate: e.target.value })}
                          required
                        /> */}
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6 p-2">
                    <label className="form-label mb-1">Salary Adjustment Details</label>
                    <input type="text" className="form-control" value={newData.payAdjustmentDetails}
                      onChange={(e) => setNewData({ ...newData, payAdjustmentDetails: e.target.value })}
                      required placeholder='Add Details' />
                  </div>

                  <div className="col-md-6 p-2">
                    <div>
                      <label className="form-label mb-1">Salary Adjustment Type</label>
                    </div>
                    <div className="form-check form-check-inline ">
                      <input className="form-check-input" type="radio" name="inlineRadioOptions" id="inlineRadio1"
                        value={'E'} checked={newData.earningOrDeduction === 'E' ? "checked" : ""}
                        onChange={(e) => setNewData({ ...newData, earningOrDeduction: e.target.value })} required />
                      <label className="form-check-label" for="inlineRadio1">Earning</label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input className="form-check-input" type="radio" name="inlineRadioOptions" id="inlineRadio2"
                        value={'D'} checked={newData.earningOrDeduction === 'D' ? "checked" : ""}
                        onChange={(e) => setNewData({ ...newData, earningOrDeduction: e.target.value })} required />
                      <label className="form-check-label" for="inlineRadio2"> Deduction </label>
                    </div>
                  </div>

                  <div className="col-md-6 p-2">
                    <div>
                      <label className="form-label mb-1">Taxable </label>
                    </div>
                    <div className="form-check form-check-inline ">
                      <input className="form-check-input" type="radio" name="Taxable" id="Taxable1"
                        value={'Yes'} checked={newData.isTaxable === 'Yes' ? "checked" : ""}
                        onChange={(e) => setNewData({ ...newData, isTaxable: e.target.value })} required />
                      <label className="form-check-label" for="Taxable1">Yes</label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input className="form-check-input" type="radio" name="Taxable" id="Taxable2"
                        value={'No'} checked={newData.isTaxable === 'No' ? "checked" : ""}
                        onChange={(e) => setNewData({ ...newData, isTaxable: e.target.value })} required />
                      <label className="form-check-label" for="Taxable2"> No </label>
                    </div>
                  </div>

                  <div className="col-md-6 p-2">
                    <label className="form-label mb-1">Allocating Salary Month</label>
                    <select className="form-select" value={newData.allocatingSalaryMonth}
                      onChange={(e) => setNewData({ ...newData, allocatingSalaryMonth: e.target.value })}
                      required>
                      <option value={''}>Select</option>
                      {
                        salaryMonthsList?.map((el) => (
                          <option value={el.idSalaryMonth} key={el.idSalaryMonth}>{el.salaryMonthText}</option>
                        ))
                      }
                    </select>
                  </div>
                  <div className="col-md-6 p-2">
                    <label className="form-label mb-1">Allocating Salary Head</label>
                    <select className="form-select" value={newData.allocatingSalaryHead}
                      onChange={(e) => setNewData({ ...newData, allocatingSalaryHead: e.target.value })} required>
                      <option value={''}>Select</option>
                      {
                        salaryHeadListToShow?.map((el) => (
                          <option value={el.idSalaryHead} key={el.idSalaryHead}>{el.salaryHeadName}</option>
                        ))
                      }
                    </select>
                  </div>
                  <div className="col-md-6 p-2">
                    <label className="form-label mb-1">Amount</label>
                    <input className="form-control" type="number" value={newData.amount}
                      onChange={(e) => setNewData({ ...newData, amount: e.target.value })}
                      required placeholder='Add amount' />
                  </div>

                  <div className="col-md-12 p-2">
                    <label className="form-label mb-1">Remarks</label>
                    <textarea className="form-control" rows="4" maxlength="100" value={newData.remarks}
                      onChange={(e) => setNewData({ ...newData, remarks: e.target.value })}
                      required placeholder='Add remarks here'></textarea>
                    <small>{100 - newData.remarks.length} / 100 characters remaining</small>
                  </div>
                </div>
              </Form>
            </div>
            <div className="modal-footer">
              {
                isEdit &&
                <button className="btn btn-primary btn-sm py-2 px-4 me-2" onClick={(e) => updateSalaryAdjustments(e)}>Update</button>
              }
              {
                !isEdit &&
                <button className="btn btn-primary btn-sm py-2 px-4 me-2" onClick={(e) => saveSalaryAdjustments(e)}>Submit</button>
              }
              <button className="btn btn-outline-secondary  btn-sm py-2 px-4" onClick={() => resetValues()}>Reset</button>
            </div>
          </Modal.Body>
        </Modal >
      </div >
    </div >

  )
}

export default SalaryAdjustments