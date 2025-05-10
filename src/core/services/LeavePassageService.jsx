import { API } from "../../redux/api/utils";
import { handleApiSuccessOrError } from "../constants/commons";

export default class LeavePassageService {

    static getLeavePassagesById = async (empId) => {
        try {
            const res = await API.get("api/v1/LeavePassages/GetLeavePassageById?id=" + empId);
            return { error: null, data: res.data };
        } catch (error) {
            return handleApiSuccessOrError(error, true);
        }
    }

    static getLeavePassagesList = async (empName, salaryMonth) => {
        try {
            const res = await API.get("/api/v1/LeavePassages/GetLeavePassagesList?searchText=" + empName + '&dropdownFilter=' + salaryMonth);
            return { error: null, data: res.data };
        } catch (error) {
            return handleApiSuccessOrError(error, true);
        }
    }

    static addLeavePassage = async (leavePassageData) => {
        try {
            const res = await API.post("/api/v1/LeavePassages/AddLeavePassage", leavePassageData);
            handleApiSuccessOrError(res.data,false);
            return { error: null, data: res.data };
        } catch (error) {
            return handleApiSuccessOrError(error, true);
        }
    }

    static updateLeavePassage = async (leavePassageData) => {
        try {
            const res = await API.post("/api/v1/LeavePassages/UpdateLeavePassage", leavePassageData);
            handleApiSuccessOrError(res.data,false);
            return { error: null, data: res.data };
        } catch (error) {
            return handleApiSuccessOrError(error, true);
        }
    }

    static getLeavePassagesByEmployeeId = async (empId) => {
        try {
            const res = await API.get("/api/v1/LeavePassages/GetLeavePassagesByemployeeId?EmployeeId=" + empId);
            return { error: null, data: res.data };
        } catch (error) {
            return handleApiSuccessOrError(error, true);
        }
    }
}