import { API, handleApiError } from "../../redux/api/utils";

export default class ShiftSetupService {
  static getShiftSetupDetails = async () => {
    try {
      const response = await API.get("/api/v1/ShiftSetup/GetShiftSetupDetails");
      return { error: null, data: response.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static getShiftSetupHierarchyByOffice = async (idOffice) => {
    try {
      const response = await API.get(
        "/api/v1/ShiftSetup/GetShiftSetupHierarchyByOffice",
        { params: { idOffice } },
      );
      return { error: null, data: response.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static getShiftManagerEmployees = async (idOffice) => {
    try {
      const response = await API.get(
        "/api/v1/ShiftSetup/GetShiftManagerEmployees",
        { params: { idOffice } },
      );
      return { error: null, data: response.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static updateShiftManagerAssignments = async (assignments) => {
    try {
      const response = await API.post(
        "/api/v1/ShiftSetup/UpdateShiftManagerAssignments",
        assignments,
      );
      return { error: null, data: response.data };
    } catch (error) {
      return handleApiError(error);
    }
  };
}