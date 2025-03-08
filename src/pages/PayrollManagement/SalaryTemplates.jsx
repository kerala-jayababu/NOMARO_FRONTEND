import React, { useState, useEffect, useMemo } from "react";
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
  updateSalaryTemplate,
} from "../../redux/reducers/salaryTemplate"; // Import the action to get salary templates
import { getAllOptions } from "../../redux/reducers/getAllOptions";
import {
  getSalaryHeadById,
  fetchSalaryHead,
} from "../../redux/reducers/salaryHead"; // Adjust the path as needed
import Pagination from "../../components/pagination";

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
  const [salaryHeadsMeta, setSalaryHeadsMeta] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
const [rowsPerPage, setRowsPerPage] = useState(10); // Number of rows per page

  const dispatch = useDispatch();

  const { salaryTemplates, salaryTemplateDetails, selectedTemplate } =
    useSelector((state) => state.salaryTemplate);
  const { salaryHeads } = useSelector((state) => state.getAllOptions);
  const { salaryHeadList, status, error } = useSelector(
    (state) => state.salaryHead
  );
  // Adjust the selector as needed

  useEffect(() => {
    dispatch(getAllSalaryTemplates());
    dispatch(getAllOptions());
    dispatch(fetchSalaryHead());

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
    if (status === "succeeded" && salaryHeadList) {
      setSalaryHeadsMeta(salaryHeadList);
    }
  }, [status, salaryHeadList]);

  useEffect(() => {
    if (editingTemplateId) {
      dispatch(getSalaryTemplateById(editingTemplateId));
    }
  }, [editingTemplateId, dispatch]);

  useEffect(() => {
    if (selectedTemplate) {
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
            percentageOfIdSalaryHead: detail.percentageOf || "", // For "Percentage of" method
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
        percentageOfIdSalaryHead: detail.percentageOf || "", // For "Percentage of" method
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


  const filteredTemplates = useMemo(() => {
    if (!searchQuery) return salaryTemplates?.data || [];
  
    return salaryTemplates?.data.filter((template) =>
      template.salaryTemplateName
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [salaryTemplates, searchQuery]);

  const paginatedTemplates = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredTemplates.slice(startIndex, endIndex);
  }, [filteredTemplates, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredTemplates.length / rowsPerPage);

  const handlePageChange = (page) => setCurrentPage(page);


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
            detail.calculationMethod === "FIXEDAMOUNT"
              ? detail.fixedAmount
              : detail.calculationMethod === "PERCENTAGE"
              ? detail.percentageValue
              : "",
          formula: detail.customFormula || "",
          type: detail.headType || "EARNING", // Default to "EARNING" if not defined
          percentageOf: detail.percentageOf || "", // For "Percentage of" method
          percentageOfIdSalaryHead: detail.percentageOf || "", // For "Percentage of" method
        })
      );

      setSalaryRows(mappedRows);
    } else {
      setSalaryRows([
        {
          salaryHead: "",
          method: "Percentage of",
          value: "",
          formula: "",
          headType: "EARNING",
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
  //               console.log(salaryHeadData, "salaryHeadData");
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

  //                       // Calculate the percentage value
  //                       const referencedRow = updatedRows.find(
  //                         (row) => row.salaryHead === updatedRow.percentageOf
  //                       );
  //                       console.log(referencedRow, "referencedRow875885");
  //                       if (referencedRow) {
  //                         const referencedValue = parseFloat(referencedRow.value) || 0;
  //                         // updatedRow.value = (
  //                         //   (referencedValue * parseFloat(updatedRow.value || 0)) /
  //                         //   100
  //                         // ).toFixed(2);
  //                       }

  //                       const newRows = [...updatedRows];
  //                       newRows[rowIndex] = updatedRow;
  //                       setSalaryRows(newRows);
  //                       calculateTotals(newRows);
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
  //             updatedRow.percentageOfIdSalaryHead = "";
  //           }

  //           updatedRow.type = salaryHeadData.headType || "EARNING";

  //           const newRows = [...updatedRows];
  //           newRows[rowIndex] = updatedRow;
  //           setSalaryRows(newRows);

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
                updatedRow.percentageOfIdSalaryHead = "";
                updatedRow.percentageOf = "";
                break;
              case "PERCENTAGE":
                updatedRow.method = "Percentage of";
                updatedRow.value = salaryHeadData.percentageValue || "";
                console.log(salaryHeadData, "salaryHeadData");
                if (salaryHeadData.idPercentageSalaryHead) {
                  updatedRow.percentageOfIdSalaryHead =
                    salaryHeadData.idPercentageSalaryHead.toString();
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
                          percentageSalaryHeadData.salaryHeadName;

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
                } else {
                  updatedRow.percentageOfIdSalaryHead = "";
                  updatedRow.percentageOf = "";
                }
                break;
              case "FORMULA":
                updatedRow.method = "Custom Formula";
                updatedRow.formula = salaryHeadData.customFormula || "";
                updatedRow.percentageOfIdSalaryHead = "";
                updatedRow.percentageOf = "";
                break;
              default:
                updatedRow.method = "Percentage of";
                updatedRow.percentageOfIdSalaryHead = "";
                updatedRow.percentageOf = "";
            }

            if (updatedRow.method !== "Custom Formula") {
              updatedRow.formula = "";
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
    } else if (field === "percentageOfIdSalaryHead") {
      const updatedRow = { ...updatedRows[rowIndex] };
      updatedRow.percentageOfIdSalaryHead = updatedRow[field];

      if (updatedRow.percentageOfIdSalaryHead) {
        dispatch(getSalaryHeadById(updatedRow.percentageOfIdSalaryHead))
          .then((action) => {
            if (action.payload && action.payload.success) {
              const percentageSalaryHeadData = action.payload.data;
              updatedRow.percentageOf = percentageSalaryHeadData.salaryHeadName;

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
      } else {
        updatedRow.percentageOf = "";
        const newRows = [...updatedRows];
        newRows[rowIndex] = updatedRow;
        setSalaryRows(newRows);
        calculateTotals(newRows);
      }
    } else {
      setSalaryRows(updatedRows);
      calculateTotals(updatedRows);
    }
  };

  //  const calculateTotals = (rows) => {
  //   let earnings = 0;
  //   let deductions = 0;

  //   rows.forEach((row) => {
  //     let value = parseFloat(row.value) || 0;
  //     console.log(value, "value");
  //     console.log(row, "row.method");

  //     if (row.method === "Percentage of" && row.percentageOf) {
  //       // Find the referenced salary head row
  //       const referencedRow = rows.find(
  //         (r) => r.salaryHead === row.percentageOfIdSalaryHead
  //       );
  //       console.log(referencedRow, "referencedRow");
  //       if (referencedRow) {
  //         const referencedValue = parseFloat(referencedRow.value) || 0;
  //         console.log(value, "referencedValue");
  //         value = ((referencedValue * value) / 100).toFixed(2);
  //         console.log(value, "value");
  //       }
  //     }

  //     if (row.type === "EARNING" || row.type === "Earning") {
  //       earnings += parseFloat(value);
  //     } else if (row.type === "DEDUCTION" || row.type === "Deduction") {
  //       deductions += parseFloat(value);
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

    // Helper function to calculate the final salary amount for a row
    const getFinalSalaryAmount = (row) => {
      console.log(row, "row");
      if (
        row.method === "Fixed Amount" ||
        row.calculationMethod === "FIXEDAMOUNT"
      ) {
        // For fixed amount, return the value directly
        return parseFloat(row.value) || parseFloat(row.fixedValue) || 0;
      } else if (
        row.method === "Percentage of" &&
        row.percentageOfIdSalaryHead
      ) {
        // For percentage-based calculations, find the referenced salary head
        const referencedRow = salaryHeadsMeta.find(
          (head) =>
            head.idSalaryHead.toString() === row.percentageOfIdSalaryHead
        );

        if (referencedRow) {
          // Calculate the percentage value based on the referenced row's value
          const referencedValue = getFinalSalaryAmount(referencedRow);
          console.log(referencedValue, "referencedValue");
          return (referencedValue * (parseFloat(row.value) || 0)) / 100;
        }
      } else if (row.method === "Custom Formula" && row.formula) {
        // For custom formulas, evaluate the formula dynamically
        let formula = row.formula;

        // Extract all salary head codes from the formula
        const salaryCodes = formula.match(/[A-Za-z]+/g) || [];

        // Replace each code with its corresponding value from salaryHeadsMeta
        salaryCodes.forEach((code) => {
          const salaryHead = salaryHeadsMeta.find(
            (head) => head.salaryHeadCode === code
          );
          if (salaryHead) {
            const salaryHeadValue = getFinalSalaryAmount(salaryHead);
            formula = formula.replace(code, salaryHeadValue);
          }
        });

        try {
          // Evaluate the formula and return the result
          return eval(formula).toFixed(2);
        } catch (error) {
          console.error("Error evaluating formula:", formula, error);
          return 0;
        }
      }

      // Default to 0 if no valid calculation method is found
      return 0;
    };

    // Iterate through each row and calculate totals
    rows.forEach((row) => {
      // Calculate the final salary amount for the row
      row.finalSalaryAmount = parseFloat(getFinalSalaryAmount(row));

      console.log(row.finalSalaryAmount, "row.finalSalaryAmount");

      // Add to earnings or deductions based on the row type
      if (row.type.toUpperCase() === "EARNING") {
        earnings += row.finalSalaryAmount;
      } else if (row.type.toUpperCase() === "DEDUCTION") {
        deductions += row.finalSalaryAmount;
      }
    });

    // Calculate net salary
    const net = earnings - deductions;

    // Update state with the calculated totals
    setTotalEarnings(Number(earnings.toFixed(2)));
    setTotalDeductions(Number(deductions.toFixed(2)));
    setNetSalary(Number(net.toFixed(2)));
  };

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
    if (
      salaryRows.length === 0 ||
      salaryRows.some((row) => !row.salaryHead || !row.method)
    ) {
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
        finalSalaryAmount: row.finalSalaryAmount || 0, // Add the final salary amount
        type: row.type, // Add the type (EARNING or DEDUCTION)
        percentageOfIdSalaryHead:
          row.method === "Percentage of" && row.percentageOfIdSalaryHead
            ? parseInt(row.percentageOfIdSalaryHead, 10)
            : null,
      })),
      totalEarnings,
      totalDeductions,
      netSalary,
    };

    if (isEditing) {
      // Include the idSalaryTemplate in the update data
      data.idSalaryTemplate = editingTemplateId; // Add the ID to the data

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
        { value: "", label: "Select Salary Head" }, // Add this default option
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
    {
      header: "Value/Formula",
      field: "dynamic",
      type: "dynamic",
      percentageOfOptions: salaryHeads.map((head) => ({
        value: head.value.toString(),
        label: head.displayName,
      })),
    },
  ];

  const handleAddRow = (newRow) => setSalaryRows([...salaryRows, newRow]);

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
        percentageOfIdSalaryHead: "",
        percentageOf: "",
        type: "EARNING",
      },
    ]);
    setTotalEarnings(0);
    setTotalDeductions(0);
    setNetSalary(0);
    setCopyFromTemplate(false);
  };

  const handleEditClick = async (id) => {
    if (id) {
      try {
        const response = await dispatch(getSalaryTemplateById(id));
        if (response.payload && response.payload.success) {
          const templateData = response.payload.data;
          setEditingTemplateId(id);
          setIsEditing(true);
          setTemplateName(templateData.salaryTemplateName);
          setDescription(templateData.description);
          setTotalEarnings(templateData.totalEarnings);
          setTotalDeductions(templateData.totalDeductions);
          setNetSalary(templateData.netSalary);

          // // Process salary template details
          // const processedDetails = await Promise.all(
          //   templateData.salaryTemplateDetails.map(async (detail) => {
          //     let processedDetail = {
          //       salaryHead: detail.idSalaryHead.toString(),
          //       method: getMethodFromCalculationMethod(detail.calculationMethod),
          //       value: detail.fixedAmount || detail.percentageValue || "",
          //       formula: detail.customFormula || "",
          //       type: detail.headType,
          //       percentageOfIdSalaryHead: detail.percentageOfIdSalaryHead?.toString() || "",
          //       percentageOf: "",
          //     };

          //     if (detail.calculationMethod === "PERCENTAGE" && detail.percentageOfIdSalaryHead) {
          //       const percentageOfSalaryHead = salaryHeadsMeta.find(
          //         (head) => head.idSalaryHead.toString() === detail.percentageOfIdSalaryHead.toString()
          //       );

          //       if (percentageOfSalaryHead) {
          //         processedDetail.percentageOf = percentageOfSalaryHead.salaryHeadName;
          //       }
          //     }

          //     return processedDetail;
          //   })
          // );
          // Process salary template details
          const processedDetails = templateData.salaryTemplateDetails.map(
            (detail) => {
              let processedDetail = {
                salaryHead: detail.idSalaryHead.toString(),
                method: getMethodFromCalculationMethod(
                  detail.calculationMethod
                ),
                value: detail.fixedAmount || detail.percentageValue || "",
                formula: detail.customFormula || "",
                type: detail.headType,
                percentageOfIdSalaryHead:
                  detail.percentageOfIdSalaryHead?.toString() || "",
                percentageOf: "",
              };

              if (
                detail.calculationMethod === "PERCENTAGE" &&
                detail.percentageOfIdSalaryHead
              ) {
                const percentageOfSalaryHead = salaryHeadsMeta.find(
                  (head) =>
                    head.idSalaryHead.toString() ===
                    detail.percentageOfIdSalaryHead.toString()
                );

                if (percentageOfSalaryHead) {
                  processedDetail.percentageOf =
                    percentageOfSalaryHead.salaryHeadName;
                }
              }

              return processedDetail;
            }
          );
          console.log(processedDetails, "processedDetails");
          setSalaryRows(processedDetails);
        }
      } catch (error) {
        console.error("Error fetching salary template details:", error);
      }
    } else {
      // Reset form for new template
      handleReset();
    }
  };

  const processTemplateDetail = async (detail) => {
    let processedDetail = {
      salaryHead: detail.idSalaryHead.toString(),
      method: getMethodFromCalculationMethod(detail.calculationMethod),
      value: detail.fixedAmount || detail.percentageValue || "",
      formula: detail.customFormula || "",
      type: detail.headType,
      percentageOfIdSalaryHead:
        detail.percentageOfIdSalaryHead?.toString() || "",
      percentageOf: "",
    };

    if (
      detail.calculationMethod === "PERCENTAGE" &&
      detail.percentageOfIdSalaryHead
    ) {
      try {
        const response = await dispatch(
          getSalaryHeadById(detail.percentageOfIdSalaryHead)
        );
        if (response.payload && response.payload.success) {
          const percentageOfSalaryHead = response.payload.data;
          processedDetail.percentageOf = percentageOfSalaryHead.salaryHeadName;
          // processedDetail.percentageOfIdSalaryHead = detail.percentageOfIdSalaryHead.toString();
        }
      } catch (error) {
        console.error("Error fetching percentage of salary head:", error);
      }
    }

    return processedDetail;
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
                data={paginatedTemplates} // Pass paginated data
                onEditClick={handleEditClick}
                idKey="idSalaryTemplate" // This matches the field in the API response
                modalId="modalCenter"
              />
              <div className="text-end pt-2">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>
          </div>

          <div
            className="modal fade"
            id="modalCenter"
            tabIndex="-1"
            aria-hidden="true"
            data-bs-backdrop="static" // Prevents closing on outside click
            data-bs-keyboard="false" // Prevents closing on Esc key press
          >
            <div
              className="modal-dialog modal-xl modal-dialog-centered"
              role="document"
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="modalCenterTitle">
                    Add / Update Salary Template
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
                      isEditing={isEditing}
                      onInputChange={(updatedRows, rowIndex, field) =>
                        handleInputChange(updatedRows, rowIndex, field)
                      }
                      calculateTotal={calculateTotals} // Pass calculateTotals as a prop
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
                  {/* <Button
                  className="btn btn-primary btn-sm py-2 px-4 me-2"
                  onClick={handleSubmitForApproval}
                >
                  Save Template
                </Button> */}
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
