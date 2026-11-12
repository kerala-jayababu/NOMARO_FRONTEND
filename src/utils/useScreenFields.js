import { useCallback, useEffect, useState } from "react";
import BankAndBranchService from "../core/services/BankAndBranchService";
import { getCompanyCode } from "./companyContext";

// Per-company field settings (label / visibility / max length) from CompanyScreenAttributeConfig,
// the same source Bank & Branches uses for IFSC. A field without a config row keeps its defaults
// (shown, default label), so new fields appear everywhere until the company configures them.
//
//   const field = useScreenFields("EMPPROF");
//   const f = field("PassportExpiry", "Passport Expiry");   // { label, visible, maxLength, dataType }
//   {f.visible && <label>{f.label}</label>}

const cache = {}; // companyCode:screenCode -> Promise<array>
const EMPTY_FIELDS = {};

const loadConfig = (companyCode, screenCode) => {
  const cacheKey = `${companyCode.toLowerCase()}:${screenCode.toLowerCase()}`;
  if (!cache[cacheKey]) {
    cache[cacheKey] = BankAndBranchService.getScreenAttributeConfig(companyCode, screenCode)
      .then((response) => {
        if (response?.error) throw new Error(response.error);
        return Array.isArray(response?.data?.data) ? response.data.data : [];
      })
      .catch((error) => {
        delete cache[cacheKey]; // try again next time the screen opens
        console.error(`Failed to load field configuration for ${companyCode}/${screenCode}.`, error);
        return [];
      });
  }
  return cache[cacheKey];
};

const useScreenFields = (screenCode) => {
  const companyCode = getCompanyCode();
  const currentKey = companyCode && screenCode
    ? `${companyCode.toLowerCase()}:${screenCode.toLowerCase()}`
    : null;
  const [loadedConfig, setLoadedConfig] = useState({ key: null, fields: {} });

  useEffect(() => {
    let active = true;
    if (!companyCode || !screenCode) {
      return () => { active = false; };
    }

    loadConfig(companyCode, screenCode).then((rows) => {
      if (!active) return;
      const map = {};
      rows.forEach((r) => { if (r?.attributeId) map[r.attributeId.toLowerCase()] = r; });
      setLoadedConfig({ key: currentKey, fields: map });
    });
    return () => { active = false; };
  }, [companyCode, currentKey, screenCode]);

  const config = loadedConfig.key === currentKey ? loadedConfig.fields : EMPTY_FIELDS;
  return useCallback((attributeId, defaultLabel, defaultMaxLength) => {
    const c = config[attributeId.toLowerCase()];
    return {
      label: c?.displayLabel?.trim() || defaultLabel,
      visible: c?.fieldVisibility ?? true,
      maxLength: c?.maxLength ?? defaultMaxLength,
      dataType: c?.dataType ?? null,
    };
  }, [config]);
};

export default useScreenFields;
