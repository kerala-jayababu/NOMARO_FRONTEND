import React, { Suspense, lazy } from "react";
import { useSelector } from "react-redux";
import ScheduledDeductions from "../../PayrollManagement/ScheduledDeductions";
import ConfigApproval from "../../PayrollManagement/ConfigApproval";

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
  return (
    <div className="flex justify-center">
      <img
        src="/assets/Welcome1.jpg"
        style={{ width: "55%", marginLeft: "25%", marginTop: "3%" }}
        alt="Coming Soon"
      />
    </div>
  );
};