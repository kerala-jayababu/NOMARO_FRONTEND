import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Card from "../../components/card";
import Dropdown from "../../components/Dropdown";
import Input from "../../components/Input";
import RadioButton from "../../components/RadioButton";
import Button from "../../components/Button";
import Grid from "../../components/Grid";
import StatusBadge from "../../components/statusBadge";
import {
  fetchSalaryHead,
  getSalaryHeadById,
  addSalaryHead,
  updateSalaryHead,
} from "../../redux/reducers/salaryHead";
import { getAllOptions } from "../../redux/reducers/getAllOptions";

const SalaryHeads = () => {
  const [formData, setFormData] = useState({
    salaryHeadCode: "",
    salaryHeadName: "",
    type: "",
    taxability: "",
    calculationMethod: "",
    percentageOf: "",
    value: "",
    customFormula: "",
    defaultValue: "",
    activeStatus: true,
    orderNumber: "",
  });

  const [errors, setErrors] = useState({
    salaryHeadCode: "",
    salaryHeadName: "",
    orderNumber: "",
    customFormula: "",
  });

  const dispatch = useDispatch();

  // Access the fetched data from the Redux store
  const { salaryHeadList, status, error, currentSalaryHead } = useSelector(
    (state) => state.salaryHead
  );

  // Access the options data from the Redux store
  const { salaryHeads } = useSelector((state) => state.getAllOptions);

  // Columns for the Grid
  const columns = [
    { key: "salaryHeadCode", label: "S. H. Code" },
    { key: "salaryHeadName", label: "Salary Head Name" },
    { key: "orderNumber", label: "Order Number" },
    { key: "isActive", label: "Active Status" },
    { key: "actions", label: "" },
  ];

  // Fetch salary head data when the component mounts
  useEffect(() => {
    dispatch(fetchSalaryHead());
    dispatch(getAllOptions());
  }, [dispatch]);

  useEffect(() => {
    if (currentSalaryHead && Object.keys(currentSalaryHead).length > 0) {
      setFormData({
        salaryHeadCode: currentSalaryHead.salaryHeadCode,
        salaryHeadName: currentSalaryHead.salaryHeadName,
        type: currentSalaryHead.headType === "EARNING" ? "E" : "D",
        taxability: currentSalaryHead.isTaxable ? "Taxable" : "Non-Taxable",
        calculationMethod:
          currentSalaryHead.calculationMethod === "FORMULA"
            ? "Custom Formula"
            : currentSalaryHead.calculationMethod === "PERCENTAGE"
            ? "Percentage of"
            : "Fixed Amount",
        percentageOf: currentSalaryHead.idPercentageSalaryHead || "",
        value: currentSalaryHead.percentageValue || "",
        customFormula: currentSalaryHead.customFormula || "",
        defaultValue: currentSalaryHead.fixedValue || "",
        activeStatus: currentSalaryHead.isActive,
        orderNumber: currentSalaryHead.orderNumber,
      });
    }
  }, [currentSalaryHead]);

  // const handleEditClick = (id) => {
  //   dispatch(getSalaryHeadById(id));
  // };
  const [isEditing, setIsEditing] = useState(false);

const handleEditClick = (id) => {
  if (!isEditing) {
    setIsEditing(true);
    dispatch(getSalaryHeadById(id))
      .then(() => {
        setIsEditing(false);
      })
      .catch(() => {
        setIsEditing(false);
      });
  }
};


  const handleReset = () => {
    setFormData({
      salaryHeadCode: "",
      salaryHeadName: "",
      type: "",
      taxability: "",
      calculationMethod: "",
      percentageOf: "",
      value: "",
      customFormula: "",
      defaultValue: "",
      activeStatus: true,
      orderNumber: "",
    });
    setErrors({
      salaryHeadCode: "",
      salaryHeadName: "",
      orderNumber: "",
      customFormula: "",
    });
    dispatch({ type: "salaryHead/clearCurrentSalaryHead" });
  };

  // const handleChange = (e) => {
  //   const { name, value } = e.target;

  //   // Allow only numeric values for "orderNumber"
  //   if (name === "orderNumber" && isNaN(value)) {
  //     return; // Do nothing if the value is not a number
  //   }

  //   setFormData({
  //     ...formData,
  //     type: currentSalaryHead.headType === "EARNING" ? "E" : "D",
  //     [name]: value,
  //   });

  //   // Clear errors when the user starts typing
  //   setErrors({
  //     ...errors,
  //     [name]: "",
  //   });
  // };
  const validateField = (name, value) => {
    let error = "";
  
    switch (name) {
      case "salaryHeadCode":
        if (!value.trim()) {
          error = "Salary Head Code is required.";
        } else if (
          (!currentSalaryHead?.idSalaryHead ||
            currentSalaryHead.salaryHeadCode !== value) &&
          salaryHeadList.some(
            (head) => head.salaryHeadCode.toLowerCase() === value.toLowerCase()
          )
        ) {
          error = "Salary Head Code Already Exists.";
        }
        break;
  
      case "salaryHeadName":
        if (!value.trim()) {
          error = "Salary Head Name is required.";
        } else if (
          (!currentSalaryHead?.idSalaryHead ||
            currentSalaryHead.salaryHeadName !== value) &&
          salaryHeadList.some(
            (head) => head.salaryHeadName.toLowerCase() === value.toLowerCase()
          )
        ) {
          error = "Salary Head Name Already Exists.";
        }
        break;
  
      case "orderNumber":
        if (!value) {
          error = "Order Number is required.";
        } else if (
          !currentSalaryHead?.idSalaryHead &&
          salaryHeadList.some(
            (head) => Number(head.orderNumber) === Number(value)
          )
        ) {
          error = "Order Number Already Exists.";
        }
        break;
  
      case "customFormula":
        if (formData.calculationMethod === "Custom Formula") {
          if (!value.trim()) {
            error = "Custom Formula is required.";
          } else if (!isValidCustomFormula(value, salaryHeadList)) {
            error = "Invalid formula. Use valid Salary Head Codes and arithmetic operators.";
          }
        }
        break;
  
      default:
        break;
    }
  
    return error;
  };
  
  // const handleChange = (e) => {
  //   const { name, value } = e.target;
  
  //   // Allow only numeric values for "orderNumber"
  //   if (name === "orderNumber" && isNaN(value)) {
  //     return; // Do nothing if the value is not a number
  //   }
  
  //   // Update the formData state
  //   setFormData((prevFormData) => ({
  //     ...prevFormData,
  //     [name]: value,
  //   }));
  
  //   // Clear errors when the user starts typing
  //   setErrors((prevErrors) => ({
  //     ...prevErrors,
  //     [name]: "",
  //   }));
  // };

  const handleChange = (e) => {
    const { name, value } = e.target;
  
    // Allow only numeric values for "orderNumber"
    if (name === "orderNumber" && isNaN(value)) {
      return; // Do nothing if the value is not a number
    }
  
    // Update the formData state
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  
    // Validate the field
    const fieldError = validateField(name, value);
  
    // Update the errors state
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: fieldError,
    }));
  };
  


  // const handleRadioChange = (value, name) => {
  //   setFormData({
  //     ...formData,
  //     [name]: value,
  //   });
  // };
  const handleRadioChange = (value, name) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  
    if (name === "calculationMethod" && value === "Custom Formula") {
      const formulaError = validateField("customFormula", formData.customFormula);
      setErrors((prevErrors) => ({
        ...prevErrors,
        customFormula: formulaError,
      }));
    }
  };

  
  // const validateForm = () => {
  //   const newErrors = {};
  
  //   // Validate mandatory fields
  //   if (!formData.salaryHeadCode.trim()) {
  //     newErrors.salaryHeadCode = "Salary Head Code is required.";
  //   } else if (
  //     // Only check for existing Salary Head Code if it's a new salary head or updated code is different
  //     (!currentSalaryHead?.idSalaryHead ||
  //       currentSalaryHead.salaryHeadCode !== formData.salaryHeadCode) &&
  //     salaryHeadList.some(
  //       (head) => head.salaryHeadCode.toLowerCase() === formData.salaryHeadCode.toLowerCase()
  //     )
  //   ) {
  //     newErrors.salaryHeadCode = "Salary Head Code Already Exists.";
  //   }
  
  //   // Validate Salary Head Name
  //   if (!formData.salaryHeadName.trim()) {
  //     newErrors.salaryHeadName = "Salary Head Name is required.";
  //   } else if (
  //     // Only check for existing Salary Head Name if it's a new salary head or updated name is different
  //     (!currentSalaryHead?.idSalaryHead ||
  //       currentSalaryHead.salaryHeadName !== formData.salaryHeadName) &&
  //     salaryHeadList.some(
  //       (head) => head.salaryHeadName.toLowerCase() === formData.salaryHeadName.toLowerCase()
  //     )
  //   ) {
  //     newErrors.salaryHeadName = "Salary Head Name Already Exists.";
  //   }
  
  //   // Validate mandatory orderNumber
  //   if (!formData.orderNumber) {
  //     newErrors.orderNumber = "Order Number is required.";
  //   } else {
  //     // Validate unique orderNumber
  //     if (
  //       !currentSalaryHead?.idSalaryHead &&
  //       salaryHeadList.some(
  //         (head) => Number(head.orderNumber) === Number(formData.orderNumber)
  //       )
  //     ) {
  //       newErrors.orderNumber = "Order Number Already Exists.";
  //     }
  //   }
  
  //   // Validate Custom Formula
  //   if (formData.calculationMethod === "Custom Formula") {
  //     if (!formData.customFormula.trim()) {
  //       newErrors.customFormula = "Custom Formula is required.";
  //     } else if (!isValidCustomFormula(formData.customFormula, salaryHeadList)) {
  //       newErrors.customFormula = "Invalid formula. Use valid Salary Head Codes and arithmetic operators.";
  //     }
  //   }
  
  //   setErrors(newErrors);
  //   return Object.keys(newErrors).length === 0; // Return true if no errors
  // };

  const validateForm = () => {
    const newErrors = {};
  
    // Validate all fields
    Object.keys(formData).forEach((field) => {
      const fieldError = validateField(field, formData[field]);
      if (fieldError) {
        newErrors[field] = fieldError;
      }
    });
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };
  
  

  const isValidCustomFormula = (formula, salaryHeadList) => {
    console.log("Formula:", formula);
    const salaryHeadCodes = salaryHeadList.map((head) => head.salaryHeadCode);
    console.log("Salary Head Codes:", salaryHeadCodes);

    const escapedSalaryHeadCodes = salaryHeadCodes.map(code => code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    console.log("Escaped Salary Head Codes:", escapedSalaryHeadCodes);
    const regex = new RegExp(`\\b(${escapedSalaryHeadCodes.join("|")})\\b`, "g");
    console.log("Regex:", regex);

    const validFormula = formula.replace(regex, '').replace(/[0-9+\-*/()\s]/g, '').trim();
    console.log("Remaining after replacements:", validFormula);

    return validFormula === '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return; // Stop submission if validation fails
    }

    const data = {
      salaryHeadCode: formData.salaryHeadCode,
      salaryHeadName: formData.salaryHeadName,
      headType: formData.type === "E" ? "EARNING" : "DEDUCTION",
      isTaxable: formData.taxability === "Taxable",
      calculationMethod:
        formData.calculationMethod === "Custom Formula"
          ? "FORMULA"
          : formData.calculationMethod === "Percentage of"
          ? "PERCENTAGE"
          : "FIXEDAMOUNT",
      idPercentageSalaryHead: formData.percentageOf || null,
      percentageValue: formData.value || 0,
      customFormula: formData.customFormula || "",
      fixedValue: formData.defaultValue || 0,
      isActive: formData.activeStatus,
      orderNumber: formData.orderNumber,
    };

    // Check if it's an update
    if (currentSalaryHead?.idSalaryHead) {
      // Update existing salary head
      dispatch(
        updateSalaryHead({ ...data, idSalaryHead: currentSalaryHead.idSalaryHead })
      )
        .then((response) => {
          if (response.payload) {
            console.log("Salary Head updated successfully:", response.payload);
            dispatch(fetchSalaryHead());
            handleReset(); // Reset the form after successful submission
          }
        })
        .catch((error) => {
          console.error("Error updating salary head:", error);
        });
    } else {
      // Add new salary head
      dispatch(addSalaryHead(data))
        .then((response) => {
          if (response.payload) {
            console.log("Salary Head added successfully:", response.payload);
            dispatch(fetchSalaryHead());
            handleReset(); // Reset the form after successful submission
          }
        })
        .catch((error) => {
          console.error("Error adding salary head:", error);
        });
    }
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        {/* Salary Head List */}
        <div className="col-lg-8">
          <Card title="List of Salary Heads">
              <Grid
                columns={columns}
                data={salaryHeadList.map((head) => ({
                  salaryHeadCode: (
                    <span className="bold">
                      {head.salaryHeadCode}
                    </span>
                  ),
                  salaryHeadName: (
                    <div className="salary-head-name">
                      <span className="badge-headtype" style={{ backgroundColor: head?.headType === "EARNING" ? "#5d8b1b" : "#701c21" }}>
                          {head?.headType === "EARNING" ? "E" : "D"}
                      </span>
                      <span className="name">{head.salaryHeadName}</span>
                    </div>
                  ),
                  orderNumber: (
                    <span>
                      {head.orderNumber}
                    </span>
                  ),
                  isActive: (
                    <StatusBadge
                      status={head.isActive ? "Active" : "Inactive"}
                    />
                  ),
                  id: head.idSalaryHead,
                }))}
                onEditClick={handleEditClick}
                idKey="id"
                modalId="editSalaryHeadModal"
              />
          </Card>
        </div>

        {/* Add/Update Salary Head */}
        <div className="col-lg-4">
          <Card title="Add/Update Salary Head">
            <form onSubmit={handleSubmit}>
              <Input
                label="Salary Head Code"
                name="salaryHeadCode"
                value={formData.salaryHeadCode}
                onChange={handleChange}
                maxLength="10"
                error={errors.salaryHeadCode}
              />
              <Input
                label="Salary Head Name"
                name="salaryHeadName"
                value={formData.salaryHeadName}
                onChange={handleChange}
                maxLength="50"
                error={errors.salaryHeadName}
              />
              <Input
                label="Order Number"
                name="orderNumber"
                value={formData.orderNumber}
                onChange={handleChange}
                maxLength="3"
                error={errors.orderNumber}
              />
              <div className="mb-2">
                {/* <label className="form-label mb-1">Type of Salary Head</label> */}
                <RadioButton
                  name="type"
                  options={[
                    { value: "E", label: "Earning" },
                    { value: "D", label: "Deduction" },
                  ]}
                  selectedValue={formData.type}
                  onChange={(value) => handleRadioChange(value, "type")}
                />
              </div>
              <div className="mb-2">
                {/* <label className="form-label mb-1">Taxability</label> */}
                <RadioButton
                  name="taxability"
                  options={[
                    { value: "Taxable", label: "Taxable" },
                    { value: "Non-Taxable", label: "Non-Taxable" },
                  ]}
                  selectedValue={formData.taxability}
                  onChange={(value) => handleRadioChange(value, "taxability")}
                />
              </div>
              <Dropdown
                label="Calculation Method"
                name="calculationMethod"
                value={formData.calculationMethod}
                onChange={handleChange}
                options={[
                  { value: "Fixed Amount", label: "Fixed Amount" },
                  { value: "Percentage of", label: "Percentage of" },
                  { value: "Custom Formula", label: "Custom Formula" },
                ]}
              />
              {formData.calculationMethod === "Percentage of" && (
                <div className="row mb-0">
                  <div className="col-md-8 mb-2">
                    <Dropdown
                      label="Percentage of"
                      name="percentageOf"
                      value={formData.percentageOf}
                      onChange={handleChange}
                      options={salaryHeads.map((head) => ({
                        value: head.value,
                        label: head.displayName,
                      }))}
                    />
                  </div>
                  <div className="col-md-4 mb-2">
                  <Input
                    label="Default Value"
                    name="defaultValue"
                    value={formData.defaultValue}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*\.?\d{0,2}$/.test(value)) {
                        handleChange(e);
                      }
                    }}
                    maxLength="9"
                    pattern="^\d*\.?\d{0,2}$"
                  />
                  </div>
                </div>
              )}
              {formData.calculationMethod === "Custom Formula" && (
                <>
                  <Input
                    label="Custom Formula"
                    name="customFormula"
                    value={formData.customFormula}
                    onChange={handleChange}
                    maxLength="100"
                    placeholder="(BP + DA) / 10"
                    error={errors.customFormula}
                  />
                  {/* <Input
                    label="Value"
                    name="value"
                    value={formData.value}
                    onChange={handleChange}
                    maxLength="5"
                  /> */}
                </>
              )}
              {formData.calculationMethod === "Fixed Amount" && (
                <Input
                  label="Default Value"
                  name="defaultValue"
                  value={formData.defaultValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*\.?\d{0,2}$/.test(value)) {
                      handleChange(e);
                    }
                  }}
                  maxLength="9"
                  pattern="^\d*\.?\d{0,2}$"
                />
              )}
              <div className="mb-3 pt-2">
                <div className="form-check form-switch">
                  <label
                    className="form-check-label"
                    htmlFor="flexSwitchCheckDefault"
                  >
                    Active Status
                  </label>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="flexSwitchCheckDefault"
                    checked={formData.activeStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        activeStatus: e.target.checked,
                      })
                    }
                  />
                </div>
              </div>
              <div className="text-center">
                <Button type="submit" className="btn btn-primary px-4 me-2">
                  {currentSalaryHead?.idSalaryHead ? "Update" : "Submit"}
                </Button>
                <Button
                  type="button"
                  className="btn btn-outline-secondary px-4"
                  onClick={handleReset}
                >
                  Reset
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SalaryHeads;