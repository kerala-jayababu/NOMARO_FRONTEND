import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom"; 
import { setComponent } from "../../../redux/reducers/component";
import { getAllPayrollScreensAction } from "../../../redux/actions/roleBasedScreensActions";
const icons = [{
  menu:"Master Data",
  icon:"bx-box"
},{
  menu:"Payroll Management",
  icon:"bx-layout"
},
{
  menu:"Admin Tools",
  icon:"bx-cog"
},{
  menu:"Reports",
  icon:"bx-dock-top"
}]

function Menu() {
  const dispatch = useDispatch();
  const { payrollScreen } = useSelector((state) => state.roleBasedScreen);
  const navigate = useNavigate();  
  const [menu, setMenu] = useState("");
  const [subMenu, setSubMenu] = useState("");

  useEffect(() => {
    dispatch(getAllPayrollScreensAction());
  }, [dispatch]);

  return (
    <aside
      id="layout-menu"
      className="layout-menu menu-vertical menu bg-menu-theme"
    >
      <div className="app-brand demo">
        <a href="/" className="app-brand-link">
          <span className="app-brand-logo demo">
            <img src="/assets/logo.png" />
          </span>
        </a>
        <a
          href="#"
          className="layout-menu-toggle menu-link text-large ms-auto d-block d-xl-none"
        >
          <i className="bx bx-chevron-left bx-sm align-middle"></i>
        </a>
      </div>

      <div className="menu-inner-shadow"></div>

      <ul className="menu-inner py-1">
        {payrollScreen.map((screen) => (<>
          {screen.validPermissions.includes("V") && <li
            className={`menu-item ${
              menu === screen.screenName && "open active"
            } cursor-pointer`}
          >
            <a
              className="menu-link menu-toggle"
              onClick={() => {
                if (menu == screen.screenName) {
                  setMenu("");
                } else {
                  setMenu(screen.screenName);
                }
              }}
            >
              <i className={`menu-icon tf-icons bx ${icons.find(x => x.menu === screen.screenName).icon}`}></i>
              <div data-i18n="Account Settings">{screen.screenName}</div>
            </a>
            <ul className="menu-sub">
              {screen.subMenus.map((menu) => (<>
               {menu.validPermissions.includes("V") && <li
                  className={`menu-item ${
                    subMenu == menu.screenName && "active"
                  }`}
                >
                  <a className="menu-link">
                    <div
                      data-i18n="Account"
                      onClick={() => {
                        if (subMenu == menu.screenName) {
                          console.log("subMenu", menu.screenName);
                          setSubMenu("");
                        } else {
                          setSubMenu(menu.screenName);
                        }
                        dispatch(setComponent(menu.screenName));
                        navigate(`/dashboard/${menu.screenName.replace(/\s+/g, '-').toLowerCase()}`);
                      }}
                    >
                      {menu.screenName}
                    </div>
                  </a>
                </li>}
                </>))}
            </ul>
          </li>}
        </>))}
      </ul>
    </aside>
  );
}

export default Menu;
