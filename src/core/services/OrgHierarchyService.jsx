import { API, handleApiError } from "../../redux/api/utils";

export default class OrgHierarchyService {
  static getEmployeeHierarchy = async () => {
    try {
      const res = await API.get("/api/v1/Employee/GetEmployeeHierarchyWithPhotoBinary");
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };
}
