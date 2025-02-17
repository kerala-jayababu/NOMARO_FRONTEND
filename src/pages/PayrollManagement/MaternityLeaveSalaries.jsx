import React, { useEffect, useState } from "react";
import MaternityService from '../../core/services/MaternityService';
import moment from "moment";
import CommonService from "../../core/services/CommonService";
import { Form, Modal } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import Utils from "../../utils/Utils";

function MaternityLeaveSalaries() {
  const [employeesList, setEmployeesList] = useState([]);
  const [maternityLeaveSalaries, setMaternityLeaveSalaries] = useState([]);
  const [salaryHeadList, setSalaryHeadList] = useState([]);
  const [salaryMonthsList, setSalaryMonthsList] = useState([]);
  const [salaryStructure, setSalaryStructure] = useState([]);
  const [salaryStructureToDisplay, setSalaryStructureToDisplay] = useState({});
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
      setSalaryStructureToDisplay({})
      return;
    }
    const empSalaryStructure = salaryStructure.find(emp => emp.idEmployee == newData.idEmployee);
    setSalaryStructureToDisplay(empSalaryStructure);
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

  const getEmployeesData = () => {
    CommonService.getEmployeeList().then(res => {
      setEmployeesList(res.data.data);
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
      const filterred = salMonths.slice(0, 12);
      setSalaryMonthsList(filterred);
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

  const handleInputChange = (index, event) => {
    const { value } = event.target;
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
    });
    setSalaryDetails(item.maternityLeaveSalaryDetailDto);
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

  const saveMaternityLeaveSalaries = (e) => {
    e.preventDefault();
    if (!newData.idEmployee || !newData.idSalaryMonthFrom) {
      setValidated(true);
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
    passData['maternityLeaveSalaryDetailDto'] = salaryDetails;

    // const netSalary = totalEarnings - totalDeductions;
    // passData['totalEarnings'] = totalEarnings;
    // passData['totalDeductions'] = totalDeductions;
    // passData['netSalary'] = netSalary;

    delete passData['totalEarnings'];
    delete passData['totalDeductions'];
    delete passData['netSalary'];

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
      netSalary: 0,
      totalEarnings: 0,
      totalDeductions: 0,
    });
    setSalaryDetails([
      {
        idSalaryHead: 0,
        salaryHeadType: "",
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
                  <input type="search" className="form-control" placeholder="Search" value={searchText} onChange={(e) => setSearchText(e.target.value)}
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
                      <th>Date From</th>
                      <th>Date To</th>
                      <th className="text-end">Net Salary</th>
                      <th className="text-end">Maternity Salary</th>
                      <th className="text-end"></th>
                    </tr>
                  </thead>
                  <tbody className="table-border-bottom-0">
                    {maternityLeaveSalaries?.length > 0 ? (
                      maternityLeaveSalaries?.map((item, index) => (
                        <tr>
                          <td>{item?.employeeCode}</td>
                          <td>{item?.employeeName}</td>
                          <td>{item?.designationName}</td>
                          <td>{moment(item?.maternityLeaveFrom).format("MM/DD/YYYY")}</td>
                          <td>{moment(item?.maternityLeaveTo).format("MM/DD/YYYY")}</td>
                          <td className="text-end">{Utils.formattedNumber(item.defaultNetSalary)}.00</td>
                          <td className="text-end">{Utils.formattedNumber(item.maternityLeaveNetSalary)}.00</td>
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
                            <td><b>Earnings</b></td>
                            <td class="text-end"></td>
                            {/* {salaryStructureToDisplay?.totalEarnings ? Utils.formattedNumber(salaryStructureToDisplay?.totalEarnings) : 0} */}
                          </tr>
                          <tr>
                            <td style={{ paddingLeft: '30px' }}>Basic Pay</td>
                            <td class="text-end"></td>
                          </tr>
                          <tr>
                            <td style={{ paddingLeft: '30px' }}>Allowance</td>
                            <td class="text-end"></td>
                          </tr>

                          <tr>
                            <td><b>Deduction</b></td>
                            <td class="text-end"></td>
                            {/* {salaryStructureToDisplay?.totalDeductions ? Utils.formattedNumber(salaryStructureToDisplay?.totalDeductions) : 0} */}
                          </tr>
                          <tr>
                            <td style={{ paddingLeft: '30px' }}>Insurance</td>
                            <td class="text-end"></td>
                          </tr>
                          <tr>
                            <td style={{ paddingLeft: '30px' }}>Provident Fund</td>
                            <td class="text-end"></td>
                          </tr>
                          <tr>
                            <td><b>Net Salary</b></td>
                            <td class="text-end"><b>0</b></td>
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
                                <select className="form-select" value={detail.idSalaryHead} name="salaryHeadType"
                                  onChange={(e) => handleSelectChange(index, e)} required>
                                  <option value={''}>Select</option>
                                  {
                                    salaryHeadList?.map((el) => (
                                      <option value={el.idSalaryHead} key={el.idSalaryHead}>{el.salaryHeadName}</option>
                                    ))
                                  }
                                </select>
                              </td>
                              <td>
                                <label>{detail.salaryHeadType}</label>
                              </td>
                              <td>
                                <input type="number" class="form-control" value={detail.amount} name="amount"
                                  onChange={(e) => { handleInputChange(index, e); }}
                                  placeholder="Amount" required />
                              </td>
                              <td>
                                <div class="d-flex">
                                  {(index == salaryDetails.length - 1) &&
                                    <button type="button" class="btn btn-outline-primary border-0 btn-sm me-2" onClick={() => addRow()}>
                                      <i class="bx bx-plus"></i>
                                    </button>
                                  }
                                  {(salaryDetails.length > 1) &&
                                    <button type="button" class="btn btn-outline-danger btn-sm border-0" onClick={() => removeRow(index)}>
                                      <i class="bx bx-trash"></i>
                                    </button>
                                  }
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="p-2">
                        <label className="badge bg-label-primary">Earnings: {newData.totalEarnings ?? 0}</label> &nbsp;&nbsp;
                        <label className="badge bg-label-warning">Deductions: {newData.totalDeductions ?? 0}</label> &nbsp;&nbsp;
                        <label className="badge bg-label-info">Net Total: {newData.netSalary ?? 0}</label>
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
      </div>
    </div>
  )
}

export default MaternityLeaveSalaries