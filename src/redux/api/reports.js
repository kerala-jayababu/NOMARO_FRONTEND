import { API, handleApiError } from "./utils";

export const getReportsMaster = async () => {
  try {
    const res = await API.get("/api/v1/Reports/getReportMasters");
    return { error: null, data: res.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getReportsCondition = async (id) => {
  try {
    const res = await API.get(
      `/api/v1/Reports/GetReportConditionById?id=${id}`
    );
    return { error: null, data: res.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getReportData = async (content) => {
  try {
    const res = await API.post(
      `/api/v1/Reports/ExecuteStoredProcedure`,
      content
    );
    return { error: null, data: res.data };
  } catch (error) {
    return handleApiError(error);
  }
};
