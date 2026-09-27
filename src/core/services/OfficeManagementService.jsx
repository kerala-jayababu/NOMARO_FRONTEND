import { API, handleApiError } from "../../redux/api/utils";

export default class OfficeManagementService {
  // Office Type APIs
  static getOfficeTypes = async (isActive = null) => {
    try {
      const url =
        isActive === null
          ? "/api/v1/OfficeManagement/GetOfficeTypes"
          : `/api/v1/OfficeManagement/GetOfficeTypes?isActive=${isActive}`;
      const res = await API.get(url);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static addOrUpdateOfficeTypes = async (payload) => {
    try {
      const res = await API.post("/api/v1/OfficeManagement/AddOrUpdateOfficeTypes", payload);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  // Office APIs
  static getOffices = async ({ searchText = "", idOfficeType = null, idParentOffice = null, isActive = null } = {}) => {
    try {
      const res = await API.get("/api/v1/OfficeManagement/GetOffices", {
        params: {
          searchText: searchText || undefined,
          idOfficeType: idOfficeType || undefined,
          idParentOffice: idParentOffice || undefined,
          isActive: isActive === null ? undefined : isActive,
        },
      });
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static getOfficeById = async (idOffice) => {
    try {
      const res = await API.get(`/api/v1/OfficeManagement/GetOfficeById?idOffice=${idOffice}`);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static addOffice = async (payload) => {
    try {
      const res = await API.post("/api/v1/OfficeManagement/AddOffice", payload);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static updateOffice = async (payload) => {
    try {
      const res = await API.post("/api/v1/OfficeManagement/UpdateOffice", payload);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static updateOfficeStatus = async (idOffice, isActive) => {
    try {
      const res = await API.post(
        `/api/v1/OfficeManagement/UpdateOfficeStatus?idOffice=${idOffice}&isActive=${isActive}`
      );
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  // Employee Office Posting APIs
  static getOfficeEmployees = async (idOffice, isCurrentOnly = true) => {
    try {
      const res = await API.get(
        `/api/v1/OfficeManagement/GetOfficeEmployees?idOffice=${idOffice}&isCurrentOnly=${isCurrentOnly}`
      );
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static getEmployeeOfficePostings = async (idEmployee) => {
    try {
      const res = await API.get(`/api/v1/OfficeManagement/GetEmployeeOfficePostings?idEmployee=${idEmployee}`);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static addOrUpdateEmployeeOfficePosting = async (payload) => {
    try {
      const res = await API.post("/api/v1/OfficeManagement/AddOrUpdateEmployeeOfficePosting", payload);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };
}
