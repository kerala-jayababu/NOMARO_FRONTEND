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
import ConfigApproval from "./pages/PayrollManagement/ConfigApproval";
import TaxConfiguration from "./pages/AdminTools/taxConfiguration";
import CurrencyConversion from "./pages/PayrollManagement/CurrencyConversion";
import NotificationConfig from "./pages/AdminTools/notificationConfig";
import BankAndBranches from "./pages/MasterData/bankAndBranches";
import Authenticate from "./pages/PayrollManagement/Authenticate";
import RentFreeQuarters from "./pages/PayrollManagement/RentFreeQuarters";
import SalaryTemplateNew from "./pages/PayrollManagement/SalaryTemplatesNew";
import EmployeeSalaryConfig from "./pages/PayrollManagement/EmployeeSalaryConfig";
import ViewPaySlips from "./pages/PayrollManagement/ViewPaySlips";
import SalarySlipsView from "./pages/EmployeeSelfPortal/SalarySlipsView";
import SalaryReport from "./pages/EmployeeSelfPortal/SalaryReport";
import EmployeeOvertimeTransaction from "./pages/EmployeeSelfPortal/EmployeeOvertimeTransaction";
import LoginWithOtp from "./pages/LoginWithOTP";
import Reports from "./pages/PayrollManagement/Reports/Reports";
import PermissionGate from "./components/PermissionGate";
import { LoaderProvider } from "./components/LoaderContext";
import Holidays from "./pages/AdminTools/holidays"
import LeavePassage from "./pages/PayrollManagement/LeavePassage";
import ShiftManagement from "./pages/AdminTools/ShiftManagement"
import ShiftAssignment from "./pages/AdminTools/ShiftAssignment"
import "../src/core/services/PreventMultipleClickButton"
import ClockInClockOut from "./pages/PayrollManagement/ClockInClockOut";
import EmployeeClockInOut from "./pages/EmployeeSelfPortal/EmployeeClockInOut";
import EmployeeAttendance from "./pages/EmployeeSelfPortal/EmployeeAttendance";
import AttendanceDetails from "./pages/PayrollManagement/AttendanceDetails";
import LeaveDetailReport from "./pages/PayrollManagement/LeaveDetailReport";
import UnAuthorizedAbsence from "./pages/PayrollManagement/UnAuthorizedAbsence";
import LeavePassageAmount from "./pages/PayrollManagement/LeavePassageAmount";

function App() {
  return (
    <LoaderProvider>
      <HashRouter> {/* Use HashRouter instead of BrowserRouter */}
        <Toaster position="top-center"></Toaster>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />}>
              <Route index element={<ComingSoon />} /> {/* Default route inside Dashboard */}
              <Route path="vacation-mode" element={<VacationMode />} />
              <Route path="salary-templates" element={<SalaryTemplateNew />} />
              <Route path="budget-codes" element={<BudgetCode />} />
              <Route path="departments" element={<Departments />} />
              <Route path="designations" element={<Designations />} />
              <Route path="salary-heads" element={<SalaryHeads />} />
              <Route path="employee-profile" element={<EmployeeProfile />} />
              <Route path='employee-salary-config' element={<EmployeeSalaryConfig />} />
              <Route path='screen-permissions' element={<ScreenPermission />} />
              <Route path="salary-adjustments" element={<SalaryAdjustments />} />
              <Route path="maternity-leave-salaries" element={<MaternityLeaveSalaries />} />
              <Route path="scheduled-deductions" element={<ScheduledDeductions />} />
              <Route path="overtime-transactions" element={<OvertimeTransaction />} />
              <Route path="salary-generation" element={<SalaryGeneration />} />
              <Route path="salary-approval" element={<SalaryApproved />} />
              <Route path="config-approvals" element={<ConfigApproval />} />
              <Route path="income-tax-config" element={<TaxConfiguration />} />
              <Route path="currency-conversion" element={<CurrencyConversion />} />
              <Route path="notification-types" element={<NotificationConfig />} />
              <Route path='bank-branches' element={<BankAndBranches />} />
              <Route path='rent-free-quarters' element={<RentFreeQuarters />} />
              <Route path='salary-slips' element={<ViewPaySlips />} />
              <Route path='pay-slips' element={<SalarySlipsView />} />
              <Route path='salary-report' element={<SalaryReport />} />
              <Route path='overtime-details' element={<EmployeeOvertimeTransaction />} />
              <Route path="holiday-config" element={< Holidays/>} />
              <Route path="leave-passages" element={<LeavePassage/>} />
              <Route path="shiftManagement" element={<ShiftManagement/>} />.
              <Route path="shiftAssignment" element={<ShiftAssignment/>} />
              <Route path="clock-inout" element={<ClockInClockOut/>} />
              <Route path="clock-in-out-details" element={<EmployeeClockInOut/>} />
              <Route path="attendance-report" element={<EmployeeAttendance/>} />
              <Route path="attendance" element={<AttendanceDetails/>} />
              <Route path="shift-config" element={<ShiftManagement/>} />
              <Route path="shift-assignment" element={<ShiftAssignment/>} />
              <Route path="leave-report" element={<LeaveDetailReport/>} />
              <Route path="unauthorized-absence" element={<UnAuthorizedAbsence/>} />
              <Route path="leave-passage-amount" element={<LeavePassageAmount/>} />
            </Route>
            <Route element={<PermissionGate />}>
              <Route path="/reports" element={<Reports />} />
            </Route>
          </Route>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<LoginWithOtp />} />
          <Route path="/auth/:route" element={<Authenticate />} />
          <Route path="*" element={<div>Error 404 - Page Not Found</div>} />
        </Routes>
      </HashRouter>
    </LoaderProvider>
  );
}

export default App;
