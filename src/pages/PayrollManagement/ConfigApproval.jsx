import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getConfigApprovals } from "../../redux/reducers/ConfigApprovals";
import { toast } from "react-hot-toast";
import SalaryGenerationService from "../../core/services/SalaryGenerationService";

function ConfigApproval() {
  const dispatch = useDispatch();
  const { configApprovalList } = useSelector((state) => state.configApproval);
  const [dateFrom, setDateFrom] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [entityType, setEntityType] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    const params = {
      dateFrom,
      entityType,
      status,
    };
    dispatch(getConfigApprovals(params));
  }, [dateFrom, entityType, status]);

  const handleSelectAll = (e) => {
    if (e.target.checked && configApprovalList) {
      setSelectedItems(configApprovalList.filter(x => x.actionStatus.toLowerCase() !== "approved").map((item) => item.entityTablePrimaryKeyID));
    } else {
      setSelectedItems([]);
    }
    handelCheckboxCheck(e.target.checked)
  };

  const handelCheckboxCheck = (checked) => {
    Array.from(document.querySelectorAll(".data-checkbox")).map((item) => {
      if (!item.disabled) {
        item.checked = checked;
      }
    });
  }

  const handleApproveWorkflow = async () => {
    const content = selectedItems.map((id) => {
      const item = configApprovalList.find((item) => item.entityTablePrimaryKeyID === id);
      return {
        entityTablePrimaryKeyID: item.entityTablePrimaryKeyID,
        entityCode: item.entityCode,
        status: "APPROVED",
      };
    });

    try {
      const res = await SalaryGenerationService.handleApprovalWorkflow(content);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Records Approved Successfully");
        setSelectedItems([]);
        dispatch(getConfigApprovals({ dateFrom, entityType, status }));
      }
    } catch (error) {
      toast.error("Error approving records");
    }
    handelCheckboxCheck(false)
  };

  const handleRejectWorkflow = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }

    const content = selectedItems.map((id) => {
      const item = configApprovalList.find((item) => item.entityTablePrimaryKeyID === id);
      return {
        entityTablePrimaryKeyID: item.entityTablePrimaryKeyID,
        entityCode: item.entityCode,
        status: "REJECTED",
        rejectReason: rejectReason,
      };
    });

    try {
      const res = await SalaryGenerationService.handleApprovalWorkflow(content);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Records Rejected Successfully");
        setSelectedItems([]);
        setRejectReason("");
        setShowRejectModal(false);
        dispatch(getConfigApprovals({ dateFrom, entityType, status }));
      }
    } catch (error) {
      toast.error("Error rejecting records");
    }
    handelCheckboxCheck(false)
  };

  return (
    <div class="container-xxl flex-grow-1 container-p-y">
      <div class="row">
        <div class="col-xl-12">
          <div class="card">
            <div class="card-header d-flex align-items-center justify-content-between pb-1">
              <h5 class="m-0 d-flex align-items-center">
                List of Config Approvals
              </h5>
            </div>
            <div class="card-body">
              <div class="row m-0 pb-2">
                <div class="col-md-3 p-2">
                  <label>Entity Type</label>
                  <select
                    class="form-select form-select-sm"
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value)}
                  >
                    <option>Select</option>
                    <option value={"SALTEM"}>Salary Template</option>
                    <option value={"EMPSALCONFIG"}>
                      Employee Salary Configuration
                    </option>
                    <option value={"OVERTIME"}>Overtime Transaction</option>
                  </select>
                </div>
                <div class="col-md-3 p-2">
                  <label>Status</label>
                  <select
                    class="form-select form-select-sm"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option>Select Status</option>
                    <option>Submitted</option>
                    <option>Approved</option>
                    <option>Rejected</option>
                  </select>
                </div>
                <div class="col-md-3 p-2">
                  <label>Date From</label>
                  <input
                    type="date"
                    class="form-control form-control-sm"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
              </div>
              <div class="table-responsive ">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          class="form-check-input"
                          checked={
                            selectedItems.length === configApprovalList?.length
                          }
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th>Entity Type</th>
                      <th>Details</th>
                      <th>Created By & Date</th>
                      <th>Current Status</th>
                      <th>Current Status Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {configApprovalList?.map((item) => (
                      <tr key={item.idApprovalWorkFlow}>
                        <td>
                          <input
                            disabled={item.actionStatus.toLowerCase() === "approved"}
                            type="checkbox"
                            class="form-check-input data-checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItems((prev) => [...prev, item.entityTablePrimaryKeyID]);
                              } else {
                                setSelectedItems((prev) =>
                                  prev.filter((x) => x !== item.entityTablePrimaryKeyID)
                                );
                              }
                            }}
                          />
                        </td>
                        <td class="cursor">{item.entityName}</td>
                        <td>{item.entityName + " " + item.details}</td>
                        <td>
                          {item.createdBy || "user"} <br />
                          {new Date(item.sentDate).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </td>
                        <td>{item.actionStatus}</td>
                        <td></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div class="text-center pt-3">
                  <button
                    type="submit"
                    class="btn btn-primary btn-sm py-2 px-4 me-2"
                    onClick={handleApproveWorkflow}
                    disabled={selectedItems.length === 0}
                  >
                    Approve Selected Records
                  </button>
                  <button
                    type="submit"
                    class="btn btn-primary btn-sm py-2 px-4 me-2"
                    onClick={() => setShowRejectModal(true)}
                    disabled={selectedItems.length === 0}
                  >
                    Reject Selected Records
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Reject Modal */}
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
                  className="btn btn-secondary"
                  onClick={() => setShowRejectModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleRejectWorkflow}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConfigApproval;
