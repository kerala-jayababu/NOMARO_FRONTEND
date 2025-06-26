import { API } from "../../redux/api/utils";
import { handleApiSuccessOrError } from "../constants/commons";

export default class ClockInOutService {

  static getClockInOutData = async (empId, dept, fromDate, toDate) => {
    try {
      const res = await API.get("/api/v1/Shift/GetClockInClockOutDetails?idDepartment=" + dept + "&idEmployeeString=" + empId + "&dateFrom=" + fromDate + '&dateTo=' + toDate);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }

  static saveMissingEntries = async (payload) => {
    try {
      const res = await API.post("/api/v1/Shift/UpdateClockInOutMissingEntries", payload);
      handleApiSuccessOrError(res, false);
      return { error: null, data: res };
    } catch (error) {
      return handleApiSuccessOrError(res.data, true);
    }
  }

}
