import { useEffect, useState } from "react";
import {
  getBudgetList,
  getBudgetById,
  updateBudgetCode,
  addBudgetCode,
} from "../../utils/service";

function BudgetCodes() {
  const [budgetList, setBudgetList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    budgetCode: "",
    budgetCodeName: "",
  });
  const [editId, setEditId] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchBudgetList();
  }, []);
  const fetchBudgetList = async () => {
    const data = await getBudgetList();
    setBudgetList(data);
  };

  const handleAddClick = () => {
    setFormData({ budgetCode: "", budgetCodeName: "" });
    setEditId(null);
    setValidationErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ budgetCode: "", budgetCodeName: "" });
    setValidationErrors({});
    setEditId(null); 
  };

  const handleEditClick = async (id) => {
    const data = await getBudgetById(id);
    if (data.success) {
      setFormData({
        budgetCode: data.data.budgetCode,
        budgetCodeName: data.data.budgetCodeName,
      });
      setEditId(id);
      setShowModal(true);
    }
  };

  const validateInput = (name, value) => {
    let errors = { ...validationErrors };

    const alphanumericRegex = /^[a-zA-Z0-9]*$/;

    if (name === "budgetCode") {
      if (!alphanumericRegex.test(value)) {
        errors.budgetCode =
          "Budget code must contain only alphanumeric characters.";
      } else if (value.length >= 10) {
        errors.budgetCode = "Budget code must not exceed 10 characters.";
      } else {
        delete errors.budgetCode;
      }
    }

    if (name === "budgetCodeName") {
      if (!alphanumericRegex.test(value)) {
        errors.budgetCodeName =
          "Budget Name must contain only alphanumeric characters.";
      } else {
        delete errors.budgetCodeName;
      }
    }

    setValidationErrors(errors);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    validateInput(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors({});
  
    const isDuplicate = budgetList.data?.some(
      (budget) =>
        budget.budgetCode.toLowerCase() === formData.budgetCode.toLowerCase() &&
        budget.idBudgetCode !== editId 
    );
  
    if (isDuplicate) {
      setValidationErrors({ budgetCode: "Budget code already exists." });
      return;
    }
  
    const requestData = {
      budgetCode: formData.budgetCode,
      budgetCodeName: formData.budgetCodeName,
    };
  
    let response;
    try {
      if (editId) {
        requestData.idBudgetCode = editId;
        response = await updateBudgetCode(requestData);
      } else {
        response = await addBudgetCode(requestData);
      }
  
      if (response.success) {
        fetchBudgetList(); 
        handleCloseModal(); 
      } else {
        let errors = {};
  
        if (response.response?.data?.errors) {
          const apiErrors = response.response.data.errors;
          if (apiErrors.BudgetCode) {
            errors.budgetCode = apiErrors.BudgetCode[0]; 
          }
          if (apiErrors.BudgetCodeName) {
            errors.budgetCodeName = apiErrors.BudgetCodeName[0];
          }
        }
  
        setValidationErrors(errors);
      }
    } catch (error) {
      console.error("Error submitting budget code:", error);
    }
  };
  

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">List of Budget Codes</h5>
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
                      <th>Budget Code</th>
                      <th>Budget Name</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody className="table-border-bottom-0">
                    {budgetList.data?.length > 0 ? (
                      budgetList.data.map((budget) => (
                        <tr key={budget.idBudgetCode}>
                          <td>{budget.budgetCode}</td>
                          <td>{budget.budgetCodeName}</td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
                              onClick={() =>
                                handleEditClick(budget.idBudgetCode)
                              }
                            >
                              <span className="tf-icons bx bx-pencil"></span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center">
                          No budget codes available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
                    {editId ? "Update Budget Code" : "Add Budget Code"}
                  </h5>
                  <button
                    className="btn-close"
                    onClick={handleCloseModal}
                  ></button>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="mb-2">
                      <label className="form-label mb-1">Budget Code</label>
                      <input
                        type="text"
                        className="form-control"
                        name="budgetCode"
                        maxLength="10"
                        value={formData.budgetCode}
                        onChange={handleInputChange}
                      />
                      {validationErrors.budgetCode && (
                        <div className="text-danger">
                          {validationErrors.budgetCode}
                        </div>
                      )}
                    </div>
                    <div className="mb-2">
                      <label className="form-label mb-1">Budget Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="budgetCodeName"
                        maxLength="50"
                        value={formData.budgetCodeName}
                        onChange={handleInputChange}
                      />
                      {validationErrors.budgetCodeName && (
                        <div className="text-danger">
                          {validationErrors.budgetCodeName}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <button
                        type="submit"
                        className="btn btn-primary px-4 me-2"
                      >
                        {editId ? "Update" : "Submit"}
                      </button>
                      <button
                        type="reset"
                        className="btn btn-outline-secondary px-4"
                        onClick={() =>
                          setValidationErrors({}) ||
                          setFormData({ budgetCode: "", budgetCodeName: "" })
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
    </div>
  );
}

export default BudgetCodes;
