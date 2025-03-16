import { API } from "../../redux/api/utils";
import handleApiResponse from "../../utils/apiResponseHandler";
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

    static saveBankAndBranch = async (data) => {
        try {
            const response = await API.post("/api/v1/Bank/AddOrUpdateBranchesOfBank", data);
            handleApiSuccessOrError(response.data,false);
            return { error: null, data: response.data };
        } catch (error) {
            return handleApiSuccessOrError(error,true);   
        }
    }
    
}

// const handleApiError = (error) => {
//     handleApiResponse(error);
//     return {
//         error: error.response?.data?.message || 'An error occurred',
//         data: null
//     };
// };
