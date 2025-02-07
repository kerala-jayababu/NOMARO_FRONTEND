import { API, handleApiError } from "./utils";

export const signIn = async (formData) => {
  try {
    const res = await API.post("/api/v1/Account/login", formData, {
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
