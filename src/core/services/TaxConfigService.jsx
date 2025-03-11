import { API } from "../../redux/api/utils";

export default class TaxConfigService {
 

    static getBaseTaxThresholds = async (idFinancialYear) => {
        try {
            const response = await API.get(`/api/v1/TaxConfigs/GetAllTaxSlabs?idFinancialYear=${idFinancialYear}`);
            return { error: null, data: response.data };  
        } catch (error) {
            return handleApiError(error);
        }
    }

    static getChildTaxThresholds = async (idFinancialYear) => {
        try {
            const response = await API.get(`/api/v1/TaxConfigs/GetChildTaxThresholdList?idFinancialYear=${idFinancialYear}`);
            return { error: null, data: response.data };
        } catch (error) {
            return handleApiError(error);
        }
    }

    static createTaxThreshold = async (data) => {
        try {
            const response = await API.post("/api/v1/TaxConfigs/AddTaxSlab", data);
            return { error: null, data: response.data };
        } catch (error) {
            return handleApiError(error);
        }
    }

    static updateTaxThreshold = async (data) => {
        try {
            const response = await API.post("/api/v1/TaxConfigs/UpdateTaxSlab", data);
            return { error: null, data: response.data };
        } catch (error) {
            return handleApiError(error);
        }
    }

    static createChildTaxThreshold = async (data) => {
        try {
            const response = await API.post("/api/v1/TaxConfigs/AddChildTaxThreshold", data);
            return { error: null, data: response.data };
        } catch (error) {
            return handleApiError(error);
        }
    }

    static updateChildTaxThreshold = async (data) => {
        try {
            const response = await API.post("/api/v1/TaxConfigs/UpdateChildTaxThreshold", data);
            return { error: null, data: response.data };
        } catch (error) {
            return handleApiError(error);
        }
    }
}

const handleApiError = (error) => {
    return {
        error: error.response?.data?.message || 'An error occurred',
        data: null
    };
};
