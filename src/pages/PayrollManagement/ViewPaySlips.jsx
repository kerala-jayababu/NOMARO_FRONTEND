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
  const [salarySlips, setSalarySlips] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const totalPages = Math.ceil(salarySlips.length / rowsPerPage);
  const [startDate, setStartDate] = useState(new Date('01-01-2025'));
  const [searchText, setSearchText] = useState('');
  const [fromMonth, setFromMonth] = useState('January, 2025');
  const [toMonth, setToMonth] = useState('January, 2025');
  const [selectedRows, setSelectedRows] = useState([]);

  useEffect(() => {
    getSalarySlips();
  }, [startDate]);

  const getSalarySlips = () => {

  }

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return salarySlips.slice(startIndex, endIndex);
  }, [salarySlips, currentPage, rowsPerPage]);

  const validPaySlips = salarySlips.filter(slip => slip.employeeCode);

  const handlePageChange = (page) => setCurrentPage(page);

  const handleRowSelect = (employeeCode) => {
    if (selectedRows.includes(employeeCode)) {
      setSelectedRows(selectedRows.filter(code => code !== employeeCode));
    } else {
      setSelectedRows([...selectedRows, employeeCode]);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allEmployeeCodes = validPaySlips.map(slip => slip.employeeCode);
      setSelectedRows(allEmployeeCodes);
    } else {
      setSelectedRows([]);
    }
  };

  const isAllSelected = validPaySlips.length > 0 && selectedRows.length === validPaySlips.length;

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">View/Download Pay Slips</h5>

              <div className="list_menu">
                <div className="list_searchbox">
                  {/* <label>Salary Month From</label> */}
                  <input
                    className="form-control"
                    type="text"
                    value={fromMonth}
                    onChange={(e) => setFromMonth(e.target.value)}
                  />
                </div>
                <div className="list_searchbox">
                  {/* <label>Salary Month To</label> */}
                  <input
                    className="form-control"
                    type="text"
                    value={toMonth}
                    onChange={(e) => setToMonth(e.target.value)}
                  />
                </div>
                <div className="list_searchbox">
                  <input type="text" className="form-control" placeholder="Search" value={searchText} maxLength={30}
                    onChange={(e) => {
                      setSearchText(e.target.value);
                      if (e.target.value === "") {
                        getSalarySlips();
                      }
                    }}
                    onKeyDown={e => e.key === 'Enter' ? getSalarySlips() : ''} />
                  <i className="bx bx-search cursor" onClick={() => getSalarySlips()}></i>
                </div>
              </div>

            </div>
            <div className="card-body">
              <div className="table-responsive text-nowrap">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={handleSelectAll}
                          disabled={validPaySlips.length === 0}
                        />
                      </th>
                      <th>Salary Month</th>
                      <th>Employee Code</th>
                      <th>Employee Name</th>
                      <th>Designation</th>
                      <th>Department</th>
                      <th>Email Status</th>
                      <th>Download</th>
                    </tr>
                  </thead>
                  <tbody className="table-border-bottom-0">
                    {paginatedData?.length > 0 ? (
                      paginatedData?.map((slip, index) => (
                        <tr key={index}>
                          <td>
                            {slip.employeeCode ? (
                              <input
                                type="checkbox"
                                checked={selectedRows.includes(slip.employeeCode)}
                                onChange={() => handleRowSelect(slip.employeeCode)}
                              />
                            ) : (
                              <input type="checkbox" disabled />
                            )}
                          </td>
                          <td>{slip.salaryMonth}</td>
                          <td>{slip.employeeCode}</td>
                          <td>{slip.employeeName || '-'}</td>
                          <td>{slip.designation || '-'}</td>
                          <td>{slip.department || '-'}</td>
                          <td>{slip.emailStatus}</td>
                          <td>
                            <button type="button" className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0">
                              <span className="tf-icons bx bx-download"></span>
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
              <div className="text-center">
                <button className="btn btn-primary btn-sm px-4"
                  disabled={selectedRows.length === 0}>
                  Download selected
                </button>&nbsp;&nbsp;
                <button className="btn btn-primary btn-sm px-4"
                  disabled={selectedRows.length === 0}>
                  Send notification – Selected employees
                </button>
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