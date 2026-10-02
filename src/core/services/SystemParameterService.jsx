import { API } from "../../redux/api/utils";

// System Parameters screen (MasterDataController)
export default class SystemParameterService {
  // Only parameters with ShowInUIToConfigure = true; images are not included (see getImage)
  static getConfigurableParameters = async () => {
    try {
      const res = await API.get("/api/v1/MasterData/GetConfigurableSystemParameters");
      return { error: null, data: res.data };
    } catch (error) {
      return { error: error.response?.data?.message || "Failed to load system parameters", data: null };
    }
  };

  // data.data = { contentType, imageBase64 } or null when no image is stored
  static getImage = async (id) => {
    try {
      const res = await API.get("/api/v1/MasterData/GetSystemParameterImage", { params: { id } });
      return { error: null, data: res.data };
    } catch (error) {
      return { error: error.response?.data?.message || "Failed to load image", data: null };
    }
  };

  // value: new ParameterValue (null = leave unchanged); imageFile: File from the picker (null = leave unchanged)
  static updateParameter = async (idSystemParameter, value, imageFile) => {
    try {
      const form = new FormData();
      form.append("IdSystemParameter", idSystemParameter);
      if (value !== null && value !== undefined) form.append("ParameterValue", value);
      if (imageFile) form.append("ImageFile", imageFile);
      const res = await API.post("/api/v1/MasterData/UpdateSystemParameterValue", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return { error: null, data: res.data };
    } catch (error) {
      return { error: error.response?.data?.message || "Failed to update system parameter", data: null };
    }
  };
}
