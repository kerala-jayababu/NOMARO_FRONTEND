import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import secureLocalStorage from "react-secure-storage";
import CommonService from "../../../core/services/CommonService";

function Navbar() {
  const navigate = useNavigate();
  const [profilePic, setProfilePic] = useState("/assets/img/avatars/1.png");
  const [logo, setLogo] = useState("");
  const [productName, setProductName] = useState("Payroll Management");
  const [companyName, setCompanyName] = useState("");
  const userData = JSON.parse(secureLocalStorage.getItem("user"));

  useEffect(() => {
    if (userData?.attachmentBlob) {
      setProfilePic(`data:image/jpeg;base64,${userData?.attachmentBlob}`);
    }

    // Fetch logo, ProductName, and CompanyName from system parameters
    CommonService.getSystemParameters()
      .then((res) => {
        if (res.data && res.data.data) {
          const productLogo = res.data.data.find(
            (item) => item.parameterName === "ProductLogo",
          );
          if (productLogo && productLogo.parameterBinaryValue) {
            setLogo(
              `data:image/png;base64,${productLogo.parameterBinaryValue}`,
            );
          }

          const productNameParam = res.data.data.find(
            (item) => item.parameterName === "ProductName",
          );
          if (productNameParam && productNameParam.parameterValue) {
            setProductName(productNameParam.parameterValue);
          }

          const companyNameParam = res.data.data.find(
            (item) => item.parameterName === "CompanyName",
          );
          if (companyNameParam && companyNameParam.parameterValue) {
            setCompanyName(companyNameParam.parameterValue);
          }
        }
      })
      .catch((err) => {
        // Keep logo blank if API fails
        console.error("Failed to fetch system parameters:", err);
      });
  }, []);

  const logout = () => {
    secureLocalStorage.clear();
    navigate("/login");
  };

  return (
    <nav
      className="layout-navbar navbar navbar-expand-xl navbar-detached  bg-navbar-theme bg-dark "
      id="layout-navbar"
    >
      {logo && (
        <div className="me-5">
          <img
            src={logo}
            width={200}
            height={62}
            className="float-start-custom"
            alt="Logo"
          />
        </div>
      )}

      <div
        className="navbar-nav-right d-flex align-items-center"
        id="navbar-collapse"
      >
        <div className="navbar-nav align-items-center">
          <div className="nav-item d-flex align-items-center">
            <h5 className="m-0 fw-bold">{companyName}</h5>
          </div>
        </div>
        <ul className="navbar-nav flex-row align-items-center ms-auto">
          {/* Company Name */}
          {/* {companyName && (
            <li className="nav-item me-3 me-xl-2">
              <span className="nav-link text-white">{companyName}</span>
            </li>
          )} */}
          <li className="nav-item navbar-dropdown dropdown-user dropdown">
            <a
              className="nav-link dropdown-toggle hide-arrow"
              data-bs-toggle="dropdown"
            >
              <div className="avatar avatar-online">
                <img src={profilePic} alt="" className="rounded-circle" />
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
                          className="rounded-circle"
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
