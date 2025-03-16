import { API } from "../../redux/api/utils";
import { handleApiSuccessOrError } from "../constants/commons";

export default class MaternityService {

  static getMaternityLeaveSalariesData = async (date, searchText) => {
    try {
      const res = await API.get("/api/v1/PayRollManagement/GetAllMaternityLeaveSalaries?fromDate=" + date + '&searchText=' + searchText);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiSuccessOrError(error,true);
    } 
  }

  static getMaternityLeaveSalaryById = async (id) => {
    try {
      const res = await API.get("/api/v1/PayRollManagement/GetMaternityLeaveSalaryById?id=" + id);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiSuccessOrError(error,true);
    } 
  }

  static saveMaternityLeaveSalariesData = async (payload) => {
    try {
      const res = await API.post("/api/v1/PayRollManagement/AddMaternityLeaveSalary", payload);
      handleApiSuccessOrError(response.data,false);
      return { error: null, data: res };
    } catch (error) {
      return handleApiSuccessOrError(error,true);
    } 
  }

  static updateMaternityLeaveSalariesData = async (payload) => {
    try {
      const res = await API.post("/api/v1/PayRollManagement/UpdateMaternityLeaveSalary", payload);
      handleApiSuccessOrError(response.data,false);
      return { error: null, data: res };
    } catch (error) {
      return handleApiSuccessOrError(error,true);
    } 
  }
}
