import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Grid from "../../components/Grid";
import SmallTable from "../../components/smallTable";
import Button from "../../components/Button"; // Imported Button component
import Label from "../../components/Label"; // Imported Label component
import Input from "../../components/Input"; // Imported Input component
import {
  getAllSalaryTemplates,
  getSalaryTemplateById,
  addSalaryTemplate,
  updateSalaryTemplate
} from "../../redux/reducers/salaryTemplate"; // Import the action to get salary templates
import { getAllOptions } from "../../redux/reducers/getAllOptions";
import { getSalaryHeadById } from "../../redux/reducers/salaryHead"; // Adjust the path as needed

const SalaryTemplate = () => {
  const [templateName, setTemplateName] = useState("");
  const [description, setDescription] = useState("");
  const [salaryRows, setSalaryRows] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalDeductions, setTotalDeductions] = useState(0);
  const [netSalary, setNetSalary] = useState(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [copyFromTemplate, setCopyFromTemplate] = useState(false);
  const [templateNameError, setTemplateNameError] = useState("");
const [tableError, setTableError] = useState("");
const [searchQuery, setSearchQuery] = useState("");

  const dispatch = useDispatch();

  const { salaryTemplates, salaryTemplateDetails, selectedTemplate } =
    useSelector((state) => state.salaryTemplate);
  const { salaryHeads } = useSelector((state) => state.getAllOptions);

  useEffect(() => {
    dispatch(getAllSalaryTemplates());
    dispatch(getAllOptions());
    setSalaryRows([
      {
        salaryHead: "",
        method: "Percentage of",
        value: "",
        formula: "",
      },
    ]);
  }, [dispatch]);

  useEffect(() => {
    if (editingTemplateId) {
      dispatch(getSalaryTemplateById(editingTemplateId));
    }
  }, [editingTemplateId, dispatch]);


useEffect(() => {
    if (selectedTemplate) {
      console.log("inside")
      setTemplateName(selectedTemplate.salaryTemplateName || "");
      setDescription(selectedTemplate.description || "");
      setTotalEarnings(selectedTemplate.totalEarnings || 0);
      setTotalDeductions(selectedTemplate.totalDeductions || 0);
      setNetSalary(selectedTemplate.netSalary || 0);
  
      if (
        selectedTemplate.salaryTemplateDetails &&
        Array.isArray(selectedTemplate.salaryTemplateDetails) &&
        selectedTemplate.salaryTemplateDetails.length > 0
      ) {
        console.log(selectedTemplate.salaryTemplateDetails, "selectedTemplate");
        setSalaryRows(
          selectedTemplate.salaryTemplateDetails.map((detail) => ({
            salaryHead: detail.idSalaryHead.toString(),
            method: getMethodFromCalculationMethod(detail.calculationMethod),
            value: detail.fixedAmount || detail.percentageValue || "",
            formula: detail.customFormula || "",
            type: detail.headType || "EARNING", // Default type to "EARNING" if not defined
            percentageOf: detail.percentageOf || "", // For "Percentage of" method
          }))
        );
      } else {
        setSalaryRows([
          {
            salaryHead: "",
            method: "Percentage of",
            value: "",
            formula: "",
            type: "EARNING",
          },
        ]);
      }
    }
  }, [selectedTemplate]);

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
        percentageOf: detail.percentageOf || "", // For "Percentage of" method
      }));
  
      setSalaryRows(mappedRows);
    }
  }, [salaryTemplateDetails]);
  
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
  

  const columns = [
    { key: "salaryTemplateName", label: "Template Name" },
    { key: "description", label: "Description" },
    {
      key: "activeStatus",
      label: "Status",
      render: (value) => {
        const status = value ? "Enabled" : "Disabled";
        return (
          <span
            className={`badge bg-label-${
              status === "Enabled" ? "success" : "warning"
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <button
          type="button"
          className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
          data-bs-toggle="modal"
          data-bs-target="#modalCenter"
          onClick={() => handleEditClick(row.idSalaryTemplate)}
        >
          <span className="bx bx-pencil"></span>
        </button>
      ),
    },
  ];

  // const handleTemplateSelection = (selectedId) => {
  //   if (selectedId) {
  //     // Call the API to get the salary template by ID
  //     dispatch(getSalaryTemplateById(selectedId)).then((response) => {
  //       const selectedTemplate = response.payload.data;
  //       if (selectedTemplate) {
  //         setTemplateName(selectedTemplate.salaryTemplateName);
  //         setDescription(selectedTemplate.description);
  //         setTotalEarnings(selectedTemplate.totalEarnings || 0);
  //         setTotalDeductions(selectedTemplate.totalDeductions || 0);
  //         setNetSalary(selectedTemplate.netSalary || 0);

  //         if (
  //           selectedTemplate.salaryTemplateDetails &&
  //           Array.isArray(selectedTemplate.salaryTemplateDetails)
  //         ) {
  //           // Map salaryTemplateDetails to salaryRows
  //           const mappedRows = selectedTemplate.salaryTemplateDetails.map(
  //             (detail) => ({
  //               salaryHead: detail.idSalaryHead.toString(),
  //               method: getMethodFromCalculationMethod(detail.calculationMethod),
  //               value:
  //                 detail.calculationMethod === 'FIXEDAMOUNT'
  //                   ? detail.fixedAmount
  //                   : detail.calculationMethod === 'PERCENTAGE'
  //                   ? detail.percentageValue
  //                   : '',
  //               formula: detail.customFormula || '',
  //               type: detail.headType || 'EARNING', // Default to "EARNING" if not defined
  //               percentageOf: detail.percentageOf || '', // For "Percentage of" method
  //             })
  //           );

  //           setSalaryRows(mappedRows);
  //         } else {
  //           setSalaryRows([
  //             {
  //               salaryHead: '',
  //               method: 'Percentage of',
  //               value: '',
  //               formula: '',
  //               headType: 'EARNING',
  //             },
  //           ]);
  //         }
  //       }
  //     });
  //   } else {
  //     setTemplateName('');
  //     setDescription('');
  //     setTotalEarnings(0);
  //     setTotalDeductions(0);
  //     setNetSalary(0);
  //     setSalaryRows([
  //       {
  //         salaryHead: '',
  //         method: 'Percentage of',
  //         value: '',
  //         formula: '',
  //       },
  //     ]);
  //   }
  // };
  const handleTemplateSelection = (selectedTemplate) => {
    setTemplateName(selectedTemplate.salaryTemplateName);
    setDescription(selectedTemplate.description);
    setTotalEarnings(selectedTemplate.totalEarnings || 0);
    setTotalDeductions(selectedTemplate.totalDeductions || 0);
    setNetSalary(selectedTemplate.netSalary || 0);

    if (
      selectedTemplate.salaryTemplateDetails &&
      Array.isArray(selectedTemplate.salaryTemplateDetails)
    ) {
      // Map salaryTemplateDetails to salaryRows
      const mappedRows = selectedTemplate.salaryTemplateDetails.map(
        (detail) => ({
          salaryHead: detail.idSalaryHead.toString(),
          method: getMethodFromCalculationMethod(detail.calculationMethod),
          value:
            detail.calculationMethod === 'FIXEDAMOUNT'
              ? detail.fixedAmount
              : detail.calculationMethod === 'PERCENTAGE'
              ? detail.percentageValue
              : '',
          formula: detail.customFormula || '',
          type: detail.headType || 'EARNING', // Default to "EARNING" if not defined
          percentageOf: detail.percentageOf || '', // For "Percentage of" method
        })
      );

      setSalaryRows(mappedRows);
    } else {
      setSalaryRows([
        {
          salaryHead: '',
          method: 'Percentage of',
          value: '',
          formula: '',
          headType: 'EARNING',
        },
      ]);
    }
  };



  // const handleInputChange = (updatedRows, rowIndex, field) => {
  //   if (field === "salaryHead") {
  //     const selectedSalaryHeadId = updatedRows[rowIndex].salaryHead;
  //     dispatch(getSalaryHeadById(selectedSalaryHeadId))
  //       .then((action) => {
  //         if (action.payload && action.payload.success) {
  //           const salaryHeadData = action.payload.data;
  //           let updatedRow = { ...updatedRows[rowIndex] };

  //           // Update calculation method
  //           switch (salaryHeadData.calculationMethod) {
  //             case "FIXEDAMOUNT":
  //               updatedRow.method = "Fixed Amount";
  //               updatedRow.value = salaryHeadData.fixedValue || "";
  //               break;
  //             case "PERCENTAGE":
  //               updatedRow.method = "Percentage of";
  //               updatedRow.value = salaryHeadData.percentageValue || "";
  //               if (salaryHeadData.idPercentageSalaryHead) {
  //                 dispatch(
  //                   getSalaryHeadById(salaryHeadData.idPercentageSalaryHead)
  //                 )
  //                   .then((percentageAction) => {
  //                     if (
  //                       percentageAction.payload &&
  //                       percentageAction.payload.success
  //                     ) {
  //                       const percentageSalaryHeadData =
  //                         percentageAction.payload.data;
  //                       updatedRow.percentageOf =
  //                         percentageSalaryHeadData.idSalaryHead.toString();
  //                       const newRows = [...updatedRows];
  //                       newRows[rowIndex] = updatedRow;
  //                       setSalaryRows(newRows);
  //                       calculateTotals(newRows); // Recalculate totals
  //                     }
  //                   })
  //                   .catch((error) => {
  //                     console.error(
  //                       "Error fetching percentage salary head details:",
  //                       error
  //                     );
  //                   });
  //               }
  //               break;
  //             case "FORMULA":
  //               updatedRow.method = "Custom Formula";
  //               updatedRow.formula = salaryHeadData.customFormula || "";
  //               break;
  //             default:
  //               updatedRow.method = "Percentage of";
  //           }

  //           if (updatedRow.method !== "Custom Formula") {
  //             updatedRow.formula = "";
  //           }
  //           if (updatedRow.method !== "Percentage of") {
  //             updatedRow.percentageOf = "";
  //           }

  //           console.log(salaryHeadData, "updatedRow");
  //           // Add type (EARNING or DEDUCTION) to the row
  //           updatedRow.type = salaryHeadData.headType || "EARNING"; // Default to EARNING if type is not defined

  //           const newRows = [...updatedRows];
  //           newRows[rowIndex] = updatedRow;
  //           setSalaryRows(newRows);

  //           // Calculate totals after updating the row
  //           calculateTotals(newRows);
  //         }
  //       })
  //       .catch((error) => {
  //         console.error("Error fetching salary head details:", error);
  //       });
  //   } else {
  //     setSalaryRows(updatedRows);
  //     calculateTotals(updatedRows);
  //   }
  // };

  const handleInputChange = (updatedRows, rowIndex, field) => {
    if (field === "salaryHead") {
      const selectedSalaryHeadId = updatedRows[rowIndex].salaryHead;
      dispatch(getSalaryHeadById(selectedSalaryHeadId))
        .then((action) => {
          if (action.payload && action.payload.success) {
            const salaryHeadData = action.payload.data;
            let updatedRow = { ...updatedRows[rowIndex] };
  
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
                  dispatch(
                    getSalaryHeadById(salaryHeadData.idPercentageSalaryHead)
                  )
                    .then((percentageAction) => {
                      if (
                        percentageAction.payload &&
                        percentageAction.payload.success
                      ) {
                        const percentageSalaryHeadData =
                          percentageAction.payload.data;
                        updatedRow.percentageOf =
                          percentageSalaryHeadData.idSalaryHead.toString();
  
                        // Calculate the percentage value
                        const referencedRow = updatedRows.find(
                          (row) => row.salaryHead === updatedRow.percentageOf
                        );
                        console.log(referencedRow, "referencedRow875885");
                        if (referencedRow) {
                          const referencedValue = parseFloat(referencedRow.value) || 0;
                          // updatedRow.value = (
                          //   (referencedValue * parseFloat(updatedRow.value || 0)) /
                          //   100
                          // ).toFixed(2);
                        }
                        
                        const newRows = [...updatedRows];
                        newRows[rowIndex] = updatedRow;
                        setSalaryRows(newRows);
                        calculateTotals(newRows);
                      }
                    })
                    .catch((error) => {
                      console.error(
                        "Error fetching percentage salary head details:",
                        error
                      );
                    });
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
  
            updatedRow.type = salaryHeadData.headType || "EARNING";
  
            const newRows = [...updatedRows];
            newRows[rowIndex] = updatedRow;
            setSalaryRows(newRows);
  
            calculateTotals(newRows);
          }
        })
        .catch((error) => {
          console.error("Error fetching salary head details:", error);
        });
    } else {
      setSalaryRows(updatedRows);
      calculateTotals(updatedRows);
    }
  };

  // const calculateTotals = (rows) => {
  //   let totalEarnings = 0;
  //   let totalDeductions = 0;

  //   console.log(rows, "rows");  
  //   rows.forEach((row) => {
  //     const value = parseFloat(row.value) || 0; // Ensure the value is a number
  //     if (row.type === "EARNING" || row.type === "Earning") {
  //       totalEarnings += value;
  //     } else if (row.type === "DEDUCTION" || row.type === "Deduction") {
  //       totalDeductions += value;
  //     }
  //   });

  //   const netSalary = totalEarnings - totalDeductions;

  //   setTotalEarnings(totalEarnings);
  //   setTotalDeductions(totalDeductions);
  //   setNetSalary(netSalary);
  // };
  // const calculateTotals = (rows) => {
  //   let earnings = 0;
  //   let deductions = 0;
  
  //   rows.forEach((row) => {
  //     let value = parseFloat(row.value) || 0;
  
  //     if (row.method === "Percentage of" && row.percentageOf) {
  //       // Find the referenced salary head row
  //       const referencedRow = rows.find(r => r.salaryHead === row.percentageOf);
  //       if (referencedRow) {
  //         const referencedValue = parseFloat(referencedRow.value) || 0;
  //         value = (referencedValue * value) / 100;
  //       }
  //     }
  
  //     if (row.type === "EARNING" || row.type === "Earning") {
  //       earnings += value;
  //     } else if (row.type === "DEDUCTION" || row.type === "Deduction") {
  //       deductions += value;
  //     }
  //   });
  
  //   const net = earnings - deductions;
  
  //   setTotalEarnings(Number(earnings.toFixed(2)));
  //   setTotalDeductions(Number(deductions.toFixed(2)));
  //   setNetSalary(Number(net.toFixed(2)));
  // };
  const calculateTotals = (rows) => {
    let earnings = 0;
    let deductions = 0;
  
    rows.forEach((row) => {
      let value = parseFloat(row.value) || 0;
  
      if (row.method === "Percentage of" && row.percentageOf) {
        // Find the referenced salary head row
        const referencedRow = rows.find(
          (r) => r.salaryHead === row.percentageOf
        );
        if (referencedRow) {
          const referencedValue = parseFloat(referencedRow.value) || 0;
          console.log(value, "referencedValue");
          value = ((referencedValue * value) / 100).toFixed(2);
          console.log(value, "value");
        }
      }
  
      if (row.type === "EARNING" || row.type === "Earning") {
        earnings += parseFloat(value);
      } else if (row.type === "DEDUCTION" || row.type === "Deduction") {
        deductions += parseFloat(value);
      }
    });
  
    const net = earnings - deductions;
  
    setTotalEarnings(Number(earnings.toFixed(2)));
    setTotalDeductions(Number(deductions.toFixed(2)));
    setNetSalary(Number(net.toFixed(2)));
  };

  function openModal() {
  const modalElement = document.getElementById("modalCenter");
  if (modalElement) {
    const modalInstance = new bootstrap.Modal(modalElement, {
      backdrop: "static", // Prevent closing on outside click
      keyboard: false, // Prevent closing on Escape key
    });
    modalInstance.show();
  }
}

const handleSubmitForApproval = () => {

    // Reset errors
    setTemplateNameError("");
    setTableError("");
  
    // Validate template name
    if (!templateName.trim()) {
      setTemplateNameError("Template Name is required.");
      return; // Stop submission if validation fails
    }
  
    // Validate small table
    if (salaryRows.length === 0 || salaryRows.some((row) => !row.salaryHead || !row.method)) {
      setTableError("At least one valid row is required in the table.");
      return; // Stop submission if validation fails
    }

    
    const data = {
      salaryTemplateName: templateName,
      description: description,
      activeStatus: true,
      salaryTemplateDetails: salaryRows.map((row) => ({
        idSalaryHead: row.salaryHead,
        calculationMethod:
          row.method === "Fixed Amount"
            ? "FIXEDAMOUNT"
            : row.method === "Percentage of"
            ? "PERCENTAGE"
            : row.method === "Custom Formula"
            ? "FORMULA"
            : row.method,
        fixedAmount: row.method === "Fixed Amount" ? row.value : null,
        percentageValue: row.method === "Percentage of" ? row.value : null,
        customFormula: row.method === "Custom Formula" ? row.formula : null,
        percentageOf: row.percentageOf || null, // For "Percentage of" method
        type: row.type, // Add the type (EARNING or DEDUCTION)
      })),
      totalEarnings,
      totalDeductions,
      netSalary,
    };

    if (isEditing) {
      // Include the idSalaryTemplate in the update data
      data.idSalaryTemplate = editingTemplateId;  // Add the ID to the data

      // Call the updateSalaryTemplate API if editing
      dispatch(updateSalaryTemplate(data))
        .then((response) => {
          if (response.payload.success) {
            console.log("Template updated successfully.");

            // Close the modal
            const modal = document.getElementById("modalCenter");
            if (modal) {
              const bsModal = bootstrap.Modal.getInstance(modal);
              bsModal.hide(); // Close the modal
            }

            // Refresh the salary templates list
            dispatch(getAllSalaryTemplates());
          } else {
            console.error("Failed to update template.");
          }
        })
        .catch((error) => {
          console.error("Error updating template:", error);
        });
    } else {
      // Call the addSalaryTemplate API if not editing (new template)
      dispatch(addSalaryTemplate(data))
        .then((response) => {
          if (response.payload.success) {
            console.log("Template submitted for approval successfully.");

            // Close the modal
            const modal = document.getElementById("modalCenter");
            if (modal) {
              const bsModal = bootstrap.Modal.getInstance(modal);
              bsModal.hide(); // Close the modal
            }

            // Refresh the salary templates list
            dispatch(getAllSalaryTemplates());
          } else {
            console.error("Failed to submit template for approval.");
          }
        })
        .catch((error) => {
          console.error("Error submitting template for approval:", error);
        });
    }
};
  const salaryColumns = [
    {
      header: "Salary Head Name",
      field: "salaryHead",
      type: "select",
      options: [
        { value: "", label: "Select Salary Head" },  // Add this default option
        ...salaryHeads.map((head) => ({
          value: head.value.toString(),
          label: head.displayName,
        })),
      ],
    },
    {
      header: "Calculation Method",
      field: "method",
      type: "select",
      options: [
        { value: "Percentage of", label: "Percentage of" },
        { value: "Fixed Amount", label: "Fixed Amount" },
        { value: "Custom Formula", label: "Custom Formula" },
      ],
    },
    { header: "Value/Formula", field: "dynamic", type: "dynamic" },
  ];

  const handleAddRow = (newRow) => setSalaryRows([...salaryRows, newRow]);
  // useEffect(() => {
  //   if (selectedTemplate && copyFromTemplate) {
  //     handleTemplateSelection(selectedTemplate.idSalaryTemplate);
  //   }
  // }, [selectedTemplate, copyFromTemplate]);
  useEffect(() => {
    if (selectedTemplateId && copyFromTemplate) {
      dispatch(getSalaryTemplateById(selectedTemplateId)).then((response) => {
        const selectedTemplate = response.payload.data;
        if (selectedTemplate) {
          handleTemplateSelection(selectedTemplate);
        }
      });
    }
  }, [selectedTemplateId, copyFromTemplate, dispatch]);

  const handleDeleteRow = (index) =>
    setSalaryRows(salaryRows.filter((_, i) => i !== index));

  const handleAddClick = () => {
    setIsEditing(false);
    setEditingTemplateId(null);
    setSelectedTemplateId("");
    setTemplateName("");
    setDescription("");
    setTemplateNameError("");
    setTableError("");
    setSalaryRows([
      {
        salaryHead: "",
        method: "Percentage of",
        value: "",
        formula: "",
      },
    ]);
    setTotalEarnings(0);
    setTotalDeductions(0);
    setNetSalary(0);
    setCopyFromTemplate(false);
  };

  const handleEditClick = (id) => {
    console.log("data")
    if (id) {
      dispatch(getSalaryTemplateById(id));
      setEditingTemplateId(id);
      setIsEditing(true);
      setCopyFromTemplate(false); // Reset the checkbox state
    } else {
      setIsEditing(false);
      setTemplateName("");
      setDescription("");
      setSalaryRows([
        {
          salaryHead: "",
          method: "Percentage of",
          value: "",
          formula: "",
        },
      ]);
      setTotalEarnings(0);
      setTotalDeductions(0);
      setNetSalary(0);
      setCopyFromTemplate(false); // Reset the checkbox state
    }
  };
  const handleReset = () => {
    setTemplateName("");
    setDescription("");
    setSalaryRows([
      {
        salaryHead: "",
        method: "Percentage of",
        value: "",
        formula: "",
      },
    ]);
    setTotalEarnings(0);
    setTotalDeductions(0);
    setNetSalary(0);
    setTemplateNameError("");
    setTableError("");
    setSelectedTemplateId("");
    setCopyFromTemplate(false);
    setIsEditing(false);
    setEditingTemplateId(null);
  };

  const filteredTemplates = salaryTemplates?.data?.filter((template) =>
    template.salaryTemplateName
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">List of Salary Templates</h5>
              <div className="list_menu">
                <div className="list_searchbox">
                  <input
                    type="search"
                    className="form-control"
                    placeholder="Search by Template Name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <i className="bx bx-search"></i>
                </div>
                <button
                  className="btn btn-primary btn-sm px-4"
                  type="button"
                  data-bs-toggle="modal"
                  data-bs-target="#modalCenter"
                  onClick={handleAddClick}
                >
                  Add
                </button>
              </div>
            </div>
            <div className="card-body">
              <Grid
                columns={columns}
                data={filteredTemplates} // Bind the API data to the Grid component
                onEditClick={handleEditClick}
                idKey="idSalaryTemplate" // This matches the field in the API response
                modalId="modalCenter"
              />
            </div>
          </div>

          <div
            className="modal fade"
            id="modalCenter"
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
                    {isEditing ? "Update" : "Add"} Salary Template
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
                    <div className="col-md-6 p-2">
                      <div className="form-check mb-1">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="flexCheckDefault"
                          checked={copyFromTemplate}
                          onChange={(e) => {
                            setCopyFromTemplate(e.target.checked);
                            if (!e.target.checked) {
                              handleAddClick();
                            }
                          }}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="flexCheckDefault"
                        >
                          Copy From Templates
                        </label>
                      </div>
                      <div className="mb-2">
                        <select
                          className="form-select form-select-sm"
                          value={selectedTemplateId}
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            setSelectedTemplateId(selectedId);
                            if (copyFromTemplate && selectedId) {
                              handleTemplateSelection(selectedId);
                            }
                          }}
                          disabled={!copyFromTemplate}
                        >
                          <option value="">Select Templates</option>
                          {Array.isArray(salaryTemplates.data) &&
                          salaryTemplates.data.length > 0 ? (
                            salaryTemplates.data.map((template) => (
                              <option
                                key={template.idSalaryTemplate}
                                value={template.idSalaryTemplate}
                              >
                                {template.salaryTemplateName}
                              </option>
                            ))
                          ) : (
                            <option disabled>No templates available</option>
                          )}
                        </select>
                      </div>
                      <Input
                        label="Template Name"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        maxLength="50"
                      />
                      {templateNameError && (
                        <div className="text-danger small">
                          {templateNameError}
                        </div>
                      )}
                    </div>
                    <div className="col-md-6 p-2">
                      <Label text="Description" />
                      <textarea
                        className="form-control form-control-sm"
                        rows="5"
                        maxLength="500"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        style={{ marginTop: "-9px" }}
                      ></textarea>
                    </div>
                  </div>
                  <div className="px-2">
                    <SmallTable
                      initialRows={salaryRows}
                      columns={salaryColumns}
                      onAddRow={handleAddRow}
                      onDeleteRow={handleDeleteRow}
                      onInputChange={(updatedRows, rowIndex, field) =>
                        handleInputChange(updatedRows, rowIndex, field)
                      }
                    />
                    {tableError && (
                      <div className="text-danger small">{tableError}</div>
                    )}
                    {/* <div className="total_salarycard">
                      <ul>
                        <li>
                          <b>Total Earnings:</b> {totalEarnings.toFixed(2)}
                        </li>
                        <li>
                          <b>Total Deductions:</b> {totalDeductions.toFixed(2)}
                        </li>
                        <li>
                          <b>Net Salary:</b> {netSalary.toFixed(2)}
                        </li>
                      </ul>
                    </div> */}
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
                        </li>
                        <li style={{ margin: "0" }}>
                          <b>Total Deductions:</b> {totalDeductions.toFixed(2)}
                        </li>
                        <li style={{ margin: "0" }}>
                          <b>Net Salary:</b> {netSalary.toFixed(2)}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <Button
                    className="btn btn-primary btn-sm py-2 px-4 me-2"
                    onClick={handleSubmitForApproval}
                  >
                    Save Template
                  </Button>
                  <Button
                    className="btn btn-primary btn-sm py-2 px-4 me-2"
                    onClick={handleSubmitForApproval}
                  >
                    Submit for Approval
                  </Button>
                  <Button
                    className="btn btn-outline-secondary btn-sm py-2 px-4"
                    data-bs-dismiss="modal"
                    onClick={handleReset}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryTemplate;
