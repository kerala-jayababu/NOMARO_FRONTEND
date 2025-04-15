import React, { useEffect, useState } from "react";
import { Button } from "@mui/material";
import { hideLoader, showLoader } from "../../../redux/reducers/reports";
import { useDispatch, useSelector } from "react-redux";
import { getReportDataAction } from "../../../redux/actions/reportsAction";
import { fetchDesignations } from "../../../redux/reducers/designation";
import { fetchDepartments } from "../../../redux/reducers/department";

function parseValidValues(validValues) {
  return validValues.split(",").map((v) => {
    const [value, label] = v.split(":");
    return { value: value.trim(), label: label.trim() };
  });
}

const ReportFilterItem = ({ field, report, handleInputChange }) => {
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
  const defaultDateValue =
    isDateField && defaultValue ? getDefaultDate(defaultValue) : "";

  switch (controlType) {
    case "TEXTBOX":
      return (
        <div className="col-md-2 mx-1" key={spParameterName}>
          <label className="text-[0.9rem]">
            {conditionName}
            {mandatoryFlag == "Y" && <span className="text-danger">*</span>}
          </label>
          <input
            type={isDateField ? "date" : "text"}
            key={report?.reportName + spParameterName}
            // value={defaultDateValue}
            className="form-control"
            onChange={(e) => {
              var value = isDateField
                ? e.target.value.split("-").reverse().join("-")
                : e.target.value;
              handleInputChange(
                spParameterName,
                JSON.stringify({ label: value, value })
              );
            }}
          />
        </div>
      );

    case "COMBOBOX":
      const { departments } = useSelector((state) => state.department);
      const { designation } = useSelector((state) => state.designation);
      return (
        <div className="col-md-2 mx-1" key={spParameterName}>
          <label className="text-[0.9rem]">{conditionName}</label>
          <select
            key={spParameterName + report?.reportName}
            className="form-select"
            onChange={(e) => {
              handleInputChange(spParameterName, JSON.stringify({value:e.target.value}));
            }}
          >
            {!validValues && <option value={"0"}>Select</option>}
            {tableName.toLowerCase() === "departments"
              ? departments?.data.map((item) => (
                  <option value={item.idDepartment} key={item.idDepartment}>
                    {item.departmentName}
                  </option>
                ))
              : designation?.data.map((item) => (
                  <option value={item.idDesignation} key={item.idDesignation}>
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
  const [filter, setFilter] = useState({"@IdDepartment":0,"@IdDesignation":0});

  const handleInputChange = (field, value) => {
    const data = JSON.parse(value);
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
    console.log("content", content);
    dispatch(showLoader());
    await dispatch(getReportDataAction(content));
    dispatch(hideLoader());
  }

  useEffect(() => {
    dispatch(fetchDesignations());
    dispatch(fetchDepartments());
  }, []);

  return (
    <div className="d-flex mx-3 mt-4">
      <div className="absolute left-[79.1rem] mt-4 d-flex justify-start w-[16rem]">
        <h6 className="fw-bold">{report?.reportName}</h6>
      </div>

      {reportCondition.map((field) => (
        <ReportFilterItem
          key={field.sPParameterName}
          field={field}
          report={report}
          handleInputChange={handleInputChange}
        />
      ))}

      {report?.reportName && (
        <div className="flex items-center mt-3 mx-2">
          <Button
            variant="contained"
            color="primary"
            sx={{ backgroundColor: "#007BFF", flex: 1 }}
            onClick={getReportData}
          >
            RUN
          </Button>
          <Button
            variant="contained"
            color="secondary"
            className="mx-2"
            sx={{ backgroundColor: "#FF0000", flex: 1 }}
            onClick={() => downloadFile("pdf")}
            // disabled={reportData == null || reportData?.length <= 0}
          >
            PDF
          </Button>
          <Button
            variant="contained"
            color="success"
            sx={{ backgroundColor: "#28A745", flex: 1 }}
            onClick={() => downloadFile("excel")}
            // disabled={reportData == null || reportData?.length <= 0}
          >
            EXCEL
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
