import React, { useEffect, useState } from "react";
import MaternityService from '../../core/services/MaternityService';
import moment from "moment";
import CommonService from "../../core/services/CommonService";
import { Form, Modal } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

function MaternityLeaveSalaries() {
  const [employeesList, setEmployeesList] = useState([]);
  const [maternityLeaveSalaries, setMaternityLeaveSalaries] = useState([]);
  const [salaryHeadList, setSalaryHeadList] = useState([]);
  const [salaryMonthsList, setSalaryMonthsList] = useState([]);
  const [salaryStructure, setSalaryStructure] = useState([]);
  const [salaryStructureToDisplay, setSalaryStructureToDisplay] = useState({});
  const [startDate, setStartDate] = useState(new Date());
  const [searchText, setSearchText] = useState('');
  const [newData, setNewData] = useState({
    idMaternityLeaveSalary: 0,
    idEmployee: 0,
    maternityLeaveFrom: "",
    maternityLeaveTo: "",
    idSalaryMonthFrom: 0,
    idSalaryMonthTo: 0,
  });
  const [salaryDetails, setSalaryDetails] = useState([
    {
      idSalaryHead: 0,
      salaryHeadType: 0,
      amount: 0,
      amountInUSD: 0
    },
  ]);
  const [validated, setValidated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    getSalaryHeadData();
    getEmployeesData();
    getSalaryMonths();
    getSalaryStructure();
  }, []);

  useEffect(() => {
    getMaternityLeaveSalaries();
  }, [startDate, searchText]);

  useEffect(() => {
    if (newData.idEmployee == 0) return;
    const empSalaryStructure = salaryStructure.find(emp => emp.idEmployee == newData.idEmployee);
    setSalaryStructureToDisplay(empSalaryStructure);
  }, [newData.idEmployee]);

  // useEffect(() => {
  //   if (newData.maternityLeaveFrom == "" || newData.maternityLeaveTo == "") return;
  //   const fromDate = moment(new Date(newData.maternityLeaveFrom)).format('DD-MM-YYYY');
  //   const toDate = moment(new Date(newData.maternityLeaveTo)).format('DD-MM-YYYY');;
  //   console.log(fromDate)
  //   console.log(toDate)
  // }, [newData.maternityLeaveFrom, newData.maternityLeaveTo]);

  const getEmployeesData = () => {
    CommonService.getEmployeeList().then(res => {
      setEmployeesList(res.data.data);
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
      setSalaryMonthsList(res.data);
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
    });
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

  const handleInputChange = (index, event) => {
    const { name, value } = event.target;
    const newSalaryDetails = [...salaryDetails];
    newSalaryDetails[index][name] = value;
    setSalaryDetails(newSalaryDetails);
  };

  const setupEdit = (item) => {
    setIsEdit(true);
    setNewData(item);
    setShowModal(true);
  }

  const saveMaternityLeaveSalaries = (e) => {
    // const isValid = validateForm();
    // if (isValid) {
    //   console.log('Submitted Salary Details:', salaryDetails);
    // } else {
    //   console.log('Form has errors. Please fix them.');
    // }
    e.preventDefault();
    if (!newData.idEmployee || !newData.idSalaryMonthFrom) {
      setValidated(true);
      return;
    }
    let passData = newData;
    passData['maternityLeaveFrom'] = moment(passData['maternityLeaveFrom']).format('YYYY-MM-DD');
    passData['maternityLeaveTo'] = moment(passData['maternityLeaveTo']).format('YYYY-MM-DD');
    passData['maternityLeaveSalaryDetailDto'] = salaryDetails;
    MaternityService.saveMaternityLeaveSalariesData(passData).then(res => {
      if (res.data.status === 200) {
        toast.success('Maternity leave salaries added successfully', {
          position: 'top-right',
          autoClose: 2000
        });
        getMaternityLeaveSalaries();
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

  const updateMaternityLeaveSalaries = (e) => {
    e.preventDefault();
    if (!newData.idEmployee || !newData.netSalary) {
      setValidated(true);
      return;
    }
    let passData = newData;
    passData['maternityLeaveFrom'] = moment(passData['maternityLeaveFrom']).format('YYYY-MM-DD');
    passData['maternityLeaveTo'] = moment(passData['maternityLeaveTo']).format('YYYY-MM-DD');
    MaternityService.updateMaternityLeaveSalariesData(passData).then(res => {
      if (res.data.status === 200) {
        toast.success('Maternity leave salaries updated successfully', {
          position: 'top-right',
          autoClose: 2000
        });
        getMaternityLeaveSalaries();
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
    setNewData({
      idMaternityLeaveSalary: 0,
      idEmployee: 0,
      maternityLeaveFrom: "",
      maternityLeaveTo: "",
      idSalaryMonthFrom: 0,
      idSalaryMonthTo: 0,
    });
    setSalaryDetails([
      {
        idSalaryHead: 0,
        salaryHeadType: 0,
        amount: 0,
        amountInUSD: 0
      },
    ]);
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">List of Maternity Leave Salaries</h5>

              <div className="list_menu">
                <div className="list_searchbox">
                  <DatePicker className="form-control" dateFormat="MM/dd/yyyy" placeholderText={'Start Date'}
                    selected={startDate} onChange={(date) => setStartDate(date)} />
                </div>
                <div className="list_searchbox">
                  <input type="search" className="form-control" placeholder="Search" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
                  <i className="bx bx-search"></i>
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
                      <th>Date From</th>
                      <th>Date To</th>
                      <th className="text-end">Net Salary</th>
                      <th className="text-end">Maternity Salary</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody className="table-border-bottom-0">
                    {maternityLeaveSalaries?.length > 0 ? (
                      maternityLeaveSalaries?.map((item, index) => (
                        <tr>
                          <th>{item?.employeeCode}</th>
                          <td>{item?.employeeName}</td>
                          <td>{item?.designationName}</td>
                          <td>{moment(item?.maternityLeaveFrom).format("MM/DD/YYYY")}</td>
                          <td>{moment(item?.maternityLeaveTo).format("MM/DD/YYYY")}</td>
                          <td className="text-end">{(item.defaultNetSalary).toFixed(2)}</td>
                          <td className="text-end">{(item.netSalary).toFixed(2)}</td>
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
                {/* <div className="mb-2">
                  <label className="form-label mb-1">Employee Name</label>
                  <select className="form-select" value={newData.idEmployee}
                    onChange={(e) => setNewData({ ...newData, idEmployee: e.target.value })} required>
                    <option value={''}>Select</option>
                    {
                      employeesList?.map((el) => (
                        <option value={el.idEmployee} key={el.idEmployee}>{el.fullName}</option>
                      ))
                    }
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label mb-1">Month From</label>
                  <div className="row m-0">
                    <div className="col-md-12 ps-0 pe-2">
                      <DatePicker className="form-control" selected={newData.maternityLeaveFrom}
                        onChange={(date) => setNewData({ ...newData, maternityLeaveFrom: date })}
                        required
                        dateFormat="dd/MM/yyyy"
                        placeholderText='From Date' />
                    </div>
                  </div>
                </div>
                <div className="mb-2">
                  <label className="form-label mb-1">Month To</label>
                  <div className="row m-0">
                    <div className="col-md-12 ps-0 pe-2">
                      <DatePicker className="form-control" selected={newData.maternityLeaveTo}
                        onChange={(date) => setNewData({ ...newData, maternityLeaveTo: date })}
                        required
                        dateFormat="dd/MM/yyyy"
                        placeholderText='To Date' />
                    </div>
                  </div>
                </div>
                <div className="mb-2">
                  <label className="form-label mb-1">Net Salary</label>
                  <input className="form-control" type="number" value={newData.netSalary}
                    onChange={(e) => setNewData({ ...newData, netSalary: e.target.value })}
                    required placeholder='Add amount' />
                </div>
                <div className="mb-2">
                  <label className="form-label mb-1">Salary During Maternity Leave</label>
                  <input className="form-control" type="number" value={newData.maternityLeaveSalary}
                    onChange={(e) => setNewData({ ...newData, maternityLeaveSalary: e.target.value })}
                    required placeholder='Add amount' />
                </div> */}


                <div class="row m-0">
                  <div class="col-md-5 p-2">
                    <label class="form-label mb-1">Employee Name</label>
                    <select className="form-select" value={newData.idEmployee}
                      onChange={(e) => setNewData({ ...newData, idEmployee: e.target.value })} required>
                      <option value={''}>Select</option>
                      {
                        employeesList?.map((el) => (
                          <option value={el.idEmployee} key={el.idEmployee}>{el.fullName}</option>
                        ))
                      }
                    </select>
                  </div>

                  <div class="col-md-3 p-2">
                    <label class="form-label mb-1">Month From</label>
                    {/* <div className="row m-0">
                      <div className="col-md-12 ps-0 pe-2">
                        <DatePicker className="form-control" selected={newData.maternityLeaveFrom}
                          onChange={(date) => setNewData({ ...newData, maternityLeaveFrom: date })}
                          required
                          dateFormat="dd/MM/yyyy"
                          placeholderText='From Date' />
                      </div>
                    </div> */}
                    <select className="form-select" value={newData.idSalaryMonthFrom}
                      onChange={(e) => setNewData({ ...newData, idSalaryMonthFrom: e.target.value })} required>
                      <option value={''}>Select</option>
                      {
                        salaryMonthsList?.map((el) => (
                          <option value={el.idSalaryMonth} key={el.idSalaryMonth}>{el.salaryMonthText}</option>
                        ))
                      }
                    </select>
                  </div>
                  <div class="col-md-3 p-2">
                    <label class="form-label mb-1">Month To</label>
                    {/* <div className="row m-0">
                      <div className="col-md-12 ps-0 pe-2">
                        <DatePicker className="form-control" selected={newData.maternityLeaveTo}
                          onChange={(date) => setNewData({ ...newData, maternityLeaveTo: date })}
                          required
                          dateFormat="dd/MM/yyyy"
                          placeholderText='To Date' />
                      </div>
                    </div> */}
                    <select className="form-select" value={newData.idSalaryMonthTo}
                      onChange={(e) => setNewData({ ...newData, idSalaryMonthTo: e.target.value })} required>
                      <option value={''}>Select</option>
                      {
                        salaryMonthsList?.map((el) => (
                          <option value={el.idSalaryMonth} key={el.idSalaryMonth}>{el.salaryMonthText}</option>
                        ))
                      }
                    </select>
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
                          <tr>
                            <td>Earnings</td>
                            <td class="text-end">{salaryStructureToDisplay?.totalEarnings}</td>
                          </tr>
                          <tr>
                            <td>Deduction</td>
                            <td class="text-end">{salaryStructureToDisplay?.totalDeductions}</td>
                          </tr>
                          {/* <tr>
                            <td>Basic Pay</td>
                            <td class="text-end">10,000</td>
                          </tr>
                          <tr>
                            <td>Insurance</td>
                            <td class="text-end">5,000</td>
                          </tr>
                          <tr>
                            <td>Provident Fund</td>
                            <td class="text-end">1,000</td>
                          </tr> */}
                          <tr>
                            <td><b>Net Salary</b></td>
                            <td class="text-end"><b>{salaryStructureToDisplay?.netSalary}</b></td>
                          </tr>
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
                                <select className="form-select" value={detail.salaryHeadType} name="salaryHeadType"
                                  onChange={(e) => handleInputChange(index, e)} required>
                                  <option value={''}>Select</option>
                                  {
                                    salaryHeadList?.map((el) => (
                                      <option value={el.idSalaryHead} key={el.idSalaryHead}>{el.salaryHeadName}</option>
                                    ))
                                  }
                                </select>
                              </td>
                              <td>
                                <input type="number" class="form-control" value={detail.amount} name="amount"
                                  onChange={(e) => handleInputChange(index, e)}
                                  placeholder="Amount" required />
                              </td>
                              <td>
                                <div class="d-flex">
                                  <button type="button" class="btn btn-outline-primary border-0 btn-sm me-2" onClick={() => addRow()}>
                                    <i class="bx bx-plus"></i>
                                  </button>
                                  <button type="button" class="btn btn-outline-danger btn-sm border-0" onClick={() => removeRow(index)}>
                                    <i class="bx bx-trash"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
      </div>
    </div>
  )
}

export default MaternityLeaveSalaries