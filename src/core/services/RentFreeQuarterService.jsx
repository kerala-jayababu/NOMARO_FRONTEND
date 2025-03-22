import { API } from "../../redux/api/utils";
import { handleApiSuccessOrError } from "../constants/commons";

export default class RentFreeQuarterService {
 

    static getAllRentFreeQuarterDuration = async () => {
        try {
            const response = await API.get("/api/v1/PayRollManagement/GetRentFreeQuarterDurations");
            return { error: null, data: response.data };  
        } catch (error) {
            return handleApiSuccessOrError(error,true);
        }
    }

    static createRentFreeQuarter = async (data) => {
        try {
            const response = await API.post("/api/v1/PayRollManagement/AddRentFreeQuarter", data);
            handleApiSuccessOrError(response.data,false);
            return { error: null, data: response.data };
        } catch (error) {
            return handleApiSuccessOrError(error,true);
        }
    }
    // static addCurrencyConversion = async (data) => {
    //     try {
    //         const response = await API.post("/api/v1/PayRollManagement/AddCurrencyConversion", data);
    //         handleApiSuccessOrError(response.data,false);
    //         return { error: null, data: response.data };
    //     } catch (error) {
    //         return handleApiSuccessOrError(error,true);
    //     }
    // }

    // static updateCurrencyConversion = async (data) => {
    //     try {
    //         const response = await API.post("/api/v1/PayRollManagement/UpdateCurrencyConversion", data);
    //         handleApiSuccessOrError(response.data,false);
    //         return { error: null, data: response.data };
    //     } catch (error) {
    //         return handleApiSuccessOrError(error,true);
    //     }
    // }
};
