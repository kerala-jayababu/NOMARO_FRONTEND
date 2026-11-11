import BudgetCode from "./pages/MasterData/budgetCode";
import Departments from "./pages/MasterData/departments";
import Designations from "./pages/MasterData/designation";
import SalaryHeads from "./pages/MasterData/salaryHeads";
import EmployeeProfile from "./pages/MasterData/employeeProfile";
import ScreenPermission from "./pages/AdminTools/screenPermission";
import TaxConfiguration from "./pages/AdminTools/taxConfiguration";
import NotificationConfig from "./pages/AdminTools/notificationConfig";
import SystemParameters from "./pages/AdminTools/systemParameters";
import Holidays from "./pages/AdminTools/holidays";
import Assets from "./pages/AdminTools/assets";
import ShiftManagement from "./pages/AdminTools/ShiftManagement";
import ShiftAssignment from "./pages/AdminTools/ShiftAssignment";
import OfficeShiftManagement from "./pages/AdminTools/OfficeShiftManagement";
import BankAndBranches from "./pages/MasterData/bankAndBranches";
import Banks from "./pages/MasterData/banks";
import OfficeTypes from "./pages/MasterData/officeTypes";
import Grades from "./pages/MasterData/grades";
import ViewEmployeeDocuments from "./pages/MasterData/viewEmployeeDocuments";
import EmployeeAgreements from "./pages/MasterData/employeeAgreements";
import ResignationRequests from "./pages/MasterData/resignationRequests";
import Offices from "./pages/MasterData/OfficeManagement/Offices";
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
import OrgHierarchy from "./pages/MasterData/OrgHierarchy";
import MissingEntryApproval from "./pages/MasterData/missingEntryApproval";
import SalaryAdjustments from "./pages/PayrollManagement/SalaryAdjustments";
import OvertimeTransaction from "./pages/PayrollManagement/OvertimeTransaction";
import ScheduledDeductions from "./pages/PayrollManagement/ScheduledDeductions";
import SalaryGeneration from "./pages/PayrollManagement/SalaryGeneration";
import SalaryApproved from "./pages/PayrollManagement/SalaryApproved";
import ViewPaySlips from "./pages/PayrollManagement/ViewPaySlips";
import SalaryDashboard from "./pages/PayrollManagement/SalaryDashboard";
import ConfigApproval from "./pages/PayrollManagement/ConfigApproval";
import SalaryTemplateNew from "./pages/PayrollManagement/SalaryTemplatesNew";
import EmployeeSalaryConfig from "./pages/PayrollManagement/EmployeeSalaryConfig";
import ProfileChangeRequests from "./pages/PayrollManagement/ProfileChangeRequests";
import ProfileChangeSettings from "./pages/PayrollManagement/ProfileChangeSettings";
import ClockInClockOut from "./pages/PayrollManagement/ClockInClockOut";
import AttendanceDetails from "./pages/PayrollManagement/AttendanceDetails";
import LeaveDetailReport from "./pages/PayrollManagement/LeaveDetailReport";
import UnAuthorizedAbsence from "./pages/PayrollManagement/UnAuthorizedAbsence";
import ServiceChange from "./pages/MasterData/serviceChange";
import ServiceApproval from "./pages/MasterData/serviceApproval";
import DocumentRegister from "./pages/DocumentManagement/documentRegister";
import ExpiryMonitoring from "./pages/DocumentManagement/expiryMonitoring";
import GeneralDocumentTypes from "./pages/DocumentManagement/documentTypes";
import GeneralDocumentSubtypes from "./pages/DocumentManagement/documentSubtypes";
import DocumentReports from "./pages/DocumentManagement/documentReports";
import DocumentAckDashboard from "./pages/DocumentManagement/documentAckDashboard";
import LiveDashboard from "./pages/dashboard/LiveDashboard";
import LeaveDashboard from "./pages/dashboard/LeaveDashboard";
import AnnualLeaveDashboard from "./pages/dashboard/AnnualLeaveDashboard";
import BirthdaysAnniversaries from "./pages/PayrollManagement/BirthdaysAnniversaries";
import UnapprovalSalaryConfig from "./pages/PayrollManagement/UnapprovalSalaryConfig";
import SickLeaveSalDeduction from "./pages/PayrollManagement/SickLeaveSalDeduction";
import SalaryTemplateApproval from "./pages/PayrollManagement/SalaryTemplateApproval";

