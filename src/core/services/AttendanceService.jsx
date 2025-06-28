import { API } from "../../redux/api/utils";
import { handleApiSuccessOrError } from "../constants/commons";

export default class AttendanceService {

  static getAttendanceData = async (empId, dept, fromDate, toDate) => {
    try {
      const res = await API.get("/api/v1/Shift/GetDayAttendanceDetails?idEmployee=" + empId + "&idDepartment=" + dept + "&dateFrom=" + fromDate + '&dateTo=' + toDate);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }

  static saveShortTimeEntries = async (payload) => {
    try {
      const res = await API.post("/api/v1/Shift/UpdateAttendanceShortTimeDetails", payload);
      handleApiSuccessOrError(res, false);
      return { error: null, data: res };
    } catch (error) {
      return handleApiSuccessOrError(res.data, true);
    }
  }

  static approveData = async (payload) => {
    try {
      const res = await API.post("/api/v1/Shift/ApproveTimesheets", payload);
      handleApiSuccessOrError(res, false);
      return { error: null, data: res };
    } catch (error) {
      return handleApiSuccessOrError(res.data, true);
    }
  }

}
