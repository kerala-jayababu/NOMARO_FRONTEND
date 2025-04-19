import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setComponent } from "../../../redux/reducers/component";
import { getAllPayrollScreensAction } from "../../../redux/actions/roleBasedScreensActions";
import { setIdPayrollScreen } from "../../../redux/reducers/auth";

function Menu({viewType}) {
  const dispatch = useDispatch();
  const { payrollScreen } = useSelector((state) => state.roleBasedScreen);
  const navigate = useNavigate();
  const [menu, setMenu] = useState("");
  const [subMenu, setSubMenu] = useState("");

  useEffect(() => {
    dispatch(getAllPayrollScreensAction(viewType));

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
    navigate("/dashboard");
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
            <img src="/assets/logo.png" />
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

      <ul className="menu-inner py-1">
        {payrollScreen.map((screen) => (
          <li
            key={screen.screenName}
            className={`menu-item ${
              menu === screen.screenName ? "open active" : ""
            } cursor-pointer`}
          >
            <a
              className="menu-link menu-toggle"
              onClick={() => {
                setMenu(menu === screen.screenName ? "" : screen.screenName);
                if (screen.screenName.trim().toLowerCase() === 'reports') {
                  const url = window.location.origin + window.location.pathname + '#/reports';
                  window.open(url, '_blank');
                }
              }}
            >
              <i className="menu-icon tf-icons bx bx-dock-top"></i>
              <div data-i18n="Account Settings">{screen.screenName}</div>
            </a>
            <ul className="menu-sub">
              {screen.subMenus.map((menuItem) => (
                <li
                  key={menuItem.screenName}
                  className={`menu-item ${
                    subMenu === menuItem.screenName ? "active" : ""
                  }`}
                >
                  <a className="menu-link">
                    <div
                      data-i18n="Account"
                      onClick={() => {
                        // Remove html classes on submenu click
                        const html = document.documentElement;
                        html.classList.remove(
                          "light-style",
                          "layout-menu-fixed",
                          "layout-menu-100vh",
                          "layout-menu-expanded"
                        );

                        setSubMenu(
                          subMenu === menuItem.screenName ? "" : menuItem.screenName
                        );

                        dispatch(setIdPayrollScreen(menuItem.idPayrollScreen));
                        dispatch(setComponent(menuItem.screenName));

                        navigate(
                          `/dashboard/${menuItem.screenName
                            .replace(/\s+/g, "-")
                            .toLowerCase()}`
                        );
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
