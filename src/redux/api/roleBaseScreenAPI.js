import { API, handleApiError } from "./utils";

export const getAllPayrollScreens = async () => {
  try {
    const res = await API.get("/api/v1/RoleBasedScreens/GetAllPayrollScreens");
    return { error: null, data: res.data };
  } catch (error) {
    return handleApiError(error);
  } 
};


