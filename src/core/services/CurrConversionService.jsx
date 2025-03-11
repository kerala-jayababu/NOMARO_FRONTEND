import { API } from "../../redux/api/utils";

export default class CurrConversionService {
 

    static getAllCurrencyConversions = async () => {
        try {
            const response = await API.get("/api/v1/PayRollManagement/GetAllCurrencyConversions");
            return { error: null, data: response.data };  
        } catch (error) {
            return handleApiError(error);
        }
    }

    static addCurrencyConversion = async (data) => {
        try {
            const response = await API.post("/api/v1/PayRollManagement/AddCurrencyConversion", data);
            return { error: null, data: response.data };
        } catch (error) {
            return handleApiError(error);
        }
    }

    static updateCurrencyConversion = async (data) => {
        try {
            const response = await API.post("/api/v1/PayRollManagement/UpdateCurrencyConversion", data);
            return { error: null, data: response.data };
        } catch (error) {
            return handleApiError(error);
        }
    }
};

const handleApiError = (error) => {
    return {
        error: error.response?.data?.message || 'An error occurred',
        data: null
    };
};
