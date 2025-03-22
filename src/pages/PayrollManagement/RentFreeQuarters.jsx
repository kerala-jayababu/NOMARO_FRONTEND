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
  const [selectedEmployee, setSelectedEmployee] = useState(null);
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
  useEffect(() => {
    getEmployeesList();
    getSystemParameters();
    getRentFreeQuarterDuration();
  }, []);

  const getEmployeesList = () => {
    CommonService.getEmployeeList().then(res => {
      res.data.data.sort((a,b)=> a.fullName - b.fullName);
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
    console.log(data, field);

    let newValue; 

    if (data && data.hasOwnProperty('value') && field !== 'idEmployee') {
      newValue = data.value;
    } else if (typeof data === 'string' && !isNaN(data)) {
      newValue = parseFloat(data); // Convert to number if it's a string representing a number
    } else  if(field === 'validFrom'){
      newValue = moment(data).startOf('day')
      .format('YYYY-MM-DDTHH:mm:ss');
    } else {
      newValue = data;
    }
   

    if(field === 'totalAnnualRent'){
      setFormSubmitData((prev) => ({
        ...prev,
        taxableAmount: calculateTaxableAmount(),
        monthlyRent: calculateMonthlyAllowance(),
      }));
    } else if(field === 'durationInMonths'){
      let periodText = rentFreeQuarterDuration.find(item => item.monthCount == data).rentFreeQuarterDurationName;
      setFormSubmitData((prev) => ({
        ...prev,
        periodText: periodText,
        monthlyRent: calculateMonthlyAllowance(),
      }));
    }

    if(field === 'idEmployee'){
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

  const calculateTaxableAmount = () => {
    // Check if totalAnnualRent is a valid number and not 0
    console.log("formSubmitData.totalAnnualRent", formSubmitData.totalAnnualRent);
    if (formSubmitData.totalAnnualRent === 0 || isNaN(formSubmitData.totalAnnualRent)) {
      console.log("totalAnnualRent is 0 or NaN");
      return 0;
    }
  
    // Ensure rentFreeQuarterTaxPercentage?.parameterValue is a valid number
    const rentFreeQuarterTaxPercentageValue = parseInt(rentFreeQuarterTaxPercentage?.parameterValue, 10);
    if (isNaN(rentFreeQuarterTaxPercentageValue) || rentFreeQuarterTaxPercentageValue === 0) {
      return 0;  // Prevent division by zero or invalid values
    }
  
    // Calculate taxable amount
    let taxableAmount = formSubmitData.totalAnnualRent / rentFreeQuarterTaxPercentageValue;  
    return taxableAmount;
  };
  

  const calculateMonthlyAllowance = () => {
    // Handle the case where durationInMonths is 0 to prevent division by zero
    if (formSubmitData.durationInMonths === 0 || formSubmitData.durationInMonths == null) {
      return 0;
    }
  
    // Ensure totalAnnualRent and durationInMonths are numbers before division
    const totalAnnualRent = Number(formSubmitData.totalAnnualRent);
    const durationInMonths = Number(formSubmitData.durationInMonths);
  
    // If either value is not a valid number, return 0
    if (isNaN(totalAnnualRent) || isNaN(durationInMonths)) {
      return 0;
    }
  
    // Calculate monthly allowance
    let monthlyRent = totalAnnualRent / durationInMonths;
  
    // Optionally round the result to 4 decimal places if needed
    monthlyRent = parseFloat(monthlyRent.toFixed(4)); 
    return monthlyRent;
  };

  const resetValues = () => {
    // setValidated(false);
    // setIsEdit(false);
    // setNewData({
    //   idScheduledSalaryDeduction: 0,
    //   idEmployee: 0,
    //   totalAmount: null,
    //   deductionFromSalaryMonthDate: null,
    //   deductionToSalaryMonthDate: null,
    //   allocatingSalaryHead: 0,
    //   monthCount: 0,
    //   // monthlyDeductableAmount: 0,
    // });
    // setSelectedEmployee(null);
    // setFilteredMonthsList(salaryMonthsList);
    // setDeductionGrid([]);
    // setExistingData([]);
  };
  

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formSubmitData);

    const payload = {
      idRentFreeQuater:formSubmitData.idRentFreeQuater,
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
    // return;
    RentFreeQuarterService.createRentFreeQuarter(payload).then(res => {
      console.log(res);
    }).catch(err => {
      console.log(err);
    });
  };

  return (
    <div class="container-xxl flex-grow-1 container-p-y">
            <div class="row">

              <div class="col-lg-12">
                <div class="card">
                  <div class="card-header d-flex align-items-center justify-content-between pb-3">
                    <h5 class="m-0">List of Employee with Rent-Free Quarters Allowance</h5>
                    <div class="list_menu">
                      <div class="list_searchbox">
                        <input type="search" class="form-control" />
                        <i class='bx bx-search'></i>
                      </div>
                      <button className="btn btn-primary btn-sm px-4" onClick={() => setShowModal(true)}>Add</button>
                    </div>


                  </div>
                  <div class="card-body">

                    <div class="table-responsive ">
                      <table class="table table-sm">
                        <thead>
                          <tr>
                            <th class="checkbox_td">
                              <input type="checkbox" class="form-check-input" />
                            </th>
                            <th>Emp. Code</th>
                            <th>Employee Name</th>
                            <th>Department</th>
                            <th>Designation</th>
                            <th class="text-end">Annual Allowance</th>
                            <th class="text-end">Annual Tax</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>

                          <tr>
                            <td> <input type="checkbox" class="form-check-input" /></td>
                            <td>EPM0123</td>
                            <td>john</td>
                            <td>Computer Science</td>
                            <td>Sr. Teacher</td>
                            <td class="text-end">4500</td>
                            <td class="text-end">200 </td>
                            <td class="text-end">
                              <button type="button" class="btn btn-sm btn-icon btn-outline-secondary px-3 border-0">
                                <span class="tf-icons bx bx-pencil"></span>
                              </button>
                            </td>
                          </tr>
                          <tr>
                            <td> <input type="checkbox" class="form-check-input" /></td>
                            <td>EPM0123</td>
                            <td>john</td>
                            <td>General Science</td>
                            <td>Jr. Teacher</td>
                            <td class="text-end">5000</td>
                            <td class="text-end">210</td>
                            <td class="text-end">
                              <button type="button" class="btn btn-sm btn-icon btn-outline-secondary px-3 border-0">
                                <span class="tf-icons bx bx-pencil"></span>
                              </button>
                            </td>
                          </tr>

                        </tbody>
                      </table>

                    </div>

                  </div>


                  <Modal
          show={showModal} onHide={() => { setShowModal(false); resetValues() }} size='md'
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
                          <div class="mb-2">
                            <label class="form-label mb-1">Duration</label>
                            <select class="form-select" value={formSubmitData.durationInMonths} onChange={(e) => handleInputChange(e.target.value, 'durationInMonths')} >
                              <option value={0}>Select</option>
                              {
                                rentFreeQuarterDuration.length>0 && rentFreeQuarterDuration.map(item => (
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
                              dateFormat="MM/dd/yyyy"
                              placeholderText="From Date"
                              selected={formSubmitData.validFrom}
                              onChange={(date) => handleInputChange(date, 'validFrom')}
                              maxDate={new Date()}
                              showMonthDropdown
                              showYearDropdown
                              dropdownMode="select"
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
                                maxLength={15}
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
                                maxLength={10}
                                required
                                disabled
                              />
                            </div>
                            <div class="col-md-6 mb-2">
                              <label class="form-label mb-1">Tax Amount</label>
                              <input type="text" class="form-control" maxlength="50" disabled value={formSubmitData.annualTaxAmount}/>
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
                                maxLength={10}
                                required
                                disabled
                              />
                            </div>
                            <div class="col-md-6 mb-2">
                              <label class="form-label mb-1">Monthly Tax</label>
                              <input type="text" class="form-control" maxlength="50" disabled value={formSubmitData.monthlyTaxAmount} />
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
