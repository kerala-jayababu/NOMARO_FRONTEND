import React, { useEffect,useRef } from 'react'
import CurrConversionService from '../../core/services/CurrConversionService' 
import { toast } from 'react-toastify';   
import moment from 'moment';    
import DatePicker from 'react-datepicker';
import { NumericFormat } from 'react-number-format';

function CurrencyConversion() {
  const currencies = ["GYD", "USD"];
  
  const initialFormState = {
    idCurrencyConversion: 0,
    fromCurrency: "GYD",
    toCurrency: "USD",
    rateDate: moment().format("YYYY-MM-DD"),
    conversionRate: ''
  };

  const [currencyConversions, setCurrencyConversions] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [formData, setFormData] = React.useState(initialFormState);
  const [isEditing, setIsEditing] = React.useState(false);
  const datePickerRef = useRef(null);
  
  useEffect(() => {
    getCurrencyConversions();
  }, []);
 
  const getCurrencyConversions = () => {
    setLoading(true);
    CurrConversionService.getAllCurrencyConversions()
      .then(res => {
        console.log(res.data.data);
        setCurrencyConversions(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load currency conversions');
        setLoading(false);
        toast.error('Something went wrong!', {
          position: 'top-right',
          autoClose: 2000
        });
      });
  };

  //     const handleInputChange = (e) => {      
  //     const { name, value } = e.target;
  //     setFormData(prev => ({
  //       ...prev,    
  //     [name]: value
  //   }));
  // };

  const handleInputChange = (value, field) => {
    let newValue;
  
    // If the value is an object (e.g., from a date picker or custom select), extract the 'value' property
    if (value && value.hasOwnProperty('value')) {
      value = value.value;
    }
  
    // If the value is a string representing a number, convert it to a float
    if (typeof value === 'string' && !isNaN(value)) {
      value = parseFloat(value); // Convert to number if it's a string representing a number
    }
  
    // Handle the 'rateDate' field to ensure it's a valid Date object
    if (field === 'rateDate') {
      newValue = value instanceof Date && !isNaN(value.getTime()) ? value : null;
    } else if (typeof value === 'number') {
      // If the value is a number, just use it as is
      newValue = value;
    } else {
      // For any other types (strings, booleans), use the value as is
      newValue = value;
    }
  
    setFormData((prev) => ({
      ...prev,
      [field]: newValue, 
    }));
  
    
    setError((prevErrors) => ({
      ...prevErrors,
      [field]: '',  
    }));
  };

  useEffect(() => {
    if (formData.fromCurrency === formData.toCurrency) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        toCurrency: currencies.find(currency => currency !== formData.fromCurrency),
      }));
    }
  }, [formData.fromCurrency]);
  
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    
    const payload = {
      idCurrencyConversion: formData.idCurrencyConversion,
      fromCurrency: formData.fromCurrency,
      toCurrency: formData.toCurrency,
      conversionRate: parseFloat(formData.conversionRate),
      rateDate: moment(formData.rateDate).format()
    };
    console.log('payload', payload);
    setLoading(true);
    const service = (formData.idCurrencyConversion!==0)
    ? CurrConversionService.updateCurrencyConversion
    : CurrConversionService.addCurrencyConversion;

    try {
      const response = await service(payload);
      if (response.error) {
        throw new Error(response.error);
      }
      toast.success(`${formData.idCurrencyConversion!==0 ? 'Updated' : 'Added'} successfully!`, {
        position: 'top-right',
        autoClose: 2000
      });
      getCurrencyConversions();
      handleReset();
    } catch (err) {
      toast.error(err.message || 'Something went wrong!', {
        position: 'top-right',
        autoClose: 2000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (conversion) => {
    setFormData({
      ...conversion,
      rateDate: moment(conversion.rateDate).format("YYYY-MM-DD")
    });
    setIsEditing(true);
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setIsEditing(false);
  };

  const handleButtonClick = () => {
    handleReset();
    if (datePickerRef.current) {
      datePickerRef.current.setFocus();
    }
  };

  return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="row">
          <div className="col-lg-8 ">
            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between pb-3">
                <h5 className="m-0">List of Currency Conversion</h5>
                <button 
                  className="btn btn-primary btn-sm px-4"
                  onClick={handleButtonClick}
                >
                  Add New
                </button>
              </div>
              <div className="card-body">
                <div className="table-responsive text-nowrap">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>From Currency</th>
                        <th>To Currency</th>
                        <th className="text-end">Rate</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody className="table-border-bottom-0">
                      {currencyConversions && currencyConversions.map((conversion) => (
                        <tr key={conversion.idCurrencyConversion}>
                          <td>{moment(conversion.rateDate).format("MM/DD/YYYY")}</td>
                          <td>{conversion.fromCurrency}</td>
                          <td>{conversion.toCurrency}</td>
                          <td className="text-end">{Number(conversion.conversionRate).toFixed(2)}</td>
                          <td className="text-end">
                            <button 
                              type="button" 
                              className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
                              onClick={() => handleEdit(conversion)}
                            >
                              <span className="tf-icons bx bx-pencil"></span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">{isEditing ? 'Update' : 'Add'} Currency Conversion</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-2">
                    <label className="form-label mb-1">Date</label>
                    <br></br>
                    <DatePicker
                    ref={datePickerRef}
                    className="form-control"
                    dateFormat="MM/dd/yyyy"
                    placeholderText="Date"
                    selected={formData.rateDate} 
                    onChange={(date) => handleInputChange(date, 'rateDate')}
                    showYearDropdown
                    maxDate={new Date()}
                    />
                  </div>
                <div className="mb-2">
                  <label className="form-label mb-1">From Currency</label>
                  <select
                    className="form-select"
                    name="fromCurrency"
                    value={formData.fromCurrency}
                    onChange={(e) => handleInputChange(e.target.value, 'fromCurrency')}
                    required
                  >
                    {currencies.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-2">
                  <label className="form-label mb-1">To Currency</label>
                  <select
                    className="form-select"
                    name="toCurrency"
                    value={formData.toCurrency}
                    onChange={(e) => handleInputChange(e.target.value, 'toCurrency')}
                    required
                  >
                    {currencies
                      .filter((currency) => currency !== formData.fromCurrency)  // Filter out the selected 'fromCurrency'
                      .map((currency) => (
                        <option key={currency} value={currency}>
                          {currency}
                        </option>
                      ))}
                  </select>
                </div>

                  <div className="mb-2">
                    <label className="form-label mb-1">Rate</label>
                  <NumericFormat
                    className="form-control"
                    value={formData.conversionRate}
                    onValueChange={(values) => handleInputChange(values, 'conversionRate')}
                    decimalScale={5}
                    allowNegative={false}
                    thousandSeparator={true}
                    allowLeadingZeros={false}
                    placeholder="Add conversion rate"
                    maxLength={12}
                    required
                  />
                  </div>
                  <div className="text-center">
                    <button 
                      type="submit" 
                      className="btn btn-primary px-4 me-2"
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : 'Submit'}
                    </button>
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
          </div>
        </div>
      </div>
  )
}

export default CurrencyConversion