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

const Experience = () => {
  const { employeeId } = useContext(EmployeeContext) || {};
  const id = employeeId;
  const { showLoader, hideLoader } = useLoader();
  const [experiences, setExperiences] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedExpId, setSelectedExpId] = useState(null);
  
  // Refs to track loading state and prevent duplicate calls
  const countriesLoadedRef = useRef(false);
  const experiencesLoadedRef = useRef(null);

  const [formData, setFormData] = useState({
    companyName: "",
    designation: "",
    companyAddress: "",
    idCountry: "",
    department: "",
    employmentType: "FullTime",
    fromDate: null,
    toDate: null,
    lastDrawnSalary: "",
    reasonForLeaving: "",
    experienceCertificate: null,
  });

  const employmentTypes = ["FullTime", "Contract", "Consultant"];

  // Load countries once on mount (static data)
  useEffect(() => {
    let isMounted = true;
    
    if (!countriesLoadedRef.current && isMounted) {
      countriesLoadedRef.current = true;
      loadCountries();
    }
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Load employee experiences when id changes
  useEffect(() => {
    if (!id) return;
    
    if (experiencesLoadedRef.current !== id) {
      experiencesLoadedRef.current = id;
      loadExperiences();
    }
    
    return () => {
      // Reset ref when component unmounts to allow fresh load on next mount
      experiencesLoadedRef.current = null;
    };
  }, [id]);

  const loadExperiences = async () => {
    if (!id) return;
    try {
      showLoader();
      const result = await EmployeeManagementService.getEmployeeExperiences(parseInt(id));
      hideLoader();
      if (result.error) {
        toast.error(result.error);
      } else {
        setExperiences(result.data?.data || []);
      }
    } catch (error) {
      hideLoader();
      toast.error("Failed to load experiences");
    }
  };

  const loadCountries = async () => {
    try {
      const result = await EmployeeManagementService.getCountries();
      if (result.error) {
        toast.error(result.error);
      } else {
        setCountries(result.data?.data || []);
      }
    } catch (error) {
      console.error("Failed to load countries:", error);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        experienceCertificate: file,
      }));
    }
  };

  const handleSave = async () => {
    if (!id) {
      toast.warning("Please save employee basic details first");
      return;
    }

    if (!formData.companyName || !formData.designation || !formData.fromDate) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      const selectedCountry = countries.find((c) => c.idCountry === parseInt(formData.idCountry));
      const countryId = selectedCountry ? selectedCountry.idCountry : formData.idCountry;

      const payload = {
        idEmployeeExperience: editingId || 0,
        idEmployee: parseInt(id),
        companyName: formData.companyName,
        companyAddress: formData.companyAddress || "",
        idCountry: parseInt(countryId) || null,
        designation: formData.designation,
        department: formData.department || "",
        employmentType: formData.employmentType,
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        lastDrawnSalary: formData.lastDrawnSalary ? parseFloat(formData.lastDrawnSalary) : null,
        reasonForLeaving: formData.reasonForLeaving || "",
        experienceCertificateFile: formData.experienceCertificate,
        idUser: getCurrentUserId(),
      };

      const result = await EmployeeManagementService.postEmployeeExperience(payload);
      setLoading(false);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(editingId ? "Experience updated successfully" : "Experience added successfully");
        handleReset();
        loadExperiences();
      }
    } catch (error) {
      setLoading(false);
      toast.error("Failed to save experience");
    }
  };

  const handleEdit = (exp) => {
    setEditingId(exp.idEmployeeExperience);
    setFormData({
      companyName: exp.companyName || "",
      designation: exp.designation || "",
      companyAddress: exp.companyAddress || "",
      idCountry: exp.idCountry?.toString() || "",
      department: exp.department || "",
      employmentType: exp.employmentType || "FullTime",
      fromDate: exp.fromDate ? moment(exp.fromDate).toDate() : null,
      toDate: exp.toDate ? moment(exp.toDate).toDate() : null,
      lastDrawnSalary: exp.lastDrawnSalary?.toString() || "",
      reasonForLeaving: exp.reasonForLeaving || "",
      experienceCertificate: null,
    });
  };

  const handleDelete = async (expId) => {
    setSelectedExpId(expId);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedExpId) return;

    try {
      showLoader();
      const result = await EmployeeManagementService.deleteEmployeeExperience(selectedExpId, getCurrentUserId());
      hideLoader();

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Experience deleted successfully");
        loadExperiences();
      }
      setShowConfirmModal(false);
      setSelectedExpId(null);
    } catch (error) {
      hideLoader();
      toast.error("Failed to delete experience");
      setShowConfirmModal(false);
      setSelectedExpId(null);
    }
  };

  const handleReset = () => {
    setEditingId(null);
    setFormData({
      companyName: "",
      designation: "",
      companyAddress: "",
      idCountry: "",
      department: "",
      employmentType: "FullTime",
      fromDate: null,
      toDate: null,
      lastDrawnSalary: "",
      reasonForLeaving: "",
      experienceCertificate: null,
    });
  };

  const formatPeriod = (fromDate, toDate) => {
    if (!fromDate) return "-";
    const from = moment(fromDate).format("YYYY");
    const to = toDate ? moment(toDate).format("YYYY") : "Present";
    return `${from} - ${to}`;
  };

  return (
    <div className="row">
      <div className="col-lg-8">
        <div>
          <div>
            <h6 className="mb-0">Experiences</h6>
          </div>
          <div className="p-3">
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Designation</th>
                    <th>Period</th>
                    <th>Last Salary</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {experiences.length > 0 ? (
                    experiences.map((exp) => (
                      <tr key={exp.idEmployeeExperience}>
                        <td>{exp.companyName}</td>
                        <td>{exp.designation}</td>
                        <td>{formatPeriod(exp.fromDate, exp.toDate)}</td>
                        <td>
                          {exp.lastDrawnSalary
                            ? `${parseInt(exp.lastDrawnSalary).toLocaleString("en-US")}`
                            : "-"}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0 me-2"
                            onClick={() => handleEdit(exp)}
                            title="Edit"
                          >
                            <i className="bx bx-pencil"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm border-0"
                            onClick={() => handleDelete(exp.idEmployeeExperience)}
                            title="Delete"
                          >
                            <i className="bx bx-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center">
                        No experience added yet
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
            <h6 className="mb-0">Add / Update Experience</h6>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label mb-1">Company Name *</label>
              <input
                type="text"
                className="form-control"
                value={formData.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label mb-1">Designation *</label>
              <input
                type="text"
                className="form-control"
                value={formData.designation}
                onChange={(e) => handleInputChange("designation", e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label mb-1">Department</label>
              <input
                type="text"
                className="form-control"
                value={formData.department}
                onChange={(e) => handleInputChange("department", e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label mb-1">Country</label>
              <select
                className="form-select"
                value={formData.idCountry}
                onChange={(e) => handleInputChange("idCountry", e.target.value)}
              >
                <option value="">Select Country</option>
                {countries.map((country) => (
                  <option key={country.idCountry} value={country.idCountry}>
                    {country.countryName}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label mb-1">Employment Type</label>
              <select
                className="form-select"
                value={formData.employmentType}
                onChange={(e) => handleInputChange("employmentType", e.target.value)}
              >
                {employmentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label mb-1">From Date *</label>
              <DatePicker
                selected={formData.fromDate}
                onChange={(date) => handleInputChange("fromDate", date)}
                dateFormat="dd-MM-yyyy"
                className="form-control"
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                wrapperClassName="d-block"
                maxDate={formData.toDate || new Date()}
              />
            </div>

            <div className="mb-3">
              <label className="form-label mb-1">To Date</label>
              <DatePicker
                selected={formData.toDate}
                onChange={(date) => handleInputChange("toDate", date)}
                dateFormat="dd-MM-yyyy"
                className="form-control"
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                wrapperClassName="d-block"
                minDate={formData.fromDate}
                maxDate={new Date()}
              />
            </div>

            <div className="mb-3">
              <label className="form-label mb-1">Last Drawn Salary</label>
              <input
                type="text"
                className="form-control"
                value={formData.lastDrawnSalary}
                onChange={(e) => handleInputChange("lastDrawnSalary", e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label mb-1">Reason for Leaving</label>
              <textarea
                className="form-control"
                rows="3"
                value={formData.reasonForLeaving}
                onChange={(e) => handleInputChange("reasonForLeaving", e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label mb-1">Experience Certificate</label>
              <input
                type="file"
                className="form-control"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </div>

            <div className="d-flex gap-2">
              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
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
          setSelectedExpId(null);
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
            Are you sure you want to delete this experience?
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-secondary px-3"
            onClick={() => {
              setShowConfirmModal(false);
              setSelectedExpId(null);
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

export default Experience;
