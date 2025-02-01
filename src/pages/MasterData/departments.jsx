import { useEffect, useState } from "react";
import {
  getMasterDepartmentList,
  getMasterDepartmentByID,
  updateMasterDepartment,
  addMasterDepartment,
} from "../../utils/service";

function Departments() {
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    departmentCode: "",
    departmentName: "",
  });
  const [editId, setEditId] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    const data = await getMasterDepartmentList();
    setDepartments(data);
  };

  const handleAddClick = () => {
    setFormData({ departmentCode: "", departmentName: "" });
    setEditId(null); 
    setValidationErrors({});
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ departmentCode: "", departmentName: "" }); 
    setValidationErrors({});
    setEditId(null); 
  };

  const handleEditClick = async (id) => {
    const data = await getMasterDepartmentByID(id);
    if (data.success) {
      setFormData({
        departmentCode: data.data.departmentCode,
        departmentName: data.data.departmentName,
      });
      setEditId(id);
      setShowModal(true);
    }
  };

  const validateInput = (name, value) => {
    let errors = { ...validationErrors };

    if (name === "departmentCode") {
      const alphanumericRegex = /^[a-zA-Z0-9]*$/;
      if (!alphanumericRegex.test(value)) {
        errors.departmentCode =
          "Department code must contain only alphanumeric characters.";
      } else if (value.length >= 10) {
        errors.departmentCode = "Department code must not exceed 10 characters.";
      } else {
        delete errors.departmentCode;
      }
    }

    setValidationErrors(errors);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Validate input
    validateInput(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors({});

    const requestData = {
      departmentCode: formData.departmentCode,
      departmentName: formData.departmentName,
    };

    let response;
    try {
      if (editId) {
        requestData.idDepartment = editId;
        response = await updateMasterDepartment(requestData);
      } else {
        response = await addMasterDepartment(requestData);
      }

      if (response.success) {
        fetchDepartments();
        setShowModal(false);
        setEditId(null);
        setFormData({ departmentCode: "", departmentName: "" });
      } else if (response.response?.data?.errors) {
        setValidationErrors(response.response.data.errors);
      }
    } catch (error) {
      console.error("Error submitting department:", error);
    }
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">List of Departments</h5>
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
                      <th>Dept. Code</th>
                      <th>Department Name</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody className="table-border-bottom-0">
                    {departments.data?.length > 0 ? (
                      departments.data.map((dept) => (
                        <tr key={dept.idDepartment}>
                          <td>{dept.departmentCode}</td>
                          <td>{dept.departmentName}</td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
                              onClick={() => handleEditClick(dept.idDepartment)}
                            >
                              <span className="tf-icons bx bx-pencil"></span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center">
                          No Departments Available
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
        <div className="modal-overlay" style={{
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
        }}>
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
                  {editId ? "Update Department" : "Add Department"}
                </h5>
                <button
                  className="btn-close"
                  onClick={handleCloseModal}
                ></button>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-2">
                    <label className="form-label mb-1">Department Code</label>
                    <input
                      type="text"
                      className="form-control"
                      name="departmentCode"
                      maxLength="10"
                      value={formData.departmentCode}
                      onChange={handleInputChange}
                    />
                    {validationErrors.departmentCode && (
                      <div className="text-danger">
                        {validationErrors.departmentCode}
                      </div>
                    )}
                  </div>
                  <div className="mb-2">
                    <label className="form-label mb-1">Department Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="departmentName"
                      maxLength="50"
                      value={formData.departmentName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="text-center">
                    <button type="submit" className="btn btn-primary px-4 me-2">
                      {editId ? "Update" : "Submit"}
                    </button>
                    <button
                      type="reset"
                      className="btn btn-outline-secondary px-4"
                      onClick={() =>
                        setValidationErrors({}) ||
                        setFormData({ departmentCode: "", departmentName: "" })
                        
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
    </div>
  );
}

export default Departments;
