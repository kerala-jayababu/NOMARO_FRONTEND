
import axios from "axios";
import secureLocalStorage from "react-secure-storage";
 
export const BASE_URL = import.meta.env.VITE_API_URL;
 
export const authInterceptor = (req) => {
  const user = secureLocalStorage.getItem("user");

  let token = null;
  if (user) {
    try {
      const parsedUser = JSON.parse(user);
      token = parsedUser.token;
    } catch (error) {
      console.error("Error parsing token:", error);
    }
  }
 
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  } else {
    console.log("No token found in storage");
  }
 
  return req;
};
 
export const API = axios.create({
  baseURL: BASE_URL,
});
 
API.interceptors.request.use(authInterceptor);
 
export const handleApiError = async (error) => {
  try {
    const errorMessage =
      error.response?.data?.message || "An unexpected error occurred.";
    return { error: errorMessage, data: null };
  } catch {
    return { error: "An unexpected error occurred.", data: null };
  }
};
 
 
 
