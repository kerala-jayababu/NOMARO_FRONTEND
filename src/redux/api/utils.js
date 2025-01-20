import axios from "axios";
import secureLocalStorage from "react-secure-storage";

const BASE_URL = import.meta.env.VITE_API_URL;

const authInterceptor = (req) => {
  const token = JSON.parse(secureLocalStorage.getItem("user"))?.token;
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
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
    const data = null;
    return { error: errorMessage, data };
  } catch (err) {
    throw new Error("An unexpected error occurred.");
  }
};
