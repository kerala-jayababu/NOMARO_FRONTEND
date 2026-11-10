import React from "react";
import secureLocalStorage from "react-secure-storage";
import Content from "./components/Content";
import Celebrations from "../../components/Celebrations";
import Utils from "../../utils/Utils";

/**
 * Default page under /dashboard.
 * Self Portal: birthdays and work anniversaries. Payroll: the existing welcome page.
 */
function Home() {
  const currentAuth = secureLocalStorage.getItem("currentAuth");
  if (currentAuth !== "SELFPORTAL") return <Content />;

  const today = `${new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(new Date())}, ${Utils.formatDisplayDate(new Date())}`;
  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <h4 className="m-0">Dashboard</h4>
        <span className="text-muted">{today}</span>
      </div>
      <Celebrations />
    </div>
  );
}

export default Home;
