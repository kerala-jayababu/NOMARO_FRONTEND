import React, { useEffect, useMemo, useState } from 'react';
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
import Pagination from '../../components/pagination';
import { NumericFormat } from "react-number-format";

function ViewPaySlips() {
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
    amount: null,
    remarks: ""
  });
  const [validated, setValidated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(salaryAdjustments.length / rowsPerPage);

  useEffect(() => {

  }, []);

  useEffect(() => {
  }, [startDate]);

  const handlePageChange = (page) => setCurrentPage(page);

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">List of Salary Adjustments</h5>

              <div className="list_menu">
                <div className="list_searchbox">
                  <label className='p-2'>From Date</label>
                  <DatePicker className="form-control" dateFormat="MM/dd/yyyy" placeholderText={'Start Date'}
                    selected={startDate} onChange={(date) => setStartDate(date)} showMonthDropdown
                    showYearDropdown dropdownMode="select" />

                </div>
                <div className="list_searchbox">
                  <input type="text" className="form-control" placeholder="Search" value={searchText} maxLength={30}
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
                      {/* <th>Designation</th> */}
                      <th>Date</th>
                      <th>Type</th>
                      <th>Taxable </th>
                      <th>Salary Month</th>
                      <th>Salary Head</th>
                      <th className="text-end">Amount</th>
                      {/* <th>Remarks</th> */}
                      <th className="text-end"></th>
                    </tr>
                  </thead>
                  <tbody className="table-border-bottom-0">
                    {paginatedData?.length > 0 ? (
                      paginatedData?.map((item, index) => (
                        <tr>
                          <td>{item?.employeeCode}</td>
                          <td>{item?.employeeName}</td>
                          <td>{item?.departmentName}</td>
                          {/* <td>{item?.designationName}</td> */}
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

        
      </div >
    </div >

  )
}

export default ViewPaySlips