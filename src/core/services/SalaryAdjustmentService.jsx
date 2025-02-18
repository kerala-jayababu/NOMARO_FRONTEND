import { API } from "../../redux/api/utils";

export default class SalaryAdjustmentService {

  static getSalaryAdjustmentsData = async (date, searchText) => {
    try {
      const res = await API.get("/api/v1/PayRollManagement/GetAllSalaryAdjustments?fromDate=" + date + '&searchText=' + searchText);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    } 
  }

  static saveSalaryAdjustmentsData = async (payload) => {
    try {
      const res = await API.post("/api/v1/PayRollManagement/AddSalaryAdjustment", payload);
      return { error: null, data: res };
    } catch (error) {
      return handleApiError(error);
    } 
  }

  static updateSalaryAdjustmentsData = async (payload) => {
    try {
      const res = await API.post("/api/v1/PayRollManagement/UpdateSalaryAdjustment", payload);
      return { error: null, data: res };
    } catch (error) {
      return handleApiError(error);
    } 
  }
}
