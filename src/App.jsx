import { HashRouter, Navigate, Route, Routes } from "react-router-dom"; // Import HashRouter
import { useSelector } from "react-redux";
import secureLocalStorage from "react-secure-storage";
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
import SalaryDashboard from "./pages/PayrollManagement/SalaryDashboard";
import SalarySlipsView from "./pages/EmployeeSelfPortal/SalarySlipsView";
import SalaryReport from "./pages/EmployeeSelfPortal/SalaryReport";
import EmployeeOvertimeTransaction from "./pages/EmployeeSelfPortal/EmployeeOvertimeTransaction";
import LoginWithOtp from "./pages/LoginWithOTP";
import Reports from "./pages/PayrollManagement/Reports/Reports";
import PermissionGate from "./components/PermissionGate";
import { LoaderProvider } from "./components/LoaderContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Holidays from "./pages/AdminTools/holidays"
import LeavePassage from "./pages/PayrollManagement/LeavePassage";
import LeavePassagePayroll from "./pages/PayrollManagement/LeavePassagePayroll";
import ShiftManagement from "./pages/AdminTools/ShiftManagement"
import ShiftAssignment from "./pages/AdminTools/ShiftAssignment"
import Assets from "./pages/AdminTools/assets"
import SystemParameters from "./pages/AdminTools/systemParameters";
import Home from "./pages/dashboard/Home";
import BirthdaysAnniversaries from "./pages/PayrollManagement/BirthdaysAnniversaries";
import HolidayCalendar from "./pages/EmployeeSelfPortal/HolidayCalendar";
import "../src/core/services/PreventMultipleClickButton"
import ClockInClockOut from "./pages/PayrollManagement/ClockInClockOut";
import EmployeeClockInOut from "./pages/EmployeeSelfPortal/EmployeeClockInOut";
import EmployeeAttendance from "./pages/EmployeeSelfPortal/EmployeeAttendance";
import AttendanceDetails from "./pages/PayrollManagement/AttendanceDetails";
import LeaveDetailReport from "./pages/PayrollManagement/LeaveDetailReport";
import UnAuthorizedAbsence from "./pages/PayrollManagement/UnAuthorizedAbsence";
import LeavePassageAmount from "./pages/PayrollManagement/LeavePassageAmount";
import Banks from "./pages/MasterData/banks";
import OfficeTypes from "./pages/MasterData/officeTypes";
import Grades from "./pages/MasterData/grades";
import MyProfile from "./pages/EmployeeSelfPortal/MyProfile";
import MyChangeRequests from "./pages/EmployeeSelfPortal/MyChangeRequests";
import ProfileChangeRequests from "./pages/PayrollManagement/ProfileChangeRequests";
import ProfileChangeSettings from "./pages/PayrollManagement/ProfileChangeSettings";
import ViewEmployeeDocuments from "./pages/MasterData/viewEmployeeDocuments";
import EmployeeAgreements from "./pages/MasterData/employeeAgreements";
import ResignationRequests from "./pages/MasterData/resignationRequests";
import DocumentRegister from "./pages/DocumentManagement/documentRegister";
import DocumentUpload from "./pages/DocumentManagement/documentUpload";
import DocumentHistory from "./pages/DocumentManagement/documentHistory";
import ExpiryMonitoring from "./pages/DocumentManagement/expiryMonitoring";
import GeneralDocumentTypes from "./pages/DocumentManagement/documentTypes";
import GeneralDocumentSubtypes from "./pages/DocumentManagement/documentSubtypes";
import DocumentReports from "./pages/DocumentManagement/documentReports";
import DocumentAckDashboard from "./pages/DocumentManagement/documentAckDashboard";
import MyDocuments from "./pages/EmployeeSelfPortal/MyDocuments";
import AgreementReview from "./pages/Public/AgreementReview";
import Offices from "./pages/MasterData/OfficeManagement/Offices";
import RentFreeAllowances from "./pages/PayrollManagement/RentFreeQuartersNew";
import LiveDashboard from "./pages/dashboard/LiveDashboard";
import LeaveDashboard from "./pages/dashboard/LeaveDashboard";
import EmployeeManagement from "./pages/MasterData/EmployeeManagement/EmployeeManagement";
import LeaveTypes from "./pages/MasterData/leaveTypes";
import LeaveTemplates from "./pages/MasterData/leaveTemplates";
import LeaveTemplateApproval from "./pages/MasterData/leaveTemplateApproval";
import EmployeeLeaveConfig from "./pages/MasterData/employeeLeaveConfig";
import LeaveApproval from "./pages/MasterData/leaveApproval";
import OvertimeApproval from "./pages/MasterData/overtimeApproval";
import EmpLeaveConfigApproval from "./pages/MasterData/empLeaveConfigApproval";
import OffboardingSetup from "./pages/MasterData/offboardingSetup";
import OffboardingCases from "./pages/MasterData/offboardingCases";
import OffboardingClearances from "./pages/MasterData/offboardingClearances";
import ServiceChange from "./pages/MasterData/serviceChange";
import ServiceApproval from "./pages/MasterData/serviceApproval";
import OrgHierarchy from "./pages/MasterData/OrgHierarchy";
import MissingEntryApproval from "./pages/MasterData/missingEntryApproval";
import ForgotCardApproval from "./pages/MasterData/forgotCardApproval";
import AnnualLeaveDashboard from "./pages/dashboard/AnnualLeaveDashboard";
import UnapprovalSalaryConfig from "./pages/PayrollManagement/UnapprovalSalaryConfig";
import SickLeaveSalDeduction from "./pages/PayrollManagement/SickLeaveSalDeduction";
import OfficeShiftManagement from "./pages/AdminTools/OfficeShiftManagement";

