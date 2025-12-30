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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  
  // Refs to track loading state and prevent duplicate calls
  const assetTypesLoadedRef = useRef(false);
  const availableAssetsLoadedRef = useRef(false);
  const employeeAssetsLoadedRef = useRef(null);

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

  // Load static data once on mount
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

  // Load employee assets when id changes
  useEffect(() => {
    if (!id) return;
    
    if (employeeAssetsLoadedRef.current !== id) {
      employeeAssetsLoadedRef.current = id;
      loadEmployeeAssets();
    }
    
    return () => {
      // Reset ref when component unmounts to allow fresh load on next mount
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
      // Reset form if no asset selected
      handleReset();
      return;
    }

    // Find the selected asset from availableAssets
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

      const result = await EmployeeManagementService.assignAssetToEmployee(payload);
      setLoading(false);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Asset assigned successfully");
        handleReset();
        loadEmployeeAssets();
        loadAvailableAssets();
      }
    } catch (error) {
      setLoading(false);
      toast.error("Failed to assign asset");
    }
  };

  const handleEdit = (asset) => {
    setEditingId(asset.idAsset);
    setFormData({
      idAsset: asset.idAsset?.toString() || "",
      idAssetType: asset.idAssetType?.toString() || "",
      assetSerialNumber: asset.assetSerialNumber || "",
      assetDetails: asset.assetDetails || "",
      averageCost: asset.averageCost?.toString() || "",
      assetWorkingStatus: asset.assetWorkingStatus || "Working",
      assignedTill: asset.assignedTillDate ? moment(asset.assignedTillDate).toDate() : null,
      remarks: asset.remarks || "",
    });
  };

  const handleDelete = async (assetId) => {
    setSelectedAssetId(assetId);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedAssetId) return;

    try {
      showLoader();
      const payload = {
        idAsset: selectedAssetId,
        idEmployee: parseInt(id),
        returnDate: new Date(),
        remarks: "Returned by employee",
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
      }
      setShowConfirmModal(false);
      setSelectedAssetId(null);
    } catch (error) {
      hideLoader();
      toast.error("Failed to return asset");
      setShowConfirmModal(false);
      setSelectedAssetId(null);
    }
  };

  const handleReset = () => {
    setEditingId(null);
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
    <div className="row">
      <div className="col-lg-8">
        <div>
          <div>
            <h6 className="mb-0">Assets</h6>
          </div>
          <div className="p-3">
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
                            onClick={() => handleDelete(asset.idAsset)}
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
              <select
                className="form-select"
                value={formData.idAsset}
                onChange={(e) => handleAssetSelect(e.target.value)}
              >
                <option value="">Select Asset</option>
                {availableAssets.map((asset) => (
                  <option key={asset.idAsset} value={asset.idAsset}>
                    {asset.assetDetails}
                  </option>
                ))}
              </select>
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
              {loading ? "Saving..." : "Save"}
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
          setSelectedAssetId(null);
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
            Are you sure you want to return this asset?
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-secondary px-3"
            onClick={() => {
              setShowConfirmModal(false);
              setSelectedAssetId(null);
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

export default Assets;
