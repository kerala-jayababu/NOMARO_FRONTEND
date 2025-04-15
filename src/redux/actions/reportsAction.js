import * as api from "../api/reports";
import {
  setReportCondition,
  setReportData,
  setReports,
} from "../reducers/reports";

export const getReportsMasterAction = () => async (dispatch) => {
  try {
    const { data } = await api.getReportsMaster();
    dispatch(setReports(data.data));
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
      return { ...item, id: index };
    });
    dispatch(setReportData(reportData));
  } catch (error) {
    console.error("Error fetching report data:", error);
  }
};
