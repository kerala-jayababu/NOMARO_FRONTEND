import React, { useEffect, useMemo, useState } from 'react';
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
import ViewPaySlipService from '../../core/services/ViewPaySlipService';

function ViewPaySlips() {
  const [salarySlips, setSalarySlips] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const totalPages = Math.ceil(salarySlips.length / rowsPerPage);
  const [startDate, setStartDate] = useState(new Date('01-01-2025'));
  const [searchText, setSearchText] = useState('');
  const [fromMonth, setFromMonth] = useState('');
  const [toMonth, setToMonth] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [salaryMonthsList, setSalaryMonthsList] = useState([]);
  const [filteredMonthsList, setFilteredMonthsList] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);

  useEffect(() => {
    getEmployeesData();
    getSalaryMonths();
  }, []);

  useEffect(() => {
    if (fromMonth != '' && toMonth != '') {
      getSalarySlips();
    }
  }, [fromMonth, toMonth]);

  const getSalarySlips = () => {
    ViewPaySlipService.getSalarySlipsData(fromMonth, toMonth, searchText).then(res => {
      setSalarySlips(res.data.data);
    }).catch(err => {
      setSalarySlips([]);
    });
  }

  const downloadSalarySlips = (data) => {
    ViewPaySlipService.downloadSalarySlips(data.idEmployeeSalary).then(res => {
      downloadFile(res.data.data[0]);
    }).catch(err => {

    });
  }

  const downloadMultipleSalarySlips = () => {
    const ids = selectedRows;
    const result = ids.join(",");
    ViewPaySlipService.downloadSalarySlips(result).then(res => {
      downloadFile(res.data.data[0]);
    }).catch(err => {

    });
  }

  const getSalaryMonths = () => {
    CommonService.getAllSalaryMonths().then(res => {
      setSalaryMonthsList(res.data);
      setFilteredMonthsList(res.data);
    }).catch(err => {
    });
  };


  const getEmployeesData = () => {
    CommonService.getEmployeeList().then(res => {
      res.data.data.sort((a, b) => a.fullName - b.fullName);
      setEmployeesList(res.data.data);
    }).catch(err => {
    });
  };

  const handleMonthFromChange = (e) => {
    const selectedId = e.target.value;

    setFromMonth(selectedId);

    if (selectedId) {
      const filteredList = salaryMonthsList.filter(
        (el) => el.idSalaryMonth >= parseInt(selectedId, 10)
      );
      setFilteredMonthsList(filteredList);
    } else {
      setFilteredMonthsList(salaryMonthsList);
    }
  };

  const handleMonthToChange = (e) => {
    const selectedId = e.target.value;
    setToMonth(selectedId);
  };


  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return salarySlips.slice(startIndex, endIndex);
  }, [salarySlips, currentPage, rowsPerPage]);

  const validPaySlips = salarySlips.filter(slip => slip.employeeCode);

  const handlePageChange = (page) => setCurrentPage(page);

  const handleRowSelect = (idEmployeeSalary) => {
    if (selectedRows.includes(idEmployeeSalary)) {
      setSelectedRows(selectedRows.filter(code => code !== idEmployeeSalary));
    } else {
      setSelectedRows([...selectedRows, idEmployeeSalary]);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allEmployeeSalIds = validPaySlips.map(slip => slip.idEmployeeSalary);
      setSelectedRows(allEmployeeSalIds);
    } else {
      setSelectedRows([]);
    }
  };

  const isAllSelected = validPaySlips.length > 0 && selectedRows.length === validPaySlips.length;

  const downloadFile = (item) => {
    const base64Data = item.fileContent;
    const fileName = item.fileName || 'downloaded-file';

    // Convert Base64 to Blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/octet-stream' });

    // Create a download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName); // Set the file name
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">List of Salary Slips</h5>

              <div className="list_menu">
                <div className="list_searchbox">
                  {/* <label>Salary Month From</label> */}
                  <select
                    className="form-select"
                    value={fromMonth}
                    onChange={handleMonthFromChange}
                    required
                  >
                    <option value={''}>Select From</option>
                    {salaryMonthsList.map((el) => (
                      <option value={el.idSalaryMonth} key={el.idSalaryMonth}>
                        {el.salaryMonthText}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="list_searchbox">
                  {/* <label>Salary Month To</label> */}
                  <select
                    className="form-select"
                    value={toMonth}
                    onChange={handleMonthToChange}
                    required
                  >
                    <option value={''}>Select To</option>
                    {filteredMonthsList.map((el) => (
                      <option value={el.idSalaryMonth} key={el.idSalaryMonth}>
                        {el.salaryMonthText}
                      </option>
                    ))}
                  </select>
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
                            {slip.idEmployeeSalary ? (
                              <input
                                type="checkbox"
                                checked={selectedRows.includes(slip.idEmployeeSalary)}
                                onChange={() => handleRowSelect(slip.idEmployeeSalary)}
                              />
                            ) : (
                              <input type="checkbox" disabled />
                            )}
                          </td>
                          <td>{slip.salaryMonthText}</td>
                          <td>{slip.employeeCode}</td>
                          <td>{slip.employeeName || '-'}</td>
                          <td>{slip.designationName || '-'}</td>
                          <td>{slip.departmentName || '-'}</td>
                          <td>{slip.emailStatus}</td>
                          <td>
                            <button type="button" className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
                              onClick={() => downloadSalarySlips(slip)}>
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
                  disabled={selectedRows.length === 0} onClick={() => downloadMultipleSalarySlips()}>
                  Download selected
                </button>
                {/* <button className="btn btn-primary btn-sm px-4"
                  disabled={selectedRows.length === 0}>
                  Send notification – Selected employees
                </button> */}
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