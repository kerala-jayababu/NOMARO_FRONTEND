import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Card from "../../components/card";
import Grid from "../../components/grid";
import Input from "../../components/input";
import Button from "../../components/button";
import {
  fetchDepartments,
  addMasterDepartment,
  getMasterDepartmentListById,
  updateDepartments,
} from "../../redux/reducers/department"; // Updated with correct import

const Departments = () => {
  const dispatch = useDispatch();
  const { departments, error } = useSelector(
    (state) => state.department
  );

  const [deptCode, setDeptCode] = useState("");
  const [deptName, setDeptName] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDepartmentId, setEditingDepartmentId] = useState(null);

  useEffect(() => {
    // Dispatch the fetchDepartments action when the component mounts
    dispatch(fetchDepartments());
  }, [dispatch]);

  const columns = [
    { key: "departmentCode", label: "Dept. Code" },
    { key: "departmentName", label: "Department Name" },
    { key: "actions", label: "" },
  ];

  const validateInputs = (field, value) => {
    const validationErrors = {};
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;

    if (field === "deptCode") {
      if (value && !value.match(alphanumericRegex)) {
        validationErrors.deptCode =
          "Department Code must contain only alphanumeric characters.";
      } else if (
        value &&
        departments.data?.some((dept) => dept.departmentCode.toLowerCase() === value.toLowerCase() && dept.idDepartment !== editingDepartmentId)
      ) {
        validationErrors.deptCode = "Department Code already exists.";
      } else {
        delete validationErrors.deptCode;
      }
    }

    if (field === "deptName") {
      if (value && departments.data?.some((dept) => dept.departmentName.toLowerCase() === value.toLowerCase() && dept.idDepartment !== editingDepartmentId)) {
        validationErrors.deptName = "Department Name already exists.";
      } else {
        delete validationErrors.deptName;
      }
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    if (field === "deptCode") setDeptCode(value);
    if (field === "deptName") setDeptName(value);

    // Trigger validation on typing
    validateInputs(field, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !validateInputs("deptCode", deptCode) ||
      !validateInputs("deptName", deptName)
    ) {
      return;
    }

    const departmentData = {
      departmentCode: deptCode,
      departmentName: deptName,
    };

    try {
      setIsSubmitting(true);
      let resultAction;

      if (editingDepartmentId) {
        console.log("Updating department with ID:", editingDepartmentId);
        // Updating existing department
        resultAction = await dispatch(
          updateDepartments({
            idDepartment: editingDepartmentId, // Ensure this ID is correctly passed
            ...departmentData,
          })
        );
      } else {
        // Adding new department
        resultAction = await dispatch(addMasterDepartment(departmentData));
      }

      if (resultAction.payload && resultAction.payload.success) {
        setDeptCode("");
        setDeptName("");
        setErrors({});
        setEditingDepartmentId(null); // Reset ID after update
        dispatch(fetchDepartments());
      }
    } catch (error) {
      console.error("Error processing department:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (id) => {
    try {
      console.log("Fetching department details for ID:", id);
      const resultAction = await dispatch(getMasterDepartmentListById(id));

      if (getMasterDepartmentListById.fulfilled.match(resultAction)) {
        console.log("Department Data Received:", resultAction.payload);
        const department = resultAction.payload;

        if (department) {
          setDeptCode(department.data.departmentCode);
          setDeptName(department.data.departmentName);
          setEditingDepartmentId(department.data.idDepartment); // Ensure ID is set correctly
        } else {
          console.error("No department data found");
        }
      } else {
        console.error(
          "Failed to fetch department details:",
          resultAction.error
        );
      }
    } catch (error) {
      console.error("Error fetching department details:", error);
    }
  };

  const handleReset = () => {
    setDeptCode("");
    setDeptName("");
    setErrors({});
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-8">
          <Card title="List of Departments">
            {error ? (
              <div className="text-danger">{error}</div>
            ) : (
              <Grid
                columns={columns}
                data={departments.data}
                onEditClick={handleEdit}
                idKey="idDepartment"
              />
            )}
          </Card>
        </div>
        <div className="col-lg-4">
          <Card title="Add/Update Department">
            <form onSubmit={handleSubmit}>
              <Input
                label="Department Code"
                name="deptCode"
                value={deptCode}
                onChange={(e) => handleInputChange("deptCode", e.target.value)}
                maxLength="10"
                error={errors.deptCode}
              />
              <Input
                label="Department Name"
                name="deptName"
                value={deptName}
                onChange={(e) => handleInputChange("deptName", e.target.value)}
                maxLength="50"
                error={errors.deptName}
              />
              {errors.message && (
                <div className="text-danger">{errors.message}</div>
              )}
              <div className="text-center">
                <Button
                  type="submit"
                  className="btn btn-primary px-4 me-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Loading..." : "Submit"}
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

export default Departments;