import { API, handleApiError } from "./utils";

export const signIn = async (formData) => {
  try {
    const res = await API.post("/api/Auth/login", formData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return { error: null, data: res.data };
  } catch (error) {
    return handleApiError(error);
  }
};


