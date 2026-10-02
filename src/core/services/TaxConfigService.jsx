import { API } from "../../redux/api/utils";

const errorOf = (error, fallback) => error?.response?.data?.message || fallback;

// Income Tax Config: FinancialYears -> TaxYearConfigs (one per financial year and regime) -> TaxSlabs
export default class TaxConfigService {
  static getTaxYearConfigs = async (idFinancialYear = null) => {
    try {
      const response = await API.get("/api/v1/TaxConfigs/GetTaxYearConfigs", {
        params: { idFinancialYear: idFinancialYear || undefined },
      });
      return { error: null, data: response.data };
    } catch (error) {
      return { error: errorOf(error, "Failed to load tax year configurations"), data: null };
    }
  };

  static addOrUpdateTaxYearConfig = async (data) => {
    try {
      const response = await API.post("/api/v1/TaxConfigs/AddOrUpdateTaxYearConfig", data);
      return { error: null, data: response.data };
    } catch (error) {
      return { error: errorOf(error, "Failed to save the tax year configuration"), data: null };
    }
  };

  static getTaxSlabs = async (idTaxYearConfig, ageCategory = "") => {
    try {
      const response = await API.get("/api/v1/TaxConfigs/GetAllTaxSlabs", {
        params: { idTaxYearConfig, ageCategory: ageCategory || undefined },
      });
      return { error: null, data: response.data };
    } catch (error) {
      return { error: errorOf(error, "Failed to load tax slabs"), data: null };
    }
  };

  static addTaxSlab = async (data) => {
    try {
      const response = await API.post("/api/v1/TaxConfigs/AddTaxSlab", data);
      return { error: null, data: response.data };
    } catch (error) {
      return { error: errorOf(error, "Failed to add the tax slab"), data: null };
    }
  };

  static updateTaxSlab = async (data) => {
    try {
      const response = await API.post("/api/v1/TaxConfigs/UpdateTaxSlab", data);
      return { error: null, data: response.data };
    } catch (error) {
      return { error: errorOf(error, "Failed to update the tax slab"), data: null };
    }
  };
}
