import React, { useState, useEffect } from "react";
import Select from "react-select";
import { toast } from "react-toastify";
import { Modal } from "react-bootstrap";
import CommonService from "../../core/services/CommonService";
import EmployeeSalaryConfigService from "../../core/services/EmployeeSalaryConfigService";
import { useLoader } from "../../components/LoaderContext";
import moment from "moment";

const formatAmount = (val) =>
  Number(val || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getInitials = (name) => {
  if (!name) return "";
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const UnapprovalSalaryConfig = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [configData, setConfigData] = useState(null);       // res.data.data.config
  const [workflowSteps, setWorkflowSteps] = useState([]);   // res.data.data.approvalWorkflowSteps
  const [showConfirm, setShowConfirm] = useState(false);
  const { showLoader, hideLoader } = useLoader();

  useEffect(() => {
    CommonService.getEmployeeList().then((res) => {
      if (res?.data?.data) {
        const options = res.data.data.map((emp) => ({
          value: emp.idEmployee,
          label: `${emp.employeeCode} — ${emp.fullName}`,
          fullName: emp.fullName,
        }));
        setEmployees(options);
      }
    });
  }, []);

  const handleLoadConfig = async () => {
    if (!selectedEmployee) {
      toast.error("Please select an employee", { position: "top-right" });
      return;
    }
    showLoader();
    const res = await EmployeeSalaryConfigService.getLatestApprovedSalaryConfig(
      selectedEmployee.value
    );
    hideLoader();
    const responseData = res?.data?.data;
    if (responseData?.config) {
      setConfigData(responseData.config);
      setWorkflowSteps(responseData.approvalWorkflowSteps || []);
    } else {
      toast.error("No approved salary configuration found for this employee.", { position: "top-right" });
      setConfigData(null);
      setWorkflowSteps([]);
    }
  };

  const handleReset = () => {
    setSelectedEmployee(null);
    setConfigData(null);
    setWorkflowSteps([]);
  };

  const handleUnapprove = async () => {
    showLoader();
    const res = await EmployeeSalaryConfigService.unApproveEmployeeSalaryConfig({
      idEmployeeSalaryConfig: configData.idEmployeeSalaryConfig,
    });
    hideLoader();
    setShowConfirm(false);
    if (!res?.error) {
      toast.success("Salary configuration unapproved successfully", { position: "top-right" });
      handleReset();
    }
  };

  const allDetails = configData?.employeeSalaryConfigDetails || [];
  const earnings = allDetails.filter((d) => d.headType === "EARNING");
  const deductions = allDetails.filter((d) => d.headType === "DEDUCTION");

  const employeeName = configData?.employeeName || selectedEmployee?.fullName || "";
  const initials = getInitials(employeeName);

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Confirmation Modal */}
      <Modal
        show={showConfirm}
        onHide={() => setShowConfirm(false)}
        centered
        size="sm"
        backdrop="static"
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title style={{ fontSize: 16 }}>Confirm Unapproval</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to unapprove this salary configuration?
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowConfirm(false)}
          >
            Cancel
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleUnapprove}>
            Unapprove
          </button>
        </Modal.Footer>
      </Modal>

      <h4 className="fw-bold mb-4">Unapprove Salary Configuration</h4>

      {/* Employee Selector */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-end g-3">
            <div className="col-md-5">
              <label className="form-label fw-semibold">Employee</label>
              <Select
                options={employees}
                value={selectedEmployee}
                onChange={(opt) => {
                  setSelectedEmployee(opt);
                  setConfigData(null);
                }}
                placeholder="Select employee..."
                isClearable
              />
            </div>
            <div className="col-auto">
              <button className="btn btn-primary" onClick={handleLoadConfig}>
                Load configuration
              </button>
            </div>
          </div>
        </div>
      </div>

      {configData && (
        <>
          {/* Employee Summary Card */}
          <div
            className="card mb-4"
            style={{ backgroundColor: "#0f3c54", color: "#fff" }}
          >
            <div className="card-body d-flex align-items-center gap-3">
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                {initials || "??"}
              </div>
              <div className="flex-grow-1">
                <div className="fw-bold" style={{ fontSize: 15 }}>
                  {employeeName}
                  {configData.employeeCode && (
                    <span
                      className="ms-2 fw-normal"
                      style={{ fontSize: 13, opacity: 0.75 }}
                    >
                      {configData.employeeCode}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, opacity: 0.85 }}>
                  {[
                    configData.designationName,
                    configData.departmentName,
                    configData.joiningDate
                      ? `Joined ${moment(configData.joiningDate).format("DD-MM-YYYY")}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
              <span className="badge bg-success">Approved</span>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="row g-3 mb-4">
            {[
              {
                label: "Valid from",
                value: configData.validFrom
                  ? moment(configData.validFrom).format("DD-MM-YYYY")
                  : "--",
              },
              {
                label: "Total earnings",
                value: formatAmount(configData.totalEarnings),
              },
              {
                label: "Total deductions",
                value: formatAmount(configData.totalDeductions),
              },
              
            ].map(({ label, value }) => (
              <div className="col-md-4 col-sm-6" key={label}>
                <div className="card border h-100">
                  <div className="card-body py-3">
                    <div style={{ fontSize: 12, color: "#888" }}>{label}</div>
                    <div className="fw-bold mt-1">{value}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Earnings | Deductions | Timeline */}
          <div className="row g-4 mb-4">
            {/* Earnings */}
            <div className="col-md-4">
              <div className="card h-100">
                <div className="card-body">
                  <h6 className="fw-bold mb-3">Earnings</h6>
                  <table className="table table-sm table-borderless mb-0">
                    <thead>
                      <tr
                        style={{
                          fontSize: 12,
                          color: "#888",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        <th className="ps-0 pb-2">Component</th>
                        <th className="text-end pe-0 pb-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {earnings.length === 0 ? (
                        <tr>
                          <td
                            colSpan={2}
                            className="text-muted text-center ps-0 pt-3"
                          >
                            No earnings
                          </td>
                        </tr>
                      ) : (
                        earnings.map((item, i) => (
                          <tr key={i}>
                            <td className="ps-0">{item.salaryHeadName}</td>
                            <td className="text-end pe-0 fw-semibold">
                              {formatAmount(item.salaryAmount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="col-md-4">
              <div className="card h-100">
                <div className="card-body">
                  <h6 className="fw-bold mb-3">Deductions</h6>
                  <table className="table table-sm table-borderless mb-0">
                    <thead>
                      <tr
                        style={{
                          fontSize: 12,
                          color: "#888",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        <th className="ps-0 pb-2">Component</th>
                        <th className="text-end pe-0 pb-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deductions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={2}
                            className="text-muted text-center ps-0 pt-3"
                          >
                            No deductions
                          </td>
                        </tr>
                      ) : (
                        deductions.map((item, i) => (
                          <tr key={i}>
                            <td className="ps-0">{item.salaryHeadName}</td>
                            <td className="text-end pe-0 fw-semibold">
                              {formatAmount(item.salaryAmount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Workflow Timeline */}
            {workflowSteps.length > 0 && (
              <div className="col-md-4">
                <div className="card h-100">
                  <div className="card-body">
                    <div className="d-flex flex-column">
                      {workflowSteps.map((step, i) => {
                        const isApproved = step.eventKind === "APPROVED";
                        const dotColor = isApproved ? "#43a047" : "#1e88e5";
                        const label = step.displayLabel === "APPROVED"
                          ? "Approved"
                          : step.displayLabel;
                        return (
                          <div key={i} className="d-flex gap-3">
                            <div
                              className="d-flex flex-column align-items-center"
                              style={{ minWidth: 14 }}
                            >
                              <div
                                style={{
                                  width: 14,
                                  height: 14,
                                  borderRadius: "50%",
                                  backgroundColor: dotColor,
                                  flexShrink: 0,
                                  marginTop: 3,
                                }}
                              />
                              {i < workflowSteps.length - 1 && (
                                <div
                                  style={{
                                    width: 2,
                                    flex: 1,
                                    backgroundColor: "#e0e0e0",
                                    marginTop: 4,
                                    minHeight: 24,
                                  }}
                                />
                              )}
                            </div>
                            <div className="pb-4">
                              <div className="fw-semibold" style={{ fontSize: 14 }}>
                                {label}
                              </div>
                              {step.actorName && (
                                <div style={{ fontSize: 12, color: "#555" }}>
                                  By {step.actorName}
                                </div>
                              )}
                              {step.actorDesignationName && (
                                <div style={{ fontSize: 12, color: "#777" }}>
                                  {step.actorDesignationName}
                                </div>
                              )}
                              {step.eventDate && (
                                <div style={{ fontSize: 12, color: "#999" }}>
                                  {moment(step.eventDate).format("MMM DD, YYYY")}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="d-flex justify-content-end align-items-center pb-4">
            <button
              className="btn btn-outline-secondary me-3"
              onClick={handleReset}
            >
              Reset
            </button>
            <button
              className="btn btn-dark d-flex align-items-center gap-2"
              onClick={() => setShowConfirm(true)}
            >
              <i className="bx bx-x-circle" />
              Unapprove configuration
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UnapprovalSalaryConfig;
