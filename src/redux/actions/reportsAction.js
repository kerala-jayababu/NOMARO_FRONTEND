import { useSelector } from "react-redux";
import * as api from "../api/reports";
import {
  setReportColumns,
  setReportCondition,
  setReportData,
  setReports,
} from "../reducers/reports";

export const getReportsMasterAction = () => async (dispatch) => {
  try {
    const { data } = await api.getReportsMaster();
    const menu = data.data.filter((item) => item.idParentReport === 0);
    const child = data.data.filter((item) => item.idParentReport !== 0);
    const report = menu.map((item) => {
      return {
        ...item,
        subMenu: child.filter(
          (childItem) => childItem.idParentReport === item.idReport
        ),
      };
    });
    dispatch(setReports(report));
  } catch (error) {
    console.error("Error fetching reports:", error);
  }
};

export const getReportsConditionAction = (id) => async (dispatch) => {
  try {
    const { data } = await api.getReportsCondition(id);
    dispatch(setReportCondition(data.data));
    const { data: columns } = await api.GetReportColumns(id);
    dispatch(setReportColumns(columns));
  } catch (error) {
    console.error("Error fetching report condition:", error);
  }
};

export const getReportDataAction =
  (content, reportColumns) => async (dispatch) => {
    try {
      const { data } = await api.getReportData(content);
      if (!data || data.length === 0) {
        dispatch(setReportData([])); // Clear old data in the store
        return;
      }

      var reportData = data.map((item, index) => {
        Object.keys(item).forEach((key) => {
          if (typeof item[key] === "number") {
            item[key] = new Intl.NumberFormat("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(item[key]);
          }
        });
        return { ...item, id: index };
      });
      let grandTotal = new Object();
      let isAmountFieldExist = false;

      Object.keys(reportData[0]).map((key) => {
        const columnName = reportColumns.find((x) => x.columnName === key);

        if (columnName?.totalRequired) {
          var total = reportData.reduce(
            (sum, item) =>
              sum +
              (item[key] ? parseFloat(`${item[key]}`.replaceAll(",", "")) : 0),
            0
          );
          grandTotal[key] = new Intl.NumberFormat("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(total);
          isAmountFieldExist = true;
        } else {
          grandTotal[key] = "";
        }
      });
      grandTotal[Object.keys(reportData[0])[0]] = "Grand Total";
      grandTotal["id"] = reportData.length + 1;
      reportData = isAmountFieldExist
        ? [...reportData, grandTotal]
        : reportData;
      dispatch(setReportData(reportData));
    } catch (error) {
      console.error("Error fetching report data:", error);
    }
  };
