import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "react-bootstrap";
import { NumericFormat } from "react-number-format";
import { toast } from "react-toastify";
import moment from "moment";
import TaxConfigService from "../../core/services/TaxConfigService";
import CommonService from "../../core/services/CommonService";
import { useLoader } from "../../components/LoaderContext";

// TaxYearConfigs.IdTaxRegime (1 = New Regime, 2 = Old Regime, as in the current data)
const TAX_REGIMES = [
  { value: 1, label: "New Regime" },
  { value: 2, label: "Old Regime" },
];
const regimeLabel = (id) => TAX_REGIMES.find((r) => r.value === Number(id))?.label || `Regime ${id}`;

// TaxSlabs.AgeCategory
const AGE_CATEGORIES = [
  { value: "ALL", label: "All ages" },
  { value: "BELOW60", label: "Below 60" },
  { value: "SENIOR", label: "Senior (60 to 80)" },
  { value: "SUPER", label: "Super Senior (80 and above)" },
];
const ageLabel = (code) => AGE_CATEGORIES.find((a) => a.value === code)?.label || code;

const formatAmount = (value) =>
  value === null || value === undefined || value === ""
    ? ""
    : new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

const yearLabel = (fy) => {
  if (!fy) return "";
  const from = fy.financialYearFrom ? moment(fy.financialYearFrom) : null;
  const to = fy.financialYearTo ? moment(fy.financialYearTo) : null;
  return from && to ? `${from.year()}-${String(to.year() % 100).padStart(2, "0")}` : fy.financialYearName || "";
};

const emptyConfig = {
  idTaxYearConfig: 0,
  idTaxRegime: 1,
  standardDeduction: "",
  rebateIncomeLimit: "",
  rebateMaxAmount: "",
  cessRate: "4",
  allowMarginalRelief: false,
};

const emptySlab = { idTaxSlab: 0, ageCategory: "ALL", incomeFrom: "", incomeTo: "", taxRate: "" };

const numberOrNull = (value) => (value === "" || value === null || value === undefined ? null : Number(value));

