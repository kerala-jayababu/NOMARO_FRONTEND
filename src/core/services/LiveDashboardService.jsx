import moment from "moment";
import { API } from "../../redux/api/utils";
import { handleApiSuccessOrError } from "../constants/commons";

export default class LiveDashboardService {
  static getAttendanceSummary = async (attendanceDate, idDepartment = 0) => {
    try {
      const formattedDate = moment(attendanceDate).format("YYYY-MM-DD");
      const res = await API.get(
        `/api/v1/EmployeeLeaveReport/GetLiveDashboardAttendance?attendanceDate=${formattedDate}&idDepartment=${idDepartment ?? 0}`
      );
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  };

  static getAttendanceDetails = async (attendanceDate, detailType, idDepartment = 0) => {
    try {
      const formattedDate = moment(attendanceDate).format("YYYY-MM-DD");
      const res = await API.get(
        `/api/v1/EmployeeLeaveReport/GetLiveDashboardDetails?attendanceDate=${formattedDate}&detailType=${detailType}&idDepartment=${idDepartment ?? 0}`
      );
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  };
}

