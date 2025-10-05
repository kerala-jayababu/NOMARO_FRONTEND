import React, { useState, useEffect } from "react";
import Select from "react-select";
import CommonService from "../../core/services/CommonService";
import { Form, Modal } from "react-bootstrap";
import moment from "moment";
import RentFreeQuarterService from "../../core/services/RentFreeQuarterService";
import { NumericFormat } from "react-number-format";

function RentFreeAllowances() {
  const [employeesListOption, setEmployeesListOption] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [selectedEmployeeData, setSelectedEmployeeData] = useState({
    designation: '',
    department: ''
  });
  const [rentFreeQuarterTaxPercentage, setRentFreeQuarterTaxPercentage] = useState(null);
  const [financialYearsList, setFinancialYearsList] = useState([]);
  const [validated, setValidated] = useState(false);
  const [formSubmitData, setFormSubmitData] = useState({
    idRentFreeQuarterAllowance: 0,
    idEmployee: 0,
    duration: 0,
    financialYear: 0,
    allottedSqFt: 0,
    sqFtRate: 0,
    annualRFQAllowance: 0,
    taxFreeAllowance: 0,
    taxableAmount: 0,
    taxAmount: 0,
    netRFQAllowance: 0
  });
  const [isEdit, setIsEdit] = useState(false);
  const [rentFreeQuarterList, setRentFreeQuarterList] = useState([]);
  const [selFinancialYear, setSelFinancialYear] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [financialYear, setFinancialYear] = useState('');

  useEffect(() => {
    getEmployeesList();
    getSystemParameters();
    getFinancialYears();
  }, []);

  useEffect(() => {
    if (selFinancialYear != null) {
      setRentFreeQuarterList([]);
      getRentFreeQuarterList();
    }
  }, [selFinancialYear]);

  const getRentFreeQuarterList = () => {
    setLoading(true);
    RentFreeQuarterService.getAllRentFreeAllowances(searchText, selFinancialYear).then(res => {
      setRentFreeQuarterList(res.data.data);
      setLoading(false);
    }).catch(err => {
      setLoading(false);
    });
  };

  const getEmployeesList = () => {
    CommonService.getEmployeeList().then(res => {
      res.data.data.sort((a, b) => a.fullName.localeCompare(b.fullName));
      setEmployeesList(res.data.data);
      const options = res.data.data.map(employee => ({
        value: employee.idEmployee,
        label: employee.fullName,
        employeeCode: employee.employeeCode,
        designation: employee.designationName,
        department: employee.departmentName
      }));
      setEmployeesListOption(options);
    }).catch(err => {
    });
  };

  const getSystemParameters = () => {
    CommonService.getSystemParameters().then(res => {
      let filteredData = res.data.data.filter(item => item.parameterName === "RentFreeQuarterTaxPercentage");
      setRentFreeQuarterTaxPercentage(filteredData[0]);
    }).catch(err => {
    });
  };

  const getFinancialYears = () => {
    CommonService.getAllFinancialYears().then(res => {
      setFinancialYearsList(res.data);
    }).catch(err => {
      console.log(err)
      setFinancialYearsList([]);
    });
  }

  const resetValues = () => {
    setFormSubmitData({
      idRentFreeQuarterAllowance: 0,
      idEmployee: 0,
      duration: 0,
      financialYear: 0,
      allottedSqFt: 0,
      sqFtRate: 0,
      annualRFQAllowance: 0,
      taxFreeAllowance: 0,
      taxableAmount: 0,
      taxAmount: 0,
      netRFQAllowance: 0
    });
    setSelectedEmployeeData({
      designation: '',
      department: ''
    });
    setIsEdit(false);
    setFinancialYear('');
  };

  const handleEmployeeChange = (selectedOption) => {
    if (selectedOption) {
      const employeeData = employeesList.find(emp => emp.idEmployee === selectedOption.value);
      setFormSubmitData(prev => ({
        ...prev,
        idEmployee: selectedOption.value
      }));
      setSelectedEmployeeData({
        designation: selectedOption.designation || employeeData?.designationName,
        department: selectedOption.department || employeeData?.departmentName
      });
    } else {
      setFormSubmitData(prev => ({
        ...prev,
        idEmployee: 0
      }));
      setSelectedEmployeeData({
        designation: '',
        department: ''
      });
    }
  };

  const handleInputChange = (field, value) => {
    const newData = {
      ...formSubmitData,
      [field]: value
    };

    if (['duration', 'allottedSqFt', 'sqFtRate'].includes(field)) {
      const annualRFQ = newData.duration * newData.allottedSqFt * newData.sqFtRate;
      const taxFree = annualRFQ / 3;
      const taxable = annualRFQ - taxFree;
      const taxAmount = taxable * (rentFreeQuarterTaxPercentage?.parameterValue / 100);
      const netRFQ = annualRFQ - taxAmount;

      newData.annualRFQAllowance = annualRFQ;
      newData.taxFreeAllowance = taxFree;
      newData.taxableAmount = taxable;
      newData.taxAmount = taxAmount;
      newData.netRFQAllowance = netRFQ;
    }

    setFormSubmitData(newData);
  };

  const handleFinancialYearChange = (value) => {
    setFinancialYear(value);
    handleInputChange('financialYear', value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    const payload = {
      idRentFreeQuarterAllowance: formSubmitData.idRentFreeQuarterAllowance,
      idEmployee: formSubmitData.idEmployee,
      duration: formSubmitData.duration,
      financialYear: formSubmitData.financialYear,
      allottedSqFt: formSubmitData.allottedSqFt,
      sqFtRate: formSubmitData.sqFtRate,
      annualRFQAllowance: formSubmitData.annualRFQAllowance,
      taxFreeAllowance: formSubmitData.taxFreeAllowance,
      taxableAmount: formSubmitData.taxableAmount,
      taxAmount: formSubmitData.taxAmount,
      netRFQAllowance: formSubmitData.netRFQAllowance,
      taxRate: isEdit ? formSubmitData.taxRate : rentFreeQuarterTaxPercentage?.parameterValue
    };

    if (isEdit) {
      setLoading(true);
      RentFreeQuarterService.updateRentFreeQuarterAllowance(payload).then(res => {
        if (res.data.success) {
          setShowModal(false);
          getRentFreeQuarterList();
          resetValues();
        }
        setLoading(false);
      }).catch(err => {
        setLoading(false);
      });
    } else {
      setLoading(true);
      RentFreeQuarterService.addRentFreeQuarterAllowance(payload).then(res => {
        if (res.data.success) {
          setShowModal(false);
          getRentFreeQuarterList();
          resetValues();
        }
        setLoading(false);
      }).catch(err => {
        setLoading(false);
      });
    }
  };

  const getRentFreeQuarterById = (id) => {
    setLoading(true);
    RentFreeQuarterService.getAllRentFreeAllowanceById(id).then(res => {
      setLoading(false);
      handleEdit(res.data.data);
    }).catch(err => {
      setLoading(false);
    });
  };

  const handleEdit = (item) => {
    setIsEdit(true);

    const employee = employeesList.find(emp => emp.idEmployee === item.idEmployee);
    const employeeOption = employeesListOption.find(opt => opt.value === item.idEmployee);

    setFormSubmitData({
      idRentFreeQuarterAllowance: item.idRentFreeQuarterAllowance,
      idEmployee: item.idEmployee,
      duration: item.duration,
      financialYear: item.financialYear,
      allottedSqFt: item.allottedSqft,
      sqFtRate: item.sqFtRate,
      annualRFQAllowance: item.annualRFQAllowance,
      taxFreeAllowance: item.taxFreeAllowance,
      taxableAmount: item.taxableAmount,
      taxAmount: item.taxAmount,
      netRFQAllowance: item.netRFQAllowance,
      taxRate: item.taxRate
    });

    setSelectedEmployeeData({
      designation: employee?.designationName || employeeOption?.designation,
      department: employee?.departmentName || employeeOption?.department
    });

    setFinancialYear(item.financialYear);
    setShowModal(true);
  };

  const handleModalChange = () => {
    resetValues();
    setShowModal(true);
  };

  const handleSearch = () => {
    getRentFreeQuarterList();
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">List of Rent-Free Quarters Allowances</h5>
              <div className="list_menu">
                <div className="list_searchbox">
                  <select
                    className="form-select"
                    value={selFinancialYear || ''}
                    onChange={(e) => setSelFinancialYear(e.target.value || null)}
                    style={{ width: '250px' }}
                  >
                    <option value={''}>Select financial year</option>
                    {financialYearsList.map(stat => (
                      <option key={stat.idFinancialYear} value={stat.idFinancialYear}>
                        {moment(stat.financialYearFrom).format("MMM YYYY")} to {moment(stat.financialYearTo).format("MMM YYYY")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="list_searchbox">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search"
                    value={searchText}
                    maxLength={30}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' ? handleSearch() : ''}
                  />
                  <i className="bx bx-search cursor" onClick={handleSearch}></i>
                </div>
                <button className="btn btn-primary btn-sm px-4" onClick={handleModalChange}>Add</button>
              </div>
            </div>
            <div className="card-body">
              <div className="custom-table-wrapper">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Emp. Code</th>
                      <th>Employee Name</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th className="text-end">Annual RFQ</th>
                      <th className="text-end">Tax Free</th>
                      <th className="text-end">Taxable Amount</th>
                      <th className="text-end">Tax Amount</th>
                      <th className="text-end">Net Rent</th>
                      <th></th>
                    </tr>
                  </thead>
                  {!loading && rentFreeQuarterList.length > 0 &&
                    <tbody>
                      {rentFreeQuarterList.map(item => (
                        <tr key={item.idRentFreeQuarterAllowance}>
                          <td>{item.employeeCode}</td>
                          <td>{item.employeeName}</td>
                          <td>{item.departmentName}</td>
                          <td>{item.designationName}</td>
                          <td className="text-end">
                            {new Intl.NumberFormat("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(item.annualRFQAllowance || item.totalAnnualRent)}
                          </td>
                          <td className="text-end">
                            {new Intl.NumberFormat("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(item.taxFreeAllowance || (item.totalAnnualRent / 3))}
                          </td>
                          <td className="text-end">
                            {new Intl.NumberFormat("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(item.taxableAmount || (item.totalAnnualRent * 2 / 3))}
                          </td>
                          <td className="text-end">
                            {new Intl.NumberFormat("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(item.taxAmount || (item.totalAnnualRent * 2 / 3 * (item.taxRate / 100)))}
                          </td>
                          <td className="text-end">
                            {new Intl.NumberFormat("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(item.netRFQAllowance || (item.totalAnnualRent - (item.totalAnnualRent * 2 / 3 * (item.taxRate / 100))))}
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
                              onClick={() => getRentFreeQuarterById(item.idRentFreeQuarterAllowance)}
                            >
                              <span className="tf-icons bx bx-pencil"></span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  }
                  {loading &&
                    <tbody>
                      <tr>
                        <td colSpan="10" className="text-center">
                          <div className="Nodatafound_box">
                            <h6> Loading...</h6>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  }
                  {!loading && rentFreeQuarterList.length === 0 && (
                    <tbody>
                      <tr>
                        <td colSpan="10" className="text-center">
                          <div className="Nodatafound_box">
                            <h6><i className="bx bx-search"></i> No data available!</h6>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  )}
                </table>
              </div>
            </div>

            <Modal
              show={showModal}
              onHide={() => { setShowModal(false); resetValues(); }}
              size='lg'
              aria-labelledby="contained-modal-title-vcenter"
              centered
              backdrop="static"
              keyboard={false}
            >
              <Modal.Header closeButton>
                <Modal.Title>
                  <h5>{isEdit ? 'Update' : 'Add'} Rent-Free Quarters Allowance</h5>
                </Modal.Title>
              </Modal.Header>

              <Modal.Body>
                <div className="accountDetail_card">
                  <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    <div className="modal-body">
                      <div className="mb-3">
                        <label className="form-label mb-1">Employee Name*</label>
                        <Select
                          options={employeesListOption}
                          isSearchable
                          placeholder={'Select Employee'}
                          className="textSize"
                          required
                          value={employeesListOption.find(option => option.value === formSubmitData.idEmployee) || null}
                          onChange={handleEmployeeChange}
                        />
                      </div>

                      {selectedEmployeeData?.department &&
                        <div className='mb-3'>
                          <span className="fw-semibold">
                            {selectedEmployeeData.department}, {selectedEmployeeData.designation}
                          </span>
                        </div>
                      }

                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label className="form-label mb-1">Financial Year*</label>
                          <select
                            className="form-select"
                            value={financialYear}
                            onChange={(e) => handleFinancialYearChange(e.target.value)}
                            required
                          >
                            <option value="">Select financial year</option>
                            {financialYearsList.map(stat => (
                              <option key={stat.idFinancialYear} value={stat.idFinancialYear}>
                                {moment(stat.financialYearFrom).format("MMM YYYY")} to {moment(stat.financialYearTo).format("MMM YYYY")}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label mb-1">Duration (Months)*</label>
                          <NumericFormat
                            className="form-control"
                            value={formSubmitData.duration}
                            onValueChange={(values) => handleInputChange('duration', values.floatValue || 0)}
                            decimalScale={0}
                            allowNegative={false}
                            thousandSeparator={false}
                            allowLeadingZeros={false}
                            min={1}
                            max={12}
                            required
                          />
                          <div className="invalid-feedback">
                            Please enter duration between 1 and 12 months
                          </div>
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label className="form-label mb-1">Allotted Sq.Ft*</label>
                          <NumericFormat
                            className="form-control"
                            value={formSubmitData.allottedSqFt}
                            onValueChange={(values) => handleInputChange('allottedSqFt', values.floatValue || 0)}
                            decimalScale={0}
                            allowNegative={false}
                            thousandSeparator={false}
                            allowLeadingZeros={false}
                            min={500}
                            max={10000}
                            required
                          />
                          <div className="invalid-feedback">
                            Please enter allotted sq.ft between 500 and 10000
                          </div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label mb-1">Sq.Ft Rate*</label>
                          <NumericFormat
                            className="form-control"
                            value={formSubmitData.sqFtRate}
                            onValueChange={(values) => handleInputChange('sqFtRate', values.floatValue || 0)}
                            decimalScale={2}
                            allowNegative={false}
                            thousandSeparator={true}
                            allowLeadingZeros={false}
                            min={10}
                            max={500}
                            required
                          />
                          <div className="invalid-feedback">
                            Please enter sq.ft rate between 10 and 500
                          </div>
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label className="form-label mb-1">Annual RFQ Allowance*</label>
                          <NumericFormat
                            className="form-control"
                            value={formSubmitData.annualRFQAllowance}
                            decimalScale={2}
                            allowNegative={false}
                            thousandSeparator={true}
                            disabled
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label mb-1">Tax Free Allowance</label>
                          <NumericFormat
                            className="form-control"
                            value={formSubmitData.taxFreeAllowance}
                            decimalScale={2}
                            allowNegative={false}
                            thousandSeparator={true}
                            disabled
                          />
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label className="form-label mb-1">Taxable Amount</label>
                          <NumericFormat
                            className="form-control"
                            value={formSubmitData.taxableAmount}
                            decimalScale={2}
                            allowNegative={false}
                            thousandSeparator={true}
                            disabled
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label mb-1">Tax Amount</label>
                          <NumericFormat
                            className="form-control"
                            value={formSubmitData.taxAmount}
                            decimalScale={2}
                            allowNegative={false}
                            thousandSeparator={true}
                            disabled
                          />
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-12">
                          <label className="form-label mb-1">Net RFQ Allowance</label>
                          <NumericFormat
                            className="form-control text-center fw-bold"
                            value={formSubmitData.netRFQAllowance}
                            decimalScale={2}
                            allowNegative={false}
                            thousandSeparator={true}
                            disabled
                          />
                        </div>
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm py-2 px-4 me-2"
                        disabled={loading}
                      >
                        {loading ? 'Processing...' : (isEdit ? 'Update' : 'Submit')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm py-2 px-4"
                        onClick={resetValues}
                        disabled={loading}
                      >
                        Reset
                      </button>
                    </div>
                  </Form>
                </div>
              </Modal.Body>
            </Modal>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RentFreeAllowances;