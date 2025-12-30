import React, { useState, useEffect, useContext, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import { Modal } from "react-bootstrap";
import { EmployeeContext } from "../EmployeeManagement";
import EmployeeManagementService from "../../../../core/services/EmployeeManagementService";
import secureLocalStorage from "react-secure-storage";
import { toast } from "react-toastify";
import { useLoader } from "../../../../components/LoaderContext";

const EmployeeActions = () => {
  const { employeeId } = useContext(EmployeeContext) || {};
  const id = employeeId;
  const { showLoader, hideLoader } = useLoader();
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedActionId, setSelectedActionId] = useState(null);
  
  // Ref to track loading state and prevent duplicate calls
  const actionsLoadedRef = useRef(null);

  const [formData, setFormData] = useState({
    actionType: "RECOGNITION",
    actionDescription: "",
    actionSeverity: "Low",
    remarks: "",
    effectiveFromDate: null,
    effectiveToDate: null,
    status: "ACTIVE",
  });

  const actionTypes = ["RECOGNITION", "DISCIPLINARY"];
  const severities = ["Low", "Medium", "High", "Very High"];

  useEffect(() => {
    if (!id) return;
    
    if (actionsLoadedRef.current !== id) {
      actionsLoadedRef.current = id;
      loadActions();
    }
    
    return () => {
      // Reset ref when component unmounts to allow fresh load on next mount
      actionsLoadedRef.current = null;
    };
  }, [id]);

  const loadActions = async () => {
    if (!id) return;
    try {
      showLoader();
      const result = await EmployeeManagementService.getEmployeeActionsForIdEmployee(parseInt(id));
      hideLoader();
      if (result.error) {
        toast.error(result.error);
      } else {
        setActions(result.data?.data || []);
      }
    } catch (error) {
      hideLoader();
      toast.error("Failed to load actions");
    }
  };

  const getCurrentUserId = () => {
    const user = secureLocalStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      return userData.idEmployee || 1;
    }
    return 1;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!id) {
      toast.warning("Please save employee basic details first");
      return;
    }

    if (!formData.actionDescription || !formData.effectiveFromDate) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        idEmployeeAction: editingId || 0,
        idEmployee: parseInt(id),
        actionType: formData.actionType,
        actionDescription: formData.actionDescription,
        actionSeverity: formData.actionSeverity,
        remarks: formData.remarks || "",
        effectiveFromDate: formData.effectiveFromDate,
        effectiveToDate: formData.effectiveToDate,
        status: formData.status,
        createdBy: getCurrentUserId(),
      };

      const result = await EmployeeManagementService.postEmployeeAction(payload);
      setLoading(false);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(editingId ? "Action updated successfully" : "Action added successfully");
        handleReset();
        loadActions();
      }
    } catch (error) {
      setLoading(false);
      toast.error("Failed to save action");
    }
  };

  const handleEdit = (action) => {
    setEditingId(action.idEmployeeAction);
    setFormData({
      actionType: action.actionType || "RECOGNITION",
      actionDescription: action.actionDescription || "",
      actionSeverity: action.actionSeverity || "Low",
      remarks: action.remarks || "",
      effectiveFromDate: action.effectiveFromDate ? moment(action.effectiveFromDate).toDate() : null,
      effectiveToDate: action.effectiveToDate ? moment(action.effectiveToDate).toDate() : null,
      status: action.status || "ACTIVE",
    });
  };

  const handleDelete = async (actionId) => {
    setSelectedActionId(actionId);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedActionId) return;

    try {
      showLoader();
      const payload = {
        idEmployeeAction: selectedActionId,
        remarks: "Disabled by user",
        idUser: getCurrentUserId(),
      };
      const result = await EmployeeManagementService.disableEmployeeAction(payload);
      hideLoader();

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Action disabled successfully");
        loadActions();
      }
      setShowConfirmModal(false);
      setSelectedActionId(null);
    } catch (error) {
      hideLoader();
      toast.error("Failed to disable action");
      setShowConfirmModal(false);
      setSelectedActionId(null);
    }
  };

  const handleReset = () => {
    setEditingId(null);
    setFormData({
      actionType: "RECOGNITION",
      actionDescription: "",
      actionSeverity: "Low",
      remarks: "",
      effectiveFromDate: null,
      effectiveToDate: null,
      status: "ACTIVE",
    });
  };

  return (
    <div className="row">
      <div className="col-lg-8">
        <div className="card">
          <div className="card-header">
            <h6 className="mb-0">Employee Actions</h6>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {actions.length > 0 ? (
                    actions.map((action) => (
                      <tr key={action.idEmployeeAction}>
                        <td>{action.actionType}</td>
                        <td>{action.actionDescription}</td>
                        <td>{action.actionSeverity}</td>
                        <td>
                          <span className={`badge ${action.status === "ACTIVE" ? "bg-success" : "bg-secondary"}`}>
                            {action.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0 me-2"
                            onClick={() => handleEdit(action)}
                            title="Edit"
                          >
                            <i className="bx bx-pencil"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm border-0"
                            onClick={() => handleDelete(action.idEmployeeAction)}
                            title="Disable"
                          >
                            <i className="bx bx-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center">
                        No actions added yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-4">
        <div className="card">
          <div className="card-header">
            <h6 className="mb-0">Add / Update Action</h6>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label mb-1">Action Type</label>
              <select
                className="form-select"
                value={formData.actionType}
                onChange={(e) => handleInputChange("actionType", e.target.value)}
              >
                {actionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label mb-1">Description *</label>
              <input
                type="text"
                className="form-control"
                value={formData.actionDescription}
                onChange={(e) => handleInputChange("actionDescription", e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label mb-1">Severity</label>
              <select
                className="form-select"
                value={formData.actionSeverity}
                onChange={(e) => handleInputChange("actionSeverity", e.target.value)}
              >
                {severities.map((severity) => (
                  <option key={severity} value={severity}>
                    {severity}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label mb-1">Effective From *</label>
              <DatePicker
                selected={formData.effectiveFromDate}
                onChange={(date) => handleInputChange("effectiveFromDate", date)}
                dateFormat="dd-MM-yyyy"
                className="form-control"
                placeholderText="dd-mm-yyyy"
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                wrapperClassName="d-block"
              />
            </div>

            <div className="mb-3">
              <label className="form-label mb-1">Effective To</label>
              <DatePicker
                selected={formData.effectiveToDate}
                onChange={(date) => handleInputChange("effectiveToDate", date)}
                dateFormat="dd-MM-yyyy"
                className="form-control"
                placeholderText="dd-mm-yyyy"
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                wrapperClassName="d-block"
                minDate={formData.effectiveFromDate}
              />
            </div>

            <div className="mb-3">
              <label className="form-label mb-1">Remarks</label>
              <textarea
                className="form-control"
                rows="3"
                value={formData.remarks}
                onChange={(e) => handleInputChange("remarks", e.target.value)}
              />
            </div>

            <div className="d-flex gap-2">
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? (id ? "Updating..." : "Submitting...") : (id ? "Update" : "Submit")}
              </button>
              <button className="btn btn-outline-secondary" onClick={handleReset} disabled={loading}>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        show={showConfirmModal}
        onHide={() => {
          setShowConfirmModal(false);
          setSelectedActionId(null);
        }}
        size="sm"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header className="border-0" closeButton>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex align-items-center justify-content-center shortDataHeight">
            Are you sure you want to disable this action?
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-secondary px-3"
            onClick={() => {
              setShowConfirmModal(false);
              setSelectedActionId(null);
            }}
            autoFocus
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary px-3"
            onClick={confirmDelete}
          >
            Confirm
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EmployeeActions;
