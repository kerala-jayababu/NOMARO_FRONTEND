import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal } from "react-bootstrap";
import Button from "../../components/Button";
import Grid from "../../components/Grid";
import StatusBadge from "../../components/statusBadge";
import CommonService from "../../core/services/CommonService";
import { showToast } from "../../components/ToastNotifications/toastUtils";
import {
  fetchSalaryHead,
  getSalaryHeadById,
  addSalaryHead,
  updateSalaryHead,
} from "../../redux/reducers/salaryHead";
import {
  CALCULATION_METHODS,
  HEAD_CODE_PATTERN,
  HEAD_TYPES,
  MONTHS,
  PAY_FREQUENCIES,
  ROUNDING_RULES,
  STATUTORY_TYPES,
  formulaCodes,
  headTypeInfo,
  isAllowedFormula,
  methodLabel,
  normalizeHeadType,
  statutoryTypeLabel,
} from "../../utils/salaryStructure";

const initialFormData = {
  salaryHeadName: "",
  salaryHeadCode: "",
  orderNumber: "",
  calcSequence: "",
  headType: "EARNINGS",
  isTaxable: true,
  calculationMethod: "FIXEDAMOUNT",
  fixedValue: "",
  percentageValue: "",
  idPercentageSalaryHead: "",
  wageCeiling: "",
  customFormula: "",
  statutoryType: "",
  isArrearHead: false,
  idBaseSalaryHead: "",
  isPartOfGross: true,
  isPartOfCTC: true,
  isPartOfPFWage: false,
  isPartOfESIWage: false,
  isPartOfPTWage: true,
  isPartOfGratuityWage: false,
  minAmount: "",
  maxAmount: "",
  roundingRule: "NEAREST",
  payFrequency: "MONTHLY",
  allMonths: true,
  disbursingMonths: [],
  isProratedOnPaidDays: true,
  showOnPayslip: true,
  isActive: true,
};

const numberOrNull = (value) => (value === "" || value === null || value === undefined ? null : Number(value));
const toText = (value) => (value === null || value === undefined ? "" : String(value));

// Keeps digits and one decimal point, with at most 2 decimals
const isDecimalInput = (value) => /^\d*\.?\d{0,2}$/.test(value);

