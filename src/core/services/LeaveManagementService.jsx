import { API, handleApiError } from "../../redux/api/utils";

export default class LeaveManagementService {
  static getKpiSummary = async (idYear) => {
    try {
      const res = await API.get(`/api/v1/LeaveManagement/GetKpiSummary?idYear=${idYear}`);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static getLeaveByType = async (idYear) => {
    try {
      const res = await API.get(`/api/v1/LeaveManagement/GetLeaveByType?idYear=${idYear}`);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static getMonthlyTrend = async (idYear) => {
    try {
      const res = await API.get(`/api/v1/LeaveManagement/GetMonthlyTrend?idYear=${idYear}`);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static getDepartmentSummary = async (idYear) => {
    try {
      const res = await API.get(`/api/v1/LeaveManagement/GetDepartmentSummary?idYear=${idYear}`);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static getDesignationSummary = async (idYear) => {
    try {
      const res = await API.get(`/api/v1/LeaveManagement/GetDesignationSummary?idYear=${idYear}`);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static getEmployeeLeaveDetails = async (params) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await API.get(`/api/v1/LeaveManagement/GetEmployeeLeaveDetails?${query}`);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };
}
