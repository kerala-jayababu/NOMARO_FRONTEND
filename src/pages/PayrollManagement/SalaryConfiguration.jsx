import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Grid from "../../components/Grid";
import Pagination from "../../components/pagination";
import Input from "../../components/Input";
import SmallTable from "../../components/smallTable";
import Button from "../../components/Button";
import {
  getAllEmployeeSalaryConfig,
  getEmployeeSalaryConfigById,
  AddEmployeeSalaryConfig,
  updateEmployeeSalaryConfig,
} from "../../redux/reducers/salaryConfig";
import { getAllOptions } from "../../redux/reducers/getAllOptions";
import { getAllEmployeeDetails } from "../../redux/reducers/getAllEmployeeDetails";
import { getSalaryHeadById } from "../../redux/reducers/salaryHead";
import {
  getAllSalaryTemplates,
  getSalaryTemplateById,
} from "../../redux/reducers/salaryTemplate";

function SalaryConfiguration() {
  const dispatch = useDispatch();
  const { salaryConfigList, status, error } = useSelector(
    (state) => state.salaryConfig
  );
  const { options: employeeList } = useSelector(
    (state) => state.getAllEmployeeDetails
  );
  const { salaryTemplates, salaryTemplateDetails } = useSelector(
    (state) => state.salaryTemplate
  ); // Get salaryTemplates from the state
  const [templateOptions, setTemplateOptions] = useState([]);
  const { salaryHeads } = useSelector((state) => state.getAllOptions);
  const [currentPage, setCurrentPage] = useState(1);
  const [employeeCode, setEmployeeCode] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [designation, setDesignation] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [templateName, setTemplateName] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [salaryHeadOptions, setSalaryHeadOptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalDeductions, setTotalDeductions] = useState(0);
  const [netSalary, setNetSalary] = useState(0);
  const [selectedTemplateDetails, setSelectedTemplateDetails] = useState(null);
  const [errors, setErrors] = useState({});

  const [rows, setRows] = useState([
    {
      salaryHead: "Basic Pay",
      method: "Percentage of",
      value: "",
      formula: "",
    },
  ]);
  const [data, setData] = useState([]);

  const methods = [
    { value: "Percentage of", label: "Percentage of" },
    { value: "Fixed Amount", label: "Fixed Amount" },
    { value: "Custom Formula", label: "Custom Formula" },
  ];

  const modalColumns = [
    {
      header: "Salary Head Name",
      field: "salaryHead",
      type: "select",
      options: salaryHeadOptions,
      onChange: (e, index) => handleSalaryHeadChange(e.target.value, index), // Add this line
    },
    {
      header: "Calculation Method",
      field: "method",
      type: "select",
      options: methods,
    },
    { header: "Value/Formula", field: "value", type: "dynamic" },
  ];

  const columns = [
    { key: "empCode", label: "Emp. Code" },
    { key: "empName", label: "Employee Name" },
    { key: "designation", label: "Designation" },
    { key: "joiningDate", label: "Joining Date" },
    { key: "totalEarnings", label: "Total Earnings" },
    { key: "totalDeductions", label: "Total Deductions" },
    { key: "netSalary", label: "Net Salary" },
    { key: "actions" },
  ];

  const employeeOptions = employeeList.map((employee) => ({
    value: employee.employeeCode,
    label: employee.employeeCode,
  }));

  useEffect(() => {
    dispatch(getAllEmployeeSalaryConfig());
  }, [dispatch]);

  useEffect(() => {
    dispatch(getAllOptions());
  }, [dispatch]);

  useEffect(() => {
    dispatch(getAllEmployeeDetails());
  }, [dispatch]);

  useEffect(() => {
    dispatch(getAllSalaryTemplates());
  }, [dispatch]);

  useEffect(() => {
    if (salaryTemplates?.length > 0) {
      const templateNames = salaryTemplates.map((template) => ({
        value: template.idSalaryTemplate, // Store the id
        label: template.salaryTemplateName, // Display the template name
      }));
      setTemplateOptions(templateNames);
    }
  }, [salaryTemplates]);

  useEffect(() => {
    if (salaryHeads.length > 0) {
      const formattedSalaryHeads = salaryHeads.map((head) => ({
        value: head.value.toString(),
        label: head.displayName,
      }));

      setSalaryHeadOptions([
        { value: "", label: "Select Salary Head" }, // Default option
        ...formattedSalaryHeads,
      ]);
    }
  }, [salaryHeads]);

  useEffect(() => {
    if (salaryConfigList.length > 0) {
      const transformedData = salaryConfigList.map((item) => ({
        idEmployeeSalaryConfig: item.idEmployeeSalaryConfig,
        empCode: item.employeeCode,
        empName: item.employeeName,
        designation: item.designationName,
        joiningDate: new Date(item.joiningDate).toLocaleDateString("en-US", {
          year: "2-digit",
          month: "2-digit",
          day: "2-digit",
        }),
        totalEarnings: item.totalEarnings || 0,
        totalDeductions: item.totalDeductions || 0,
        netSalary: item.netSalary || 0,
      }));
      setData(transformedData);
    }
  }, [salaryConfigList]);

  useEffect(() => {
    if (salaryTemplates?.data?.length > 0) {
      const formattedTemplates = salaryTemplates.data.map((template) => ({
        value: template.idSalaryTemplate.toString(),
        label: template.salaryTemplateName,
      }));
      setTemplateOptions(formattedTemplates);
    }
  }, [salaryTemplates]);


  useEffect(() => {
    if (selectedEmployee) {
      setEmployeeCode(selectedEmployee.employeeCode || "");
      setEmployeeName(selectedEmployee.employeeName || "");
      setDesignation(selectedEmployee.designationName || "");
      setTemplateName(selectedEmployee.idSalaryTemplate?.toString() || "");
  
      // Fetch template details if idSalaryTemplate is set
      if (selectedEmployee.idSalaryTemplate) {
        dispatch(getSalaryTemplateById(selectedEmployee.idSalaryTemplate))
          .then((response) => {
            if (response.payload?.data) {
              const templateDetails = response.payload.data.salaryTemplateDetails;
              if (templateDetails && Array.isArray(templateDetails)) {
                const mappedRows = templateDetails.map((detail) => ({
                  salaryHead: detail.idSalaryHead.toString(),
                  method: getMethodFromCalculationMethod(detail.calculationMethod),
                  value:
                    detail.calculationMethod === "FIXEDAMOUNT"
                      ? detail.fixedAmount
                      : detail.calculationMethod === "PERCENTAGE"
                      ? detail.percentageValue
                      : "",
                  formula: detail.customFormula || "",
                  type: detail.headType || "EARNING", // Default to "EARNING" if not defined
                  percentageOf: detail.percentageOfIdSalaryHead?.toString() || "", // For "Percentage of" method
                }));
                setRows(mappedRows);
              }
            }
          })
          .catch((error) => {
            console.error("Error fetching template details:", error);
          });
      }
  
      const updatedRows = selectedEmployee.employeeSalaryConfigDetails.map(
        (detail) => ({
          idEmployeeSalaryConfigDetail: detail.idEmployeeSalaryConfigDetail,
          salaryHead: detail.idSalaryHead.toString(),
          method:
            detail.calculationMethod === "FIXED"
              ? "Fixed Amount"
              : detail.calculationMethod === "PERCENTAGE"
              ? "Percentage of"
              : detail.calculationMethod === "FORMULA"
              ? "Custom Formula"
              : "",
          value: detail.fixedAmount || detail.percentageValue || "",
          formula: detail.customFormula || "",
          percentageOf: "", // Add this line to ensure percentageOf is always defined
          type: detail.headType || "EARNING", // Ensure the type property is set
        })
      );
      setRows(updatedRows);
  
      // Update totals
      setTotalEarnings(selectedEmployee.totalEarnings || 0);
      setTotalDeductions(selectedEmployee.totalDeductions || 0);
      setNetSalary(selectedEmployee.netSalary || 0);
    }
  }, [selectedEmployee]);

  useEffect(() => {
    if (salaryTemplateDetails && salaryTemplateDetails.length > 0) {
      const updatedRows = salaryTemplateDetails.map((detail) => ({
        idSalaryTemplateDetail: detail.idSalaryTemplateDetail,
        salaryHead: detail.idSalaryHead.toString(),
        method:
          detail.calculationMethod === "FIXED"
            ? "Fixed Amount"
            : detail.calculationMethod === "PERCENTAGE"
            ? "Percentage of"
            : "Custom Formula",
        value: detail.fixedAmount || detail.percentageValue || "",
        formula: detail.customFormula || "",
        headType: detail.headType,
        isTaxable: detail.isTaxable,
      }));
      setRows(updatedRows);
      calculateTotals(updatedRows);
    }
  }, [salaryTemplateDetails]);

  useEffect(() => {
    if (salaryTemplateDetails && Array.isArray(salaryTemplateDetails)) {
      const mappedRows = salaryTemplateDetails.map((detail) => ({
        salaryHead: detail.idSalaryHead.toString(),
        method: getMethodFromCalculationMethod(detail.calculationMethod),
        value:
          detail.calculationMethod === "FIXEDAMOUNT"
            ? detail.fixedAmount
            : detail.calculationMethod === "PERCENTAGE"
            ? detail.percentageValue
            : "",
        formula: detail.customFormula || "",
        type: detail.headType || "EARNING", // Default to "EARNING" if not defined
        percentageOf: detail.percentageOfIdSalaryHead?.toString() || "", // For "Percentage of" method
      }));

      setRows(mappedRows);
    }
  }, [salaryTemplateDetails]);

  const handleSalaryHeadChange = async (id, index) => {
    if (id) {
      try {
        const response = await dispatch(getSalaryHeadById(id));
        if (response.payload && response.payload.success) {
          const salaryHeadData = response.payload.data;


          let updatedRow = { ...rows[index] };

          // Update calculation method
          switch (salaryHeadData.calculationMethod) {
            case "FIXEDAMOUNT":
              updatedRow.method = "Fixed Amount";
              updatedRow.value = salaryHeadData.fixedValue || "";
              break;
            case "PERCENTAGE":
              updatedRow.method = "Percentage of";
              updatedRow.value = salaryHeadData.percentageValue || "";
              if (salaryHeadData.idPercentageSalaryHead) {
                const percentageResponse = await dispatch(
                  getSalaryHeadById(salaryHeadData.idPercentageSalaryHead)
                );
                if (
                  percentageResponse.payload &&
                  percentageResponse.payload.success
                ) {
                  const percentageSalaryHeadData =
                    percentageResponse.payload.data;
                  updatedRow.percentageOf =
                    percentageSalaryHeadData.idSalaryHead.toString();
                }
              }
              break;
            case "FORMULA":
              updatedRow.method = "Custom Formula";
              updatedRow.formula = salaryHeadData.customFormula || "";
              break;
            default:
              updatedRow.method = "Percentage of";
          }

          if (updatedRow.method !== "Custom Formula") {
            updatedRow.formula = "";
          }
          if (updatedRow.method !== "Percentage of") {
            updatedRow.percentageOf = "";
          }


          // Add type (EARNING or DEDUCTION) to the row
          updatedRow.type = salaryHeadData.headType || "EARNING"; // Default to EARNING if type is not defined

          const updatedRows = [...rows];
          updatedRows[index] = updatedRow;
          setRows(updatedRows);

          // Recalculate totals after updating the row
          calculateTotals(updatedRows);
        }
      } catch (error) {
        console.error("Error fetching salary head details:", error);
      }
    }
  };

  const handleTemplateChange = (e) => {
    const selectedTemplateId = e.target.value;
    setTemplateName(selectedTemplateId);

    if (selectedTemplateId) {
      dispatch(getSalaryTemplateById(selectedTemplateId)).then((response) => {
        if (response.payload && response.payload.data) {
          const netCalculationMethod = response.payload.data;
          setTotalEarnings(netCalculationMethod.totalEarnings);
          setTotalDeductions(netCalculationMethod.totalDeductions);
          setNetSalary(netCalculationMethod.netSalary);
          const templateDetails = response.payload.data.salaryTemplateDetails;
          if (templateDetails && Array.isArray(templateDetails)) {
            const mappedRows = templateDetails.map((detail) => ({
              salaryHead: detail.idSalaryHead.toString(),
              method: getMethodFromCalculationMethod(detail.calculationMethod),
              value:
                detail.calculationMethod === "FIXEDAMOUNT"
                  ? detail.fixedAmount
                  : detail.calculationMethod === "PERCENTAGE"
                  ? detail.percentageValue
                  : "",
              formula: detail.customFormula || "",
              type: detail.headType || "EARNING", // Default to "EARNING" if not defined
              percentageOf: detail.percentageOfIdSalaryHead?.toString() || "", // For "Percentage of" method
            }));

            setRows(mappedRows);
          }
        }
      });
    } else {
      setRows([
        {
          salaryHead: "",
          method: "Percentage of",
          value: "",
          formula: "",
        },
      ]);
    }
  };

  const getMethodFromCalculationMethod = (method) => {
    switch (method) {
      case "FIXEDAMOUNT":
        return "Fixed Amount";
      case "PERCENTAGE":
        return "Percentage of";
      case "FORMULA":
        return "Custom Formula";
      default:
        return "Percentage of";
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Check if Employee Code is missing
    if (!employeeCode) {
      newErrors.employeeCode = "Employee Code is required";
    }

    // Check if Employee Name is missing
    if (!employeeName) {
      newErrors.employeeName = "Employee Name is required";
    }

    // Check if Designation is missing
    if (!designation) {
      newErrors.designation = "Designation is required";
    }

    // Check if calculation method is missing for any row
    rows.forEach((row, index) => {
      if (!row.method) {
        newErrors[`row-${index}-method`] = "Calculation method is required";
      }
    });

    // Check if total earnings, deductions, or net salary are missing
    if (totalEarnings === 0) {
      newErrors.totalEarnings = "Total Earnings is required";
    }
    if (totalDeductions === 0) {
      newErrors.totalDeductions = "Total Deductions is required";
    }
    if (netSalary === 0) {
      newErrors.netSalary = "Net Salary is required";
    }
    if (netSalary < 0) {
      newErrors.netSalary = "Net Salary cannot be negative";
    }

    setErrors(newErrors);

    // Return true if there are no errors
    return Object.keys(newErrors).length === 0;
  };


  const handlePageChange = (page) => setCurrentPage(page);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const filteredData = data.filter(
    (item) =>
      (item.empCode &&
        item.empCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.empName &&
        item.empName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredData.length / 5);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * 5,
    currentPage * 5
  );

  const handleEmployeeCodeChange = (selectedCode) => {
    setEmployeeCode(selectedCode);

    // Revalidate Employee Code
    if (selectedCode) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        employeeCode: "",
        employeeName: "",
        designation: "",
      }));
    }

    const selectedEmployee = employeeList.find(
      (employee) => employee.employeeCode === selectedCode
    );

    if (selectedEmployee) {
      setSelectedEmployeeId(selectedEmployee.idEmployee);
      setEmployeeName(selectedEmployee.fullName);
      setDesignation(selectedEmployee.designation);
    }
  };

  const handleAddRow = () => {
    setRows([
      ...rows,
      { salaryHead: "", method: "Percentage of", value: "", formula: "" },
    ]);
  };

  const handleDeleteRow = (index) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleInputChange = (updatedRows, rowIndex, field) => {
    if (field === "salaryHead") {
      handleSalaryHeadChange(updatedRows[rowIndex].salaryHead, rowIndex);
    } else {
      updatedRows[rowIndex].value = parseFloat(updatedRows[rowIndex].value) || 0;
      setRows(updatedRows);
      calculateTotals(updatedRows); // Recalculate totals after updating rows
    }

    // Revalidate the calculation method for the row
    if (field === "method" && updatedRows[rowIndex].method) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [`row-${rowIndex}-method`]: "",
      }));
    }
  };

  const handleAddClick = () => {
    setTotalEarnings(0);
    setTotalDeductions(0);
    setNetSalary(0);
    resetForm();
    setTemplateName(""); // Reset template name

    // Explicitly clear the fields that should not retain values from the Edit state
    setTotalEarnings(0); // Ensure net salary values are reset
    setTotalDeductions(0);
    setNetSalary(0);

    // Clear any errors related to these fields
    setErrors((prevErrors) => ({
      ...prevErrors,
      totalEarnings: "",
      totalDeductions: "",
      netSalary: "",
    }));
  };

  const handleEditClick = (id) => {
    dispatch(getEmployeeSalaryConfigById(id))
      .then((response) => {
        if (response.payload?.data) {
          const employeeData = response.payload.data;
          setSelectedEmployee(employeeData);
          setEmployeeCode(employeeData.employeeCode || "");
          setEmployeeName(employeeData.employeeName || "");
          setDesignation(employeeData.designationName || "");
          setTemplateName(employeeData.idSalaryTemplate?.toString() || "");
  
          // Ensure these are set as numbers
          setTotalEarnings(Number(employeeData.totalEarnings || 0));
          setTotalDeductions(Number(employeeData.totalDeductions || 0));
          setNetSalary(Number(employeeData.netSalary || 0));
  
          // Fetch template details if idSalaryTemplate is set
          if (employeeData.idSalaryTemplate) {
            dispatch(getSalaryTemplateById(employeeData.idSalaryTemplate))
              .then((templateResponse) => {
                if (templateResponse.payload?.data) {
                  const templateDetails = templateResponse.payload.data.salaryTemplateDetails;
                  if (templateDetails && Array.isArray(templateDetails)) {
                    const mappedRows = templateDetails.map((detail) => ({
                      salaryHead: detail.idSalaryHead.toString(),
                      method: getMethodFromCalculationMethod(detail.calculationMethod),
                      value:
                        detail.calculationMethod === "FIXEDAMOUNT"
                          ? detail.fixedAmount
                          : detail.calculationMethod === "PERCENTAGE"
                          ? detail.percentageValue
                          : "",
                      formula: detail.customFormula || "",
                      type: detail.headType || "EARNING", // Default to "EARNING" if not defined
                      percentageOf: detail.percentageOfIdSalaryHead?.toString() || "", // For "Percentage of" method
                    }));
                    setRows(mappedRows);
                    console.log("mappedRows", mappedRows);
                    calculateTotals(mappedRows);
                  }
                }
              })
              .catch((error) => {
                console.error("Error fetching template details:", error);
              });
          }
  
          const updatedRows = employeeData.employeeSalaryConfigDetails.map(
            (detail) => ({
              idEmployeeSalaryConfigDetail: detail.idEmployeeSalaryConfigDetail,
              salaryHead: detail.idSalaryHead.toString(),
              method:
                detail.calculationMethod === "FIXED"
                  ? "Fixed Amount"
                  : detail.calculationMethod === "PERCENTAGE"
                  ? "Percentage of"
                  : detail.calculationMethod === "FORMULA"
                  ? "Custom Formula"
                  : "",
              value: Number(
                detail.fixedAmount || detail.percentageValue || 0
              ).toString(),
              formula: detail.customFormula || "",
              percentageOf: detail.percentageOfIdSalaryHead?.toString() || "",
              type: detail.headType || "EARNING",
            })
          );
          setRows(updatedRows);
        }
      })
      .catch((error) => console.error("Error fetching employee data:", error));
  };
  useEffect(() => {
    const modal = document.getElementById("SalaryConfigurationModal");
    if (modal) {
      modal.addEventListener("hidden.bs.modal", resetForm);
    }

    return () => {
      if (modal) {
        modal.removeEventListener("hidden.bs.modal", resetForm);
      }
    };
  }, []);

  const handleSubmit = () => {
    // Validate the form
    if (!validateForm()) {
      return; // Stop submission if validation fails
    }


    const salaryConfigData = {
      idEmployeeSalaryConfig: selectedEmployee?.idEmployeeSalaryConfig || 0,
      idEmployee: selectedEmployeeId,
      idSalaryTemplate: parseInt(templateName),
      activeStatus: true,
      totalEarnings: totalEarnings,
      totalDeductions: totalDeductions,
      validFrom: new Date().toISOString(),
      netSalary: netSalary,
      employeeCode: employeeCode,
      employeeName: employeeName,
      idDesignation: selectedEmployee?.idDesignation || 0,
      designationName: designation,
      idDepartment: selectedEmployee?.idDepartment || 0,
      departmentName: selectedEmployee?.departmentName || "",
      joiningDate: selectedEmployee?.joiningDate || new Date().toISOString(),
      gender: selectedEmployee?.gender || "Not Specified",
      emailID: selectedEmployee?.emailID || "",
      phoneNumber1: selectedEmployee?.phoneNumber1 || "",
      phoneNumber2: selectedEmployee?.phoneNumber2 || "",
      currentStatus: selectedEmployee?.currentStatus || "Active",
      employeeSalaryConfigDetails: rows.map((row) => ({
        idEmployeeSalaryConfigDetail: row.idEmployeeSalaryConfigDetail || 0,
        idEmployeeSalaryConfig: selectedEmployee?.idEmployeeSalaryConfig || 0,
        idSalaryHead: parseInt(row.salaryHead) || 0,
        calculationMethod:
          row.method === "Percentage of"
            ? "PERCENTAGE"
            : row.method === "Fixed Amount"
            ? "FIXED"
            : row.method === "Custom Formula"
            ? "FORMULA"
            : "",
        fixedAmount: row.method === "Fixed Amount" ? parseFloat(row.value) : 0,
        percentageValue:
          row.method === "Percentage of" ? parseFloat(row.value) : 0,
        customFormula: row.method === "Custom Formula" ? row.formula : "",
      })),
    };

    if (selectedEmployee) {
      // Update existing salary configuration
      dispatch(updateEmployeeSalaryConfig(salaryConfigData))
        .then((response) => {
          console.log(
            "Employee salary configuration updated successfully:",
            response
          );
          resetForm();
          dispatch(getAllEmployeeSalaryConfig()); // Refresh the list
          // Close the modal
          const modal = document.getElementById("SalaryConfigurationModal");
          if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            bsModal.hide(); // Close the modal
          }
        })
        .catch((error) => {
          console.error("Error updating employee salary configuration:", error);
        });
    } else {
      // Add new salary configuration
      dispatch(AddEmployeeSalaryConfig(salaryConfigData))
        .then((response) => {
          console.log(
            "Employee salary configuration added successfully:",
            response
          );
          resetForm();
          dispatch(getAllEmployeeSalaryConfig()); // Refresh the list
          // Close the modal
          const modal = document.getElementById("SalaryConfigurationModal");
          if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            bsModal.hide(); // Close the modal
          }
        })
        .catch((error) => {
          console.error("Error adding employee salary configuration:", error);
        });
    }
  };

  const resetForm = () => {
    setSelectedEmployee(null);
    setEmployeeCode("");
    setEmployeeName("");
    setDesignation("");
    setTemplateName("");
    setRows([
      {
        salaryHead: "Basic Pay",
        method: "Percentage of",
        value: "",
        formula: "",
      },
    ]);
    setTotalEarnings(0);
    setTotalDeductions(0);
    setNetSalary(0);
    setErrors({}); // Clear errors
  };

 

  const calculateTotals = (rows) => {
    let earnings = 0;

    let deductions = 0;

    rows.forEach((row) => {
      console.log("row.value", row);
      const value = parseFloat(row.value) || 0;
      console.log("value", value);
      console.log("row.type", row.headType);
      if (row.headType === "EARNING" || row.headType === "Earning") {
        earnings += value;
        console.log("earnings", earnings);
      } else if (row.headType === "DEDUCTION" || row.headType === "Deduction") {
        deductions += value;
      }
    });
    console.log("earnings-123", earnings);
    const net = earnings - deductions;

    // Ensure the values are set as numbers

    // Ensure the values are set as numbers
    setTotalEarnings(Number(earnings.toFixed(2)));
    setTotalDeductions(Number(deductions.toFixed(2)));
    setNetSalary(Number(net.toFixed(2)));

    // Clear errors for totals if they are valid

    if (earnings > 0) {
      setErrors((prevErrors) => ({ ...prevErrors, totalEarnings: "" }));
    }

    if (deductions > 0) {
      setErrors((prevErrors) => ({ ...prevErrors, totalDeductions: "" }));
    }

    if (net > 0) {
      setErrors((prevErrors) => ({ ...prevErrors, netSalary: "" }));
    }
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">List of Employee Salary Configuration</h5>
              <div className="list_menu">
                <div className="list_searchbox">
                  <input
                    type="search"
                    className="form-control"
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                  <i className="bx bx-search"></i>
                </div>
                <button
                  className="btn btn-primary btn-sm px-4"
                  type="button"
                  data-bs-toggle="modal"
                  data-bs-target="#SalaryConfigurationModal"
                  onClick={handleAddClick}
                >
                  Add
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <Grid
                  columns={columns}
                  data={paginatedData}
                  onEditClick={handleEditClick}
                  idKey="idEmployeeSalaryConfig"
                  modalId="SalaryConfigurationModal"
                />
              </div>
            </div>
            <div className="card-footer">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>
      </div>

      <div
        className="modal fade"
        id="SalaryConfigurationModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div
          className="modal-dialog modal-xl modal-dialog-centered"
          role="document"
        >
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="modalCenterTitle">
                {selectedEmployee ? "Update" : "Add"} Employee Salary Template
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body pt-1">
              <div className="row m-0">
                <div className="col-md-4 p-2">
                  <label className="form-label mb-1">Employee Code</label>
                  <select
                    className="form-select form-select-sm"
                    value={employeeCode}
                    onChange={(e) => handleEmployeeCodeChange(e.target.value)}
                    style={{ width: "72%", height: "40px" }}
                  >
                    <option>Select Employee Code</option>
                    {employeeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.employeeCode && (
                    <div className="text-danger">{errors.employeeCode}</div>
                  )}
                </div>
                <div className="col-md-4 p-2">
                  <Input
                    label="Employee Name"
                    value={employeeName}
                    readOnly={true}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    maxLength="25"
                  />
                  {errors.employeeName && (
                    <div className="text-danger">{errors.employeeName}</div>
                  )}
                </div>
                <div className="col-md-4 p-2">
                  <Input label="Designation" value={designation} readOnly={true} />
                  {errors.designation && (
                    <div className="text-danger">{errors.designation}</div>
                  )}
                </div>

                <div className="col-md-4 p-2">
                  <label className="form-label mb-1">Template Name</label>
                  <select
                    className="form-select form-select-sm"
                    value={templateName} // this state holds the selected template ID
                    onChange={handleTemplateChange}
                    style={{ width: "72%", height: "40px" }}
                  >
                    <option>Select Templates</option>
                    {templateOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="px-2">
                <SmallTable
                  initialRows={rows}
                  columns={modalColumns}
                  rowActions={true}
                  onAddRow={handleAddRow}
                  onDeleteRow={handleDeleteRow}
                  onInputChange={(updatedRows, rowIndex, field) =>
                    handleInputChange(updatedRows, rowIndex, field)
                  }
                />

                  <div className="total_salarycard">
                       
                        <ul
                          style={{
                            display: "flex",
                            gap: "20px",
                            listStyleType: "none",
                            padding: "0",
                          }}
                        >
                          <li style={{ margin: "0" }}>
                            <b>Total Earnings:</b> {totalEarnings.toFixed(2)}
                            {errors.totalEarnings && (
                              <span className="text-danger">
                                {" "}
                                {errors.totalEarnings}
                              </span>
                            )}
                          </li>
                          <li style={{ margin: "0" }}>
                            <b>Total Deductions:</b> {totalDeductions.toFixed(2)}
                            {errors.totalDeductions && (
                              <span className="text-danger">
                                {" "}
                                {errors.totalDeductions}
                              </span>
                            )}
                          </li>
                          <li style={{ margin: "0" }}>
                            <b>Net Salary:</b> {netSalary.toFixed(2)}
                            {errors.netSalary && (
                              <span className="text-danger"> {errors.netSalary}</span>
                            )}
                          </li>
                        </ul>

                      </div>
                
                

                {/* Display row-specific errors */}
                {Object.keys(errors).map((key) => {
                  if (key.startsWith("row-") && key.endsWith("-method")) {
                    return (
                      <div key={key} className="text-danger">
                        {errors[key]}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            
            <div className="modal-footer">
              <Button
                className="btn btn-primary btn-sm py-2 px-4 me-2"
                onClick={handleSubmit}
              >
                {selectedEmployee ? "Update" : "Submit"}
              </Button>
              <Button
                className="btn btn-outline-secondary btn-sm py-2 px-4"
                type="reset"
                onClick={resetForm}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalaryConfiguration;
