import React, { useState, useEffect, useMemo, useRef } from "react";
import { Form, Modal } from "react-bootstrap";
import CommonService from "../../core/services/CommonService";
import { evaluate } from 'mathjs';
import Utils from "../../utils/Utils";
import Pagination from "../../components/pagination";
import ConfirmationModal from "../../components/ConfirmationModal";
import EmployeeSalaryConfigService from "../../core/services/EmployeeSalaryConfigService";
import moment from "moment";
import Select from 'react-select';
import { NumericFormat } from "react-number-format";
import { useLoader } from "../../components/LoaderContext";

const EmployeeSalaryConfig = () => {
  const [designation, setDesignation] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [employeeSalaryConfigList, setEmployeeSalaryConfigList] = useState([]);
  const [employeeSalaryDetails, setEmployeeSalaryDetails] = useState([]);
  const [netSalary, setNetSalary] = useState(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [copyFromData, setCopyFromData] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [salaryHeadList, setSalaryHeadList] = useState([]);
  const [rows, setRows] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalDeductions, setTotalDeductions] = useState(0);
  const [errors, setErrors] = useState({});
  const totalPages = Math.ceil(employeeSalaryConfigList.length / rowsPerPage);
  const [dataToEdit, setDataToEdit] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [templatesList, setTemplatesList] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [employeesListOption, setEmployeesListOption] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [empDescDept, setEmpDescDept] = useState('');
  const [validated, setValidated] = useState(false);
  const [showCopyConfirmation, setShowCopyConfirmation] = useState(false);
  const [selectedEmpConfigId, setSelectedEmpConfigId] = useState('');
  const { showLoader, hideLoader } = useLoader();

  useEffect(() => {
    getSalaryHeadData();
    getEmployeeSalaryConfigs();
    getEmployeesData();
    getSalaryTemplates();
    addRow();
  }, []);

  useEffect(() => {
    if (isInitialLoad && rows.length > 0 && salaryHeadList.length > 0) {
      calculateValues(rows); // Recalculate values and validate formulas
      setIsInitialLoad(false); // Mark initial load as complete
    }
  }, [rows, salaryHeadList, isInitialLoad]);

  useEffect(() => {
    if (selectedTemplateId != '') {
      setShowConfirmation(true);
    }
  }, [selectedTemplateId]);

  useEffect(() => {
    if (selectedEmployee == null) {
      setDesignation(null);
      setEmpDescDept(null);
      return;
    }
    const empDetails = employeesList.find(emp => emp.idEmployee == selectedEmployee.value);
    setDesignation(empDetails?.idDesignation);
    setEmpDescDept(empDetails?.designation);
    // const selected = employeesListOption.find(option => option.value === selectedEmployee);
    // setSelectedEmployee(selected);
  }, [selectedEmployee]);

  const getSalaryHeadData = () => {
    CommonService.getSalaryHeadList().then(res => {
      setSalaryHeadList(res.data.data);
    }).catch(err => {
      console.error("Failed to fetch salary heads:", err);
    });
  };

  const getEmployeesData = () => {
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
  }

  const getSalaryTemplates = () => {
    EmployeeSalaryConfigService.getAllSalaryTemplates().then(res => {
      const data = res.data.data.filter(x => x.approvalStatus == 'APPROVED');
      setTemplatesList(data);
    }).catch(err => {
      console.error("Failed to fetch salary templates:", err);
    });
  };

  const getSalaryTemplatesById = (id) => {
    Promise.all([
      CommonService.getSalaryHeadList(),
      EmployeeSalaryConfigService.getAllSalaryTemplatesById(id),
    ])
      .then(([salaryHeadsRes, templateRes]) => {
        setSalaryHeadList(salaryHeadsRes.data.data);
        setDataToEdit(templateRes.data.data);
        setupEditForCopy(templateRes.data.data);
        setIsInitialLoad(true);
      })
      .catch((err) => {
        console.error("Failed to fetch data:", err);
      });
  };

  const getEmployeeSalaryConfigs = () => {
    EmployeeSalaryConfigService.getAllEmployeeSalaryConfigs(searchText).then(res => {
      setEmployeeSalaryConfigList(res.data.data);
    }).catch(err => {
      console.error("Failed to fetch salary templates:", err);
    });
  };

  const getEmpSalDetails = (id) => {
    EmployeeSalaryConfigService.getEmployeeSalaryConfigById(id).then(res => {
      setEmployeeSalaryDetails(res.data.data);
      setShowDetailsModal(true);
    }).catch(err => {
      console.error("Failed to fetch salary templates:", err);
    });
  };

  const getEmpSalConfigById = (id) => {
    Promise.all([
      CommonService.getSalaryHeadList(),
      EmployeeSalaryConfigService.getEmployeeSalaryConfigById(id),
      // CommonService.getEmployeeList()
    ])
      .then(([salaryHeadsRes, templateRes]) => {
        setSalaryHeadList(salaryHeadsRes.data.data);
        setDataToEdit(templateRes.data.data);
        if (selectedEmpConfigId != '') {
          setupEditForFullCopy(templateRes.data.data);
        } else {
          setupEdit(templateRes.data.data);
        }
        setIsInitialLoad(true);
      })
      .catch((err) => {
        console.error("Failed to fetch data:", err);
      });
  };

  const handleChange = (selectedOption) => {
    // setNewData((prevData) => ({
    //   ...prevData,
    //   idEmployee: selectedOption.value
    // }));
    setSelectedEmployee(selectedOption);
  };

  const addRow = () => {
    const newRow = {
      idEmployeeSalaryConfigDetail: null,
      id: Date.now(),
      selectedSalaryHead: null,
      calculationMethod: "FIXEDAMOUNT",
      value: 0,
      customFormula: "",
      percentageOf: null,
      calculatedValue: 0
    };
    setRows([...rows, newRow]);
  };

  const removeRow = (index) => {
    const updatedRows = rows.filter((_, i) => i !== index);
    setRows(updatedRows);
    calculateValues(updatedRows);
  };

  const handleSalaryHeadChange = (id, selectedHeadId) => {
    const selectedHead = salaryHeadList.find(head => head.idSalaryHead === selectedHeadId);
    if (!selectedHead) return;

    // for NIS
    if (selectedHead.salaryHeadCode === "NIS") {
      const updatedRows = rows.map(row => {
        if (row.id === id) {

          const earningHeads = rows
            .filter(r =>
              r.selectedSalaryHead?.headType === "EARNING" &&
              r.selectedSalaryHead?.salaryHeadCode !== "NIS" &&
              r.id !== id
            )
            .map(r => r.selectedSalaryHead.salaryHeadCode);

          const dynamicFormula = `MIN((${earningHeads.join('+')})*0.056, 280000*0.056)`;

          return {
            ...row,
            selectedSalaryHead: selectedHead,
            calculationMethod: "FORMULA",
            customFormula: dynamicFormula,
            calculatedValue: 0
          };
        }
        return row;
      });

      setRows(updatedRows);
      calculateValues(updatedRows);
      return;
    }

    const updatedRows = rows.map(row => {
      if (row.id === id) {
        return {
          ...row,
          selectedSalaryHead: selectedHead,
          calculationMethod: selectedHead.calculationMethod,
          value: selectedHead.calculationMethod === "FIXEDAMOUNT" ? selectedHead.fixedValue : selectedHead.percentageValue,
          customFormula: selectedHead.customFormula,
          percentageOf: selectedHead.idPercentageSalaryHead,
          calculatedValue: 0
        };
      }
      return row;
    });
    setRows(updatedRows);
    calculateValues(updatedRows);
  };

  const handleCalculationMethodChange = (id, method) => {
    const updatedRows = rows.map(row => {
      if (row.id === id) {
        return {
          ...row,
          calculationMethod: method,
          value: method === "FIXEDAMOUNT" ? row.selectedSalaryHead?.fixedValue || 0 : row.selectedSalaryHead?.percentageValue || 0,
          customFormula: row.customFormula ?? '',
          percentageOf: method === "PERCENTAGE" ? null : row.percentageOf,
          calculatedValue: 0
        };
      }
      return row;
    });
    setRows(updatedRows);
    calculateValues(updatedRows);
  };

  const handleValueChange = (id, field, value) => {
    const updatedRows = rows.map(row => {
      if (row.id === id) {
        return { ...row, [field]: value };
      }
      return row;
    });

    const updatedRow = updatedRows.find(row => row.id === id);
    if (updatedRow?.selectedSalaryHead) {
      if (updatedRow.selectedSalaryHead.headType === "EARNING") {
        updatedRows.forEach(row => {
          if (row.selectedSalaryHead?.salaryHeadCode === "NIS") {
            const earningHeads = updatedRows
              .filter(r =>
                r.selectedSalaryHead?.headType === "EARNING" &&
                r.selectedSalaryHead?.salaryHeadCode !== "NIS" &&
                r.id !== row.id
              )
              .map(r => r.selectedSalaryHead.salaryHeadCode);

            row.customFormula = `MIN((${earningHeads.join('+')})*0.056, 280000*0.056)`;
          }
        });
      }

      const recalculatedRows = updatedRows.map(row => {
        if (row.selectedSalaryHead?.salaryHeadCode === "NIS") {
          return calculateRowValue(row, updatedRows);
        }

        if (row.id === id || getDependentRows(updatedRows, updatedRow.selectedSalaryHead.salaryHeadCode).some(r => r.id === row.id)) {
          return calculateRowValue(row, updatedRows);
        }
        return row;
      });

      setRows(recalculatedRows);
      calculateValues(recalculatedRows);
    } else {
      calculateValues(updatedRows);
    }
  };

  const handlePercentageOfChange = (id, selectedHeadId) => {
    const updatedRows = rows.map(row => {
      if (row.id === id) {
        return { ...row, percentageOf: selectedHeadId, calculatedValue: 0 };
      }
      return row;
    });
    setRows(updatedRows);
    calculateValues(updatedRows);
  };

  const validateFormula = (formula, rowId) => {
    const row = rows.find(r => r.id === rowId);

    if (row?.selectedSalaryHead?.salaryHeadCode === "NIS") {
      const hasEarningHeads = rows.some(r =>
        r.selectedSalaryHead?.headType === "EARNING" &&
        r.selectedSalaryHead?.salaryHeadCode !== "NIS" &&
        r.id !== rowId
      );

      if (!hasEarningHeads) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [rowId]: "At least one EARNING head required for NIS calculation"
        }));
        return false;
      }

      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[rowId];
        return newErrors;
      });
      return true;
    }

    const salaryHeadCodesInFormula = formula.match(/[A-Z]+/g) || [];
    const errors = [];

    salaryHeadCodesInFormula.forEach((code) => {
      const head = rows.find((row) => row.selectedSalaryHead?.salaryHeadCode === code);
      if (!head) {
        errors.push(`Salary head "${code}" not found.`);
      } else if (head.calculatedValue === undefined || head.calculatedValue === null) {
        errors.push(`Salary head "${code}" not calculated.`);
      }
    });

    if (errors.length > 0) {
      setErrors((prevErrors) => ({ ...prevErrors, [rowId]: errors.join(" ") }));
      return false;
    } else {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[rowId];
        return newErrors;
      });
      return true;
    }
  };

  const calculateRowValue = (row, rows) => {
    if (!row.selectedSalaryHead) return row;

    // for NIS calculation
    if (row.selectedSalaryHead.salaryHeadCode === "NIS") {
      try {

        const earningHeads = rows.filter(r =>
          r.selectedSalaryHead?.headType === "EARNING" &&
          r.selectedSalaryHead?.salaryHeadCode !== "NIS" &&
          r.id !== row.id 
        );

        const sumOfRelevantHeads = earningHeads.reduce(
          (sum, head) => sum + (head.calculatedValue || 0),
          0
        );

        const option1 = sumOfRelevantHeads * 0.056;
        const option2 = 280000 * 0.056;

        const calculatedValue = Math.min(option1, option2);

        const currentFormula = `MIN((${earningHeads.map(h => h.selectedSalaryHead.salaryHeadCode).join('+')})*0.056, 280000*0.056)`;

        return {
          ...row,
          calculatedValue,
          customFormula: currentFormula 
        };
      } catch (error) {
        console.error("NIS calculation error:", error);
        setErrors((prevErrors) => ({
          ...prevErrors,
          [row.id]: "Error calculating NIS value"
        }));
        return { ...row, calculatedValue: 0 };
      }
    }

    let calculatedValue = 0;
    const { calculationMethod, value, customFormula, percentageOf } = row;

    if (calculationMethod === "FIXEDAMOUNT") {
      calculatedValue = parseFloat(value) || 0;
    } else if (calculationMethod === "PERCENTAGE") {
      const baseHead = rows.find(r => r.selectedSalaryHead?.idSalaryHead === percentageOf);
      if (baseHead && baseHead.calculatedValue !== undefined) {
        // Convert percentage to decimal properly (20% = 0.20)
        calculatedValue = (baseHead.calculatedValue || 0) * (parseFloat(value) / 100);
      } else {
        setErrors((prevErrors) => ({ ...prevErrors, [row.id]: "Base salary head not selected or calculated." }));
        calculatedValue = 0;
      }
    } else if (calculationMethod === "FORMULA") {
      if (validateFormula(customFormula, row.id)) {
        try {
          const formula = customFormula
            .replace(/BP/g, rows.find(r => r.selectedSalaryHead?.salaryHeadCode === "BP")?.calculatedValue || 0)
            .replace(/DA/g, rows.find(r => r.selectedSalaryHead?.salaryHeadCode === "DA")?.calculatedValue || 0)
            .replace(/HRA/g, rows.find(r => r.selectedSalaryHead?.salaryHeadCode === "HRA")?.calculatedValue || 0)
            .replace(/PF/g, rows.find(r => r.selectedSalaryHead?.salaryHeadCode === "PF")?.calculatedValue || 0)
            .replace(/MLIE/g, rows.find(r => r.selectedSalaryHead?.salaryHeadCode === "MLIE")?.calculatedValue || 0)
            .replace(/MLID/g, rows.find(r => r.selectedSalaryHead?.salaryHeadCode === "MLID")?.calculatedValue || 0)
            .replace(/MI/g, rows.find(r => r.selectedSalaryHead?.salaryHeadCode === "MI")?.calculatedValue || 0)
            .replace(/TA/g, rows.find(r => r.selectedSalaryHead?.salaryHeadCode === "TA")?.calculatedValue || 0)
            .replace(/LTA/g, rows.find(r => r.selectedSalaryHead?.salaryHeadCode === "LTA")?.calculatedValue || 0)
            .replace(/OT/g, rows.find(r => r.selectedSalaryHead?.salaryHeadCode === "OT")?.calculatedValue || 0)
            .replace(/RFQ/g, rows.find(r => r.selectedSalaryHead?.salaryHeadCode === "RFQ")?.calculatedValue || 0)
            .replace(/SD/g, rows.find(r => r.selectedSalaryHead?.salaryHeadCode === "SD")?.calculatedValue || 0)
            .replace(/LOP/g, rows.find(r => r.selectedSalaryHead?.salaryHeadCode === "LOP")?.calculatedValue || 0)
            .replace(/NIS/g, rows.find(r => r.selectedSalaryHead?.salaryHeadCode === "NIS")?.calculatedValue || 0)
            .replace(/MA/g, rows.find(r => r.selectedSalaryHead?.salaryHeadCode === "MA")?.calculatedValue || 0)
            .replace(/MLI/g, rows.find(r => r.selectedSalaryHead?.salaryHeadCode === "MLI")?.calculatedValue || 0)
            .replace(/PT/g, rows.find(r => r.selectedSalaryHead?.salaryHeadCode === "PT")?.calculatedValue || 0)
            .replace(/PA/g, rows.find(r => r.selectedSalaryHead?.salaryHeadCode === "PA")?.calculatedValue || 0)
            .replace(/BA/g, rows.find(r => r.selectedSalaryHead?.salaryHeadCode === "BA")?.calculatedValue || 0)
            .replace(/UA/g, rows.find(r => r.selectedSalaryHead?.salaryHeadCode === "UA")?.calculatedValue || 0)
            .replace(/PEN/g, rows.find(r => r.selectedSalaryHead?.salaryHeadCode === "PEN")?.calculatedValue || 0)
            .replace(/ASA/g, rows.find(r => r.selectedSalaryHead?.salaryHeadCode === "ASA")?.calculatedValue || 0)
            .replace(/SBA/g, rows.find(r => r.selectedSalaryHead?.salaryHeadCode === "SBA")?.calculatedValue || 0)
            .replace(/MDE/g, rows.find(r => r.selectedSalaryHead?.salaryHeadCode === "MDE")?.calculatedValue || 0)
            .replace(/PAYE/g, rows.find(r => r.selectedSalaryHead?.salaryHeadCode === "PAYE")?.calculatedValue || 0)
            .replace(/MISC/g, rows.find(r => r.selectedSalaryHead?.salaryHeadCode === "MISC")?.calculatedValue || 0);
          calculatedValue = evaluate(formula);
        } catch (error) {
          setErrors((prevErrors) => ({ ...prevErrors, [row.id]: "Invalid formula syntax." }));
          calculatedValue = 0;
        }
      } else {
        calculatedValue = 0;
      }
    }

    return { ...row, calculatedValue };
  };

  const calculateValues = (rows) => {
    // First pass - calculate all fixed amounts
    let updatedRows = rows.map(row => {
      if (row.calculationMethod === "FIXEDAMOUNT") {
        return calculateRowValue(row, rows);
      }
      return row;
    });

    // Second pass - calculate percentages (which depend on fixed amounts)
    updatedRows = updatedRows.map(row => {
      if (row.calculationMethod === "PERCENTAGE") {
        return calculateRowValue(row, updatedRows);
      }
      return row;
    });

    // Third pass - calculate formulas (which may depend on both)
    updatedRows = updatedRows.map(row => {
      if (row.calculationMethod === "FORMULA") {
        return calculateRowValue(row, updatedRows);
      }
      return row;
    });

    const earnings = updatedRows
      .filter(row => row.selectedSalaryHead?.headType === "EARNING")
      .reduce((sum, row) => sum + (row.calculatedValue || 0), 0);

    const deductions = updatedRows
      .filter(row => row.selectedSalaryHead?.headType === "DEDUCTION")
      .reduce((sum, row) => sum + (row.calculatedValue || 0), 0);

    const net = earnings - deductions;

    setRows(updatedRows);
    setTotalEarnings(earnings);
    setTotalDeductions(deductions);
    setNetSalary(net);
  };

  const getDependentRows = (rows, salaryHeadCode) => {
    return rows.filter(row => {
      if (row.calculationMethod === "PERCENTAGE" && row.percentageOf !== null) {
        const baseHead = rows.find(r => r.selectedSalaryHead?.idSalaryHead === row.percentageOf);
        return baseHead?.selectedSalaryHead?.salaryHeadCode === salaryHeadCode;
      } else if (row.calculationMethod === "FORMULA") {
        return row.customFormula.includes(salaryHeadCode);
      }
      return false;
    });
  };

  const getAvailableSalaryHeads = (currentRowId) => {
    const selectedHeadIds = rows
      .filter(row => row.id !== currentRowId && row.selectedSalaryHead)
      .map(row => row.selectedSalaryHead.idSalaryHead);
    return salaryHeadList.filter(head => !selectedHeadIds.includes(head.idSalaryHead));
  };

  const setupEdit = (data) => {
    setIsEdit(true);
    if (data.employeeSalaryConfigDetails) {
      const mappedRows = data.employeeSalaryConfigDetails.map((detail, key) => ({
        id: detail.idEmployeeSalaryConfigDetail ?? key + 1,
        idEmployeeSalaryConfig: detail.idEmployeeSalaryConfig,
        idEmployeeSalaryConfigDetail: detail.idEmployeeSalaryConfigDetail ?? null,
        selectedSalaryHead: {
          idSalaryHead: detail.idSalaryHead,
          salaryHeadName: detail.salaryHeadName,
          salaryHeadCode: detail.salaryHeadCode,
          headType: detail.headType,
          calculationMethod: detail.calculationMethod,
          fixedValue: detail.fixedAmount,
          percentageValue: detail.percentageValue,
          customFormula: detail.customFormula,
          percentageOf: detail.percentageOfIdSalaryHead,
        },
        calculationMethod: detail.calculationMethod,
        value: detail.calculationMethod === "FIXEDAMOUNT" ? detail.fixedAmount : detail.percentageValue,
        customFormula: detail.customFormula,
        percentageOf: detail.percentageOfIdSalaryHead,
        calculatedValue: detail.salaryAmount,
      }));

      setRows(mappedRows);
      const selected = employeesListOption.find(option => option.value === data.idEmployee);
      setSelectedEmployee(selected);

      // Recalculate values after rows are set
      calculateValues(mappedRows);
    }
    setShowModal(true);
  };

  const setupEditForCopy = (data) => {
    setIsEdit(false);
    if (data.salaryTemplateDetails) {
      const mappedRows = data.salaryTemplateDetails.map((detail, key) => ({
        id: key + 1,
        idEmployeeSalaryConfig: null,
        idEmployeeSalaryConfigDetail: null,
        selectedSalaryHead: {
          idSalaryHead: detail.idSalaryHead,
          salaryHeadName: detail.salaryHeadName,
          salaryHeadCode: detail.salaryHeadCode,
          headType: detail.headType,
          calculationMethod: detail.calculationMethod,
          fixedValue: detail.fixedAmount,
          percentageValue: detail.percentageValue,
          customFormula: detail.customFormula,
          percentageOf: detail.percentageOfIdSalaryHead,
        },
        calculationMethod: detail.calculationMethod,
        value: detail.calculationMethod === "FIXEDAMOUNT" ? detail.fixedAmount : detail.percentageValue,
        customFormula: detail.customFormula,
        percentageOf: detail.percentageOfIdSalaryHead,
        calculatedValue: detail.salaryAmount,
      }));

      setRows(mappedRows);
      const selected = employeesListOption.find(option => option.value === data.idEmployee);
      setSelectedEmployee(selected);

      // Recalculate values after rows are set
      calculateValues(mappedRows);
    }
    setShowModal(true);
  };

  const setupEditForFullCopy = (data) => {
    console.log(data)
    setIsEdit(false);
    if (data.employeeSalaryConfigDetails) {
      const mappedRows = data.employeeSalaryConfigDetails.map((detail, key) => ({
        id: detail.idEmployeeSalaryConfigDetail ?? key + 1,
        idEmployeeSalaryConfig: detail.idEmployeeSalaryConfig,
        idEmployeeSalaryConfigDetail: detail.idEmployeeSalaryConfigDetail ?? null,
        selectedSalaryHead: {
          idSalaryHead: detail.idSalaryHead,
          salaryHeadName: detail.salaryHeadName,
          salaryHeadCode: detail.salaryHeadCode,
          headType: detail.headType,
          calculationMethod: detail.calculationMethod,
          fixedValue: detail.fixedAmount,
          percentageValue: detail.percentageValue,
          customFormula: detail.customFormula,
          percentageOf: detail.percentageOfIdSalaryHead,
        },
        calculationMethod: detail.calculationMethod,
        value: detail.calculationMethod === "FIXEDAMOUNT" ? detail.fixedAmount : detail.percentageValue,
        customFormula: detail.customFormula,
        percentageOf: detail.percentageOfIdSalaryHead,
        calculatedValue: detail.salaryAmount,
      }));

      setRows(mappedRows);
      const selected = employeesListOption.find(option => option.value === data.idEmployee);
      setSelectedEmployee(selected);

      // Recalculate values after rows are set
      calculateValues(mappedRows);
    }
    setShowModal(true);
  };

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return employeeSalaryConfigList.slice(startIndex, endIndex);
  }, [employeeSalaryConfigList, currentPage, rowsPerPage]);

  const handlePageChange = (page) => setCurrentPage(page);

  const resetForm = () => {
    setRows([{
      idSalaryTemplateDetail: null,
      id: Date.now(),
      selectedSalaryHead: null,
      calculationMethod: "FIXEDAMOUNT",
      value: 0,
      customFormula: "",
      percentageOf: null,
      calculatedValue: 0
    }]);
    setValidated(false);
    setSelectedEmployee(null)
    setDesignation(null);
    setEmpDescDept(null);
    setTotalEarnings(0);
    setTotalDeductions(0);
    setNetSalary(0);
    setIsEdit(false);
    setSelectedTemplateId("");
    setEmpDescDept("");
    setSelectedEmpConfigId('');
    setCopyFromData(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!selectedEmployee) {
      setValidated(true);
      return;
    }
    const payload = {
      idEmployeeSalaryConfig: null,
      idEmployee: selectedEmployee?.value,
      idDesignation: designation,
      totalEarnings: totalEarnings,
      totalDeductions: totalDeductions,
      netSalary: netSalary,
      activeStatus: true,
      validFrom: moment().format("YYYY-MM-DD"),
      employeeSalaryConfigDetails: rows.map(row => ({
        idSalaryHead: row.selectedSalaryHead.idSalaryHead,
        calculationMethod: row.calculationMethod,
        fixedAmount: row.calculationMethod === "FIXEDAMOUNT" ? row.value : null,
        percentageOfIdSalaryHead: row.calculationMethod === "PERCENTAGE" ? row.percentageOf : null,
        percentageValue: row.calculationMethod === "PERCENTAGE" ? row.value : null,
        customFormula: row.calculationMethod === "FORMULA" ? row.customFormula : null,
        salaryAmount: row.calculatedValue,
      }))
    };
    showLoader();
    EmployeeSalaryConfigService.saveEmployeeSalaryConfigData(payload)
      .then(res => {
        hideLoader();
        if (res.data.status === 200) {
          setShowModal(false);
          resetForm();
          getEmployeeSalaryConfigs();
        }
      })
      .catch(err => {
        hideLoader();
      });
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!selectedEmployee) {
      setValidated(true);
      return;
    }
    const payload = {
      idEmployeeSalaryConfig: dataToEdit.idEmployeeSalaryConfig ?? null,
      idEmployee: selectedEmployee?.value,
      idDesignation: designation,
      totalEarnings: totalEarnings,
      totalDeductions: totalDeductions,
      netSalary: netSalary,
      activeStatus: true,
      validFrom: dataToEdit.validFrom ?? moment().format("YYYY-MM-DD"),
      employeeSalaryConfigDetails: rows.map(row => ({
        idEmployeeSalaryConfig: dataToEdit.idEmployeeSalaryConfig,
        idEmployeeSalaryConfigDetail: row.idEmployeeSalaryConfigDetail,
        idSalaryHead: row.selectedSalaryHead.idSalaryHead,
        calculationMethod: row.calculationMethod,
        fixedAmount: row.calculationMethod === "FIXEDAMOUNT" ? row.value : null,
        percentageOfIdSalaryHead: row.calculationMethod === "PERCENTAGE" ? row.percentageOf : null,
        percentageValue: row.calculationMethod === "PERCENTAGE" ? row.value : null,
        customFormula: row.calculationMethod === "FORMULA" ? row.customFormula : null,
        salaryAmount: row.calculatedValue,
      }))
    };
    showLoader();
    EmployeeSalaryConfigService.updateEmployeeSalaryConfigData(payload)
      .then(res => {
        hideLoader();
        if (res.data.status === 200) {
          setShowModal(false);
          resetForm();
          getEmployeeSalaryConfigs();
        }
      })
      .catch(err => {
        hideLoader();
      });
  };

  const confirmFinalize = (val) => {
    setShowConfirmation(false);
    if (val) {
      getSalaryTemplatesById(selectedTemplateId);
    } else {
      setSelectedTemplateId("");
    }
  };

  const confirmCopyFinalize = (val) => {
    setShowCopyConfirmation(false);
    if (val) {
      setCopyFromData(true);
      getEmpSalConfigById(selectedEmpConfigId);
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
                  <input type="text" className="form-control" placeholder="Search" value={searchText} maxLength={30}
                    onChange={(e) => {
                      setSearchText(e.target.value);
                      if (e.target.value === "") {
                        getEmployeeSalaryConfigs();
                      }
                    }}
                    onKeyDown={e => e.key === 'Enter' ? getEmployeeSalaryConfigs() : ''} />
                  <i className="bx bx-search cursor" onClick={() => getEmployeeSalaryConfigs()}></i>
                </div>
                <button
                  className="btn btn-primary btn-sm px-4"
                  type="button"
                  onClick={() => { setShowModal(true); }}>
                  Add
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive ">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Emp. Code</th>
                      <th>Employee Name</th>
                      <th>Designation</th>
                      <th>Joining Date</th>
                      <th className="text-end">Total Earnings</th>
                      <th className="text-end">Total Deductions</th>
                      <th className="text-end">Net Salary</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody className="table-border-bottom-0">
                    {paginatedData?.length > 0 ? (
                      paginatedData?.map((item, index) => (
                        <tr key={item.idEmployeeSalaryConfig}>
                          <td style={{ color: "#1893cf", cursor: "pointer" }} onClick={() => getEmpSalDetails(item.idEmployeeSalaryConfig)}>{item?.employeeCode}</td>
                          <td>{item?.employeeName}</td>
                          <td>{item?.designationName}</td>
                          <td>{moment(item?.joiningDate).format("MM/DD/YYYY")}</td>
                          <td className="text-end">{Utils.formattedNumber(item?.totalEarnings)}</td>
                          <td className="text-end">{Utils.formattedNumber(item?.totalDeductions)}</td>
                          <td className="text-end">{Utils.formattedNumber(item?.netSalary)}</td>
                          <td className="text-end">
                            {
                              item?.approvalStatus != "APPROVED" &&
                              <button type="button" className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0" onClick={() => getEmpSalConfigById(item?.idEmployeeSalaryConfig)}>
                                <span className="tf-icons bx bx-pencil"></span>
                              </button>
                            }
                            {
                              item?.approvalStatus == "APPROVED" &&
                              <button type="button" className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0" onClick={() => { setShowCopyConfirmation(true); setSelectedEmpConfigId(item?.idEmployeeSalaryConfig) }}>
                                <span className="tf-icons bx bx-copy"></span>
                              </button>
                            }
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center">
                          <div className="Nodatafound_box">
                            <h6><i className="bx bx-search"></i> No data available!</h6>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="text-end pt-2">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>
          </div>

          <Modal
            show={showModal} onHide={() => { setShowModal(false); resetForm(); }} size='xl'
            aria-labelledby="contained-modal-title-vcenter"
            centered backdrop="static"
            keyboard={false}>
            <Modal.Header closeButton>
              <Modal.Title>
                <h5>Add/Update Employee Salary Configuration</h5>
              </Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <Form noValidate validated={validated}>
                <div className="row m-0">
                  <div className="col-md-4 p-2">
                    <label className="form-label mb-1">Employee Name</label>
                    <Select
                      options={employeesListOption}
                      isSearchable
                      onChange={handleChange}
                      value={selectedEmployee}
                      placeholder={'Select Employee'}
                      className='textSize' required
                    />
                  </div>

                  <div className="col-md-4 p-2">
                    <label className="form-label mb-1">Designation</label>
                    <input className='form-control' value={empDescDept} disabled />
                  </div>

                  <div className="col-md-4 p-2">
                    <label className="form-label mb-1">Templates</label>
                    <select
                      className="form-select form-select"
                      value={selectedTemplateId}
                      onChange={(e) => {
                        setSelectedTemplateId(e.target.value);
                      }}>
                      <option value="">Select Templates</option>
                      {templatesList.map(tem => (
                        <option key={tem.idSalaryTemplate} value={tem.idSalaryTemplate}>
                          {tem.salaryTemplateName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Salary Head</th>
                        <th>Calculation Method</th>
                        <th>Percentage Of</th>
                        <th>Value/Formula</th>
                        <th className="text-end">Calculated Value</th>
                        <th className="text-end"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, index) => (
                        <tr key={row.id}>
                          <td>
                            <select className="form-select form-select-sm"
                              value={row.selectedSalaryHead?.idSalaryHead || ""}
                              onChange={(e) => handleSalaryHeadChange(row.id, parseInt(e.target.value))} required
                            >
                              <option value="">Select Salary Head</option>
                              {getAvailableSalaryHeads(row.id).map(head => (
                                <option key={head.idSalaryHead} value={head.idSalaryHead}>
                                  {head.salaryHeadName} ({head.salaryHeadCode})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select className="form-select form-select-sm"
                              value={row.calculationMethod}
                              onChange={(e) => handleCalculationMethodChange(row.id, e.target.value)}
                            >
                              <option value="FIXEDAMOUNT">Fixed Amount</option>
                              <option value="PERCENTAGE">Percentage</option>
                              <option value="FORMULA">Formula</option>
                            </select>
                          </td>
                          <td>
                            {row.calculationMethod === "PERCENTAGE" ? (
                              <select className="form-select form-select-sm"
                                value={row.percentageOf || ""}
                                onChange={(e) => handlePercentageOfChange(row.id, parseInt(e.target.value))}
                              >
                                <option value="">Select Salary Head</option>
                                {rows
                                  .filter(r => r.id !== row.id && r.selectedSalaryHead)
                                  .map(r => (
                                    <option key={r.selectedSalaryHead.idSalaryHead} value={r.selectedSalaryHead.idSalaryHead}>
                                      {r.selectedSalaryHead.salaryHeadName}
                                    </option>
                                  ))}
                              </select>
                            ) : '-'}
                          </td>
                          <td>
                            {row.calculationMethod === "FORMULA" ? (
                              <>
                                <input className="form-control form-control-sm"
                                  type="text"
                                  value={row.customFormula}
                                  onChange={(e) => handleValueChange(row.id, 'customFormula', e.target.value)} required
                                />
                                {errors[row.id] && <div style={{ color: "red" }}>{errors[row.id]}</div>}
                              </>
                            ) : (
                              // <input className="form-control form-control-sm"
                              //   type="number"
                              //   value={row.value}
                              //   onChange={(e) => handleValueChange(row.id, 'value', e.target.value)}
                              // />
                              <>
                                <NumericFormat
                                  className="form-control form-control-sm"
                                  value={row.value}
                                  onValueChange={(values) => {
                                    const { value } = values;
                                    handleValueChange(row.id, 'value', value)
                                  }}
                                  decimalScale={2} // Allow up to 2 decimal places
                                  allowNegative={false} // Disallow negative numbers
                                  thousandSeparator={true} // Disable thousand separators
                                  allowLeadingZeros={false}
                                  placeholder="Add value"
                                  maxLength={12}
                                  required
                                />
                              </>
                            )}
                          </td>

                          <td className="text-end">{Utils.formattedNumber(row.calculatedValue)}</td>
                          <td className="text-end">
                            {rows.length > 1 && (
                              <button className="btn btn-outline-danger border-0 btn-sm" onClick={() => removeRow(index)}>
                                <i className="bx bx-trash"></i>
                              </button>
                            )}
                            {(rows.length - 1 == index) && (
                              <button className="btn btn-outline-primary border-0 btn-sm" onClick={addRow}>
                                <i className="bx bx-plus"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                        <b>Total Earnings:</b> {Utils.formattedNumber(totalEarnings)}
                      </li>
                      <li style={{ margin: "0" }}>
                        <b>Total Deductions:</b> {Utils.formattedNumber(totalDeductions)}
                      </li>
                      <li style={{ margin: "0" }}>
                        <b>Net Salary:</b> {Utils.formattedNumber(netSalary)}
                      </li>
                    </ul>
                  </div>
                </div>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              {
                isEdit &&
                <button
                  className="btn btn-primary btn-sm py-2 px-4 me-2"
                  onClick={(e) => handleUpdate(e)}>
                  Update
                </button>
              }
              {
                !isEdit &&
                <button
                  className="btn btn-primary btn-sm py-2 px-4 me-2"
                  onClick={(e) => handleSave(e)}>
                  Submit for Approval
                </button>
              }
              <button
                className="btn btn-outline-secondary btn-sm py-2 px-4"
                onClick={resetForm}>
                Reset
              </button>
            </Modal.Footer>
          </Modal>

          {
            showConfirmation &&
            <ConfirmationModal
              modalShow={true}
              messageText={"The existing data will be overwritten. Are you sure to copy this template?"}
              callbackModal={confirmFinalize}
              confirmBtn={"Confirm"}
              CancelBtn={"Cancel"}
            />
          }

          {
            showCopyConfirmation &&
            <ConfirmationModal
              modalShow={true}
              messageText={"Are you sure to create a copy of this config?"}
              callbackModal={confirmCopyFinalize}
              confirmBtn={"Confirm"}
              CancelBtn={"Cancel"}
            />
          }

          <Modal
            show={showDetailsModal} onHide={() => { setShowDetailsModal(false); }} size='xl'
            aria-labelledby="contained-modal-title-vcenter"
            centered backdrop="static"
            keyboard={false}>
            <Modal.Header closeButton>
              <Modal.Title>
                <h5>Latest salary configurations</h5>
              </Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <h6>{employeeSalaryDetails?.employeeName} ({employeeSalaryDetails?.employeeCode})</h6>
              <div className="px-2">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Salary Head Name</th>
                      <th>Type</th>
                      <th>Calculation Details</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeSalaryDetails?.employeeSalaryConfigDetails?.length > 0 ? (
                      employeeSalaryDetails?.employeeSalaryConfigDetails.map(
                        (detail, index) => {
                          const salaryHead = salaryHeadList.find(
                            (head) => head.idSalaryHead === detail.idSalaryHead
                          );
                          const percentageOfHead = salaryHeadList.find(
                            (head) =>
                              head.idSalaryHead ===
                              detail.percentageOfIdSalaryHead
                          );
                          return (
                            <tr key={index}>
                              <td>{salaryHead?.salaryHeadName || "N/A"}</td>
                              <td>{salaryHead?.headType || "N/A"}</td>
                              <td>
                                {detail.calculationMethod === "PERCENTAGE"
                                  ? `${detail.percentageValue}% of ${percentageOfHead?.salaryHeadName || "N/A"
                                  }`
                                  : detail.calculationMethod === "FIXEDAMOUNT"
                                    ? "Fixed Amount"
                                    : "Custom Formula"}
                              </td>
                              <td>
                                {Utils.formattedNumber(detail.salaryAmount)}
                              </td>
                            </tr>
                          );
                        }
                      )
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center">
                          <div className="Nodatafound_box">
                            <h6><i className="bx bx-search"></i> No data available!</h6>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="total_salarycard">
                  <ul
                    style={{
                      display: "flex",
                      listStyleType: "none",
                      padding: 0,
                    }}
                  >
                    <li style={{ marginRight: "20px" }}>
                      <b>Total Earnings:</b>{" "}
                      {Utils.formattedNumber(employeeSalaryDetails?.totalEarnings)}
                    </li>
                    <li style={{ marginRight: "20px" }}>
                      <b>Total Deductions:</b>{" "}
                      {Utils.formattedNumber(employeeSalaryDetails?.totalDeductions)}
                    </li>
                    <li>
                      <b>Net Salary:</b>{" "}
                      {Utils.formattedNumber(employeeSalaryDetails?.netSalary)}
                    </li>
                  </ul>
                </div>
              </div>

            </Modal.Body>
          </Modal>

        </div>
      </div>
    </div>
  );
};

export default EmployeeSalaryConfig;