import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setComponent } from "../../../redux/reducers/component";
import { getAllPayrollScreensAction } from "../../../redux/actions/roleBasedScreensActions";
import { setIdPayrollScreen } from "../../../redux/reducers/auth";
import CommonService from "../../../core/services/CommonService";

function Menu({ viewType }) {
  const dispatch = useDispatch();
  const { payrollScreen } = useSelector((state) => state.roleBasedScreen);
  const navigate = useNavigate();
  const [menu, setMenu] = useState("");
  const [subMenu, setSubMenu] = useState("");
  const [logo, setLogo] = useState("/assets/logo.png");

  const canView = useMemo(() => {
    const permMap = new Map();
    payrollScreen.forEach((screen) => {
      const parentPerm = screen.validPermissions || screen.permission || "";
      permMap.set(screen.screenName, parentPerm.includes("V"));
      (screen.subMenus || []).forEach((s) => {
        const p = s.validPermissions || s.permission || "";
        permMap.set(s.screenName, p.includes("V"));
      });
    });
    return (name) => !!permMap.get(name);
  }, [payrollScreen]);

  useEffect(() => {
    dispatch(getAllPayrollScreensAction(viewType));

    navigate("/dashboard");
    window.history.pushState(null, '', window.location.href);
    window.onpopstate = function () {
      window.history.pushState(null, '', window.location.href);
    };

    // Function to remove classes from <html> tag
    const removeHtmlClasses = () => {
      const html = document.documentElement;
      html.classList.remove(
        "light-style",
        "layout-menu-fixed",
        "layout-menu-100vh",
        "layout-menu-expanded"
      );
    };

    // Add click event to menu toggle
    const toggleBtn = document.getElementById("menu-toggle-remove");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", removeHtmlClasses);
    }

    // Fetch logo from system parameters
    CommonService.getSystemParameters().then(res => {
      if (res.data && res.data.data) {
        debugger;
        const productLogo = res.data.data.find(item => item.parameterName === "ProductLogo");
        if (productLogo && productLogo.parameterBinaryValue) {
          setLogo(`data:image/png;base64,${productLogo.parameterBinaryValue}`);
        }
      }
    }).catch(err => {
      // Keep default logo if API fails
      console.error("Failed to fetch logo:", err);
    });

    // Cleanup event listener
    return () => {
      if (toggleBtn) {
        toggleBtn.removeEventListener("click", removeHtmlClasses);
      }
    };
  }, [dispatch, viewType]);

  return (
    <aside
      id="layout-menu"
      className="layout-menu menu-vertical menu bg-menu-theme"
    >
      <div className="app-brand demo">
        <a href="#" className="app-brand-link">
          <span className="app-brand-logo demo">
            <img src={logo} alt="Logo" />
          </span>
        </a>
        <a
          id="menu-toggle-remove"
          href="#"
          className="layout-menu-toggle menu-link text-large ms-auto d-block d-xl-none"
        >
          <i className="bx bx-chevron-left bx-sm align-middle"></i>
        </a>
      </div>

      <div className="menu-inner-shadow"></div>

      <ul className="menu-inner scroll-side-menu py-1">
        {payrollScreen.map((screen) => (
          <li
            key={screen.screenName}
            className={`menu-item ${menu === screen.screenName ? "open active" : ""
              } cursor-pointer`}
          >
            <a
              className="menu-link menu-toggle"
              onClick={() => {
                setMenu(menu === screen.screenName ? "" : screen.screenName);
              }}
            >
              <i className="menu-icon tf-icons bx bx-dock-top"></i>
              <div data-i18n="Account Settings">{screen.screenName}</div>
            </a>
            <ul className="menu-sub">
              {screen.subMenus
                .slice()
                .sort((a, b) => a.screenName.localeCompare(b.screenName))
                .map((menuItem) => (
                  <li
                    key={menuItem.screenName}
                    className={`menu-item ${subMenu === menuItem.screenName ? "active" : ""}`}
                  >
                    <a className="menu-link">
                      <div
                        data-i18n="Account"
                        onClick={() => {
                          if (!canView(menuItem.screenName)) {
                            return; // block if no view permission
                          }
                          // Remove html classes on submenu click
                          const html = document.documentElement;
                          html.classList.remove(
                            "light-style",
                            "layout-menu-fixed",
                            "layout-menu-100vh",
                            "layout-menu-expanded"
                          );

                          setSubMenu(
                            subMenu === menuItem.screenName
                              ? ""
                              : menuItem.screenName
                          );

                          dispatch(setIdPayrollScreen(menuItem.idPayrollScreen));
                          dispatch(setComponent(menuItem.screenName));

                          if (
                            screen.screenName.trim().toLowerCase() === "reports"
                          ) {
                            const url =
                              window.location.origin +
                              window.location.pathname +
                              "#/reports";
                            window.open(url, "_blank");
                          } else {
                            navigate(
                              `/dashboard/${menuItem.screenName
                                .replace(/\s+/g, "-")
                                .toLowerCase()}`
                            );
                          }
                        }}
                      >
                        {menuItem.screenName}
                      </div>
                    </a>
                  </li>
                ))}
            </ul>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default Menu;
