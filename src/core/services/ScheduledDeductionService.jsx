import { API } from "../../redux/api/utils";

export default class ScheduledDeductionService {

  static getScheduledDeductionsData = async (date, searchText) => {
    try {
      const res = await API.get("/api/v1/PayRollManagement/GetAllScheduledSalaryDeductionservice?fromDate=" + date + '&searchText=' + searchText);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    } 
  }

  static getScheduledDeductionsDataById = async (id) => {
    try {
      const res = await API.get("/api/v1/PayRollManagement/GetScheduledSalaryDeductionserviceById?id=" + id);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    } 
  }

  static saveScheduledDeductionsData = async (payload) => {
    try {
      const res = await API.post("/api/v1/PayRollManagement/AddscheduledSalaryDeductionservice", payload);
      return { error: null, data: res };
    } catch (error) {
      return handleApiError(error);
    } 
  }

  static updateScheduledDeductionsData = async (payload) => {
    try {
      const res = await API.post("/api/v1/PayRollManagement/UpdatescheduledSalaryDeductionservice", payload);
      return { error: null, data: res };
    } catch (error) {
      return handleApiError(error);
    } 
  }
}
