import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getConfigApprovals } from "../../redux/reducers/ConfigApprovals";
import { toast } from "react-hot-toast";
import SalaryGenerationService from "../../core/services/SalaryGenerationService";
import EmployeeSalaryConfigApproval from "./Components/EmployeeSalaryConfigApproval";
import LeavePassageApproval from "./Components/LeavePassageApproval";
import SalaryTemplateApproval from "./Components/SalaryTemplateApproval";
import MaternityLeaveSalaryApproval from "./Components/MaternityLeaveSalaryApproval";
import OvertimeTransactionApproval from "./Components/OvertimeTransactionApproval";
import DatePicker from "react-datepicker";
import { API } from "../../redux/api/utils";
import secureLocalStorage from "react-secure-storage";


const statusColor = [
    {
        status:"approved",
        class:"bg-success"
    },
    {
        status: "submitted",
        class: "bg-warning"
    },
    {
        status: "interim approved",
        class: "bg-secondary"
    },
     {
        status: "hr approved",
        class: "bg-secondary"
    },
    {
        status: "rejected",
        class: "bg-danger"
    }
]

function ConfigApproval() {
  const dispatch = useDispatch();
  const { configApprovalList } = useSelector((state) => state.configApproval);
  const { idPayrollScreen } = useSelector((state) => state.auth);
const [dateFrom, setDateFrom] = React.useState(() => {
  const date = new Date();
  date.setDate(date.getDate() - 14);
  return date.toISOString().split("T")[0];
});
  const [entityType, setEntityType] = React.useState("");
  const [entityName, setEntityName] = React.useState("");
  const [entityId, setEntityId] = useState(0);
  const [status, setStatus] = React.useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState({
    type: "",
    title: "",
    message: "",
  });
  const [refresh, setRefresh] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [entityTypes, setEntityTypes] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  
  // Get logged-in employee ID
  const userData = JSON.parse(secureLocalStorage.getItem("user"));
  const loggedInEmployeeId = userData?.idEmployee;

  useEffect(() => {
    const params = {
      dateFrom,
      entityType,
      status,
    };
    dispatch(getConfigApprovals(params));
    setSelectedItems([])
    handelCheckboxCheck(false)
    getEntityTypes();
  }, [dateFrom, entityType, status, refresh]);

  async function getEntityTypes() {
    const res = await API.get("/api/v1/PayRollManagement/GetWorkflowConfigList");
    const filteredData = res.data.data.filter((item) => {
      // Hide entities that have their own separate approval screens
      if (item.entityName === "Leave Template") return false;
      if (item.entityName === "Employee Leave Config") return false;

      // Existing filter
      return !item.entityName.includes("Leave Approval Workflow");
    });
    setEntityTypes(filteredData);
  }

  async function getStatusOptions(entityTypeId) {
    try {      
      const res = await API.get(`/api/v1/PayRollManagement/GetWorkflowConfigList1?entityId=${entityTypeId}`);
      console.log('fetched data',res)
      setStatusOptions(res.data.data || []);
    } catch (error) {
      console.error("Error fetching status options:", error);
      setStatusOptions([]);
    }
  }

  const handleEntityTypeChange = (e) => {
    const selectedValue = e.target.value;
    setEntityType(selectedValue);
    setStatus(""); // Reset status when entity type changes
    
    if (selectedValue) {
      // Find the selected entity type to get its ID
      const selectedEntity = entityTypes.find(item => item.entityCode === selectedValue);      
      if (selectedEntity) {
        getStatusOptions(selectedEntity.idWorkFlowConfig);
      }
    } else {
      setStatusOptions([]);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked && configApprovalList) {
      const selectableItems = configApprovalList.filter(item => {
        return item.currentStatus?.toLowerCase() !== "approved" &&
               item.currentStatus?.toLowerCase() !== "rejected" &&           
               loggedInEmployeeId &&
               item.targetIdEmployee &&
               item.targetIdEmployee.split(',').map(id => parseInt(id.trim())).includes(loggedInEmployeeId) &&
               item.actionStatus === null;
      });
      setSelectedItems(selectableItems.map((item) => item.idApprovalWorkFlow));
    } else {
      setSelectedItems([]);
    }
    handelCheckboxCheck(e.target.checked)
  };

  const handelCheckboxCheck = (checked) => {
    Array.from(document.querySelectorAll(".data-checkbox")).forEach((item) => {
      if (!item.disabled) {
        item.checked = checked;
      }
    });
  };

  const handleApproveWorkflow = async () => {    
    const content = selectedItems.map((id) => {
      const item = configApprovalList.find(
        (item) => item.idApprovalWorkFlow === id
      );
      return {
        entityTablePrimaryKeyID: item.entityTablePrimaryKeyID,
        entityCode: item.entityCode,
        status: "APPROVED",
        idPayrollScreen,
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
    handelCheckboxCheck(false);
  };

  const handleRejectWorkflow = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }

    const content = selectedItems.map((id) => {
      const item = configApprovalList.find(
        (item) => item.idApprovalWorkFlow === id
      );
      return {
        entityTablePrimaryKeyID: item.entityTablePrimaryKeyID,
        entityCode: item.entityCode,
        status: "REJECTED",
        idPayrollScreen,
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
    handelCheckboxCheck(false);
  };

  const handleStatusChange = (status) => {
    if (status.value) {
      const params = {
        dateFrom,
        entityType,
        status: status.value,
      };
      dispatch(getConfigApprovals(params));
    }
  };

  const handleConfirmAction = () => {
    switch (confirmAction.type) {
      case "approve":
        handleApproveWorkflow();
        break;
    }
    setShowConfirmModal(false);
  };

  const showConfirmationModal = (type) => {
    let title = "";
    let message = "";

    switch (type) {
      case "approve":
        title = "Approve Records";
        message = "Are you sure you want to approve the selected records?";
        break;
    }

    setConfirmAction({ type, title, message });
    setShowConfirmModal(true);
  };

  const handleSelectEmployee = (item) => {    
    setEntityName(item.entityName);
    setEntityId(item.entityTablePrimaryKeyID);
    setSelectedRow(item);
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
                    class="form-select form-select"
                    value={entityType}
                    onChange={handleEntityTypeChange}
                  >
                    <option value={""}>Select</option>
                    {entityTypes?.map(item => <option value={item.entityCode}>{item.entityName}</option>)}
                  </select>
                </div>
                <div class="col-md-3 p-2">
                  <label>Status</label>
                  <select
                    class="form-select form-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={!entityType}
                  >
                    <option value={""}>Select Status</option>                   
                    {statusOptions.map((statusOption, index) => (
                      <option key={index} value={statusOption.approvalStatusName}>
                        {statusOption.approvalStatusName}
                      </option>
                    ))}                   
                  </select>
                </div>
                <div class="col-md-3 p-2">
                  <label>Date From</label>
                  <br/>
                  <DatePicker
                    className="form-control"
                    dateFormat="MM/dd/yyyy"
                    placeholderText="Date"
                    selected={dateFrom} 
                    onChange={(date) => {
                      setDateFrom(date.toISOString().slice(0,10))
                    }}
                    showYearDropdown
                    maxDate={new Date()}
                    />
                  {/* <input
                    type="date"
                    class="form-control form-control-sm"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  /> */}
                </div>
              </div>
              <div class="table-responsive ">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>
                        {<input
                            type="checkbox"
                            class="form-check-input"
                            checked={
                              selectedItems.length > 0 && 
                              selectedItems.length === configApprovalList?.filter(item => {
                                return item.currentStatus?.toLowerCase() !== "approved" &&
                                       item.currentStatus?.toLowerCase() !== "rejected" &&
                                       loggedInEmployeeId &&
                                       item.targetIdEmployee &&
                                       item.targetIdEmployee.split(',').map(id => parseInt(id.trim())).includes(loggedInEmployeeId) &&
                                       item.actionStatus === null;
                              }).length
                            }
                            onChange={handleSelectAll}
                          />}
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
                             disabled={
                               item.currentStatus?.toLowerCase() === "approved" ||
                               item.currentStatus?.toLowerCase() === "rejected" ||
                               !loggedInEmployeeId ||
                               !item.targetIdEmployee ||
                               !item.targetIdEmployee.split(',').map(id => parseInt(id.trim())).includes(loggedInEmployeeId) ||
                               item.actionStatus !== null
                             }
                            type="checkbox"
                            class="form-check-input data-checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItems((prev) => [
                                  ...prev,
                                  item.idApprovalWorkFlow,
                                ]);
                              } else {
                                setSelectedItems((prev) =>
                                  prev.filter(
                                    (x) => x !== item.idApprovalWorkFlow
                                  )
                                );
                              }
                            }}
                          />
                        </td>
                        <td>
                          <a
                            href="#"
                            class="cursor"
                            style={{ color: "var(--link-color)", cursor: "pointer", textDecoration: "none" }}
                            onClick={(e) => {
                              e.preventDefault();
                              handleSelectEmployee(item);
                            }}
                          >
                            {item.entityName}
                          </a>
                        </td>
                        <td>{item.details}</td>
                        <td>
                          {item.createdBy || "user"} <br />
                          {new Date(item.sentDate).toLocaleString("en-US", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </td>
                        <td > 
                          <p className={`badge ${
  statusColor.find(x => x.status === item?.currentStatus?.trim().toLowerCase())?.class ?? ''
}`}>
  {item?.currentStatus}
</p>
                          </td>
                        <td>{item.rejectionRemarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div class="text-center pt-3">
                  <button
                    type="submit"
                    class="btn btn-primary btn-sm py-2 px-4 me-2"
                    onClick={() => showConfirmationModal("approve")}
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

      {/* Add the confirmation modal */}
      {showConfirmModal && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{confirmAction.title}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowConfirmModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>{confirmAction.message}</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirmAction}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {entityName === "Employee Salary Configuration" && (
        <EmployeeSalaryConfigApproval
          setEntityType={setEntityName}
          entityId={entityId}
          setRefresh={setRefresh}
          selectedRow={selectedRow}
        />
      )}

      {entityName === "Overtime Transactions" && (
        <OvertimeTransactionApproval
          setEntityType={setEntityName}
          entityId={entityId}
          setRefresh={setRefresh}
          selectedRow={selectedRow}
        />
      )}
{entityName === "Maternity Leave Sal Config" && (
  <MaternityLeaveSalaryApproval
    setEntityType={setEntityName}
    entityId={entityId}
    setRefresh={setRefresh}
    selectedRow={selectedRow}
  />
)}
      {entityName === "Salary Template" && (
        <SalaryTemplateApproval
          setEntityType={setEntityName}
          entityId={entityId}
          setRefresh={setRefresh}
          selectedRow={selectedRow}
        />
      )}

         {entityName === "Leave Passage" && (
        <LeavePassageApproval
          setEntityType={setEntityName}
          entityId={entityId}
          setRefresh={setRefresh}
          selectedRow={selectedRow}
        />
      )}
    </div>
  );
}

export default ConfigApproval;
