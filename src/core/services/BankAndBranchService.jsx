import { API } from "../../redux/api/utils";

export default class BankAndBranchService {

    static getAllBanks = async () => {
        try {
            const response = await API.get("/api/v1/Bank/GetBanksList");
            return { error: null, data: response.data };  
        } catch (error) {
            return handleApiError(error);
        }
    }

    static getBranches = async (idBank) => {
        try {
            const response = await API.get("/api/v1/Bank/GetBranchesOfBank?idBank="+idBank);
            return { error: null, data: response.data };  
        } catch (error) {
            return handleApiError(error);
        }
    }

    static saveBankAndBranch = async (data) => {
        try {
            const response = await API.post("/api/v1/Bank/AddOrUpdateBranchesOfBank", data);
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
