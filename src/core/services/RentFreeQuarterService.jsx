import { API } from "../../redux/api/utils";
import { handleApiSuccessOrError } from "../constants/commons";

export default class RentFreeQuarterService {

    static getAllRentFreeQuarter = async (filter) => {
        try {
            let url = "/api/v1/PayRollManagement/GetRentFreeQuarterList";
            if (filter.searchText) {
                url += `?searchText=${filter.searchText}`;
            }
            if (filter.fromDate) {
                if (url.includes("?")) {
                    url += `&fromDate=${filter.fromDate}`;
                } else {
                    url += `?fromDate=${filter.fromDate}`;
                }
            }
            const response = await API.get(url);
            return { error: null, data: response.data };
        } catch (error) {
            return handleApiSuccessOrError(error, true);
        }
    }
    static getAllRentFreeQuarterDuration = async () => {
        try {
            const response = await API.get("/api/v1/PayRollManagement/GetRentFreeQuarterDurations");
            return { error: null, data: response.data };
        } catch (error) {
            return handleApiSuccessOrError(error, true);
        }
    }

    static addRentFreeQuarter = async (data) => {
        try {
            const response = await API.post("/api/v1/PayRollManagement/AddRentFreeQuarter", data);
            handleApiSuccessOrError(response.data, false);
            return { error: null, data: response.data };
        } catch (error) {
            return handleApiSuccessOrError(error, true);
        }
    }

    static updateRentFreeQuarter = async (data) => {
        try {
            const response = await API.post("/api/v1/PayRollManagement/UpdateRentFreeQuarter", data);
            handleApiSuccessOrError(response.data, false);
            return { error: null, data: response.data };
        } catch (error) {
            return handleApiSuccessOrError(error, true);
        }
    }

    static getAllRentFreeAllowances = async (searchText, finYear) => {
        try {
            const res = await API.get("/api/v1/PayRollManagement/GetRentFreeQuarterAllowanceList" + '?searchString=' + searchText + '&financialYear=' + finYear);
            return { error: null, data: res.data };
        } catch (error) {
            return handleApiSuccessOrError(error, true);
        }
    }

    static getAllRentFreeAllowanceById = async (id) => {
        try {
            const res = await API.get("/api/v1/PayRollManagement/GetRentFreeQuarterAllowanceById" + '?id=' + id);
            return { error: null, data: res.data };
        } catch (error) {
            return handleApiSuccessOrError(error, true);
        }
    }

    static addRentFreeQuarterAllowance = async (data) => {
        try {
            const response = await API.post("/api/v1/PayRollManagement/AddRentFreeQuarterAllowance", data);
            handleApiSuccessOrError(response.data, false);
            return { error: null, data: response.data };
        } catch (error) {
            return handleApiSuccessOrError(error, true);
        }
    }

    static updateRentFreeQuarterAllowance = async (data) => {
        try {
            const response = await API.post("/api/v1/PayRollManagement/UpdateRentFreeQuarterAllowance", data);
            handleApiSuccessOrError(response.data, false);
            return { error: null, data: response.data };
        } catch (error) {
            return handleApiSuccessOrError(error, true);
        }
    }
};
