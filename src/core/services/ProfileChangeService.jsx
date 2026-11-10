import { API, handleApiError } from "../../redux/api/utils";

const ESS = "/api/v1/EmployeeSelfService";
const HR = "/api/v1/ProfileChangeRequest";

const call = async (fn) => {
  try {
    const res = await fn();
    return { error: null, data: res.data };
  } catch (error) {
    // keep the response body: SaveAndSubmit returns the draft id even when the submit fails
    const result = await handleApiError(error);
    return { ...result, status: error.response?.status, body: error.response?.data };
  }
};

const blob = async (url) => {
  try {
    const res = await API.get(url, { responseType: "blob" });
    return { error: null, data: res.data, contentType: res.headers["content-type"] };
  } catch {
    return { error: "The document could not be opened.", data: null };
  }
};

export default class ProfileChangeService {
  // ---------- Employee self-service ----------
  static getMyProfile = () => call(() => API.get(`${ESS}/GetMyProfile`));
  static getLookups = () => call(() => API.get(`${ESS}/GetLookups`));
  static getMyRequests = () => call(() => API.get(`${ESS}/GetMyRequests`));
  static getMyRequestById = (id) => call(() => API.get(`${ESS}/GetMyRequestById?id=${id}`));
  static saveRequest = (formData) =>
    call(() => API.post(`${ESS}/SaveRequest`, formData, { headers: { "Content-Type": "multipart/form-data" } }));
  static saveAndSubmitRequest = (formData) =>
    call(() => API.post(`${ESS}/SaveAndSubmitRequest`, formData, { headers: { "Content-Type": "multipart/form-data" } }));
  static submitRequest = (id) => call(() => API.post(`${ESS}/SubmitRequest?id=${id}`));
  static cancelRequest = (id) => call(() => API.post(`${ESS}/CancelRequest?id=${id}`));
  static downloadMyRequestDocument = (id) => blob(`${ESS}/DownloadRequestDocument?id=${id}`);
  static downloadMyDocument = (id) => blob(`${ESS}/DownloadMyDocument?id=${id}`);

  // ---------- HR ----------
  static getDashboardCounts = () => call(() => API.get(`${HR}/GetDashboardCounts`));
  static getRequests = (filter) => call(() => API.get(`${HR}/GetRequests`, { params: filter }));
  static getRequestById = (id) => call(() => API.get(`${HR}/GetRequestById?id=${id}`));
  static downloadRequestDocument = (id) => blob(`${HR}/DownloadRequestDocument?id=${id}`);
  static revealValue = (idDetail, which = "NEW") =>
    call(() => API.get(`${HR}/RevealValue?idDetail=${idDetail}&which=${which}`));
  static actionRequest = (payload) => call(() => API.post(`${HR}/ActionRequest`, payload));
  static getEmployeeChangeHistory = (idEmployee) =>
    call(() => API.get(`${HR}/GetEmployeeChangeHistory?idEmployee=${idEmployee}`));

  // ---------- Settings ----------
  static getRequestTypes = () => call(() => API.get(`${HR}/GetRequestTypes`));
  static updateRequestType = (payload) => call(() => API.post(`${HR}/UpdateRequestType`, payload));
  static getWorkflows = () => call(() => API.get(`${HR}/GetWorkflows`));
  static getWorkflowLookups = () => call(() => API.get(`${HR}/GetWorkflowLookups`));
  static saveWorkflow = (payload) => call(() => API.post(`${HR}/SaveWorkflow`, payload));
}
