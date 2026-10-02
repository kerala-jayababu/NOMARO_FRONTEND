import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Card from "../../components/card";
import Button from "../../components/button";
import Input from "../../components/input";
import Dropdown from "../../components/Dropdown";
import Grid from "../../components/grid";
import NavTabButton from "../../components/navbarButton";
import {
  fetchExitReasons,
  addUpdateExitReason,
  fetchExitTypes,
  addUpdateExitType,
  fetchNoticePolicies,
  addUpdateNoticePolicy,
  fetchClearanceTemplates,
  addUpdateClearanceTemplate,
  fetchDepartmentList,
  fetchClearanceTemplateDepartments,
  addUpdateClearanceTemplateDepartments,
  clearTemplateDepartments,
} from "../../redux/reducers/offboardingSetup";

const OffboardingSetup = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("#navs-top-exit-reasons");
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddChecklistModal, setShowAddChecklistModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const {
    exitReasons,
    exitTypes,
    noticePolicies,
    clearanceTemplates,
    departments,
    templateDepartments,
  } = useSelector((state) => state.offboardingSetup);

  useEffect(() => {
    dispatch(fetchExitReasons());
    dispatch(fetchExitTypes());
    dispatch(fetchNoticePolicies());
    dispatch(fetchClearanceTemplates());
    dispatch(fetchDepartmentList());
  }, [dispatch]);

  const handleTabClick = (target) => {
    setActiveTab(target);
  };

  const handleViewChecklist = (template) => {
    setSelectedTemplate(template);
    setShowViewModal(true);
  };

  const handleAddChecklist = (template) => {
    setSelectedTemplate(template);
    setShowAddChecklistModal(true);
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="pb-3">
        <h5 className="m-0">Offboarding Setup</h5>
      </div>

      <div className="row">
        <div className="col-xl-12">
          <div className="nav-align-top mb-4">
            {/* Tab Navigation */}
            <ul className="nav nav-tabs" role="tablist">
              <NavTabButton
                id="exitReasonsTab"
                label="Exit Reasons"
                target="#navs-top-exit-reasons"
                isActive={activeTab === "#navs-top-exit-reasons"}
                onClick={() => handleTabClick("#navs-top-exit-reasons")}
              />
              <NavTabButton
                id="exitTypesTab"
                label="Exit Types"
                target="#navs-top-exit-types"
                isActive={activeTab === "#navs-top-exit-types"}
                onClick={() => handleTabClick("#navs-top-exit-types")}
              />
              <NavTabButton
                id="noticePolicyTab"
                label="Notice Policy"
                target="#navs-top-notice-policy"
                isActive={activeTab === "#navs-top-notice-policy"}
                onClick={() => handleTabClick("#navs-top-notice-policy")}
              />
              <NavTabButton
                id="clearanceTemplatesTab"
                label="Clearance Templates"
                target="#navs-top-clearance-templates"
                isActive={activeTab === "#navs-top-clearance-templates"}
                onClick={() => handleTabClick("#navs-top-clearance-templates")}
              />
            </ul>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === "#navs-top-exit-reasons" && (
                <div
                  className="tab-pane fade show active"
                  id="navs-top-exit-reasons"
                  role="tabpanel"
                >
                  <ExitReasonsTab
                    exitReasons={exitReasons}
                    dispatch={dispatch}
                  />
                </div>
              )}

              {activeTab === "#navs-top-exit-types" && (
                <div
                  className="tab-pane fade show active"
                  id="navs-top-exit-types"
                  role="tabpanel"
                >
                  <ExitTypesTab
                    exitTypes={exitTypes}
                    dispatch={dispatch}
                  />
                </div>
              )}

              {activeTab === "#navs-top-notice-policy" && (
                <div
                  className="tab-pane fade show active"
                  id="navs-top-notice-policy"
                  role="tabpanel"
                >
                  <NoticePolicyTab
                    noticePolicies={noticePolicies}
                    dispatch={dispatch}
                  />
                </div>
              )}

              {activeTab === "#navs-top-clearance-templates" && (
                <div
                  className="tab-pane fade show active"
                  id="navs-top-clearance-templates"
                  role="tabpanel"
                >
                  <ClearanceTemplatesTab
                    clearanceTemplates={clearanceTemplates}
                    dispatch={dispatch}
                    onViewChecklist={handleViewChecklist}
                    onAddChecklist={handleAddChecklist}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View Checklist Modal */}
      {showViewModal && selectedTemplate && (
        <ViewChecklistModal
          template={selectedTemplate}
          departments={departments}
          templateDepartments={templateDepartments}
          onClose={() => {
            setShowViewModal(false);
            setSelectedTemplate(null);
            dispatch(clearTemplateDepartments());
          }}
          dispatch={dispatch}
        />
      )}

      {/* Add Checklist Modal */}
      {showAddChecklistModal && selectedTemplate && (
        <AddChecklistModal
          template={selectedTemplate}
          departments={departments}
          templateDepartments={templateDepartments}
          onClose={() => {
            setShowAddChecklistModal(false);
            setSelectedTemplate(null);
            dispatch(clearTemplateDepartments());
          }}
          dispatch={dispatch}
        />
      )}
    </div>
  );
};

