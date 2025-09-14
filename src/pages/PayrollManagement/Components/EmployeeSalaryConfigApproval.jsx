import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getEmployeeSalaryConfigById } from "../../../redux/reducers/ConfigApprovals";
import toast from "react-hot-toast";
import SalaryGenerationService from "../../../core/services/SalaryGenerationService";
import secureLocalStorage from "react-secure-storage";

function EmployeeSalaryConfigApproval({
  entityId,
  setEntityType,
  setRefresh,
  selectedRow,
}) {
  console.log("selectedRow", selectedRow);
  const { employeeSalaryConfig } = useSelector((state) => state.configApproval);
  const { idPayrollScreen } = useSelector((state) => state.auth);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const dispatch = useDispatch();
  
  // Get logged-in employee ID
  const userData = JSON.parse(secureLocalStorage.getItem("user"));
  const loggedInEmployeeId = userData?.idEmployee;

  useEffect(() => {
    dispatch(getEmployeeSalaryConfigById(entityId));
  }, []);

  const handleApproveWorkflow = async () => {
    const content = [
      {
        entityTablePrimaryKeyID: entityId,
        entityCode: "EMPLSALCONFIG",
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
      toast.error("approving records");
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
        entityCode: "EMPLSALCONFIG",
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
      toast.error("rejecting records");
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
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              Employee Salary Config Approval{" "}
                {selectedRow.currentStatus?.toLowerCase() === "approved" ?
                " (Already Approved)":''}
                {selectedRow.currentStatus?.toLowerCase() === "rejected" ?
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
                  <td>{employeeSalaryConfig.createdByValue}</td>
                  <td>
                    {new Date(employeeSalaryConfig.createdOn).toLocaleString(
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
                  <td>{employeeSalaryConfig.employeeCode}</td>
                  <td>{employeeSalaryConfig.employeeName}</td>
                  <td>
                    {employeeSalaryConfig.designationName} /{" "}
                    {employeeSalaryConfig.departmentName}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="mt-3">
              <strong>
                Valid From :{" "}
                {new Date(employeeSalaryConfig.validFrom).toLocaleString(
                  "en-US",
                  {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  }
                )}
              </strong>
            </div>

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
                {employeeSalaryConfig.employeeSalaryConfigDetails?.map(
                  (item,index) => (
                    <tr key={index}>
                      <td>{item.salaryHeadCode}</td>
                      <td>{item.salaryHeadName}</td>
                      <td>{item.headType}</td>
                      <td>{getDetails(item)}</td>
                      <td className="text-end">{Number(item.salaryAmount).toFixed(2)}</td>
                    </tr>
                  )
                )}
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
                  <td className="text-center">
                    {Number(employeeSalaryConfig.totalEarnings).toFixed(2)}
                  </td>
                  <td className="text-center">
                    {Number(employeeSalaryConfig.totalDeductions).toFixed(2)}
                  </td>
                  <td className="text-center">{Number(employeeSalaryConfig.netSalary).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
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

export default EmployeeSalaryConfigApproval;
