import React, { useState, useEffect } from "react";
import Select from "react-select";
import CommonService from "../../core/services/CommonService";
import { Form, Modal } from "react-bootstrap";
import moment from "moment";
import RentFreeQuarterService from "../../core/services/RentFreeQuarterService";
import DatePicker from "react-datepicker";
import { NumericFormat } from "react-number-format";
function RentFreeQuarters() {
  const [employeesListOption, setEmployeesListOption] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [selectedEmployeeData, setSelectedEmployeeData] = useState({
    designation: '',
    department: ''
  });
  const [systemParameters, setSystemParameters] = useState(null);
  const [rentFreeQuarterTaxPercentage, setRentFreeQuarterTaxPercentage] = useState(null);
  const [rentFreeQuarterDuration, setRentFreeQuarterDuration] = useState([]);
  const [validated, setValidated] = useState(false);
  const [formSubmitData, setFormSubmitData] = useState({
    idRentFreeQuater: 0,
    idEmployee: 0,
    periodText: "",
    idRentFreeQuarterEnum: 0,
    totalAnnualRent: '',
    durationInMonths: 0,
    validFrom: "",
    monthlyRent: 0,
    validTo: null,
    taxRate: 0,
    annualTaxAmount: 0,
    monthlyTaxAmount: 0
  });
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [rentFreeQuarterList, setRentFreeQuarterList] = useState([]);
  const [filter, setFilter] = useState({
    searchText: "",
    fromDate: null
  });
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    getEmployeesList();
    getSystemParameters();
    getRentFreeQuarterDuration();
    getRentFreeQuarterList(filter.searchText, filter.fromDate);
  }, []);

  const handleModalChange = () => {
    console.log("showModal", showModal);
    setShowModal(!showModal);
    if (!showModal) {
      resetValues();
    }
  };

  // Handle search input changes
  const handleSearchChange = (e) => {
    setFilter({
      ...filter,
      searchText: e.target.value
    });
  };

  // Handle Enter key to trigger search
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      getRentFreeQuarterList(e.target.value, filter.fromDate);  // Trigger search when Enter is pressed
    }
  };

  const getRentFreeQuarterList = (searchText, fromDate) => {
    let filterFormatted = {
      searchText: searchText
    };
    if (fromDate) {
      filterFormatted['fromDate'] = moment(fromDate).format('YYYY-MM-DDTHH:mm:ss');
    };
    setLoading(true);
    RentFreeQuarterService.getAllRentFreeQuarter(filterFormatted).then(res => {
      setRentFreeQuarterList(res.data.data);
      setLoading(false);
    }).catch(err => {
      setLoading(false);
    });
  };


  const getEmployeesList = () => {
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

  const getRentFreeQuarterDuration = () => {
    RentFreeQuarterService.getAllRentFreeQuarterDuration().then(res => {
      setRentFreeQuarterDuration(res.data.data);
      console.log(res.data.data);
    }).catch(err => {

    });
  };

  const getSystemParameters = () => {
    CommonService.getSystemParameters().then(res => {
      console.log(res.data.data);
      let filteredData = res.data.data.filter(item => item.parameterName === "RentFreeQuarterTaxPercentage");

      setRentFreeQuarterTaxPercentage(filteredData[0]);
    }).catch(err => {

    });
  };

  const handleInputChange = (data, field) => {
    console.log('data', data)
    let newValue;

    if (data && data.hasOwnProperty('value') && field !== 'idEmployee') {
      newValue = data.value;
    } else if (typeof data === 'string' && !isNaN(data)) {
      newValue = parseFloat(data); // Convert to number if it's a string representing a number
    } else if (field === 'validFrom') {
      newValue = moment(data).startOf('day')
        .format('YYYY-MM-DDTHH:mm:ss');
    } else {
      newValue = data;
    }


    if (field === 'totalAnnualRent') {
      setFormSubmitData((prev) => ({
        ...prev,
        taxableAmount: ((data.floatValue) * (rentFreeQuarterTaxPercentage?.parameterValue / 100)).toFixed(2),
        monthlyRent: ((data.floatValue) / formSubmitData.durationInMonths).toFixed(2),
      }));
    } else if (field === 'durationInMonths') {
      let periodText = rentFreeQuarterDuration.find(item => item.monthCount == data).rentFreeQuarterDurationName;
      setFormSubmitData((prev) => ({
        ...prev,
        periodText: periodText,
        monthlyRent: ((formSubmitData.totalAnnualRent) / data).toFixed(2)
      }));
    } 
    if (field === 'idEmployee') {
      let filteredEmployee = employeesList.filter(employee =>
        employee.idEmployee == data.value
      );
      setSelectedEmployeeData(filteredEmployee[0]);
      newValue = data;
      setFormSubmitData((prev) => ({
        ...prev,
        selectedEmployee: newValue,
        idEmployee: newValue.value,
      }));
    } else {
      setFormSubmitData((prev) => ({
        ...prev,
        [field]: newValue,
      }));
    }

  };

  // const calculateTaxableAmount = () => {
  //   // Check if totalAnnualRent is a valid number and not 0
  //   console.log("formSubmitData.totalAnnualRent", formSubmitData.totalAnnualRent);
  //   if (formSubmitData.totalAnnualRent === 0 || isNaN(formSubmitData.totalAnnualRent)) {
  //     console.log("totalAnnualRent is 0 or NaN");
  //     return 0;
  //   }

  //   // Ensure rentFreeQuarterTaxPercentage?.parameterValue is a valid number
  //   const rentFreeQuarterTaxPercentageValue = parseInt(rentFreeQuarterTaxPercentage?.parameterValue, 10);
  //   if (isNaN(rentFreeQuarterTaxPercentageValue) || rentFreeQuarterTaxPercentageValue === 0) {
  //     return 0;  // Prevent division by zero or invalid values
  //   }

  //   // Calculate taxable amount
  //   let taxableAmount = formSubmitData.totalAnnualRent * (rentFreeQuarterTaxPercentageValue/100);
  //   return taxableAmount;
  // };


  // const calculateMonthlyAllowance = () => {
  //   // Handle the case where durationInMonths is 0 to prevent division by zero
  //   if (formSubmitData.durationInMonths === 0 || formSubmitData.durationInMonths == null) {
  //     return 0;
  //   }

  //   // Ensure totalAnnualRent and durationInMonths are numbers before division
  //   const totalAnnualRent = Number(formSubmitData.totalAnnualRent);
  //   const durationInMonths = Number(formSubmitData.durationInMonths);

  //   // If either value is not a valid number, return 0
  //   if (isNaN(totalAnnualRent) || isNaN(durationInMonths)) {
  //     return 0;
  //   }

  //   // Calculate monthly allowance
  //   let monthlyRent = totalAnnualRent / durationInMonths;

  //   // Optionally round the result to 4 decimal places if needed
  //   monthlyRent = parseFloat(monthlyRent.toFixed(4));
  //   return monthlyRent;
  // };

  const resetValues = () => {
    setFormSubmitData({
      idRentFreeQuater: 0,
      idEmployee: 0,
      periodText: "",
      idRentFreeQuarterEnum: 0,
      totalAnnualRent: '',
      durationInMonths: 0,
      validFrom: "",
      monthlyRent: 0,
      validTo: null,
      taxRate: 0,
      annualTaxAmount: 0,
      monthlyTaxAmount: 0
    });
    setSelectedEmployeeData({
      designation: '',
      department: ''
    });
    setIsEdit(false);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      idRentFreeQuater: formSubmitData.idRentFreeQuater,
      idEmployee: formSubmitData.idEmployee,
      periodText: formSubmitData.periodText,
      idRentFreeQuarterEnum: formSubmitData.idRentFreeQuarterEnum,
      totalAnnualRent: formSubmitData.totalAnnualRent,
      durationInMonths: formSubmitData.durationInMonths,
      validFrom: formSubmitData.validFrom,
      monthlyRent: formSubmitData.monthlyRent,
      validTo: formSubmitData.validTo,
      taxRate: formSubmitData.taxRate,
      annualTaxAmount: formSubmitData.annualTaxAmount,
      monthlyTaxAmount: formSubmitData.monthlyTaxAmount
    };
    payload.idRentFreeQuarterEnum = rentFreeQuarterDuration.find(item => item.monthCount == formSubmitData.durationInMonths).idRentFreeQuarterDuration;
    console.log(payload);
    setLoading(true);
    const service = (isEdit)
      ? RentFreeQuarterService.updateRentFreeQuarter
      : RentFreeQuarterService.addRentFreeQuarter;

    try {
      const response = await service(payload);
      getRentFreeQuarterList(filter.searchText, filter.fromDate);
      handleModalChange();
    } catch (err) {

    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setFormSubmitData({
      ...item,
      selectedEmployee: {
        label: item.employeeName,
        value: item.idEmployee
      },
      taxableAmount: (item.totalAnnualRent * ((rentFreeQuarterTaxPercentage?.parameterValue) / 100)).toFixed(2),
      monthlyRent: (item.totalAnnualRent / item.durationInMonths).toFixed(2)
    });
    setIsEdit(true);
    setShowModal(true);
  };

  return (
    <div class="container-xxl flex-grow-1 container-p-y">
      <div class="row">

        <div class="col-lg-12">
          <div class="card">
            <div class="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 class="m-0">List of Employee with Rent-Free Quarters Allowance</h5>
              <div className="custom-date-picker-wrapper">
                <div>
                  <label className='p-2'>Period From</label>
                  <DatePicker
                    className="form-control"
                    placeholderText="From Date"
                    selected={filter.fromDate}
                    onChange={(date) => { setFilter({ ...filter, fromDate: date }); getRentFreeQuarterList(filter.searchText, date) }}
                    maxDate={new Date()}
                    isClearable
                    dateFormat="MMM/yyyy"
                    showMonthYearPicker
                    dropdownMode="select"
                  />
                </div>
              </div>
              <div class="list_menu">
                <div class="list_searchbox">
                  <input type="search" class="form-control" placeholder="Search..."
                    value={filter.searchText}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown} />
                  <i class='bx bx-search'></i>
                </div>
                <button className="btn btn-primary btn-sm px-4" onClick={() => handleModalChange()}>Add</button>
              </div>


            </div>
            <div class="card-body">

              <div class="custom-table-wrapper">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      {/* <th class="checkbox_td">
                        <input type="checkbox" class="form-check-input" />
                      </th> */}
                      <th>Emp. Code</th>
                      <th>Employee Name</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th>Valid From</th>
                      <th>Duration</th>
                      <th class="text-end">Allowance</th>
                      <th class="text-end">Annual Tax</th>
                      <th></th>
                    </tr>
                  </thead>
                  {!loading && rentFreeQuarterList.length > 0 && <tbody>

                    {
                      rentFreeQuarterList.map(item => (
                        <tr>
                          {/* <td> <input type="checkbox" class="form-check-input" /></td> */}
                          <td>{item.employeeCode}</td>
                          <td>{item.employeeName}</td>
                          <td>{item.departmentName}</td>
                          <td>{item.designationName}</td>
                          <td>{moment(item.validFrom).format('MMM, yyyy')}</td>
                          <td>{item.periodText}</td>
                          <td class="text-end">{(item.totalAnnualRent).toFixed(2)}</td>
                          <td class="text-end">{(item.totalAnnualRent * ((rentFreeQuarterTaxPercentage?.parameterValue) / 100)).toFixed(2)}</td>
                          <td class="text-end">
                            <button type="button" class="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
                              onClick={() => handleEdit(item)}>
                              <span class="tf-icons bx bx-pencil"></span>
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>}
                  {loading &&
                    <tr>
                      <td colSpan="8" className="text-center">
                        <div className="Nodatafound_box">
                          <h6> Loading...</h6>
                        </div>
                      </td>
                    </tr>}
                  {!loading && rentFreeQuarterList.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center">
                        <div className="Nodatafound_box">
                          <h6><i className="bx bx-search"></i> No data available!</h6>
                        </div>
                      </td>
                    </tr>
                  )}
                </table>

              </div>

            </div>


            <Modal
              show={showModal} onHide={() => handleModalChange()} size='lg'
              aria-labelledby="contained-modal-title-vcenter"
              centered backdrop="static"
              keyboard={false}>
              <Modal.Header closeButton>
                <Modal.Title>
                  <h5>Add/Update Rent-Free Quarters Allowance</h5>
                </Modal.Title>
              </Modal.Header>

              <Modal.Body>
                <div className="accountDetail_card">
                  <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    <div class="modal-body ">

                      <div class="mb-2">
                        <label class="form-label mb-1">Employee Name</label>
                        <Select
                          options={employeesListOption}
                          value={formSubmitData.selectedEmployee}
                          isSearchable
                          onChange={(e) => handleInputChange(e, 'idEmployee')}
                          placeholder={'Select Employee'}
                          className="textSize"
                          required
                        />
                      </div>
                      {selectedEmployeeData?.department && <div className='mb-2'>
                        <span className="fw-semibold">{selectedEmployeeData?.department}, {selectedEmployeeData?.designation}</span>
                      </div>}
                      <div class="mb-2">
                        <label class="form-label mb-1">Duration</label>
                        <select class="form-select" value={formSubmitData.durationInMonths} onChange={(e) => handleInputChange(e.target.value, 'durationInMonths')} >
                          <option value={0}>Select</option>
                          {
                            rentFreeQuarterDuration.length > 0 && rentFreeQuarterDuration.map(item => (
                              <option value={item.monthCount}>{item.rentFreeQuarterDurationName}</option>
                            ))
                          }
                        </select>
                      </div>
                      <div class="mb-2 date-picker-container">
                        <label class="form-label mb-1">Valid Date From</label>
                        <br></br>
                        <DatePicker
                          className="form-control w-100"
                          placeholderText="From Date"
                          selected={formSubmitData.validFrom}
                          onChange={(date) => handleInputChange(date, 'validFrom')}
                          maxDate={new Date()}
                          dateFormat="MMM/yyyy"
                          showMonthYearPicker
                        />
                      </div>
                      <div class="mb-2">
                        <label class="form-label mb-1">Total Annual Rent Free Quarters Allowance</label>
                        <NumericFormat
                          className="form-control"
                          value={formSubmitData.totalAnnualRent}
                          onValueChange={(values) => {
                            handleInputChange(values, 'totalAnnualRent');
                          }}
                          decimalScale={4}
                          allowNegative={false}
                          thousandSeparator={true}
                          allowLeadingZeros={false}
                          maxLength={20}
                          required
                        />
                      </div>
                      <div class="row ">
                        <div class="col-md-6 mb-2">
                          <label class="form-label mb-1">Taxable Amount ({rentFreeQuarterTaxPercentage?.parameterValue}%)</label>
                          <NumericFormat
                            className="form-control"
                            value={formSubmitData.taxableAmount}  // Call the function to get the value
                            decimalScale={4}
                            allowNegative={false}
                            thousandSeparator={true}
                            allowLeadingZeros={false}
                            maxLength={15}
                            required
                            disabled
                          />
                        </div>
                        <div class="col-md-6 mb-2">
                          <label class="form-label mb-1">Tax Amount</label>
                          <input type="text" class="form-control" maxLength="15" disabled value={formSubmitData.annualTaxAmount} />
                        </div>
                      </div>
                      <div class="row ">
                        <div class="col-md-6 mb-2">
                          <label class="form-label mb-1">Monthly Allowance</label>
                          <NumericFormat
                            className="form-control"
                            value={formSubmitData.monthlyRent}  // Call the function to get the value
                            decimalScale={4}
                            allowNegative={false}
                            thousandSeparator={true}
                            allowLeadingZeros={false}
                            maxLength={15}
                            required
                            disabled
                          />
                        </div>
                        <div class="col-md-6 mb-2">
                          <label class="form-label mb-1">Monthly Tax</label>
                          <input type="text" class="form-control" maxLength="15" disabled value={formSubmitData.monthlyTaxAmount} />
                        </div>
                      </div>

                    </div>
                  </Form>
                </div>
                <div className="modal-footer">
                  {
                    isEdit &&
                    <button className="btn btn-primary btn-sm py-2 px-4 me-2" onClick={(e) => handleSubmit(e)}>Update</button>
                  }
                  {
                    !isEdit &&
                    <button className="btn btn-primary btn-sm py-2 px-4 me-2" onClick={(e) => handleSubmit(e)}>Submit</button>
                  }
                  <button className="btn btn-outline-secondary  btn-sm py-2 px-4" onClick={() => resetValues()}>Reset</button>
                </div>
              </Modal.Body>
            </Modal>


          </div>

        </div>

      </div>
    </div>

  );
}

export default RentFreeQuarters;
