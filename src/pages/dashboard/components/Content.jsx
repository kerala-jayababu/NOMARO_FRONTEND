import React, { Suspense, lazy } from "react";
import { useSelector } from "react-redux";

const CurrencyConverter = lazy(() => import("../../PayrollManagement/CurrencyConversion"));
const SalaryTemplate = lazy(() => import("../../PayrollManagement/SalaryTemplate"));
const Approved = lazy(() => import("../../PayrollManagement/Approved"));
const LossOfPayLeaves = lazy(() => import("../../PayrollManagement/LossOfPayLeaves"));
const OvertimeTransaction = lazy(() => import("../../PayrollManagement/OvertimeTransaction"));
const SalaryApproved = lazy(() => import("../../PayrollManagement/SalaryApproved"));
const SalaryConfiguration = lazy(() => import("../../PayrollManagement/SalaryConfiguration"));
const SalaryGeneration = lazy(() => import("../../PayrollManagement/SalaryGeneration"));
const SalaryRevision = lazy(() => import("../../PayrollManagement/SalaryRevision"));
const Default = lazy(() => import("../../PayrollManagement/CurrencyConversion"));

function Content() {
  const { componentName } = useSelector((state) => state.component);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      {(() => {
        switch (componentName) {
          case 'Currency Conversions':
            return <CurrencyConverter />;
          case 'Salary Templates':
            return <SalaryTemplate />;
          case 'Approved':
            return <Approved />;
          case 'LossOfPayLeaves':
            return <LossOfPayLeaves />;
          case 'Overtime Transactions':
            return <OvertimeTransaction />;
          case 'Salary Approval':
            return <SalaryApproved />;
          case 'Emp Salary Config':
            return <SalaryConfiguration />;
          case 'Salary Generation':
            return <SalaryGeneration />;
          case 'SalaryRevision':
            return <SalaryRevision />;
          default:
            return <ComingSoon/>;
        }
      })()}
    </Suspense>
  );
}

export default Content;

const ComingSoon = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 m-4">
      <div className="text-center bg-white rounded-lg shadow-lg max-w-lg w-full p-10">
        <h1 className="text-4xl font-bold text-gray-800 ">
          Coming Soon!
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          We're working to bring this feature to you. Stay tuned for updates!
        </p>
        <div className="flex justify-center">
          <div className="w-24 h-24 border-t-4 border-blue-500 border-dotted rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Check back later for updates on this exciting new feature!
        </p>
      </div>
    </div>
  );
};