function LeavePassageRoute() {
  const { payrollScreen } = useSelector((state) => state.roleBasedScreen);
  const currentAuth = secureLocalStorage.getItem("currentAuth");
  return currentAuth === 'PAYROLL' ? <LeavePassagePayroll /> : <LeavePassage />;
}

function App() {
  return (
    <ThemeProvider>
      <LoaderProvider>
        <HashRouter> {/* Use HashRouter instead of BrowserRouter */}
        <Toaster position="top-center"></Toaster>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />}>
              <Route index element={<Home />} /> {/* Default page: Self Portal dashboard / Payroll welcome page */}
              <Route path="vacation-mode" element={<VacationMode />} />
              <Route path="salary-templates" element={<SalaryTemplateNew />} />
              <Route path="budget-codes" element={<BudgetCode />} />
              <Route path="departments" element={<Departments />} />
              <Route path="designations" element={<Designations />} />
              <Route path="salary-heads" element={<SalaryHeads />} />
              <Route path="employee-profile" element={<EmployeeProfile />} />
              <Route path="employee-management" element={<EmployeeManagement />} />
              <Route path="service-management" element={<ServiceChange />} />
              <Route path="service-approval" element={<ServiceApproval />} />
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
              <Route path="live-dashboard" element={<LiveDashboard />} />
              <Route path="dashboard" element={<LeaveDashboard />} />
              <Route path="notification-types" element={<NotificationConfig />} />
              <Route path='bank-branches' element={<BankAndBranches />} />
              <Route path='rent-free-quarters' element={<RentFreeAllowances />} />
              <Route path='salary-slips' element={<ViewPaySlips />} />
              <Route path='salary-dashboard' element={<SalaryDashboard />} />
              <Route path='pay-slips' element={<SalarySlipsView />} />
              <Route path='salary-report' element={<SalaryReport />} />
              <Route path='overtime-details' element={<EmployeeOvertimeTransaction />} />
              <Route path="holiday-config" element={< Holidays/>} />
              <Route path="leave-passages" element={<LeavePassageRoute/>} />
              <Route path="payroll-leave-passages" element={<LeavePassagePayroll/>} />
              <Route path="shiftManagement" element={<ShiftManagement/>} />.
              <Route path="shiftAssignment" element={<ShiftAssignment/>} />
              <Route path="clock-inout" element={<ClockInClockOut/>} />
              <Route path="clock-in-out-details" element={<EmployeeClockInOut/>} />
              <Route path="attendance-report" element={<EmployeeAttendance/>} />
              <Route path="attendance" element={<AttendanceDetails/>} />
              <Route path="shift-config" element={<ShiftManagement/>} />
              <Route path="shift-assignment" element={<ShiftAssignment/>} />
              <Route path="shift-manager-setup" element={<OfficeShiftManagement />} />
              <Route path="leave-report" element={<LeaveDetailReport/>} />
              <Route path="unauthorized-absence" element={<UnAuthorizedAbsence/>} />
              <Route path="leave-passage-amount" element={<LeavePassageAmount/>} />
              <Route path="banks" element={<Banks/>} />
              <Route path="office-types" element={<OfficeTypes />} />
              <Route path="employee-grades" element={<Grades />} />
              <Route path="my-profile" element={<MyProfile />} />
              <Route path="my-change-requests" element={<MyChangeRequests />} />
              <Route path="profile-change-requests" element={<ProfileChangeRequests />} />
              <Route path="profile-change-settings" element={<ProfileChangeSettings />} />
              <Route path="view-documents" element={<ViewEmployeeDocuments />} />
              <Route path="employee-agreements" element={<EmployeeAgreements />} />
              <Route path="office-management" element={<Offices />} />
              {/* "office-mangement" matches the current (misspelt) PayrollScreens.ScreenName; remove once the menu name is corrected */}
              <Route path="office-mangement" element={<Offices />} />
              <Route path="leave-types" element={<LeaveTypes/>} />
              <Route path="leave-templates" element={<LeaveTemplates/>} />
              <Route path="leave-template-approval" element={<LeaveTemplateApproval/>} />
              <Route path="employee-leave-config" element={<EmployeeLeaveConfig/>} />
              <Route path="emp-leave-config-approval" element={<EmpLeaveConfigApproval/>} />
              <Route path="leave-approval" element={<LeaveApproval/>} />
              <Route path="overtime-approval" element={<OvertimeApproval/>} />
              <Route path="offboarding-setup" element={<OffboardingSetup/>} />
              <Route path="offboarding-cases" element={<OffboardingCases/>} />
              <Route path="resignation-requests" element={<ResignationRequests />} />
              <Route path="document-register" element={<DocumentRegister />} />
              <Route path="document-upload" element={<DocumentUpload />} />
              <Route path="document-history/:id" element={<DocumentHistory />} />
              <Route path="expiry-monitoring" element={<ExpiryMonitoring />} />
              <Route path="document-types" element={<GeneralDocumentTypes />} />
              <Route path="document-subtypes" element={<GeneralDocumentSubtypes />} />
              <Route path="document-reports" element={<DocumentReports />} />
              <Route path="document-ack-dashboard" element={<DocumentAckDashboard />} />
              <Route path="documents" element={<MyDocuments />} />
              <Route path="offboarding-clearance" element={<OffboardingClearances/>} />
              <Route path="org-hierarchy" element={<OrgHierarchy/>} />
              <Route path="assets" element={<Assets/>} />
              <Route path="system-parameters" element={<SystemParameters />} />
              <Route path="celebrations" element={<BirthdaysAnniversaries />} />
              <Route path="holiday-calendar" element={<HolidayCalendar />} />
              <Route path="missing-entry-approval" element={<MissingEntryApproval/>} />
              <Route path="forgot-card-approval" element={<ForgotCardApproval/>} />
              <Route path="annual-leave-dashboard" element={<AnnualLeaveDashboard/>} />
              <Route path="unapproval-salary-config" element={<UnapprovalSalaryConfig/>} />
              <Route path="sick-leave-sal-deduction" element={<SickLeaveSalDeduction/>} />
            </Route>
            <Route element={<PermissionGate />}>
              <Route path="/reports" element={<Reports />} />
            </Route>
          </Route>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<LoginWithOtp />} />
          {/* public: opened from the agreement email, no login */}
          <Route path="/agreement/:token" element={<AgreementReview />} />
          <Route path="/auth/:route" element={<Authenticate />} />
          <Route path="*" element={<div>Error 404 - Page Not Found</div>} />
        </Routes>
      </HashRouter>
      </LoaderProvider>
    </ThemeProvider>
  );
}

export default App;
