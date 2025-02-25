import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchVacationMode } from "../../redux/reducers/vacationMode";
import { getAllEmployeeDetails } from "../../redux/reducers/getAllEmployeeDetails";
import Button from "../../components/button";
import Card from "../../components/card";
import DatePicker from "../../components/datePicker";
import Dropdown from "../../components/dropdown";
import Grid from "../../components/grid";
import Input from "../../components/input";
import { useState } from "react";
import { addVacationMode } from "../../redux/reducers/vacationMode";
import { getVacationModeById } from "../../redux/reducers/vacationMode";
import { updateVacationMode } from "../../redux/reducers/vacationMode";

const VacationMode = () => {
  const dispatch = useDispatch();

  const vacationModeState = useSelector(
    (state) => state.vacationMode.vacationModeList
  );
  // const employeeDetailsState = useSelector((state) => state.getEmployeeDetails);
  const getAllEmployeesState = useSelector(
    (state) => state.getAllEmployeeDetails
  );
  console.log("getAllEmployeesState", getAllEmployeesState);
  // console.log("vacationModeState.data", vacationModeState.data);
  // console.log("employeeDetailsState.options", employeeDetailsState.options);
  const [formData, setFormData] = useState({
    employeeName: "",
    vacationFrom: "",
    vacationTo: "",
    approvalAuthoritySubstitute: "",
    reasonForVacation: "",
  });
  const [editingVacationMode, setEditingVacationMode] = useState(null);

  console.log("editingVacationMode", editingVacationMode);

  console.log("formData", formData);
  const [errors, setErrors] = useState({
    reasonForVacation: "",
  });
  const getFinancialYearStart = () => {
    const today = new Date();
    const year =
      today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;

    // Set the date to April 1st at midnight (00:00:00) to avoid time zone issues
    const financialYearStart = new Date(Date.UTC(year, 3, 1, 0, 0, 0));

    // Return the date in YYYY-MM-DD format
    return financialYearStart.toISOString().split("T")[0];
  };

  const [selectedDate, setSelectedDate] = useState(getFinancialYearStart());

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (
      getAllEmployeesState.options.length === 0 &&
      !getAllEmployeesState.loading
    ) {
      dispatch(getAllEmployeeDetails());
    }
  }, [
    dispatch,
    getAllEmployeesState.options.length,
    getAllEmployeesState.loading,
  ]);

  useEffect(() => {
    dispatch(fetchVacationMode());
  }, [dispatch]);

  const employeeOptions = React.useMemo(() => {
    return getAllEmployeesState.options.map((employee) => ({
      value: employee.idEmployee,
      label: employee.fullName,
    }));
  }, [getAllEmployeesState.options]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Changing ${name} to ${value}`);

    // Check if employeeName and approvalAuthoritySubstitute are the same
    // Check if employeeName and approvalAuthoritySubstitute are the same
    if (name === "approvalAuthoritySubstitute") {
      if (value === formData.employeeName) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          approvalAuthoritySubstitute:
            "Employee name cannot be the same as the Approval Authority Substitute.",
        }));
      } else {
        // Clear the error message if the condition is no longer true
        setErrors((prevErrors) => {
          const { approvalAuthoritySubstitute, ...restErrors } = prevErrors;
          return restErrors; // Remove the error for 'approvalAuthoritySubstitute'
        });
      }
    }

    if (name === "vacationFrom" || name === "vacationTo") {
      const vacationFromDate = new Date(formData.vacationFrom);
      const vacationToDate = new Date(value);
  
      if (name === "vacationTo" && vacationFromDate > vacationToDate) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          vacationTo: "Vacation To date must be later than Vacation From date.",
        }));
      } else {
        // Clear the error if it's valid
        setErrors((prevErrors) => {
          const { vacationTo, ...restErrors } = prevErrors;
          return restErrors;
        });
      }
    }

    setFormData({
      ...formData,
      [name]: value,
    });
    console.log("Updated formData:", formData);
    if (name === "reasonForVacation" && value.trim() !== "") {
      setErrors((prevErrors) => ({
        ...prevErrors,
        reasonForVacation: "",
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let newErrors = {};

    if (!formData.reasonForVacation) {
      setErrors({
        ...errors,
        reasonForVacation: "Reason for vacation is required.",
      });
      return;
    }

    // Validate if vacationTo is later than vacationFrom
    const vacationFromDate = new Date(formData.vacationFrom);
    const vacationToDate = new Date(formData.vacationTo);
    if (vacationFromDate > vacationToDate) {
      newErrors.vacationTo = "Vacation To date must be later than Vacation From date.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const data = {
      idEmployee: formData.employeeName,
      vacationFrom: formData.vacationFrom,
      vacationTo: formData.vacationTo,
      idSubstitueEmployee: formData.approvalAuthoritySubstitute,
      reasonForVacation: formData.reasonForVacation,
    };

    if (editingVacationMode) {
      // Update existing vacation mode
      dispatch(
        updateVacationMode({
          idVacationMode: editingVacationMode.idVacationMode,
          ...data,
        })
      ).then((action) => {
        if (action.payload && action.payload.success) {
          resetForm();
          dispatch(fetchVacationMode());
        }
      });
    } else {
      // Add new vacation mode
      dispatch(addVacationMode(data)).then((action) => {
        if (action.payload && action.payload.success) {
          resetForm();
          dispatch(fetchVacationMode());
        }
      });
    }
  };

  const resetForm = () => {
    setFormData({
      employeeName: "",
      vacationFrom: "",
      vacationTo: "",
      approvalAuthoritySubstitute: "",
      reasonForVacation: "",
    });
    setEditingVacationMode(null);
    setErrors({}); // Clear validation errors
  };

  const handleEditClick = (idVacationMode) => {
    dispatch(getVacationModeById(idVacationMode)).then((action) => {
      if (action.payload && action.payload.success) {
        const vacationData = action.payload.data;
        console.log("vacationData", vacationData);
        setEditingVacationMode(vacationData);
        const formatDate = (dateStr) => {
          const date = new Date(dateStr);
          // Adjust for the time zone by setting the hours to UTC
          const adjustedDate = new Date(
            date.getTime() - date.getTimezoneOffset() * 60000
          );
          return adjustedDate.toISOString().split("T")[0]; // Get only the date part (YYYY-MM-DD)
        };
        setFormData({
          employeeName: vacationData.idEmployee.toString(),
          vacationFrom: formatDate(vacationData.vacationFrom),
          vacationTo: formatDate(vacationData.vacationTo),
          approvalAuthoritySubstitute:
            vacationData.idSubstitueEmployee.toString(),
          reasonForVacation: vacationData.reasonForVacation || "",
        });
      }
    });
  };

  const vacationList = React.useMemo(() => {
    return Array.isArray(vacationModeState.data)
      ? vacationModeState.data.map((vacation) => {
          console.log("vacation", vacation);

          const empCode = vacation ? vacation.employeeCode : "N/A";
          const employeeName = vacation ? vacation.employeeName : "N/A";
          const substitute = vacation ? vacation.substituteEmployeeName : "N/A";
          const formatDate = (date) => {
            if (!date) return "N/A";
            const newDate = new Date(date);
            const month = String(newDate.getMonth() + 1).padStart(2, "0"); // Get month, ensure 2 digits
            const day = String(newDate.getDate()).padStart(2, "0"); // Get day, ensure 2 digits
            const year = newDate.getFullYear(); // Get year

            return `${month}/${day}/${year}`; // Format as MM/DD/YYYY
          };

          return {
            empCode,
            employeeName,
            dateFrom: formatDate(vacation.vacationFrom),
            dateTo: formatDate(vacation.vacationTo),
            substitute,
            id: vacation.idVacationMode,
            reasonForVacation: vacation.reasonForVacation,
          };
        })
      : [];
  }, [vacationModeState.data]);

  const filteredVacationList = React.useMemo(() => {
    return vacationList.filter((vacation) => {
      if (!selectedDate) return true;
      const selectedDateObj = new Date(selectedDate);
      const vacationDateObj = new Date(vacation.dateFrom);
      return vacationDateObj >= selectedDateObj;
    });
  }, [vacationList, selectedDate]);

  // if (!vacationModeState.data || vacationModeState.data.length === 0) {
  //   return <div>No vacation data available.</div>;
  // }

  // if (vacationModeState.loading) {
  //   return <div>Loading...</div>;
  // }

  // if (vacationModeState.error) {
  //   return <div>Error: {vacationModeState.error}</div>;
  // }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-8">
          <Card>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">List of Employees on Vacation Mode</h5>
              <div className="d-flex align-items-center">
                <label htmlFor="vacationFrom" className="me-2 mb-0 mt-3">
                  Date From:
                </label>
                <DatePicker
                  id="vacationFrom"
                  name="vacationFrom"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>

            <Grid
              columns={[
                { key: "empCode", label: "Emp. Code" },
                { key: "employeeName", label: "Employee Name" },
                { key: "dateFrom", label: "Date From" },
                { key: "dateTo", label: "Date To" },
                { key: "substitute", label: "Substitute" },
                { key: "actions" },
              ]}
              data={filteredVacationList}
              onEditClick={handleEditClick}
              idKey="id"
            />
          </Card>
        </div>
        <div className="col-lg-4">
          <Card title="Add/Update Vacation Mode">
            <form onSubmit={handleSubmit}>
              <Dropdown
                label="Employee Name"
                name="employeeName"
                options={employeeOptions}
                value={formData.employeeName}
                onChange={handleInputChange}
                style={{ maxWidth: "331px" }}
              />

              <DatePicker
                label="Vacation From"
                name="vacationFrom"
                value={formData.vacationFrom}
                onChange={handleInputChange}
                min={today}
              />
              <DatePicker
                label="Vacation To"
                name="vacationTo"
                value={formData.vacationTo}
                onChange={handleInputChange}
                min={today}
              />
              {errors.vacationTo && <p className="text-danger">{errors.vacationTo}</p>}
              <Dropdown
                label="Approval Authority Substituted to"
                name="approvalAuthoritySubstitute"
                options={employeeOptions}
                value={formData.approvalAuthoritySubstitute}
                onChange={handleInputChange}
                style={{ maxWidth: "331px" }}
              />
              {/* <div className="mb-2"> */}
              {errors.approvalAuthoritySubstitute && (
                <p className="text-danger">
                  {errors.approvalAuthoritySubstitute}
                </p>
              )}
              <Input
                label="Reason for Vacation"
                name="reasonForVacation"
                value={formData.reasonForVacation}
                onChange={handleInputChange}
                maxLength="150"
                error={errors.reasonForVacation}
                style={{ maxWidth: "331px" }}
              />
              {/* </div> */}
              <div className="text-center">
                <Button type="submit" className="btn btn-primary px-4 me-2">
                  {editingVacationMode ? "Update" : "Submit"}
                </Button>
                <Button
                  type="button"
                  className="btn btn-outline-secondary px-4"
                  onClick={resetForm}
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

export default VacationMode;
