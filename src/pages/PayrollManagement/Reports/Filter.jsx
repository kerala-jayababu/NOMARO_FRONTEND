import React, { useEffect, useState } from "react";
import { Button } from "@mui/material";
import { hideLoader, showLoader } from "../../../redux/reducers/reports";
import { useDispatch, useSelector } from "react-redux";
import { getReportDataAction } from "../../../redux/actions/reportsAction";
import DatePicker from "react-datepicker";
import dayjs from "dayjs";
import { API } from "../../../redux/api/utils";

const ReportFilterItem = ({ field, report, handleInputChange }) => {
  const {
    conditionName,
    controlType,
    defaultValue,
    validValues,
    spParameterName,
    mandatoryFlag,
  } = field;

  const isDateField = conditionName?.toLowerCase()?.includes("date");
  const defaultDateValue = defaultValue ? getDefaultDate(defaultValue) : "";
  const [selectedDate, setSelectedDate] = useState(defaultDateValue);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Move API call to useEffect
  useEffect(() => {
    if (controlType === "COMBOBOX" && field.tableName && field.valueColumn && field.displayColumn) {
      setLoading(true);
      API.post(`api/v1/Reports/GetReportsTableValue?tableName=${field.tableName}&valueColumn=${field.valueColumn}&displayColumn=${field.displayColumn}`)
        .then(response => {
          if (response?.data) {
            setOptions(response.data);
          }
          setLoading(false);
        })
        .catch(error => {
          console.error("Error fetching options:", error);
          setLoading(false);
        });
    }
  }, [controlType, field.tableName, field.valueColumn, field.displayColumn]);

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
            disabled={loading}
          >
            {!validValues && <option value={JSON.stringify({ value: "0", label: "ALL" })}>Select</option>}
            {loading ? (
              <option>Loading...</option>
            ) : (
              options.map((item, index) => (
                <option 
                  value={JSON.stringify({ value: item.valueColumn, label: item.displayColumn })} 
                  key={item.displayColumn + index}
                >
                  {item.displayColumn}
                </option>
              ))
            )}
          </select>
        </div>
      );
    default:
      return null;
  }
};

export default function Filter({ reportCondition, report, downloadFile }) {
  const dispatch = useDispatch();
  const [AppliedFilters, setAppliedFilters] = useState();
  const [filter, setFilter] = useState();
  const { reportData,reportColumns } = useSelector((state) => state.reports);

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
    await dispatch(getReportDataAction(content,reportColumns));
    dispatch(hideLoader());
  }

  useEffect(() => {
    var defaultDate = new Object();
    var appliedFilter = new Object();
    reportCondition.map((field) => {
      const { defaultValue, spParameterName,controlType,conditionName } = field;
      if (controlType === "DATE") {
        const defaultDateValue = defaultValue.length > 0 ? getDefaultDate(defaultValue) : ""
        defaultDate[spParameterName] = defaultDateValue;
        appliedFilter[conditionName] = defaultDateValue
      } else {
        defaultDate[spParameterName] = defaultValue;
        appliedFilter[conditionName] = defaultValue
      }
    });
    setFilter({
    ...defaultDate
    });
    setAppliedFilters({
    ...appliedFilter
  });
  }, [report, reportCondition])

  return (
    <div className="m-3 mt-4">
      <div className="row">
        {/* Filter fields in a row with proper wrapping */}
        <div className="custom-col-md-9">
          <div className="row">
            {reportCondition.map((field, index) => (
              <ReportFilterItem
                key={field.spParameterName + String(index)}
                field={field}
                report={report}
                handleInputChange={handleInputChange}
              />
            ))}
          </div>
        </div>
        
        {/* Buttons in a separate column that stays aligned */}
        <div className="col-md-2 mt-3">
          {report?.reportName && (
            <div className="d-flex flex-row gap-2">
              <Button
                variant="contained"
                color="primary"
                sx={{ backgroundColor: "#75869e"}}
                onClick={getReportData}
              >
                RUN
              </Button>
              <Button
                variant="contained"
                color="success"
                sx={{ backgroundColor: "#203e69"}}
                onClick={() => downloadFile("excel",AppliedFilters)}
                disabled={reportData == null || reportData?.length <= 0}
              >
                EXCEL
              </Button>
                <Button
                variant="contained"
                color="success"
                sx={{ backgroundColor: "#203e69"}}
                onClick={() => downloadFile("text",AppliedFilters)}
                disabled={reportData == null || reportData?.length <= 0}
              >
                TEXT
              </Button>
              {report?.pdfViewable && <Button
                variant="contained"
                color="secondary"
                sx={{ backgroundColor: "#75869e"}}
                onClick={() => downloadFile("pdf",AppliedFilters)}
                disabled={reportData == null || reportData?.length <= 0}
              >
                PDF
              </Button>}
            </div>
          )}
        </div>
      </div>
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
