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
      const res = await API.post("/api/v1/SalaryGeneration/GeneratePayslipPdf?idEmployeeSalary=" + empIds, {},
        {
          responseType: 'blob', // Important for file downloads
        }
      );
      // handleApiSuccessOrError(res.data, false);
      return { error: null, data: res };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }

  static getSalarySlipDetails = async (IdEmployee, IdSalaryMonth) => {
    try {
      const res = await API.get("/api/v1/SelfPortal/GetPaySlipDetails?IdEmployee=" + IdEmployee + '&IdSalaryMonth=' + IdSalaryMonth);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }

  static getSalaryReport = async (IdEmployee, IdSalaryMonthFrom, IdSalaryMonthTo) => {
    try {
      const res = await API.get("/api/v1/SelfPortal/GetSalaryDetailsEmployee?IdEmployee=" + IdEmployee + '&IdSalaryMonthFrom=' + IdSalaryMonthFrom + '&IdSalaryMonthTo=' + IdSalaryMonthTo);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }

}
