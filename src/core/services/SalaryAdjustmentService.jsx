import { API } from "../../redux/api/utils";

export default class SalaryAdjustmentService {

  static getSalaryAdjustmentsData = async () => {
    try {
      const res = await API.get("/api/v1/PayRollManagement/GetAllSalaryAdjustments");
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
}
