import React, { useEffect, useMemo, useState } from 'react';
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import CommonService from '../../core/services/CommonService';
import { Button, Form, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { toast } from "react-toastify";
import Utils from '../../utils/Utils';
// import DatePicker from '../../components/datePicker';
import Select from 'react-select';
import Pagination from '../../components/pagination';
import { NumericFormat } from "react-number-format";
import ViewPaySlipService from '../../core/services/ViewPaySlipService';
import ConfirmationModal from '../../components/ConfirmationModal';
import 'bootstrap-icons/font/bootstrap-icons.min.css';

function ViewPaySlips() {
  const [salarySlips, setSalarySlips] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(1000);
  const [filteredData, setFilteredData] = useState(salarySlips);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const [startDate, setStartDate] = useState(new Date('01-01-2025'));
  const [searchText, setSearchText] = useState('');
  const [fromMonth, setFromMonth] = useState('');
  const [toMonth, setToMonth] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [salaryMonthsList, setSalaryMonthsList] = useState([]);
  const [filteredMonthsList, setFilteredMonthsList] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  useEffect(() => {
    getEmployeesData();
    getSalaryMonths();
  }, []);

  useEffect(() => {
    if (fromMonth != '' && toMonth != '') {
      getSalarySlips();
    }
  }, [fromMonth, toMonth]);

  useEffect(() => {
    let filtered = salarySlips;
    if (selectedStatus !== 'ALL') {
      if (selectedStatus === 'NOT INITIATED') {
        filtered = salarySlips.filter(emp => emp.emailStatus === "");
      } else {
        filtered = salarySlips.filter(emp => emp.emailStatus === selectedStatus);
      }
    }
    setFilteredData(filtered);
    setSelectedRows([]);
  }, [selectedStatus, salarySlips]);

  const getSalarySlips = () => {
    setLoading(true);
    ViewPaySlipService.getSalarySlipsData(fromMonth, toMonth, searchText).then(res => {
      setSalarySlips(res.data.data);
      setSelectedRows([]);
      setLoading(false);
    }).catch(err => {
      setSalarySlips([]);
      setLoading(false);
    });
  }

  const downloadSalarySlips = (data) => {
    ViewPaySlipService.downloadSalarySlips(data.idEmployeeSalary).then(res => {
      if (!res.data.data || !(res.data.data instanceof Blob)) {
        throw new Error("Invalid file data received");
      }

      const blob = new Blob([res.data.data], { type: res.data.headers['content-type'] });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const defaultName = `${data.employeeCode}_${data.employeeName}_${data.salaryMonthText}.pdf`;
      link.download = res.data.headers['content-disposition']
        ? res.headers['content-disposition'].split('filename=')[1].replace(/"/g, '')
        : defaultName;

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

    }).catch(err => {

    });
  }

  const downloadMultipleSalarySlips = () => {
    const ids = selectedRows;
    const result = ids.join(",");
    ViewPaySlipService.downloadSalarySlips(result).then(res => {
      if (!res.data.data || !(res.data.data instanceof Blob)) {
        throw new Error("Invalid file data received");
      }

      const blob = new Blob([res.data.data], { type: res.data.headers['content-type'] });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const defaultName = `payslip_multiple.zip`;
      link.download = res.data.headers['content-disposition']
        ? res.headers['content-disposition'].split('filename=')[1].replace(/"/g, '')
        : defaultName;

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    }).catch(err => {

    });
  }

  const getSalaryMonths = () => {
    CommonService.getAllSalaryMonths().then(res => {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 2;

      const filtered = res.data.filter(month => {
        const monthDate = new Date(month.salaryMonthDate);
        const monthYear = monthDate.getFullYear();
        const monthMonth = monthDate.getMonth() + 1;

        return monthYear < currentYear ||
          (monthYear === currentYear && monthMonth <= currentMonth);
      });

      setSalaryMonthsList(filtered);

      // Default filter: Salary From = previous month, Salary To = current month
      const findMonth = (date) => filtered.find(month => {
        const monthDate = new Date(month.salaryMonthDate);
        return monthDate.getFullYear() === date.getFullYear() && monthDate.getMonth() === date.getMonth();
      });
      const previousMonth = findMonth(new Date(currentYear, currentDate.getMonth() - 1, 1));
      const thisMonth = findMonth(new Date(currentYear, currentDate.getMonth(), 1));

      if (previousMonth) {
        setFromMonth(previousMonth.idSalaryMonth.toString());
        setFilteredMonthsList(filtered.filter(el => el.idSalaryMonth >= previousMonth.idSalaryMonth));
      } else {
        setFilteredMonthsList(filtered);
      }
      if (thisMonth) {
        setToMonth(thisMonth.idSalaryMonth.toString());
      }
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
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, rowsPerPage]);

  const validPaySlips = filteredData.filter(slip => slip.employeeCode);

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

  const confirmFinalize = (val) => {
    setShowConfirmation(false);
    if (val) {
      sendEmailNotification();
    }
  };

  const sendEmailNotification = () => {
    const ids = [];
    selectedRows.forEach(el => {
      if ((filteredData.find(x => x.idEmployeeSalary == el).emailStatus != 'PROCESSING')) {
        ids.push(el);
      }
    })
    const result = ids.join(",");
    ViewPaySlipService.sendEmail(result).then(res => {
      console.log(res)
      if (res.data.status == 200 || res.data.status == 202) {
        toast.success(res.data.data.data, {
          position: 'top-right',
          autoClose: 2000
        });
      }
    }).catch(err => {
    });
  }

    const renderTooltip = (text) =>{
    return <Tooltip>Refresh</Tooltip>;
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">List of Salary Slips</h5>

              <div className="list_menu">
                <label className='p-2'>Email Status</label>
                <div className="list_searchbox">

                  <select
                    className="form-select"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="ALL">All</option>
                    <option value="SENT">Sent</option>
                    <option value="InProcess">In Process</option>
                    <option value="FAILED">Failed</option>
                    <option value="NOT INITIATED">Not Initiated</option>
                  </select>
                </div>
                <div className="list_searchbox">
                  {/* <label>Salary Month From</label> */}
                  <select
                    className="form-select"
                    value={fromMonth}
                    onChange={handleMonthFromChange}
                    required
                  >
                    <option value={''}>Salary From</option>
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
                    <option value={''}>Salary To</option>
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
                <div className="list_searchbox">
                  <OverlayTrigger
                    placement="top"
                    overlay={renderTooltip()}>
                    <button className="btn btn-primary btn-sm px-4" onClick={() => getSalarySlips()}>
                      <i class="bi bi-arrow-clockwise"></i>
                    </button>
                  </OverlayTrigger>
                </div>
              </div>

            </div>
            <div className="card-body">
              <div className="table-responsive text-nowrap scroll-grid">
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
              <div className='row'>
                <div className='col-lg-4'>
                  <label style={{ marginTop: '15px' }}>Total records selected {selectedRows.length} out of {paginatedData.length}</label>
                </div>
                <div className='col-lg-4'>
                  <div className="text-center py-2">
                    <button className="btn btn-primary btn-sm px-4"
                      disabled={selectedRows.length === 0} onClick={() => downloadMultipleSalarySlips()}>
                      Download selected
                    </button> &nbsp;
                    <button className="btn btn-primary btn-sm px-4"
                      disabled={selectedRows.length === 0 || loading} onClick={() => setShowConfirmation(true)}>
                      Send notification
                    </button>
                  </div>
                </div>
                <div className='col-lg-4'></div>
              </div>

              {/* <div className="text-end pt-2">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div> */}
            </div>
          </div>
        </div>
      </div >
      {
        showConfirmation &&
        <ConfirmationModal
          modalShow={true}
          messageText={"Are you sure to send email notification for the selected rows?"}
          callbackModal={confirmFinalize}
          confirmBtn={"Confirm"}
          CancelBtn={"Cancel"}
        />
      }
    </div >

  )
}

export default ViewPaySlips