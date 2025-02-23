import { API } from "../../redux/api/utils";

export default class OvertimeService {

  static getOvertimeTransactionsData = async (empId, date, status, searchText) => {
    try {
      const res = await API.get("/api/v1/PayRollManagement/GetOvertimeTransactions?EmployeeId=" + empId + '&startDate=' + date + '&dropdownFilter=' + status + '&searchText=' + searchText);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    } 
  }

  static getOvertimeTransactionsById = async (id) => {
    try {
      const res = await API.get("/api/v1/PayRollManagement/GetOvertimeTransactionsById?id=" + id);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    } 
  }

  static saveOvertimeTransactionsData = async (payload) => {
    try {
      const res = await API.post("/api/v1/PayRollManagement/AddOvertimeTransaction", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return { error: null, data: res };
    } catch (error) {
      return handleApiError(error);
    } 
  }

  static updateOvertimeTransactionsData = async (payload) => {
    try {
      const res = await API.post("/api/v1/PayRollManagement/UpdateOvertimeTransaction", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return { error: null, data: res };
    } catch (error) {
      return handleApiError(error);
    } 
  }
}
