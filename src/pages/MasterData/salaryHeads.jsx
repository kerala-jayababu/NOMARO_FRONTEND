import React, { useEffect, useState } from "react";
import {
  getSalaryHeadList,
  getSalaryHeadById,
  addSalaryHead,
  updateSalaryHead,
} from "../../utils/service";

function SalaryHeads() {
  const [salaryHeads, setSalaryHeads] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedSalaryHead, setSelectedSalaryHead] = useState(null);
  const [formData, setFormData] = useState({
    salaryHeadCode: "",
    salaryHeadName: "",
    headType: "",
    isTaxable: false,
    isActive: false,
    calculationMethod: "",
    percentageValue: "",
    customFormula: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchSalaryHeads();
  }, []);
  const fetchSalaryHeads = async () => {
    const data = await getSalaryHeadList();
    setSalaryHeads(data);
  };

  const handleAddClick = () => {
    setFormData({
      salaryHeadCode: "",
      salaryHeadName: "",
      headType: "",
      isTaxable: false,
      isActive: false,
      calculationMethod: "",
      percentageValue: "",
      customFormula: "",
    });
    setShowModal(true);
    setSelectedSalaryHead(null);
  };

  const handleEditClick = async (head) => {
    try {
      const response = await getSalaryHeadById(head.idSalaryHead);
      if (response.success) {
        const updatedData = {
          ...response.data,
          headType:
            response.data.headType?.toLowerCase() === "earning"
              ? "Earning"
              : "Deduction",
        };
        setFormData(updatedData);
        setSelectedSalaryHead(response.data.idSalaryHead);
        setShowModal(true);
      }
    } catch (error) {
      console.error("Error fetching salary head details:", error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSalaryHead(null);
    setFormData({
      salaryHeadCode: "",
      salaryHeadName: "",
      headType: "",
      isTaxable: false,
      isActive: false,
      calculationMethod: "",
      percentageValue: "",
      customFormula: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Clear the specific error when the user starts typing valid input
    setErrors((prevState) => ({
      ...prevState,
      [name]: "",
    }));

    setFormData((prevState) => ({
      ...prevState,
      [name]:
        type === "checkbox"
          ? checked
          : name === "isTaxable"
          ? value === "true"
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let validationErrors = {};

    // Check required fields
    if (!formData.salaryHeadCode.trim()) {
      validationErrors.salaryHeadCode = "Salary Head Code is required.";
    }
    if (!formData.salaryHeadName.trim()) {
      validationErrors.salaryHeadName = "Salary Head Name is required.";
    }
    if (!formData.headType) {
      validationErrors.headType = "Salary Head Type is required.";
    }
    if (formData.isTaxable === "") {
      validationErrors.isTaxable = "Please select taxability.";
    }
    if (!formData.calculationMethod) {
      validationErrors.calculationMethod = "Calculation Method is required.";
    }


    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      if (selectedSalaryHead) {
        formData.idSalaryHead = selectedSalaryHead;
        const response = await updateSalaryHead(formData);
        if (response.success) {
          setShowModal(false);
          fetchSalaryHeads();
        }
      } else {
        const response = await addSalaryHead(formData);
        if (response.success) {
          setShowModal(false);
          fetchSalaryHeads();
        }
      }
    } catch (error) {
      console.error("Error submitting salary head:", error);
    }
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">List of Salary Heads</h5>
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
                      <th>S. H. Code</th>
                      <th>Salary Head Name</th>
                      <th>Active Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody className="table-border-bottom-0">
                    {salaryHeads.data?.length > 0 ? (
                      salaryHeads.data.map((head) => (
                        <tr key={head.idSalaryHead}>
                          <td>
                            <strong>{head.salaryHeadCode}</strong>
                          </td>
                          <td>{head.salaryHeadName}</td>
                          <td>
                            <span
                              className={`badge ${
                                head.isActive
                                  ? "bg-label-success"
                                  : "bg-label-warning"
                              }`}
                            >
                              {head.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
                              onClick={() => handleEditClick(head)}
                            >
                              <span className="tf-icons bx bx-pencil"></span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center">
                          No data available
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
              maxHeight: "80vh",
              margin: "auto",
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              zIndex: "1000",
              overflowY: "auto", 
            }}
          >
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  {selectedSalaryHead
                    ? "Update Salary Head"
                    : "Add Salary Head"}
                </h5>
                <button
                  className="btn-close"
                  onClick={handleCloseModal}
                ></button>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-2">
                    <label className="form-label mb-1">Salary Head Code</label>
                    <input
                      type="text"
                      className="form-control"
                      maxLength="10"
                      name="salaryHeadCode"
                      value={formData.salaryHeadCode}
                      onChange={handleInputChange}
                    />
                    {errors.salaryHeadCode && (
                      <div className="text-danger">{errors.salaryHeadCode}</div>
                    )}
                  </div>
                  <div className="mb-2">
                    <label className="form-label mb-1">Salary Head Name</label>
                    <input
                      type="text"
                      className="form-control"
                      maxLength="50"
                      name="salaryHeadName"
                      value={formData.salaryHeadName}
                      onChange={handleInputChange}
                    />
                    <div className="text-danger">{errors.salaryHeadName}</div>
                  </div>
                  <div className="mb-2">
                    <label className="form-label mb-1">
                      Type of Salary Head
                    </label>
                    <div>
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="headType"
                          value="Earning"
                          checked={formData.headType === "Earning"}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label">Earning</label>
                      </div>
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="headType"
                          value="Deduction"
                          checked={formData.headType === "Deduction"}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label">Deduction</label>
                      </div>
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="form-label mb-1">Taxability</label>
                    <div>
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="isTaxable"
                          id="Taxability01"
                          value="true"
                          checked={formData.isTaxable === true}
                          onChange={handleInputChange}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="Taxability01"
                        >
                          Taxable
                        </label>
                      </div>
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="isTaxable"
                          id="Taxability02"
                          value="false"
                          checked={formData.isTaxable === false}
                          onChange={handleInputChange}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="Taxability02"
                        >
                          Non-Taxable
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="form-label mb-1">
                      Calculation Method
                    </label>
                    <select
                      className={`form-select ${
                        errors.calculationMethod ? "is-invalid" : ""
                      }`}
                      name="calculationMethod"
                      value={formData.calculationMethod}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Calculation Method</option>
                      <option value="PERCENTAGE">Percentage of</option>
                      <option value="FORMULA">Custom Formula</option>
                      <option value="FIXEDAMOUNT">Fixed Amount</option>
                    </select>
                    <div className="text-danger">
                      {errors.calculationMethod}
                    </div>
                  </div>
                  <div className="row mb-0">
                    <div className="col-md-8 mb-2">
                      <label className="form-label mb-1">Percentage of</label>
                      <select
                        className="form-select"
                        name="salaryHeadName"
                        value={formData.salaryHeadName}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Salary Head</option>
                        {salaryHeads.data?.map((head) => (
                          <option
                            key={head.idSalaryHead}
                            value={head.salaryHeadName}
                          >
                            {head.salaryHeadName}
                          </option>
                        ))}
                      </select>
                      <div className="text-danger">{errors.salaryHeadName}</div>
                    </div>
                    <div className="col-md-4 mb-2">
                      <label className="form-label mb-1">Value</label>
                      <input
                        type="number"
                        className="form-control"
                        maxLength="5"
                        name="percentageValue"
                        value={formData.percentageValue}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  {formData.calculationMethod === "FORMULA" && (
                    <div className="mb-2">
                      <label className="form-label mb-1">Custom Formula</label>
                      <input
                        type="text"
                        className="form-control"
                        maxLength="100"
                        placeholder="(BP + DA) / 10"
                        value={formData.customFormula}
                        name="customFormula"
                        onChange={handleInputChange}
                        disabled={formData.calculationMethod === "PERCENTAGE"}  
                      />
                      <div className="text-danger">{errors.customFormula}</div>
                    </div>
                  )}
                  <div className="mb-3 pt-2">
                    <div className="form-check form-switch">
                      <label
                        className="form-check-label"
                        htmlFor="flexSwitchCheckDefault"
                      >
                        Active Status
                      </label>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="flexSwitchCheckDefault"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <button type="submit" className="btn btn-primary px-4 me-2">
                      {selectedSalaryHead ? "Update" : "Submit"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-4"
                      onClick={handleCloseModal}
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
    </div>
  );
}

export default SalaryHeads;
