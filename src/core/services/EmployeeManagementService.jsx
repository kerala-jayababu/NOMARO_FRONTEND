import { API, handleApiError } from "../../redux/api/utils";
import moment from "moment";

export default class EmployeeManagementService {
  // ==================== QUALIFICATIONS APIs ====================
  
  static getEmployeeQualifications = async (idEmployee, idEmployeeQualification = null) => {
    try {
      let url = `/api/v1/Employee/GetEmployeeQualifications?idEmployee=${idEmployee}`;
      if (idEmployeeQualification) {
        url += `&idEmployeeQualification=${idEmployeeQualification}`;
      }
      const res = await API.get(url);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };


  static postEmployeeQualification = async (payload) => {
    try {
      const formData = new FormData();
      
      
      const dtos = Array.isArray(payload) ? payload : [payload];
      
      
      dtos.forEach((item, index) => {
        formData.append(`dtos[${index}].IdEmployeeQualification`, item.idEmployeeQualification || 0);
        formData.append(`dtos[${index}].IdEmployee`, item.idEmployee);
        formData.append(`dtos[${index}].IdQualificationType`, item.idQualificationType);
        formData.append(`dtos[${index}].QualificationName`, item.qualificationName);
        formData.append(`dtos[${index}].Specialization`, item.specialization || "");
        formData.append(`dtos[${index}].InstitutionName`, item.institutionName);
        formData.append(`dtos[${index}].IdCountry`, item.idCountry);
        formData.append(`dtos[${index}].YearOfCompletion`, item.yearOfCompletion);
        formData.append(`dtos[${index}].GradeOrPercentage`, item.gradeOrPercentage || "");
        formData.append(`dtos[${index}].IdUser`, item.idUser);
        
        
        if (item.certificateFile) {
          formData.append(`dtos[${index}].CertificateBinary`, item.certificateFile);
        }
      });

      const res = await API.post("/api/v1/Employee/AddOrUpdateEmployeeQualifications", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };


  static deleteEmployeeQualification = async (idEmployeeQualification, idUser) => {
    try {
      const res = await API.delete(
        `/api/v1/Employee/DeleteEmployeeQualification?idEmployeeQualification=${idEmployeeQualification}&idUser=${idUser}`
      );
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  // ==================== EXPERIENCE APIs ====================

  
  static getEmployeeExperiences = async (idEmployee, idEmployeeExperience = null) => {
    try {
      let url = `/api/v1/Employee/GetEmployeeExperiences?idEmployee=${idEmployee}`;
      if (idEmployeeExperience) {
        url += `&idEmployeeExperience=${idEmployeeExperience}`;
      }
      const res = await API.get(url);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  
  static postEmployeeExperience = async (payload) => {
    try {
      const formData = new FormData();
      
      
      const dtos = Array.isArray(payload) ? payload : [payload];
      
      
      dtos.forEach((item, index) => {
        formData.append(`dtos[${index}].IdEmployeeExperience`, item.idEmployeeExperience || 0);
        formData.append(`dtos[${index}].IdEmployee`, item.idEmployee);
        formData.append(`dtos[${index}].CompanyName`, item.companyName);
        formData.append(`dtos[${index}].CompanyAddress`, item.companyAddress || "");
        formData.append(`dtos[${index}].IdCountry`, item.idCountry);
        formData.append(`dtos[${index}].Designation`, item.designation);
        formData.append(`dtos[${index}].Department`, item.department || "");
        formData.append(`dtos[${index}].EmploymentType`, item.employmentType);
        formData.append(`dtos[${index}].FromDate`, moment(item.fromDate).format("YYYY-MM-DD"));
        formData.append(`dtos[${index}].ToDate`, item.toDate ? moment(item.toDate).format("YYYY-MM-DD") : "");
        formData.append(`dtos[${index}].LastDrawnSalary`, item.lastDrawnSalary || "");
        formData.append(`dtos[${index}].ReasonForLeaving`, item.reasonForLeaving || "");
        formData.append(`dtos[${index}].IdUserCreated`, item.idUser);
        
        
        if (item.experienceCertificateFile) {
          formData.append(`dtos[${index}].ExperienceCertificatePath`, item.experienceCertificateFile);
        }
      });

      const res = await API.post("/api/v1/Employee/AddOrUpdateEmployeeExperiences", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };


  static deleteEmployeeExperience = async (idEmployeeExperience, idUser) => {
    try {
      const res = await API.delete(
        `/api/v1/Employee/DeleteEmployeeExperience?idEmployeeExperience=${idEmployeeExperience}&idUser=${idUser}`
      );
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  // ==================== DOCUMENTS APIs ====================

  
  static getEmployeeDocuments = async (idEmployee, idEmployeeDocument = null) => {
    try {
      let url = `/api/v1/Employee/GetEmployeeDocuments?idEmployee=${idEmployee}`;
      if (idEmployeeDocument) {
        url += `&idEmployeeDocument=${idEmployeeDocument}`;
      }
      const res = await API.get(url);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };


  static getDocumentTypes = async () => {
    try {
      const res = await API.get("/api/v1/Common/GetDocumentTypes");
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };


  static postEmployeeDocument = async (payload) => {
    try {
      const formData = new FormData();
      
      const dtos = Array.isArray(payload) ? payload : [payload];
      
      dtos.forEach((item, index) => {
        formData.append(`dtos[${index}].IdEmployeeDocument`, item.idEmployeeDocument || 0);
        formData.append(`dtos[${index}].IdEmployee`, item.idEmployee);
        formData.append(`dtos[${index}].IdDocumentType`, item.idDocumentType);
        formData.append(`dtos[${index}].Remarks`, item.remarks || "");
        formData.append(`dtos[${index}].IdUser`, item.idUser);
        if (item.dateValidTill) {
          formData.append(`dtos[${index}].DateValidTill`, item.dateValidTill);
        }
        
        if (item.documentContent) {
          formData.append(`dtos[${index}].DocumentFile`, item.documentContent);
        }
      });

      const res = await API.post("/api/v1/Employee/PostEmployeeDocuments", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static deleteEmployeeDocument = async (idEmployeeDocument, idUser) => {
    try {
      const res = await API.delete(
        `/api/v1/Employee/DeleteEmployeeDocument?idEmployeeDocument=${idEmployeeDocument}&idUser=${idUser}`
      );
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  // ==================== ASSETS APIs ====================

  
  static getAssets = async (idAsset = null, idAssetType = null, assetWorkingStatus = null) => {
    try {
      let url = "/api/v1/Asset/GetAssets?";
      const params = [];
      if (idAsset) params.push(`idAsset=${idAsset}`);
      if (idAssetType) params.push(`idAssetType=${idAssetType}`);
      if (assetWorkingStatus) params.push(`assetWorkingStatus=${assetWorkingStatus}`);
      
      url += params.join("&");
      const res = await API.get(url);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };


  static getAssetTypes = async () => {
    try {
      const res = await API.get("/api/v1/Asset/GetAssetTypes");
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };


  static postAsset = async (payload) => {
    try {
      const data = {
        IdAsset: payload.idAsset || 0,
        IdAssetType: payload.idAssetType,
        AssetSerialNumber: payload.assetSerialNumber,
        AssetDetails: payload.assetDetails || "",
        AverageCost: payload.averageCost,
        AssetWorkingStatus: payload.assetWorkingStatus,
        DefaultDurationOfAssignment: payload.defaultDurationOfAssignment || 0,
        IdUser: payload.idUser,
      };
      const res = await API.post("/api/v1/Asset/AddOrUpdateAssets", data);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };


  static assignAssetToEmployee = async (payload) => {
    try {
      const data = {
        IdAsset: payload.idAsset,
        IdEmployee: payload.idEmployee,
        AssignedDate: moment(payload.assignedDate).format("YYYY-MM-DD"),
        AssignedTillDate: payload.assignedTillDate ? moment(payload.assignedTillDate).format("YYYY-MM-DD") : null,
        Remarks: payload.remarks || "",
        AssignedBy: payload.assignedBy,
      };
      
      // Include IdAssetAssignment if provided (for updates)
      if (payload.idAssetAssignment) {
        data.IdAssetAssignment = payload.idAssetAssignment;
      }
      
      const res = await API.post("/api/v1/Employee/AssignAsset", data);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };


  static getEmployeeAssetAssignments = async (idEmployee) => {
    try {
      const res = await API.get(`/api/v1/Employee/GetAssetAssignments?idEmployee=${idEmployee}`);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };


  static returnAssetFromEmployee = async (payload) => {
    try {
      const url = `/api/v1/Employee/UnassignAsset?idAsset=${payload.idAsset}&idEmployee=${payload.idEmployee}`;
      const res = await API.post(url);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  
  static updateAssetWorkingStatus = async (payload) => {
    try {
      const data = {
        IdAsset: payload.idAsset,
        AssetWorkingStatus: payload.assetWorkingStatus,
        Remarks: payload.remarks || "",
        IdUser: payload.idUser,
      };
      const res = await API.post("/api/v1/Asset/UpdateAssetWorkingStatus", data);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  // ==================== EMPLOYEE ACTIONS APIs ====================


  static getEmployeeActionsForIdEmployee = async (idEmployee, idEmployeeAction = null) => {
    try {
      let url = `/api/v1/Employee/GetEmployeeActionsForIdEmployee?idEmployee=${idEmployee}`;
      if (idEmployeeAction) {
        url += `&idEmployeeAction=${idEmployeeAction}`;
      }
      const res = await API.get(url);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };


  static getEmployeeActions = async (params) => {
    try {
      let url = `/api/v1/Employee/GetEmployeeActions?`;
      const queryParams = [];
      if (params.idEmployee) queryParams.push(`idEmployee=${params.idEmployee}`);
      if (params.searchText) queryParams.push(`searchText=${encodeURIComponent(params.searchText)}`);
      if (params.actionType) queryParams.push(`actionType=${params.actionType}`);
      if (params.dateFrom) queryParams.push(`dateFrom=${moment(params.dateFrom).format("YYYY-MM-DD")}`);
      
      url += queryParams.join("&");
      const res = await API.get(url);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };


  static postEmployeeAction = async (payload) => {
    try {
      let data = [];
      data.push({
        idEmployeeAction: payload.idEmployeeAction || 0,
        idEmployee: payload.idEmployee,
        actionType: payload.actionType,
        actionDescription: payload.actionDescription,
        actionSeverity: payload.actionSeverity,
        remarks: payload.remarks || "",
        effectiveFromDate: moment(payload.effectiveFromDate).format("YYYY-MM-DD"),
        effectiveToDate: payload.effectiveToDate ? moment(payload.effectiveToDate).format("YYYY-MM-DD") : null,
        status: payload.status || "ACTIVE",
      });
      const res = await API.post("/api/v1/Employee/PostEmployeeActions", data);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };


  static approveEmployeeAction = async (payload) => {
    try {
      const data = {
        IdEmployeeAction: payload.idEmployeeAction,
        ApprovalStatus: payload.approvalStatus,
        ApprovedBy: payload.approvedBy,
        Remarks: payload.remarks || "",
      };
      const res = await API.post("/api/v1/Employee/ApproveEmployeeAction", data);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };


  static disableEmployeeAction = async (payload) => {
    try {
      const data = {
        IdEmployeeAction: payload.idEmployeeAction,
        Remarks: payload.remarks || "",
        IdUser: payload.idUser,
      };
      const res = await API.post("/api/v1/Employee/DisableEmployeeAction", data);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  // ==================== COMMON APIs ====================

  static getQualificationTypes = async () => {
    try {
      const res = await API.get("/api/v1/Common/GetQualificationTypes");
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static getCountries = async () => {
    try {
      const res = await API.get("/api/v1/Common/GetCountries");
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  // ==================== SERVICE CHANGES APIs ====================

  static getEmployeeServiceChanges = async (params) => {
    try {
      const { dateFrom, changeType, IdEmployee } = params;
      let url = "/api/v1/Employee/GetEmployeeServiceChanges?";
      const queryParams = [];
      
      if (IdEmployee) {
        queryParams.push(`IdEmployee=${IdEmployee}`);
      }
      if (dateFrom) {
        queryParams.push(`dateFrom=${dateFrom}`);
      }
      if (changeType) {
        queryParams.push(`changeType=${changeType}`);
      }
      
      url += queryParams.join("&");
      const res = await API.get(url);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static addUpdateEmployeeServiceChanges = async (payload) => {
    try {
      const response = await API.post("/api/v1/Employee/AddUpdateEmployeeServiceChanges", payload);
      return { error: null, data: response.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static getEmployeeServiceChangesForApproval = async (params) => {
    try {
      const { Status, ChangeType, DateFrom, SearchText } = params;
      let url = "/api/v1/Employee/GetEmployeeServiceChangesForApproval?";
      const queryParams = [];
      
      if (Status) {
        queryParams.push(`Status=${Status}`);
      }
      if (ChangeType !== undefined && ChangeType !== null) {
        queryParams.push(`ChangeType=${ChangeType}`);
      }
      if (DateFrom) {
        queryParams.push(`DateFrom=${DateFrom}`);
      }
      if (SearchText) {
        queryParams.push(`SearchText=${SearchText}`);
      }
      
      url += queryParams.join("&");
      const res = await API.get(url);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static approveServiceChanges = async (ids, approvalStatus, remarks = "") => {
    try {
      const url = `/api/v1/Employee/ApproveServiceChanges?approvalStatus=${approvalStatus}&remarks=${encodeURIComponent(remarks)}`;
      const res = await API.post(url, ids);
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };
}

