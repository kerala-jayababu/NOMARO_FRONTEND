import { API } from "../../redux/api/utils";
import { handleApiSuccessOrError } from "../constants/commons";

export default class BankAndBranchService {

    static getAllBanks = async () => {
        try {
            const response = await API.get("/api/v1/Bank/GetBanksList");
            return { error: null, data: response.data };  
        } catch (error) {
            return handleApiSuccessOrError(error,true);
        }
    }

    static getBranches = async (idBank) => {
        try {
            const response = await API.get("/api/v1/Bank/GetBranchesOfBank?idBank="+idBank);
            return { error: null, data: response.data };  
        } catch (error) {
            return handleApiSuccessOrError(error,true);
        }
    }

    static getScreenAttributeConfig = async (companyCode, screenCode) => {
        if (!companyCode?.trim() || !screenCode?.trim()) {
            const message = "Company code and screen code are required to load screen field configuration.";
            console.error(message);
            return { error: message, data: null };
        }

        try {
            const response = await API.get(`/api/v1/${encodeURIComponent(companyCode)}/ScreenAttributeConfig/GetByScreenCode`, {
                params: { screenCode }
            });
            return { error: null, data: response.data };
        } catch (error) {
            return handleApiSuccessOrError(error, true);
        }
    }

    static saveBankAndBranch = async (data) => {
        try {
            const response = await API.post("/api/v1/Bank/AddOrUpdateBranchesOfBank", data);
            handleApiSuccessOrError(response.data,false);
            return { error: null, data: response.data };
        } catch (error) {
            return handleApiSuccessOrError(error,true);   
        }
    }

    static saveAllBanks = async (data) => {
        try {
            const response = await API.post("/api/v1/Bank/AddOrUpdateBanks", data);
            handleApiSuccessOrError(response.data,false);
            return { error: null, data: response.data };
        } catch (error) {
            return handleApiSuccessOrError(error,true);   
        }
    }
    
}
