import * as api from "../api/reports";
import {
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
  } catch (error) {
    console.error("Error fetching report condition:", error);
  }
};

export const getReportDataAction = (content) => async (dispatch) => {
  try {
    const { data } = await api.getReportData(content);
    var reportData = data.map((item, index) => {
      Object.keys(item).forEach((key) => {
        if (typeof item[key] === "number") {
          item[key] = Number(item[key]).toFixed(2);
        }
      });
      return { ...item, id: index };
    });
    dispatch(setReportData(reportData));
  } catch (error) {
    console.error("Error fetching report data:", error);
  }
};
