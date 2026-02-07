import { API, handleApiError } from "../../redux/api/utils";
import moment from 'moment';

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

  static getBudgetCodesList = async () => {
    try {
      const res = await API.get("/api/v1/MasterData/GetBudgetList");
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

  static getEmployeeWorkTypes = async () => {
    try {
      const res = await API.get("/api/v1/Common/GetEmployeeWorkTypes");
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

  static getEmployeeById = async (employeeId) => {
    try {
      const res = await API.get(
        "/api/v1/Employee/GetEmployeeById?id=" + employeeId
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
    static getAllWorkYears = async () => {
    try {
      const response = await API.get("/api/v1/Common/GetAllWorkYears");
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

  static getHolidaysInAnYear = async (year) => {
    try{
      const response = await API.get(`api/v1/MasterData/GetHolidaysInAnYear?Year=${year}`);
      return { error: null, data: response.data.data};
    } catch (error) {
      return handleApiError(error);
    }
  }

  static addOrUpdateHolidays = async (data) => {
    try{
      const payload = {
        idHoliday : data.id,
        holidayDate : moment(data.start).format('YYYY-MM-DD'),
        holidayType: data.holidayType,
        holidayDescription: data.desc,
      }
      const response = await API.post(`/api/v1/MasterData/AddOrUpdateHoliday`, payload)
      return { error: null, data: response};
    } catch (error) {
      return handleApiError(error);
    }
  }

  static deleteHolidays = async(data) => {
    try{
      const response = await API.post(`/api/v1/MasterData/DeleteHoliday?IdHoliday=` + data)
      return {error: null, data: response.message};
    } catch (error) {
      return handleApiError(error);
    }
  }

  static getEmployeeProfileById = async (employeeId) => {
    try {
      const response = await API.get(`/api/v1/Employee/GetEmployeeProfileByID?Id=${employeeId}`);
      return { error: null, data: response.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static saveEmployee = async (payload) => {
    try {
      const response = await API.post("/api/v1/Employee/AddEmployee", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return { error: null, data: response.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static updateEmployee = async (payload, employeeId) => {
    try {
      const url = employeeId 
        ? `/api/v1/Employee/UpdateEmployee?id=${employeeId}`
        : "/api/v1/Employee/UpdateEmployee";
      const response = await API.post(url, payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return { error: null, data: response.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static getCountries = async () => {
    try {
      const res = await API.get("/api/v1/Common/GetCountries");
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };
}
