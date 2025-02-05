import React, { useContext, useEffect, useState } from 'react';
import SalaryAdjustmentService from '../../core/services/SalaryAdjustmentService';
import { EarningsOrDeductions, Months } from '../../core/constants/commons';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import CommonService from '../../core/services/CommonService';
import { Button, Form } from 'react-bootstrap';

function SalaryAdjustments() {
  const [employeesList, setEmployeesList] = useState([]);
  const [departmentsList, setDepartmentsListList] = useState([]);
  const [designationsList, setDesignationsListList] = useState([]);
  const [salaryHeadList, setSalaryHeadListList] = useState([]);
  const [salaryAdjustments, setSalaryAdjustments] = useState([]);
  const [showAddSalaryAdjustments, setShowAddSalaryAdjustments] = useState(false);
  const [newData, setNewData] = useState({
    idSalaryAdjustment: 0,
    idEmployee: 0,
    payAdjustmentDate: "",
    payAdjustmentDetails: "",
    allocatingSalaryHead: 0,
    earningOrDeduction: "",
    allocatingSalaryMonth: 0,
    amount: 0,
    remarks: ""
  });
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    getEmployeesData();
    getDepartmentsData();
    getDesignationsData();
    getSalaryHeadData();
    getSalaryAdjustments();
  }, []);

  const getEmployeesData = () => {
    CommonService.getEmployeeList().then(res => {
      setEmployeesList(res.data.data);
    }).catch(err => {
    });
  }

  const getDepartmentsData = () => {
    CommonService.getDepartmentsList().then(res => {
      setDepartmentsListList(res.data.data);
    }).catch(err => {
    });
  }

  const getDesignationsData = () => {
    CommonService.getDesignationsList().then(res => {
      setDesignationsListList(res.data.data);
    }).catch(err => {
    });
  }

  const getSalaryHeadData = () => {
    CommonService.getSalaryHeadList().then(res => {
      setSalaryHeadListList(res.data.data);
    }).catch(err => {
    });
  }

  const getSalaryAdjustments = () => {
    SalaryAdjustmentService.getSalaryAdjustmentsData().then(res => {
      setSalaryAdjustments(res.data.data);
    }).catch(err => {
    });
  }

  const employeeDataFetch = (id, field) => {
    const empData = employeesList.find(x => x.idEmployee === id);
    switch (field) {
      case 'empCode':
        return empData?.employeeCode;
      case 'empName':
        return empData?.fullName;
      case 'empDepartment':
        return empData?.department;
      case 'empDesignation':
        return empData?.designation;
      default:
        return 'NA';
    }
  }

  const salaryHeadDataFetch = (id) => {
    const salaryHeadData = salaryHeadList.find(x => x.idSalaryHead === id);
    return salaryHeadData?.salaryHeadName ?? 'NA'
  }

  const saveSalaryAdjustments = (e) => {
    e.preventDefault();
    if (!newData.idEmployee || !newData.allocatingSalaryMonth) {
      setValidated(true);
      return;
    }
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">List of Salary Adjustments</h5>
              <button className="btn btn-primary btn-sm px-4" data-bs-toggle="modal"
                data-bs-target="#Add_PayAdjustments">Add</button>
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
                      <th className="text-center">Adjustment Date</th>
                      <th className="text-center">Adjustment Type</th>
                      <th className="text-center">Taxable </th>
                      <th className="text-center">Allocating Salary Month</th>
                      <th className="text-center">Allocating Salary Head</th>
                      <th className="text-end">Amount</th>
                      <th>Remarks</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody className="table-border-bottom-0">
                    {salaryAdjustments?.length > 0 ? (
                      salaryAdjustments?.map((item, index) => (
                        <tr>
                          <th>{employeeDataFetch(item.idEmployee, 'empCode')}</th>
                          <td>{employeeDataFetch(item.idEmployee, 'empName')}</td>
                          <td>{employeeDataFetch(item.idEmployee, 'empDepartment')}</td>
                          <td>{employeeDataFetch(item.idEmployee, 'empDesignation')}</td>
                          <td className="text-center">{moment(item?.payAdjustmentDate).format("MMM DD, YYYY")}</td>
                          <td className="text-center">{item.earningOrDeduction === 'E' ? 'EARNINGS' : 'Deductions'}</td>
                          <td className="text-center">NA</td>
                          <td className="text-center">{item.allocatingSalaryMonth}</td>
                          <td className="text-center">{salaryHeadDataFetch(item.allocatingSalaryHead)}</td>
                          <td className="text-end">{item.amount}</td>
                          <td>{item.remarks}</td>
                          <td className="text-end">
                            <button type="button" className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0">
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
        <div className="modal fade" id="Add_PayAdjustments" tabindex="-1" aria-hidden="true">
          <div className="modal-dialog modal-lg  modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="modalCenterTitle">Add/Update Salary Adjustment</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body  accountDetail_card">
                <Form noValidate validated={validated}>
                  <div className="row m-0">
                    <div className="col-md-6 p-2">
                      <label className="form-label mb-1">Employee Name</label>
                      <select className="form-select" required>
                        {
                          employeesList?.map((el) => (
                            <option value={el.idEmployee} key={el.idEmployee}>{el.fullName}</option>
                          ))
                        }
                      </select>
                    </div>

                    <div className="col-md-6 p-2">
                      <label className="form-label mb-1">Department</label>
                      <select className="form-select">
                        {
                          departmentsList?.map((el) => (
                            <option value={el.idDepartment} key={el.idDepartment}>{el.departmentName}</option>
                          ))
                        }
                      </select>
                    </div>

                    <div className="col-md-6 p-2">
                      <label className="form-label mb-1">Designation</label>
                      <select className="form-select">
                        {
                          designationsList?.map((el) => (
                            <option value={el.idDesignation} key={el.idDesignation}>{el.designationName}</option>
                          ))
                        }
                      </select>
                    </div>

                    <div className="col-md-6 p-2">
                      <label className="form-label mb-1">Pay Adjustment Date</label>
                      <DatePicker className="form-control" dateFormat="dd/MM/yyyy" />
                    </div>

                    <div className="col-md-6 p-2">
                      <div>
                        <label className="form-label mb-1">Pay Adjustment Type</label>
                      </div>
                      <div className="form-check form-check-inline ">
                        <input className="form-check-input" type="radio" name="inlineRadioOptions" id="inlineRadio1"
                          value="option1" />
                        <label className="form-check-label" for="inlineRadio1">Earning</label>
                      </div>
                      <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name="inlineRadioOptions" id="inlineRadio2"
                          value="option2" />
                        <label className="form-check-label" for="inlineRadio2"> Deduction </label>
                      </div>
                    </div>

                    <div className="col-md-6 p-2">
                      <div>
                        <label className="form-label mb-1">Taxable </label>
                      </div>
                      <div className="form-check form-check-inline ">
                        <input className="form-check-input" type="radio" name="Taxable" id="Taxable1"
                          value="option1" />
                        <label className="form-check-label" for="Taxable1">Yes</label>
                      </div>
                      <div className="form-check form-check-inline">
                        <input className="form-check-input" type="radio" name="Taxable" id="Taxable2"
                          value="option2" />
                        <label className="form-check-label" for="Taxable2"> No </label>
                      </div>
                    </div>

                    <div className="col-md-6 p-2">
                      <label className="form-label mb-1">Allocating Salary Month</label>
                      <input className="form-control" type="month" maxlength="12" value="January-2025" required/>
                    </div>
                    <div className="col-md-6 p-2">
                      <label className="form-label mb-1">Allocating Salary Head</label>
                      <select className="form-select">
                        {
                          salaryHeadList?.map((el) => (
                            <option value={el.idSalaryHead} key={el.idSalaryHead}>{el.salaryHeadName}</option>
                          ))
                        }
                      </select>
                    </div>
                    <div className="col-md-6 p-2">
                      <label className="form-label mb-1">Amount</label>
                      <input className="form-control" type="number" />
                    </div>
                    <div className="col-md-12 p-2">
                      <label className="form-label mb-1">Remarks</label>
                      <textarea className="form-control" rows="4" maxlength="500"></textarea>
                    </div>
                  </div>
                </Form>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary btn-sm py-2 px-4 me-2" onClick={(e) => saveSalaryAdjustments(e)}>Submit</button>
                <button className="btn btn-outline-secondary  btn-sm py-2 px-4"
                  data-bs-dismiss="modal">Reset</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SalaryAdjustments