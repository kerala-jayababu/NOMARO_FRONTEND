import { useState } from "react";
import logo from "../../../../public/assets/logo.png";
import secureLocalStorage from "react-secure-storage";

function Navbar() {
  const [profilePic] = useState("/assets/img/avatars/1.png");
  const userData = JSON.parse(secureLocalStorage.getItem("user"));

  const logout = () => {
    secureLocalStorage.clear();
    navigate("/login");
  };

  return (
    <nav
      className="layout-navbar navbar navbar-expand-xl navbar-detached  bg-navbar-theme bg-dark "
      id="layout-navbar"
    >
      <div className="me-5">
        <img src={logo} width={200} height={62} className="float-start-custom" />
      </div>

      <div
        className="navbar-nav-right d-flex align-items-center"
        id="navbar-collapse"
      >
        <div className="navbar-nav align-items-center">
          <div className="nav-item d-flex align-items-center">
            <h5 className="m-0 fw-bold">Payroll Management</h5>
          </div>
        </div>
        <ul className="navbar-nav flex-row align-items-center ms-auto">
          <li className="nav-item navbar-dropdown dropdown-user dropdown">
            <a
              className="nav-link dropdown-toggle hide-arrow"
              data-bs-toggle="dropdown"
            >
              <div className="avatar avatar-online">
                <img
                  src={profilePic}
                  alt=""
                  className="w-px-40 h-auto rounded-circle"
                />
              </div>
            </a>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <a className="dropdown-item" href="#">
                  <div className="d-flex">
                    <div className="flex-shrink-0 me-3">
                      <div className="avatar avatar-online">
                        <img
                          src={profilePic}
                          alt=""
                          className="w-px-40 h-auto rounded-circle"
                        />
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <span className="fw-semibold d-block">
                        {userData?.name}
                      </span>
                      <small className="text-muted">{userData?.role}</small>
                    </div>
                  </div>
                </a>
              </li>
              <li>
                <div className="dropdown-divider"></div>
              </li>
              <li>
                <a className="dropdown-item" onClick={logout}>
                  <i className="bx bx-power-off me-2"></i>
                  <span className="align-middle">Log Out</span>
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
