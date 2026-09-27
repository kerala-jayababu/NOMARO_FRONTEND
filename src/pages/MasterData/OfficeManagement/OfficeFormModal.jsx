import React, { useMemo, useState } from "react";
import { Modal } from "react-bootstrap";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import OfficeManagementService from "../../../core/services/OfficeManagementService";
import { showToast } from "../../../components/ToastNotifications/toastUtils";
import Utils from "../../../utils/Utils";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getInitialFormData = (office) => ({
  officeCode: office?.officeCode || "",
  officeName: office?.officeName || "",
  idOfficeType: office?.idOfficeType ? String(office.idOfficeType) : "",
  idParentOffice: office?.idParentOffice ? String(office.idParentOffice) : "",
  idOfficeHead: office?.idOfficeHead || null,
  addressLine1: office?.addressLine1 || "",
  addressLine2: office?.addressLine2 || "",
  city: office?.city || "",
  district: office?.district || "",
  state: office?.state || "",
  country: office?.country || "",
  pinCode: office?.pinCode || "",
  phoneNumber: office?.phoneNumber || "",
  emailId: office?.emailId || "",
  gstin: office?.gstin || "",
  openedDate: office?.openedDate ? new Date(office.openedDate) : null,
  closedDate: office?.closedDate ? new Date(office.closedDate) : null,
  isActive: office ? office.isActive : true,
});

