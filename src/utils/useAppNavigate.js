import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getCompanyCode } from "./companyContext";

// Routes that must NOT be company-prefixed (public, token/agreement flows).
const NO_PREFIX = ["/agreement", "/auth"];

// Drop-in replacement for react-router-dom's useNavigate that automatically
// prefixes app routes with the selected company code, e.g. "/dashboard" -> "/GIA/dashboard".
// Absolute http(s) URLs, #-only links, and public routes are left untouched.
export function useAppNavigate() {
  const navigate = useNavigate();

  return useCallback(
    (to, options) => {
      if (typeof to === "string") {
        const code = getCompanyCode();
        if (
          code &&
          to.startsWith("/") &&
          !to.startsWith(`/${code}/`) &&
          to !== `/${code}` &&
          !NO_PREFIX.some((p) => to.toLowerCase().startsWith(p))
        ) {
          to = `/${code}${to}`;
        }
      }
      navigate(to, options);
    },
    [navigate]
  );
}
