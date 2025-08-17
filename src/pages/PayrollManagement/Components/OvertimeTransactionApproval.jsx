import { useDispatch, useSelector } from "react-redux";
import { getOvertimeTransactionById } from "../../../redux/reducers/ConfigApprovals";
import { useEffect, useState } from "react";
import SalaryGenerationService from "../../../core/services/SalaryGenerationService";
import toast from "react-hot-toast";
import secureLocalStorage from "react-secure-storage";

function OvertimeTransactionApproval({
  entityId,
  setEntityType,
  setRefresh,
  selectedRow,
}) {
  const { overtimeTransaction } = useSelector((state) => state.configApproval);
  const { idPayrollScreen } = useSelector((state) => state.auth);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const dispatch = useDispatch();
  
  // Get logged-in employee ID
  const userData = JSON.parse(secureLocalStorage.getItem("user"));
  const loggedInEmployeeId = userData?.idEmployee;

  useEffect(() => {
    dispatch(getOvertimeTransactionById(entityId));
  }, []);

  const handleApproveWorkflow = async () => {
    const content = [
      {
        entityTablePrimaryKeyID: entityId,
        entityCode: "OVERTIME",
        status: "APPROVED",
        idPayrollScreen,
      },
    ];

    try {
      const res = await SalaryGenerationService.handleApprovalWorkflow(content);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Approved Successfully");
        setEntityType("");
        setRefresh((prev) => !prev);
      }
    } catch (error) {
      toast.error("Error approving records");
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
        entityCode: "OVERTIME",
        status: "REJECTED",
        idPayrollScreen,
        rejectReason: rejectReason,
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

  const downloadFile = (item) => {
    const base64Data = item.attachmentBlob;
    const fileName = item.attachmentDescription || "downloaded-file";

    // Convert Base64 to Blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/octet-stream" });

    // Create a download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName); // Set the file name
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div
      className="modal d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              Overtime Transaction Approval
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
            <table className="table table-bordered mt-3">
              <thead className="bg-primary">
                <tr>
                  <th className="text-white">Created By</th>
                  <th className="text-white">Created Date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{overtimeTransaction?.createdBy}</td>
                  <td>
                    {new Date(overtimeTransaction?.createdOn).toLocaleString(
                      "en-US",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      }
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            <table className="table table-bordered mt-3">
              <thead>
                <tr>
                  <th>Employee Code</th>
                  <th>Employee Name</th>
                  <th>Designation & Department</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{overtimeTransaction.employeeCode}</td>
                  <td>{overtimeTransaction.employeeName}</td>
                  <td>
                    {overtimeTransaction.designation}/
                    {overtimeTransaction.department}
                  </td>
                </tr>
              </tbody>
            </table>

            <table className="table table-bordered mt-3">
              <thead>
                <tr>
                  <th>Day Type</th>
                  <th>Start Date & Time</th>
                  <th>End Date & Time</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{overtimeTransaction.dayType}</td>
                  <td>
                    {new Date(overtimeTransaction.startDate).toLocaleString(
                      "en-US",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      }
                    )}
                    , {overtimeTransaction?.startTime?.slice(0, 5)}
                  </td>
                  <td>
                    {new Date(overtimeTransaction.endDate).toLocaleString(
                      "en-US",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      }
                    )}
                    , {overtimeTransaction?.endTime?.slice(0, 5)}
                  </td>
                </tr>
              </tbody>
            </table>

            <table className="table table-bordered mt-3">
              <thead>
                <tr>
                <th style={{ width: "25%" }}>Duration</th>
      <th style={{ width: "25%" }}>Amount</th>
      <th style={{ width: "50%" }}>Details</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{overtimeTransaction.durationInHours}</td>
                  <td>{overtimeTransaction.otAmount}</td>
                  <td>{overtimeTransaction.reasonForOvertime}</td>
                </tr>
              </tbody>
            </table>

            {overtimeTransaction.attachmentBlob && (
              <table className="table table-bordered mt-3">
                <thead>
                  <tr>
                    <th>View Attachment</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <button className="btn btn-outline-primary border-0 btn-sm">
                        <i
                          className="bx bx-paperclip cursor"
                          onClick={() => downloadFile(overtimeTransaction)}
                        ></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {
  loggedInEmployeeId && 
  selectedRow.targetIdEmployee && 
  selectedRow.targetIdEmployee.split(',').map(id => parseInt(id.trim())).includes(loggedInEmployeeId) && 
  selectedRow.actionStatus === null && (
            <div className="modal-footer">
              <button
                className="btn btn-primary"
                onClick={() => handleApproveWorkflow()}
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
      {showRejectModal && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reject Records</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowRejectModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Rejection Reason</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter rejection reason..."
                  ></textarea>
                </div>
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

export default OvertimeTransactionApproval;