const SalaryHeads = () => {
  const dispatch = useDispatch();
  const { salaryHeadList, currentSalaryHead } = useSelector((state) => state.salaryHead);

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isLoadingHead, setIsLoadingHead] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [usage, setUsage] = useState([]); // where the head being edited is used
  const [deactivateWarning, setDeactivateWarning] = useState("");
  const formulaRef = useRef(null);

  const heads = Array.isArray(salaryHeadList) ? salaryHeadList : [];
  const isEdit = !!currentSalaryHead?.idSalaryHead;
  const isCodeLocked = isEdit && usage.length > 0;
  const method = formData.calculationMethod;
  const isStatutory = method === "STATUTORY";
  const isManual = method === "MANUAL";
  const showWageInclusion = formData.headType === "EARNINGS" && !isStatutory;

  const otherHeads = useMemo(
    () => heads.filter((h) => h.idSalaryHead !== currentSalaryHead?.idSalaryHead),
    [heads, currentSalaryHead]
  );

  useEffect(() => {
    dispatch(fetchSalaryHead());
    return () => {
      dispatch({ type: "salaryHead/clearCurrentSalaryHead" });
    };
  }, [dispatch]);

  // Load the head being edited into the form
  useEffect(() => {
    if (!currentSalaryHead || !currentSalaryHead.idSalaryHead) return;
    const h = currentSalaryHead;
    const months = (h.disbursingMonths || "")
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean)
      .map((m) => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase());

    setFormData({
      salaryHeadName: h.salaryHeadName || "",
      salaryHeadCode: h.salaryHeadCode || "",
      orderNumber: toText(h.orderNumber),
      calcSequence: toText(h.calcSequence),
      headType: normalizeHeadType(h.headType) || "EARNINGS",
      isTaxable: !!h.isTaxable,
      calculationMethod: (h.calculationMethod || "FIXEDAMOUNT").toUpperCase(),
      fixedValue: toText(h.fixedValue),
      percentageValue: toText(h.percentageValue),
      idPercentageSalaryHead: toText(h.idPercentageSalaryHead),
      wageCeiling: toText(h.wageCeiling),
      customFormula: h.customFormula || "",
      statutoryType: (h.statutoryType || "").toUpperCase(),
      isArrearHead: !!h.isArrearHead,
      idBaseSalaryHead: toText(h.idBaseSalaryHead),
      isPartOfGross: !!h.isPartOfGross,
      isPartOfCTC: !!h.isPartOfCTC,
      isPartOfPFWage: !!h.isPartOfPFWage,
      isPartOfESIWage: !!h.isPartOfESIWage,
      isPartOfPTWage: !!h.isPartOfPTWage,
      isPartOfGratuityWage: !!h.isPartOfGratuityWage,
      minAmount: toText(h.minAmount),
      maxAmount: toText(h.maxAmount),
      roundingRule: (h.roundingRule || "NEAREST").toUpperCase(),
      payFrequency: (h.payFrequency || "MONTHLY").toUpperCase(),
      allMonths: months.length === 0,
      disbursingMonths: months,
      isProratedOnPaidDays: !!h.isProratedOnPaidDays,
      showOnPayslip: !!h.showOnPayslip,
      isActive: !!h.isActive,
    });
    setErrors({});
    setDeactivateWarning("");

    // The code is locked once the head has been used, because formulas refer to it
    CommonService.getSalaryHeadUsage(h.idSalaryHead).then((res) => {
      setUsage(Array.isArray(res?.data?.data) ? res.data.data : []);
    });
  }, [currentSalaryHead]);

  // Edit: load the head, then open the popup
  const handleEditClick = (id) => {
    if (isLoadingHead) return;
    setIsLoadingHead(true);
    dispatch(getSalaryHeadById(id))
      .then(() => setShowFormModal(true))
      .finally(() => setIsLoadingHead(false));
  };

  const handleAddClick = () => {
    handleReset();
    setShowFormModal(true);
  };

  const handleCloseModal = () => {
    setShowFormModal(false);
    handleReset();
  };

  // Reset: back to the saved values when editing, empty form when adding
  const handleFormReset = () => {
    if (currentSalaryHead?.idSalaryHead) {
      handleEditClick(currentSalaryHead.idSalaryHead);
    } else {
      handleReset();
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setErrors({});
    setUsage([]);
    setDeactivateWarning("");
    dispatch({ type: "salaryHead/clearCurrentSalaryHead" });
  };

  const setField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleTextChange = (e) => setField(e.target.name, e.target.value);

  const handleDecimalChange = (e) => {
    if (isDecimalInput(e.target.value)) setField(e.target.name, e.target.value);
  };

  const handleIntegerChange = (e) => {
    if (/^\d*$/.test(e.target.value)) setField(e.target.name, e.target.value);
  };

  // Capital letters, digits and _ only
  const handleCodeChange = (e) => {
    setField("salaryHeadCode", e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""));
  };

  const handleCheckbox = (e) => setField(e.target.name, e.target.checked);

  const handleMethodChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      calculationMethod: value,
      // Statutory heads: Taxable and the wage flags are hidden, head type follows the statutory type
      ...(value === "STATUTORY"
        ? {
            isTaxable: false,
            isPartOfPFWage: false,
            isPartOfESIWage: false,
            isPartOfPTWage: false,
            isPartOfGratuityWage: false,
            headType: STATUTORY_TYPES.find((s) => s.value === prev.statutoryType)?.headType || prev.headType,
          }
        : {}),
      ...(value !== "MANUAL" ? { isArrearHead: false, idBaseSalaryHead: "" } : {}),
    }));
    setErrors({});
  };

  const handleStatutoryTypeChange = (e) => {
    const value = e.target.value;
    const type = STATUTORY_TYPES.find((s) => s.value === value);
    setFormData((prev) => ({ ...prev, statutoryType: value, headType: type ? type.headType : prev.headType }));
    setErrors((prev) => ({ ...prev, statutoryType: "" }));
  };

  const handleHeadTypeChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      headType: value,
      // Wage inclusion only applies to earnings
      ...(value !== "EARNINGS"
        ? { isPartOfGross: false, isPartOfCTC: value === "EMPLOYER_CONTRIBUTION", isPartOfPFWage: false, isPartOfESIWage: false, isPartOfPTWage: false, isPartOfGratuityWage: false }
        : { isPartOfGross: true, isPartOfCTC: true, isPartOfPTWage: true }),
    }));
  };

  const handleMonthChange = (month) => {
    setFormData((prev) => {
      const selected = prev.disbursingMonths.includes(month)
        ? prev.disbursingMonths.filter((m) => m !== month)
        : [...prev.disbursingMonths, month];
      return { ...prev, disbursingMonths: selected, allMonths: false };
    });
    setErrors((prev) => ({ ...prev, disbursingMonths: "" }));
  };

  // "All months" clears the others and saves blank
  const handleAllMonthsChange = (e) => {
    const checked = e.target.checked;
    setFormData((prev) => ({ ...prev, allMonths: checked, disbursingMonths: checked ? [] : prev.disbursingMonths }));
    setErrors((prev) => ({ ...prev, disbursingMonths: "" }));
  };

  // Adds [CODE] at the cursor position of the formula box
  const insertHeadCode = (code) => {
    if (!code) return;
    const token = `[${code}]`;
    const input = formulaRef.current;
    const text = formData.customFormula || "";
    const start = input ? input.selectionStart ?? text.length : text.length;
    const end = input ? input.selectionEnd ?? text.length : text.length;
    const updated = text.slice(0, start) + token + text.slice(end);
    setField("customFormula", updated);
    setTimeout(() => {
      if (input) {
        input.focus();
        input.setSelectionRange(start + token.length, start + token.length);
      }
    }, 0);
  };

  // Deactivating: warn if the head is used in any salary structure or formula
  const handleActiveChange = (e) => {
    const checked = e.target.checked;
    setField("isActive", checked);
    setDeactivateWarning("");
    if (!checked && isEdit) {
      CommonService.getSalaryHeadUsage(currentSalaryHead.idSalaryHead).then((res) => {
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        if (list.length > 0) {
          setDeactivateWarning(`This head is used in ${list.join("; ")}. Deactivating it removes it from new templates and salary structures.`);
        }
      });
    }
  };

  const validateForm = () => {
    const e = {};
    const name = formData.salaryHeadName.trim();
    const code = formData.salaryHeadCode.trim();
    const calcSequence = numberOrNull(formData.calcSequence);

    if (!name) e.salaryHeadName = "Salary Head Name is required.";
    else if (otherHeads.some((h) => (h.salaryHeadName || "").trim().toLowerCase() === name.toLowerCase()))
      e.salaryHeadName = "Salary Head Name already exists.";

    if (!code) e.salaryHeadCode = "Salary Head Code is required.";
    else if (!HEAD_CODE_PATTERN.test(code)) e.salaryHeadCode = "Use only capital letters, digits and _.";
    else if (otherHeads.some((h) => (h.salaryHeadCode || "").toUpperCase() === code))
      e.salaryHeadCode = "Salary Head Code already exists.";

    if (formData.orderNumber === "") e.orderNumber = "Payslip Order is required.";
    if (calcSequence === null) e.calcSequence = "Calculation Sequence is required.";

    if (!formData.headType) e.headType = "Select the head type.";

    if (method === "FIXEDAMOUNT" && formData.fixedValue === "") e.fixedValue = "Default Value is required.";

    if (method === "PERCENTAGE") {
      const pct = numberOrNull(formData.percentageValue);
      if (pct === null) e.percentageValue = "Percentage is required.";
      else if (pct < 0.01 || pct > 100) e.percentageValue = "Enter a percentage between 0.01 and 100.";
      if (!formData.idPercentageSalaryHead) e.idPercentageSalaryHead = "Percentage Of is required.";
      else {
        const base = otherHeads.find((h) => h.idSalaryHead === Number(formData.idPercentageSalaryHead));
        if (!base) e.idPercentageSalaryHead = "Percentage Of head does not exist.";
        else if (calcSequence !== null && !(base.calcSequence < calcSequence))
          e.idPercentageSalaryHead = `"${base.salaryHeadName}" must have a lower Calculation Sequence than this head.`;
      }
    }

    if (method === "FORMULA") {
      const formula = formData.customFormula.trim();
      if (!formula) e.customFormula = "Formula is required.";
      else if (!isAllowedFormula(formula)) e.customFormula = "Use only [CODE], numbers, + - * / ( ) and spaces.";
      else {
        for (const c of formulaCodes(formula)) {
          const ref = otherHeads.find((h) => (h.salaryHeadCode || "").toUpperCase() === c);
          if (!ref) { e.customFormula = `[${c}] in the formula is not a salary head code.`; break; }
          if ((ref.calculationMethod || "").toUpperCase() === "STATUTORY") { e.customFormula = `[${c}] is a statutory head and cannot be used in a formula.`; break; }
          if (calcSequence !== null && !(ref.calcSequence < calcSequence)) { e.customFormula = `[${c}] must have a lower Calculation Sequence than this head.`; break; }
        }
      }
    }

    if (isStatutory) {
      if (!formData.statutoryType) e.statutoryType = "Statutory Type is required.";
      else if (
        formData.isActive &&
        otherHeads.some((h) => h.isActive && (h.calculationMethod || "").toUpperCase() === "STATUTORY" && (h.statutoryType || "").toUpperCase() === formData.statutoryType)
      )
        e.statutoryType = `Another active salary head already has Statutory Type ${statutoryTypeLabel(formData.statutoryType)}.`;
    }

    if (isManual && formData.isArrearHead && !formData.idBaseSalaryHead) e.idBaseSalaryHead = "Arrear Of head is required.";

    const min = numberOrNull(formData.minAmount);
    const max = numberOrNull(formData.maxAmount);
    if (min !== null && max !== null && max < min) e.maxAmount = "Maximum can't be less than Minimum.";

    if (!formData.allMonths && formData.disbursingMonths.length === 0)
      e.disbursingMonths = "Select at least one month, or tick All months.";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPayload = () => ({
    salaryHeadName: formData.salaryHeadName.trim(),
    salaryHeadCode: formData.salaryHeadCode.trim(),
    orderNumber: numberOrNull(formData.orderNumber),
    calcSequence: numberOrNull(formData.calcSequence),
    headType: formData.headType,
    isTaxable: isStatutory ? false : formData.isTaxable,
    calculationMethod: method,
    fixedValue: method === "FIXEDAMOUNT" ? numberOrNull(formData.fixedValue) : null,
    percentageValue: method === "PERCENTAGE" ? numberOrNull(formData.percentageValue) : null,
    idPercentageSalaryHead: method === "PERCENTAGE" ? numberOrNull(formData.idPercentageSalaryHead) : null,
    wageCeiling: method === "PERCENTAGE" ? numberOrNull(formData.wageCeiling) : null,
    customFormula: method === "FORMULA" ? formData.customFormula.trim() : "",
    statutoryType: isStatutory ? formData.statutoryType : null,
    isArrearHead: isManual ? formData.isArrearHead : false,
    idBaseSalaryHead: isManual && formData.isArrearHead ? numberOrNull(formData.idBaseSalaryHead) : null,
    isPartOfGross: showWageInclusion ? formData.isPartOfGross : false,
    isPartOfCTC: showWageInclusion ? formData.isPartOfCTC : formData.headType === "EMPLOYER_CONTRIBUTION",
    isPartOfPFWage: showWageInclusion ? formData.isPartOfPFWage : false,
    isPartOfESIWage: showWageInclusion ? formData.isPartOfESIWage : false,
    isPartOfPTWage: showWageInclusion ? formData.isPartOfPTWage : false,
    isPartOfGratuityWage: showWageInclusion ? formData.isPartOfGratuityWage : false,
    minAmount: numberOrNull(formData.minAmount),
    maxAmount: numberOrNull(formData.maxAmount),
    roundingRule: formData.roundingRule,
    payFrequency: formData.payFrequency,
    disbursingMonths: formData.allMonths
      ? null
      : MONTHS.filter((m) => formData.disbursingMonths.includes(m)).map((m) => m.toUpperCase()).join(","),
    isProratedOnPaidDays: formData.isProratedOnPaidDays,
    showOnPayslip: formData.showOnPayslip,
    isActive: formData.isActive,
  });

  // The add thunk rejects with the API body; the update thunk resolves with the axios error on failure
  const resultOf = (action) => {
    const payload = action?.payload;
    if (action?.meta?.requestStatus === "fulfilled" && payload?.success) {
      return { ok: true, message: payload.message };
    }
    return {
      ok: false,
      message: payload?.response?.data?.message || payload?.message || "Failed to save the salary head.",
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSaving || !validateForm()) return;

    const data = buildPayload();
    const request = isEdit
      ? dispatch(updateSalaryHead({ ...data, idSalaryHead: currentSalaryHead.idSalaryHead }))
      : dispatch(addSalaryHead(data));

    setIsSaving(true);
    request
      .then((action) => {
        const result = resultOf(action);
        if (result.ok) {
          showToast(result.message || (isEdit ? "Salary head updated successfully." : "Salary head added successfully."), "success");
          dispatch(fetchSalaryHead());
          setShowFormModal(false);
          handleReset();
        } else {
          showToast(result.message, "error");
        }
      })
      .finally(() => setIsSaving(false));
  };

  const columns = [
    { key: "salaryHeadCode", label: "Code" },
    { key: "salaryHeadName", label: "Salary Head Name" },
    { key: "headType", label: "Type" },
    { key: "calculationMethod", label: "Method" },
    { key: "statutoryType", label: "Statutory Type" },
    { key: "calcSequence", label: "Calc Seq." },
    { key: "orderNumber", label: "Payslip Order" },
    { key: "isActive", label: "Status" },
    { key: "actions", label: "" },
  ];

  const sortedHeads = [...heads].sort(
    (a, b) => (a.calcSequence ?? 9999) - (b.calcSequence ?? 9999) || (a.orderNumber ?? 9999) - (b.orderNumber ?? 9999)
  );

  const sectionTitle = (text) => <h6 className="mt-3 mb-2 text-primary">{text}</h6>;

  const checkbox = (name, label, disabled = false) => (
    <div className="form-check mb-1">
      <input
        className="form-check-input"
        type="checkbox"
        id={`sh-${name}`}
        name={name}
        checked={!!formData[name]}
        onChange={handleCheckbox}
        disabled={disabled}
      />
      <label className="form-check-label" htmlFor={`sh-${name}`}>{label}</label>
    </div>
  );

  const fieldError = (name) => errors[name] && <div className="text-danger small">{errors[name]}</div>;

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between pb-3">
          <h5 className="m-0">List of Salary Heads</h5>
          <button type="button" className="btn btn-primary btn-sm px-4" onClick={handleAddClick}>
            <i className="bx bx-plus me-1"></i> Add
          </button>
        </div>
        <div className="card-body">
          <Grid
            columns={columns}
            data={sortedHeads.map((head) => {
              const type = headTypeInfo(head.headType);
              return {
                salaryHeadCode: <span className="bold">{head.salaryHeadCode}</span>,
                salaryHeadName: (
                  <div className="salary-head-name">
                    <span className="badge-headtype" style={{ backgroundColor: type?.color || "#6c757d" }}>
                      {type?.short || "?"}
                    </span>
                    <span className="name">{head.salaryHeadName}</span>
                  </div>
                ),
                headType: type?.label || head.headType || "-",
                calculationMethod: methodLabel(head.calculationMethod),
                statutoryType: head.statutoryType ? statutoryTypeLabel(head.statutoryType) : "-",
                calcSequence: head.calcSequence ?? "-",
                orderNumber: head.orderNumber ?? "-",
                isActive: <StatusBadge status={head.isActive ? "Active" : "Inactive"} />,
                id: head.idSalaryHead,
              };
            })}
            onEditClick={handleEditClick}
            idKey="id"
            modalId="editSalaryHeadModal"
          />
        </div>
      </div>

      {/* Add/Update Salary Head popup */}
      <Modal show={showFormModal} onHide={handleCloseModal} size="xl" centered backdrop="static" keyboard={false}
        aria-labelledby="salary-head-modal-title">
        <form onSubmit={handleSubmit} noValidate>
          <Modal.Header closeButton>
            <Modal.Title id="salary-head-modal-title">
              <h5 className="m-0">{isEdit ? "Edit Salary Head" : "Add Salary Head"}</h5>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row">
              <div className="col-lg-6">
                {/* 1. Basic details */}
                <div className="mb-2">
                  <label className="form-label mb-1">Salary Head Name</label>
                  <input className="form-control" name="salaryHeadName" maxLength={50}
                    value={formData.salaryHeadName} onChange={handleTextChange} />
                  {fieldError("salaryHeadName")}
                </div>
                <div className="row">
                  <div className="col-md-4 mb-2">
                    <label className="form-label mb-1">Salary Head Code</label>
                    <input className="form-control" name="salaryHeadCode" maxLength={20}
                      value={formData.salaryHeadCode} onChange={handleCodeChange} readOnly={isCodeLocked}
                      title={isCodeLocked ? "Locked: the head is already used and formulas refer to its code" : ""} />
                    {isCodeLocked && <div className="text-muted small"><i className="bx bx-lock-alt"></i> Locked, head in use</div>}
                    {fieldError("salaryHeadCode")}
                  </div>
                  <div className="col-md-4 mb-2">
                    <label className="form-label mb-1">Payslip Order</label>
                    <input className="form-control" name="orderNumber" maxLength={3}
                      value={formData.orderNumber} onChange={handleIntegerChange} />
                    {fieldError("orderNumber")}
                  </div>
                  <div className="col-md-4 mb-2">
                    <label className="form-label mb-1">Calculation Sequence</label>
                    <input className="form-control" name="calcSequence" maxLength={4}
                      value={formData.calcSequence} onChange={handleIntegerChange} />
                    <div className="text-muted small">Lower is calculated first</div>
                    {fieldError("calcSequence")}
                  </div>
                </div>

                {/* 2. Head type and 3. Tax */}
                <div className="row">
                  <div className={isStatutory ? "col-md-12 mb-2" : "col-md-6 mb-2"}>
                    <label className="form-label mb-1">Head Type</label>
                    <select className="form-select" name="headType" value={formData.headType}
                      onChange={(e) => handleHeadTypeChange(e.target.value)} disabled={isStatutory}>
                      {HEAD_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    {isStatutory && <div className="text-muted small">Set from the Statutory Type.</div>}
                    {fieldError("headType")}
                  </div>
                  {!isStatutory && (
                    <div className="col-md-6 mb-2">
                      <label className="form-label mb-1">Taxability</label>
                      <select className="form-select" name="isTaxable" value={formData.isTaxable ? "TAXABLE" : "NON_TAXABLE"}
                        onChange={(e) => setField("isTaxable", e.target.value === "TAXABLE")}>
                        <option value="TAXABLE">Taxable</option>
                        <option value="NON_TAXABLE">Non-Taxable</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* 4. Calculation method and Default Value */}
                <div className="row">
                  <div className="col-md-6 mb-2">
                    <label className="form-label mb-1">Calculation Method</label>
                    <select className="form-select" name="calculationMethod" value={method} onChange={handleMethodChange}>
                      {CALCULATION_METHODS.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  {method === "FIXEDAMOUNT" && (
                    <div className="col-md-6 mb-2">
                      <label className="form-label mb-1">Default Value</label>
                      <input className="form-control" name="fixedValue" maxLength={12}
                        value={formData.fixedValue} onChange={handleDecimalChange} />
                      {fieldError("fixedValue")}
                    </div>
                  )}
                </div>

                {method === "PERCENTAGE" && (
                  <div className="row">
                    <div className="col-md-4 mb-2">
                      <label className="form-label mb-1">Percentage %</label>
                      <input className="form-control" name="percentageValue" maxLength={6}
                        value={formData.percentageValue} onChange={handleDecimalChange} />
                      {fieldError("percentageValue")}
                    </div>
                    <div className="col-md-8 mb-2">
                      <label className="form-label mb-1">Percentage Of</label>
                      <select className="form-select" name="idPercentageSalaryHead"
                        value={formData.idPercentageSalaryHead} onChange={handleTextChange}>
                        <option value="">Select</option>
                        {otherHeads
                          .filter((h) => (h.calculationMethod || "").toUpperCase() !== "STATUTORY")
                          .map((h) => (
                            <option key={h.idSalaryHead} value={h.idSalaryHead}>
                              {h.salaryHeadName} ({h.salaryHeadCode}) · Seq {h.calcSequence ?? "-"}
                            </option>
                          ))}
                      </select>
                      {fieldError("idPercentageSalaryHead")}
                    </div>
                    <div className="col-md-6 mb-2">
                      <label className="form-label mb-1">Wage Ceiling (optional)</label>
                      <input className="form-control" name="wageCeiling" maxLength={12}
                        value={formData.wageCeiling} onChange={handleDecimalChange} />
                    </div>
                  </div>
                )}

                {method === "FORMULA" && (
                  <div className="mb-2">
                    <div className="d-flex justify-content-between align-items-end mb-1">
                      <label className="form-label mb-0">Formula</label>
                      <select className="form-select form-select-sm" style={{ width: "55%" }} value=""
                        onChange={(e) => insertHeadCode(e.target.value)}>
                        <option value="">Insert head...</option>
                        {otherHeads
                          .filter((h) => (h.calculationMethod || "").toUpperCase() !== "STATUTORY")
                          .map((h) => (
                            <option key={h.idSalaryHead} value={h.salaryHeadCode}>
                              [{h.salaryHeadCode}] {h.salaryHeadName}
                            </option>
                          ))}
                      </select>
                    </div>
                    <textarea ref={formulaRef} className="form-control" name="customFormula" rows={2} maxLength={500}
                      placeholder="([BASIC] + [DA]) * 10 / 100" value={formData.customFormula} onChange={handleTextChange} />
                    <div className="text-muted small">Only [CODE], numbers, + - * / ( ) and spaces. Every head used must have a lower Calculation Sequence.</div>
                    {fieldError("customFormula")}
                  </div>
                )}

                {isStatutory && (
                  <div className="mb-2">
                    <label className="form-label mb-1">Statutory Type</label>
                    <select className="form-select" name="statutoryType" value={formData.statutoryType} onChange={handleStatutoryTypeChange}>
                      <option value="">Select</option>
                      {STATUTORY_TYPES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    {fieldError("statutoryType")}
                  </div>
                )}

                {isManual && (
                  <div className="mb-2">
                    <div className="alert alert-secondary py-2 mb-2 small">Paid through Salary Adjustments.</div>
                    {checkbox("isArrearHead", "Is Arrear Head")}
                    {formData.isArrearHead && (
                      <div className="mt-1">
                        <label className="form-label mb-1">Arrear Of</label>
                        <select className="form-select" name="idBaseSalaryHead" value={formData.idBaseSalaryHead} onChange={handleTextChange}>
                          <option value="">Select</option>
                          {otherHeads.map((h) => (
                            <option key={h.idSalaryHead} value={h.idSalaryHead}>{h.salaryHeadName} ({h.salaryHeadCode})</option>
                          ))}
                        </select>
                        {fieldError("idBaseSalaryHead")}
                      </div>
                    )}
                  </div>
                )}

                {/* 6. Limits and rounding */}
                {sectionTitle("Limits and Rounding")}
                <div className="row">
                  <div className="col-md-4 mb-2">
                    <label className="form-label mb-1">Minimum Amount</label>
                    <input className="form-control" name="minAmount" maxLength={12} value={formData.minAmount} onChange={handleDecimalChange} />
                  </div>
                  <div className="col-md-4 mb-2">
                    <label className="form-label mb-1">Maximum Amount</label>
                    <input className="form-control" name="maxAmount" maxLength={12} value={formData.maxAmount} onChange={handleDecimalChange} />
                    {fieldError("maxAmount")}
                  </div>
                  <div className="col-md-4 mb-2">
                    <label className="form-label mb-1">Rounding</label>
                    <select className="form-select" name="roundingRule" value={formData.roundingRule} onChange={handleTextChange}>
                      {ROUNDING_RULES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 7. Payment */}
                {sectionTitle("Payment")}
                <div className="mb-2">
                  <label className="form-label mb-1">Pay Frequency</label>
                  <select className="form-select" name="payFrequency" value={formData.payFrequency} onChange={handleTextChange}>
                    {PAY_FREQUENCIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-lg-6">
                {/* 5. Wage inclusion */}
                {showWageInclusion && (
                  <>
                    {sectionTitle("Wage Inclusion")}
                    <div className="row">
                      <div className="col-6">{checkbox("isPartOfGross", "Part of Gross")}</div>
                      <div className="col-6">{checkbox("isPartOfCTC", "Part of CTC")}</div>
                      <div className="col-6">{checkbox("isPartOfPFWage", "PF Wage")}</div>
                      <div className="col-6">{checkbox("isPartOfESIWage", "ESI Wage")}</div>
                      <div className="col-6">{checkbox("isPartOfPTWage", "PT Wage")}</div>
                      <div className="col-6">{checkbox("isPartOfGratuityWage", "Gratuity Wage")}</div>
                    </div>
                    <div className="text-muted small">Tick PF Wage for Basic, DA and Basic Arrears.</div>
                  </>
                )}

                {/* 8. Other */}
                {sectionTitle("Other")}
                <div className="form-check form-switch mb-2">
                  <input className="form-check-input" type="checkbox" role="switch" id="sh-showOnPayslip"
                    name="showOnPayslip" checked={formData.showOnPayslip} onChange={handleCheckbox} />
                  <label className="form-check-label" htmlFor="sh-showOnPayslip">Show on Payslip</label>
                </div>
                <div className="form-check form-switch mb-2">
                  <input className="form-check-input" type="checkbox" role="switch" id="sh-isActive"
                    checked={formData.isActive} onChange={handleActiveChange} />
                  <label className="form-check-label" htmlFor="sh-isActive">Active Status</label>
                </div>
                {deactivateWarning && <div className="alert alert-warning py-2 small">{deactivateWarning}</div>}

                {/* Disbursing months and proration */}
                <div className="mb-2 mt-3">
                  <label className="form-label mb-1">Disbursing Months</label>
                  <div className="form-check mb-1">
                    <input className="form-check-input" type="checkbox" id="sh-allMonths"
                      checked={formData.allMonths} onChange={handleAllMonthsChange} />
                    <label className="form-check-label" htmlFor="sh-allMonths">All months</label>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
                    {MONTHS.map((month) => (
                      <div key={month} className="form-check mb-0">
                        <input className="form-check-input" type="checkbox" id={`month-${month}`}
                          checked={formData.disbursingMonths.includes(month)} onChange={() => handleMonthChange(month)} />
                        <label className="form-check-label" htmlFor={`month-${month}`}>{month.slice(0, 3)}</label>
                      </div>
                    ))}
                  </div>
                  {fieldError("disbursingMonths")}
                </div>
                {checkbox("isProratedOnPaidDays", "Prorate on paid days")}
                <div className="text-muted small mb-2">Used from the next version of the salary run.</div>
              </div>
            </div>
            {Object.values(errors).some(Boolean) && (
              <div className="text-danger small mt-2">Please correct the highlighted fields.</div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button type="submit" className="btn btn-primary btn-sm py-2 px-4 me-2">
              {isEdit ? "Update" : "Submit"}
            </Button>
            <Button type="button" className="btn btn-outline-secondary btn-sm py-2 px-4" onClick={handleFormReset}>
              Reset
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
};

export default SalaryHeads;
