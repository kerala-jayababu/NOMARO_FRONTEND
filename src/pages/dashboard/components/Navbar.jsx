import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import secureLocalStorage from "react-secure-storage";
import CommonService from "../../../core/services/CommonService";
import Utils from "../../../utils/Utils";
import ConfirmationModal from "../../../components/ConfirmationModal";

function Navbar({ view }) {
  const [profilePic, setProfilePic] = useState("/assets/img/avatars/1.png");
  const userData = JSON.parse(secureLocalStorage.getItem("user"));
  const [notification, setNotification] = useState([]);
  const [clicked, setClicked] = useState(false);
  const navigate = useNavigate();
  const currentAuth = secureLocalStorage.getItem("currentAuth");
  const authorizedModules = secureLocalStorage.getItem("authorizedModules");
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const fetchNotifications = () => {
      CommonService.GetEmployeeNotification().then((res) => {
        setNotification(res.data);
      });
    };
  
    fetchNotifications();
  
    const interval = setInterval(() => {
      fetchNotifications(); 
    }, 60000);
  
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    if (userData?.attachmentBlob) {
      setProfilePic(`data:image/jpeg;base64,${userData?.attachmentBlob}`);
    }
    // Optional: re-fetch manually when "clicked" changes
    CommonService.GetEmployeeNotification().then((res) => {
      setNotification(res.data);
    });
  }, [clicked]);


  useEffect(() => {
    // Toggle menu click behavior
    const toggleBtn = document.getElementById("menu-toggle-btn");

    const handleClick = () => {
      const html = document.documentElement;
      html.classList.add(
        "light-style",
        "layout-menu-fixed",
        "layout-menu-100vh",
        "layout-menu-expanded"
      );
    };

    if (toggleBtn) {
      toggleBtn.addEventListener("click", handleClick);
    }

    return () => {
      if (toggleBtn) {
        toggleBtn.removeEventListener("click", handleClick);
      }
    };
  }, []);

  const logout = () => {
    secureLocalStorage.clear();
    navigate("/login");
  };

  const handleNotificationClick = async (item) => {
    await CommonService.UpdateEmployeeNotification(item.idNotification)
    setClicked(!clicked)
    navigate(`/dashboard/${item.notificationLink}`)
  }

  const switchAuth = () => {
    if (currentAuth == 'PAYROLL') {
      secureLocalStorage.setItem("currentAuth", 'SELFPORTAL');
      view('SELFPORTAL');
    } else {
      secureLocalStorage.setItem("currentAuth", 'PAYROLL');
      view('PAYROLL');
    }
  }

  const confirmFinalize = (val) => {
    setShowConfirmation(false);
    if (val) {
      switchAuth();
    }
  };

  return (
    <nav
      className="layout-navbar container-xxl navbar navbar-expand-xl navbar-detached align-items-center bg-navbar-theme bg-drak"
      id="layout-navbar"
    >
      <div className="layout-menu-toggle navbar-nav align-items-xl-center me-3 me-xl-0 d-xl-none">
        <a id="menu-toggle-btn" className="nav-item nav-link px-0 me-xl-4">
          <i className="bx bx-menu bx-sm"></i>
        </a>
      </div>

      <div className="navbar-nav-right d-flex align-items-center" id="navbar-collapse">
        <div className="navbar-nav align-items-center">
          <div className="nav-item d-flex align-items-center">
            <h5 className="m-0 fw-bold">{currentAuth == 'PAYROLL' ? 'Payroll Management' : 'Employee Self Portal'}</h5>
          </div>
        </div>

        <ul className="navbar-nav flex-row align-items-center ms-auto">
          {/* Notification Bell */}
          <li className="nav-item dropdown-notifications navbar-dropdown dropdown me-3 me-xl-2">
            <a
              className="nav-link dropdown-toggle hide-arrow"
              data-bs-toggle="dropdown"
              data-bs-auto-close="outside"
              aria-expanded="false"
            >
              <span className="position-relative">
                <i className="bx bx-bell bx-md"></i>
                {notification && notification?.length > 0 && (
                  <span
                    className="position-absolute translate start-100 0 p-1 bg-danger rounded-circle"
                    style={{
                      width: '0.5px',
                      height: '0.5px',
                      top: "4px",
                    }}
                  >
                    <span className="visually-hidden">New notifications</span>
                  </span>
                )}
              </span>
            </a>
            <ul className="dropdown-menu dropdown-menu-end p-0">
              <li className="dropdown-menu-header border-bottom">
                <div className="dropdown-header d-flex align-items-center py-3">
                  <h6 className="mb-0 me-auto">Notifications</h6>
                  <div className="d-flex align-items-center h6 mb-0">
                    <span className="badge bg-label-primary me-2">{notification?.length} New</span>
                    <a
                      className="dropdown-notifications-all p-2"
                      data-bs-toggle="tooltip"
                      data-bs-placement="top"
                      aria-label="Mark all as read"
                      data-bs-original-title="Mark all as read"
                    >
                      <i className="bx bx-envelope-open text-heading"></i>
                    </a>
                  </div>
                </div>
              </li>
              <li className="dropdown-notifications-list scrollable-container ps">
                <ul className="list-group list-group-flush">
                  {notification?.length > 0 && notification?.map((item, index) => (
                    <li className="list-group-item list-group-item-action dropdown-notifications-item" onClick={() => handleNotificationClick(item)} key={index}>
                      <div className="d-flex">
                        <div className="flex-shrink-0 me-3">
                          <div className="avatar">
                            <span className="avatar-initial rounded-circle bg-label-danger">
                            {item.logoText}
                            </span>
                          </div>
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="small mb-0"> {item.appNotificationText}</h6>
                          <small className="mb-1 d-block text-body">
                            {/* <div dangerouslySetInnerHTML={{ __html: item.appNotificationText }} /> */}
                            {/* {item.emailContent} */}
                          </small>
                          <small className="text-muted">{Utils.timeAgo(item.createdAt)}</small>
                        </div>
                        <div className="flex-shrink-0 dropdown-notifications-actions">
                          <a className="dropdown-notifications-read">
                            <span className="badge badge-dot"></span>
                          </a>
                          <a className="dropdown-notifications-archive">
                            <span className="bx bx-x"></span>
                          </a>
                        </div>
                      </div>
                    </li>))}
                  {/* <li className="list-group-item list-group-item-action dropdown-notifications-item marked-as-read">
                    <div className="d-flex">
                      <div className="flex-shrink-0 me-3">
                        <div className="avatar">
                          <span className="avatar-initial rounded-circle bg-label-danger">
                            CF
                          </span>
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="small mb-0">New Message ✉️</h6>
                        <small className="mb-1 d-block text-body">
                          You have new message from Natalie
                        </small>
                        <small className="text-muted">1h ago</small>
                      </div>
                      <div className="flex-shrink-0 dropdown-notifications-actions">
                        <a className="dropdown-notifications-read">
                          <span className="badge badge-dot"></span>
                        </a>
                        <a className="dropdown-notifications-archive">
                          <span className="bx bx-x"></span>
                        </a>
                      </div>
                    </div>
                  </li>
                  <li className="list-group-item list-group-item-action dropdown-notifications-item">
                    <div className="d-flex">
                      <div className="flex-shrink-0 me-3">
                        <div className="avatar">
                          <span className="avatar-initial rounded-circle bg-label-success">
                            <i className="bx bx-cart"></i>
                          </span>
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="small mb-0">
                          Whoo! You have new order 🛒{" "}
                        </h6>
                        <small className="mb-1 d-block text-body">
                          ACME Inc. made new order $1,154
                        </small>
                        <small className="text-muted">1 day ago</small>
                      </div>
                      <div className="flex-shrink-0 dropdown-notifications-actions">
                        <a className="dropdown-notifications-read">
                          <span className="badge badge-dot"></span>
                        </a>
                        <a className="dropdown-notifications-archive">
                          <span className="bx bx-x"></span>
                        </a>
                      </div>
                    </div>
                  </li>

                  <li className="list-group-item list-group-item-action dropdown-notifications-item marked-as-read">
                    <div className="d-flex">
                      <div className="flex-shrink-0 me-3">
                        <div className="avatar">
                          <span className="avatar-initial rounded-circle bg-label-success">
                            <i className="bx bx-pie-chart-alt"></i>
                          </span>
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="small mb-0">
                          Monthly report is generated
                        </h6>
                        <small className="mb-1 d-block text-body">
                          July monthly financial report is generated{" "}
                        </small>
                        <small className="text-muted">3 days ago</small>
                      </div>
                      <div className="flex-shrink-0 dropdown-notifications-actions">
                        <a className="dropdown-notifications-read">
                          <span className="badge badge-dot"></span>
                        </a>
                        <a className="dropdown-notifications-archive">
                          <span className="bx bx-x"></span>
                        </a>
                      </div>
                    </div>
                  </li>
                  <li className="list-group-item list-group-item-action dropdown-notifications-item marked-as-read">
                    <div className="d-flex">
                      <div className="flex-shrink-0 me-3">
                        <div className="avatar">
                          <span className="avatar-initial rounded-circle bg-label-warning">
                            <i className="bx bx-error"></i>
                          </span>
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="small mb-0">CPU is running high</h6>
                        <small className="mb-1 d-block text-body">
                          CPU Utilization Percent is currently at 88.63%,
                        </small>
                        <small className="text-muted">5 days ago</small>
                      </div>
                      <div className="flex-shrink-0 dropdown-notifications-actions">
                        <a className="dropdown-notifications-read">
                          <span className="badge badge-dot"></span>
                        </a>
                        <a className="dropdown-notifications-archive">
                          <span className="bx bx-x"></span>
                        </a>
                      </div>
                    </div>
                  </li> */}
                </ul>

                <div className="ps__rail-x" style={{ left: 0, bottom: 0 }}>
                  <div
                    className="ps__thumb-x"
                    tabIndex="0"
                    style={{ left: 0, width: 0 }}
                  ></div>
                </div>
                <div className="ps__rail-y" style={{ top: 0, right: 0 }}>
                  <div
                    className="ps__thumb-y"
                    tabIndex="0"
                    style={{ top: 0, height: 0 }}
                  ></div>
                </div>
              </li>
              <li className="border-top">
                <div className="d-grid p-4">
                  {/* <a className="btn btn-primary btn-sm py-2" href="#">
                    View all notifications
                  </a> */}
                </div>
              </li>
            </ul>
          </li>

          {/* User Dropdown */}
          <li className="nav-item navbar-dropdown dropdown-user dropdown">
            <a className="nav-link dropdown-toggle hide-arrow" data-bs-toggle="dropdown">
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
                      <span className="fw-semibold d-block">{userData?.name}</span>
                      <small className="text-muted">{userData?.role}</small>
                    </div>
                  </div>
                </a>
              </li>
              <li><div className="dropdown-divider"></div></li>
              {
                authorizedModules.length > 1 &&
                <li>
                  <a className="dropdown-item cursor" onClick={() => setShowConfirmation(true)}>
                    <i className="bx bx-power-off me-2"></i>
                    <span className="align-middle">Switch to {currentAuth == 'PAYROLL' ? 'Self Portal' : 'Payroll'}</span>
                  </a>
                </li>
              }
              <li>
                <a className="dropdown-item cursor" onClick={logout}>
                  <i className="bx bx-power-off me-2"></i>
                  <span className="align-middle">Log Out</span>
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </div>
      {
        showConfirmation &&
        <ConfirmationModal
          modalShow={true}
          messageText={currentAuth == 'PAYROLL' ? 'Are you sure to switch to Self Portal?' : 'Are you sure to switch to Payroll Portal?'}
          callbackModal={confirmFinalize}
          confirmBtn={"Confirm"}
          CancelBtn={"Cancel"}
        />
      }
    </nav>
  );
}

export default Navbar;
