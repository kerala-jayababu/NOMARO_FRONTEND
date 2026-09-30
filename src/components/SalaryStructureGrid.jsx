import React, { useMemo } from "react";
import { NumericFormat } from "react-number-format";
import Utils from "../utils/Utils";
import {
  HEAD_TYPES,
  headTypeInfo,
  isGridHead,
  methodLabel,
  newStructureRow,
  normalizeHeadType,
  rowForHead,
  sortStructureRows,
} from "../utils/salaryStructure";

/**
 * Grid shared by the Salary Template and Employee Salary Config screens.
 * The calculation method, base head and formula always come from Salary Heads; a row only carries
 * the amount (Fixed Amount heads) or the percentage (Percentage heads).
 */
function SalaryStructureGrid({ rows, onRowsChange, salaryHeadList, headsById, calculation }) {
  const displayRows = useMemo(() => sortStructureRows(rows, headsById), [rows, headsById]);

  const updateRow = (key, changes) => {
    onRowsChange(rows.map((row) => (row.key === key ? { ...row, ...changes } : row)));
  };

  const handleHeadChange = (row, idSalaryHead) => {
    const head = headsById[idSalaryHead];
    if (!head) {
      updateRow(row.key, { idSalaryHead: null, fixedAmount: null, percentageValue: null });
      return;
    }
    onRowsChange(rows.map((r) => (r.key === row.key ? rowForHead(r, head) : r)));
  };

  const addRow = () => onRowsChange([...rows, newStructureRow()]);

  const removeRow = (key) => onRowsChange(rows.filter((row) => row.key !== key));

  // Heads that are active, not statutory, not Manual and not arrears; a head already in the grid isn't offered again
  const headOptionsFor = (row) => {
    const usedIds = rows.filter((r) => r.key !== row.key && r.idSalaryHead).map((r) => r.idSalaryHead);
    const available = salaryHeadList.filter(
      (head) => (isGridHead(head) && !usedIds.includes(head.idSalaryHead)) || head.idSalaryHead === row.idSalaryHead
    );
    return HEAD_TYPES.map((type) => ({
      ...type,
      heads: available
        .filter((head) => normalizeHeadType(head.headType) === type.value)
        .sort((a, b) => (a.calcSequence ?? 9999) - (b.calcSequence ?? 9999)),
    })).filter((group) => group.heads.length > 0);
  };

  const renderValueCell = (row, head) => {
    const method = (head?.calculationMethod || "").toUpperCase();
    if (!head) return "-";
    if (method === "FIXEDAMOUNT") {
      return (
        <NumericFormat
          className="form-control form-control-sm"
          value={row.fixedAmount ?? ""}
          onValueChange={({ value }) => updateRow(row.key, { fixedAmount: value === "" ? null : value })}
          decimalScale={2}
          allowNegative={false}
          thousandSeparator={true}
          allowLeadingZeros={false}
          placeholder="Amount"
          maxLength={15}
        />
      );
    }
    if (method === "PERCENTAGE") {
      return (
        <div className="input-group input-group-sm">
          <NumericFormat
            className="form-control form-control-sm"
            value={row.percentageValue ?? ""}
            onValueChange={({ value }) => updateRow(row.key, { percentageValue: value === "" ? null : value })}
            decimalScale={2}
            allowNegative={false}
            isAllowed={({ floatValue }) => floatValue === undefined || floatValue <= 100}
            placeholder="%"
          />
          <span className="input-group-text">%</span>
        </div>
      );
    }
    if (method === "FORMULA") {
      return <span className="text-muted small" title="Formula from Salary Heads">{head.customFormula}</span>;
    }
    return "-";
  };

  return (
    <div className="table-responsive">
      <table className="table table-sm">
        <thead>
          <tr>
            <th style={{ minWidth: "220px" }}>Salary Head</th>
            <th>Type</th>
            <th>Calculation Method</th>
            <th>Percentage Of</th>
            <th style={{ minWidth: "150px" }}>Value / Formula</th>
            <th className="text-end">Calculated Value</th>
            <th className="text-end"></th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, index) => {
            const head = headsById[row.idSalaryHead];
            const typeInfo = headTypeInfo(head?.headType);
            const result = calculation.values[row.key];
            const error = calculation.rowErrors[row.key];
            return (
              <tr key={row.key}>
                <td>
                  <select
                    className="form-select form-select-sm"
                    value={row.idSalaryHead || ""}
                    onChange={(e) => handleHeadChange(row, e.target.value ? parseInt(e.target.value, 10) : null)}
                  >
                    <option value="">Select Salary Head</option>
                    {headOptionsFor(row).map((group) => (
                      <optgroup key={group.value} label={group.label}>
                        {group.heads.map((h) => (
                          <option key={h.idSalaryHead} value={h.idSalaryHead}>
                            {h.salaryHeadName} ({h.salaryHeadCode})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {error && <div className="text-danger small mt-1">{error}</div>}
                </td>
                <td className="text-nowrap">{typeInfo ? typeInfo.label : "-"}</td>
                <td className="text-nowrap">{head ? methodLabel(head.calculationMethod) : "-"}</td>
                <td className="text-nowrap">
                  {head?.idPercentageSalaryHead ? headsById[head.idPercentageSalaryHead]?.salaryHeadName || "–" : "–"}
                </td>
                <td>{renderValueCell(row, head)}</td>
                <td className="text-end text-nowrap">
                  {head ? Utils.formattedNumber(result?.calculatedValue ?? 0) : ""}
                  {result?.paidInNote && <div className="text-muted small">{result.paidInNote}</div>}
                </td>
                <td className="text-end text-nowrap">
                  {rows.length > 1 && (
                    <button type="button" className="btn btn-outline-danger border-0 btn-sm" onClick={() => removeRow(row.key)}>
                      <i className="bx bx-trash"></i>
                    </button>
                  )}
                  {index === displayRows.length - 1 && (
                    <button type="button" className="btn btn-outline-primary border-0 btn-sm" onClick={addRow}>
                      <i className="bx bx-plus"></i>
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Totals line: Total Earnings · Total Deductions · Employer Contributions · Net Salary (before PF / ESI / PT / TDS). */
export function SalaryStructureTotals({ totals, showStatutoryNote = false }) {
  return (
    <div className="total_salarycard">
      <ul style={{ display: "flex", flexWrap: "wrap", gap: "20px", listStyleType: "none", padding: 0, margin: 0 }}>
        <li style={{ margin: 0 }}>
          <b>Total Earnings:</b> {Utils.formattedNumber(totals?.totalEarnings ?? 0)}
        </li>
        <li style={{ margin: 0 }}>
          <b>Total Deductions:</b> {Utils.formattedNumber(totals?.totalDeductions ?? 0)}
        </li>
        <li style={{ margin: 0 }}>
          <b>Employer Contributions:</b> {Utils.formattedNumber(totals?.totalEmployerContribution ?? 0)}
        </li>
        <li style={{ margin: 0 }}>
          <b>Net Salary (before PF / ESI / PT / TDS):</b> {Utils.formattedNumber(totals?.netSalary ?? 0)}
        </li>
      </ul>
      <div className="text-muted small mt-1">
        Earnings include reimbursements. Employer contributions are shown but not deducted. Heads paid only in certain
        months are left out of the totals.
        {showStatutoryNote && " PF, ESI, PT, LWF and TDS are added by the monthly salary run."}
      </div>
    </div>
  );
}

/** Read-only view of a saved template / structure (details modal). amountKey: finalSalaryAmount or salaryAmount. */
export function SalaryStructureView({ details, headsById, amountKey }) {
  const rows = sortStructureRows(
    (details || []).map((d, i) => ({ ...d, key: `view-${i}` })),
    headsById
  );
  const describe = (detail, head) => {
    const method = (head?.calculationMethod || detail.calculationMethod || "").toUpperCase();
    if (method === "PERCENTAGE") {
      const baseName = headsById[head?.idPercentageSalaryHead]?.salaryHeadName || detail.percentageOfIdSalaryHeadValue || "–";
      return `${detail.percentageValue ?? head?.percentageValue ?? ""}% of ${baseName}`;
    }
    if (method === "FORMULA") return `Formula: ${head?.customFormula || detail.customFormula || ""}`;
    return methodLabel(method);
  };
  return (
    <table className="table table-sm">
      <thead>
        <tr>
          <th>Salary Head Name</th>
          <th>Type</th>
          <th>Calculation Details</th>
          <th className="text-end">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        {rows.length > 0 ? (
          rows.map((detail) => {
            const head = headsById[detail.idSalaryHead];
            return (
              <tr key={detail.key}>
                <td>{head?.salaryHeadName || detail.salaryHeadName || "N/A"}</td>
                <td>{headTypeInfo(head?.headType || detail.headType)?.label || "N/A"}</td>
                <td>{describe(detail, head)}</td>
                <td className="text-end">
                  {Utils.formattedNumber(detail[amountKey])}
                  {detail.paidInNote && <div className="text-muted small">{detail.paidInNote}</div>}
                </td>
              </tr>
            );
          })
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
  );
}

export default SalaryStructureGrid;
