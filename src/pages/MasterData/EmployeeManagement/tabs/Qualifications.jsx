import React, { useState, useEffect, useContext, useRef } from "react";
import { Modal } from "react-bootstrap";
import { EmployeeContext } from "../EmployeeManagement";
import EmployeeManagementService from "../../../../core/services/EmployeeManagementService";
import secureLocalStorage from "react-secure-storage";
import { toast } from "react-toastify";
import { useLoader } from "../../../../components/LoaderContext";

const Qualifications = () => {
  const { employeeId } = useContext(EmployeeContext) || {};
  const id = employeeId;
  const { showLoader, hideLoader } = useLoader();
  const [qualifications, setQualifications] = useState([]);
  const [countries, setCountries] = useState([]);
  const [qualificationTypes, setQualificationTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedQualId, setSelectedQualId] = useState(null);
  
  // Refs to track loading state and prevent duplicate calls
  const qualificationTypesLoadedRef = useRef(false);
  const countriesLoadedRef = useRef(false);
  const qualificationsLoadedRef = useRef(null);

  const [formData, setFormData] = useState({
    qualificationType: "",
    qualificationName: "",
    specialization: "",
    institutionName: "",
    idCountry: "",
    yearOfCompletion: "",
    gradeOrPercentage: "",
    certificate: null,
  });

  // Load static data once on mount
  useEffect(() => {
    let isMounted = true;
    
    if (!qualificationTypesLoadedRef.current && isMounted) {
      qualificationTypesLoadedRef.current = true;
      loadQualificationTypes();
    }
    if (!countriesLoadedRef.current && isMounted) {
      countriesLoadedRef.current = true;
      loadCountries();
    }
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Load employee qualifications when id changes
  useEffect(() => {
    if (!id) return;
    
    if (qualificationsLoadedRef.current !== id) {
      qualificationsLoadedRef.current = id;
      loadQualifications();
    }
    
    return () => {
      // Reset ref when component unmounts to allow fresh load on next mount
      qualificationsLoadedRef.current = null;
    };
  }, [id]);

  const loadQualifications = async () => {
    if (!id) return;
    try {
      showLoader();
      const result = await EmployeeManagementService.getEmployeeQualifications(parseInt(id));
      hideLoader();
      if (result.error) {
        toast.error(result.error);
      } else {
        setQualifications(result.data?.data || []);
      }
    } catch (error) {
      hideLoader();
      toast.error("Failed to load qualifications");
    }
  };

  const loadQualificationTypes = async () => {
    try {
      const result = await EmployeeManagementService.getQualificationTypes();
      if (result.error) {
        toast.error(result.error);
      } else {
        // Handle both response structures: result.data?.data (nested) or result.data (direct array)
        const types = result.data?.data || result.data || [];
        console.log("Qualification types loaded:", types);
        setQualificationTypes(types);
        // Set default value if available (use idQualificationType)
        if (types.length > 0 && !formData.qualificationType) {
          setFormData(prev => ({ ...prev, qualificationType: types[0].idQualificationType?.toString() || "" }));
        }
      }
    } catch (error) {
      console.error("Failed to load qualification types:", error);
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
      return userData.idEmployee || 1; // Default to 1 if not found
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
        certificate: file,
      }));
    }
  };

  const handleSave = async () => {
    if (!id) {
      toast.warning("Please save employee basic details first");
      return;
    }

    if (!formData.qualificationName || !formData.institutionName || !formData.yearOfCompletion) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      const selectedCountry = countries.find((c) => c.idCountry === parseInt(formData.idCountry) || c.countryName === formData.idCountry);
      const countryId = selectedCountry ? selectedCountry.idCountry : formData.idCountry;

      // Find the qualification type ID if a name was provided (for backward compatibility)
      let qualificationTypeId = formData.qualificationType;
      if (isNaN(parseInt(qualificationTypeId))) {
        // If it's not a number, try to find the ID by name
        const foundType = qualificationTypes.find(
          type => type.qualificationTypeName === qualificationTypeId || 
                  type.qualificationType === qualificationTypeId
        );
        qualificationTypeId = foundType?.idQualificationType?.toString() || qualificationTypeId;
      }

      const payload = {
        idEmployeeQualification: editingId || 0,
        idEmployee: parseInt(id),
        qualificationType: qualificationTypeId,
        qualificationName: formData.qualificationName,
        specialization: formData.specialization,
        institutionName: formData.institutionName,
        idCountry: parseInt(countryId),
        yearOfCompletion: parseInt(formData.yearOfCompletion),
        gradeOrPercentage: formData.gradeOrPercentage,
        certificateFile: formData.certificate,
        idUser: getCurrentUserId(),
      };

      const result = await EmployeeManagementService.postEmployeeQualification(payload);
      setLoading(false);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(editingId ? "Qualification updated successfully" : "Qualification added successfully");
        handleReset();
        loadQualifications();
      }
    } catch (error) {
      setLoading(false);
      toast.error("Failed to save qualification");
    }
  };

  const handleEdit = (qual) => {
    setEditingId(qual.idEmployeeQualification);
    
    // Handle qualificationType - could be ID or name from API
    let qualificationTypeValue = "";
    if (qual.idQualificationType) {
      qualificationTypeValue = qual.idQualificationType.toString();
    } else if (qual.qualificationType) {
      // If it's a name, try to find the matching ID
      const foundType = qualificationTypes.find(
        type => type.qualificationTypeName === qual.qualificationType || 
                type.qualificationType === qual.qualificationType ||
                type.idQualificationType?.toString() === qual.qualificationType?.toString()
      );
      qualificationTypeValue = foundType?.idQualificationType?.toString() || qual.qualificationType;
    }
    
    setFormData({
      qualificationType: qualificationTypeValue,
      qualificationName: qual.qualificationName || "",
      specialization: qual.specialization || "",
      institutionName: qual.institutionName || "",
      idCountry: qual.idCountry?.toString() || "",
      yearOfCompletion: qual.yearOfCompletion?.toString() || "",
      gradeOrPercentage: qual.gradeOrPercentage || "",
      certificate: null,
    });
  };

  const handleDelete = async (qualId) => {
    setSelectedQualId(qualId);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedQualId) return;

    try {
      showLoader();
      const result = await EmployeeManagementService.deleteEmployeeQualification(selectedQualId, getCurrentUserId());
      hideLoader();

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Qualification deleted successfully");
        loadQualifications();
      }
      setShowConfirmModal(false);
      setSelectedQualId(null);
    } catch (error) {
      hideLoader();
      toast.error("Failed to delete qualification");
      setShowConfirmModal(false);
      setSelectedQualId(null);
    }
  };

  const handleReset = () => {
    setEditingId(null);
    const defaultType = qualificationTypes.length > 0 
      ? (qualificationTypes[0].idQualificationType?.toString() || "")
      : "";
    setFormData({
      qualificationType: defaultType,
      qualificationName: "",
      specialization: "",
      institutionName: "",
      idCountry: "",
      yearOfCompletion: "",
      gradeOrPercentage: "",
      certificate: null,
    });
  };

  return (
    <div className="row">
      <div className="col-lg-8">
        <div>
          <div>
            <h6 className="mb-0">Qualifications</h6>
          </div>
          <div className="p-3">
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Qualification</th>
                    <th>Institution</th>
                    <th>Country</th>
                    <th>Year</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {qualifications.length > 0 ? (
                    qualifications.map((qual) => (
                      <tr key={qual.idEmployeeQualification}>
                        <td>{qual.qualificationName}</td>
                        <td>{qual.institutionName}</td>
                        <td>{qual.countryName || qual.idCountry}</td>
                        <td>{qual.yearOfCompletion}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0 me-2"
                            onClick={() => handleEdit(qual)}
                            title="Edit"
                          >
                            <i className="bx bx-pencil"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm border-0"
                            onClick={() => handleDelete(qual.idEmployeeQualification)}
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
                        No qualifications added yet
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
            <h6 className="mb-0">Add / Update Qualification</h6>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label mb-1">Qualification Type</label>
              <select
                className="form-select"
                value={formData.qualificationType}
                onChange={(e) => handleInputChange("qualificationType", e.target.value)}
              >
                <option value="">Select Qualification Type</option>
                {qualificationTypes && qualificationTypes.length > 0 ? (
                  qualificationTypes.map((type, index) => {
                    // Use idQualificationType as value and qualificationTypeName as label
                    const typeValue = type.idQualificationType?.toString() || type.qualificationType?.toString() || String(type);
                    const typeLabel = type.qualificationTypeName || type.qualificationType || String(type);
                    return (
                      <option key={type.idQualificationType || index} value={typeValue}>
                        {typeLabel}
                      </option>
                    );
                  })
                ) : (
                  <option value="" disabled>Loading qualification types...</option>
                )}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label mb-1">Qualification Name *</label>
              <input
                type="text"
                className="form-control"
                value={formData.qualificationName}
                onChange={(e) => handleInputChange("qualificationName", e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label mb-1">Specialization</label>
              <input
                type="text"
                className="form-control"
                value={formData.specialization}
                onChange={(e) => handleInputChange("specialization", e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label mb-1">Institution *</label>
              <input
                type="text"
                className="form-control"
                value={formData.institutionName}
                onChange={(e) => handleInputChange("institutionName", e.target.value)}
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
              <label className="form-label mb-1">Year of Completion *</label>
              <input
                type="number"
                className="form-control"
                value={formData.yearOfCompletion}
                onChange={(e) => handleInputChange("yearOfCompletion", e.target.value)}
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>

            <div className="mb-3">
              <label className="form-label mb-1">Grade / Percentage</label>
              <input
                type="text"
                className="form-control"
                value={formData.gradeOrPercentage}
                onChange={(e) => handleInputChange("gradeOrPercentage", e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label mb-1">Certificate</label>
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
          setSelectedQualId(null);
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
            Are you sure you want to delete this qualification?
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-secondary px-3"
            onClick={() => {
              setShowConfirmModal(false);
              setSelectedQualId(null);
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

export default Qualifications;
