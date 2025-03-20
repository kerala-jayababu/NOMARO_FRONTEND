import { API, handleApiError } from "../../redux/api/utils";

export default class SalaryGenerationService {
  static generateDraftSalary = async (employeeIds, month) => {
    try {
      const res = await API.post(
        `/api/v1/SalaryGeneration/GenerateSalaryDraft?employeeIds=${employeeIds}&idSalaryMonth=${month}`
      );
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static undoGeneratedDraftSalary = async (employeeIds, month) => {
    try {
      const res = await API.post(
        `/api/v1/SalaryGeneration/UndoGeneratedDraftSalary?employeeIds=${employeeIds}&idSalaryMonth=${month}`
      );
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static submitSalaryDetails = async (employeeIds, month) => {
    try {
      const res = await API.post(
        `/api/v1/SalaryGeneration/SubmitSalaryDetails?employeeIds=${employeeIds}&idSalaryMonth=${month}`
      );
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static handleApprovalWorkflow = async (content) => {
    try {
      const res = await API.post(
        `/api/v1/Common/HandleApprovalWorkflow`,
        content
      );
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  static  exportSalaryGeneration = async (employeeIds, month) => {
    try {
      const res = await API.get(
        `/api/v1/SalaryGeneration/ExportSalaryGenerationDetails?employeeIds=${employeeIds}&idSalaryMonth=${month}`
      );
      return { error: null, data: res.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

}
