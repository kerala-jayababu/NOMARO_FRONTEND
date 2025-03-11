import { API } from "../../redux/api/utils";


export default class NotificationService {
    static getNotificationTypes = async () => {
        try {
            const response = await API.get("/api/v1/MasterData/GetNotificationConfigList");
            return { error: null, data: response.data };
        } catch (error) {
            return handleApiError(error);
        }
    }

    static addNotificationType = async (data) => {
        try {
            const response = await API.post("/api/v1/MasterData/AddNotificationConfig", data);
            return { error: null, data: response.data };
        } catch (error) {
            return handleApiError(error);
        }
    }

    static updateNotificationType = async (data) => {
        try {
            const response = await API.post("/api/v1/MasterData/UpdateNotificationConfig", data);
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

