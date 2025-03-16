import { API } from "../../redux/api/utils";
import { handleApiSuccessOrError } from "../constants/commons";

export default class TaxConfigService {
 

    static getBaseTaxThresholds = async (idFinancialYear) => {
        try {
            const response = await API.get(`/api/v1/TaxConfigs/GetAllTaxSlabs?idFinancialYear=${idFinancialYear}`);
            return { error: null, data: response.data };  
        } catch (error) {
            return handleApiSuccessOrError(error,true);
        }
    }

    static getChildTaxThresholds = async (idFinancialYear) => {
        try {
            const response = await API.get(`/api/v1/TaxConfigs/GetChildTaxThresholdList?idFinancialYear=${idFinancialYear}`);
            return { error: null, data: response.data };
        } catch (error) {
            return handleApiSuccessOrError(error,true);
        }
    }

    static createTaxThreshold = async (data) => {
        try {
            const response = await API.post("/api/v1/TaxConfigs/AddTaxSlab", data);
            handleApiSuccessOrError(response.data,false);
            return { error: null, data: response.data };
        } catch (error) {
            return handleApiSuccessOrError(error,true);
        }
    }

    static updateTaxThreshold = async (data) => {
        try {
            const response = await API.post("/api/v1/TaxConfigs/UpdateTaxSlab", data);
            handleApiSuccessOrError(response.data,false);
            return { error: null, data: response.data };
        } catch (error) {
            return handleApiSuccessOrError(error,true);
        }
    }

    static createChildTaxThreshold = async (data) => {
        try {
            const response = await API.post("/api/v1/TaxConfigs/AddChildTaxThreshold", data);
            handleApiSuccessOrError(response.data,false);
            return { error: null, data: response.data };
        } catch (error) {
            return handleApiSuccessOrError(error,true);
        }
    }

    static updateChildTaxThreshold = async (data) => {
        try {
            const response = await API.post("/api/v1/TaxConfigs/UpdateChildTaxThreshold", data);
            handleApiSuccessOrError(response.data,false);
            return { error: null, data: response.data };
        } catch (error) {
            return handleApiSuccessOrError(error,true);
        }
    }
}

