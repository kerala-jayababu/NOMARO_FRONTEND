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

  static getAllSalaryTemplates = async (searchText) => {
    try {
      const res = await API.get("/api/v1/SalaryTemplate/GetAllSalaryTemplates" + '?searchText=' + searchText);
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

  static saveSalaryTemplateData = async (payload) => {
    try {
      const res = await API.post("/api/v1/SalaryTemplate/AddSalaryTemplate", payload);
      handleApiSuccessOrError(res, false);
      return { error: null, data: res };
    } catch (error) {
      return handleApiSuccessOrError(res.data, true);
    }
  }

  static updateSalaryTemplateData = async (payload) => {
    try {
      const res = await API.post("/api/v1/SalaryTemplate/UpdateSalaryTemplate", payload);
      handleApiSuccessOrError(res.data, false);
      return { error: null, data: res };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }
}
