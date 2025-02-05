const API_PATH = "api/v1";

export const BASE_URL = process.env.VITE_API_URL;

const API_ROUTES = {
  LOGIN: {
    LOGINAPI: API_PATH + "/general/user/login"
  },
  LOGOUT: {
    LOGOUTAPI: API_PATH + "/user/logout"
  },
  EMPLOYEE: {
    GET_EMPLOYEE_LIST: API_PATH + "/Employee/GetEmployeeList"
  }
};

export default API_ROUTES;
