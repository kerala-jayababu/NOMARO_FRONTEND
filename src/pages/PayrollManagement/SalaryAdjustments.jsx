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
    taNumber: "",
    isTaxable: "",
    amount: null,
    remarks: "",
    file: null,
    attachmentBlob: null,
    documentFilePath: null
  });
  const [validated, setValidated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(salaryAdjustments.length / rowsPerPage);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return salaryAdjustments.slice(startIndex, endIndex);
  }, [salaryAdjustments, currentPage, rowsPerPage]);

  const getEmployeesData = () => {
    CommonService.getEmployeeList().then(res => {
      res.data.data.sort((a, b) => a.fullName - b.fullName);
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
      taNumber: item.taNumber,
      isTaxable: item.isTaxable == true ? 'Yes' : 'No',
      amount: item.amount,
      remarks: item.remarks,
      file: item.file,
      attachmentBlob: item.attachmentBlob,
      documentFilePath: item.documentFilePath,
    });
    const selected = employeesListOption.find(option => option.value === newData.idEmployee);
    setSelectedEmployee(selected);
    setShowModal(true);
  }

  const saveSalaryAdjustments = (e) => {
    e.preventDefault();
    if (!newData.idEmployee || !newData.allocatingSalaryMonth || !newData.payAdjustmentDate || !newData.payAdjustmentDetails
      || !newData.earningOrDeduction || !newData.isTaxable || !newData.allocatingSalaryHead || !newData.amount) {
      setValidated(true);
      return;
    }
    let passData = newData;
    passData['isTaxable'] = passData['isTaxable'] == 'Yes' ? true : false;
    const paydate = moment(passData['payAdjustmentDate']).format("YYYY-MM-DD");
    passData['payAdjustmentDate'] = paydate;

    // Create a FormData object to handle file upload
    const formData = new FormData();
    formData.append('idEmployee', passData.idEmployee);
    formData.append('idDepartment', passData.idDepartment);
    formData.append('idDesignation', passData.idDesignation);
    formData.append('taNumber', passData.taNumber);
    formData.append('allocatingSalaryMonth', passData.allocatingSalaryMonth);
    formData.append('payAdjustmentDate', passData.payAdjustmentDate);
    formData.append('payAdjustmentDetails', passData.payAdjustmentDetails);
    formData.append('earningOrDeduction', passData.earningOrDeduction);
    formData.append('isTaxable', passData.isTaxable);
    formData.append('allocatingSalaryHead', passData.allocatingSalaryHead);
    formData.append('amount', passData.amount);
    formData.append('remarks', passData.remarks);

    // Append the file if it exists
    if (passData.file) {
      formData.append('file', passData.file);
    }

    SalaryAdjustmentService.saveSalaryAdjustmentsData(formData).then(res => {
      if (res.data.status === 200) {
        // toast.success('Salary adjustments added successfully', {
        //   position: 'top-right',
        //   autoClose: 2000
        // });
        getSalaryAdjustments();
        resetValues();
        setShowModal(false);
      }
    }).catch(err => {
      // toast.error('Something went wrong!', {
      //   position: 'top-right',
      //   autoClose: 2000
      // });
    });
  }

  const updateSalaryAdjustments = (e) => {
    e.preventDefault();
    if (!newData.idEmployee || !newData.allocatingSalaryMonth || !newData.payAdjustmentDate || !newData.payAdjustmentDetails
      || !newData.earningOrDeduction || !newData.isTaxable || !newData.allocatingSalaryHead || !newData.amount) {
      setValidated(true);
      return;
    }
    let passData = newData;
    passData['isTaxable'] = passData['isTaxable'] == 'Yes' ? true : false;
    const paydate = moment(passData['payAdjustmentDate']).format("YYYY-MM-DD");
    passData['payAdjustmentDate'] = paydate;

    // Create a FormData object to handle file upload
    const formData = new FormData();
    formData.append('idSalaryAdjustment', passData.idSalaryAdjustment);
    formData.append('idEmployee', passData.idEmployee);
    formData.append('idDepartment', passData.idDepartment);
    formData.append('idDesignation', passData.idDesignation);
    formData.append('taNumber', passData.taNumber);
    formData.append('allocatingSalaryMonth', passData.allocatingSalaryMonth);
    formData.append('payAdjustmentDate', passData.payAdjustmentDate);
    formData.append('payAdjustmentDetails', passData.payAdjustmentDetails);
    formData.append('earningOrDeduction', passData.earningOrDeduction);
    formData.append('isTaxable', passData.isTaxable);
    formData.append('allocatingSalaryHead', passData.allocatingSalaryHead);
    formData.append('amount', passData.amount);
    formData.append('remarks', passData.remarks);

    // Append the file if it exists
    if (passData.file) {
      formData.append('file', passData.file);
    }

    SalaryAdjustmentService.updateSalaryAdjustmentsData(formData).then(res => {
      if (res.data.status === 200) {
        // toast.success('Salary adjustments updated successfully', {
        //   position: 'top-right',
        //   autoClose: 2000
        // });
        getSalaryAdjustments();
        resetValues();
        setShowModal(false);
      }
    }).catch(err => {
      // toast.error('Something went wrong!', {
      //   position: 'top-right',
      //   autoClose: 2000
      // });
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
      amount: null,
      remarks: "",
      file: null,
      documentFilePath: null
    });
    setSelectedEmployee(null)
  }

  const handleChange = (selectedOption) => {
    setNewData((prevData) => ({
      ...prevData,
      idEmployee: selectedOption.value
    }));
  };

  const handlePageChange = (page) => setCurrentPage(page);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    console.log(file)
    setNewData(prevState => ({
      ...prevState,
      file: file,
    }));
  };

  const downloadFile = (item) => {
    const base64Data = item.attachmentBlob;
    const fileName = item.documentFilePath || 'downloaded-file';

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

  const removeFile = () => {
    setNewData((prevData) => ({
      ...prevData,
      file: null,
      documentFilePath: null
    }));
    setShowConfirmModal(false);
  }

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
                      <th>TA Number</th>
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
                      <th className="text-center"></th>
                      <th className="text-end"></th>
                    </tr>
                  </thead>
                  <tbody className="table-border-bottom-0">
                    {paginatedData?.length > 0 ? (
                      paginatedData?.map((item, index) => (
                        <tr>
                          <td>{item?.employeeCode}</td>
                          <td>{item?.taNumber}</td>
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
                          <td>
                            {
                              item.documentFilePath &&
                              <button className="btn btn-outline-primary border-0 btn-sm">
                                <i className="bx bx-paperclip cursor" onClick={() => downloadFile(item)}></i>
                              </button>
                            }
                          </td>
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

                    <Select
                      options={employeesListOption}
                      isSearchable
                      onChange={handleChange}
                      value={selectedEmployee}
                      placeholder={'Select Employee'}
                      className='textSize' required
                    />
                  </div>


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
                          placeholderText='Select Date' showMonthDropdown
                          showYearDropdown dropdownMode="select" />

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
                    {/* <input className="form-control" type="number" value={newData.amount}
                      // onChange={(e) => setNewData({ ...newData, amount: e.target.value })}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d{0,12}$/.test(value)) {
                          setNewData({ ...newData, amount: value });
                        }
                      }}
                      required placeholder='Add amount' min="0" max="999999999999" /> */}
                    <NumericFormat
                      className="form-control"
                      value={newData.amount}
                      onValueChange={(values) => {
                        const { value } = values;
                        setNewData({ ...newData, amount: value });
                      }}
                      decimalScale={2} // Allow up to 2 decimal places
                      allowNegative={true} // Disallow negative numbers
                      thousandSeparator={true} // Disable thousand separators
                      allowLeadingZeros={false}
                      placeholder="Add amount"
                      maxLength={12}
                      required
                    />
                  </div>

                  <div className="col-md-6 p-2">
                    <label className="form-label mb-1">TA Number</label>
                    <input
                      type="text"
                      readOnly
                      className="form-control"
                      value={newData?.taNumber || ''}
                      required

                    />
                  </div>

                  <div className="col-md-6 p-2">
                    <label class="form-label mb-1"> Attachments </label>
                    <input type="file" className="form-control" onChange={handleFileChange} />
                    {
                      newData.documentFilePath &&
                      <span className="badge bg-label-info p-1">{newData?.documentFilePath} &nbsp;&nbsp;
                        <label className="cursor" onClick={() => setShowConfirmModal(true)}>X</label>
                      </span>
                    }
                  </div>

                  <div className="col-md-12 p-2">
                    <label className="form-label mb-1">Remarks</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      maxLength="100"
                      value={newData?.remarks || ''}
                      onChange={(e) => setNewData({ ...newData, remarks: e.target.value })}
                      placeholder="Add remarks here"
                    ></textarea>
                    <small>
                      {100 - (newData?.remarks ? newData.remarks.length : 0)} / 100 characters remaining
                    </small>
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

        <Modal
          show={showConfirmModal} onHide={() => { setShowConfirmModal(false); }} size='md'
          aria-labelledby="contained-modal-title-vcenter"
          centered backdrop="static"
          keyboard={false}>
          <Modal.Header closeButton>
            <Modal.Title>
              <h5>Confirm Delete</h5>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div className="modal-body pt-1 text-center">
              <div className="text-center mb-5">
                <div className="mb-4 text-danger">
                  <i className="bx bx-x-circle fs-2"></i>
                </div>
                <h6> Are you sure to remove this file?</h6>
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-sm py-2 px-4 me-2"
                onClick={() => removeFile()}
              >
                Confirm
              </button>
              <button
                type="submit"
                className="btn btn-outline-secondary  btn-sm py-2 px-4"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
            </div>
          </Modal.Body>
        </Modal>
      </div >
    </div >

  )
}

export default SalaryAdjustments