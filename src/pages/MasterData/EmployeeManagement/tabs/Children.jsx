import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import { Modal } from "react-bootstrap";
import { EmployeeContext } from "../EmployeeManagement";
import EmployeeManagementService from "../../../../core/services/EmployeeManagementService";
import { toast } from "react-toastify";
import { useLoader } from "../../../../components/LoaderContext";

const Children = () => {
  const { employeeId, setHasUnsavedChanges } = useContext(EmployeeContext) || {};
  const id = employeeId;
  const { showLoader, hideLoader } = useLoader();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [initialFormData, setInitialFormData] = useState(null);
  
  const childrenLoadedRef = useRef(null);
  const topRef = useRef(null);

  const [formData, setFormData] = useState({
    childName: "",
    dateOfBirth: null,
    certificateNumber: "",
    divisionNumber: "",
  });

  const loadChildren = useCallback(async () => {
    if (!id) return;
    try {
      showLoader();
      const result = await EmployeeManagementService.getEmployeeChildren(parseInt(id));
      hideLoader();
      if (result.error) {
        toast.error(result.error);
      } else {
        setChildren(result.data?.data || []);
      }
    } catch (error) {
      hideLoader();
      toast.error("Failed to load children");
    }
  }, [id, showLoader, hideLoader]);

  useEffect(() => {
    if (!id) return;
    
    if (childrenLoadedRef.current !== id) {
      childrenLoadedRef.current = id;
      loadChildren();
      // Reset form when employee changes
      const resetData = {
        childName: "",
        dateOfBirth: null,
        certificateNumber: "",
        divisionNumber: "",
      };
      setFormData(resetData);
      setInitialFormData(resetData);
      if (setHasUnsavedChanges) {
        setHasUnsavedChanges(false);
      }
    }
  }, [id, loadChildren, setHasUnsavedChanges]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        [field]: value,
      };
      
      // Check for unsaved changes
      if (setHasUnsavedChanges && initialFormData) {
        const currentForComparison = {
          ...newData,
          dateOfBirth: newData.dateOfBirth ? moment(newData.dateOfBirth).format("YYYY-MM-DD") : null,
        };
        const initialForComparison = {
          ...initialFormData,
          dateOfBirth: initialFormData.dateOfBirth ? moment(initialFormData.dateOfBirth).format("YYYY-MM-DD") : null,
        };
        const hasChanges = JSON.stringify(currentForComparison) !== JSON.stringify(initialForComparison);
        setHasUnsavedChanges(hasChanges);
      }
      
      return newData;
    });
  };

  const handleSave = async () => {
    if (!id) {
      toast.warning("Please save employee basic details first");
      return;
    }

    if (!formData.childName) {
      toast.error("Please enter child name");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        idEmployeeChildren: editingId || 0,
        idEmployee: parseInt(id),
        childName: formData.childName,
        dateOfBirth: formData.dateOfBirth || null,
        gender: "",
        certificateNumber: formData.certificateNumber || "",
        divisionNumber: formData.divisionNumber || "",
      };

      const result = await EmployeeManagementService.postEmployeeChild(payload);
      setLoading(false);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(editingId ? "Child updated successfully" : "Child added successfully");
        if (setHasUnsavedChanges) {
          setHasUnsavedChanges(false);
        }
        handleReset();
        loadChildren();
        // Scroll to top
        if (topRef.current) {
          topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    } catch (error) {
      setLoading(false);
      toast.error("Failed to save child");
    }
  };

  const handleEdit = (child) => {
    setEditingId(child.idEmployeeChildren);
    const editData = {
      childName: child.childName || "",
      dateOfBirth: child.dateOfBirth ? moment(child.dateOfBirth).toDate() : null,
      certificateNumber: child.certificateNumber || "",
      divisionNumber: child.divisionNumber || "",
    };
    setFormData(editData);
    setInitialFormData(editData);
    if (setHasUnsavedChanges) {
      setHasUnsavedChanges(false);
    }
  };

  const handleDelete = async (childId) => {
    setSelectedChildId(childId);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedChildId) return;

    try {
      showLoader();
      const result = await EmployeeManagementService.deleteEmployeeChild(selectedChildId);
      hideLoader();

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Child deleted successfully");
        loadChildren();
        // Scroll to top after deletion
        if (topRef.current) {
          topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      setShowConfirmModal(false);
      setSelectedChildId(null);
    } catch (error) {
      hideLoader();
      toast.error("Failed to delete child");
      setShowConfirmModal(false);
      setSelectedChildId(null);
    }
  };

  const handleReset = () => {
    setEditingId(null);
    const resetData = {
      childName: "",
      dateOfBirth: null,
      certificateNumber: "",
      divisionNumber: "",
    };
    setFormData(resetData);
    setInitialFormData(resetData);
    if (setHasUnsavedChanges) {
      setHasUnsavedChanges(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return moment(dateString).format("DD-MM-YYYY");
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "-";
    return moment().diff(moment(dateOfBirth), 'years');
  };

  return (
    <div className="row" ref={topRef}>
      <div className="col-lg-8">
        <div>
          <div>
            <h6 className="mb-0">Child/ren Details</h6>
          </div>
          <div className="pt-3">
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Child Name</th>
                    <th>Date of Birth</th>
                    <th>Age</th>
                    <th>Certificate Number</th>
                    <th>Division Number</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {children.length > 0 ? (
                    children.map((child) => (
                      <tr key={child.idEmployeeChildren}>
                        <td>{child.childName}</td>
                        <td>{formatDate(child.dateOfBirth)}</td>
                        <td>{calculateAge(child.dateOfBirth)}</td>
                        <td>{child.certificateNumber || "-"}</td>
                        <td>{child.divisionNumber || "-"}</td>
                        <td width="15%">
                          <button
                            className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0 me-2"
                            onClick={() => handleEdit(child)}
                            title="Edit"
                          >
                            <i className="bx bx-pencil"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-icon btn-outline-danger px-3 border-0"
                            onClick={() => handleDelete(child.idEmployeeChildren)}
                            title="Delete"
                          >
                            <i className="bx bx-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center">
                        No children added yet
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
        <div className="card" style={{boxShadow: '0 0px 2px 0 rgba(67, 89, 113, 1.12)'}}>
          <div className="card-header">
            <h6 className="mb-0">Add / Update Child</h6>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label mb-1">Child Name *</label>
              <input
                type="text"
                className="form-control"
                value={formData.childName}
                onChange={(e) => handleInputChange("childName", e.target.value)}
                placeholder="Enter child name"
                maxLength={50}
              />
            </div>

            <div className="mb-3">
              <label className="form-label mb-1">Date of Birth</label>
              <DatePicker
                selected={formData.dateOfBirth}
                onChange={(date) => handleInputChange("dateOfBirth", date)}
                dateFormat="dd-MM-yyyy"
                className="form-control"
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                wrapperClassName="d-block"
                maxDate={new Date()}
                placeholderText="Select date of birth"
              />
            </div>

            <div className="mb-3">
              <label className="form-label mb-1">Certificate Number</label>
              <input
                type="text"
                className="form-control"
                value={formData.certificateNumber}
                onChange={(e) => handleInputChange("certificateNumber", e.target.value)}
                placeholder="Enter certificate number"
                maxLength={20}
              />
            </div>

            <div className="mb-3">
              <label className="form-label mb-1">Division Number</label>
              <input
                type="text"
                className="form-control"
                value={formData.divisionNumber}
                onChange={(e) => handleInputChange("divisionNumber", e.target.value)}
                placeholder="Enter division number"
                maxLength={20}
              />
            </div>

            <div className="d-flex gap-2">
              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : editingId ? "Update" : "Save"}
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
          setSelectedChildId(null);
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
            Are you sure you want to delete this child?
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-secondary px-3"
            onClick={() => {
              setShowConfirmModal(false);
              setSelectedChildId(null);
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

export default Children;
