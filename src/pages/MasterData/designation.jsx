import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDesignations, addMasterDesignation, getMasterDesignationListById, updateDesignations } from "../../redux/reducers/designation";
import Card from "../../components/card";
import Grid from "../../components/grid";
import Input from "../../components/input";
import Button from "../../components/button";
import RadioButton from "../../components/radioButton";

const Designation = () => {
  const dispatch = useDispatch();
  const designationState = useSelector((state) => state.designation);
  const { designation, error } = designationState;

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    overtime: "Yes",
  });

  const [editId, setEditId] = useState(null); // Track edit mode
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    dispatch(fetchDesignations());
  }, [dispatch]);

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  
    let errors = { ...validationErrors };
  
    if (name === "code") {
      if (value === "") {
        delete errors.code; // Allow empty value
      } else if (value.length > 10) {
        errors.code = "Designation Code cannot exceed 10 characters.";
      } else if (!isValidCode(value)) {
        errors.code = "Designation Code must be alphanumeric.";
      } else if (!isUniqueCode(value)) {
        errors.code = "Designation Code must be unique.";
      } else {
        delete errors.code; // Clear the error if valid
      }
    }
  
    if (name === "name") {
      if (value.trim() === "") {
        errors.name = "Designation Name is required.";
      } else {
        delete errors.name; // Clear the error if valid
      }
    }
  
    if (name === "overtime") {
      if (!["Yes", "No"].includes(value)) {
        errors.overtime = "Overtime Allowed must be Yes or No.";
      } else {
        delete errors.overtime; // Clear the error if valid
      }
    }
  
    setValidationErrors(errors);
  };
  
  

  const isUniqueCode = (code) => {
    return !designation.data.some(
      (item) => item.designationCode.toLowerCase() === code.toLowerCase() && item.idDesignation !== editId
    );
  };

  const isValidCode = (code) => {
    const alphanumericRegex = /^[a-z0-9]+$/i;
    return alphanumericRegex.test(code);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const payload = {
      idDesignation: editId, // Include only if updating
      designationCode: formData.code,
      designationName: formData.name,
      isOvertimeAllowanceAllowed: formData.overtime === "Yes",
    };

    try {
      if (editId) {
        await dispatch(updateDesignations(payload)).unwrap();
      } else {
        await dispatch(addMasterDesignation(payload)).unwrap();
      }
      
      setFormData({ code: "", name: "", overtime: "Yes" });
      setEditId(null); // Reset edit mode
      setValidationErrors({}); // Clear validation errors
      dispatch(fetchDesignations());
    } catch (err) {
      console.error("Failed to save designation:", err);
    }
  };

  const handleEditClick = async (id) => {
    try {
      const response = await dispatch(getMasterDesignationListById(id)).unwrap();
      if (response) {
        setFormData({
          code: response.data.designationCode,
          name: response.data.designationName,
          overtime: response.data.isOvertimeAllowanceAllowed ? "Yes" : "No",
        });
        setEditId(id);
      }
    } catch (err) {
      console.error("Failed to fetch designation details:", err);
    }
  };

  const handleReset = () => {
    setFormData({ code: "", name: "", overtime: "" });
    setEditId(null); // Exit edit mode
    setValidationErrors({}); // Clear validation errors
  };

  const columns = [
    { key: "designationCode", label: "Des. Code" },
    { key: "designationName", label: "Designation Name" },
    {
      key: "isOvertimeAllowanceAllowed",
      label: "Overtime Allowed",
      render: (value) => (value ? "Yes" : "No"),
    },
    { key: "actions", label: "" },
  ];

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-8">
          <Card title="List of Designations">
            {error ? (
              <p className="text-danger">Error: {error}</p>
            ) : (
              <Grid
                columns={columns}
                data={designation.data}
                onEditClick={handleEditClick}
                idKey="idDesignation"
              />
            )}
          </Card>
        </div>

        <div className="col-lg-4">
          <Card title={editId ? "Update Designation" : "Add Designation"}>
            <form onSubmit={handleSubmit}>
              <Input
                label="Designation Code"
                name="code"
                value={formData.code}
                onChange={(e) => handleChange("code", e.target.value)}
                maxLength="11"
              />
              {validationErrors.code && <p className="text-danger">{validationErrors.code}</p>}
              <Input
                label="Designation Name"
                name="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                maxLength="50"
              />
              {validationErrors.name && <p className="text-danger">{validationErrors.name}</p>}
              <label className="form-label">Overtime Allowed</label>
              <RadioButton
                name="overtime"
                options={[
                  { label: "Yes", value: "Yes" },
                  { label: "No", value: "No" },
                ]}
                selectedValue={formData.overtime}
                onChange={(value) => handleChange("overtime", value)}
              />
              {validationErrors.overtime && <p className="text-danger">{validationErrors.overtime}</p>}
              <div
                className="text-center d-flex justify-content-center gap-3"
                style={{ marginTop: "10px" }}
              >
                <Button type="submit" className="btn btn-primary px-4 me-2">
                  {editId ? "Update" : "Submit"}
                </Button>
                <Button
                  type="reset"
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
    </div>
  );
};

export default Designation;