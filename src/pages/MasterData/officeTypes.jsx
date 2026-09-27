import React, { useEffect, useMemo, useState } from "react";
import Card from "../../components/card";
import Button from "../../components/button";
import Input from "../../components/input";
import Dropdown from "../../components/dropdown";
import Grid from "../../components/grid";
import OfficeManagementService from "../../core/services/OfficeManagementService";
import { showToast } from "../../components/ToastNotifications/toastUtils";

const initialFormData = {
  officeTypeCode: "",
  officeTypeName: "",
  hierarchyLevel: "",
  isActive: true,
};

function OfficeTypes() {
  const [officeTypes, setOfficeTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOfficeTypes();
  }, []);

  const fetchOfficeTypes = async () => {
    setLoading(true);
    try {
      const response = await OfficeManagementService.getOfficeTypes();
      if (response.error) {
        showToast(response.error, "error");
        setOfficeTypes([]);
      } else {
        setOfficeTypes(Array.isArray(response.data?.data) ? response.data.data : []);
      }
    } catch (error) {
      showToast("Failed to fetch office types", "error");
      setOfficeTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredOfficeTypes = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    if (!text) return officeTypes;
    return officeTypes.filter(
      (type) =>
        type.officeTypeCode?.toLowerCase().includes(text) ||
        type.officeTypeName?.toLowerCase().includes(text)
    );
  }, [officeTypes, searchText]);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.officeTypeCode.trim()) {
      newErrors.officeTypeCode = "Office Type Code is required";
    }
    if (!formData.officeTypeName.trim()) {
      newErrors.officeTypeName = "Office Type Name is required";
    }
    if (!formData.hierarchyLevel || Number(formData.hierarchyLevel) <= 0) {
      newErrors.hierarchyLevel = "Hierarchy Level must be greater than 0";
    }

    // Check for duplicate code
    const isDuplicate = officeTypes.some(
      (type) =>
        type.officeTypeCode?.toLowerCase() === formData.officeTypeCode.trim().toLowerCase() &&
        type.idOfficeType !== editingId
    );
    if (isDuplicate) {
      newErrors.officeTypeCode = "Office Type Code already exists";
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
        idOfficeType: editingId || 0,
        officeTypeCode: formData.officeTypeCode.trim(),
        officeTypeName: formData.officeTypeName.trim(),
        hierarchyLevel: Number(formData.hierarchyLevel),
        isActive: formData.isActive,
      };

      const response = await OfficeManagementService.addOrUpdateOfficeTypes(payload);
      if (response.error) {
        showToast(response.error, "error");
      } else {
        showToast(
          isEditing ? "Office Type updated successfully!" : "Office Type added successfully!",
          "success"
        );
        handleReset();
        fetchOfficeTypes();
      }
    } catch (error) {
      showToast("Failed to save office type", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setErrors({});
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEdit = (type) => {
    setFormData({
      officeTypeCode: type.officeTypeCode || "",
      officeTypeName: type.officeTypeName || "",
      hierarchyLevel: String(type.hierarchyLevel ?? ""),
      isActive: type.isActive,
    });
    setErrors({});
    setIsEditing(true);
    setEditingId(type.idOfficeType);
  };

  const columns = [
    { key: "officeTypeCode", label: "Type Code" },
    { key: "officeTypeName", label: "Type Name" },
    { key: "hierarchyLevel", label: "Hierarchy Level" },
    {
      key: "isActive",
      label: "Status",
      render: (_, row) => (
        <span className={`badge ${row.isActive ? "bg-label-success" : "bg-label-warning"}`}>
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    { key: "actions", label: "Action", headerStyle: { textAlign: "right" } },
  ];

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-8 p-1">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">List of Office Types</h5>
              <div className="list_menu">
                <div className="list_searchbox">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search"
                    maxLength={30}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                  <i className="bx bx-search"></i>
                </div>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center p-3">Loading...</div>
              ) : (
                <Grid
                  columns={columns}
                  data={filteredOfficeTypes}
                  onEditClick={(id) => {
                    const type = officeTypes.find((t) => t.idOfficeType === id);
                    if (type) handleEdit(type);
                  }}
                  idKey="idOfficeType"
                />
              )}
            </div>
          </div>
        </div>
        <div className="col-lg-4 p-1">
          <Card title={isEditing ? "Update Office Type" : "Add Office Type"}>
            <form onSubmit={handleSubmit}>
              <Input
                label="Office Type Code *"
                name="officeTypeCode"
                value={formData.officeTypeCode}
                onChange={(e) => handleInputChange("officeTypeCode", e.target.value.toUpperCase())}
                maxLength="20"
                error={errors.officeTypeCode}
                isInvalid={!!errors.officeTypeCode}
              />
              <Input
                label="Office Type Name *"
                name="officeTypeName"
                value={formData.officeTypeName}
                onChange={(e) => handleInputChange("officeTypeName", e.target.value)}
                maxLength="100"
                error={errors.officeTypeName}
                isInvalid={!!errors.officeTypeName}
              />
              <Input
                label="Hierarchy Level * (1 = top)"
                name="hierarchyLevel"
                value={formData.hierarchyLevel}
                onChange={(e) => handleInputChange("hierarchyLevel", e.target.value.replace(/\D/g, ""))}
                maxLength="3"
                error={errors.hierarchyLevel}
                isInvalid={!!errors.hierarchyLevel}
              />
              <Dropdown
                label="Status"
                name="isActive"
                options={[
                  { value: "true", label: "Active" },
                  { value: "false", label: "Inactive" },
                ]}
                value={String(formData.isActive)}
                onChange={(e) => handleInputChange("isActive", e.target.value === "true")}
              />
              <div className="mt-3 text-center">
                <button type="submit" className="btn btn-primary px-4 me-2" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : isEditing ? "Update" : "Submit"}
                </button>
                <Button type="button" className="btn btn-outline-secondary px-4" onClick={handleReset}>
                  Reset
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default OfficeTypes;