function OfficeFormModal({ show, office, officeTypes, allOffices, employeeOptions, onHide, onSaved }) {
  const isEditing = !!office;
  const [formData, setFormData] = useState(getInitialFormData(office));
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // An office cannot be placed under itself or under one of its own sub offices
  const parentOfficeOptions = useMemo(() => {
    if (!isEditing) return allOffices;

    const excludedIds = new Set([office.idOffice]);
    let added = true;
    while (added) {
      added = false;
      allOffices.forEach((o) => {
        if (o.idParentOffice && excludedIds.has(o.idParentOffice) && !excludedIds.has(o.idOffice)) {
          excludedIds.add(o.idOffice);
          added = true;
        }
      });
    }
    return allOffices.filter((o) => !excludedIds.has(o.idOffice));
  }, [allOffices, office, isEditing]);

  // Inactive office types are only listed when already assigned to this office
  const officeTypeOptions = officeTypes.filter(
    (type) => type.isActive || type.idOfficeType === office?.idOfficeType
  );

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.officeCode.trim()) {
      newErrors.officeCode = "Office Code is required";
    } else {
      const isDuplicate = allOffices.some(
        (o) =>
          o.officeCode?.toLowerCase() === formData.officeCode.trim().toLowerCase() &&
          o.idOffice !== office?.idOffice
      );
      if (isDuplicate) newErrors.officeCode = "Office Code already exists";
    }
    if (!formData.officeName.trim()) {
      newErrors.officeName = "Office Name is required";
    }
    if (!formData.idOfficeType) {
      newErrors.idOfficeType = "Office Type is required";
    }
    if (formData.emailId.trim() && !EMAIL_REGEX.test(formData.emailId.trim())) {
      newErrors.emailId = "Invalid Email ID";
    }
    if (formData.openedDate && formData.closedDate && formData.closedDate < formData.openedDate) {
      newErrors.closedDate = "Closed Date cannot be earlier than Opened Date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toNullIfEmpty = (value) => (value && value.trim() !== "" ? value.trim() : null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast("Please correct the highlighted fields", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        idOffice: office?.idOffice || 0,
        officeCode: formData.officeCode.trim(),
        officeName: formData.officeName.trim(),
        idOfficeType: Number(formData.idOfficeType),
        idParentOffice: formData.idParentOffice ? Number(formData.idParentOffice) : null,
        addressLine1: toNullIfEmpty(formData.addressLine1),
        addressLine2: toNullIfEmpty(formData.addressLine2),
        city: toNullIfEmpty(formData.city),
        district: toNullIfEmpty(formData.district),
        state: toNullIfEmpty(formData.state),
        country: toNullIfEmpty(formData.country),
        pinCode: toNullIfEmpty(formData.pinCode),
        phoneNumber: toNullIfEmpty(formData.phoneNumber),
        emailId: toNullIfEmpty(formData.emailId),
        gstin: toNullIfEmpty(formData.gstin),
        idOfficeHead: formData.idOfficeHead || null,
        // Shift schedule is not edited on this screen; keep the existing value on update
        idShiftSchedule: office?.idShiftSchedule || null,
        openedDate: formData.openedDate ? moment(formData.openedDate).format("YYYY-MM-DD") : null,
        closedDate: formData.closedDate ? moment(formData.closedDate).format("YYYY-MM-DD") : null,
        isActive: formData.isActive,
      };

      const response = isEditing
        ? await OfficeManagementService.updateOffice(payload)
        : await OfficeManagementService.addOffice(payload);

      if (response.error) {
        showToast(response.error, "error");
      } else {
        showToast(
          response.data?.message || (isEditing ? "Office updated successfully" : "Office added successfully"),
          "success"
        );
        onSaved();
      }
    } catch (error) {
      showToast("Failed to save office", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTextField = (field, label, maxLength, colClass = "col-md-4") => (
    <div className={`${colClass} p-2`}>
      <label className="form-label mb-1">{label}</label>
      <input
        type="text"
        className={`form-control ${errors[field] ? "is-invalid" : ""}`}
        value={formData[field]}
        maxLength={maxLength}
        onChange={(e) => handleInputChange(field, e.target.value)}
      />
      {errors[field] && <div className="text-danger">{errors[field]}</div>}
    </div>
  );

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      aria-labelledby="contained-modal-title-vcenter"
      centered
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <h5>{isEditing ? "Update Office" : "Add Office"}</h5>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="accountDetail_card">
          <form onSubmit={handleSubmit} noValidate>
            <div className="row m-0">
              {renderTextField("officeCode", "Office Code *", 20)}
              {renderTextField("officeName", "Office Name *", 150)}

              <div className="col-md-4 p-2">
                <label className="form-label mb-1">Office Type *</label>
                <select
                  className={`form-select ${errors.idOfficeType ? "is-invalid" : ""}`}
                  value={formData.idOfficeType}
                  onChange={(e) => handleInputChange("idOfficeType", e.target.value)}
                >
                  <option value="">Select Office Type</option>
                  {officeTypeOptions.map((type) => (
                    <option key={type.idOfficeType} value={type.idOfficeType}>
                      {type.officeTypeName} (Level {type.hierarchyLevel})
                    </option>
                  ))}
                </select>
                {errors.idOfficeType && <div className="text-danger">{errors.idOfficeType}</div>}
              </div>

              <div className="col-md-4 p-2">
                <label className="form-label mb-1">Parent Office</label>
                <select
                  className="form-select"
                  value={formData.idParentOffice}
                  onChange={(e) => handleInputChange("idParentOffice", e.target.value)}
                >
                  <option value="">None (Top level office)</option>
                  {parentOfficeOptions.map((o) => (
                    <option key={o.idOffice} value={o.idOffice}>
                      {o.officeCode} - {o.officeName}
                      {o.officeTypeName ? ` (${o.officeTypeName})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4 p-2">
                <label className="form-label mb-1">Office Head</label>
                <Select
                  options={employeeOptions}
                  isSearchable
                  isClearable
                  value={employeeOptions.find((opt) => opt.value === formData.idOfficeHead) || null}
                  onChange={(opt) => handleInputChange("idOfficeHead", opt?.value || null)}
                  placeholder="Select Employee"
                  className="textSize"
                />
              </div>

              <div className="col-md-4 p-2">
                <label className="form-label mb-1">Status</label>
                <select
                  className="form-select"
                  value={String(formData.isActive)}
                  onChange={(e) => handleInputChange("isActive", e.target.value === "true")}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              {renderTextField("addressLine1", "Address Line 1", 200, "col-md-6")}
              {renderTextField("addressLine2", "Address Line 2", 200, "col-md-6")}
              {renderTextField("city", "City", 100)}
              {renderTextField("district", "District", 100)}
              {renderTextField("state", "State", 100)}
              {renderTextField("country", "Country", 100)}
              {renderTextField("pinCode", "Pin Code", 10)}
              {renderTextField("phoneNumber", "Phone Number", 20)}
              {renderTextField("emailId", "Email ID", 150)}
              {renderTextField("gstin", "GSTIN", 15)}

              <div className="col-md-4 p-2">
                <label className="form-label mb-1">Opened Date</label>
                <DatePicker
                  className="form-control"
                  dateFormat={Utils.DATE_PICKER_FORMAT}
                  placeholderText="Select Date"
                  selected={formData.openedDate}
                  onChange={(date) => handleInputChange("openedDate", date)}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  isClearable
                />
              </div>

              <div className="col-md-4 p-2">
                <label className="form-label mb-1">Closed Date</label>
                <DatePicker
                  className={`form-control ${errors.closedDate ? "is-invalid" : ""}`}
                  dateFormat={Utils.DATE_PICKER_FORMAT}
                  placeholderText="Select Date"
                  selected={formData.closedDate}
                  onChange={(date) => handleInputChange("closedDate", date)}
                  minDate={formData.openedDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  isClearable
                />
                {errors.closedDate && <div className="text-danger">{errors.closedDate}</div>}
              </div>
            </div>
          </form>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button
          type="button"
          className="btn btn-primary btn-sm py-2 px-4 me-2"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : isEditing ? "Update" : "Submit"}
        </button>
        <button type="button" className="btn btn-outline-secondary btn-sm py-2 px-4" onClick={onHide}>
          Cancel
        </button>
      </Modal.Footer>
    </Modal>
  );
}

export default OfficeFormModal;
