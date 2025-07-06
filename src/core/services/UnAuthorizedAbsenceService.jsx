import { API } from "../../redux/api/utils";
import { handleApiSuccessOrError } from "../constants/commons";

export default class UnAuthorizedAbsenceService {

  static getEmployeeUnauthorizedAbsences = async (empId, startDate, endDate) => {
    try {
      const res = await API.get("/api/v1/EmployeeLeaveReport/GetEmployeeUnauthorizedAbsences?idEmployee=" + empId
        + "&dateFrom=" + startDate + "&dateTo=" + endDate);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiSuccessOrError(error, true);
    }
  }
}