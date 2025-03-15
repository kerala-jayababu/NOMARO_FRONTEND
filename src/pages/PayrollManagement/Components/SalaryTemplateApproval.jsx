import { useDispatch, useSelector } from "react-redux";
import { getSalaryTemplateById } from "../../../redux/reducers/ConfigApprovals";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import SalaryGenerationService from "../../../core/services/SalaryGenerationService";

function SalaryTemplateApproval({
  entityId,
  setEntityType,
  setRefresh,
  selectedRow,
}) {
  const { salaryTemplate } = useSelector((state) => state.configApproval);
  const { idPayrollScreen } = useSelector((state) => state.auth);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getSalaryTemplateById(entityId));
  }, []);

  const handleApproveWorkflow = async () => {
    const content = [
      {
        entityTablePrimaryKeyID: entityId,
        entityCode: "SALTEM",
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
        entityCode: "SALTEM",
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

  function getDetails(item) {
    if (item.calculationMethod.toLowerCase() === 'percentage') { 
      return `${item.percentageValue}% of ${item.percentageOfIdSalaryHeadValue}`;
    }

   if (item.calculationMethod.toLowerCase() === 'fixedamount') { 
      return "FIXED AMOUNT";
    }

     if (item.calculationMethod.toLowerCase() === 'formula') { 
      return 'Formula - ' + item.customFormula;
    }
  }

  return (
    <div
      className="modal d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              Salary Template Approval
              {selectedRow.actionStatus?.toLowerCase() === "approved" ?
                " (Already Approved)":''}
                {selectedRow.actionStatus?.toLowerCase() === "rejected" ?
                " (Rejected)":''}
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
                  <td>{salaryTemplate.createdByValue}</td>
                  <td>
                    {new Date(salaryTemplate.createdOn).toLocaleString(
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
                  <th>Template Name</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{salaryTemplate.salaryTemplateName}</td>
                  <td>{salaryTemplate.description}</td>
                </tr>
              </tbody>
            </table>

            <table className="table table-bordered mt-3">
              <thead>
                <tr>
                  <th>Salary Head Code</th>
                  <th>Salary Head Name</th>
                  <th>Type</th>
                  <th>Details</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {salaryTemplate.salaryTemplateDetails?.map((item) => (
                  <tr>
                    <td>{item.salaryHeadCode}</td>
                    <td>{item.salaryHeadName}</td>
                    <td>{item.headType}</td>
                    <td>{getDetails(item)}</td>
                    <td className="text-end">{Number(item.finalSalaryAmount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <table className="table table-bordered mt-3">
              <thead>
                <tr>
                  <th>Total earnings</th>
                  <th>Total Deductions</th>
                  <th>Net Salary</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-center">{Number(salaryTemplate.totalEarnings).toFixed(2)}</td>
                  <td className="text-center">{Number(salaryTemplate.totalDeductions).toFixed(2)}</td>
                  <td className="text-center">{Number(salaryTemplate.netSalary).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {selectedRow.actionStatus?.toLowerCase() === "submitted" && (
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

export default SalaryTemplateApproval;
