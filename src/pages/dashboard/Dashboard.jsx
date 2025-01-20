import React from "react";
import Menu from "./components/Menu";
import Navbar from "./components/Navbar";
import Content from "./components/Content";

function Dashboard() {
  return (
    // <!-- Layout wrapper -->
    <div className="layout-wrapper layout-content-navbar">
      <div className="layout-container">

        {/* <!-- Menu --> */}
        <Menu />
        {/* <!-- / Menu -->

        <!-- Layout container --> */}
        <div className="layout-page">

          {/* <!-- Navbar --> */}
          <Navbar />
          {/* <!-- / Navbar --> */}

          {/* <!-- Content wrapper --> */}
          <div className="content-wrapper">

            {/* <!-- Content --> */}
            <Content />
            {/* <!-- / Content --> */}

            {/* <!-- Footer --> */}
            <footer className="content-footer footer bg-footer-theme">
              <div className="container-xxl d-flex flex-wrap justify-content-between py-2 flex-md-row flex-column">
                <div className="mb-2 mb-md-0">
                  <script>document.write(new Date().getFullYear());</script>©
                  Georgetown International Academy
                </div>
              </div>
            </footer>
            {/* <!-- / Footer --> */}

            <div className="content-backdrop fade"></div>
          </div>
          {/* <!-- Content wrapper --> */}
        </div>
        {/* <!-- / Layout page --> */}
      </div>
      {/* <!-- Overlay --> */}
      <div className="layout-overlay layout-menu-toggle"></div>
    </div>
    // <!-- / Layout wrapper -->
  );
}

export default Dashboard;
