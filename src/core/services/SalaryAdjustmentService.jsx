import { API } from "../../redux/api/utils";
import { handleApiSuccessOrError } from "../constants/commons";

export default class SalaryAdjustmentService {

  static getSalaryAdjustmentsData = async (date, searchText) => {
    try {
      const res = await API.get("/api/v1/PayRollManagement/GetAllSalaryAdjustments?fromDate=" + date + '&searchText=' + searchText);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }

  static saveSalaryAdjustmentsData = async (payload) => {
    try {
      const res = await API.post("/api/v1/PayRollManagement/AddSalaryAdjustment", payload);
      handleApiSuccessOrError(res.data, false);
      return { error: null, data: res };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }

  static updateSalaryAdjustmentsData = async (payload) => {
    try {
      const res = await API.post("/api/v1/PayRollManagement/UpdateSalaryAdjustment", payload);
      handleApiSuccessOrError(res.data, false);
      return { error: null, data: res };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }
}
