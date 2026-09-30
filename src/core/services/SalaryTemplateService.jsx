import { API, handleApiError } from "../../redux/api/utils";
import { handleApiSuccessOrError } from "../constants/commons";

export default class SalaryTemplateService {
  static getSalaryHeads = async () => {
    try {
      const res = await API.get("/api/v1/MasterData/GetSalaryHeadList");
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }

  static getAllSalaryTemplates = async (searchText, status, includeInactive = false) => {
    try {
      const res = await API.get("/api/v1/SalaryTemplate/GetAllSalaryTemplates", {
        params: { searchText: searchText || undefined, dropdownFilter: status || undefined, includeInactive },
      });
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

  // Returns { error, data } where data is the API response body; the page shows the messages
  static saveSalaryTemplateData = async (payload) => {
    try {
      const res = await API.post("/api/v1/SalaryTemplate/AddSalaryTemplate", payload);
      if (res.data?.success === false) {
        return { error: res.data.message || "An error occurred", data: null };
      }
      return { error: null, data: res.data };
    } catch (error) {
      return { error: error.response?.data?.message || "An error occurred", data: null };
    }
  }

  static updateSalaryTemplateData = async (payload) => {
    try {
      const res = await API.post("/api/v1/SalaryTemplate/UpdateSalaryTemplate", payload);
      if (res.data?.success === false) {
        return { error: res.data.message || "An error occurred", data: null };
      }
      return { error: null, data: res.data };
    } catch (error) {
      return { error: error.response?.data?.message || "An error occurred", data: null };
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
}
