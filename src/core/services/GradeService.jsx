import { API, handleApiError } from "../../redux/api/utils";

export default class GradeService {
  // isActive: null = all grades, true = only active (for the Employee combo)
  static getGrades = async (isActive = null) => {
    try {
      const url =
        isActive === null
          ? "/api/v1/Grade/GetGrades"
          : `/api/v1/Grade/GetGrades?isActive=${isActive}`;
      const res = await API.get(url);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static addOrUpdateGrade = async (payload) => {
    try {
      const res = await API.post("/api/v1/Grade/AddOrUpdateGrade", payload);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };
}
