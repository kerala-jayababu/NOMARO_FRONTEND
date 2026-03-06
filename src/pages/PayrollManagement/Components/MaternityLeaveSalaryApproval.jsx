import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import SalaryGenerationService from "../../../core/services/SalaryGenerationService";
import secureLocalStorage from "react-secure-storage";

// ✅ create this redux action (step 2 below)
import { getMaternityLeaveSalaryById } from "../../../redux/reducers/ConfigApprovals";

function MaternityLeaveSalaryApproval({ entityId, setEntityType, setRefresh, selectedRow }) {
  const dispatch = useDispatch();
  const { maternityLeaveSalary } = useSelector((state) => state.configApproval);
  const { idPayrollScreen } = useSelector((state) => state.auth);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const userData = JSON.parse(secureLocalStorage.getItem("user"));
  const loggedInEmployeeId = userData?.idEmployee;

 useEffect(() => {
  dispatch(getMaternityLeaveSalaryById(entityId));
}, [entityId]);

  const handleApproveWorkflow = async () => {
    const content = [
      {
        entityTablePrimaryKeyID: entityId,
        entityCode: "MATERNITYSAL", // ✅ must match your workflow entityCode
        status: "APPROVED",
        idPayrollScreen,
      },
    ];

    try {
      const res = await SalaryGenerationService.handleApprovalWorkflow(content);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Approved Successfully");
        setEntityType("");
        setRefresh((prev) => !prev);
      }
    } catch (error) {
      toast.error("Error approving record");
    }
  };
  const downloadFile = (item) => {
  if (!item?.attachmentBlob) return;

  const base64Data = item.attachmentBlob;
  const fileName = item.documentFilePath || "MaternityLeave.pdf";

  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);

  // ✅ Set correct mime type for PDF
  const blob = new Blob([byteArray], { type: "application/pdf" });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.setAttribute("download", fileName);

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};


  const handleRejectWorkflow = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }

    const content = [
      {
        entityTablePrimaryKeyID: entityId,
        entityCode: "MATERNITYSAL", 
        status: "REJECTED",
        idPayrollScreen,
        rejectReason,
      },
    ];

    try {
      const res = await SalaryGenerationService.handleApprovalWorkflow(content);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Rejected Successfully");
        setRejectReason("");
        setShowRejectModal(false);
        setEntityType("");
        setRefresh((prev) => !prev);
      }
    } catch (error) {
      toast.error("Error rejecting record");
    }
  };

  const canTakeAction =
    loggedInEmployeeId &&
    selectedRow?.targetIdEmployee &&
    selectedRow.targetIdEmployee
      .split(",")
      .map((id) => parseInt(id.trim()))
      .includes(loggedInEmployeeId) &&
    selectedRow?.actionStatus === null &&
    selectedRow?.currentStatus?.toLowerCase() !== "approved" &&
    selectedRow?.currentStatus?.toLowerCase() !== "rejected";

  return (
    <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              Maternity Leave Salary Approval{" "}
              {selectedRow?.currentStatus?.toLowerCase() === "approved" ? " (Already Approved)" : ""}
              {selectedRow?.currentStatus?.toLowerCase() === "rejected" ? " (Rejected)" : ""}
            </h5>
            <button type="button" className="btn-close" onClick={() => setEntityType("")}></button>
          </div>

          <div className="modal-body">
            {/* Employee info */}
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Employee Code</th>
                  <th>Employee Name</th>
                  <th>Salary Month From</th>
                  <th>Salary Month To</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{maternityLeaveSalary?.employeeCode}</td>
                  <td>{maternityLeaveSalary?.employeeName}</td>
                  <td>{maternityLeaveSalary?.fromSalaryMonthText}</td>
                  <td>{maternityLeaveSalary?.toSalaryMonthText}</td>
                </tr>
              </tbody>
            </table>

            {/* Leave dates */}
            <table className="table table-bordered mt-3">
              <thead>
                <tr>
                  <th>Maternity Leave From</th>
                  <th>Maternity Leave To</th>
                  <th>Document</th>
                  <th>Approval Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    {maternityLeaveSalary?.maternityLeaveFrom
                      ? new Date(maternityLeaveSalary.maternityLeaveFrom).toLocaleDateString("en-US")
                      : ""}
                  </td>
                  <td>
                    {maternityLeaveSalary?.maternityLeaveTo
                      ? new Date(maternityLeaveSalary.maternityLeaveTo).toLocaleDateString("en-US")
                      : ""}
                                    </td>
                                    <td className="text-center">
                    {maternityLeaveSalary?.attachmentBlob ? (
                        <i
                        className="bx bx-paperclip cursor"
                        style={{ fontSize: "18px" }}
                        onClick={() => downloadFile(maternityLeaveSalary)}
                        ></i>
                    ) : (
                        "N/A"
                    )}
                    </td>
                  <td>{maternityLeaveSalary?.approvalStatus ?? "-"}</td>
                </tr>
              </tbody>
            </table>

            {/* Details */}
            <table className="table table-bordered mt-3">
              <thead>
                <tr>
                  <th>Salary Head</th>
                  <th>Type</th>
                  <th className="text-end">Amount</th>
                  <th className="text-end">Amount (USD)</th>
                </tr>
              </thead>
              <tbody>
                {maternityLeaveSalary?.maternityLeaveSalaryDetailDto?.map((d, idx) => (
                  <tr key={idx}>
                    <td>{d.salaryHeadName}</td>
                    <td>{d.salaryHeadType}</td>
                    <td className="text-end">{Number(d.amount ?? 0).toFixed(2)}</td>
                    <td className="text-end">{Number(d.amountInUSD ?? 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <table className="table table-bordered mt-3">
              <thead>
                <tr>
                  <th>Total Earnings</th>
                  <th>Total Deductions</th>
                  <th>Maternity Leave Net Salary</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-center">{Number(maternityLeaveSalary?.totalEarnings ?? 0).toFixed(2)}</td>
                  <td className="text-center">{Number(maternityLeaveSalary?.totalDeductions ?? 0).toFixed(2)}</td>
                  <td className="text-center">
                    {Number(maternityLeaveSalary?.maternityLeaveNetSalary ?? 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {canTakeAction && (
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleApproveWorkflow}>
                Approve
              </button>
              <button className="btn btn-danger" onClick={() => setShowRejectModal(true)}>
                Reject
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reject modal */}
      {showRejectModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reject Records</h5>
                <button type="button" className="btn-close" onClick={() => setShowRejectModal(false)}></button>
              </div>
              <div className="modal-body">
                <label className="form-label">Rejection Reason</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-danger" onClick={handleRejectWorkflow}>
                  Reject
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowRejectModal(false)}>
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

export default MaternityLeaveSalaryApproval;
