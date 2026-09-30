// Salary structure rules shared by Salary Heads, Salary Templates and Employee Salary Config.
// The calculation mirrors the API (Helpers/SalaryStructureCalculator.cs) and the salary procedure;
// the API recalculates and re-checks everything when a template or structure is saved.

export const HEAD_TYPES = [
  { value: "EARNINGS", label: "Earning", short: "E", color: "#5d8b1b" },
  { value: "DEDUCTION", label: "Deduction", short: "D", color: "#701c21" },
  { value: "EMPLOYER_CONTRIBUTION", label: "Employer Contribution", short: "ER", color: "#1f497d" },
  { value: "REIMBURSEMENT", label: "Reimbursement", short: "R", color: "#8a6d1f" },
];

export const CALCULATION_METHODS = [
  { value: "FIXEDAMOUNT", label: "Fixed Amount" },
  { value: "PERCENTAGE", label: "Percentage" },
  { value: "FORMULA", label: "Formula" },
  { value: "STATUTORY", label: "Statutory" },
  { value: "MANUAL", label: "Manual" },
];

// Employee items are deductions, employer items are employer contributions
export const STATUTORY_TYPES = [
  { value: "PF_EE", label: "PF Employee", headType: "DEDUCTION" },
  { value: "VPF", label: "VPF", headType: "DEDUCTION" },
  { value: "PF_ER_EPF", label: "PF Employer EPF", headType: "EMPLOYER_CONTRIBUTION" },
  { value: "PF_ER_EPS", label: "PF Employer EPS", headType: "EMPLOYER_CONTRIBUTION" },
  { value: "EDLI", label: "EDLI", headType: "EMPLOYER_CONTRIBUTION" },
  { value: "PF_ADMIN", label: "PF Admin", headType: "EMPLOYER_CONTRIBUTION" },
  { value: "ESI_EE", label: "ESI Employee", headType: "DEDUCTION" },
  { value: "ESI_ER", label: "ESI Employer", headType: "EMPLOYER_CONTRIBUTION" },
  { value: "PT", label: "PT", headType: "DEDUCTION" },
  { value: "LWF_EE", label: "LWF Employee", headType: "DEDUCTION" },
  { value: "LWF_ER", label: "LWF Employer", headType: "EMPLOYER_CONTRIBUTION" },
  { value: "TDS", label: "TDS", headType: "DEDUCTION" },
];

export const PAY_FREQUENCIES = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "HALF_YEARLY", label: "Half-yearly" },
  { value: "ANNUAL", label: "Annual" },
  { value: "ONE_TIME", label: "One-time" },
];

export const ROUNDING_RULES = [
  { value: "NEAREST", label: "Nearest rupee" },
  { value: "UP", label: "Round up" },
  { value: "DOWN", label: "Round down" },
  { value: "NONE", label: "No rounding" },
];

export const REVISION_REASONS = [
  { value: "JOINING", label: "Joining" },
  { value: "INCREMENT", label: "Increment" },
  { value: "PROMOTION", label: "Promotion" },
  { value: "CORRECTION", label: "Correction" },
];

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const findLabel = (list, value, fallback = "–") =>
  list.find((x) => x.value === value)?.label || (value ? value : fallback);

/** Older data used "EARNING"; the API uses "EARNINGS". */
export const normalizeHeadType = (headType) => {
  const value = (headType || "").toUpperCase();
  return value === "EARNING" ? "EARNINGS" : value;
};

export const headTypeLabel = (headType) => findLabel(HEAD_TYPES, normalizeHeadType(headType));
export const headTypeInfo = (headType) => HEAD_TYPES.find((t) => t.value === normalizeHeadType(headType));
export const methodLabel = (method) => findLabel(CALCULATION_METHODS, (method || "").toUpperCase());
export const statutoryTypeLabel = (type) => findLabel(STATUTORY_TYPES, (type || "").toUpperCase());

export const HEAD_TYPE_ORDER = { EARNINGS: 0, REIMBURSEMENT: 1, DEDUCTION: 2, EMPLOYER_CONTRIBUTION: 3 };
const METHOD_ORDER = { FIXEDAMOUNT: 0, PERCENTAGE: 1, FORMULA: 2 };
const big = Number.MAX_SAFE_INTEGER;

// ---------- Formula ----------

export const HEAD_CODE_PATTERN = /^[A-Z0-9_]+$/;
const ALLOWED_FORMULA = /^(\[[A-Z0-9_]+\]|\d+(\.\d+)?|[+\-*/() ])+$/;

export const isAllowedFormula = (formula) => ALLOWED_FORMULA.test((formula || "").trim());

export const formulaCodes = (formula) =>
  [...new Set([...(formula || "").matchAll(/\[([A-Z0-9_]+)\]/g)].map((m) => m[1]))];

