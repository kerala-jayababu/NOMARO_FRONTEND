import React, { Suspense, lazy, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import ScheduledDeductions from "../../PayrollManagement/ScheduledDeductions";
import ConfigApproval from "../../PayrollManagement/ConfigApproval";
import CommonService from "../../../core/services/CommonService";

const SalaryAdjustments = lazy(() =>
  import("../../PayrollManagement/SalaryAdjustments")
);
const RentFreeQuarters = lazy(() =>
  import("../../PayrollManagement/RentFreeQuarters")
);
const MaternityLeaveSalaries = lazy(() =>
  import("../../PayrollManagement/MaternityLeaveSalaries")
);
const CurrencyConverter = lazy(() =>
  import("../../PayrollManagement/CurrencyConversion")
);
const SalaryTemplate = lazy(() =>
  import("../../PayrollManagement/SalaryTemplates")
);
const SalaryTemplateApproval = lazy(() =>
  import("../../PayrollManagement/SalaryTemplateApproval")
);
const LossOfPayLeaves = lazy(() =>
  import("../../PayrollManagement/LossOfPayLeaves")
);
const MyTeams = lazy(() => import("../../PayrollManagement/MyTeams"));
const SalaryApproved = lazy(() =>
  import("../../PayrollManagement/SalaryApproved")
);
const SalaryConfiguration = lazy(() =>
  import("../../PayrollManagement/SalaryConfiguration")
);
const SalaryGeneration = lazy(() =>
  import("../../PayrollManagement/SalaryGeneration")
);
const SalaryRevision = lazy(() =>
  import("../../PayrollManagement/SalaryRevision")
);
const VacationModes = lazy(() => import("../../PayrollManagement/VacationMode"));


const BudgetCode = lazy(() => import("../../MasterData/budgetCode"));

const Departments = lazy(() => import("../../MasterData/departments"));
const Designations = lazy(() => import("../../MasterData/designation"));
// const SalaryHeads = lazy(() => import("../../MasterData/salaryHeads"));
const SalaryHeads = lazy(() => import("../../MasterData/salaryHeads"));

function Content() {
  const { componentName } = useSelector((state) => state.component);
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {(() => {
        switch (componentName) {
          case "Currency Conversion":
            return <CurrencyConverter />;
          case "Salary Templates":
            return <SalaryTemplate />;
          case "Salary Template Approvals":
            return <SalaryTemplateApproval />;
          case "LossOfPayLeaves":
            return <LossOfPayLeaves />;
          case "My Teams":
            return <MyTeams />;
          case "Salary Generation Approval":
            return <SalaryApproved />;
          case "Employee Salary Config":
            return <SalaryConfiguration />;
          case "Salary Generation":
            return <SalaryGeneration />;
          case "Salary Revisions":
            return <SalaryRevision />;
          case "Maternity Leave Salaries":
            return <MaternityLeaveSalaries />;
          case "Rent-Free Quarters":
            return <RentFreeQuarters />;
          case "Salary Adjustments":
            return <SalaryAdjustments />;
          case "Scheduled Deductions":
            return <ScheduledDeductions />;
          case "Vacation Mode":
            return <VacationModes />;  
          case "Budget Codes":
            return <BudgetCode />;
          case "Departments":
            return <Departments />;
          case "Designations":
            return <Designations />;
          case "Salary Heads":
            return <SalaryHeads />;  
          case "Config Approvals":
            return <ConfigApproval/>
          default:
            return <ComingSoon />;
        }
      })()}
    </Suspense>
  );
}

export default Content;

export const ComingSoon = () => {
  const [welcomeImage, setWelcomeImage] = useState("");

  useEffect(() => {
    // Fetch welcome image from CompanyName parameter binary value
    CommonService.getSystemParameters().then(res => {
      if (res.data && res.data.data) {
        debugger
        const companyNameParam = res.data.data.find(item => item.parameterName === "CompanyName");
        if (companyNameParam && companyNameParam.parameterBinaryValue) {
          setWelcomeImage(`data:image/png;base64,${companyNameParam.parameterBinaryValue}`);
        }
      }
    }).catch(err => {
      // Keep image blank if API fails
      console.error("Failed to fetch welcome image:", err);
    });
  }, []);

  return (
    <div className="flex justify-center">
      {welcomeImage && (
        <img
          src={welcomeImage}
          style={{ width: "55%", marginLeft: "25%", marginTop: "3%" }}
          alt="Welcome"
        />
      )}
    </div>
  );
};