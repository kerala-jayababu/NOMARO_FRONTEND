import { API } from "../../redux/api/utils";

// PF / ESI / PT / LWF details of an employee (EmployeeStatutoryDetailsController)
export default class EmployeeStatutoryDetailsService {
  static getEmployeeStatutoryDetails = async (searchText = "") => {
    try {
      const res = await API.get("/api/v1/EmployeeStatutoryDetails/GetEmployeeStatutoryDetails", {
        params: { searchText: searchText || undefined },
      });
      return { error: null, data: res.data };
    } catch (error) {
      return { error: error.response?.data?.message || "Failed to load statutory details", data: null };
    }
  };

  // data.data is null when the employee has no statutory details yet
  static getEmployeeStatutoryDetailsById = async (idEmployee) => {
    try {
      const res = await API.get("/api/v1/EmployeeStatutoryDetails/GetEmployeeStatutoryDetailsById", {
        params: { idEmployee },
      });
      return { error: null, data: res.data };
    } catch (error) {
      return { error: error.response?.data?.message || "Failed to load statutory details", data: null };
    }
  };

  // States table; e.g. { hasPT: true, isActive: true } for the PT State dropdown
  static getStates = async ({ hasPT = null, hasLWF = null, isActive = null } = {}) => {
    try {
      const res = await API.get("/api/v1/EmployeeStatutoryDetails/GetStates", {
        params: {
          hasPT: hasPT === null ? undefined : hasPT,
          hasLWF: hasLWF === null ? undefined : hasLWF,
          isActive: isActive === null ? undefined : isActive,
        },
      });
      return { error: null, data: res.data };
    } catch (error) {
      return { error: error.response?.data?.message || "Failed to load states", data: null };
    }
  };

  static addOrUpdateEmployeeStatutoryDetails = async (payload) => {
    try {
      const res = await API.post("/api/v1/EmployeeStatutoryDetails/AddOrUpdateEmployeeStatutoryDetails", payload);
      if (res.data?.success === false) {
        return { error: res.data.message || "Failed to save statutory details", data: null };
      }
      return { error: null, data: res.data };
    } catch (error) {
      return { error: error.response?.data?.message || "Failed to save statutory details", data: null };
    }
  };
}
