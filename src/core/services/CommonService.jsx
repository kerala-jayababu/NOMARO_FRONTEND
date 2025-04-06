import { API, handleApiError } from "../../redux/api/utils";

export default class CommonService {
  static getEmployeeList = async () => {
    try {
      const res = await API.get("/api/v1/Employee/GetEmployeeList");
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static getDepartmentsList = async () => {
    try {
      const res = await API.get("/api/v1/MasterData/GetDepartmentList");
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static getDesignationsList = async () => {
    try {
      const res = await API.get("/api/v1/MasterData/GetDesignationList");
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static getSalaryHeadList = async () => {
    try {
      const res = await API.get("/api/v1/MasterData/GetSalaryHeadList");
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static getHolidayTypes = async () => {
    try {
      const res = await API.get("/api/v1/Common/GetHolidayTypes");
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static getAllSalaryMonths = async () => {
    try {
      const res = await API.get("/api/v1/Common/GetAllSalaryMonths");
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static getEmployeesByHierarchy = async (employeeId) => {
    try {
      const res = await API.get(
        "/api/v1/Employee/GetEmployeesByHierarchy?employeeId=" + employeeId
      );
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static getSalaryStructure = async () => {
    try {
      const res = await API.get(
        "/api/v1/Common/GetEmployeeLatestSalaryStructure"
      );
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static getAllOptions = async () => {
    try {
      const res = await API.get("/api/v1/Common/GetAllOptions");
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static getAllFinancialYears = async () => {
    try {
      const response = await API.get("/api/v1/Common/GetAllFiancialyear");
      return { error: null, data: response.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static getSystemParameters = async () => {
    try {
      const response = await API.get("/api/v1/MasterData/GetSystemParameters");
      return { error: null, data: response.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static GetEmployeeNotification = async () => {
    try {
      const response = await API.get("/api/v1/Common/GetEmployeeNotification");
      return { error: null, data: response.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static UpdateEmployeeNotification = async (notificationId) => {
    try {
      const response = await API.post(`/api/v1/Common/UpdateEmployeeNotification?IdNotification=${notificationId}`);
      return { error: null, data: response.data };
    } catch (error) {
      return handleApiError(error);
    }
  };
}
