import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Card from "../../components/card";
import Grid from "../../components/grid";
import Input from "../../components/input";
import Button from "../../components/button";
import {
  fetchBudgetCode,
  addBudgetCode,
  getBudgetCodeById,
  updateBudgetCode,
} from "../../redux/reducers/budgetCode";

const BudgetCodes = () => {
  const dispatch = useDispatch();
  const budgetCodeState = useSelector((state) => state.budgetCode);
  const { status, options } = budgetCodeState;

  const [budgetCode, setBudgetCode] = useState("");
  const [budgetName, setBudgetName] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localBudgetCodes, setLocalBudgetCodes] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    dispatch(fetchBudgetCode());
  }, [dispatch]);

  useEffect(() => {
    if (status === "succeeded" && options?.data) {
      setLocalBudgetCodes(options.data);
    }
  }, [status, options]);

  const columns = [
    { key: "budgetCode", label: "Budget Code" },
    { key: "budgetCodeName", label: "Budget Name" },
    { key: "actions", label: "" },
  ];



  const validateInputs = (field, value) => {
    let validationErrors = { ...errors };
    const alphanumericRegex = /^[a-zA-Z0-9-]+$/;   

      // Check if the field is empty, and show the required message
  if (field === "budgetCode" && !value) {
    validationErrors.budgetCode = "Budget Code is required.";
  } else if (field === "budgetName" && !value) {
    validationErrors.budgetName = "Budget Name is required.";
  }

  
    if (field === "budgetCode" && value ) {
      if (value.length === 0) {
        validationErrors.budgetCode = null;
      } else if (value.length > 10) {
        validationErrors.budgetCode = "Budget Code must be 10 characters or less.";
      } else if (!value.match(alphanumericRegex)) {
        validationErrors.budgetCode = "Budget Code must contain only alphanumeric characters.";
      } else {
        // Check for duplicates, excluding the current editing item
        console.log("Checking for duplicates:", localBudgetCodes);
        const isDuplicate = localBudgetCodes?.some((item) => {
          console.log("Checking for duplicates:");
          console.log("Current item:", item);
          console.log("Editing ID:", editingId);
          console.log("Item ID:", item.idBudgetCode);
          console.log("Item Budget Code:", item.budgetCode);
          console.log("Input Budget Code:", value);
  
          return (
            value &&
            item.budgetCode.toLowerCase() === value.toLowerCase() &&
            item.idBudgetCode !== editingId
          );
        });
  
        console.log("Is Duplicate:", isDuplicate);
  
        if (isDuplicate) {
          validationErrors.budgetCode = "Budget Code Already Exists.";
        } else {
          delete validationErrors.budgetCode;
        }
      }
    }
  
    if (field === "budgetName") {
      if (value.length === 0) {
        delete validationErrors.budgetName;
      } else if (value.length > 50) {
        validationErrors.budgetName = "Budget Name must be 50 characters or less.";
      } else {
        const isDuplicate = budgetCodeState.options?.data?.some(
          (item) =>
            item.budgetCodeName.toLowerCase() === value.toLowerCase() &&
            item.idBudgetCode !== editingId
        );
  
        if (isDuplicate) {
          validationErrors.budgetName = "Budget Name Already Exists.";
        } else {
          delete validationErrors.budgetName;
        }
      }
    }
  
    console.log("Validation Errors:", validationErrors);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };


  

  const handleChange = (field, value) => {
    if (field === "budgetCode") setBudgetCode(value);
    if (field === "budgetName") setBudgetName(value);

    validateInputs(field, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

      // Validate inputs before submitting
  const isBudgetCodeValid = validateInputs("budgetCode", budgetCode);
  const isBudgetNameValid = validateInputs("budgetName", budgetName);

  console.log("Validation Results:", {
    isBudgetCodeValid,
    isBudgetNameValid,
    errors,
  });


    if (
      !validateInputs("budgetCode", budgetCode) ||
      !validateInputs("budgetName", budgetName)
    )
      return;

    const newBudget = { budgetCode, budgetCodeName: budgetName };

    try {
      setIsSubmitting(true);
      if (isEditing) {
        // If we are editing, dispatch updateBudgetCode
        const resultAction = await dispatch(
          updateBudgetCode({ ...newBudget, idBudgetCode: editingId })
        );
        if (resultAction.payload && resultAction.payload.success) {
          console.log("Budget code updated successfully");
          const updatedData = resultAction.payload.data;
          setLocalBudgetCodes(
            localBudgetCodes.map((item) =>
              item.idBudgetCode === updatedData.idBudgetCode
                ? updatedData
                : item
            )
          );
          setEditingId(null);
          setIsEditing(false);
        }
      } else {
        // If we are adding a new budget, dispatch addBudgetCode
        const resultAction = await dispatch(addBudgetCode(newBudget));
        if (resultAction.payload && resultAction.payload.success) {
          console.log("Budget code added successfully");
          setLocalBudgetCodes([...localBudgetCodes, resultAction.payload.data]);
        }
      }
      setBudgetCode("");
      setBudgetName("");
      setErrors({});
      dispatch(fetchBudgetCode());
    } catch (error) {
      console.error("Error saving budget code:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setBudgetCode("");
    setBudgetName("");
    setErrors({});
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEdit = (id) => {
    dispatch(getBudgetCodeById(id)).then((action) => {
      if (action.payload && action.payload.success) {
        setBudgetCode(action.payload.data.budgetCode);
        setBudgetName(action.payload.data.budgetCodeName);
        setEditingId(action.payload.data.idBudgetCode);
        setIsEditing(true);
      }
    });
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-8">
          <Card title="List of Budget Codes">
            {localBudgetCodes.length > 0 && (
              <Grid
                columns={columns}
                data={localBudgetCodes}
                idKey="idBudgetCode"
                onEditClick={handleEdit}
              />
            )}
          </Card>
        </div>
        <div className="col-lg-4">
          <Card title="Add/Update Budget Code">
            <form onSubmit={handleSubmit}>
              <Input
                label="Budget Code"
                name="budgetCode"
                value={budgetCode}
                onChange={(e) => handleChange("budgetCode", e.target.value)}
                maxLength="11"
              />
              {errors.budgetCode && (
                <p className="text-danger">{errors.budgetCode}</p>
              )}

              <Input
                label="Budget Name"
                name="budgetName"
                value={budgetName}
                onChange={(e) => handleChange("budgetName", e.target.value)}
                maxLength="50"
              />
              {errors.budgetName && (
                <p className="text-danger">{errors.budgetName}</p>
              )}

              <div className="text-center">
                <Button
                  type="submit"
                  className="btn btn-primary px-4 me-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : isEditing ? "Update" : "Submit"}
                </Button>

                <Button
                  type="button"
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

export default BudgetCodes;
