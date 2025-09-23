import React, { useEffect, useMemo } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
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

  for (const screen of payrollScreen) {
    const parentSlug = normalizeToSlug(screen.screenName);
    const parentPerm = screen.validPermissions || screen.permission || "";
    const subMenus = Array.isArray(screen.subMenus) ? screen.subMenus : [];
    if (parentSlug === slug) {
      // Allow if parent has V OR any submenu has V
      const anySubmenuView = subMenus.some((s) =>
        (s.validPermissions || s.permission || "").includes("V")
      );
      return parentPerm.includes("V") || anySubmenuView;
    }

    for (const sub of subMenus) {
      const subSlug = normalizeToSlug(sub.screenName);
      const subPerm = sub.validPermissions || sub.permission || "";
      if (subSlug === slug) {
        return subPerm.includes("V");
      }
    }
  }
  return false;
}

function PermissionGate() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { payrollScreen } = useSelector((state) => state.roleBasedScreen);

  // Ensure permissions are loaded when landing directly on a deep link/new tab
  useEffect(() => {
    if (!Array.isArray(payrollScreen) || payrollScreen.length === 0) {
      dispatch(getAllPayrollScreensAction(null));
    }
  }, [dispatch]);

  const isAllowed = useMemo(() => {
    // Determine slug: for /#/dashboard/xyz or /#/reports
    const hashPath = location.hash?.replace(/^#/, "") || location.pathname;
    const parts = hashPath.split("/").filter(Boolean);
    // routes: ["dashboard", slug] or ["reports"]
    let targetSlug = null;
    if (parts[0] === "dashboard" && parts.length >= 2) {
      targetSlug = parts[1];
    } else if (parts[0] === "reports") {
      targetSlug = "reports";
    }

    if (!targetSlug) return true; // let non-screen routes pass
    // If permissions not loaded yet, do not block; allow content while loading
    if (!Array.isArray(payrollScreen) || payrollScreen.length === 0) return true;
    return hasViewPermissionOnSlug(payrollScreen, targetSlug);
  }, [location.hash, location.pathname, payrollScreen]);

  return isAllowed ? <Outlet /> : <Navigate to="/dashboard" replace />;
}

export default PermissionGate;


