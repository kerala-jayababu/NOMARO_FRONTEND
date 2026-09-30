import { API, handleApiError } from "../../redux/api/utils";
import { handleApiSuccessOrError } from "../constants/commons";

export default class EmployeeSalaryConfigService {
  static getAllEmployeeSalaryConfigs = async (searchText, status, val) => {
    try {
      const res = await API.get("/api/v1/EmployeeSalaryConfig/GetAllEmployeeSalaryConfigSp?searchText=" + searchText + "&dropdownFilter=" + status + "&isLatest=" + val);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }

  static getAllEmployeeWithoutConfig = async () => {
    try {
      const res = await API.get("/api/v1/Employee/EmployeeWithoutSalaryApprovalDto");
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
      if (res.data?.success === false) {
        return { error: res.data.message || 'An error occurred', data: null };
      }
      return { error: null, data: res };
    } catch (error) {
      return { error: error.response?.data?.message || 'An error occurred', data: null };
    }
  }

  static updateEmployeeSalaryConfigData = async (payload) => {
    try {
      const res = await API.post("/api/v1/EmployeeSalaryConfig/UpdateEmployeeSalaryConfig", payload);
      if (res.data?.success === false) {
        return { error: res.data.message || 'An error occurred', data: null };
      }
      return { error: null, data: res };
    } catch (error) {
      return { error: error.response?.data?.message || 'An error occurred', data: null };
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

  static getStatusById = async (id) => {
    try {
      const res = await API.get("/api/v1/PayRollManagement/GetWorkflowConfigList1?entityId=" + id);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }

  static getLatestApprovedSalaryConfig = async (idEmployee) => {
    try {
      const res = await API.get("/api/v1/EmployeeSalaryConfig/GetLatestApprovedEmployeeSalaryConfigByEmployeeId?idEmployee=" + idEmployee);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }

  // Current approved structure, pending structure, default Valid From / Revision Reason and warnings for the selected employee
  static getEmployeeSalaryStructureInfo = async (idEmployee) => {
    try {
      const res = await API.get("/api/v1/EmployeeSalaryConfig/GetEmployeeSalaryStructureInfo?idEmployee=" + idEmployee);
      return { error: null, data: res.data };
    } catch (error) {
      return { error: error.response?.data?.message || "An error occurred", data: null };
    }
  }

  static unApproveEmployeeSalaryConfig = async (payload) => {
    try {
      const res = await API.post("/api/v1/EmployeeSalaryConfig/UnApproveEmployeeSalaryConfig", payload);
      handleApiSuccessOrError(res.data, false);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }

}
