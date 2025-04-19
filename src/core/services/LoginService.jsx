import { API } from "../../redux/api/utils";
import { handleApiSuccessOrError } from "../constants/commons";

export default class LoginService {

    static getOtp = async (email) => {
        try {
            const res = await API.get("/api/v1/Account/SetOTP?emailID=" + email);
            return { error: null, data: res.data };
        } catch (error) {
            return handleApiSuccessOrError(error, true);
        }
    }

    static validateEmailwithOtp = async (email, otp) => {
        try {
            const res = await API.get("/api/v1/Account/ValidateOTP?emailID=" + email + '&otp=' + otp);
            return { error: null, data: res.data };
        } catch (error) {
            return handleApiSuccessOrError(error, true);
        }
    }
}
