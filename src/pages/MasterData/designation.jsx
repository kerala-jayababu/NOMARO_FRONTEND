import React, { useEffect, useState } from "react";
import {
  getDesignationList,
  getDesignationById,
  addDesignation,
  updateDesignation,
} from "../../utils/service";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";

function Designations() {
  const [designations, setDesignations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    designationCode: "",
    designationName: "",
    isOvertimeAllowanceAllowed: false,
  });
  const [editId, setEditId] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [originalDesignationCode, setOriginalDesignationCode] = useState("");


  useEffect(() => {
    fetchDesignations();
  }, []);


  const fetchDesignations = async () => {
    const response = await getDesignationList();
    setDesignations(response.data);
  };

  const handleAddClick = () => {
    setFormData({
      designationCode: "",
      designationName: "",
      isOvertimeAllowanceAllowed: false,
    });
    setEditId(null);
    setValidationErrors({});
    setShowModal(true);
  };

  const handleEditClick = async (id) => {
    const data = await getDesignationById(id);
    if (data.success) {
      setFormData({
        designationCode: data.data.designationCode,
        designationName: data.data.designationName,
        isOvertimeAllowanceAllowed: data.data.isOvertimeAllowanceAllowed,
      });
      setEditId(id);
      setOriginalDesignationCode(data.data.designationCode);  // Save the original designation code
      setShowModal(true);
    }
  };
  

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      designationCode: "",
      designationName: "",
      isOvertimeAllowanceAllowed: false,
    });
    // setValidationErrors({});
    setEditId(null);
  };

  const validateInput = (name, value) => {
    let errors = { ...validationErrors };

    const alphanumericRegex = /^[a-zA-Z0-9]*$/;

    if (name === "designationCode") {
      if (!alphanumericRegex.test(value)) {
        errors.designationCode =
          "Designation code must contain only alphanumeric characters.";
      } else if (value.length >= 10) {
        errors.designationCode = "Designation code must not exceed 10 characters.";
      } else {
        delete errors.designationCode;
      }
    }

    if (name === "designationName") {
      if (!alphanumericRegex.test(value)) {
        errors.designationName =
          "Designation Name must contain only alphanumeric characters.";
      } else {
        delete errors.designationName;
      }
    }

    setValidationErrors(errors);
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "radio" ? value === "true" : value,
    });

    validateInput(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors({});

    // Check if the form data is the same as the original data (i.e., no changes)
    if (
      formData.designationCode === originalDesignationCode &&
      formData.designationName === formData.designationName &&
      formData.isOvertimeAllowanceAllowed ===
        formData.isOvertimeAllowanceAllowed
    ) {
      // If no changes, close the modal without submitting
      handleCloseModal();
      return;
    }

    // Only check for duplicate if the designationCode has changed
    let isDuplicate = false;
    if (formData.designationCode !== originalDesignationCode) {
      isDuplicate = designations?.some(
        (des) =>
          des.designationCode.toLowerCase() ===
            formData.designationCode.toLowerCase() &&
          des.idDesignation !== editId // Exclude the current designation being edited
      );
    }

    // If duplicate found, show error only for the code
    if (isDuplicate) {
      setValidationErrors({
        designationCode: "Designation code already exists.",
      });
      return;
    }

    if (!formData.designationCode || !formData.designationName) {
      setValidationErrors({
        designationCode: "Designation Code is required.",
        designationName: "Designation Name is required.",
      });
      return;
    }

    const requestData = {
      designationCode: formData.designationCode,
      designationName: formData.designationName,
      isOvertimeAllowanceAllowed: formData.isOvertimeAllowanceAllowed,
    };

    let response;
    try {
      if (editId) {
        requestData.idDesignation = editId;
        response = await updateDesignation(requestData);
      } else {
        response = await addDesignation(requestData);
      }

      if (response.success) {
        fetchDesignations();
        handleCloseModal();
      } else {
        if (response.message) {
          toast.error(response.message);
        }
        setValidationErrors(response.errors);
      }
    } catch (error) {
      console.error("Error submitting designation:", error);
    }
  };
  

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">List of Designations</h5>
              <button
                className="btn btn-primary btn-sm px-4"
                onClick={handleAddClick}
              >
                Add
              </button>
            </div>
            <div className="card-body">
              <div className="table-responsive text-nowrap">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Des. Code</th>
                      <th>Designation Name</th>
                      <th>Overtime Allowed</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody className="table-border-bottom-0">
                    {designations.length > 0 ? (
                      designations.map((des) => (
                        <tr key={des.designationCode}>
                          <td>{des.designationCode}</td>
                          <td>{des.designationName}</td>
                          <td>
                            {des.isOvertimeAllowanceAllowed ? "Yes" : "No"}
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
                              onClick={() => handleEditClick(des.idDesignation)}
                            >
                              <span className="tf-icons bx bx-pencil"></span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center">
                          No Designations Available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: "999",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            className="modal-content"
            style={{
              maxWidth: "600px",
              margin: "auto",
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              zIndex: "1000",
            }}
          >
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  {editId ? "Update Designation" : "Add Designation"}
                </h5>
                <button
                  className="btn-close"
                  onClick={handleCloseModal}
                ></button>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-2">
                    <label className="form-label mb-1">Designation Code</label>
                    <input
                      type="text"
                      className="form-control"
                      name="designationCode"
                      maxLength={10}
                      value={formData.designationCode}
                      onChange={handleInputChange}
                    />
                    {validationErrors.designationCode && (
                      <div className="text-danger">{validationErrors.designationCode}</div>
                    )}
                  </div>

                  <div className="mb-2">
                    <label className="form-label mb-1">Designation Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="designationName"
                      maxLength={50}
                      value={formData.designationName}
                      onChange={handleInputChange}
                    />
                    {validationErrors.designationName && (
                      <div className="text-danger">{validationErrors.designationName}</div>
                    )}
                  </div>

                  <div className="mb-2">
                    <label className="form-label mb-1">Overtime Allowed</label>
                    <div>
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="isOvertimeAllowanceAllowed"
                          value="true"
                          checked={formData.isOvertimeAllowanceAllowed === true}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label">Yes</label>
                      </div>
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="isOvertimeAllowanceAllowed"
                          value="false"
                          checked={
                            formData.isOvertimeAllowanceAllowed === false
                          }
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label">No</label>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <button type="submit" className="btn btn-primary px-4 me-2">
                      {editId ? "Update" : "Submit"}
                    </button>
                    <button
                      type="reset"
                      className="btn btn-outline-secondary px-4"
                      onClick={() =>
                        setFormData({
                          designationCode: "",
                          designationName: "",
                          isOvertimeAllowanceAllowed: false,
                        })
                      }
                    >
                      Reset
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
}

export default Designations;