export const payrollScreenRoutes = [
  { path: "SALADJ", element: <SalaryAdjustments /> },
  { path: "OVRTIME", element: <OvertimeTransaction /> },
  { path: "OTAPPROVAL", element: <OvertimeApproval /> },
  { path: "SCHDED", element: <ScheduledDeductions /> },
  { path: "SALGEN", element: <SalaryGeneration /> },
  { path: "SALAPP", element: <SalaryApproved /> },
  { path: "SALSLIP", element: <ViewPaySlips /> },
  { path: "SKLVSALDEDUCT", element: <SickLeaveSalDeduction /> },
  { path: "SALARYDASHBOARD", element: <SalaryDashboard /> },
  { path: "BUDCOD", element: <BudgetCode /> },
  { path: "BANKS", element: <Banks /> },
  { path: "BNKBNC", element: <BankAndBranches /> },
  { path: "DESNS", element: <Designations /> },
  { path: "DEPTS", element: <Departments /> },
  { path: "GRADES", element: <Grades /> },
  { path: "NOTTYPE", element: <NotificationConfig /> },
  { path: "SYSTPAR", element: <SystemParameters /> },
  { path: "SCRENPER", element: <ScreenPermission /> },
  { path: "PCLOCKDATA", element: <ClockInClockOut /> },
  { path: "PATTENDANC", element: <AttendanceDetails /> },
  { path: "PLVREPORT", element: <LeaveDetailReport /> },
  { path: "UNAUTHABS", element: <UnAuthorizedAbsence /> },
  { path: "LVDASHBOARD", element: <LiveDashboard /> },
  { path: "MISSINGENTRYAPPROVAL", element: <MissingEntryApproval /> },
  { path: "SHIFTCONFIG", element: <ShiftManagement /> },
  { path: "SHIFTASSIGN", element: <ShiftAssignment /> },
  { path: "LVTYPES", element: <LeaveTypes /> },
  { path: "LVTMPLT", element: <LeaveTemplates /> },
  { path: "LVTMPAPPRL", element: <LeaveTemplateApproval /> },
  { path: "EMPLVTMPLT", element: <EmployeeLeaveConfig /> },
  { path: "EMPLVCONFIGAPPRL", element: <EmpLeaveConfigApproval /> },
  { path: "LVAPPRL", element: <LeaveApproval /> },
  { path: "LEAVEDASHB", element: <LeaveDashboard /> },
  { path: "ANNLVDASHBOARD", element: <AnnualLeaveDashboard /> },
  { path: "EMPPROF", element: <EmployeeProfile /> },
  { path: "EMPDOCVIEW", element: <ViewEmployeeDocuments /> },
  { path: "EMPAGREE", element: <EmployeeAgreements /> },
  { path: "PROFCHGREQ", element: <ProfileChangeRequests /> },
  { path: "PROFCHGSET", element: <ProfileChangeSettings /> },
  { path: "CELEBRATIONS", element: <BirthdaysAnniversaries /> },
  { path: "SERVICEMGMNT", element: <ServiceChange /> },
  { path: "SERVICEMGMNTAPP", element: <ServiceApproval /> },
  { path: "RESIGNREQUEST", element: <ResignationRequests /> },
  { path: "OFFBOARDCASES", element: <OffboardingCases /> },
  { path: "OFFBOARDCLEAR", element: <OffboardingClearances /> },
  { path: "SALHDS", element: <SalaryHeads /> },
  { path: "INCOMETAXCO", element: <TaxConfiguration /> },
  { path: "SALTEMP", element: <SalaryTemplateNew /> },
  { path: "EMPSALCON", element: <EmployeeSalaryConfig /> },
  { path: "SALCONFIGUNAPPROVAL", element: <UnapprovalSalaryConfig /> },
  { path: "SALTEMAPP", element: <SalaryTemplateApproval /> },
  { path: "CONFAPP", element: <ConfigApproval /> },
  { path: "OFFICETYPES", element: <OfficeTypes /> },
  { path: "OFFICEMGMT", element: <Offices /> },
  { path: "SHIFTMANAGERSETUP", element: <OfficeShiftManagement /> },
  { path: "ORGHIERARCHY", element: <OrgHierarchy /> },
  { path: "OFFBOARDSETUP", element: <OffboardingSetup /> },
  { path: "HOLIDAYCONFIG", element: <Holidays /> },
  { path: "ASSETS", element: <Assets /> },
  { path: "GENDOCREG", element: <DocumentRegister /> },
  { path: "GENDOCEXPIRY", element: <ExpiryMonitoring /> },
  { path: "GENDOCREPORT", element: <DocumentReports /> },
  { path: "GENDOCACK", element: <DocumentAckDashboard /> },
  { path: "GENDOCTYPE", element: <GeneralDocumentTypes /> },
  { path: "GENDOCSUBTYPE", element: <GeneralDocumentSubtypes /> },
];