/** Evaluates + - * / and brackets (same rules as the API's FormulaEvaluator; division by 0 gives 0). */
export const evaluateExpression = (expression) => {
  const tokens = expression.match(/\d+(\.\d+)?|[+\-*/()]/g) || [];
  let p = 0;
  const parseExpression = () => {
    let value = parseTerm();
    while (p < tokens.length && (tokens[p] === "+" || tokens[p] === "-")) {
      const op = tokens[p++];
      const right = parseTerm();
      value = op === "+" ? value + right : value - right;
    }
    return value;
  };
  const parseTerm = () => {
    let value = parseFactor();
    while (p < tokens.length && (tokens[p] === "*" || tokens[p] === "/")) {
      const op = tokens[p++];
      const right = parseFactor();
      value = op === "*" ? value * right : right === 0 ? 0 : value / right;
    }
    return value;
  };
  const parseFactor = () => {
    if (p >= tokens.length) throw new Error("Invalid formula");
    const token = tokens[p++];
    if (token === "-") return -parseFactor();
    if (token === "(") {
      const value = parseExpression();
      if (p >= tokens.length || tokens[p++] !== ")") throw new Error("Invalid formula");
      return value;
    }
    return parseFloat(token);
  };
  const result = parseExpression();
  if (p !== tokens.length) throw new Error("Invalid formula");
  return result;
};

// ---------- Heads ----------

/** Heads that can be picked on the template / employee salary config grid. */
export const isGridHead = (head) => {
  const method = (head?.calculationMethod || "").toUpperCase();
  return !!head && head.isActive && method !== "STATUTORY" && method !== "MANUAL" && !head.isArrearHead;
};

/** A head paid only in certain months, or not monthly, is left out of the monthly totals. */
export const isMonthlyHead = (head) =>
  !(head?.disbursingMonths || "").trim() &&
  (!(head?.payFrequency || "").trim() || head.payFrequency.toUpperCase() === "MONTHLY");

