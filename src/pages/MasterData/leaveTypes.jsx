import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Card from "../../components/card";
import Grid from "../../components/grid";
import Input from "../../components/input";
import Button from "../../components/button";
import secureLocalStorage from "react-secure-storage";
import {
  fetchLeaveTypes,
  addUpdateLeaveType,
} from "../../redux/reducers/leaveType";

const LeaveTypes = () => {
  const dispatch = useDispatch();
  const { leaveTypes, error } = useSelector((state) => state.leaveType);

  const [leaveCode, setLeaveCode] = useState("");
  const [leaveTypeName, setLeaveTypeName] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLeaveTypeId, setEditingLeaveTypeId] = useState(null);

  useEffect(() => {
    dispatch(fetchLeaveTypes());
  }, [dispatch]);

  const getCurrentUserId = () => {
    const user = secureLocalStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      return userData.idEmployee || 1;
    }
    return 1;
  };

  const columns = [
    { key: "leaveCode", label: "Leave Code" },
    { key: "leaveTypeName", label: "Leave Name" },
    { key: "actions", label: "" },
  ];

  const validateInputs = (field, value) => {
    const validationErrors = {};
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;

    if (field === "leaveCode") {
      if (value && !value.match(alphanumericRegex)) {
        validationErrors.leaveCode =
          "Leave Code must contain only alphanumeric characters.";
      } else if (
        value &&
        leaveTypes.data?.some(
          (lt) =>
            lt.leaveCode.toLowerCase() === value.toLowerCase() &&
            lt.idLeaveType !== editingLeaveTypeId
        )
      ) {
        validationErrors.leaveCode = "Leave Code Already Exists.";
      } else {
        delete validationErrors.leaveCode;
      }
    }

    if (field === "leaveTypeName") {
      if (
        value &&
        leaveTypes.data?.some(
          (lt) =>
            lt.leaveTypeName.toLowerCase() === value.toLowerCase() &&
            lt.idLeaveType !== editingLeaveTypeId
        )
      ) {
        validationErrors.leaveTypeName = "Leave Name Already Exists.";
      } else {
        delete validationErrors.leaveTypeName;
      }
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    if (field === "leaveCode") setLeaveCode(value);
    if (field === "leaveTypeName") setLeaveTypeName(value);

    validateInputs(field, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrors({});

    const errors = {};
    if (!leaveCode) {
      errors.leaveCode = "Leave code is required";
    }
    if (!leaveTypeName) {
      errors.leaveTypeName = "Leave name is required";
    }

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    const leaveTypeData =
      {
        idLeaveType: editingLeaveTypeId || 0,
        leaveCode: leaveCode,
        leaveTypeName: leaveTypeName,
        idUser: getCurrentUserId(),
      };

    try {
      setIsSubmitting(true);
      const resultAction = await dispatch(addUpdateLeaveType(leaveTypeData));

      if (resultAction.payload && resultAction.payload.success) {
        setLeaveCode("");
        setLeaveTypeName("");
        setErrors({});
        setEditingLeaveTypeId(null);
        dispatch(fetchLeaveTypes());
      }
    } catch (error) {
      console.error("Error processing leave type:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (id) => {
    const leaveType = leaveTypes.data?.find((lt) => lt.idLeaveType === id);
    if (leaveType) {
      setLeaveCode(leaveType.leaveCode);
      setLeaveTypeName(leaveType.leaveTypeName);
      setEditingLeaveTypeId(leaveType.idLeaveType);
    }
  };

  const handleReset = () => {
    setLeaveCode("");
    setLeaveTypeName("");
    setErrors({});
    setEditingLeaveTypeId(null);
  };

  const enrichedData = leaveTypes.data;

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-8">
          <Card title="List of Leave Types">
            {error ? (
              <div className="text-danger">{error}</div>
            ) : (
              <Grid
                columns={columns}
                data={enrichedData}
                onEditClick={handleEdit}
                idKey="idLeaveType"
              />
            )}
          </Card>
        </div>
        <div className="col-lg-4">
          <Card title="Add/Update Leave Type">
            <form onSubmit={handleSubmit}>
              <Input
                label="Leave Code"
                name="leaveCode"
                value={leaveCode}
                onChange={(e) => handleInputChange("leaveCode", e.target.value)}
                maxLength="10"
                error={errors.leaveCode}
              />
              <Input
                label="Leave Name"
                name="leaveTypeName"
                value={leaveTypeName}
                onChange={(e) =>
                  handleInputChange("leaveTypeName", e.target.value)
                }
                maxLength="50"
                error={errors.leaveTypeName}
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

export default LeaveTypes;
