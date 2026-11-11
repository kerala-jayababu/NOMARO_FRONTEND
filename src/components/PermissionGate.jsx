import React, { useEffect, useMemo } from "react";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getAllPayrollScreensAction } from "../redux/actions/roleBasedScreensActions";

function normalizeToSlug(name) {
  return (name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function hasViewPermissionOnSlug(payrollScreen, slug) {
  if (!Array.isArray(payrollScreen) || !slug) return false;
  const routeKey = slug.toLowerCase();
  const matchesRoute = (screen) =>
    normalizeToSlug(screen.screenName) === routeKey ||
    screen.screenCode?.toLowerCase() === routeKey;

  for (const screen of payrollScreen) {
    const parentPerm = screen.validPermissions || screen.permission || "";
    const subMenus = Array.isArray(screen.subMenus) ? screen.subMenus : [];
    if (matchesRoute(screen)) {
      // Allow if parent has V OR any submenu has V
      const anySubmenuView = subMenus.some((s) =>
        (s.validPermissions || s.permission || "").includes("V")
      );
      return parentPerm.includes("V") || anySubmenuView;
    }

    for (const sub of subMenus) {
      const subPerm = sub.validPermissions || sub.permission || "";
      if (matchesRoute(sub)) {
        return subPerm.includes("V");
      }
    }
  }
  return false;
}

function PermissionGate() {
  const location = useLocation();
  const { companyCode } = useParams();
  const dispatch = useDispatch();
  const { payrollScreen } = useSelector((state) => state.roleBasedScreen);

  // Ensure permissions are loaded when landing directly on a deep link/new tab
  useEffect(() => {
    if (!Array.isArray(payrollScreen) || payrollScreen.length === 0) {
      dispatch(getAllPayrollScreensAction(null));
    }
  }, [dispatch]);

  const isAllowed = useMemo(() => {
    // Resolve the menu screen code or legacy screen-name slug from the URL.
    const parts = location.pathname.split("/").filter(Boolean);
    let targetSlug = null;
    const reportsIndex = parts.findIndex((part) => part.toLowerCase() === "reports");
    const dashboardIndex = parts.findIndex((part) => part.toLowerCase() === "dashboard");
    if (reportsIndex >= 0) {
      targetSlug = parts[reportsIndex + 1] || "reports";
    } else if (dashboardIndex >= 0 && parts.length > dashboardIndex + 1) {
      targetSlug = parts[dashboardIndex + 1];
    }

    if (!targetSlug) return true; // let non-screen routes pass
    // If permissions not loaded yet, do not block; allow content while loading
    if (!Array.isArray(payrollScreen) || payrollScreen.length === 0) return true;
    return hasViewPermissionOnSlug(payrollScreen, targetSlug);
  }, [location.pathname, payrollScreen]);

  const dashboardPath = companyCode ? `/${companyCode}/dashboard` : "/dashboard";
  return isAllowed ? <Outlet /> : <Navigate to={dashboardPath} replace />;
}

export default PermissionGate;