export const paidInNote = (head) => {
  if (isMonthlyHead(head)) return null;
  const months = (head.disbursingMonths || "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean)
    .map((m) => m.charAt(0).toUpperCase() + m.slice(1, 3).toLowerCase());
  if (months.length) return `Paid in ${months.join(", ")}`;
  return `Paid ${findLabel(PAY_FREQUENCIES, (head.payFrequency || "").toUpperCase()).toLowerCase()}`;
};

const round = (value, rule) => {
  switch ((rule || "NEAREST").toUpperCase()) {
    case "UP":
      return Math.ceil(value - 1e-9);
    case "DOWN":
      return Math.floor(value + 1e-9);
    case "NONE":
      return Math.round((value + Number.EPSILON) * 100) / 100;
    default:
      return Math.sign(value) * Math.round(Math.abs(value));
  }
};

const toNumber = (value) => (value === "" || value === null || value === undefined ? null : Number(value));

// ---------- Grid rows ----------

let rowSeed = 0;
/** A grid row: the head plus the only two inputs a user can change. */
export const newStructureRow = (values = {}) => ({
  key: `row-${Date.now()}-${rowSeed++}`,
  idDetail: null,
  idSalaryHead: null,
  fixedAmount: null,
  percentageValue: null,
  ...values,
});

/** Row for a newly picked head, pre-filled from the head's Default Value / percentage. */
export const rowForHead = (row, head) => {
  const method = (head.calculationMethod || "").toUpperCase();
  return {
    ...row,
    idSalaryHead: head.idSalaryHead,
    fixedAmount: method === "FIXEDAMOUNT" ? head.fixedValue ?? 0 : null,
    percentageValue: method === "PERCENTAGE" ? head.percentageValue ?? null : null,
  };
};

/** Display order: Type, then Calculation Sequence. Rows without a head stay at the bottom. */
export const sortStructureRows = (rows, headsById) =>
  [...rows].sort((a, b) => {
    const ha = headsById[a.idSalaryHead];
    const hb = headsById[b.idSalaryHead];
    if (!ha || !hb) return (ha ? 0 : 1) - (hb ? 0 : 1);
    return (
      (HEAD_TYPE_ORDER[normalizeHeadType(ha.headType)] ?? 9) - (HEAD_TYPE_ORDER[normalizeHeadType(hb.headType)] ?? 9) ||
      (ha.calcSequence ?? big) - (hb.calcSequence ?? big)
    );
  });

/**
 * Calculates every row and the totals line.
 * Returns { values: { [row.key]: { calculatedValue, paidInNote, isIncluded } }, rowErrors: { [row.key]: message }, totals }
 */
export const calculateStructure = (rows, headsById) => {
  const values = {};
  const rowErrors = {};
  const valuesById = {};
  const valuesByCode = {};
  const rowIdsInGrid = new Set(rows.filter((r) => r.idSalaryHead).map((r) => r.idSalaryHead));

  const ordered = rows
    .filter((r) => headsById[r.idSalaryHead])
    .map((row) => ({ row, head: headsById[row.idSalaryHead] }))
    .sort(
      (a, b) =>
        (a.head.calcSequence ?? big) - (b.head.calcSequence ?? big) ||
        (METHOD_ORDER[(a.head.calculationMethod || "").toUpperCase()] ?? 3) -
          (METHOD_ORDER[(b.head.calculationMethod || "").toUpperCase()] ?? 3) ||
        (a.head.orderNumber ?? big) - (b.head.orderNumber ?? big)
    );

  ordered.forEach(({ row, head }) => {
    const method = (head.calculationMethod || "").toUpperCase();
    let value = 0;

    if (method === "FIXEDAMOUNT") {
      const amount = toNumber(row.fixedAmount) ?? toNumber(head.fixedValue) ?? 0;
      if (amount < 0) rowErrors[row.key] = "Enter an amount of 0 or more.";
      value = amount;
    } else if (method === "PERCENTAGE") {
      const percentage = toNumber(row.percentageValue) ?? toNumber(head.percentageValue);
      if (percentage === null || percentage < 0.01 || percentage > 100) {
        rowErrors[row.key] = "Enter a percentage between 0.01 and 100.";
      }
      if (head.idPercentageSalaryHead && !rowIdsInGrid.has(head.idPercentageSalaryHead)) {
        const baseName = headsById[head.idPercentageSalaryHead]?.salaryHeadName || "the base head";
        rowErrors[row.key] = `Add "${baseName}" first: ${head.salaryHeadName} is a percentage of it.`;
      }
      let base = valuesById[head.idPercentageSalaryHead] ?? 0;
      const ceiling = toNumber(head.wageCeiling);
      if (ceiling !== null && base > ceiling) base = ceiling;
      value = (base * (percentage ?? 0)) / 100;
    } else if (method === "FORMULA") {
      const expression = (head.customFormula || "0").replace(/\[([A-Z0-9_]+)\]/g, (_, code) =>
        String(valuesByCode[code] ?? 0)
      );
      try {
        value = evaluateExpression(expression);
      } catch {
        rowErrors[row.key] = "The formula of this head is not valid. Correct it on the Salary Heads screen.";
        value = 0;
      }
    }

    const min = toNumber(head.minAmount);
    const max = toNumber(head.maxAmount);
    if (min !== null && value < min) value = min;
    if (max !== null && value > max) value = max;
    value = round(value, head.roundingRule);

    valuesById[head.idSalaryHead] = value;
    valuesByCode[head.salaryHeadCode] = value;
    values[row.key] = { calculatedValue: value, paidInNote: paidInNote(head), isIncluded: isMonthlyHead(head) };
  });

  const sum = (type) =>
    ordered
      .filter(({ row, head }) => values[row.key]?.isIncluded && normalizeHeadType(head.headType) === type)
      .reduce((total, { row }) => total + values[row.key].calculatedValue, 0);

  const earningsOnly = sum("EARNINGS");
  const reimbursements = sum("REIMBURSEMENT");
  const totalEarnings = earningsOnly + reimbursements;
  const totalDeductions = sum("DEDUCTION");
  const totalEmployerContribution = sum("EMPLOYER_CONTRIBUTION");

  return {
    values,
    rowErrors,
    totals: {
      totalEarnings,
      totalDeductions,
      totalEmployerContribution,
      netSalary: totalEarnings - totalDeductions,
      grossMonthly: earningsOnly,
      ctcMonthly: totalEarnings + totalEmployerContribution,
    },
  };
};

/** Submit for Approval checks on the grid. Returns the first message, or null. */
export const validateStructureRows = (rows, headsById) => {
  const picked = rows.filter((r) => r.idSalaryHead);
  if (rows.some((r) => !r.idSalaryHead)) return "Select a salary head in every row, or remove the empty row.";

  const ids = picked.map((r) => r.idSalaryHead);
  if (new Set(ids).size !== ids.length) return "This salary head is already in the list.";

  if (!picked.some((r) => normalizeHeadType(headsById[r.idSalaryHead]?.headType) === "EARNINGS")) {
    return "Add at least one earning.";
  }

  for (const row of picked) {
    const head = headsById[row.idSalaryHead];
    const method = (head?.calculationMethod || "").toUpperCase();
    if (method === "FIXEDAMOUNT" && (toNumber(row.fixedAmount) ?? 0) < 0) return "Enter an amount of 0 or more.";
    if (method === "PERCENTAGE") {
      const percentage = toNumber(row.percentageValue) ?? toNumber(head.percentageValue);
      if (percentage === null || percentage < 0.01 || percentage > 100) return "Enter a percentage between 0.01 and 100.";
      if (head.idPercentageSalaryHead && !ids.includes(head.idPercentageSalaryHead)) {
        const baseName = headsById[head.idPercentageSalaryHead]?.salaryHeadName || "the base head";
        return `Add "${baseName}" first: ${head.salaryHeadName} is a percentage of it.`;
      }
    }
  }
  return null;
};

/** Values saved per row: amount only for Fixed Amount heads, % only for Percentage heads, otherwise null. */
export const rowInputsForSave = (row, head) => {
  const method = (head?.calculationMethod || "").toUpperCase();
  return {
    fixedAmount: method === "FIXEDAMOUNT" ? toNumber(row.fixedAmount) ?? toNumber(head.fixedValue) ?? 0 : null,
    percentageValue: method === "PERCENTAGE" ? toNumber(row.percentageValue) ?? toNumber(head.percentageValue) : null,
  };
};

export const toHeadsById = (heads) =>
  (heads || []).reduce((map, head) => {
    map[head.idSalaryHead] = head;
    return map;
  }, {});
