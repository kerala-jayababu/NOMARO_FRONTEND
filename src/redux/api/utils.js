
import axios from "axios";
import secureLocalStorage from "react-secure-storage";
import { injectCompanyCodeIntoUrl } from "../../utils/companyContext";
 
export const BASE_URL = import.meta.env.VITE_API_URL;
 
export const authInterceptor = (req) => {
  const user = secureLocalStorage.getItem("user");
 
  let token = null;
  if (user) {
    try {
      const parsedUser = JSON.parse(user);
      token = parsedUser.token;
      // console.log("Parsed token:", token);
    } catch (error) {
      console.error("Error parsing token:", error);
    }
  }
 
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
    // console.log("Authorization header set:", req.headers.Authorization);
  } else {
    console.log("No token found in storage");
  }

  // Route the request to the company-specific database (dynamic DB per company code)
  if (req.url) {
    req.url = injectCompanyCodeIntoUrl(req.url);
  }

  return req;
};
 
export const API = axios.create({
  baseURL: BASE_URL,
});
 
API.interceptors.request.use(authInterceptor);

// Raw axios calls (absolute URLs built with BASE_URL) get the company code injected too.
axios.interceptors.request.use((config) => {
  if (config.url) {
    config.url = injectCompanyCodeIntoUrl(config.url);
  }
  return config;
});
 
export const handleApiError = async (error) => {
  try {
    const errorMessage =
      error.response?.data?.message || "An unexpected error occurred.";
    return { error: errorMessage, data: null };
  } catch {
    return { error: "An unexpected error occurred.", data: null };
  }
};
 
 
 
