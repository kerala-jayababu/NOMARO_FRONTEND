import React, { useEffect, useMemo, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import OvertimeService from "../../core/services/OvertimeService";
import secureLocalStorage from "react-secure-storage";
import moment from "moment";
import CommonService from "../../core/services/CommonService";
import { Form, Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import Select from 'react-select';
import Pagination from "../../components/pagination";
import { NumericFormat } from "react-number-format";

function EmployeeOvertimeTransaction() {

  const [startDate, setStartDate] = useState(new Date('2025-01-01'));
  const [overtimeTransactions, setOvertimeTransactions] = useState([]);
  const userData = JSON.parse(secureLocalStorage.getItem("user"));
  const [overtimeTypes, setOvertimeTypes] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [newData, setNewData] = useState({
    idOvertimeTransaction: 0,
    idEmployee: 0,
    // idOvertimeType: "",
    startDate: "",
    startTime: 0,
    endDate: "",
    endTime: 0,
    durationInHours: 0,
    reasonForOvertime: "",
    file: null,
    attachment: "",
    attachmentDescription: "",
  });
  const [statusType, setStatusType] = useState('');
  const [validated, setValidated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [employeesListOption, setEmployeesListOption] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(overtimeTransactions.length / rowsPerPage);
  const today = new Date();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getEmployeesHeirarchy();
    getOvertimeTypesData();
  }, []);

  useEffect(() => {
    getOTTranasactions();
  }, [startDate, statusType]);

  useEffect(() => {
    const selected = employeesListOption.find(option => option.value === newData.idEmployee);
    setSelectedEmployee(selected);
  }, [newData.idEmployee]);

  useEffect(() => {
    calculateDuration();
  }, [newData.startTime, newData.endTime, newData.startDate, newData.endDate]);

  // useEffect(() => {
  //   if (newData.idOvertimeType == "") return;
  //   const overtimeTypeName = overtimeTypes.find(el => el.value == newData.idOvertimeType);
  //   setNewData(prevState => ({
  //     ...prevState,
  //     overtimeTypeName: overtimeTypeName.displayName ?? ""
  //   }));
  // }, [newData.idOvertimeType]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return overtimeTransactions.slice(startIndex, endIndex);
  }, [overtimeTransactions, currentPage, rowsPerPage]);

  const calculateDuration = () => {
    const startDate = moment(newData.startDate).format('YYYY-MM-DD');
    const endDate = moment(newData.endDate).format('YYYY-MM-DD');
    const startDateTime = new Date(`${startDate}T${newData.startTime}:00`);
    const endDateTime = new Date(`${endDate}T${newData.endTime}:00`);
    const durationInMilliseconds = endDateTime - startDateTime;
    const durationInHours = durationInMilliseconds / (1000 * 60 * 60);
    setNewData(prevState => ({
      ...prevState,
      durationInHours: durationInHours > 0 ? durationInHours : 0
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    console.log(file)
    setNewData(prevState => ({
      ...prevState,
      file: file,
      attachmentDescription: file.name
    }));
  };

  const getEmployeesHeirarchy = () => {
    CommonService.getEmployeesByHierarchy(userData.idEmployee ?? 0).then(res => {
      setEmployeesList(res.data.data);
      const options = res.data.data.map(employee => ({
        value: employee.idEmployee,
        label: employee.employeeName,
      }));
      setEmployeesListOption(options);
    }).catch(err => {
    });
  }

  const getOvertimeTypesData = () => {
    CommonService.getAllOptions().then(res => {
      setOvertimeTypes(res.data.overTimesTypes);
    }).catch(err => {
    });
  }

  const getOTTranasactions = () => {
    const date = moment(startDate).format("YYYY-MM-DD");
    OvertimeService.getEmployeeOvertimeTransactions(userData.idEmployee, date).then(res => {
      setOvertimeTransactions(res.data.data);
    }).catch(err => {
      setOvertimeTransactions([]);
    });
  }

  const getOTTranasactionsById = (id) => {
    OvertimeService.getOvertimeTransactionsById(id).then(res => {
      setOvertimeTransactions(res.data.data);
    }).catch(err => {
      setOvertimeTransactions([]);
    });
  }

  const setupEdit = (item) => {
    setIsEdit(true);
    setNewData({
      idOvertimeTransaction: item.idOvertimeTransaction,
      idEmployee: item.idEmployee,
      // idOvertimeType: item.idOvertimeType,
      overtimeTypeName: item.overtimeTypeName,
      startDate: moment(item.startDate),
      startTime: moment(item.startTime, 'hh:mm:ss').format('HH:mm'),
      endDate: moment(item.endDate),
      endTime: moment(item.endTime, 'hh:mm:ss').format('HH:mm'),
      durationInHours: item.durationInHours,
      reasonForOvertime: item.reasonForOvertime,
      file: item.file,
      attachment: item.attachment,
      attachmentDescription: item.attachmentDescription,
    });
    const selected = employeesListOption.find(option => option.value === newData.idEmployee);
    setSelectedEmployee(selected);
    setShowModal(true);
  }

  const saveOvertimeTransactions = (e) => {
    e.preventDefault();
    if (!newData.startDate || !newData.endDate || !newData.startTime || !newData.endTime) {
      setValidated(true);
      return;
    }

    // Create a FormData object to handle file upload
    const formData = new FormData();
    formData.append('idOvertimeTransaction', newData.idOvertimeTransaction);
    formData.append('idEmployee', userData.idEmployee);
    formData.append('idOvertimeType', 0);
    formData.append('overtimeTypeName', 'NA');
    formData.append('startDate', moment(newData.startDate).format('YYYY-MM-DD'));
    formData.append('startTime', newData.startTime);
    formData.append('endDate', moment(newData.endDate).format('YYYY-MM-DD'));
    formData.append('endTime', newData.endTime);
    formData.append('durationInHours', newData.durationInHours);
    formData.append('reasonForOvertime', newData.reasonForOvertime);
    formData.append('attachmentDescription', newData.attachmentDescription);
    formData.append('appType', 'SELFPORTAL');

    // Append the file if it exists
    if (newData.file) {
      formData.append('file', newData.file);
    }

    OvertimeService.saveOvertimeTransactionsData(formData).then(res => {
      if (res.data.status === 200) {
        // toast.success('Overtime transactions added successfully', {
        //   position: 'top-right',
        //   autoClose: 2000
        // });
        getOTTranasactions();
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

  const updateOvertimeTransactions = (e) => {
    e.preventDefault();
    if (!newData.startDate || !newData.endDate || !newData.startTime || !newData.endTime) {
      setValidated(true);
      return;
    }

    const formData = new FormData();
    formData.append('idOvertimeTransaction', newData.idOvertimeTransaction);
    formData.append('idEmployee', userData.idEmployee);
    formData.append('idOvertimeType', 0);
    formData.append('overtimeTypeName', 'NA');
    formData.append('startDate', moment(newData.startDate).format('YYYY-MM-DD'));
    formData.append('startTime', newData.startTime);
    formData.append('endDate', moment(newData.endDate).format('YYYY-MM-DD'));
    formData.append('endTime', newData.endTime);
    formData.append('durationInHours', newData.durationInHours);
    formData.append('reasonForOvertime', newData.reasonForOvertime);
    formData.append('attachmentDescription', newData.attachmentDescription);
    formData.append('appType', 'SELFPORTAL');

    // Append the file if it exists
    if (newData.file) {
      formData.append('file', newData.file);
    }
    OvertimeService.updateOvertimeTransactionsData(formData).then(res => {
      if (res.data.status === 200) {
        // toast.success('Overtime transactions updated successfully', {
        //   position: 'top-right',
        //   autoClose: 2000
        // });
        getOTTranasactions();
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
      idOvertimeTransaction: 0,
      idEmployee: 0,
      // idOvertimeType: "",
      startDate: "",
      startTime: 0,
      endDate: "",
      endTime: 0,
      durationInHours: 0,
      reasonForOvertime: "",
      file: "",
      attachment: "",
      attachmentDescription: "",
    });
    setSelectedEmployee(null);
    handleClear();
  }

  const handleChange = (selectedOption) => {
    setNewData((prevData) => ({
      ...prevData,
      idEmployee: selectedOption.value
    }));
  };

  const handlePageChange = (page) => setCurrentPage(page);

  const downloadFile = (item) => {
    const base64Data = item.attachmentBlob;
    const fileName = item.attachmentDescription || 'downloaded-file';

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
      attachment: "",
      attachmentDescription: "",
    }));
    setShowConfirmModal(false);
  }

  const handleClear = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      setNewData(prevState => ({
        ...prevState,
        file: null,
        attachment: "",
        attachmentDescription: "",
      }));
    }
  };

  return (
    <>
      <div className="OvertimeTransactionSection ShowMobile">
        <div className="card">
          <div className="card-header">
            <div className="card-header_in">
              <h5 >List of Overtime Transaction</h5>
              
            </div>
            <div className="list_menu justify-content-between">
              <div className="list_searchbox">
                <DatePicker className="form-control" dateFormat="MM/dd/yyyy" placeholderText={'Start Date'}
                  selected={startDate} onChange={(date) => setStartDate(date)} showMonthDropdown
                  showYearDropdown dropdownMode="select" />
              </div>
              <button className="btn btn-primary btn-sm px-4" onClick={() => setShowModal(true)}>
                Add
              </button>
            </div>
          </div>
          <div className="card-body">
            {paginatedData?.length > 0 ? (
              paginatedData?.map((item, index) => (

                <div className="OvertimeTransaction_list ">
                  <div className="row m-0">
                    {/* <div className="col-12 px-0 py-1">
                      <label>Name</label>
                      <p className="m-0">{item?.employeeName}</p>
                    </div>
                    <div className="col-4 px-0 py-1">
                      <label>ID</label>
                      <p className="m-0">{item?.employeeCode}</p>
                    </div> */}
                    <div className="col-4 px-0 py-1">
                      <label>Date</label>
                      <p className="m-0">{moment(item?.startDate).format("MM/DD/YYYY")}</p>
                    </div>

                    <div className="col-4 px-0 py-1">
                      <label>Start Time</label>
                      <p className="m-0">{moment(item?.startTime, 'HH:mm:ss').format("h:mm A")}</p>
                    </div>
                    <div className="col-4 px-0 py-1">
                      <label>Duration</label>
                      <p className="m-0">{item.durationInHours} Hr</p>
                    </div>

                  </div>
                  <div className="row m-0 align-items-end">
                    
                    {/* <div className="col-4 px-0 py-1">
                      <label>End Time</label>
                      <p className="m-0">{moment(item?.endTime, 'HH:mm:ss').format("h:mm A")}</p>
                    </div> */}
                    
                    <div className="col-6 px-0 py-1">
                      <label>Status</label>
                      <div>
                        <span className={`badge ${item.approvalStatus == 'APPROVED' ? 'bg-label-success' : item.approvalStatus == 'SUBMITTED' ? 'bg-label-warning' : item.approvalStatus == 'REJECTED' ? 'bg-label-danger' : 'bg-label-primary'}`}>{item.approvalStatus}</span>
                      </div>
                    </div>
                    <div className="col-6 px-0 py-1 text-end">
                      {
                        item.attachment &&
                        <button className="btn btn-outline-primary border-0 btn-sm">
                          <i className="bx bx-paperclip cursor" onClick={() => downloadFile(item)}></i>
                        </button>
                      }
                      {
                        item.approvalStatus != 'APPROVED' &&
                        <button type="button" className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0" onClick={() => setupEdit(item)}>
                          <span className="tf-icons bx bx-pencil"></span>
                        </button>
                      }
                    </div>
                  </div>

                </div>

              ))
            ) : (
              <div className="OvertimeTransaction_list ">
                <div className="Nodatafound_box text-center py-4">
                  <h6 className="m-0"><i className="bx bx-search"></i> No data available!</h6>
                </div>
              </div>
            )}

            <div className="text-end pt-2">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>

      </div >

      <div className="container-xxl flex-grow-1 container-p-y OvertimeTransactionSection ShowBigDevice">
        <div className="row">
          <div className="col-lg-12">
            <div className="card">
              <div className="card-header  pb-3">
                <h5 className="m-0">List of Overtime Transaction</h5>
                <div className="list_menu">
                  {/* <div className="list_searchbox">
                  <select className="form-select" value={statusType}
                    onChange={(e) => setStatusType(e.target.value)} style={{ width: '150px' }}>
                    <option value={''}>All Status</option>
                    <option value={'SUBMITTED'} key={'SUBMITTED'}>Submitted</option>
                    <option value={'APPROVED'} key={'APPROVED'}>Approved</option>
                    <option value={'REJECTED'} key={'REJECTED'}>Rejected</option>
                  </select>
                </div> */}
                  <div className="list_searchbox">
                    <label className='p-2'>From Date</label>
                    <DatePicker className="form-control" dateFormat="MM/dd/yyyy" placeholderText={'Start Date'}
                      selected={startDate} onChange={(date) => setStartDate(date)} showMonthDropdown
                      showYearDropdown dropdownMode="select" />
                  </div>
                  {/* <div className="list_searchbox">
                  <input type="text" className="form-control" placeholder="Search" value={searchText} maxLength={30}
                    onChange={(e) => {
                      setSearchText(e.target.value);
                      if (e.target.value === "") {
                        getOTTranasactions();
                      }
                    }}
                    onKeyDown={e => e.key === 'Enter' ? getOTTranasactions() : ''} />
                  <i className="bx bx-search cursor" onClick={() => getOTTranasactions()}></i>
                </div> */}
                  <button
                    className="btn btn-primary btn-sm px-4" onClick={() => setShowModal(true)}>
                    Add
                  </button>
                </div>
              </div>
              <div className="card-body">

                <div className="table-responsive ">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        {/* <th className="checkbox_td">
                        <input type="checkbox" className="form-check-input" />
                      </th> */}
                        <th>ID</th>
                        <th>Name</th>
                        {/* <th>Type</th> */}
                        <th>Date</th>
                        <th className="white-space-nowrap">Start Time</th>
                        <th className="white-space-nowrap">End Time</th>
                        <th className="text-center">Duration</th>
                        {/* <th>Reason</th> */}
                        <th>Status</th>
                        <th className="text-center"></th>
                        <th className="text-end"></th>
                      </tr>
                    </thead>
                    <tbody className="table-border-bottom-0">
                      {paginatedData?.length > 0 ? (
                        paginatedData?.map((item, index) => (
                          <tr>
                            {/* <td>
                            {" "}
                            <input type="checkbox" className="form-check-input" />
                          </td> */}
                            <td>{item?.employeeCode}</td>
                            <td className="white-space-nowrap">{item?.employeeName}</td>
                            {/* <td>{item?.overtimeTypeName}</td> */}
                            <td>{moment(item?.startDate).format("MM/DD/YYYY")}</td>
                            <td>{moment(item?.startTime, 'HH:mm:ss').format("h:mm A")}</td>
                            <td>{moment(item?.endTime, 'HH:mm:ss').format("h:mm A")}</td>
                            <td className="text-center">{item.durationInHours} Hr</td>
                            {/* <td>{item.reasonForOvertime}</td> */}
                            <td>
                              <span className={`badge ${item.approvalStatus == 'APPROVED' ? 'bg-label-success' : item.approvalStatus == 'SUBMITTED' ? 'bg-label-warning' : item.approvalStatus == 'REJECTED' ? 'bg-label-danger' : 'bg-label-primary'}`}>{item.approvalStatus}</span>
                            </td>
                            <td>
                              {
                                item.attachment &&
                                <button className="btn btn-outline-primary border-0 btn-sm">
                                  <i className="bx bx-paperclip cursor" onClick={() => downloadFile(item)}></i>
                                </button>
                              }
                            </td>
                            <td className="text-end">
                              {
                                item.approvalStatus != 'APPROVED' &&
                                <button type="button" className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0" onClick={() => setupEdit(item)}>
                                  <span className="tf-icons bx bx-pencil"></span>
                                </button>
                              }
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
          </div >
        </div >
      </div >

      <Modal
        show={showModal} onHide={() => { setShowModal(false); resetValues() }} size='lg'
        aria-labelledby="contained-modal-title-vcenter"
        centered backdrop="static"
        className="p-0"
        keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>
            <h5>Add/Update Overtime Transaction</h5>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="pt-0">
          <div className="accountDetail_card">
            <Form noValidate validated={validated}>
              <div className="accountDetail_card">
                {/* <div className="row m-0">
          <div className="col-md-6 p-2">
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
        </div> */}
                <div className="row m-0">
                  <div className="col-md-6 p-2">
                    <label className="form-label mb-1">Start Date and Time</label>
                    <div className="row m-0">
                      <div className="col-md-6 col-6 ps-0 pe-2">
                        <DatePicker className="form-control" selected={newData.startDate}
                          onChange={(date) => setNewData({ ...newData, startDate: date })}
                          required
                          dateFormat="MM/dd/yyyy"
                          placeholderText='Select Date' showMonthDropdown
                          showYearDropdown maxDate={today} dropdownMode="select" />
                      </div>
                      <div className="col-md-6 col-6 p-0 pe-2">
                        <input type="time" className="form-control ms-2"
                          value={newData.startTime}
                          onChange={(e) => setNewData({ ...newData, startTime: e.target.value })} required />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 p-2">
                    <label className="form-label mb-1">End Date and Time</label>
                    <div className="row m-0">
                      <div className="col-md-6 col-6 p-0 pe-2">
                        <DatePicker className="form-control" selected={newData.endDate}
                          onChange={(date) => setNewData({ ...newData, endDate: date })}
                          required
                          dateFormat="MM/dd/yyyy"
                          placeholderText='Select Date' minDate={newData.startDate} showMonthDropdown
                          showYearDropdown maxDate={today} dropdownMode="select" />
                      </div>
                      <div className="col-md-6 col-6 p-0 pe-2">
                        <input type="time" className="form-control ms-2"
                          value={newData.endTime}
                          onChange={(e) => setNewData({ ...newData, endTime: e.target.value })} required />
                      </div>
                    </div>
                  </div>

                  <div class="col-md-6 p-0">
                    <div class="p-2">
                      <label class="form-label mb-1">Duration in Hrs</label>
                      {/* <input
                type="number"
                className="form-control"
                placeholder="00"
                value={newData.durationInHours} disabled={true}
                onChange={(e) => setNewData({ ...newData, durationInHours: e.target.value })} required
              /> */}
                      <NumericFormat
                        className="form-control"
                        value={newData.durationInHours} disabled={true}
                        decimalScale={2} // Allow up to 2 decimal places
                        allowNegative={false} // Disallow negative numbers
                        thousandSeparator={true} // Disable thousand separators
                        allowLeadingZeros={false}
                        placeholder="0"
                        maxLength={12}
                        required
                      />
                    </div>
                    {/* <div class="p-2">
              <label class="form-label mb-1"> Attachments </label>
              <input type="file" className="form-control" onChange={handleFileChange} />
              {
                newData.attachment &&
                <span className="badge bg-label-info p-1">{newData.attachmentDescription} &nbsp;&nbsp;
                  <label className="cursor" onClick={() => setShowConfirmModal(true)}>X</label>
                </span>
              }
            </div> */}
                    <div className="p-2">
                      <label className="form-label mb-1">Attachments </label>
                      <div className="row p-1">
                        <div className="col-md-9 col-10 p-1">
                          <input type="file" className="form-control" onChange={handleFileChange} ref={fileInputRef} />
                        </div>
                        <div className="col-md-2 col-2 p-1">
                          {
                            newData.file != null &&
                            <button className="btn btn-outline-secondary btn-sm py-2 px-2" onClick={() => handleClear()}>Clear</button>
                          }
                        </div>
                      </div>
                      {
                        newData.attachment &&
                        <span className="badge bg-label-info p-1">{newData?.attachmentDescription} &nbsp;&nbsp;
                          <label className="cursor" onClick={() => setShowConfirmModal(true)}>X</label>
                        </span>
                      }
                    </div>
                  </div>

                  <div class="col-md-6 p-2">
                    <label class="form-label mb-1">Reason for Overtime</label>
                    <textarea className="form-control" rows={5}
                      value={newData.reasonForOvertime} maxlength="100"
                      onChange={(e) => setNewData({ ...newData, reasonForOvertime: e.target.value })}>
                    </textarea>
                    <small>{100 - newData.reasonForOvertime.length} / 100 characters remaining</small>
                  </div>
                </div>
              </div>
            </Form>
          </div>
          <div className="modal-footer">
            {
              isEdit &&
              <button className="btn btn-primary btn-sm py-2 px-4 me-2" onClick={(e) => updateOvertimeTransactions(e)}>Update</button>
            }
            {
              !isEdit &&
              <button className="btn btn-primary btn-sm py-2 px-4 me-2" onClick={(e) => saveOvertimeTransactions(e)}>Submit</button>
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

      <div
        className="modal fade"
        id="Rejected_Overtime"
        tabindex="-1"
        aria-hidden="true"
      >
        <div
          className="modal-dialog modal-sm  modal-dialog-centered"
          role="document"
        >
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Reason for rejection</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body pt-1 text-center">
              <div className="text-start pb-3">
                <textarea className="form-control" rows="8">
                  {" "}
                </textarea>
              </div>
              <div className="text-center mb-5 d-none">
                <div className="mb-4 text-danger">
                  <i className="bx bx-x-circle fs-2"></i>
                </div>
                <h6> Overtime Transaction Rejected</h6>
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-sm py-2 px-4 me-2"
              >
                Submit
              </button>
              <button
                type="submit"
                className="btn btn-outline-secondary  btn-sm py-2 px-4"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="modal fade"
        id="Approved_Overtime"
        tabindex="-1"
        aria-hidden="true"
      >
        <div
          className="modal-dialog modal-sm  modal-dialog-centered"
          role="document"
        >
          <div className="modal-content">
            <div className="modal-header">
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body pt-1 text-center">
              <div className="text-center mb-5">
                <div className="mb-4 text-success">
                  <i className="bx bx-check-circle fs-2"></i>
                </div>
                <h6>
                  Are you want to <br /> Approve Selected Records
                </h6>
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-sm py-2 px-4 me-2"
              >
                Submit
              </button>
              <button
                type="submit"
                className="btn btn-outline-secondary  btn-sm py-2 px-4"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>

  );
}

export default EmployeeOvertimeTransaction;
