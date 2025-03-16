import { API } from "../../redux/api/utils";
import { handleApiSuccessOrError } from "../constants/commons";

export default class NotificationService {
    static getNotificationTypes = async () => {
        try {
            const response = await API.get("/api/v1/MasterData/GetNotificationConfigList");
            return { error: null, data: response.data };
        } catch (error) {
            return handleApiSuccessOrError(error,true);
        }
    }

    static addNotificationType = async (data) => {
        try {
            const response = await API.post("/api/v1/MasterData/AddNotificationConfig", data);
            handleApiSuccessOrError(response.data,false);
            return { error: null, data: response.data };
        } catch (error) {
            return handleApiSuccessOrError(error,true);
        }
    }

    static updateNotificationType = async (data) => {
        try {
            const response = await API.post("/api/v1/MasterData/UpdateNotificationConfig", data);
            handleApiSuccessOrError(response.data,false);
            return { error: null, data: response.data };
        } catch (error) {
            return handleApiSuccessOrError(error,true);
        }
    }
};

