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

const Assets = () => {
  const { employeeId } = useContext(EmployeeContext) || {};
  const id = employeeId;
  const { showLoader, hideLoader } = useLoader();
  const [assets, setAssets] = useState([]);
  const [assetTypes, setAssetTypes] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [selectedAssetAssignmentId, setSelectedAssetAssignmentId] = useState(null);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [hoveredAssetId, setHoveredAssetId] = useState(null);
  const [returnReason, setReturnReason] = useState("");
  
  const assetTypesLoadedRef = useRef(false);
  const availableAssetsLoadedRef = useRef(false);
  const employeeAssetsLoadedRef = useRef(null);
  const topRef = useRef(null);

  const [formData, setFormData] = useState({
    idAsset: "",
    idAssetType: "",
    assetSerialNumber: "",
    assetDetails: "",
    averageCost: "",
    assetWorkingStatus: "Working",
    assignedTill: null,
    remarks: "",
  });

  const assetStatuses = ["Working", "Faulty", "UnderRepair", "Retired"];

  useEffect(() => {
    let isMounted = true;
    
    if (!assetTypesLoadedRef.current && isMounted) {
      assetTypesLoadedRef.current = true;
      loadAssetTypes();
    }
    if (!availableAssetsLoadedRef.current && isMounted) {
      availableAssetsLoadedRef.current = true;
      loadAvailableAssets();
    }
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    
    if (employeeAssetsLoadedRef.current !== id) {
      employeeAssetsLoadedRef.current = id;
      loadEmployeeAssets();
    }
    
    return () => {
      employeeAssetsLoadedRef.current = null;
    };
  }, [id]);

  const loadEmployeeAssets = async () => {
    if (!id) return;
    try {
      showLoader();
      const result = await EmployeeManagementService.getEmployeeAssetAssignments(parseInt(id));
      hideLoader();
      if (result.error) {
        toast.error(result.error);
      } else {
        setAssets(result.data?.data || []);
      }
    } catch (error) {
      hideLoader();
      toast.error("Failed to load assets");
    }
  };

  const loadAssetTypes = async () => {
    try {
      const result = await EmployeeManagementService.getAssetTypes();
      if (result.error) {
        toast.error(result.error);
      } else {
        setAssetTypes(result.data?.data || []);
      }
    } catch (error) {
      console.error("Failed to load asset types:", error);
    }
  };

  const loadAvailableAssets = async () => {
    try {
      const result = await EmployeeManagementService.getAssets(null, null, null);
      if (result.error) {
        console.error(result.error);
      } else {
        // Filter assets that are not allocated
        const available = (result.data?.data || []).filter((asset) => !asset.isAllocated);
        setAvailableAssets(available);
      }
    } catch (error) {
      console.error("Failed to load available assets:", error);
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

  const handleAssetSelect = (assetId) => {
    if (!assetId) {
      handleReset();
      return;
    }

    const selectedAsset = availableAssets.find((asset) => asset.idAsset === parseInt(assetId));
    
    if (selectedAsset) {
      setFormData((prev) => ({
        ...prev,
        idAsset: assetId,
        idAssetType: selectedAsset.idAssetType?.toString() || "",
        assetSerialNumber: selectedAsset.assetSerialNumber || "",
        assetDetails: selectedAsset.assetDetails || "",
        averageCost: selectedAsset.averageCost?.toString() || "",
        assetWorkingStatus: selectedAsset.assetWorkingStatus || "Working",
      }));
      setShowAssetModal(false);
    }
  };

  const handleAssign = async () => {
    if (!id) {
      toast.warning("Please save employee basic details first");
      return;
    }

    if (!formData.idAsset || !formData.assignedTill) {
      toast.error("Please select asset and assigned till date");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        idAsset: parseInt(formData.idAsset),
        idEmployee: parseInt(id),
        assignedDate: new Date(),
        assignedTillDate: formData.assignedTill,
        remarks: formData.remarks || "",
        assignedBy: getCurrentUserId(),
      };

      if (editingId && editingAssignmentId) {
        payload.idAssetAssignment = editingAssignmentId;
      }

      const result = await EmployeeManagementService.assignAssetToEmployee(payload);
      setLoading(false);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Asset assigned successfully");
        handleReset();
        loadEmployeeAssets();
        loadAvailableAssets();
        // Scroll to top
        if (topRef.current) {
          topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    } catch (error) {
      setLoading(false);
      toast.error("Failed to assign asset");
    }
  };

  const handleEdit = (asset) => {
    setEditingId(asset.idAsset);
    setEditingAssignmentId(asset.idAssetAssignment);
    
    const fullAssetDetails = availableAssets.find(a => a.idAsset === asset.idAsset);
    
    setFormData({
      idAsset: asset.idAsset?.toString() || "",
      idAssetType: asset.idAssetType?.toString() || fullAssetDetails?.idAssetType?.toString() || "",
      assetSerialNumber: asset.assetSerialNumber || fullAssetDetails?.assetSerialNumber || "",
      assetDetails: asset.assetDetails || fullAssetDetails?.assetDetails || "",
      averageCost: asset.averageCost?.toString() || fullAssetDetails?.averageCost?.toString() || "",
      assetWorkingStatus: asset.assetWorkingStatus || fullAssetDetails?.assetWorkingStatus || "Working",
      assignedTill: asset.assignedTillDate ? moment(asset.assignedTillDate).toDate() : null,
      remarks: asset.remarks || "",
    });
  };

  const handleDelete = async (asset) => {
    setSelectedAssetId(asset.idAsset);
    setSelectedAssetAssignmentId(asset.idAssetAssignment);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedAssetId) return;

    if (!returnReason.trim()) {
      toast.error("Please provide a reason for returning the asset");
      return;
    }

    try {
      showLoader();
      const payload = {
        idAsset: selectedAssetId,
        idAssetAssignment: selectedAssetAssignmentId,
        idEmployee: parseInt(id),
        returnDate: new Date(),
        remarks: returnReason.trim(),
        idUser: getCurrentUserId(),
      };
      const result = await EmployeeManagementService.returnAssetFromEmployee(payload);
      hideLoader();

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Asset returned successfully");
        loadEmployeeAssets();
        loadAvailableAssets();
        // Scroll to top
        if (topRef.current) {
          topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      setShowConfirmModal(false);
      setSelectedAssetId(null);
      setSelectedAssetAssignmentId(null);
      setReturnReason("");
    } catch (error) {
      hideLoader();
      toast.error("Failed to return asset");
      setShowConfirmModal(false);
      setSelectedAssetId(null);
      setSelectedAssetAssignmentId(null);
      setReturnReason("");
    }
  };

  const handleReset = () => {
    setEditingId(null);
    setEditingAssignmentId(null);
    setFormData({
      idAsset: "",
      idAssetType: "",
      assetSerialNumber: "",
      assetDetails: "",
      averageCost: "",
      assetWorkingStatus: "Working",
      assignedTill: null,
      remarks: "",
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return moment(dateString).format("DD-MMM-YYYY");
  };

  return (
    <div className="row" ref={topRef}>
      <div className="col-lg-8">
        <div>
          <div>
            <h6 className="mb-0">Assets</h6>
          </div>
          <div className="pt-3">
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Serial</th>
                    <th>Status</th>
                    <th>Assigned Till</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.length > 0 ? (
                    assets.map((asset) => (
                      <tr key={asset.idAsset}>
                        <td>{asset.assetTypeName || asset.idAssetType}</td>
                        <td>{asset.assetSerialNumber || "-"}</td>
                        <td>{asset.assetWorkingStatus || "-"}</td>
                        <td>{formatDate(asset.assignedTillDate)}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0 me-2"
                            onClick={() => handleEdit(asset)}
                            title="Edit"
                          >
                            <i className="bx bx-pencil"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm border-0"
                            onClick={() => handleDelete(asset)}
                            title="Return Asset"
                          >
                            <i className="bx bx-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center">
                        No assets assigned yet
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
            <h6 className="mb-0">Assign Asset</h6>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label mb-1">Asset *</label>
              <button
                type="button"
                className="btn btn-outline-primary w-100"
                onClick={() => setShowAssetModal(true)}
              >
                {formData.idAsset ? "Change Asset" : "Select Asset"}
              </button>
              {formData.idAsset && (
                <div className="mt-2">
                  <small className="text-muted">
                    Selected: {formData.assetDetails || 
                      assets.find(a => a.idAsset === parseInt(formData.idAsset))?.assetDetails || 
                      assets.find(a => a.idAsset === parseInt(formData.idAsset))?.assetTypeName ||
                      availableAssets.find(a => a.idAsset === parseInt(formData.idAsset))?.assetDetails || 
                      "Asset"}
                  </small>
                </div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label mb-1">Asset Type</label>
              <select
                className="form-select"
                value={formData.idAssetType}
                onChange={(e) => handleInputChange("idAssetType", e.target.value)}
                disabled
              >
                <option value="">Select Asset Type</option>
                {assetTypes.map((type) => (
                  <option key={type.idAssetType} value={type.idAssetType}>
                    {type.assetTypeName}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label mb-1">Serial Number</label>
              <input
                type="text"
                className="form-control"
                value={formData.assetSerialNumber}
                onChange={(e) => handleInputChange("assetSerialNumber", e.target.value)}
                disabled
              />
            </div>

            <div className="mb-3">
              <label className="form-label mb-1">Asset Details</label>
              <input
                type="text"
                className="form-control"
                value={formData.assetDetails}
                onChange={(e) => handleInputChange("assetDetails", e.target.value)}
                disabled
              />
            </div>

            <div className="mb-3">
              <label className="form-label mb-1">Average Cost</label>
              <input
                type="text"
                className="form-control"
                value={formData.averageCost}
                onChange={(e) => handleInputChange("averageCost", e.target.value)}
                disabled
              />
            </div>

            <div className="mb-3">
              <label className="form-label mb-1">Status</label>
              <select
                className="form-select"
                value={formData.assetWorkingStatus}
                onChange={(e) => handleInputChange("assetWorkingStatus", e.target.value)}
                disabled
              >
                {assetStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label mb-1">Assigned Till *</label>
              <DatePicker
                selected={formData.assignedTill}
                onChange={(date) => handleInputChange("assignedTill", date)}
                dateFormat="dd-MM-yyyy"
                className="form-control"
                placeholderText="dd-mm-yyyy"
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                wrapperClassName="d-block"
                minDate={new Date()}
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
              <button className="btn btn-primary" onClick={handleAssign} disabled={loading}>
              {loading ? "Saving..." : editingId ? "Update" : "Save"}
              </button>
              <button className="btn btn-outline-secondary" onClick={handleReset} disabled={loading}>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Selection Modal */}
      <Modal
        show={showAssetModal}
        onHide={() => setShowAssetModal(false)}
        size="xl"
        aria-labelledby="asset-selection-modal"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title id="asset-selection-modal">Select Asset</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {availableAssets.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Asset Type</th>
                    <th>Serial Number</th>
                    <th>Details</th>
                    <th>Cost (G$)</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {availableAssets.map((asset) => {
                    const assetType = assetTypes.find(
                      (type) => type.idAssetType === asset.idAssetType
                    );
                    return (
                      <tr
                        key={asset.idAsset}
                        onMouseEnter={() => setHoveredAssetId(asset.idAsset)}
                        onMouseLeave={() => setHoveredAssetId(null)}
                        style={{ cursor: "pointer" }}
                      >
                        <td>{assetType?.assetTypeName || asset.idAssetType || "-"}</td>
                        <td>{asset.assetSerialNumber || "-"}</td>
                        <td>{asset.assetDetails || "-"}</td>
                        <td>
                          {asset.averageCost
                            ? `${parseInt(asset.averageCost).toLocaleString("en-US")}`
                            : "-"}
                        </td>
                        <td>{asset.assetWorkingStatus || "-"}</td>
                        <td>
                          {hoveredAssetId === asset.idAsset && (
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleAssetSelect(asset.idAsset.toString())}
                            >
                              Add
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted">No items available</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowAssetModal(false)}
          >
            Close
          </button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showConfirmModal}
        onHide={() => {
          setShowConfirmModal(false);
          setSelectedAssetId(null);
          setSelectedAssetAssignmentId(null);
          setReturnReason("");
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
          <div className="mb-3">
            <p className="mb-2">Are you sure you want to return this asset?</p>
            <label className="form-label mb-1">Reason *</label>
            <textarea
              className="form-control"
              rows="3"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="Enter reason for returning the asset"
              autoFocus
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-secondary px-3"
            onClick={() => {
              setShowConfirmModal(false);
              setSelectedAssetId(null);
              setSelectedAssetAssignmentId(null);
              setReturnReason("");
            }}
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

export default Assets;
