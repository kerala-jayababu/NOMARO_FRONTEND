import { API, handleApiError } from "../../redux/api/utils";
import { handleApiSuccessOrError } from "../constants/commons";

export default class EmployeeSalaryConfigService {
  static getAllEmployeeSalaryConfigs = async (searchText) => {
    try {
      const res = await API.get("/api/v1/EmployeeSalaryConfig/GetAllEmployeeSalaryConfig?searchText=" + searchText);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }

  static getEmployeeSalaryConfigById = async (id) => {
    try {
      const res = await API.get("/api/v1/EmployeeSalaryConfig/GetEmployeeSalaryConfigById?id=" + id);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }

  static saveEmployeeSalaryConfigData = async (payload) => {
    try {
      const res = await API.post("/api/v1/EmployeeSalaryConfig/AddEmployeeSalaryConfig", payload);
      handleApiSuccessOrError(res.data, false);
      return { error: null, data: res };
    } catch (error) {
      return handleApiSuccessOrError(res.data, true);
    }
  }

  static updateEmployeeSalaryConfigData = async (payload) => {
    try {
      const res = await API.post("/api/v1/EmployeeSalaryConfig/UpdateEmployeeSalaryConfig", payload);
      handleApiSuccessOrError(res.data, false);
      return { error: null, data: res };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }

  static getAllSalaryTemplates = async () => {
    try {
      const res = await API.get("/api/v1/SalaryTemplate/GetAllSalaryTemplates");
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }

  static getAllSalaryTemplatesById = async (id) => {
    try {
      const res = await API.get("/api/v1/SalaryTemplate/GetSalaryTemplateById?id=" + id);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }

}
