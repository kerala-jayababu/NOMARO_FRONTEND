import { API } from "../../redux/api/utils";

// Salary Dashboard (SalaryDashboardController)
export default class SalaryDashboardService {
  // Salary months that have generated salaries (latest first), offices and departments
  static getFilterOptions = async () => {
    try {
      const res = await API.get("/api/v1/SalaryDashboard/GetFilterOptions");
      return { error: null, data: res.data };
    } catch (error) {
      return { error: error.response?.data?.message || "Failed to load dashboard filters", data: null };
    }
  };

  // approvedOnly: true = APPROVED salaries only, false = all generated salaries except rejected
  static getSalaryDashboard = async ({ idSalaryMonth, idOffice = null, idDepartment = null, approvedOnly = true }) => {
    try {
      const res = await API.get("/api/v1/SalaryDashboard/GetSalaryDashboard", {
        params: {
          idSalaryMonth,
          idOffice: idOffice || undefined,
          idDepartment: idDepartment || undefined,
          approvedOnly,
        },
      });
      return { error: null, data: res.data };
    } catch (error) {
      return { error: error.response?.data?.message || "Failed to load salary dashboard", data: null };
    }
  };
}
