import axios from "axios";
import secureLocalStorage from "react-secure-storage";

// Company (tenant) context resolved from the URL company code, e.g. /#/GIA/dashboard.
// The company code drives which database the backend connects to: every API call to
// /api/v1/... is rewritten to /api/v1/{companyCode}/... (see injectCompanyCodeIntoUrl).

const COMPANY_CODE_KEY = "companyCode";
const COMPANY_CONFIG_KEY = "companyConfig";
// Plain (unencrypted) copy of the company code so early scripts like browser-config.js
// can read it before React/secureLocalStorage are available.
const PLAIN_COMPANY_CODE_KEY = "nomaroCompanyCode";

export const getCompanyCode = () => {
  try {
    const code = secureLocalStorage.getItem(COMPANY_CODE_KEY);
    return code ? String(code) : null;
  } catch {
    return null;
  }
};

export const setCompanyCode = (code) => {
  try {
    if (code) {
      secureLocalStorage.setItem(COMPANY_CODE_KEY, String(code));
      localStorage.setItem(PLAIN_COMPANY_CODE_KEY, String(code));
    } else {
      secureLocalStorage.removeItem(COMPANY_CODE_KEY);
      localStorage.removeItem(PLAIN_COMPANY_CODE_KEY);
    }
  } catch {
    /* ignore storage errors */
  }
};

export const getCompanyConfig = () => {
  try {
    return secureLocalStorage.getItem(COMPANY_CONFIG_KEY) || null;
  } catch {
    return null;
  }
};

export const setCompanyConfig = (config) => {
  try {
    if (config) {
      secureLocalStorage.setItem(COMPANY_CONFIG_KEY, config);
    } else {
      secureLocalStorage.removeItem(COMPANY_CONFIG_KEY);
    }
    // let screens (e.g. login) react when the config arrives after their first render
    window.dispatchEvent(new CustomEvent("companyConfigChanged", { detail: config }));
  } catch {
    /* ignore storage errors */
  }
};

// Resolves the company configuration from NOMARO_GLOBAL via the tenant API.
// This endpoint is anonymous and must NOT be company-prefixed itself.
// Returns the config object on success, null when the company code is invalid.
export const fetchCompanyConfig = async (companyCode) => {
  try {
    const baseUrl = import.meta.env.VITE_API_URL;
    const res = await axios.get(
      `${baseUrl}/api/v1/Tenant/${encodeURIComponent(companyCode)}`
    );
    if (res?.data?.success && res.data.data) {
      return res.data.data;
    }
    return null;
  } catch {
    return null;
  }
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Rewrites an API URL from /api/v1/{controller}/... to /api/v1/{companyCode}/{controller}/...
// Idempotent and skipped when no company is selected or for the Tenant endpoint itself.
export const injectCompanyCodeIntoUrl = (url) => {
  const code = getCompanyCode();
  if (!code || !url || typeof url !== "string") {
    return url;
  }

  const apiMatch = url.match(/\/api\/v[\d.]+\//i);
  if (!apiMatch) {
    return url;
  }

  const afterApi = url.slice(url.indexOf(apiMatch[0]) + apiMatch[0].length);

  // Never prefix the tenant resolution endpoint
  if (/^Tenant(\/|$)/i.test(afterApi)) {
    return url;
  }

  // Already prefixed with this company code
  if (new RegExp(`^${escapeRegExp(code)}(/|$)`, "i").test(afterApi)) {
    return url;
  }

  return url.replace(apiMatch[0], `${apiMatch[0]}${code}/`);
};

// Prefixes an app route path with the selected company code: "/dashboard" -> "/GIA/dashboard".
export const withCompanyPrefix = (path) => {
  const code = getCompanyCode();
  if (!code) {
    return path;
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (
    normalizedPath.toLowerCase() === `/${code}`.toLowerCase() ||
    normalizedPath.toLowerCase().startsWith(`/${code}/`.toLowerCase())
  ) {
    return normalizedPath;
  }
  return `/${code}${normalizedPath}`;
};
