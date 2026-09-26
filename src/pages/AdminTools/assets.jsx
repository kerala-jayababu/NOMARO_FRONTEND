import React, { useState, useEffect, useRef } from 'react';
import NavTabButton from '../../components/navbarButton';
import CommonService from '../../core/services/CommonService';
import { showToast } from '../../components/ToastNotifications/toastUtils';
import { NumericFormat } from 'react-number-format';

function Assets() {
  const [activeTab, setActiveTab] = useState("#navs-top-asset-types");
  
  // Asset Types state
  const [assetTypes, setAssetTypes] = useState([]);
  const [assetTypeForm, setAssetTypeForm] = useState({
    idAssetType: 0,
    assetTypeName: ''
  });
  const [loadingAssetTypes, setLoadingAssetTypes] = useState(false);
  const [editingAssetType, setEditingAssetType] = useState(null);

  // Assets state
  const [assets, setAssets] = useState([]);
  const [assetForm, setAssetForm] = useState({
    idAsset: 0,
    idAssetType: 0,
    assetSerialNumber: '',
    assetDetails: '',
    averageCost: 0,
    assetWorkingStatus: '',
    isAllocated: false,
    assetTypeName: ''
  });
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [searchText, setSearchText] = useState('');

  const assetTypeNameRef = useRef(null);
  const assetSerialNumberRef = useRef(null);

  useEffect(() => {
    if (activeTab === "#navs-top-asset-types") {
      fetchAssetTypes();
    } else if (activeTab === "#navs-top-assets") {
      fetchAssets();
    }
  }, [activeTab]);

  // Asset Types functions
  const fetchAssetTypes = async () => {
    setLoadingAssetTypes(true);
    try {
      const response = await CommonService.getAssetTypes();
      if (response.error) {
        showToast('Failed to fetch asset types', 'error');
        setAssetTypes([]);
      } else {
        // Ensure we always have an array
        const data = response.data;
        if (Array.isArray(data)) {
          setAssetTypes(data);
        } else if (data && Array.isArray(data.data)) {
          setAssetTypes(data.data);
        } else {
          setAssetTypes([]);
        }
      }
    } catch (error) {
      showToast('Failed to fetch asset types', 'error');
      setAssetTypes([]);
    } finally {
      setLoadingAssetTypes(false);
    }
  };

  const handleAssetTypeChange = (e) => {
    setAssetTypeForm({
      ...assetTypeForm,
      assetTypeName: e.target.value
    });
  };

  const handleAssetTypeSubmit = async (e) => {
    e.preventDefault();
    
    if (!assetTypeForm.assetTypeName || assetTypeForm.assetTypeName.trim() === '') {
      showToast('Please enter asset type name', 'error');
      assetTypeNameRef.current?.focus();
      return;
    }

    setLoadingAssetTypes(true);
    try {
      const payload = [{
        idAssetType: assetTypeForm.idAssetType,
        assetTypeName: assetTypeForm.assetTypeName.trim()
      }];

      const response = await CommonService.addOrUpdateAssetTypes(payload);
      if (response.error) {
        showToast('Failed to save asset type', 'error');
      } else {
        showToast(editingAssetType ? 'Asset type updated successfully' : 'Asset type added successfully', 'success');
        resetAssetTypeForm();
        fetchAssetTypes();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      showToast('Failed to save asset type', 'error');
    } finally {
      setLoadingAssetTypes(false);
    }
  };

  const handleEditAssetType = (assetType) => {
    setAssetTypeForm({
      idAssetType: assetType.idAssetType || 0,
      assetTypeName: assetType.assetTypeName || ''
    });
    setEditingAssetType(assetType);
  };

  const resetAssetTypeForm = () => {
    setAssetTypeForm({
      idAssetType: 0,
      assetTypeName: ''
    });
    setEditingAssetType(null);
  };

  // Assets functions
  const fetchAssets = async () => {
    setLoadingAssets(true);
    try {
      const response = await CommonService.getAssets(searchText);
      if (response.error) {
        showToast('Failed to fetch assets', 'error');
        setAssets([]);
      } else {
        // Ensure we always have an array
        const data = response.data;
        if (Array.isArray(data)) {
          setAssets(data);
        } else if (data && Array.isArray(data.data)) {
          setAssets(data.data);
        } else {
          setAssets([]);
        }
      }
    } catch (error) {
      showToast('Failed to fetch assets', 'error');
      setAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  };

  useEffect(() => {
    if (activeTab === "#navs-top-assets") {
      const debounceTimer = setTimeout(() => {
        fetchAssets();
      }, 500);
      return () => clearTimeout(debounceTimer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, activeTab]);

  const handleAssetChange = (field, value) => {
    setAssetForm({
      ...assetForm,
      [field]: value
    });
  };

  const handleAssetSubmit = async (e) => {
    e.preventDefault();
    
    if (!assetForm.idAssetType || assetForm.idAssetType === 0) {
      showToast('Please select asset type', 'error');
      return;
    }
    if (!assetForm.assetSerialNumber || assetForm.assetSerialNumber.trim() === '') {
      showToast('Please enter asset serial number', 'error');
      assetSerialNumberRef.current?.focus();
      return;
    }
    if (!assetForm.assetDetails || assetForm.assetDetails.trim() === '') {
      showToast('Please enter asset details', 'error');
      return;
    }
    if (!assetForm.assetWorkingStatus || assetForm.assetWorkingStatus === '') {
      showToast('Please select asset working status', 'error');
      return;
    }

    setLoadingAssets(true);
    try {
      const payload = {
        idAsset: assetForm.idAsset,
        idAssetType: assetForm.idAssetType,
        assetSerialNumber: assetForm.assetSerialNumber.trim(),
        assetDetails: assetForm.assetDetails.trim(),
        averageCost: parseFloat(assetForm.averageCost) || 0,
        assetWorkingStatus: assetForm.assetWorkingStatus,
        isAllocated: assetForm.isAllocated,
        assetTypeName: assetForm.assetTypeName
      };

      const response = await CommonService.addOrUpdateAssets([payload]);
      if (response.error) {
        showToast('Failed to save asset', 'error');
      } else {
        showToast(editingAsset ? 'Asset updated successfully' : 'Asset added successfully', 'success');
        resetAssetForm();
        fetchAssets();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      showToast('Failed to save asset', 'error');
    } finally {
      setLoadingAssets(false);
    }
  };

  const handleEditAsset = (asset) => {
    setAssetForm({
      idAsset: asset.idAsset || 0,
      idAssetType: asset.idAssetType || 0,
      assetSerialNumber: asset.assetSerialNumber || '',
      assetDetails: asset.assetDetails || '',
      averageCost: asset.averageCost || 0,
      assetWorkingStatus: asset.assetWorkingStatus || '',
      isAllocated: asset.isAllocated || false,
      assetTypeName: asset.assetTypeName || ''
    });
    setEditingAsset(asset);
  };

  const resetAssetForm = () => {
    setAssetForm({
      idAsset: 0,
      idAssetType: 0,
      assetSerialNumber: '',
      assetDetails: '',
      averageCost: 0,
      assetWorkingStatus: '',
      isAllocated: false,
      assetTypeName: ''
    });
    setEditingAsset(null);
  };

  const handleTabClick = (target) => {
    setActiveTab(target);
    if (target === "#navs-top-asset-types") {
      resetAssetTypeForm();
    } else {
      resetAssetForm();
    }
  };

  // Load asset types for dropdown when assets tab is active
  useEffect(() => {
    if (activeTab === "#navs-top-assets") {
      fetchAssetTypes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="pb-3">
        <h5 className="m-0">Asset Management</h5>
      </div>

      <div className="nav-align-top mb-4">
        {/* Tab Navigation */}
        <ul className="nav nav-tabs" role="tablist">
          <NavTabButton
            id="assetTypesTab"
            label="Asset Types"
            target="#navs-top-asset-types"
            isActive={activeTab === "#navs-top-asset-types"}
            onClick={() => handleTabClick("#navs-top-asset-types")}
          />
          <NavTabButton
            id="assetsTab"
            label="Assets"
            target="#navs-top-assets"
            isActive={activeTab === "#navs-top-assets"}
            onClick={() => handleTabClick("#navs-top-assets")}
          />
        </ul>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Asset Types Tab */}
          <div
            className={`tab-pane fade ${activeTab === "#navs-top-asset-types" ? "show active" : ""}`}
            id="navs-top-asset-types"
            role="tabpanel"
          >
            <div className="row mt-3">
              <div className="col-lg-8">
                <div className="card">
                  <div className="card-header d-flex align-items-center justify-content-between pb-3">
                    <h5 className="m-0">Asset Types List</h5>
                  </div>
                  <div className="card-body">
                    {loadingAssetTypes ? (
                      <div className="text-center p-3">Loading...</div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Asset Type Name</th>
                              <th className="text-end">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {!Array.isArray(assetTypes) || assetTypes.length === 0 ? (
                              <tr>
                                <td colSpan="2" className="text-center">
                                  <div className="Nodatafound_box">
                                    <h6><i className="bx bx-search"></i> No data available!</h6>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              assetTypes.map((assetType) => (
                                <tr key={assetType.idAssetType}>
                                  <td>{assetType.assetTypeName}</td>
                                  <td className="text-end">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
                                      onClick={() => handleEditAssetType(assetType)}
                                      title="Edit"
                                    >
                                      <span className="tf-icons bx bx-pencil"></span>
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-lg-4">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      {editingAssetType ? 'Update Asset Type' : 'Add Asset Type'}
                    </h5>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleAssetTypeSubmit}>
                      <div className="mb-3">
                        <label className="form-label">Asset Type Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={assetTypeForm.assetTypeName}
                          onChange={handleAssetTypeChange}
                          placeholder="Enter asset type name"
                          ref={assetTypeNameRef}
                          required
                        />
                      </div>
                      <div className="text-center">
                        <button
                          type="submit"
                          className="btn btn-primary px-4 me-2"
                          disabled={loadingAssetTypes}
                        >
                          {loadingAssetTypes ? 'Saving...' : editingAssetType ? 'Update' : 'Submit'}
                        </button>
                        {editingAssetType && (
                          <button
                            type="button"
                            className="btn btn-outline-secondary px-4"
                            onClick={resetAssetTypeForm}
                            disabled={loadingAssetTypes}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Assets Tab */}
          <div
            className={`tab-pane fade ${activeTab === "#navs-top-assets" ? "show active" : ""}`}
            id="navs-top-assets"
            role="tabpanel"
          >
            <div className="row mt-3">
              <div className="col-lg-8">
                <div className="card">
                  <div className="card-header d-flex align-items-center justify-content-between pb-3">
                    <h5 className="m-0">Assets List</h5>
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        style={{ width: '250px' }}
                        placeholder="Search assets..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="card-body">
                    {loadingAssets ? (
                      <div className="text-center p-3">Loading...</div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Serial Number</th>
                              <th>Asset Type</th>
                              <th>Details</th>
                              <th className="text-end">Cost</th>
                              <th>Status</th>
                              <th>Allocated</th>
                              <th className="text-end">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {!Array.isArray(assets) || assets.length === 0 ? (
                              <tr>
                                <td colSpan="7" className="text-center">
                                  <div className="Nodatafound_box">
                                    <h6><i className="bx bx-search"></i> No data available!</h6>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              assets.map((asset) => (
                                <tr key={asset.idAsset}>
                                  <td>{asset.assetSerialNumber}</td>
                                  <td>{asset.assetTypeName || 'N/A'}</td>
                                  <td>{asset.assetDetails}</td>
                                  <td className="text-end">
                                    {new Intl.NumberFormat("en-IN", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }).format(asset.averageCost || 0)}
                                  </td>
                                  <td>{asset.assetWorkingStatus === 'NotWorking' ? 'Not Working' : asset.assetWorkingStatus}</td>
                                  <td>
                                    <span className={`badge ${asset.isAllocated ? 'bg-label-success' : 'bg-label-secondary'}`}>
                                      {asset.isAllocated ? 'Yes' : 'No'}
                                    </span>
                                  </td>
                                  <td className="text-end">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
                                      onClick={() => handleEditAsset(asset)}
                                      title="Edit"
                                    >
                                      <span className="tf-icons bx bx-pencil"></span>
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-lg-4">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      {editingAsset ? 'Update Asset' : 'Add Asset'}
                    </h5>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleAssetSubmit}>
                      <div className="mb-3">
                        <label className="form-label">Asset Type</label>
                        <select
                          className="form-select"
                          value={assetForm.idAssetType || 0}
                          onChange={(e) => {
                            const selectedValue = parseInt(e.target.value) || 0;
                            const selectedType = Array.isArray(assetTypes) && selectedValue > 0 
                              ? assetTypes.find(t => t.idAssetType === selectedValue) 
                              : null;
                            
                            setAssetForm(prev => ({
                              ...prev,
                              idAssetType: selectedValue,
                              assetTypeName: selectedType?.assetTypeName || ''
                            }));
                          }}
                          required
                        >
                          <option value={0}>Select Asset Type</option>
                          {Array.isArray(assetTypes) && assetTypes.length > 0 ? assetTypes.map((type) => (
                            <option key={type.idAssetType} value={type.idAssetType}>
                              {type.assetTypeName}
                            </option>
                          )) : (
                            <option disabled>No asset types available. Please add asset types first.</option>
                          )}
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Serial Number</label>
                        <input
                          type="text"
                          className="form-control"
                          value={assetForm.assetSerialNumber}
                          onChange={(e) => handleAssetChange('assetSerialNumber', e.target.value)}
                          placeholder="Enter serial number"
                          ref={assetSerialNumberRef}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Asset Details</label>
                        <textarea
                          className="form-control"
                          value={assetForm.assetDetails}
                          onChange={(e) => handleAssetChange('assetDetails', e.target.value)}
                          placeholder="Enter asset details"
                          rows="3"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Average Cost</label>
                        <NumericFormat
                          className="form-control"
                          value={assetForm.averageCost}
                          onValueChange={(values) => handleAssetChange('averageCost', values.floatValue || 0)}
                          decimalScale={2}
                          allowNegative={false}
                          thousandSeparator={true}
                          allowLeadingZeros={false}
                          placeholder="Enter cost"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Working Status</label>
                        <select
                          className="form-select"
                          value={assetForm.assetWorkingStatus}
                          onChange={(e) => handleAssetChange('assetWorkingStatus', e.target.value)}
                          required
                        >
                          <option value="">Select Working Status</option>
                          <option value="Working">Working</option>
                          <option value="NotWorking">Not Working</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={assetForm.isAllocated}
                            onChange={(e) => handleAssetChange('isAllocated', e.target.checked)}
                            id="isAllocated"
                          />
                          <label className="form-check-label" htmlFor="isAllocated">
                            Is Allocated
                          </label>
                        </div>
                      </div>
                      <div className="text-center">
                        <button
                          type="submit"
                          className="btn btn-primary px-4 me-2"
                          disabled={loadingAssets}
                        >
                          {loadingAssets ? 'Saving...' : editingAsset ? 'Update' : 'Submit'}
                        </button>
                        {editingAsset && (
                          <button
                            type="button"
                            className="btn btn-outline-secondary px-4"
                            onClick={resetAssetForm}
                            disabled={loadingAssets}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Assets;
