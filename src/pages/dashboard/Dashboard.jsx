import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Menu from "./components/Menu";
import Navbar from "./components/Navbar";

function Dashboard() {
  const [viewType, setViewType] = useState(null);
  return (
    <div className="layout-wrapper layout-content-navbar">
      <div className="layout-container">
        {/* <!-- Menu --> */}
        <Menu viewType={viewType}/>
        {/* <!-- / Menu --> */}

        {/* <!-- Layout container --> */}
        <div className="layout-page">
          {/* <!-- Navbar --> */}
          <Navbar view={(e) => setViewType(e)} />
          {/* <!-- / Navbar --> */}

          {/* <!-- Content wrapper --> */}
          <div className="content-wrapper scroll-side-menu">
            {/* <!-- Content --> */}
            <Outlet />
            {/* <!-- / Content --> */}


            <div className="content-backdrop fade"></div>
          </div>
            {/* <!-- Footer --> */}
            <footer className="content-footer footer bg-footer-theme">
              <div className="container-xxl d-flex flex-wrap justify-content-between py-2 flex-md-row flex-column">
                <div className="mb-2 mb-md-0">
                  ©{new Date().getFullYear()} Georgetown International Academy
                </div>
              </div>
            </footer>
            {/* <!-- / Footer --> */}
          {/* <!-- Content wrapper --> */}
        </div>
        {/* <!-- / Layout page --> */}
      </div>
      {/* <!-- Overlay --> */}
      <div className="layout-overlay layout-menu-toggle"></div>
    </div>
  );
}

export default Dashboard;

