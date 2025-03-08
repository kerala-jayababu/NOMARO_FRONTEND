import React, { useState, useEffect, useRef } from 'react';
import TaxConfigService from '../../core/services/TaxConfigService';
import { toast } from 'react-toastify';
import moment from 'moment';
import { NumericFormat } from 'react-number-format';
import DatePicker from 'react-datepicker';
import CommonService from '../../core/services/CommonService';

function TaxConfiguration() {
  const [baseTaxThresholds, setBaseTaxThresholds] = useState([]);
  const [childTaxThresholds, setChildTaxThresholds] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [loading, setLoading] = useState(false);        
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    idTaxSlab: 0,
    minAmount: '',
    maxAmount: '',
    taxRate: '',
    financialYearFrom: moment().format('YYYY-MM-DD')
  });

  const [childFormData, setChildFormData] = useState({
    idChildTaxThreshold: 0,
    childrenCount: '',
    taxThresholdAmount: '',
    financialYearFrom: moment().format('YYYY-MM-DD')
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
    getBaseTaxThresholds();
    getChildTaxThresholds();
  }, []);

  const getBaseTaxThresholds = () => {
    setLoading(true);
    TaxConfigService.getBaseTaxThresholds()
      .then(res => {
        setBaseTaxThresholds(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load tax thresholds');
        setLoading(false);
        toast.error('Something went wrong!', {
          position: 'top-right',
          autoClose: 2000
        });
      });
  };

  const getChildTaxThresholds = () => {
    setLoading(true);
    TaxConfigService.getChildTaxThresholds()
      .then(res => {
        setChildTaxThresholds(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load child tax thresholds');
        setLoading(false);
        toast.error('Something went wrong!', {
          position: 'top-right',
          autoClose: 2000
        });
      });
  };

  const getAllFinancialYears = () => {
    CommonService.getAllFinancialYears()
      .then(res => {
        console.log('res', res.data);
        setFinancialYears(res.data);
      })
      .catch(err => {
        setError('Failed to load financial years');
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
    setLoading(true);
    setError(null);

    if (!validateForm()) {
      setLoading(false);
      return;
    };

    const payload = {
      idTaxSlab: formData.idTaxSlab,
      minAmount: parseFloat(formData.minAmount),
      maxAmount: parseFloat(formData.maxAmount),
      taxRate: parseFloat(formData.taxRate),
      financialYearFrom: moment(formData.financialYearFrom).format()
    };

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
        getBaseTaxThresholds();
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
    console.log('threshold', threshold);
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
        getBaseTaxThresholds();
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
    setFormData({
      idTaxSlab: 0,
      minAmount: '',
      maxAmount: '',
      taxRate: '',
      financialYearFrom: moment().format('YYYY-MM-DD')
    });

    setFormErrors({
      minAmount: '',
      maxAmount: '',
      taxRate: '',
      financialYearFrom: '',
    });
  };


  const handleChildInputChange = (value, field) => {
    // const newValue = values.value || values;

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

    setChildFormData((prev) => ({
      ...prev,
      [field]: newValue,
    }));

    setChildFormErrors((prevErrors) => ({
      ...prevErrors,
      [field]: '',
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

  const handleChildSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
      moment(year.financialYearFrom).year() === moment(formData.financialYearFrom).year()
    );

    // If a matching financial year is found, add `idFinancialYear` and `financialYearTo` to the payload
    if (matchingYear) {
      payload['idFinancialYear'] = matchingYear.idFinancialYear;
      payload['financialYearTo'] = matchingYear.financialYearTo;
    }

    console.log('payload2', payload);

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
        getChildTaxThresholds();
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
        getChildTaxThresholds();
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
    setChildFormData({
      id: 0,
      childrenCount: '',
      taxThresholdAmount: '',
      financialYearFrom: moment().format('YYYY-MM-DD')
    });
    setChildFormErrors({
      childrenCount: '',
      taxThresholdAmount: '',
      financialYearFrom: ''
    });
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
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
                {error && <div className="text-danger p-3">{error}</div>}
                {!loading && !error && (
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
                    <tbody className="table-border-bottom-0">
                      {baseTaxThresholds && baseTaxThresholds.map((threshold) => (
                        <tr key={threshold.idTaxSlab}>
                          <td>{Number(threshold.minAmount).toFixed(2)}</td>
                          <td>{Number(threshold.maxAmount).toFixed(2)}</td>
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
                    </tbody>
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
                  <tbody className="table-border-bottom-0">
                    {childTaxThresholds && childTaxThresholds.map((threshold) => (
                      <tr key={threshold.idChildTaxThreshold}>
                        <td>{threshold.childrenCount}</td>
                        <td>{threshold.taxThresholdAmount}</td>
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
                        <td colSpan="4" className="text-center">No records found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {loading && <div className="text-center p-3">Loading...</div>}
                {error && <div className="text-danger p-3">{error}</div>}
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
              <form onSubmit={handleSubmit}>
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
                    maxLength={12}
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
                    maxLength={12}
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
                    showYearDropdown
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
              </form>
            </div>
          </div>
          <div className="card mt-2">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Add/Update Children Tax Threshold</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleChildSubmit}>
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
                    showYearDropdown
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
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaxConfiguration;
