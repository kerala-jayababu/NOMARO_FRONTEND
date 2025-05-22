import React, { useEffect, useMemo, useRef, useState } from "react";
import MaternityService from '../../core/services/MaternityService';
import moment from "moment";
import CommonService from "../../core/services/CommonService";
import { Form, Modal } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import Utils from "../../utils/Utils";
import Select from 'react-select';
import Pagination from "../../components/pagination";
import { NumericFormat } from "react-number-format";

function MaternityLeaveSalaries() {
  const [employeesList, setEmployeesList] = useState([]);
  const [maternityLeaveSalaries, setMaternityLeaveSalaries] = useState([]);
  const [salaryHeadList, setSalaryHeadList] = useState([]);
  const [salaryMonthsList, setSalaryMonthsList] = useState([]);
  const [salaryStructure, setSalaryStructure] = useState([]);
  const [salaryStructureToDisplay, setSalaryStructureToDisplay] = useState(null);
  const [startDate, setStartDate] = useState(new Date('01-01-2025'));
  const [searchText, setSearchText] = useState('');
  const [newData, setNewData] = useState({
    idMaternityLeaveSalary: 0,
    idEmployee: 0,
    maternityLeaveFrom: "",
    maternityLeaveTo: "",
    idSalaryMonthFrom: 0,
    idSalaryMonthTo: 0,
    netSalary: 0,
    totalEarnings: 0,
    totalDeductions: 0,
    file: null,
    attachmentBlob: null,
    documentFilePath: null
  });
  const [salaryDetails, setSalaryDetails] = useState([
    {
      idSalaryHead: 0,
      salaryHeadType: "",
      amount: null,
      amountInUSD: 0
    },
  ]);
  const [validated, setValidated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [errors, setErrors] = useState([]);
  const [employeesListOption, setEmployeesListOption] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [filteredMonthsList, setFilteredMonthsList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(maternityLeaveSalaries.length / rowsPerPage);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getSalaryHeadData();
    getEmployeesData();
    getSalaryMonths();
    getSalaryStructure();
  }, []);

  useEffect(() => {
    getMaternityLeaveSalaries();
  }, [startDate]);

  useEffect(() => {
    if (newData.idEmployee == 0) {
      setSalaryStructureToDisplay(null)
      return;
    }
    const empSalaryStructure = salaryStructure.find(emp => emp.idEmployee == newData.idEmployee);
    const earnings = empSalaryStructure?.salaryComponents.filter(el => el.headType == 'EARNING');
    const deductions = empSalaryStructure?.salaryComponents.filter(el => el.headType == 'DEDUCTION');
    setSalaryStructureToDisplay({
      earnings: earnings ?? [],
      deductions: deductions ?? [],
      totalEarnings: empSalaryStructure?.totalEarnings ?? 0,
      totalDeductions: empSalaryStructure?.totalDeductions ?? 0,
      netSalary: empSalaryStructure?.netSalary ?? 0
    });
    const selected = employeesListOption.find(option => option.value === newData.idEmployee);
    setSelectedEmployee(selected);
  }, [newData.idEmployee]);

  useEffect(() => {
    if (newData.idSalaryMonthFrom == '' || newData.idSalaryMonthFrom == 0) {
      setNewData(prevState => ({
        ...prevState,
        maternityLeaveFrom: ""
      }));
      return;
    }
    const salaryMonthById = salaryMonthsList.find(el => el.idSalaryMonth == newData.idSalaryMonthFrom);
    setNewData(prevState => ({
      ...prevState,
      maternityLeaveFrom: salaryMonthById.salaryMonthDate
    }));
  }, [newData.idSalaryMonthFrom]);

  useEffect(() => {
    if (newData.idSalaryMonthTo == '' || newData.idSalaryMonthTo == 0) {
      setNewData(prevState => ({
        ...prevState,
        maternityLeaveTo: ""
      }));
      return;
    }
    const salaryMonthById = salaryMonthsList.find(el => el.idSalaryMonth == newData.idSalaryMonthTo);
    setNewData(prevState => ({
      ...prevState,
      maternityLeaveTo: salaryMonthById.salaryMonthDate
    }));
  }, [newData.idSalaryMonthTo]);

  useEffect(() => {
    calculateEarningsDeductionsTotal();
  }, [salaryDetails]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return maternityLeaveSalaries.slice(startIndex, endIndex);
  }, [maternityLeaveSalaries, currentPage, rowsPerPage]);

  const getEmployeesData = () => {
    CommonService.getEmployeeList().then(res => {
      // setEmployeesList(res.data.data);
      res.data.data.sort((a, b) => a.fullName - b.fullName);
      const females = res.data.data.filter(em => em.gender == 'FEMALE');
      const options = females.map(employee => ({
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
      // const filterred = salHead.filter(el => el.headType === "Deduction");
      setSalaryHeadList(salHead);
    }).catch(err => {
    });
  }

  const getSalaryMonths = () => {
    CommonService.getAllSalaryMonths().then(res => {
      const salMonths = res.data;
      // const filterred = salMonths.slice(0, 12);
      setSalaryMonthsList(salMonths);
    }).catch(err => {
    });
  }

  const getSalaryStructure = () => {
    CommonService.getSalaryStructure().then(res => {
      setSalaryStructure(res.data);
    }).catch(err => {
    });
  }

  const getMaternityLeaveSalaries = () => {
    const date = moment(startDate).format("YYYY-MM-DD");
    MaternityService.getMaternityLeaveSalariesData(date, searchText).then(res => {
      setMaternityLeaveSalaries(res.data.data);
    }).catch(err => {
      setMaternityLeaveSalaries([]);
    });
  }

  const getMaternityLeaveSalById = (id) => {
    MaternityService.getMaternityLeaveSalaryById(id).then(res => {
      setupEdit(res.data.data);
    }).catch(err => {
      setMaternityLeaveSalaries([]);
    });
  }

  const getSalaryHeadTypeName = (id) => {
    if (id == '' || id == 0) return "";
    const salHeadData = salaryHeadList.find(el => el.idSalaryHead == id);
    return salHeadData?.headType ?? ""
  }

  const addRow = () => {
    setSalaryDetails([
      ...salaryDetails,
      { idSalaryHead: 0, salaryHeadType: 0, amount: 0, amountInUSD: 0 }
    ]);
  };

  const removeRow = (index) => {
    const newSalaryDetails = salaryDetails.filter((_, i) => i !== index);
    setSalaryDetails(newSalaryDetails);
  };

  const handleSelectChange = (index, event) => {
    const { value } = event.target;
    const newSalaryDetails = [...salaryDetails];
    newSalaryDetails[index]['idSalaryHead'] = value;
    newSalaryDetails[index]['salaryHeadType'] = getSalaryHeadTypeName(value);
    setSalaryDetails(newSalaryDetails);
  };

  const handleInputChange = (index, value) => {
    const newSalaryDetails = [...salaryDetails];
    newSalaryDetails[index]['amount'] = value;
    setSalaryDetails(newSalaryDetails);
  };

  const setupEdit = (item) => {
    setIsEdit(true);
    setNewData({
      idMaternityLeaveSalary: item.idMaternityLeaveSalary,
      idEmployee: item.idEmployee,
      maternityLeaveFrom: item.maternityLeaveFrom,
      maternityLeaveTo: item.maternityLeaveTo,
      idSalaryMonthFrom: item.idSalaryMonthFrom,
      idSalaryMonthTo: item.idSalaryMonthTo,
      netSalary: item.maternityLeaveNetSalary,
      totalEarnings: item.totalEarnings,
      totalDeductions: item.totalDeductions,
      file: item.file,
      attachmentBlob: item.attachmentBlob,
      documentFilePath: item.documentFilePath,
    });
    handleMonthFromChangeEdit(item.idSalaryMonthFrom)
    setSalaryDetails(item.maternityLeaveSalaryDetailDto);
    const selected = employeesListOption.find(option => option.value === newData.idEmployee);
    setSelectedEmployee(selected);
    setShowModal(true);
  }

  const calculateEarningsDeductionsTotal = () => {
    const totalEarnings = salaryDetails.reduce((total, item) => {
      if (item.salaryHeadType && item.salaryHeadType.toLowerCase() === 'earning') {
        return total + parseFloat(item.amount);
      }
      return total;
    }, 0);

    const totalDeductions = salaryDetails.reduce((total, item) => {
      if (item.salaryHeadType && item.salaryHeadType.toLowerCase() === 'deduction') {
        return total + parseFloat(item.amount);
      }
      return total;
    }, 0);

    setNewData(prevState => ({
      ...prevState,
      totalEarnings: totalEarnings,
      totalDeductions: totalDeductions,
      netSalary: totalEarnings - totalDeductions,
    }));
  }

  const validateSalaryDetails = (salaryDetails) => {
    return salaryDetails.every(detail => {
      return detail.salaryHeadType !== "" && detail.amount !== null && detail.amount !== 0;
    });
  };

  const saveMaternityLeaveSalaries = (e) => {
    e.preventDefault();
    if (!newData.idEmployee || !newData.idSalaryMonthFrom || !newData.idSalaryMonthTo) {
      setValidated(true);
      return;
    }

    if (!validateSalaryDetails(salaryDetails)) {
      toast.warning('Please fill out all required fields in the leave salary details.', {
        position: 'top-right',
        autoClose: 2000
      });
      return;
    }

    let passData = newData;
    passData['maternityLeaveSalaryDetailDto'] = salaryDetails;

    // const netSalary = totalEarnings - totalDeductions;
    // passData['totalEarnings'] = totalEarnings;
    // passData['totalDeductions'] = totalDeductions;
    // passData['netSalary'] = netSalary;

    delete passData['totalEarnings'];
    delete passData['totalDeductions'];
    delete passData['netSalary'];

    // Create a FormData object to handle file upload
    const formData = new FormData();
    formData.append('maternityLeaveSalaryDetailDtoJson', JSON.stringify(passData.maternityLeaveSalaryDetailDto));
    formData.append('idEmployee', passData.idEmployee);
    formData.append('idSalaryMonthFrom', passData.idSalaryMonthFrom);
    formData.append('idSalaryMonthTo', passData.idSalaryMonthTo);
    formData.append('maternityLeaveFrom', passData.maternityLeaveFrom);
    formData.append('maternityLeaveTo', passData.maternityLeaveTo);

    // Append the file if it exists
    if (passData.file) {
      formData.append('file', passData.file);
    }

    MaternityService.saveMaternityLeaveSalariesData(formData).then(res => {
      if (res.data.status === 200) {
        // toast.success('Maternity leave salaries added successfully', {
        //   position: 'top-right',
        //   autoClose: 2000
        // });
        getMaternityLeaveSalaries();
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

  const updateMaternityLeaveSalaries = (e) => {
    e.preventDefault();
    if (!newData.idEmployee || !newData.idSalaryMonthFrom || !newData.idSalaryMonthTo) {
      setValidated(true);
      return;
    }
    if (!validateSalaryDetails(salaryDetails)) {
      toast.error('Please fill out all required fields in the salary details.', {
        position: 'top-right',
        autoClose: 2000
      });
      return;
    }

    let passData = newData;
    passData['maternityLeaveSalaryDetailDto'] = salaryDetails;

    // const netSalary = totalEarnings - totalDeductions;
    // passData['totalEarnings'] = totalEarnings;
    // passData['totalDeductions'] = totalDeductions;
    // passData['netSalary'] = netSalary;

    delete passData['totalEarnings'];
    delete passData['totalDeductions'];
    delete passData['netSalary'];

    // Create a FormData object to handle file upload
    const formData = new FormData();
    formData.append('maternityLeaveSalaryDetailDtoJson', JSON.stringify(passData.maternityLeaveSalaryDetailDto));
    formData.append('idMaternityLeaveSalary', passData.idMaternityLeaveSalary);
    formData.append('idEmployee', passData.idEmployee);
    formData.append('idSalaryMonthFrom', passData.idSalaryMonthFrom);
    formData.append('idSalaryMonthTo', passData.idSalaryMonthTo);
    formData.append('maternityLeaveFrom', passData.maternityLeaveFrom);
    formData.append('maternityLeaveTo', passData.maternityLeaveTo);

    // Append the file if it exists
    if (passData.file) {
      formData.append('file', passData.file);
    }

    MaternityService.updateMaternityLeaveSalariesData(formData).then(res => {
      if (res.data.status === 200) {
        // toast.success('Maternity leave salaries updated successfully', {
        //   position: 'top-right',
        //   autoClose: 2000
        // });
        getMaternityLeaveSalaries();
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
    setNewData({
      idMaternityLeaveSalary: 0,
      idEmployee: 0,
      maternityLeaveFrom: "",
      maternityLeaveTo: "",
      idSalaryMonthFrom: 0,
      idSalaryMonthTo: 0,
      netSalary: 0,
      totalEarnings: 0,
      totalDeductions: 0,
      file: null,
      documentFilePath: null
    });
    setSalaryDetails([
      {
        idSalaryHead: 0,
        salaryHeadType: "",
        amount: 0,
        amountInUSD: 0
      },
    ]);
    setSelectedEmployee(null);
    setFilteredMonthsList([]);
  }

  const handleChange = (selectedOption) => {
    setNewData((prevData) => ({
      ...prevData,
      idEmployee: selectedOption.value
    }));
  };

  const handleMonthFromChange = (e) => {
    const selectedId = e.target.value;
    setNewData({
      ...newData,
      idSalaryMonthFrom: selectedId,
      idSalaryMonthTo: '',
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
    const selectedId = e;
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
      idSalaryMonthTo: e.target.value,
    });
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
      documentFilePath: null,
      attachmentBlob: null
    }));
    setShowConfirmModal(false);
  }

  const handleClear = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      setNewData(prevState => ({
        ...prevState,
        file: null,
      }));
    }
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">List of Maternity Leave Salaries</h5>

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
                        getMaternityLeaveSalaries();
                      }
                    }}
                    onKeyDown={e => e.key === 'Enter' ? getMaternityLeaveSalaries() : ''} />
                  <i className="bx bx-search cursor" onClick={() => getMaternityLeaveSalaries()}></i>
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
                      <th>Salary Month From</th>
                      <th>Salary Month To</th>
                      <th className="text-end">Net Salary</th>
                      <th className="text-end">Maternity Salary</th>
                      <th className="text-center"></th>
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
                          <td>{moment(item?.maternityLeaveFrom).format("MMMM, YYYY")}</td>
                          <td>{moment(item?.maternityLeaveTo).format("MMMM, YYYY")}</td>
                          <td className="text-end">{Utils.formattedNumber(item.defaultNetSalary)}</td>
                          <td className="text-end">{Utils.formattedNumber(item.maternityLeaveNetSalary)}</td>
                          <td>
                            {
                              item.attachmentBlob != null &&
                              <button className="btn btn-outline-primary border-0 btn-sm">
                                <i className="bx bx-paperclip cursor" onClick={() => downloadFile(item)}></i>
                              </button>
                            }
                          </td>
                          <td className="text-end">
                            <button type="button" className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0" onClick={() => getMaternityLeaveSalById(item.idMaternityLeaveSalary)}>
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
          show={showModal} onHide={() => { setShowModal(false); resetValues() }} size='xl'
          aria-labelledby="contained-modal-title-vcenter"
          centered backdrop="static"
          keyboard={false}>
          <Modal.Header closeButton>
            <Modal.Title>
              <h5>Add/Update Maternity Leave Salaries</h5>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div className="accountDetail_card">
              <Form noValidate validated={validated}>
                <div class="row m-0">
                  <div class="col-md-3 p-2">
                    <label class="form-label mb-1">Employee Name</label>
                    <Select
                      options={employeesListOption}
                      isSearchable
                      onChange={handleChange}
                      value={selectedEmployee}
                      placeholder={'Select Employee'}
                      className="textSize" required
                    />
                  </div>

                  <div class="col-md-2 p-2">
                    <label class="form-label mb-1">Month From</label>
                    <select
                      className="form-select controlHeight"
                      value={newData.idSalaryMonthFrom}
                      onChange={handleMonthFromChange}
                      required
                    >
                      <option value={''}>Select</option>
                      {salaryMonthsList.map((el) => (
                        <option value={el.idSalaryMonth} key={el.idSalaryMonth}>
                          {el.salaryMonthText}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div class="col-md-2 p-2">
                    <label class="form-label mb-1">Month To</label>
                    <select
                      className="form-select controlHeight"
                      value={newData.idSalaryMonthTo}
                      onChange={handleMonthToChange}
                      required
                    >
                      <option value={''}>Select</option>
                      {filteredMonthsList.map((el) => (
                        <option value={el.idSalaryMonth} key={el.idSalaryMonth}>
                          {el.salaryMonthText}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* <div class="col-md-5 p-2">
                    <label class="fform-label mb-1">Attachments </label>
                    <input type="file" className="form-control" onChange={handleFileChange} />
                    {
                      newData.attachmentBlob != null &&
                      <span className="badge bg-label-info p-1">{newData?.documentFilePath} &nbsp;&nbsp;
                        <label className="cursor" onClick={() => setShowConfirmModal(true)}>X</label>
                      </span>
                    }
                  </div> */}
                  <div className="col-md-5 p-2">
                    <label class="form-label mb-1">Attachments </label>
                    <div className="row">
                      <div className="col-md-9">
                        <input type="file" className="form-control" onChange={handleFileChange} ref={fileInputRef} />
                      </div>
                      <div className="col-md-2">
                        {
                          newData.file != null &&
                          <button className="btn btn-outline-secondary btn-sm py-2 px-2" onClick={() => handleClear()}>Clear</button>
                        }
                      </div>
                    </div>
                    {
                      newData.attachmentBlob != null &&
                      <span className="badge bg-label-info p-1 mx-1">{newData?.documentFilePath} &nbsp;&nbsp;
                        <label className="cursor" onClick={() => setShowConfirmModal(true)}>X</label>
                      </span>
                    }
                  </div>

                  <div class="col-md-5 p-2">
                    <div class="border rounded">
                      <table class="table table-sm  m-0">
                        <thead>
                          <tr>
                            <th colspan="2">
                              <h6 class="m-0">Current Salary Structure</h6>
                            </th>
                          </tr>
                        </thead>
                        <tbody class="table-border-bottom-0">
                          {
                            salaryStructureToDisplay &&
                            <>
                              <tr>
                                <td><b>Earnings</b></td>
                                <td class="text-end"></td>
                              </tr>
                              {salaryStructureToDisplay.earnings?.length > 0 ? (
                                salaryStructureToDisplay.earnings?.map((item, index) => (
                                  <tr>
                                    <td style={{ paddingLeft: '30px' }}>{item?.salaryHeadName}</td>
                                    <td class="text-end">{Utils.formattedNumber(item?.salaryAmount)}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td style={{ paddingLeft: '30px' }}>No data</td>
                                  <td></td>
                                </tr>
                              )}

                              <tr>
                                <td><b>Deductions</b></td>
                                <td class="text-end"></td>
                              </tr>
                              {salaryStructureToDisplay.deductions?.length > 0 ? (
                                salaryStructureToDisplay.deductions?.map((item, index) => (
                                  <tr>
                                    <td style={{ paddingLeft: '30px' }}>{item?.salaryHeadName}</td>
                                    <td class="text-end">{Utils.formattedNumber(item?.salaryAmount)}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td style={{ paddingLeft: '30px' }}>No data</td>
                                  <td></td>
                                </tr>
                              )}
                              <tr>
                                <td><b>Total Earnings</b></td>
                                <td class="text-end">{Utils.formattedNumber(salaryStructureToDisplay?.totalEarnings)}</td>
                              </tr>
                              <tr>
                                <td><b>Total Deductions</b></td>
                                <td class="text-end">{Utils.formattedNumber(salaryStructureToDisplay?.totalDeductions)}</td>
                              </tr>
                              <tr>
                                <td><b>Net Salary</b></td>
                                <td class="text-end">{Utils.formattedNumber(salaryStructureToDisplay?.netSalary)}</td>
                              </tr>
                            </>
                          }
                          {
                            salaryStructureToDisplay == null &&
                            <tr>
                              <td colSpan="12" className="text-center">
                                <div className="Nodatafound_box">
                                  <h6><i className="bx bx-search"></i> No salary structure available!</h6>
                                </div>
                              </td>
                            </tr>

                          }
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div class="col-md-7 p-2">
                    <div class="border rounded">
                      <table class="table m-0 table-sm  MLSS_table">
                        <thead>
                          <tr>
                            <th colspan="4">
                              <h6 class="m-0">Maternity Leave Salary Structure</h6>
                            </th>
                          </tr>
                        </thead>
                        <tbody class="table-border-bottom-0">
                          {salaryDetails.map((detail, index) => (
                            <tr key={index}>
                              <td>
                                <select className="form-select" value={detail.idSalaryHead} name="salaryHeadType"
                                  onChange={(e) => handleSelectChange(index, e)} required style={{ width: '275px' }}>
                                  <option value={''}>Select</option>
                                  {
                                    salaryHeadList?.map((el) => (
                                      <option value={el.idSalaryHead} key={el.idSalaryHead}>[{el.headType == 'EARNING' ? 'E' : 'D'}] {el.salaryHeadName} ({el.salaryHeadCode})</option>
                                    ))
                                  }
                                </select>
                              </td>
                              {/* <td>
                                <label className="staticWidth">{Utils.capitalizeFirstLetter(detail.salaryHeadType)}</label>
                              </td> */}
                              <td>
                                {/* <input type="number" class="form-control" value={detail.amount} name="amount"
                                  // onChange={(e) => { handleInputChange(index, e); }} 
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (/^\d{0,12}$/.test(value)) {
                                      handleInputChange(index, e);
                                    }
                                  }}
                                  min="0" max="999999999999"
                                  placeholder="Amount" required /> */}
                                <NumericFormat
                                  className="form-control"
                                  value={detail.amount}
                                  onValueChange={(values) => {
                                    const { value } = values;
                                    handleInputChange(index, value);
                                  }}
                                  decimalScale={2} // Allow up to 2 decimal places
                                  allowNegative={false} // Disallow negative numbers
                                  thousandSeparator={true} // Disable thousand separators
                                  allowLeadingZeros={false}
                                  placeholder="Add amount"
                                  maxLength={12}
                                  required
                                />
                              </td>
                              <td>
                                <div class="d-flex">
                                  {(salaryDetails.length > 1) &&
                                    <button type="button" class="btn btn-outline-danger btn-sm border-0" onClick={() => removeRow(index)}>
                                      <i class="bx bx-trash"></i>
                                    </button>
                                  }
                                  {(index == salaryDetails.length - 1) &&
                                    <button type="button" class="btn btn-outline-primary border-0 btn-sm me-2" onClick={() => addRow()}>
                                      <i class="bx bx-plus"></i>
                                    </button>
                                  }
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* <div className="p-2">
                        <label className="badge bg-label-primary staticWidth">Earnings: {Utils.formattedNumber(newData.totalEarnings) ?? 0}</label> &nbsp;&nbsp;
                        <label className="badge bg-label-warning staticWidth">Deductions: {Utils.formattedNumber(newData.totalDeductions) ?? 0}</label> &nbsp;&nbsp;
                        <label className="badge bg-label-info staticWidth">Net Total: {Utils.formattedNumber(newData.netSalary) ?? 0}</label>
                      </div> */}

                      <div className="total_salarycard">
                        <ul className="footerCalcMat">
                          <li>
                            <b>Total Earnings:</b> {Utils.formattedNumber(newData.totalEarnings) ?? 0}
                          </li>
                          <li>
                            <b>Total Deductions:</b> {Utils.formattedNumber(newData.totalDeductions) ?? 0}
                          </li>
                          <li>
                            <b>Net Salary:</b> {Utils.formattedNumber(newData.netSalary) ?? 0}
                          </li>
                        </ul>
                      </div>

                    </div>
                  </div>
                </div>
              </Form>
            </div>
            <div className="modal-footer">
              {
                isEdit &&
                <button className="btn btn-primary btn-sm py-2 px-4 me-2" onClick={(e) => updateMaternityLeaveSalaries(e)}>Update</button>
              }
              {
                !isEdit &&
                <button className="btn btn-primary btn-sm py-2 px-4 me-2" onClick={(e) => saveMaternityLeaveSalaries(e)}>Submit</button>
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
  )
}

export default MaternityLeaveSalaries