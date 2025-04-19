import React, { useEffect, useState } from "react";
import { Button } from "@mui/material";
import { hideLoader, showLoader } from "../../../redux/reducers/reports";
import { useDispatch, useSelector } from "react-redux";
import { getReportDataAction } from "../../../redux/actions/reportsAction";
import { fetchDesignations } from "../../../redux/reducers/designation";
import { fetchDepartments } from "../../../redux/reducers/department";
import DatePicker from "react-datepicker";

const ReportFilterItem = ({ field, report, handleInputChange, departments, designation }) => {
  const {
    conditionName,
    controlType,
    defaultValue,
    validValues,
    spParameterName,
    mandatoryFlag,
    tableName,
  } = field;

  const isDateField = conditionName?.toLowerCase()?.includes("date");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const defaultDateValue =
    isDateField && defaultValue ? getDefaultDate(defaultValue) : "";

  switch (controlType) {
    case "DATE":
      return (
        <div className="col-md-2" key={spParameterName}>
          <label className="text-[0.9rem]">
            {conditionName}
            {mandatoryFlag == "Y" && <span className="text-danger">*</span>}
          </label>
          <DatePicker
            className="form-control"
            dateFormat="MM/dd/yyyy"
            selected={selectedDate} 
            placeholderText="Date"
            onChange={(date) => {
              var value = date.toISOString().slice(0, 10);
              setSelectedDate(value)
              handleInputChange(
                conditionName,
                spParameterName,
                JSON.stringify({ label: value, value })
              );
            }}
            showYearDropdown
          />
        </div>
      );
    case "TEXTBOX":
      return (
        <div className="col-md-2" key={spParameterName}>
          <label className="text-[0.9rem]">
            {conditionName}
            {mandatoryFlag == "Y" && <span className="text-danger">*</span>}
          </label>
          <input
            type={isDateField ? "date" : "text"}
            key={report?.reportName + spParameterName}
            className="form-control"
            onChange={(e) => {
              var value = isDateField
                ? e.target.value.split("-").reverse().join("-")
                : e.target.value;
              handleInputChange(
                conditionName,
                spParameterName,
                JSON.stringify({ label: value, value })
              );
            }}
          />
        </div>
      );

    case "COMBOBOX":
      return (
        <div className="col-md-2 mx-2" key={spParameterName}>
          <label className="text-[0.9rem]">{conditionName}</label>
          <select
            key={spParameterName + report?.reportName}
            className="form-select"
            onChange={(e) => {
              handleInputChange(
                conditionName,
                spParameterName,
                e.target.value
              );
            }}
          >
            {!validValues && <option value={JSON.stringify({value:"0",label:"ALL"})}>Select</option>}
            {tableName.toLowerCase() === "departments"
              ? departments?.data.map((item) => (
                  <option value={JSON.stringify({value:item.idDepartment,label:item.departmentName})} key={item.idDepartment}>
                    {item.departmentName}
                  </option>
                ))
              : designation?.data.map((item) => (
                  <option value={JSON.stringify({value:item.idDesignation,label:item.designationName})} key={item.idDesignation}>
                    {item.designationName}
                  </option>
                ))}
          </select>
        </div>
      );
    default:
      return null;
  }
};

export default function Filter({ reportCondition, report, downloadFile }) {
  const dispatch = useDispatch();
  const { departments } = useSelector((state) => state.department);
  const { designation } = useSelector((state) => state.designation);
  const [AppliedFilters, setAppliedFilters] = useState({
    Department: 0,
    Designation: 0,
  });
  const [filter, setFilter] = useState({
    "@IdDepartment": 0,
    "@IdDesignation": 0,
  });
  const { reportData } = useSelector((state) => state.reports);

  const handleInputChange = (conditionName,field, value) => {
    const data = JSON.parse(value);
    setAppliedFilters((prevValues) => ({
      ...prevValues,
      [conditionName]: data.label,
    }));
    setFilter((prevValues) => ({
      ...prevValues,
      [field]: data.value,
    }));
  };

  async function getReportData() {
    var content = {
      storedProcedureName: report.storedProcName,
      parameters: filter,
    };
    dispatch(showLoader());
    await dispatch(getReportDataAction(content));
    dispatch(hideLoader());
  }

  useEffect(() => {
    dispatch(fetchDesignations());
    dispatch(fetchDepartments());
  }, []);

  useEffect(() => {
    setFilter({
    "@IdDepartment": 0,
    "@IdDesignation": 0,
    });
    setAppliedFilters({
    Department: 0,
    Designation: 0,
  });
  },[report,reportCondition])

  return (
     <div className="m-3 mt-4 d-flex justify-content-center">
      {reportCondition.map((field, index) => (
        <ReportFilterItem
          key={field.spParameterName + String(index)}
          field={field}
          report={report}
          handleInputChange={handleInputChange}
          departments={departments}
          designation={designation}
        />
      ))}

      {report?.reportName && (
        <div className="flex items-center mt-3 mx-2">
          <Button
            variant="contained"
            color="primary"
            sx={{ backgroundColor: "#75869e", flex: 1 }}
            onClick={getReportData}
          >
            RUN
          </Button>
          <Button
            variant="contained"
            color="success"
            className="mx-2"
            sx={{ backgroundColor: "#203e69", flex: 1 }}
            onClick={() => downloadFile("excel",AppliedFilters)}
            disabled={reportData == null || reportData?.length <= 0}
          >
            EXCEL
          </Button>
          <Button
            variant="contained"
            color="secondary"
            sx={{ backgroundColor: "#75869e", flex: 1 }}
            onClick={() => downloadFile("pdf",AppliedFilters)}
            disabled={reportData == null || reportData?.length <= 0}
          >
            PDF
          </Button>
        </div>
      )}
    </div>
  );
}

export const getDefaultDate = (defaultDate) => {
  switch (defaultDate) {
    case "SYSDATE":
      return dayjs().format("YYYY-MM-DD");
    case "YESTERDAY":
      return dayjs().subtract(1, "day").format("YYYY-MM-DD");
    case "FIRSTDAYPREVIOUSMONTH":
      return dayjs().subtract(1, "month").startOf("month").format("YYYY-MM-DD");
    case "LASTDAYPREVIOUSMONTH":
      return dayjs().subtract(1, "month").endOf("month").format("YYYY-MM-DD");
    default:
      return "";
  }
};
