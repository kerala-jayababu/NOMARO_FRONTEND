import React, { useState, useEffect, useRef } from 'react';
import TaxConfigService from '../../core/services/TaxConfigService';
import { toast } from 'react-toastify';
import moment from 'moment';
import { NumericFormat } from 'react-number-format';
import DatePicker from 'react-datepicker';
import CommonService from '../../core/services/CommonService';
import { Form } from 'react-bootstrap';

function TaxConfiguration() {
  const [baseTaxThresholds, setBaseTaxThresholds] = useState([]);
  const [childTaxThresholds, setChildTaxThresholds] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [loading, setLoading] = useState(false);        
  const [baseError, setBaseError] = useState(null);
  const [childError, setChildError] = useState(null);
  const [selectedFinancialYear, setSelectedFinancialYear] = useState('');
  const [validated, setValidated] = useState(false);
  const [childValidated, setChildValidated] = useState(false);
  const [formData, setFormData] = useState({
    idTaxSlab: 0,
    minAmount: '',
    maxAmount: '',
    taxRate: '',
    financialYearFrom: moment().format('YYYY-MM-DD'),
    idFinancialYear: ''
  });

  const [childFormData, setChildFormData] = useState({
    idChildTaxThreshold: 0,
    childrenCount: '',
    taxThresholdAmount: '',
    financialYearFrom: moment().format('YYYY-MM-DD'),
    idFinancialYear: ''
  });

  const [childFormErrors, setChildFormErrors] = useState({
    idChildTaxThreshold: 0,
    childrenCount: '',
    taxThresholdAmount: '',
    financialYearFrom: ''
  });

  const [formErrors, setFormErrors] = useState({
    minAmount: '',
    maxAmount: '',
    taxRate: '',
    financialYearFrom: '',
  });

  const maxAmountRef = useRef(null); // Create a ref for the NumericFormat input
  const childAmountRef = useRef(null); // Create a ref for the NumericFormat input  

  const handleButtonClick = (type) => {
    console.log('type', type);
    // Focus on the input when the button is clicked
    if (type === 'basetax') {
      if (maxAmountRef.current) {
        maxAmountRef.current.focus();
      }
    } else if (type === 'childtax') {
      if (childAmountRef.current) {
        childAmountRef.current.focus();
      }
    }
  };

  useEffect(() => {
    getAllFinancialYears();
   
  }, []);

  const getBaseTaxThresholds = (idFinancialYear) => {
    setLoading(true);
    TaxConfigService.getBaseTaxThresholds(idFinancialYear)
      .then(res => {
        setBaseTaxThresholds(res.data.data);
        setBaseError(null);
        setLoading(false);
      })
      .catch(err => {
        setBaseError('Failed to load tax thresholds');
        setLoading(false);
        toast.error('Something went wrong!', {
          position: 'top-right',
          autoClose: 2000
        });
      });
  };

  const getChildTaxThresholds = (idFinancialYear) => {
    setLoading(true);
    TaxConfigService.getChildTaxThresholds(idFinancialYear)
      .then(res => {
        setChildTaxThresholds(res.data.data);
        setChildError(null);
        setLoading(false);
      })
      .catch(err => {
        console.log('err', err);
        setChildError('Failed to load child tax thresholds');
        setLoading(false);
        toast.error(err.data.message, {
          position: 'top-right',
          autoClose: 2000
        });
      });
  };

  const getAllFinancialYears = () => {
    setLoading(true);
    CommonService.getAllFinancialYears()
      .then(res => {
        setFinancialYears(res.data);
        setSelectedFinancialYear(res.data[0].idFinancialYear);
        getBaseTaxThresholds(res.data[0].idFinancialYear);
        getChildTaxThresholds(res.data[0].idFinancialYear);
        setLoading(false);
      })
      .catch(err => {
        setBaseError('Failed to load financial years');
        setChildError('Failed to load financial years');
        toast.error('Failed to load financial years!', {
          position: 'top-right',
          autoClose: 2000
        });
      });
  };

  const handleInputChange = (value, field) => {
    let newValue;
  
    // If the value is an object, extract the 'value' property
    if (value && value.hasOwnProperty('value')) {
      value = value.value; // Extract the 'value' property from the object
    }
  
    // If the value is a string (especially for number fields), attempt to parse it to a float
    if (typeof value === 'string' && !isNaN(value)) {
      value = parseFloat(value); // Convert the string to a number
    }
  
    // Check if the field is 'financialYearFrom', which expects a Date object
    if (field === 'financialYearFrom') {
      // Ensure the value is a valid Date object or null
      newValue = value instanceof Date ? value : null;
    } else if (typeof value === 'number') {
      // Handle number fields (e.g., minAmount, maxAmount, taxRate)
      newValue = value;
    } else {
      // For other fields (if any are added in the future), assign the value as-is
      newValue = value;
    }
    
    // Update form data
    setFormData((prev) => ({
      ...prev,
      [field]: newValue,
    }));
  
    // Clear error for the specific field
    setFormErrors((prevErrors) => ({
      ...prevErrors,
      [field]: '',
    }));
  };
  

  const validateForm = () => {
    const errors = {};

    // Validate Min and Max amount
    if (parseFloat(formData.minAmount) >= parseFloat(formData.maxAmount)) {
      errors.minAmount = 'Min Income must be less than Max Income';
      errors.maxAmount = 'Max Income must be greater than Min Income';
    }

    // Validate Tax Rate
    if (formData.taxRate === undefined || formData.taxRate === null || formData.taxRate < 0) {
      errors.taxRate = 'Tax Rate must be a positive number or 0';
    }

    // Validate financial year
    if (!formData.financialYearFrom) {
      errors.financialYearFrom = 'Effective Date is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(checkEmptyDataInObject(formData)){
      setValidated(true);
      return;
    }
    setLoading(true);
    setBaseError(null);
    setChildError(null);

    if (!validateForm()) {
      setLoading(false);
      return;
    };

    const financialYearFromData = moment(formData.financialYearFrom)
    .startOf('day') 
    .format('YYYY-MM-DDTHH:mm:ss'); 
    const payload = {
      idTaxSlab: formData.idTaxSlab,
      minAmount: parseFloat(formData.minAmount),
      maxAmount: parseFloat(formData.maxAmount),
      taxRate: parseFloat(formData.taxRate),
      financialYearFrom: financialYearFromData
    };
    // console.log('payload',  moment(formData.financialYearFrom).format());
  
    const matchingYear = financialYears.find(year =>
      moment(year.financialYearFrom).year() === moment(formData.financialYearFrom).year()
    );

    // If a matching financial year is found, add `idFinancialYear` and `financialYearTo` to the payload
    if (matchingYear) {
      payload['idFinancialYear'] = matchingYear.idFinancialYear;
      payload['financialYearTo'] = matchingYear.financialYearTo;
    }

    console.log('payload', payload);

    if(formData.idTaxSlab!==0){
      updateTaxThreshold(payload);
    }else{
      addTaxThreshold(payload);
    }
  };

  const addTaxThreshold = (payload) => {
    TaxConfigService.createTaxThreshold(payload).then(res => {
      if (res.data.success) {
        toast.success('Tax threshold added successfully', {
          position: 'top-right',
          autoClose: 2000
        });
        getBaseTaxThresholds(selectedFinancialYear  );
        setLoading(false);
        handleReset();
      }
    }).catch(err => {
      setLoading(false);
      toast.error('Something went wrong!', {
        position: 'top-right',
        autoClose: 2000
      });
    });
  };

  const handleEdit = (threshold) => {
    setFormData({
      idTaxSlab: threshold.idTaxSlab,
      minAmount: threshold.minAmount,
      maxAmount: threshold.maxAmount,
      taxRate: threshold.taxRate,
      financialYearFrom: moment(threshold.financialYearFrom).format('YYYY-MM-DD')
    });
  };


  const updateTaxThreshold = (payload) => {
    TaxConfigService.updateTaxThreshold(payload).then(res => {
      if (res.data.success) {
        toast.success('Tax threshold updated successfully', {
          position: 'top-right',
          autoClose: 2000
        });
        getBaseTaxThresholds(selectedFinancialYear);
        setLoading(false);
        handleReset();
      }
    }).catch(err => {
      setLoading(false);
      toast.error('Something went wrong!', {
        position: 'top-right',
        autoClose: 2000
      });
    });
  }

  const handleReset = () => {
    setValidated(false);
    setFormData({
      idTaxSlab: 0,
      minAmount: '',
      maxAmount: '',
      taxRate: '',
      financialYearFrom: moment().format('YYYY-MM-DD'),
      idFinancialYear: ''
    });

    setFormErrors({
      minAmount: '',
      maxAmount: '',
      taxRate: '',
      financialYearFrom: '',
    });
  };


  const handleChildInputChange = (value, field) => {
    let newValue;
    let errorMessage = '';
    // If the value is an object, extract the 'value' property
    if (value && value.hasOwnProperty('value')) {
      value = value.value; // Extract the 'value' property from the object
    }

    // If the value is a string (especially for number fields), attempt to parse it to a float
    if (typeof value === 'string' && !isNaN(value)) {
      value = parseFloat(value); // Convert the string to a number
    }

    // Check if the field is 'financialYearFrom', which expects a Date object
    if (field === 'financialYearFrom') {
      newValue = value instanceof Date ? value : null;
    } else if (typeof value === 'number') {
      // Handle number fields (e.g., childrenCount)
      // Enforce the maximum limit for childrenCount
      if (field === 'childrenCount' && value > 20) {
        toast.error('Child count must be less than 20', {
          position: 'top-right',
          autoClose: 2000
        });
        newValue = 20;
      } else {
        newValue = value;
      }
    } else {
      newValue = value;
    }

    setChildFormData((prev) => ({
      ...prev,
      [field]: newValue,
    }));
    setChildFormErrors((prevErrors) => ({
      ...prevErrors,
      [field]: errorMessage,
    }));
  };


  const validateChildForm = () => {
    console.log('childFormData', childFormData);
    const errors = {};

    if (!childFormData.childrenCount || childFormData.childrenCount <= 0) {
      errors.childrenCount = 'Child count must be a positive number';
    }

    if (!childFormData.taxThresholdAmount || childFormData.taxThresholdAmount <= 0) {
      errors.taxThresholdAmount = 'Amount must be a positive number';
    }

    if (!childFormData.financialYearFrom) {
      errors.financialYearFrom = 'Effective Date is required';
    }

    setChildFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkEmptyDataInObject = (obj) => {
    return Object.values(obj).some(value => value === '');
  }

  const handleChildSubmit = async (e) => {

    e.preventDefault();
    if(checkEmptyDataInObject(childFormData)){
      setChildValidated(true);
      return;
    }
    setLoading(true);
    setChildError(null);

    if (!validateChildForm()) {
      setLoading(false);
      return;
    }

    const payload = {
      idChildTaxThreshold: childFormData.idChildTaxThreshold,
      childrenCount: parseInt(childFormData.childrenCount),
      taxThresholdAmount: parseFloat(childFormData.taxThresholdAmount),
      financialYearFrom: moment(childFormData.financialYearFrom).format()
    };

    
    const matchingYear = financialYears.find(year =>
      moment(year.financialYearFrom).year() === moment(childFormData.financialYearFrom).year()
    );

    // If a matching financial year is found, add `idFinancialYear` and `financialYearTo` to the payload
    if (matchingYear) {
      payload['idFinancialYear'] = matchingYear.idFinancialYear;
      payload['financialYearTo'] = matchingYear.financialYearTo;
    }

    // return;
    if(childFormData.idChildTaxThreshold!==0){
      updateChildTaxThreshold(payload);
    }else{
      addChildTaxThreshold(payload);
    } 
  };





  const updateChildTaxThreshold = (payload) => {
    TaxConfigService.updateChildTaxThreshold(payload).then(res => {
      if (res.data.success) {
        toast.success('Child tax threshold updated successfully', {
          position: 'top-right',
          autoClose: 2000
        });
        getChildTaxThresholds(selectedFinancialYear);
        setLoading(false);
        handleChildReset();
      } 
    }).catch(err => {
      setLoading(false);
      toast.error('Something went wrong!', {
        position: 'top-right',
        autoClose: 2000
      });
    }); 
  }   

  const addChildTaxThreshold = (payload) => {
    TaxConfigService.createChildTaxThreshold(payload).then(res => {
      if (res.data.success) {
        toast.success('Child tax threshold added successfully', {
          position: 'top-right',
          autoClose: 2000
        });
        getChildTaxThresholds(selectedFinancialYear);
        setLoading(false);
        handleChildReset();
      }
    }).catch(err => { 
      setLoading(false);
      toast.error('Something went wrong!', {
        position: 'top-right',
        autoClose: 2000
      });
    }); 
  };

  const handleEditChildThreshold = (threshold) => {
    setChildFormData({
      idChildTaxThreshold: threshold.idChildTaxThreshold,
      childrenCount: threshold.childrenCount,
      taxThresholdAmount: threshold.taxThresholdAmount,
      financialYearFrom: moment(threshold.financialYearFrom).format('YYYY-MM-DD')
    });
    };

  const handleChildReset = () => {
    setChildValidated(false);
    setChildFormData({
      idChildTaxThreshold: 0,
      childrenCount: '',
      taxThresholdAmount: '',
      financialYearFrom: moment().format('YYYY-MM-DD'),
      idFinancialYear: ''
    });
    setChildFormErrors({
      childrenCount: '',
      taxThresholdAmount: '',
      financialYearFrom: ''
    });
  };

  const handleFinancialYearChange = (e) => {
    const selectedYear = financialYears.find(year => year.idFinancialYear === parseInt(e.target.value));
    setSelectedFinancialYear(e.target.value);
    
    console.log('selectedYear', e.target.value);
    getBaseTaxThresholds(e.target.value);
    getChildTaxThresholds(e.target.value);
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-3">
                  <label className="form-label mb-1">Financial Year</label>
                  <select 
                    className="form-select"
                    value={selectedFinancialYear}
                    onChange={handleFinancialYearChange}
                    required
                  >
                    <option value="">Select Financial Year</option>
                    {financialYears.map((year) => (
                      <option key={year.idFinancialYear} value={year.idFinancialYear}>
                        {`${moment(year.financialYearFrom).format('DD/MM/YYYY')} - ${moment(year.financialYearTo).format('DD/MM/YYYY')}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        
        <div className="col-lg-8 ">
          <div className="card mb-2">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">Base Tax Threshold</h5>
              <button className="btn btn-primary btn-sm px-4" onClick={() => handleButtonClick('basetax')}>Add</button>
            </div>
            <div className="card-body">
              <div className="table-responsive text-nowrap">
                {loading && <div className="text-center p-3">Loading...</div>}
                {/* {baseError && <div className="text-danger p-3">{baseError}</div>} */}
                {!loading  && (
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Min Income</th>
                        <th>Max Income</th>
                        <th>Tax Rate (%)</th>
                        <th>Effective From</th>
                        <th></th>
                      </tr>
                    </thead>
                    {!baseError && <tbody className="table-border-bottom-0">
                      {baseTaxThresholds && baseTaxThresholds.map((threshold) => (
                        <tr key={threshold.idTaxSlab}>
                          <td className="text-end">{Number(threshold.minAmount).toFixed(2)}</td>
                          <td className="text-end">{Number(threshold.maxAmount).toFixed(2)}</td>
                          <td>{threshold.taxRate}%</td>
                          <td>{moment(threshold.financialYearFrom).format("MM/DD/YYYY")}</td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
                              onClick={() => handleEdit(threshold)}
                            >
                              <span className="tf-icons bx bx-pencil"></span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>}
                    {baseError && <tbody className="table-border-bottom-0"><tr><td colSpan="5" className="text-center">
                      <div className="Nodatafound_box">
                        <h6><i className="bx bx-search"></i> No data available!</h6>
                      </div>
                      </td></tr></tbody>}
                  </table>
                )}
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">Children Based Tax Threshold</h5>
              <button className="btn btn-primary btn-sm px-4" onClick={() => handleButtonClick('childtax')}>Add</button>
            </div>
            <div className="card-body">
              <div className="table-responsive text-nowrap">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Child Count</th>
                      <th>Amount</th>
                      <th>Effective From</th>
                      <th></th>
                    </tr>
                  </thead>
                  {!childError && <tbody className="table-border-bottom-0">
                    {childTaxThresholds && childTaxThresholds.map((threshold) => (
                      <tr key={threshold.idChildTaxThreshold}>
                        <td>{threshold.childrenCount}</td>
                        <td className="text-end">{Number(threshold.taxThresholdAmount).toFixed(2)}</td>
                        <td>{moment(threshold.financialYearFrom).format("MM/DD/YYYY")}</td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
                            onClick={() => handleEditChildThreshold(threshold)}
                          >
                            <span className="tf-icons bx bx-pencil"></span>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!loading && childTaxThresholds.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center">
                          <div className="Nodatafound_box">
                            <h6><i className="bx bx-search"></i> No data available!</h6>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>}
                  {childError && <tbody className="table-border-bottom-0"><tr><td colSpan="4" className="text-center">
                    <div className="Nodatafound_box">
                      <h6><i className="bx bx-search"></i> No data available!</h6>
                    </div>
                    </td></tr></tbody>}
                </table>
                {loading && <div className="text-center p-3">Loading...</div>}
                {/* {childError && <div className="text-danger p-3">{childError}</div>} */}
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Add/Update Income Tax Threshold</h5>
            </div>
            <div className="card-body">
              <Form onSubmit={handleSubmit} noValidate validated={validated}>
                <div className="mb-2">
                  <label className="form-label mb-1">Min Income</label>
                  <NumericFormat
                    getInputRef={maxAmountRef}
                    className="form-control"
                    value={formData.minAmount}
                    onValueChange={(values) => handleInputChange(values, 'minAmount')}
                    decimalScale={2}
                    allowNegative={false}
                    thousandSeparator={true}
                    allowLeadingZeros={false}
                    placeholder="Add minimum income"
                    maxLength={15}
                    required
                  />
                  {formErrors.minAmount && (
                    <div className="text-danger">{formErrors.minAmount}</div>
                  )}
                </div>
                <div className="mb-2">
                  <label className="form-label mb-1">Max Income</label>
                  <NumericFormat
                    className="form-control"
                    value={formData.maxAmount}
                    onValueChange={(values) => handleInputChange(values, 'maxAmount')}
                    decimalScale={2}
                    allowNegative={false}
                    thousandSeparator={true}
                    allowLeadingZeros={false}
                    placeholder="Add maximum income"
                    maxLength={15}
                    required
                  />
                  {formErrors.maxAmount && (
                    <div className="text-danger">{formErrors.maxAmount}</div>
                  )}
                </div>

                <div className="mb-2">
                  <label className="form-label mb-1">Tax Rate (%)</label>
                  <NumericFormat
                    className="form-control"
                    value={formData.taxRate}
                    onValueChange={(values) => handleInputChange(values, 'taxRate')}
                    decimalScale={4}
                    allowNegative={false}
                    allowLeadingZeros={false}
                    maxLength={5}
                    required
                  />
                  {formErrors.taxRate && (
                    <div className="text-danger">{formErrors.taxRate}</div>
                  )}
                </div>
                <div className="mb-2">
                  <label className="form-label mb-1">Effective From</label>
                  <br></br>
                  <DatePicker
                    className="form-control"
                    dateFormat="MM/dd/yyyy"
                    placeholderText="Start Date"
                    selected={formData.financialYearFrom} 
                    onChange={(date) => handleInputChange(date, 'financialYearFrom')}
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                  {formErrors.financialYearFrom && (
                    <div className="text-danger">{formErrors.financialYearFrom}</div>
                  )}
                </div>

                <div className="text-center">
                  <button type="submit" className="btn btn-primary px-4 me-2">Submit</button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4"
                    onClick={handleReset}
                  >
                    Reset
                  </button>
                </div>
              </Form>
            </div>
          </div>
          <div className="card mt-2">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Add/Update Children Tax Threshold</h5>
            </div>
            <div className="card-body">
              <Form onSubmit={handleChildSubmit} noValidate validated={childValidated}>
                <div className="mb-2">
                  <label className="form-label mb-1">Child Count</label>
                  <NumericFormat
                    getInputRef={childAmountRef}
                    className="form-control"
                    value={childFormData.childrenCount}
                    onValueChange={(values) => handleChildInputChange(values, 'childrenCount')}
                    decimalScale={0}
                    allowNegative={false}
                    allowLeadingZeros={false}
                    maxLength={2}
                    maxAmount={20}
                    placeholder="Enter number of children"
                    required
                  />
                  {childFormErrors.childrenCount && (
                    <div className="text-danger">{childFormErrors.childrenCount}</div>
                  )}
                </div>
                <div className="mb-2">
                  <label className="form-label mb-1">Amount</label>
                  <NumericFormat
                    className="form-control"
                    value={childFormData.taxThresholdAmount}
                    onValueChange={(values) => handleChildInputChange(values, 'taxThresholdAmount')}
                    decimalScale={2}
                    maxLength={15}
                    allowNegative={false}
                    thousandSeparator={true}
                    allowLeadingZeros={false}
                    placeholder="Enter amount"
                    required
                  />
                  {childFormErrors.taxThresholdAmount && (
                    <div className="text-danger">{childFormErrors.taxThresholdAmount}</div>
                  )}
                </div>
                <div className="mb-2">
                  <label className="form-label mb-1">Effective From</label>
                  <br />
                  <DatePicker
                    className="form-control"
                    dateFormat="MM/dd/yyyy"
                    placeholderText="Select date"
                    selected={moment(childFormData.financialYearFrom).toDate()}
                    onChange={(date) => handleChildInputChange(date, 'financialYearFrom')}
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"                    
                    required
                  />
                  {childFormErrors.financialYearFrom && (
                    <div className="text-danger">{childFormErrors.financialYearFrom}</div>
                  )}
                </div>

                <div className="text-center">
                  <button type="submit" className="btn btn-primary px-4 me-2" disabled={loading}>
                    {loading ? 'Saving...' : 'Submit'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4"
                    onClick={handleChildReset}
                    disabled={loading}
                  >
                    Reset
                  </button>
                </div>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaxConfiguration;