// Exit Reasons Tab Component
const ExitReasonsTab = ({ exitReasons, dispatch }) => {
  const [formData, setFormData] = useState({
    reasonCode: "",
    reasonName: "",
    isActive: true,
  });
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the data array from the response
  const exitReasonsData = exitReasons?.data || [];

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.reasonCode.trim()) {
      newErrors.reasonCode = "Reason Code is required";
    }
    if (!formData.reasonName.trim()) {
      newErrors.reasonName = "Reason Name is required";
    }

    // Check for duplicate code
    const isDuplicate = exitReasonsData.some(
      (reason) =>
        reason.reasonCode.toLowerCase() === formData.reasonCode.toLowerCase() &&
        reason.idExitReason !== editingId
    );
    if (isDuplicate) {
      newErrors.reasonCode = "Reason Code already exists";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        idExitReason: editingId || 0,
        reasonCode: formData.reasonCode,
        reasonName: formData.reasonName,
        isActive: formData.isActive,
      };

      const resultAction = await dispatch(addUpdateExitReason(payload));

      if (resultAction.payload && resultAction.payload.success) {
        toast.success(
          isEditing
            ? "Exit Reason updated successfully!"
            : "Exit Reason added successfully!"
        );
        handleReset();
        dispatch(fetchExitReasons());
      }
    } catch (error) {
      console.error("Error processing exit reason:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      reasonCode: "",
      reasonName: "",
      isActive: true,
    });
    setErrors({});
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEdit = (reason) => {
    setFormData({
      reasonCode: reason.reasonCode,
      reasonName: reason.reasonName,
      isActive: reason.isActive,
    });
    setIsEditing(true);
    setEditingId(reason.idExitReason);
  };

  const columns = [
    { key: "reasonCode", label: "Reason Code" },
    { key: "reasonName", label: "Reason Name" },
    {
      key: "isActive",
      label: "Status",
      render: (_, row) => (
        <span
          className={`badge ${
            row.isActive ? "bg-label-success" : "bg-label-warning"
          }`}
        >
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    { key: "actions", label: "Action" },
  ];

  return (
    <div className="row m-0">
      <div className="col-lg-8 p-1">
        <Card title="List of Exit Reasons">
          <Grid
            columns={columns}
            data={exitReasonsData}
            onEditClick={(id) => {
              const reason = exitReasonsData.find(r => r.idExitReason === id);
              if (reason) handleEdit(reason);
            }}
            idKey="idExitReason"
          />
        </Card>
      </div>
      <div className="col-lg-4 p-1">
        <Card title={isEditing ? "Update Exit Reason" : "Add Exit Reason"}>
          <form onSubmit={handleSubmit}>
            <Input
              label="Reason Code"
              name="reasonCode"
              value={formData.reasonCode}
              onChange={(e) => handleInputChange("reasonCode", e.target.value)}
              maxLength="10"
              error={errors.reasonCode}
            />
            <Input
              label="Reason Name"
              name="reasonName"
              value={formData.reasonName}
              onChange={(e) => handleInputChange("reasonName", e.target.value)}
              maxLength="100"
              error={errors.reasonName}
            />
            <Dropdown
              label="Status"
              name="isActive"
              options={[
                { value: true, label: "Active" },
                { value: false, label: "Inactive" },
              ]}
              value={formData.isActive}
              onChange={(e) => handleInputChange("isActive", e.target.value === "true")}
            />
            <div className="mt-3">
              <Button
                type="submit"
                className="btn btn-primary px-4 me-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Loading..." : "Submit"}
              </Button>
              <Button
                type="button"
                className="btn btn-outline-secondary px-4"
                onClick={handleReset}
              >
                Reset
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

// Exit Types Tab Component
const ExitTypesTab = ({ exitTypes, dispatch }) => {
  const [formData, setFormData] = useState({
    typeCode: "",
    typeName: "",
    isActive: true,
  });
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the data array from the response
  const exitTypesData = exitTypes?.data || [];

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.typeCode.trim()) {
      newErrors.typeCode = "Type Code is required";
    }
    if (!formData.typeName.trim()) {
      newErrors.typeName = "Type Name is required";
    }

    // Check for duplicate code
    const isDuplicate = exitTypesData.some(
      (type) =>
        type.typeCode.toLowerCase() === formData.typeCode.toLowerCase() &&
        type.idExitType !== editingId
    );
    if (isDuplicate) {
      newErrors.typeCode = "Type Code already exists";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        idExitType: editingId || 0,
        typeCode: formData.typeCode,
        typeName: formData.typeName,
        isActive: formData.isActive,
      };

      const resultAction = await dispatch(addUpdateExitType(payload));

      if (resultAction.payload && resultAction.payload.success) {
        toast.success(
          isEditing
            ? "Exit Type updated successfully!"
            : "Exit Type added successfully!"
        );
        handleReset();
        dispatch(fetchExitTypes());
      }
    } catch (error) {
      console.error("Error processing exit type:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      typeCode: "",
      typeName: "",
      isActive: true,
    });
    setErrors({});
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEdit = (type) => {
    setFormData({
      typeCode: type.typeCode,
      typeName: type.typeName,
      isActive: type.isActive,
    });
    setIsEditing(true);
    setEditingId(type.idExitType);
  };

  const columns = [
    { key: "typeCode", label: "Type Code" },
    { key: "typeName", label: "Type Name" },
    {
      key: "isActive",
      label: "Status",
      render: (_, row) => (
        <span
          className={`badge ${
            row.isActive ? "bg-label-success" : "bg-label-warning"
          }`}
        >
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    { key: "actions", label: "Action" },
  ];

  return (
    <div className="row m-0">
      <div className="col-lg-8 p-1">
        <Card title="List of Exit Types">
          <Grid
            columns={columns}
            data={exitTypesData}
            onEditClick={(id) => {
              const type = exitTypesData.find(t => t.idExitType === id);
              if (type) handleEdit(type);
            }}
            idKey="idExitType"
          />
        </Card>
      </div>
      <div className="col-lg-4 p-1">
        <Card title={isEditing ? "Update Exit Type" : "Add Exit Type"}>
          <form onSubmit={handleSubmit}>
            <Input
              label="Type Code"
              name="typeCode"
              value={formData.typeCode}
              onChange={(e) => handleInputChange("typeCode", e.target.value)}
              maxLength="10"
              error={errors.typeCode}
            />
            <Input
              label="Type Name"
              name="typeName"
              value={formData.typeName}
              onChange={(e) => handleInputChange("typeName", e.target.value)}
              maxLength="100"
              error={errors.typeName}
            />
            <Dropdown
              label="Status"
              name="isActive"
              options={[
                { value: true, label: "Active" },
                { value: false, label: "Inactive" },
              ]}
              value={formData.isActive}
              onChange={(e) => handleInputChange("isActive", e.target.value === "true")}
            />
            <div className="mt-3">
              <Button
                type="submit"
                className="btn btn-primary px-4 me-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Loading..." : "Submit"}
              </Button>
              <Button
                type="button"
                className="btn btn-outline-secondary px-4"
                onClick={handleReset}
              >
                Reset
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

// Notice Policy Tab Component
const NoticePolicyTab = ({ noticePolicies, dispatch }) => {
  const [formData, setFormData] = useState({
    policyCode: "",
    policyName: "",
    appliesToEmployeeType: "Permanent",
    noticeDays: "",
    isActive: true,
  });
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the data array from the response
  const noticePoliciesData = noticePolicies?.data || [];

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.policyCode.trim()) {
      newErrors.policyCode = "Policy Code is required";
    }
    if (!formData.policyName.trim()) {
      newErrors.policyName = "Policy Name is required";
    }
    if (!formData.noticeDays || formData.noticeDays <= 0) {
      newErrors.noticeDays = "Notice Days must be greater than 0";
    }

    // Check for duplicate policy code
    const isDuplicate = noticePoliciesData.some(
      (policy) =>
        policy.policyCode.toLowerCase() === formData.policyCode.toLowerCase() &&
        policy.idNoticePeriodPolicy !== editingId
    );
    if (isDuplicate) {
      newErrors.policyCode = "Policy Code already exists";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        idNoticePeriodPolicy: editingId || 0,
        policyCode: formData.policyCode,
        policyName: formData.policyName,
        appliesToEmployeeType: formData.appliesToEmployeeType,
        noticeDays: parseInt(formData.noticeDays, 10),
        isActive: formData.isActive,
      };

      const resultAction = await dispatch(addUpdateNoticePolicy(payload));

      if (resultAction.payload && resultAction.payload.success) {
        toast.success(
          isEditing
            ? "Notice Policy updated successfully!"
            : "Notice Policy added successfully!"
        );
        handleReset();
        dispatch(fetchNoticePolicies());
      }
    } catch (error) {
      console.error("Error processing notice policy:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      policyCode: "",
      policyName: "",
      appliesToEmployeeType: "Permanent",
      noticeDays: "",
      isActive: true,
    });
    setErrors({});
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEdit = (policy) => {
    setFormData({
      policyCode: policy.policyCode,
      policyName: policy.policyName,
      appliesToEmployeeType: policy.appliesToEmployeeType,
      noticeDays: policy.noticeDays,
      isActive: policy.isActive,
    });
    setIsEditing(true);
    setEditingId(policy.idNoticePeriodPolicy);
  };

  const columns = [
    { key: "policyCode", label: "Policy Code" },
    { key: "policyName", label: "Policy Name" },
    { key: "appliesToEmployeeType", label: "Applies To" },
    {
      key: "noticeDays",
      label: "Notice Period (Days)",
      render: (_, row) => `${row.noticeDays} Days`,
    },
    {
      key: "isActive",
      label: "Status",
      render: (_, row) => (
        <span
          className={`badge ${
            row.isActive ? "bg-label-success" : "bg-label-warning"
          }`}
        >
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    { key: "actions", label: "Action" },
  ];

  return (
    <div className="row m-0">
      <div className="col-lg-8 p-1">
        <Card title="List of Notice Policies">
          <Grid
            columns={columns}
            data={noticePoliciesData}
            onEditClick={(id) => {
              const policy = noticePoliciesData.find(p => p.idNoticePeriodPolicy === id);
              if (policy) handleEdit(policy);
            }}
            idKey="idNoticePeriodPolicy"
          />
        </Card>
      </div>
      <div className="col-lg-4 p-1">
        <Card title={isEditing ? "Update Notice Policy" : "Add Notice Policy"}>
          <form onSubmit={handleSubmit}>
            <Input
              label="Policy Code"
              name="policyCode"
              value={formData.policyCode}
              onChange={(e) => handleInputChange("policyCode", e.target.value)}
              maxLength="10"
              error={errors.policyCode}
            />
            <Input
              label="Policy Name"
              name="policyName"
              value={formData.policyName}
              onChange={(e) => handleInputChange("policyName", e.target.value)}
              maxLength="100"
              error={errors.policyName}
            />
            <Dropdown
              label="Applies To"
              name="appliesToEmployeeType"
              options={[
                { value: "Permanent", label: "Permanent" },
                { value: "Contract", label: "Contract" },
                { value: "All", label: "All" },
              ]}
              value={formData.appliesToEmployeeType}
              onChange={(e) => handleInputChange("appliesToEmployeeType", e.target.value)}
            />
            <Input
              label="Notice Days"
              name="noticeDays"
              type="number"
              value={formData.noticeDays}
              onChange={(e) => handleInputChange("noticeDays", e.target.value)}
              error={errors.noticeDays}
            />
            <Dropdown
              label="Status"
              name="isActive"
              options={[
                { value: true, label: "Active" },
                { value: false, label: "Inactive" },
              ]}
              value={formData.isActive}
              onChange={(e) => handleInputChange("isActive", e.target.value === "true")}
            />
            <div className="mt-3">
              <Button
                type="submit"
                className="btn btn-primary px-4 me-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Loading..." : "Submit"}
              </Button>
              <Button
                type="button"
                className="btn btn-outline-secondary px-4"
                onClick={handleReset}
              >
                Reset
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

// Clearance Templates Tab Component
const ClearanceTemplatesTab = ({ clearanceTemplates, dispatch, onViewChecklist, onAddChecklist }) => {
  const [formData, setFormData] = useState({
    templateName: "",
    description: "",
    isActive: true,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Get the data array from the response
  const clearanceTemplatesData = clearanceTemplates?.data || [];

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.templateName.trim()) {
      newErrors.templateName = "Template Name is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    // Check for duplicate template name (exclude current editing template)
    const isDuplicate = clearanceTemplatesData.some(
      (template) =>
        template.templateName.toLowerCase() === formData.templateName.toLowerCase() &&
        template.idClearanceTemplate !== editingId
    );
    if (isDuplicate) {
      newErrors.templateName = "Template Name already exists";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        idClearanceTemplate: 0,
        templateName: formData.templateName,
        description: formData.description,
        isActive: formData.isActive,
      };

      const resultAction = await dispatch(addUpdateClearanceTemplate(payload));

      if (resultAction.payload && resultAction.payload.success) {
        toast.success("Clearance Template added successfully!");
        handleReset();
        dispatch(fetchClearanceTemplates());
      }
    } catch (error) {
      console.error("Error adding clearance template:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      templateName: "",
      description: "",
      isActive: true,
    });
    setErrors({});
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEdit = (template) => {
    setFormData({
      templateName: template.templateName,
      description: template.description,
      isActive: template.isActive,
    });
    setIsEditing(true);
    setEditingId(template.idClearanceTemplate);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.templateName.trim()) {
      setErrors({ templateName: "Template Name is required" });
      return;
    }
    if (!formData.description.trim()) {
      setErrors({ description: "Description is required" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        idClearanceTemplate: editingId,
        templateName: formData.templateName,
        description: formData.description,
        isActive: formData.isActive,
      };

      const resultAction = await dispatch(addUpdateClearanceTemplate(payload));

      if (resultAction.payload && resultAction.payload.success) {
        toast.success("Clearance Template updated successfully!");
        handleReset();
        dispatch(fetchClearanceTemplates());
      }
    } catch (error) {
      console.error("Error updating clearance template:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="row m-0">
        <div className="col-lg-9 p-1">
          <Card title="List of Clearance Templates">
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Template Name</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clearanceTemplatesData.map((template) => (
                    <tr key={template.idClearanceTemplate}>
                      <td>{template.templateName}</td>
                      <td>{template.description}</td>
                      <td>
                        <span
                          className={`badge ${
                            template.isActive ? "bg-label-success" : "bg-label-warning"
                          }`}
                        >
                          {template.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-icon me-2"
                          onClick={() => handleEdit(template)}
                          title="Edit Template"
                        >
                          <i className="bx bx-edit"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-icon me-2"
                          onClick={() => onAddChecklist(template)}
                          title="Add Checklist Items"
                        >
                          <i className="bx bx-list-plus"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-icon"
                          onClick={() => onViewChecklist(template)}
                          title="View Details"
                        >
                          <i className="bx bx-show"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        <div className="col-lg-3 p-1">
          <Card title={isEditing ? "Update Clearance Template" : "Add Clearance Template"}>
            <form onSubmit={isEditing ? handleUpdate : handleSubmit}>
              <Input
                label="Template Name"
                name="templateName"
                value={formData.templateName}
                onChange={(e) => handleInputChange("templateName", e.target.value)}
                maxLength="100"
                error={errors.templateName}
              />
              <Input
                label="Description"
                name="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                maxLength="200"
                error={errors.description}
              />
              <Dropdown
                label="Status"
                name="isActive"
                options={[
                  { value: true, label: "Active" },
                  { value: false, label: "Inactive" },
                ]}
                value={formData.isActive}
                onChange={(e) => handleInputChange("isActive", e.target.value === "true")}
              />
              <div className="mt-3">
                <Button
                  type="submit"
                  className="btn btn-primary px-4 me-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Loading..." : "Submit"}
                </Button>
                <Button
                  type="button"
                  className="btn btn-outline-secondary px-4"
                  onClick={handleReset}
                >
                  Reset
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
};

// View Checklist Modal Component
const ViewChecklistModal = ({ template, departments, templateDepartments, onClose, dispatch }) => {
  // Get department data
  const departmentsData = departments?.data || [];

  // Fetch checklist data when modal opens
  React.useEffect(() => {
    if (template?.idClearanceTemplate) {
      dispatch(fetchClearanceTemplateDepartments(template.idClearanceTemplate));
    }
  }, [template, dispatch]);

  React.useEffect(() => {
    const modalElement = document.getElementById("viewChecklistModal");
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement, {
        focus: false,
        backdrop: 'static',
        keyboard: false
      });
      modal.show();

      modalElement.addEventListener("hidden.bs.modal", onClose);
      return () => {
        modal.dispose();
        modalElement.removeEventListener("hidden.bs.modal", onClose);
      };
    }
  }, [onClose]);

  // Get checklist data from API response
  const checklistData = templateDepartments?.data || [];

  // Helper function to get department name by ID
  const getDepartmentName = (idDepartment) => {
    const dept = departmentsData.find((d) => d.idDepartment === idDepartment);
    return dept ? dept.departmentName : "Unknown Department";
  };

  // Group checklist by department
  const groupedChecklist = checklistData.reduce((acc, item) => {
    const deptName = getDepartmentName(item.idDepartment);
    if (!acc[deptName]) {
      acc[deptName] = [];
    }
    acc[deptName].push({
      checkListItem: item.checkListItem,
      isMandatory: item.isMandatory,
    });
    return acc;
  }, {});

  if (!template) return null;

  return (
    <div
      className="modal fade"
      id="viewChecklistModal"
      tabIndex="-1"
      aria-hidden="true"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
    >
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">View Clearance Template</h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <div className="mb-3">
              <h6 className="fw-bold">Template Name</h6>
              <p>{template.templateName}</p>
            </div>
            <div className="mb-3">
              <h6 className="fw-bold">Description</h6>
              <p>{template.description}</p>
            </div>

            <h6 className="fw-bold mb-3">Checklist by Department</h6>
            {Object.keys(groupedChecklist).length === 0 ? (
              <div className="alert alert-info">
                No checklist items available.
              </div>
            ) : (
              Object.entries(groupedChecklist).map(([dept, items]) => (
                <div key={dept} className="mb-4">
                  <h6 className="text-primary">{dept}</h6>
                  <ul className="list-group">
                    {items.map((item, idx) => (
                      <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                        <span>
                          <i className="bx bx-check me-2 text-success"></i>
                          {item.checkListItem}
                        </span>
                        {item.isMandatory && (
                          <span className="badge bg-label-danger">Mandatory</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary"
              data-bs-dismiss="modal"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add Checklist Modal Component (readonly template name/description)
const AddChecklistModal = ({ template, departments, templateDepartments, onClose, dispatch }) => {
  const [checklist, setChecklist] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get department options from API
  const departmentsData = departments?.data || [];
  const departmentOptions = departmentsData.map((dept) => ({
    value: dept.idDepartment,
    label: dept.departmentName,
  }));

  // Fetch existing checklist items when modal opens
  React.useEffect(() => {
    if (template?.idClearanceTemplate) {
      dispatch(fetchClearanceTemplateDepartments(template.idClearanceTemplate));
    }
  }, [template, dispatch]);

  // Initialize checklist from templateDepartments API response
  React.useEffect(() => {
    const checklistData = templateDepartments?.data || [];
    if (checklistData.length > 0) {
      setChecklist(
        checklistData.map((item) => ({
          idTemplateDept: item.idTemplateDept,
          idDepartment: item.idDepartment,
          checkListItem: item.checkListItem,
          isMandatory: item.isMandatory,
        }))
      );
    } else {
      setChecklist([]);
    }
  }, [templateDepartments]);

  React.useEffect(() => {
    const modalElement = document.getElementById("addChecklistModal");
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement, {
        focus: false,
        backdrop: 'static',
        keyboard: false
      });
      modal.show();

      modalElement.addEventListener("hidden.bs.modal", onClose);
      return () => {
        modal.dispose();
        modalElement.removeEventListener("hidden.bs.modal", onClose);
      };
    }
  }, [onClose]);

  const handleAddItem = () => {
    const defaultDeptId = departmentOptions.length > 0 ? departmentOptions[0].value : 0;
    setChecklist([
      ...checklist,
      {
        idTemplateDept: 0,
        idDepartment: defaultDeptId,
        checkListItem: "",
        isMandatory: true,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setChecklist(
      checklist.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSave = async () => {
    // Filter out empty items
    const validChecklist = checklist.filter(
      (item) => item.checkListItem.trim() !== ""
    );

    if (validChecklist.length === 0) {
      toast.warning("Please add at least one checklist item.");
      return;
    }

    // Build payload for API
    const payload = validChecklist.map((item) => ({
      idTemplateDept: item.idTemplateDept || 0,
      idClearanceTemplate: template.idClearanceTemplate,
      idDepartment: parseInt(item.idDepartment, 10),
      checkListItem: item.checkListItem,
      isMandatory: item.isMandatory,
      deptEmployees: [],
    }));

    setIsSubmitting(true);
    try {
      const resultAction = await dispatch(addUpdateClearanceTemplateDepartments(payload));

      if (resultAction.payload && resultAction.payload.success) {
        toast.success("Checklist items saved successfully!");
        onClose();
      }
    } catch (error) {
      console.error("Error saving checklist items:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!template) return null;

  return (
    <div
      className="modal fade"
      id="addChecklistModal"
      tabIndex="-1"
      aria-hidden="true"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
    >
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Add Checklist Items</h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-bold">Template Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={template.templateName}
                    readOnly
                    disabled
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-bold">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    value={template.description}
                    readOnly
                    disabled
                  />
                </div>
              </div>
            </div>

            <hr className="my-4" />

            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0 fw-bold">Checklist Items</h6>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={handleAddItem}
              >
                <i className="bx bx-plus"></i> Add Item
              </button>
            </div>

            {checklist.length === 0 ? (
              <div className="alert alert-info" role="alert">
                <i className="bx bx-info-circle me-2"></i>
                No checklist items yet. Click "Add Item" to get started.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-bordered table-sm">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: "30%" }}>Department</th>
                      <th style={{ width: "45%" }}>Checklist Item</th>
                      <th style={{ width: "15%", textAlign: "center" }}>Mandatory</th>
                      <th style={{ width: "10%", textAlign: "center" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checklist.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={item.idDepartment}
                            onChange={(e) =>
                              handleItemChange(index, "idDepartment", e.target.value)
                            }
                          >
                            {departmentOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={item.checkListItem}
                            onChange={(e) =>
                              handleItemChange(index, "checkListItem", e.target.value)
                            }
                            placeholder="Enter checklist item"
                          />
                        </td>
                        <td className="text-center">
                          <div className="form-check d-flex justify-content-center">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={item.isMandatory}
                              onChange={(e) =>
                                handleItemChange(index, "isMandatory", e.target.checked)
                              }
                            />
                          </div>
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-sm btn-danger btn-icon"
                            onClick={() => handleRemoveItem(index)}
                            title="Remove"
                          >
                            <i className="bx bx-x"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary"
              data-bs-dismiss="modal"
            >
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              <i className="bx bx-save me-1"></i> {isSubmitting ? "Saving..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OffboardingSetup;
