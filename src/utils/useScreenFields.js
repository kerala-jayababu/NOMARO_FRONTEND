import { useCallback, useEffect, useState } from "react";
import { API } from "../redux/api/utils";

// Per-company field settings (label / visibility / max length) from CompanyScreenAttributeConfig,
// the same source Bank & Branches uses for IFSC. A field without a config row keeps its defaults
// (shown, default label), so new fields appear everywhere until the company configures them.
//
//   const field = useScreenFields("EMPPROF");
//   const f = field("PassportExpiry", "Passport Expiry");   // { label, visible, maxLength }
//   {f.visible && <label>{f.label}</label>}

const cache = {}; // screenCode -> Promise<array>

const loadConfig = (screenCode) => {
  if (!cache[screenCode]) {
    cache[screenCode] = API.get("/api/v1/ScreenAttributeConfig/GetByScreenCode", { params: { screenCode } })
      .then((res) => (Array.isArray(res?.data?.data) ? res.data.data : []))
      .catch(() => {
        delete cache[screenCode]; // try again next time the screen opens
        return [];
      });
  }
  return cache[screenCode];
};

const useScreenFields = (screenCode) => {
  const [config, setConfig] = useState({});

  useEffect(() => {
    let active = true;
    loadConfig(screenCode).then((rows) => {
      if (!active) return;
      const map = {};
      rows.forEach((r) => { if (r?.attributeId) map[r.attributeId.toLowerCase()] = r; });
      setConfig(map);
    });
    return () => { active = false; };
  }, [screenCode]);

  return useCallback((attributeId, defaultLabel, defaultMaxLength) => {
    const c = config[attributeId.toLowerCase()];
    return {
      label: c?.displayLabel?.trim() || defaultLabel,
      visible: c?.fieldVisibility ?? true,
      maxLength: c?.maxLength ?? defaultMaxLength,
    };
  }, [config]);
};

export default useScreenFields;
