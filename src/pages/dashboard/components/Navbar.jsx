import React from "react";

function Navbar() {
  return (
    <nav
      className="layout-navbar container-xxl navbar navbar-expand-xl navbar-detached align-items-center bg-navbar-theme bg-drak"
      id="layout-navbar"
    >
      <div className="layout-menu-toggle navbar-nav align-items-xl-center me-3 me-xl-0 d-xl-none">
        <a className="nav-item nav-link px-0 me-xl-4">
          <i className="bx bx-menu bx-sm"></i>
        </a>
      </div>

      <div
        className="navbar-nav-right d-flex align-items-center"
        id="navbar-collapse"
      >
        {/* <!-- Search --> */}
        <div className="navbar-nav align-items-center">
          <div className="nav-item d-flex align-items-center">
            <h5 className="m-0 fw-bold">Payroll Management </h5>
          </div>
        </div>
        {/* <!-- /Search --> */}

        <ul className="navbar-nav flex-row align-items-center ms-auto">
          <li className="nav-item dropdown-notifications navbar-dropdown dropdown me-3 me-xl-2">
            <a
              className="nav-link dropdown-toggle hide-arrow"
              data-bs-toggle="dropdown"
              data-bs-auto-close="outside"
              aria-expanded="false"
            >
              <span className="position-relative">
                <i className="bx bx-bell bx-md"></i>
                <span className="badge rounded-pill bg-danger badge-dot badge-notifications border"></span>
              </span>
            </a>
            <ul className="dropdown-menu dropdown-menu-end p-0">
              <li className="dropdown-menu-header border-bottom">
                <div className="dropdown-header d-flex align-items-center py-3">
                  <h6 className="mb-0 me-auto">Notification</h6>
                  <div className="d-flex align-items-center h6 mb-0">
                    <span className="badge bg-label-primary me-2">8 New</span>
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
                  <li className="list-group-item list-group-item-action dropdown-notifications-item">
                    <div className="d-flex">
                      <div className="flex-shrink-0 me-3">
                        <div className="avatar">
                          <span className="avatar-initial rounded-circle bg-label-danger">
                            CF
                          </span>
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="small mb-0">Charles Franklin</h6>
                        <small className="mb-1 d-block text-body">
                          Accepted your connection
                        </small>
                        <small className="text-muted">12hr ago</small>
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
                  </li>
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
                  <a className="btn btn-primary btn-sm py-2" href="#">
                    View all notifications
                  </a>
                </div>
              </li>
            </ul>
          </li>

          {/* <!-- User --> */}
          <li className="nav-item navbar-dropdown dropdown-user dropdown">
            <a
              className="nav-link dropdown-toggle hide-arrow"
              data-bs-toggle="dropdown"
            >
              <div className="avatar avatar-online">
                <img
                  src="assets/img/avatars/1.png"
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
                          src="assets/img/avatars/1.png"
                          alt=""
                          className="w-px-40 h-auto rounded-circle"
                        />
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <span className="fw-semibold d-block">John Doe</span>
                      <small className="text-muted">Admin</small>
                    </div>
                  </div>
                </a>
              </li>
              <li>
                <div className="dropdown-divider"></div>
              </li>
              <li>
                <a className="dropdown-item" href="/">
                  <i className="bx bx-power-off me-2"></i>
                  <span className="align-middle">Log Out</span>
                </a>
              </li>
            </ul>
          </li>
          {/* <!--/ User --> */}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
