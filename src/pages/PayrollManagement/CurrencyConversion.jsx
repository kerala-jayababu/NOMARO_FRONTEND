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
  const [currencyConversionsMain, setCurrencyConversionsMain] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [formData, setFormData] = React.useState(initialFormState);
  const [isEditing, setIsEditing] = React.useState(false);
  const datePickerRef = useRef(null);
  const [fromDate, setFromDate] = React.useState(moment().format("YYYY-MM-DD"));
  
  useEffect(() => {
    getCurrencyConversions();
  }, []);
 
  const getCurrencyConversions = () => {
    setLoading(true);
    CurrConversionService.getAllCurrencyConversions()
      .then(res => {
        let filteredData = res.data.data.filter(item => moment(item.rateDate).isSameOrAfter(fromDate));
        setCurrencyConversions(filteredData);
        setCurrencyConversionsMain(res.data.data);
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

  const filterByDate = (date) => {
    setFromDate(date);
    let filteredData = currencyConversionsMain.filter(item => moment(item.rateDate).isSameOrAfter(date));
    setCurrencyConversions(filteredData);
  }


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

    // Check for duplicate entry
    const isDuplicate = currencyConversionsMain.some(conversion => 
      conversion.fromCurrency === formData.fromCurrency &&
      conversion.toCurrency === formData.toCurrency &&
      moment(conversion.rateDate).format('YYYY-MM-DD') === moment(formData.rateDate).format('YYYY-MM-DD') &&
      conversion.idCurrencyConversion !== formData.idCurrencyConversion // Exclude current record when editing
    );

    if (isDuplicate) {
      toast.error('A conversion rate for this currency pair and date already exists!', {
        position: 'top-right',
        autoClose: 4000
      });
      return;
    }
    
    const payload = {
      idCurrencyConversion: formData.idCurrencyConversion,
      fromCurrency: formData.fromCurrency,
      toCurrency: formData.toCurrency,
      conversionRate: parseFloat(formData.conversionRate),
      rateDate: moment(formData.rateDate).format()
    };
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
                <div className="list_menu">
                <div>
                  <label className='p-2'>From Date</label>
                  <DatePicker
                    className="form-control"
                    dateFormat="MM/dd/yyyy"
                    placeholderText="From Date"
                    selected={fromDate} 
                    onChange={(date) => filterByDate(date)}
                    showYearDropdown
                    maxDate={new Date()}
                    />
                </div>
                <button className="btn btn-primary btn-sm px-4" onClick={handleButtonClick}>Add New</button>
              </div>


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
                          <td className="text-end">{Number(conversion.conversionRate).toFixed(4)}</td>
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
                      {currencyConversions.length === 0 && (
                        <tr>
                          <td colSpan="5" className="text-center">No data found</td>
                        </tr>
                      )}
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
                    onValueChange={(values) => {
                      handleInputChange(values, 'conversionRate');
                    }}
                    decimalScale={4}
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