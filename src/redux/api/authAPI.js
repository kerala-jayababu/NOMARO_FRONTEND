import axios from "axios";
import {  handleApiError } from "./utils";

export const BASE_URL = import.meta.env.VITE_API_URL;


export const signIn = async (formData) => {
  try {
    const res = await axios.post(`${BASE_URL}api/v1/Account/login`, formData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("Sign in response:", res.data);
    return { error: null, data: res.data };
  } catch (error) {
    return handleApiError(error);
  }
};
