import { HashRouter, Navigate, Route, Routes } from "react-router-dom"; // Import HashRouter
import "./App.css";
import Login from "./pages/Login";
import PrivateRoute from "./components/privateRoute";
import Dashboard from "./pages/dashboard/Dashboard";
import BudgetCode from "./pages/MasterData/budgetCode";
import Departments from "./pages/MasterData/departments";
import Designations from "./pages/MasterData/designation";
import SalaryHeads from "./pages/MasterData/salaryHeads";
import VacationMode from "./pages/PayrollManagement/VacationMode";
import ComingSoon from "./pages/dashboard/components/Content";
import EmployeeProfile from "./pages/MasterData/employeeProfile";
import SalaryTemplate from "./pages/PayrollManagement/SalaryTemplates";
import SalaryConfiguration from "./pages/PayrollManagement/SalaryConfiguration";
import ScreenPermission from "./pages/AdminTools/screenPermission";
import SalaryAdjustments from "./pages/PayrollManagement/SalaryAdjustments";
import MaternityLeaveSalaries from "./pages/PayrollManagement/MaternityLeaveSalaries";
import ScheduledDeductions from "./pages/PayrollManagement/ScheduledDeductions";
import OvertimeTransaction from "./pages/PayrollManagement/OvertimeTransaction";
import SalaryGeneration from "./pages/PayrollManagement/SalaryGeneration";
import { Toaster } from "react-hot-toast";
import SalaryApproved from "./pages/PayrollManagement/SalaryApproved";

function App() {
  return (
    <HashRouter> {/* Use HashRouter instead of BrowserRouter */}
    <Toaster position="top-center"></Toaster>
      <Routes>
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<ComingSoon />} /> {/* Default route inside Dashboard */}
            <Route path="vacation-mode" element={<VacationMode />} />
            <Route path="salary-templates" element={<SalaryTemplate />} />
            <Route path="budget-codes" element={<BudgetCode />} />
            <Route path="departments" element={<Departments />} />
            <Route path="designations" element={<Designations />} />
            <Route path="salary-heads" element={<SalaryHeads />} />
            <Route path="employee-profile" element={<EmployeeProfile />} />
            <Route path='employee-salary-config' element={<SalaryConfiguration />} />
            <Route path='screen-permissions' element={<ScreenPermission />} />
            <Route path="salary-adjustments" element={<SalaryAdjustments />} />
            <Route path="maternity-leave-salaries" element={<MaternityLeaveSalaries />} />
            <Route path="scheduled-deductions" element={<ScheduledDeductions />} />
            <Route path="overtime-transactions" element={<OvertimeTransaction />} />
            <Route path="salary-generation" element={<SalaryGeneration />} />
            <Route path="salary-generation-approval" element={<SalaryApproved />} />
          </Route>
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<div>Error 404 - Page Not Found</div>} />
      </Routes>
    </HashRouter>
  );
}

export default App;
