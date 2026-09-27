import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import OfficeManagementService from "../../../core/services/OfficeManagementService";
import { showToast } from "../../../components/ToastNotifications/toastUtils";
import Utils from "../../../utils/Utils";

// Values from the EmployeeOfficePostings.PostingType column definition
const POSTING_TYPES = ["Joining", "Transfer", "Deputation"];

const initialFormData = {
  idEmployeeOfficePosting: 0,
  idEmployee: null,
  postingFromDate: null,
  postingToDate: null,
  postingType: "",
  transferOrderNumber: "",
  postingRemarks: "",
};

function EmployeePostingModal({ show, office, posting, employeeOptions, onHide, onSaved }) {
  const isEditing = !!posting;
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEditing) loadPosting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posting]);

  // The office employee list does not carry order number / remarks, so load the full posting record
  const loadPosting = async () => {
    setLoading(true);
    try {
      const response = await OfficeManagementService.getEmployeeOfficePostings(posting.idEmployee);
      if (response.error) {
        showToast(response.error, "error");
        return;
      }
      const record = (response.data?.data || []).find(
        (p) => p.idEmployeeOfficePosting === posting.idEmployeeOfficePosting
      );
      if (record) {
        setFormData({
          idEmployeeOfficePosting: record.idEmployeeOfficePosting,
          idEmployee: record.idEmployee,
          postingFromDate: record.postingFromDate ? new Date(record.postingFromDate) : null,
          postingToDate: record.postingToDate ? new Date(record.postingToDate) : null,
          postingType: record.postingType || "",
          transferOrderNumber: record.transferOrderNumber || "",
          postingRemarks: record.postingRemarks || "",
        });
      }
    } catch (error) {
      showToast("Failed to fetch posting details", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.idEmployee) {
      newErrors.idEmployee = "Employee is required";
    }
    if (!formData.postingFromDate) {
      newErrors.postingFromDate = "Posting From Date is required";
    }
    if (formData.postingFromDate && formData.postingToDate && formData.postingToDate < formData.postingFromDate) {
      newErrors.postingToDate = "Posting To Date cannot be earlier than Posting From Date";
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
        idEmployeeOfficePosting: formData.idEmployeeOfficePosting || 0,
        idEmployee: formData.idEmployee,
        idOffice: office.idOffice,
        postingFromDate: moment(formData.postingFromDate).format("YYYY-MM-DD"),
        postingToDate: formData.postingToDate ? moment(formData.postingToDate).format("YYYY-MM-DD") : null,
        postingType: formData.postingType || null,
        transferOrderNumber: formData.transferOrderNumber.trim() || null,
        postingRemarks: formData.postingRemarks.trim() || null,
      };

      const response = await OfficeManagementService.addOrUpdateEmployeeOfficePosting(payload);
      if (response.error) {
        showToast(response.error, "error");
      } else {
        showToast(response.data?.message || "Employee office posting saved successfully", "success");
        onSaved();
      }
    } catch (error) {
      showToast("Failed to save employee office posting", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <h5>{isEditing ? "Update Employee Posting" : "Assign Employee"} - {office.officeName}</h5>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center p-3">Loading...</div>
        ) : (
          <div className="accountDetail_card">
            <form onSubmit={handleSubmit} noValidate>
              <div className="row m-0">
                <div className="col-md-8 p-2">
                  <label className="form-label mb-1">Employee *</label>
                  <Select
                    options={employeeOptions}
                    isSearchable
                    isDisabled={isEditing}
                    value={employeeOptions.find((opt) => opt.value === formData.idEmployee) || null}
                    onChange={(opt) => handleInputChange("idEmployee", opt?.value || null)}
                    placeholder="Search and select employee..."
                    className="textSize"
                  />
                  {errors.idEmployee && <div className="text-danger">{errors.idEmployee}</div>}
                </div>
                <div className="col-md-4 p-2">
                  <label className="form-label mb-1">Posting Type</label>
                  <select
                    className="form-select"
                    value={formData.postingType}
                    onChange={(e) => handleInputChange("postingType", e.target.value)}
                  >
                    <option value="">Select</option>
                    {POSTING_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                    {formData.postingType && !POSTING_TYPES.includes(formData.postingType) && (
                      <option value={formData.postingType}>{formData.postingType}</option>
                    )}
                  </select>
                </div>
                <div className="col-md-4 p-2">
                  <label className="form-label mb-1">Posting From Date *</label>
                  <DatePicker
                    className={`form-control ${errors.postingFromDate ? "is-invalid" : ""}`}
                    dateFormat={Utils.DATE_PICKER_FORMAT}
                    placeholderText="Select Date"
                    selected={formData.postingFromDate}
                    onChange={(date) => handleInputChange("postingFromDate", date)}
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                  {errors.postingFromDate && <div className="text-danger">{errors.postingFromDate}</div>}
                </div>
                <div className="col-md-4 p-2">
                  <label className="form-label mb-1">Posting To Date</label>
                  <DatePicker
                    className={`form-control ${errors.postingToDate ? "is-invalid" : ""}`}
                    dateFormat={Utils.DATE_PICKER_FORMAT}
                    placeholderText="Leave blank if current"
                    selected={formData.postingToDate}
                    onChange={(date) => handleInputChange("postingToDate", date)}
                    minDate={formData.postingFromDate}
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    isClearable
                  />
                  {errors.postingToDate && <div className="text-danger">{errors.postingToDate}</div>}
                </div>
                <div className="col-md-4 p-2">
                  <label className="form-label mb-1">Transfer Order Number</label>
                  <input
                    type="text"
                    className="form-control"
                    maxLength={50}
                    value={formData.transferOrderNumber}
                    onChange={(e) => handleInputChange("transferOrderNumber", e.target.value)}
                  />
                </div>
                <div className="col-md-12 p-2">
                  <label className="form-label mb-1">Remarks</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    maxLength={255}
                    value={formData.postingRemarks}
                    onChange={(e) => handleInputChange("postingRemarks", e.target.value)}
                  />
                </div>
              </div>
            </form>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button
          type="button"
          className="btn btn-primary btn-sm py-2 px-4 me-2"
          onClick={handleSubmit}
          disabled={isSubmitting || loading}
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

export default EmployeePostingModal;
