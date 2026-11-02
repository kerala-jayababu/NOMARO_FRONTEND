import { API } from "../../redux/api/utils";

// Birthdays, work anniversaries and holiday calendar (EmployeeCalendarController)
export default class EmployeeCalendarService {
  // Today's and upcoming (next `upcomingDays` days) birthdays and work anniversaries
  static getCelebrations = async (upcomingDays = 7) => {
    try {
      const res = await API.get("/api/v1/EmployeeCalendar/GetCelebrations", { params: { upcomingDays } });
      return { error: null, data: res.data };
    } catch (error) {
      return { error: error.response?.data?.message || "Failed to load birthdays and anniversaries", data: null };
    }
  };

  // occasion: "BIRTHDAY" or "WORKANNIVERSARY"
  static sendCongratulationsEmail = async (idEmployee, occasion) => {
    try {
      const res = await API.post("/api/v1/EmployeeCalendar/SendCongratulationsEmail", { idEmployee, occasion });
      return { error: null, data: res.data };
    } catch (error) {
      return { error: error.response?.data?.message || "Failed to send the email", data: null };
    }
  };

  // fromDate / toDate as yyyy-MM-dd
  static getHolidayCalendar = async (fromDate, toDate) => {
    try {
      const res = await API.get("/api/v1/EmployeeCalendar/GetHolidayCalendar", { params: { fromDate, toDate } });
      return { error: null, data: res.data };
    } catch (error) {
      return { error: error.response?.data?.message || "Failed to load holidays", data: null };
    }
  };
}
