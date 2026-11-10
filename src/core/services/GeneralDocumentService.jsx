import { API, handleApiError } from "../../redux/api/utils";

const BASE = "/api/v1/GeneralDocument";

const call = async (fn) => {
  try {
    const res = await fn();
    return { error: null, data: res.data?.data, message: res.data?.message };
  } catch (error) {
    return handleApiError(error);
  }
};

// File responses come back as blobs; an error body is JSON inside the blob
const blobCall = async (fn, fallbackName) => {
  try {
    const res = await fn();
    const disposition = res.headers["content-disposition"] || "";
    const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(disposition);
    const name = match ? decodeURIComponent(match[1] || match[2]) : fallbackName;
    return { error: null, blob: res.data, contentType: res.headers["content-type"] || "", name };
  } catch (error) {
    let message = "The file could not be downloaded.";
    try {
      message = JSON.parse(await error.response.data.text()).message || message;
    } catch {
      /* keep default */
    }
    return { error: message };
  }
};

export const saveBlob = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export default class GeneralDocumentService {
  // masters
  static getTypes = () => call(() => API.get(`${BASE}/GetTypes`, { params: { includeInactive: true } }));
  static saveType = (dto) => call(() => API.post(`${BASE}/SaveType`, dto));
  static getTypeOptions = () => call(() => API.get(`${BASE}/GetTypeOptions`));
  static getSubtypes = (idGeneralDocumentType) =>
    call(() => API.get(`${BASE}/GetSubtypes`, { params: { idGeneralDocumentType: idGeneralDocumentType || undefined, includeInactive: true } }));
  static saveSubtype = (dto) => call(() => API.post(`${BASE}/SaveSubtype`, dto));

  // documents
  static getLookups = () => call(() => API.get(`${BASE}/GetLookups`));
  static getDocuments = (filter) => call(() => API.post(`${BASE}/GetDocuments`, filter));
  static getSummary = (filter) => call(() => API.post(`${BASE}/GetSummary`, filter));
  static getDocument = (id) => call(() => API.get(`${BASE}/GetDocument`, { params: { id } }));
  static saveDocument = (dto) => call(() => API.post(`${BASE}/SaveDocument`, dto));
  static setDocumentActive = (idGeneralDocument, isActive, remarks) =>
    call(() => API.post(`${BASE}/SetDocumentActive`, { idGeneralDocument, isActive, remarks }));

  // records and files
  static uploadRecord = (formData) =>
    call(() => API.post(`${BASE}/UploadRecord`, formData, { headers: { "Content-Type": "multipart/form-data" } }));
  static updateRecord = (dto) => call(() => API.post(`${BASE}/UpdateRecord`, dto));
  static setRecordStatus = (dto) => call(() => API.post(`${BASE}/SetRecordStatus`, dto));
  static downloadFile = (id, inline, name) =>
    blobCall(() => API.get(`${BASE}/DownloadFile`, { params: { id, inline }, responseType: "blob" }), name || "document");
  static downloadZip = (documentIds, recordIds) =>
    blobCall(() => API.post(`${BASE}/DownloadZip`, { documentIds, recordIds }, { responseType: "blob" }), "Documents.zip");

  // acknowledgement dashboard
  static getAckDashboard = (idGeneralDocumentType) =>
    call(() => API.get(`${BASE}/GetAckDashboard`, { params: { idGeneralDocumentType: idGeneralDocumentType || undefined } }));
  static getAckEmployees = (idGeneralDocument) => call(() => API.get(`${BASE}/GetAckEmployees`, { params: { idGeneralDocument } }));
  static exportAckEmployees = (idGeneralDocument, status) =>
    blobCall(() => API.get(`${BASE}/ExportAckEmployees`, { params: { idGeneralDocument, status }, responseType: "blob" }), "Acknowledgements.xlsx");
  static sendAckReminders = (idGeneralDocument, employeeIds) =>
    call(() => API.post(`${BASE}/SendAckReminders`, { idGeneralDocument: idGeneralDocument || null, employeeIds: employeeIds || null }));

  // self portal: published documents
  static getMyDocuments = () => call(() => API.get("/api/v1/MyDocuments/GetMyDocuments"));
  static viewMyFile = (id, name) => blobCall(() => API.get("/api/v1/MyDocuments/ViewFile", { params: { id }, responseType: "blob" }), name || "document");
  static acknowledgeMyDocument = (idGeneralDocumentRecord) =>
    call(() => API.post(`/api/v1/MyDocuments/Acknowledge?idGeneralDocumentRecord=${idGeneralDocumentRecord}`));

  // reports
  static getReport = (filter) => call(() => API.post(`${BASE}/GetReport`, filter));
  static exportReport = (filter) =>
    blobCall(() => API.post(`${BASE}/ExportReport`, filter, { responseType: "blob" }), `${filter.reportCode || "Report"}.xlsx`);
}
