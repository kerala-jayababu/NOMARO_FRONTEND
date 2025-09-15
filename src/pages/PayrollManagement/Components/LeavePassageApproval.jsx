import SalaryGenerationService from "../../../core/services/SalaryGenerationService";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import secureLocalStorage from "react-secure-storage";
function LeavePassageApproval({
  entityId,
  setEntityType,
  setRefresh,
  selectedRow,
}) {
 
  const [payslipData, setPayslipData] = useState(null);
  const [leavePassageAmount, setLeavePassageAmount] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const { idPayrollScreen } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  
  // Get logged-in employee ID
  const userData = JSON.parse(secureLocalStorage.getItem("user"));
  const loggedInEmployeeId = userData?.idEmployee;
  console.log(selectedRow,loggedInEmployeeId)
  useEffect(() => {
    async function fetchPayslip() {
      try {
        const leaveRes = await SalaryGenerationService.getLeavePassageById(
          entityId
        );
        if (leaveRes.error) {
          toast.error(leaveRes.error);
          setPayslipData(null);
          setLoading(false);
          return;
        }

        const leavePassageDetails = leaveRes.data;

        if (!leavePassageDetails || !leavePassageDetails.data.idEmployee) {
          toast.error("No associated employee found for this Leave Passage");
          setPayslipData(null);
          setLoading(false);
          return;
        }       
        if (leavePassageDetails.data) {
  setLeavePassageAmount(leavePassageDetails.data.leavePassageAmountFromLeavePassageAmount || 0);
}

        const idEmployee = leavePassageDetails.data.idEmployee;

        const payslipRes =
          await SalaryGenerationService.getPayslipDetailsForLeavePassage(
            idEmployee
          );
        if (payslipRes.error) {
          toast.error(payslipRes.error);
          setPayslipData(null);
        } else {
          setPayslipData(payslipRes.data);
        }
      } catch (error) {
        toast.error("Error fetching leave passage / payslip data");
        setPayslipData(null);
      } finally {
        setLoading(false);
      }
    }

    if (entityId) {
      setLoading(true);
      fetchPayslip();
    }
  }, [entityId]);

  const formatNumber = (value) => {
    const amount = Number(value ?? 0);
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
  const incomeTaxDeduction = payslipData?.deductions?.find(
    (item) => item.description === "Income Tax (PAYE)"
  );
  const incomeTaxAmount = incomeTaxDeduction?.amountG ?? 0;

  const handleApproveWorkflow = async () => {
    const content = [
      {
        entityTablePrimaryKeyID: entityId,
        entityCode: "LEAVEPASS",
        status: "APPROVED",
        idPayrollScreen,
        leavePassageAmount,
      },
    ];

    try {
      const res = await SalaryGenerationService.handleApprovalWorkflow(content);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Leave Passage Approved Successfully");
        setEntityType("");
        setRefresh((prev) => !prev);
      }
    } catch (error) {
      toast.error("Error approving record");
    }
  };

  const handleRejectWorkflow = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }

    const content = [
      {
        entityTablePrimaryKeyID: entityId,
        entityCode: "LEAVEPASS",
        status: "REJECTED",
        idPayrollScreen,
        rejectReason,
      },
    ];

    try {
      const res = await SalaryGenerationService.handleApprovalWorkflow(content);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Rejected Successfully");
        setRejectReason("");
        setShowRejectModal(false);
        setEntityType("");
        setRefresh((prev) => !prev);
      }
    } catch (error) {
      toast.error("Error rejecting");
    }
  };

  return (
    <div
      className="modal d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              Leave Passage Approval
              {selectedRow.currentStatus?.toLowerCase() === "approved"
                ? " (Already Approved)"
                : ""}
              {selectedRow.currentStatus?.toLowerCase() === "rejected"
                ? " (Rejected)"
                : ""}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={() => setEntityType("")}
            ></button>
          </div>
          <div className="modal-body">
            {loading ? (
              <p>Loading payslip data...</p>
            ) : payslipData === null ? (
              <p>No latest payslip details available.</p>
            ) : (
              <div>
                <div className="row">
                  <div className="col-md-6">
                    <div>
                      <strong>Employee Code:</strong> {payslipData.employeeCode}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div>
                      <strong>Employee Name:</strong> {payslipData.employeeName}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div>
                      <strong>Designation:</strong> {payslipData.position}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div>
                      <strong>Department:</strong> {payslipData.department}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    maxHeight: "300px",
                    overflowY: "auto",
                    border: "1px solid #dee2e6",
                    marginTop:'2%',
                    borderRadius: "4px",
                    padding: "4px",
                  }}
                >
                  <table className="table table-bordered mt-2">
                    <thead>
                      <tr>
                        <th
                          colSpan="5"
                          className="bg-secondary text-white text-center"
                        >
                          Earnings
                        </th>
                      </tr>
                      <tr>
                        <th>Description</th>
                        <th>Amount (G$)</th>
                        <th>Amount (US$)</th>
                        <th>YTD Amount (G$)</th>
                        <th>YTD Amount (US$)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payslipData.earnings?.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.description}</td>
                          <td  className="text-end">{formatNumber(item.amountG)}</td>
                          <td  className="text-end">{formatNumber(item.amountUS)}</td>
                          <td  className="text-end">{formatNumber(item.ytdAmountG)}</td>
                          <td  className="text-end">{formatNumber(item.ytdAmountUSD)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <table className="table table-bordered mt-2">
                    <thead>
                      <tr>
                        <th
                          colSpan="5"
                          className="bg-secondary text-white text-center"
                        >
                          Deductions
                        </th>
                      </tr>
                      <tr>
                        <th>Description</th>
                        <th>Amount (G$)</th>
                        <th>Amount (US$)</th>
                        <th>YTD Amount (G$)</th>
                        <th>YTD Amount (US$)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payslipData.deductions?.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.description}</td>
                          <td  className="text-end">{formatNumber(item.amountG)}</td>
                          <td  className="text-end">{formatNumber(item.amountUS)}</td>
                          <td  className="text-end">{formatNumber(item.ytdAmountG)}</td>
                          <td  className="text-end">{formatNumber(item.ytdAmountUSD)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="d-flex align-items-center justify-content-between mt-3">
                  <div className="fw-bold" style={{ fontSize: "1.1rem" }}>
                    Net Pay G$:
                    <span className="ms-2">{formatNumber(
                      payslipData.earnings?.reduce(
                        (acc, e) => acc + (e.amountG ?? 0),
                        0
                      ) -
                        payslipData.deductions?.reduce(
                          (acc, d) => acc + (d.amountG ?? 0),
                          0
                        )
                    )}</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <label className="mb-0 me-2">Leave Passage Amount G$:</label>
                    <div className="input-group" style={{ minWidth: "260px" }}>
                      <input
                        type="text"
                        className="form-control text-end"
                        readOnly
                        value={formatNumber(leavePassageAmount)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          { 
            loggedInEmployeeId && 
            selectedRow.targetIdEmployee && 
            selectedRow.targetIdEmployee.split(',').map(id => parseInt(id.trim())).includes(loggedInEmployeeId) && 
            selectedRow.actionStatus === null && 
            selectedRow.currentStatus?.toLowerCase() !== "approved" && (
            <div className="modal-footer">
              <button
                className="btn btn-primary"
                onClick={handleApproveWorkflow}              
              >
                Approve
              </button>
              <button
                className="btn btn-danger"
                onClick={() => setShowRejectModal(true)}
              >
                Reject
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reject Reason</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowRejectModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <textarea
                  className="form-control"
                  rows="3"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleRejectWorkflow}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowRejectModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeavePassageApproval;
