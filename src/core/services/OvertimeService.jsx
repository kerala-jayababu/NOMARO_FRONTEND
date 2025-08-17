import { API } from "../../redux/api/utils";
import { handleApiSuccessOrError } from "../constants/commons";

export default class OvertimeService {

  static getOvertimeTransactionsData = async (empId, date, status, searchText) => {
    try {
      const res = await API.get("/api/v1/PayRollManagement/GetOvertimeTransactions?EmployeeId=" + empId + '&startDate=' + date + '&dropdownFilter=' + status + '&searchText=' + searchText);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }

  static getOvertimeTransactionsById = async (id) => {
    try {
      const res = await API.get("/api/v1/PayRollManagement/GetOvertimeTransactionsById?id=" + id);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }

  static saveOvertimeTransactionsData = async (payload) => {
    try {
      const res = await API.post("/api/v1/PayRollManagement/AddOvertimeTransaction", payload);
      handleApiSuccessOrError(res.data, false);
      return { error: null, data: res };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }

  static updateOvertimeTransactionsData = async (payload) => {
    try {
      const res = await API.post("/api/v1/PayRollManagement/UpdateOvertimeTransaction", payload);
      handleApiSuccessOrError(res.data, false);
      return { error: null, data: res };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }

  static getEmployeeOvertimeTransactions = async (empId, date) => {
    try {
      const res = await API.get("/api/v1/SelfPortal/GetOvertimeTransactionsForSelfPortal?EmployeeId=" + empId + '&date=' + date);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }

  static getOvertimeAmount = async (empId, date, duration) => {
    try {
      const res = await API.post("/api/v1/PayRollManagement/GetOverTimeAmount?IdEmployee=" + empId + '&OvertimeDate=' + date + '&DurationInHours=' + duration, {});
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }

  static getStatusById = async (id) => {
    try {
      const res = await API.get("/api/v1/PayRollManagement/GetWorkflowConfigList1?entityId=" + id);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }
}
