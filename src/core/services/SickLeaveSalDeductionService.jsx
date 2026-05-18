import { API, handleApiError } from "../../redux/api/utils";

export default class SickLeaveSalDeductionService {
  static getLeaveApplications = async (params = {}) => {
    try {
      const query = new URLSearchParams();
      if (params.adjustStatus) query.append("adjustStatus", params.adjustStatus);
      if (params.fromDate) query.append("fromDate", params.fromDate);
      if (params.toDate) query.append("toDate", params.toDate);
      if (params.searchText) query.append("searchText", params.searchText);
      if (params.idSalaryMonth) query.append("idSalaryMonth", params.idSalaryMonth);
      const res = await API.get(
        `/api/v1/LeaveManagement/GetLeaveApplications_SickLeaveManagement?${query.toString()}`
      );
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static updateSickLeaveSalaryDeduction = async (payload) => {
    try {
      const res = await API.post(
        "/api/v1/LeaveManagement/UpdateSickLeave_SalaryDeduction",
        payload
      );
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static createSickLeaveApplication = async (payload) => {
    try {
      const res = await API.post(
        "/api/v1/LeaveManagement/CreateSickLeave_SalaryDeductionApplication",
        payload
      );
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };
}
