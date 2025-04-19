import { API, handleApiError } from "./utils";
import secureLocalStorage from "react-secure-storage";

export const getAllPayrollScreens = async (view) => {
  const currentAuth = secureLocalStorage.getItem("currentAuth");
  try {
    const type = (view != null) ? view : currentAuth;
    const res = await API.get("/api/v1/RoleBasedScreens/GetAllPayrollScreens?appType=" + type);
    return { error: null, data: res.data };
  } catch (error) {
    return handleApiError(error);
  }
};


