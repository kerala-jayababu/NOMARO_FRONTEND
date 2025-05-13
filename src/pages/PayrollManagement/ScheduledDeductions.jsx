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
import { NumericFormat } from "react-number-format";

function ScheduledDeductions() {
  const [scheduledDeductions, setScheduledDeductions] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [salaryHeadList, setSalaryHeadList] = useState([]);
  const [salaryMonthsList, setSalaryMonthsList] = useState([]);
  const [filteredMonthsList, setFilteredMonthsList] = useState([]);
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
    monthlyDeductableAmount: 10,
    file: null,
    attachmentBlob: null,
    documentFilePath: null
  });
  const [validated, setValidated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [employeesListOption, setEmployeesListOption] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(scheduledDeductions.length / rowsPerPage);
  const [deductionGrid, setDeductionGrid] = useState([
    {
      idScheduledSalaryDeductionDetail: null,
      idScheduledSalaryDeduction: null,
      idSalaryMonth: 0,
      amountTobeDeducted: 0,
      amountDeducted: 0
    }
  ]);
  const [totalDeductions, setTotalDeductions] = useState(0);
  const [existingData, setExistingData] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
    // const monthlyDeductableAmount = calculateMonthlyDeductableAmount(
    //   newData.totalAmount,
    //   monthCount
    // );

    setNewData((prevData) => ({
      ...prevData,
      monthCount,
      // monthlyDeductableAmount,
    }));

    if (newData.deductionFromSalaryMonthDate && newData.deductionToSalaryMonthDate) {
      if (isEdit) {
        generateGridForEdit(newData.deductionFromSalaryMonthDate, newData.deductionToSalaryMonthDate);
      } else {
        generateGrid(newData.deductionFromSalaryMonthDate, newData.deductionToSalaryMonthDate);
      }
    }
  }, [
    newData.deductionFromSalaryMonthDate,
    newData.deductionToSalaryMonthDate,
    newData.totalAmount,
  ]);

  useEffect(() => {
    const total = deductionGrid.reduce((sum, month) => sum + month.amountTobeDeducted, 0);
    const roundedSum = Math.round(total); // Round to nearest cent
    setTotalDeductions(roundedSum);
  }, [deductionGrid]);

  const currentMonthPatch = () => {
    // Find current month
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed

    // Find matching month in data
    const currentMonthData = salaryMonthsList.find(month => {
      const monthDate = new Date(month.salaryMonthDate);
      return (
        monthDate.getFullYear() === currentYear &&
        monthDate.getMonth() + 1 === currentMonth
      );
    });

    // Set as default selected
    if (currentMonthData) {
      setNewData((prevData) => ({
        ...prevData,
        deductionFromSalaryMonthDate: currentMonthData.salaryMonthDate
      }));
    }
  }

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
  };

  const getScheduledDeductionsById = (id) => {
    ScheduledDeductionService.getScheduledDeductionsDataById(id).then(res => {
      // setScheduledDeductions(res.data.data);
      setExistingData(res.data.data.scheduledDeductionDetailsDto);
      setupEdit(res.data.data);
    }).catch(err => {
      setScheduledDeductions([]);
    });
  };

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
  };

  const getSalaryHeadData = () => {
    CommonService.getSalaryHeadList().then(res => {
      const salHead = res.data.data;
      const filterred = salHead.filter(el => el.headType === "DEDUCTION");
      setSalaryHeadList(filterred);
    }).catch(err => {
    });
  };

  const getSalaryMonths = () => {
    CommonService.getAllSalaryMonths().then(res => {
      setSalaryMonthsList(res.data);
      setFilteredMonthsList(res.data);
    }).catch(err => {
    });
  };

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
      monthlyDeductableAmount: 10,
      file: item.file,
      attachmentBlob: item.attachmentBlob,
      documentFilePath: item.documentFilePath,
    });
    handleMonthFromChangeEdit(item.deductionFromSalaryMonthDate);
    setDeductionGrid(item.scheduledDeductionDetailsDto ?? []);
    const selected = employeesListOption.find(option => option.value === item.idEmployee);
    setSelectedEmployee(selected);
    setShowModal(true);
  };

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
    if (!newData.idEmployee || !newData.allocatingSalaryHead || !newData.totalAmount || !newData.deductionFromSalaryMonthDate
      || !newData.deductionToSalaryMonthDate) {
      setValidated(true);
      return;
    }
    const isEqual = Math.abs(newData['totalAmount'] - totalDeductions) < 0.02;
    if (isEqual) {
      let passData = newData;
      const scheduledDeductionDetails = transformDeductionGrid(deductionGrid);
      passData['deductionFromSalaryMonth'] = new Date(passData['deductionFromSalaryMonthDate']).getMonth() + 1;
      passData['deductionToSalaryMonth'] = new Date(passData['deductionToSalaryMonthDate']).getMonth() + 1;
      passData['ScheduledDeductionDetailsDto'] = scheduledDeductionDetails;
      passData['monthlyDeductableAmount'] = 1;

      // Create a FormData object to handle file upload
      const formData = new FormData();
      formData.append('scheduledDeductionDetailsJson', JSON.stringify(passData.ScheduledDeductionDetailsDto));
      formData.append('allocatingSalaryHead', passData.allocatingSalaryHead);
      formData.append('deductionFromSalaryMonth', passData.deductionFromSalaryMonth);
      formData.append('deductionFromSalaryMonthDate', passData.deductionFromSalaryMonthDate);
      formData.append('deductionToSalaryMonthDate', passData.deductionToSalaryMonthDate);
      formData.append('totalAmount', passData.totalAmount);
      formData.append('idEmployee', passData.idEmployee);
      formData.append('monthCount', passData.monthCount);
      formData.append('monthlyDeductableAmount', passData.monthlyDeductableAmount);

      // Append the file if it exists
      if (passData.file) {
        formData.append('file', passData.file);
      }

      ScheduledDeductionService.saveScheduledDeductionsData(formData).then(res => {
        if (res.data.status === 200) {
          // toast.success('Scheduled deductions added successfully', {
          //   position: 'top-right',
          //   autoClose: 2000
          // });
          getScheduledDeductions();
          resetValues();
          setShowModal(false);
        }
      }).catch(err => {
        // toast.error('Something went wrong!', {
        //   position: 'top-right',
        //   autoClose: 2000
        // });
      });
    } else {
      toast.warning('Total amount and deductions total should be same', {
        position: 'top-right',
        autoClose: 2000
      });
    }

  };

  const updateScheduledDeductions = (e) => {
    e.preventDefault();
    if (!newData.idEmployee || !newData.allocatingSalaryHead || !newData.totalAmount || !newData.deductionFromSalaryMonthDate
      || !newData.deductionToSalaryMonthDate) {
      setValidated(true);
      return;
    }
    const isEqual = Math.abs(newData['totalAmount'] - totalDeductions) < 0.02;
    if (isEqual) {
      let passData = newData;
      const scheduledDeductionDetails = transformDeductionGrid(deductionGrid);
      passData['deductionFromSalaryMonth'] = new Date(passData['deductionFromSalaryMonthDate']).getMonth() + 1;
      passData['deductionToSalaryMonth'] = new Date(passData['deductionToSalaryMonthDate']).getMonth() + 1;
      passData['ScheduledDeductionDetailsDto'] = scheduledDeductionDetails;
      passData['monthlyDeductableAmount'] = 1;

      // Create a FormData object to handle file upload
      const formData = new FormData();
      formData.append('scheduledDeductionDetailsJson', JSON.stringify(passData.ScheduledDeductionDetailsDto));
      formData.append('allocatingSalaryHead', passData.allocatingSalaryHead);
      formData.append('deductionFromSalaryMonth', passData.deductionFromSalaryMonth);
      formData.append('deductionToSalaryMonth', passData.deductionToSalaryMonth);
      formData.append('deductionFromSalaryMonthDate', passData.deductionFromSalaryMonthDate);
      formData.append('deductionToSalaryMonthDate', passData.deductionToSalaryMonthDate);
      formData.append('totalAmount', passData.totalAmount);
      formData.append('idEmployee', passData.idEmployee);
      formData.append('idScheduledSalaryDeduction', passData.idScheduledSalaryDeduction);
      formData.append('monthCount', passData.monthCount);
      formData.append('monthlyDeductableAmount', passData.monthlyDeductableAmount);

      // Append the file if it exists
      if (passData.file) {
        formData.append('file', passData.file);
      }

      ScheduledDeductionService.updateScheduledDeductionsData(formData).then(res => {
        if (res.data.status === 200) {
          // toast.success('Scheduled deductions updated successfully', {
          //   position: 'top-right',
          //   autoClose: 2000
          // });
          getScheduledDeductions();
          resetValues();
          setShowModal(false);
        }
      }).catch(err => {
        // toast.error('Something went wrong!', {
        //   position: 'top-right',
        //   autoClose: 2000
        // });
      });
    } else {
      toast.warning('Total amount and deductions total should be same', {
        position: 'top-right',
        autoClose: 2000
      });
    }
  };

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
      monthlyDeductableAmount: 10,
      file: null,
      documentFilePath: null
    });
    setSelectedEmployee(null);
    setFilteredMonthsList(salaryMonthsList);
    setDeductionGrid([]);
    setExistingData([]);
  };

  const handleChange = (selectedOption) => {
    setNewData((prevData) => ({
      ...prevData,
      idEmployee: selectedOption.value
    }));
  };

  const handleAmountChange = (idSalaryMonth, value) => {
    const updatedGrid = deductionGrid.map((month) => {
      if (month.idSalaryMonth === idSalaryMonth) {
        if (month.amountDeducted > 0) {
          toast.warning("Cannot edit amount for a month with deductions already made.", {
            position: "top-right",
            autoClose: 2000,
          });
          return month;
        }
        return { ...month, amountTobeDeducted: parseFloat(value) || 0 };
      }
      return month;
    });
    setDeductionGrid(updatedGrid);
  };

  const handleMonthFromChange = (e) => {
    const selectedDate = e.target.value;
    const selectedId = (salaryMonthsList.find((el) => el.salaryMonthDate === selectedDate))?.idSalaryMonth;

    const hasDeductions = deductionGrid.some(
      (month) => month.amountDeducted > 0 && month.idSalaryMonth < selectedId
    );

    if (hasDeductions) {
      toast.warning("Cannot remove a month with deductions already made.", {
        position: "top-right",
        autoClose: 2000,
      });
      return;
    }

    setNewData({
      ...newData,
      deductionFromSalaryMonthDate: selectedDate,
      deductionToSalaryMonthDate: "",
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

  const handleMonthFromChangeEdit = (e) => {
    const selectedDate = e;
    const selectedId = (salaryMonthsList.find((el) => el.salaryMonthDate === selectedDate))?.idSalaryMonth;

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
    const selectedDate = e.target.value;

    const hasDeductions = deductionGrid.some(
      (month) => month.amountDeducted > 0 && month.idSalaryMonth > newData.deductionFromSalaryMonthDate
    );

    if (hasDeductions) {
      toast.warning("Cannot remove a month with deductions already made.", {
        position: "top-right",
        autoClose: 2000,
      });
      return;
    }

    setNewData({
      ...newData,
      deductionToSalaryMonthDate: selectedDate,
    });
  };

  const generateGrid = (fromDate, toDate) => {
    const fromIndex = salaryMonthsList.findIndex((el) => el.salaryMonthDate === fromDate);
    const toIndex = salaryMonthsList.findIndex((el) => el.salaryMonthDate === toDate);

    if (fromIndex === -1 || toIndex === -1 || fromIndex > toIndex) return;

    const selectedMonths = salaryMonthsList.slice(fromIndex, toIndex + 1);

    const numberOfMonths = selectedMonths.length;
    const amountPerMonth = newData.totalAmount / numberOfMonths;

    const gridData = selectedMonths.map((month) => ({
      idScheduledSalaryDeductionDetail: null,
      idScheduledSalaryDeduction: newData.idScheduledSalaryDeduction,
      idSalaryMonth: month.idSalaryMonth,
      salaryMonthText: month.salaryMonthText,
      amountTobeDeducted: amountPerMonth,
      amountDeducted: 0,
    }));

    setDeductionGrid(gridData);
  };

  const generateGridForEdit = (fromDate, toDate) => {
    const fromIndex = salaryMonthsList.findIndex((el) => el.salaryMonthDate === fromDate);
    const toIndex = salaryMonthsList.findIndex((el) => el.salaryMonthDate === toDate);

    if (fromIndex === -1 || toIndex === -1 || fromIndex > toIndex) return;

    const selectedMonths = salaryMonthsList.slice(fromIndex, toIndex + 1);

    const numberOfMonths = selectedMonths.length;
    const amountPerMonth = newData.totalAmount / numberOfMonths;

    const gridData = selectedMonths.map((month, key) => ({
      idScheduledSalaryDeductionDetail: existingData[key]?.idScheduledSalaryDeductionDetail ?? null,
      idScheduledSalaryDeduction: existingData[key]?.idScheduledSalaryDeduction ?? newData.idScheduledSalaryDeduction,
      idSalaryMonth: existingData[key]?.idSalaryMonth ?? month.idSalaryMonth,
      salaryMonthText: existingData[key]?.salaryMonthText ?? month.salaryMonthText,
      amountTobeDeducted: existingData[key]?.amountTobeDeducted ?? 0,
      amountDeducted: existingData[key]?.amountDeducted ?? 0,
    }));

    setDeductionGrid(gridData);
  };

  const transformDeductionGrid = (deductionGrid) => {
    return deductionGrid.map((month) => ({
      idSalaryMonth: month.idSalaryMonth,
      idScheduledSalaryDeductionDetail: month.idScheduledSalaryDeductionDetail || null,
      idScheduledSalaryDeduction: month.idScheduledSalaryDeduction,
      amountTobeDeducted: month.amountTobeDeducted,
    }));
  };

  // const calculateTotalAmount = () => {
  //   return deductionGrid.reduce((sum, month) => sum + month.AmountTobeDeducted, 0);
  // };

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
      documentFilePath: null,
      attachmentBlob: null
    }));
    setShowConfirmModal(false);
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
                        getScheduledDeductions();
                      }
                    }}
                    onKeyDown={e => e.key === 'Enter' ? getScheduledDeductions() : ''} />
                  <i className="bx bx-search cursor" onClick={() => getScheduledDeductions()}></i>
                </div>
                <button className="btn btn-primary btn-sm px-4" onClick={() => { setShowModal(true); currentMonthPatch(); }}>Add</button>
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
                      {/* <th className="text-end">Monthly Deduction</th> */}
                      <th className="text-end">Total Deduction</th>
                      <th className="text-center"></th>
                      <th className="text-end"></th>
                    </tr>
                  </thead>
                  <tbody className="table-border-bottom-0">
                    {paginatedData?.length > 0 ? (
                      paginatedData?.map((item, index) => (
                        <tr key={index}>
                          <td>{item?.employeeCode}</td>
                          <td>{item?.employeeName}</td>
                          <td>{item?.designationName}</td>
                          <td>{item?.deductionFromSalaryMonthText}</td>
                          <td>{item?.deductionToSalaryMonthText}</td>
                          <td className="text-center">{item.monthCount}</td>
                          {/* <td className="text-end">{Utils.formattedNumber(item.monthlyDeductableAmount)}</td> */}
                          <td className="text-end">{Utils.formattedNumber(item.totalAmount)}</td>
                          <td>
                            {
                              item.attachmentBlob != null &&
                              <button className="btn btn-outline-primary border-0 btn-sm">
                                <i className="bx bx-paperclip cursor" onClick={() => downloadFile(item)}></i>
                              </button>
                            }
                          </td>
                          <td className="text-end">
                            <button type="button" className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0" onClick={() => getScheduledDeductionsById(item?.idScheduledSalaryDeduction)}>
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
              <h5>Add/Update Scheduled Deductions</h5>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div className="accountDetail_card">
              <Form noValidate validated={validated}>
                <div className="row">
                  <div className="col-lg-8 mb-2">
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
                </div>

                <div className="row">
                  <div className="col-lg-4 mb-2">
                    <label className="form-label mb-1">Total Deduction</label>
                    <NumericFormat
                      className="form-control"
                      value={newData.totalAmount}
                      onValueChange={(values) => {
                        const { value } = values;
                        setNewData({ ...newData, totalAmount: value });
                      }}
                      decimalScale={2}
                      allowNegative={false}
                      thousandSeparator={true}
                      allowLeadingZeros={false}
                      placeholder="Add amount"
                      maxLength={12}
                      required
                    />
                  </div>

                  <div className="col-lg-4 mb-2">
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
                </div>

                <div className="row">
                  <div className="col-lg-4">
                    <div className="mb-2">
                      <label className="form-label">Salary Month From</label>
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
                  </div>

                  <div className="col-lg-4">
                    <div className="mb-2">
                      <label className="form-label">Salary Month To</label>
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
                  </div>

                  <div className="col-lg-4">
                    <div className="mb-2">
                      <label className="form-label">No of Months</label>
                      <input className="form-control" type="number" disabled={true}
                        value={newData.monthCount}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-lg-6">
                    <div className="mb-2">
                      <label class="form-label"> Attachments </label>
                      <input type="file" className="form-control" onChange={handleFileChange} />
                      {
                        newData.attachmentBlob != null &&
                        <span className="badge bg-label-info p-1">{newData?.documentFilePath} &nbsp;&nbsp;
                          <label className="cursor" onClick={() => setShowConfirmModal(true)}>X</label>
                        </span>
                      }
                    </div>
                  </div>
                </div>

                {/* Deduction Grid */}
                <div className="col-12 mt-2">
                  <label className="form-label mb-1">Deduction Details</label>
                  <div className="deduct-table-container">
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th width='30%'>Month, Year</th>
                          <th width='30%'>Amount</th>
                          <th width='40%'>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deductionGrid.map((month) => (
                          <tr key={month.idSalaryMonth}>
                            <td>{month.salaryMonthText}</td>
                            <td style={{ padding: '4px' }}>
                              {/* <input
                              type="number"
                              className="form-control"
                              value={month.amount}
                              onChange={(e) =>
                                handleAmountChange(month.idSalaryMonth, e.target.value)
                              }
                            /> */}
                              <NumericFormat
                                className="form-control"
                                value={month.amountTobeDeducted}
                                onValueChange={(values) => {
                                  const { value } = values;
                                  handleAmountChange(month.idSalaryMonth, value)
                                }}
                                decimalScale={2}
                                allowNegative={false}
                                thousandSeparator={true}
                                allowLeadingZeros={false}
                                placeholder="Amount"
                                maxLength={12}
                                disabled={month.amountDeducted > 0}
                                required
                              />
                            </td>
                            <td>{month.amountDeducted > 0 ? 'Already Deducted' : 'Not deducted'}</td>
                          </tr>
                        ))}
                        <tr>
                          <td></td>
                          <td>Calculated Deductions: <strong>{Utils.formattedNumber(totalDeductions)}</strong></td>
                          <td>Balance to adjust: <strong>{Utils.formattedNumber(newData.totalAmount - totalDeductions)}</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>


                {/* <div className="row">
                  <div className="col-6 mt-1 mb-1">
                    <strong>Total Deductions: </strong>
                    {Utils.formattedNumber(totalDeductions)}
                  </div>
                  <div className="col-6 mt-1 mb-1 text-end">
                    <strong>Balance: </strong>
                    {Utils.formattedNumber(newData.totalAmount - totalDeductions)}
                  </div>
                </div> */}


                {/* <div className="mb-2">
                  <label className="form-label mb-1">Monthly Deduction</label>
                  <NumericFormat
                    className="form-control"
                    value={newData.monthlyDeductableAmount}
                    decimalScale={2}
                    allowNegative={false}
                    thousandSeparator={true}
                    allowLeadingZeros={false}
                    fixedDecimalScale={2}
                    placeholder="Deduction"
                    maxLength={12}
                    disabled={true}
                    required
                  />
                </div> */}

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

      </div>
    </div>
  );
}

export default ScheduledDeductions;