function TaxConfiguration() {
  const { showLoader, hideLoader } = useLoader();

  const [financialYears, setFinancialYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState("");
  const [configs, setConfigs] = useState([]); // TaxYearConfigs of the selected year
  const [selectedConfigId, setSelectedConfigId] = useState(""); // "" = new configuration
  const [configForm, setConfigForm] = useState(emptyConfig);
  const [configErrors, setConfigErrors] = useState({});

  const [slabs, setSlabs] = useState([]);
  const [ageFilter, setAgeFilter] = useState("");
  const [loadingSlabs, setLoadingSlabs] = useState(false);
  const [showSlabModal, setShowSlabModal] = useState(false);
  const [slabForm, setSlabForm] = useState(emptySlab);
  const [slabErrors, setSlabErrors] = useState({});

  const selectedConfig = useMemo(
    () => configs.find((c) => String(c.idTaxYearConfig) === String(selectedConfigId)),
    [configs, selectedConfigId]
  );

  // Previous years, the current one and the next one
  const visibleYears = useMemo(() => {
    const nextYear = moment().year() + 1;
    return financialYears.filter((fy) => !fy.financialYearFrom || moment(fy.financialYearFrom).year() <= nextYear);
  }, [financialYears]);

  useEffect(() => {
    CommonService.getAllFinancialYears().then((res) => {
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : [];
      setFinancialYears(list);
      const today = moment();
      const current =
        list.find(
          (fy) => today.isSameOrAfter(moment(fy.financialYearFrom)) && today.isSameOrBefore(moment(fy.financialYearTo))
        ) || list[0];
      if (current) setSelectedYearId(String(current.idFinancialYear));
    });
  }, []);

  useEffect(() => {
    if (selectedYearId) loadConfigs(selectedYearId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYearId]);

  useEffect(() => {
    if (selectedConfig) {
      setConfigForm({
        idTaxYearConfig: selectedConfig.idTaxYearConfig,
        idTaxRegime: selectedConfig.idTaxRegime,
        standardDeduction: selectedConfig.standardDeduction ?? "",
        rebateIncomeLimit: selectedConfig.rebateIncomeLimit ?? "",
        rebateMaxAmount: selectedConfig.rebateMaxAmount ?? "",
        cessRate: selectedConfig.cessRate ?? "",
        allowMarginalRelief: !!selectedConfig.allowMarginalRelief,
      });
      loadSlabs(selectedConfig.idTaxYearConfig);
    } else {
      // New configuration: first regime not yet set up for this year
      const usedRegimes = configs.map((c) => c.idTaxRegime);
      const freeRegime = TAX_REGIMES.find((r) => !usedRegimes.includes(r.value))?.value ?? 1;
      setConfigForm({ ...emptyConfig, idTaxRegime: freeRegime });
      setSlabs([]);
    }
    setConfigErrors({});
    setAgeFilter("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConfig, configs]);

  const loadConfigs = async (idFinancialYear, keepConfigId = null) => {
    const res = await TaxConfigService.getTaxYearConfigs(idFinancialYear);
    const list = Array.isArray(res?.data?.data) ? res.data.data : [];
    setConfigs(list);
    const keep = keepConfigId && list.find((c) => c.idTaxYearConfig === keepConfigId);
    setSelectedConfigId(keep ? String(keep.idTaxYearConfig) : list.length ? String(list[0].idTaxYearConfig) : "");
  };

  const loadSlabs = async (idTaxYearConfig) => {
    setLoadingSlabs(true);
    const res = await TaxConfigService.getTaxSlabs(idTaxYearConfig);
    setSlabs(Array.isArray(res?.data?.data) ? res.data.data : []);
    setLoadingSlabs(false);
  };

  // ---------- Tax year configuration ----------

  const setConfigField = (field, value) => {
    setConfigForm((prev) => ({ ...prev, [field]: value }));
    setConfigErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateConfig = () => {
    const e = {};
    if (!selectedYearId) e.year = "Select the financial year.";
    if (configForm.standardDeduction === "") e.standardDeduction = "Standard Deduction is required.";
    if (configForm.cessRate === "") e.cessRate = "Cess Rate is required.";
    else if (Number(configForm.cessRate) > 100) e.cessRate = "Cess Rate must be between 0 and 100.";
    if ((configForm.rebateIncomeLimit === "") !== (configForm.rebateMaxAmount === ""))
      e.rebateMaxAmount = "Enter both Rebate Income Limit and Rebate Max Amount, or leave both empty.";
    if (configs.some((c) => c.idTaxRegime === Number(configForm.idTaxRegime) && c.idTaxYearConfig !== configForm.idTaxYearConfig))
      e.idTaxRegime = "This financial year already has a configuration for this regime.";
    setConfigErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveConfig = async (e) => {
    e.preventDefault();
    if (!validateConfig()) return;
    showLoader();
    const res = await TaxConfigService.addOrUpdateTaxYearConfig({
      idTaxYearConfig: configForm.idTaxYearConfig,
      idFinancialYear: Number(selectedYearId),
      idTaxRegime: Number(configForm.idTaxRegime),
      standardDeduction: Number(configForm.standardDeduction),
      rebateIncomeLimit: numberOrNull(configForm.rebateIncomeLimit),
      rebateMaxAmount: numberOrNull(configForm.rebateMaxAmount),
      cessRate: Number(configForm.cessRate),
      allowMarginalRelief: configForm.allowMarginalRelief,
    });
    hideLoader();
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(res.data?.message || "Tax year configuration saved.");
    // After adding, select the new configuration (the one with this regime)
    const listRes = await TaxConfigService.getTaxYearConfigs(selectedYearId);
    const list = Array.isArray(listRes?.data?.data) ? listRes.data.data : [];
    setConfigs(list);
    const saved = list.find((c) => c.idTaxRegime === Number(configForm.idTaxRegime));
    setSelectedConfigId(saved ? String(saved.idTaxYearConfig) : "");
  };

  // ---------- Tax slabs ----------

  const visibleSlabs = useMemo(
    () => (ageFilter ? slabs.filter((s) => s.ageCategory === ageFilter) : slabs),
    [slabs, ageFilter]
  );

  // Age categories used in this configuration, plus the standard ones
  const ageOptions = useMemo(() => {
    const used = slabs.map((s) => s.ageCategory).filter(Boolean);
    const known = AGE_CATEGORIES.map((a) => a.value);
    return [...AGE_CATEGORIES, ...[...new Set(used)].filter((u) => !known.includes(u)).map((u) => ({ value: u, label: u }))];
  }, [slabs]);

  const openAddSlab = () => {
    // Next slab starts where the last slab of the category ends
    const category = ageFilter || (slabs[0]?.ageCategory ?? "ALL");
    const last = slabs.filter((s) => s.ageCategory === category).sort((a, b) => b.incomeFrom - a.incomeFrom)[0];
    setSlabForm({ ...emptySlab, ageCategory: category, incomeFrom: last?.incomeTo ?? (last ? "" : 0) });
    setSlabErrors({});
    setShowSlabModal(true);
  };

  const openEditSlab = (slab) => {
    setSlabForm({
      idTaxSlab: slab.idTaxSlab,
      ageCategory: slab.ageCategory,
      incomeFrom: slab.incomeFrom,
      incomeTo: slab.incomeTo ?? "",
      taxRate: slab.taxRate,
    });
    setSlabErrors({});
    setShowSlabModal(true);
  };

  const setSlabField = (field, value) => {
    setSlabForm((prev) => ({ ...prev, [field]: value }));
    setSlabErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateSlab = () => {
    const e = {};
    if (!slabForm.ageCategory) e.ageCategory = "Age Category is required.";
    if (slabForm.incomeFrom === "") e.incomeFrom = "Income From is required.";
    if (slabForm.incomeTo !== "" && Number(slabForm.incomeTo) <= Number(slabForm.incomeFrom))
      e.incomeTo = "Income To must be greater than Income From (leave it empty for the top slab).";
    if (slabForm.taxRate === "") e.taxRate = "Tax Rate is required.";
    else if (Number(slabForm.taxRate) > 100) e.taxRate = "Tax Rate must be between 0 and 100.";

    // Ranges must not overlap within the same age category
    if (!e.incomeFrom && !e.incomeTo) {
      const from = Number(slabForm.incomeFrom);
      const to = slabForm.incomeTo === "" ? Infinity : Number(slabForm.incomeTo);
      const clash = slabs.find(
        (s) =>
          s.ageCategory === slabForm.ageCategory &&
          s.idTaxSlab !== slabForm.idTaxSlab &&
          from < (s.incomeTo ?? Infinity) &&
          s.incomeFrom < to
      );
      if (clash)
        e.incomeFrom = `Overlaps the slab ${formatAmount(clash.incomeFrom)} - ${
          clash.incomeTo === null ? "and above" : formatAmount(clash.incomeTo)
        }.`;
    }
    setSlabErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveSlab = async (e) => {
    e.preventDefault();
    if (!selectedConfig || !validateSlab()) return;
    const payload = {
      idTaxSlab: slabForm.idTaxSlab,
      idTaxYearConfig: selectedConfig.idTaxYearConfig,
      ageCategory: slabForm.ageCategory,
      incomeFrom: Number(slabForm.incomeFrom),
      incomeTo: numberOrNull(slabForm.incomeTo),
      taxRate: Number(slabForm.taxRate),
    };
    showLoader();
    const res = slabForm.idTaxSlab ? await TaxConfigService.updateTaxSlab(payload) : await TaxConfigService.addTaxSlab(payload);
    hideLoader();
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(res.data?.message || "Tax slab saved.");
    setShowSlabModal(false);
    loadSlabs(selectedConfig.idTaxYearConfig);
  };

  const fieldError = (errors, name) => errors[name] && <div className="text-danger small">{errors[name]}</div>;

  const amountInput = (value, onChange, placeholder = "") => (
    <NumericFormat
      className="form-control"
      value={value}
      onValueChange={({ value: v }) => onChange(v)}
      thousandSeparator={true}
      thousandsGroupStyle="lakh"
      decimalScale={2}
      allowNegative={false}
      placeholder={placeholder}
    />
  );

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Financial year and regime */}
      <div className="card mb-3">
        <div className="card-body py-3">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label mb-1">Financial Year</label>
              <select className="form-select" value={selectedYearId} onChange={(e) => setSelectedYearId(e.target.value)}>
                <option value="">Select Financial Year</option>
                {visibleYears.map((fy) => (
                  <option key={fy.idFinancialYear} value={fy.idFinancialYear}>
                    {yearLabel(fy)}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-9">
              <label className="form-label mb-1 d-block">Tax Regime</label>
              <div className="d-flex flex-wrap gap-2">
                {configs.map((c) => (
                  <button
                    key={c.idTaxYearConfig}
                    type="button"
                    className={`btn btn-sm ${String(c.idTaxYearConfig) === String(selectedConfigId) ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setSelectedConfigId(String(c.idTaxYearConfig))}
                  >
                    {regimeLabel(c.idTaxRegime)} <span className="badge bg-white text-primary ms-1">{c.slabCount}</span>
                  </button>
                ))}
                {selectedYearId && configs.length < TAX_REGIMES.length && (
                  <button
                    type="button"
                    className={`btn btn-sm ${selectedConfigId === "" ? "btn-secondary" : "btn-outline-secondary"}`}
                    onClick={() => setSelectedConfigId("")}
                  >
                    <i className="bx bx-plus me-1"></i> Add Regime
                  </button>
                )}
                {selectedYearId && configs.length === 0 && (
                  <span className="text-muted small align-self-center">No regime is set up for this year yet.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Tax year configuration */}
        <div className="col-lg-4 mb-3">
          <div className="card h-100">
            <div className="card-header pb-2">
              <h5 className="m-0">{selectedConfig ? `${regimeLabel(selectedConfig.idTaxRegime)} Settings` : "New Regime Configuration"}</h5>
            </div>
            <div className="card-body">
              <form onSubmit={saveConfig} noValidate>
                <div className="mb-2">
                  <label className="form-label mb-1">Tax Regime</label>
                  <select
                    className="form-select"
                    value={configForm.idTaxRegime}
                    onChange={(e) => setConfigField("idTaxRegime", Number(e.target.value))}
                    disabled={!!selectedConfig}
                  >
                    {TAX_REGIMES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  {fieldError(configErrors, "idTaxRegime")}
                </div>
                <div className="mb-2">
                  <label className="form-label mb-1">Standard Deduction (₹)</label>
                  {amountInput(configForm.standardDeduction, (v) => setConfigField("standardDeduction", v))}
                  {fieldError(configErrors, "standardDeduction")}
                </div>
                <div className="row">
                  <div className="col-6 mb-2">
                    <label className="form-label mb-1">Rebate Income Limit (₹)</label>
                    {amountInput(configForm.rebateIncomeLimit, (v) => setConfigField("rebateIncomeLimit", v), "Section 87A")}
                  </div>
                  <div className="col-6 mb-2">
                    <label className="form-label mb-1">Rebate Max Amount (₹)</label>
                    {amountInput(configForm.rebateMaxAmount, (v) => setConfigField("rebateMaxAmount", v))}
                  </div>
                </div>
                {fieldError(configErrors, "rebateMaxAmount")}
                <div className="mb-2">
                  <label className="form-label mb-1">Cess Rate (%)</label>
                  <NumericFormat
                    className="form-control"
                    value={configForm.cessRate}
                    onValueChange={({ value }) => setConfigField("cessRate", value)}
                    decimalScale={2}
                    allowNegative={false}
                    isAllowed={({ floatValue }) => floatValue === undefined || floatValue <= 100}
                  />
                  {fieldError(configErrors, "cessRate")}
                </div>
                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="allowMarginalRelief"
                    checked={configForm.allowMarginalRelief}
                    onChange={(e) => setConfigField("allowMarginalRelief", e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="allowMarginalRelief">Allow Marginal Relief</label>
                </div>
                {fieldError(configErrors, "year")}
                <div className="text-end">
                  <button type="submit" className="btn btn-primary btn-sm px-4" disabled={!selectedYearId}>
                    {selectedConfig ? "Update" : "Add"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Tax slabs */}
        <div className="col-lg-8 mb-3">
          <div className="card h-100">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2 pb-2">
              <h5 className="m-0">
                Tax Slabs
                {selectedConfig && (
                  <span className="text-muted fs-6 ms-2">
                    {regimeLabel(selectedConfig.idTaxRegime)} · {yearLabel(financialYears.find((fy) => String(fy.idFinancialYear) === selectedYearId))}
                  </span>
                )}
              </h5>
              <div className="d-flex align-items-center gap-2">
                <select className="form-select form-select-sm" style={{ width: "200px" }} value={ageFilter}
                  onChange={(e) => setAgeFilter(e.target.value)} disabled={!selectedConfig}>
                  <option value="">All Age Categories</option>
                  {ageOptions.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
                <button type="button" className="btn btn-primary btn-sm px-3" onClick={openAddSlab} disabled={!selectedConfig}>
                  <i className="bx bx-plus me-1"></i> Add Slab
                </button>
              </div>
            </div>
            <div className="card-body">
              {!selectedConfig ? (
                <div className="text-center text-muted py-4">Save the regime settings first, then add its tax slabs.</div>
              ) : loadingSlabs ? (
                <div className="text-center p-3">Loading...</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Age Category</th>
                        <th className="text-end">Income From (₹)</th>
                        <th className="text-end">Income To (₹)</th>
                        <th className="text-end">Tax Rate</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody className="table-border-bottom-0">
                      {visibleSlabs.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center">
                            <div className="Nodatafound_box">
                              <h6><i className="bx bx-search"></i> No tax slabs yet.</h6>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        visibleSlabs.map((slab) => (
                          <tr key={slab.idTaxSlab}>
                            <td>{ageLabel(slab.ageCategory)}</td>
                            <td className="text-end">{formatAmount(slab.incomeFrom)}</td>
                            <td className="text-end">{slab.incomeTo === null ? <span className="text-muted">and above</span> : formatAmount(slab.incomeTo)}</td>
                            <td className="text-end">{Number(slab.taxRate)}%</td>
                            <td className="text-end">
                              <button type="button" className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
                                title="Edit" onClick={() => openEditSlab(slab)}>
                                <span className="tf-icons bx bx-pencil"></span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit slab */}
      <Modal show={showSlabModal} onHide={() => setShowSlabModal(false)} centered backdrop="static" keyboard={false}>
        <form onSubmit={saveSlab} noValidate>
          <Modal.Header closeButton>
            <Modal.Title>
              <h5 className="m-0">{slabForm.idTaxSlab ? "Edit Tax Slab" : "Add Tax Slab"}</h5>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-2">
              <label className="form-label mb-1">Age Category</label>
              <select className="form-select" value={slabForm.ageCategory} onChange={(e) => setSlabField("ageCategory", e.target.value)}>
                {ageOptions.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
              {fieldError(slabErrors, "ageCategory")}
            </div>
            <div className="row">
              <div className="col-6 mb-2">
                <label className="form-label mb-1">Income From (₹)</label>
                {amountInput(slabForm.incomeFrom, (v) => setSlabField("incomeFrom", v))}
                {fieldError(slabErrors, "incomeFrom")}
              </div>
              <div className="col-6 mb-2">
                <label className="form-label mb-1">Income To (₹)</label>
                {amountInput(slabForm.incomeTo, (v) => setSlabField("incomeTo", v), "Empty = and above")}
                {fieldError(slabErrors, "incomeTo")}
              </div>
            </div>
            <div className="mb-2">
              <label className="form-label mb-1">Tax Rate (%)</label>
              <NumericFormat
                className="form-control"
                value={slabForm.taxRate}
                onValueChange={({ value }) => setSlabField("taxRate", value)}
                decimalScale={2}
                allowNegative={false}
                isAllowed={({ floatValue }) => floatValue === undefined || floatValue <= 100}
              />
              {fieldError(slabErrors, "taxRate")}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button type="submit" className="btn btn-primary btn-sm py-2 px-4 me-2">
              {slabForm.idTaxSlab ? "Update" : "Submit"}
            </button>
            <button type="button" className="btn btn-outline-secondary btn-sm py-2 px-4" onClick={() => setShowSlabModal(false)}>
              Cancel
            </button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
}

export default TaxConfiguration;
