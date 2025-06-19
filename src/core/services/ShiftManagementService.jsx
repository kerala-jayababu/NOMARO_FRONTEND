import { API } from "../../redux/api/utils";
import { handleApiSuccessOrError } from "../constants/commons";

export default class ShiftManagementService {

  static getShiftList = async () => {
    try {
      const res = await API.get("api/v1/Shift/GetShiftList");
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }

  static getEmployeeListByShiftId = async (idShift) => {
    try {
      const res = await API.get("api/v1/Shift/GetShiftEmployeesByShift?idShift=" + idShift);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }

  static getScheduleListByShiftId = async (idShift) => {
    try {
      const res = await API.get("api/v1/Shift/GetShiftScheduleList?idShift=" + idShift);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }

  static saveShift = async(data) => {
    try {
      const response = await API.post("api/v1/Shift/AddShift", data);
      handleApiSuccessOrError(response.data,false);
      return { error: null, data: response.data };
    } catch (error) {
      return handleApiSuccessOrError(error,true);
    }
  }

  static saveEmployeeInShift = async(data) => {
    try {
      const response = await API.post("/api/v1/Shift/ManageShiftEmployees", data);
    //   handleApiSuccessOrError(response.data,false);
      return { error: null, data: response.data };
    } catch (error) {
      return handleApiSuccessOrError(error,true);
    }
  }

  static saveScheduleInShift = async(data) => {
    try {
      const response = await API.post("/api/v1/Shift/ManageShiftSchedules", data);
    //   handleApiSuccessOrError(response.data,false);
      return { error: null, data: response.data };
    } catch (error) {
      return handleApiSuccessOrError(error,true);
    }
  }

  static updateShift = async(data) => {
    try {
      const response = await API.post("/api/v1/Shift/UpdateShift", data);
    //   handleApiSuccessOrError(response.data,false);
      return { error: null, data: response.data };
    } catch (error) {
      return handleApiSuccessOrError(error,true);
    }
  }

  static getShiftAssignments = async(idShift) => {
    try {
      const response = await API.get("/api/v1/Shift/GetShiftAssignmentsByShift?idShift=" + idShift);
    //   handleApiSuccessOrError(response.data,false);
      return { error: null, data: response.data };
    } catch (error) {
      return handleApiSuccessOrError(error,true);
    }
  }

  static saveShiftAssignments = async(data) => {
    try {
      const response = await API.post("/api/v1/Shift/ManageShiftAssignments", data);
    //   handleApiSuccessOrError(response.data,false);
      return { error: null, data: response.data };
    } catch (error) {
      return handleApiSuccessOrError(error,true);
    }
  }
}