import { API } from "../../redux/api/utils";
import { handleApiSuccessOrError } from "../constants/commons";

export default class ViewPaySlipService {

  static getSalarySlipsData = async (fromDate, toDate, searchText) => {
    try {
      const res = await API.get("/api/v1/SalaryGeneration/GetSalarySlips?idSalaryMonthFrom=" + fromDate + '&idSalaryMonthTo=' + toDate + '&searchText=' + searchText);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }

  static downloadSalarySlips = async (empIds) => {
    try {
      const res = await API.post("/api/v1/SalaryGeneration/GeneratePayslipPdf?idEmployeeSalary=" + empIds, {});
      handleApiSuccessOrError(res.data, false);
      return { error: null, data: res };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }

}
