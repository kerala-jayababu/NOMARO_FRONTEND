import { API } from "../../redux/api/utils";

export default class MaternityService {

  static getMaternityLeaveSalariesData = async (date, searchText) => {
    try {
      const res = await API.get("/api/v1/PayRollManagement/GetAllMaternityLeaveSalaries?fromDate=" + date + '&searchText=' + searchText);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    } 
  }

  static getMaternityLeaveSalaryById = async (id) => {
    try {
      const res = await API.get("/api/v1/PayRollManagement/GetMaternityLeaveSalaryById?id=" + id);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    } 
  }

  static saveMaternityLeaveSalariesData = async (payload) => {
    try {
      const res = await API.post("/api/v1/PayRollManagement/AddMaternityLeaveSalary", payload);
      return { error: null, data: res };
    } catch (error) {
      return handleApiError(error);
    } 
  }

  static updateMaternityLeaveSalariesData = async (payload) => {
    try {
      const res = await API.post("/api/v1/PayRollManagement/UpdateMaternityLeaveSalary", payload);
      return { error: null, data: res };
    } catch (error) {
      return handleApiError(error);
    } 
  }
}
