import Dashboard from "./pages/dashboard/Dashboard";
import BudgetCode from "./pages/MasterData/budgetCode";
import Departments from "./pages/MasterData/departments";
import Designations from "./pages/MasterData/designation";
import SalaryHeads from "./pages/MasterData/salaryHeads";
import VacationMode from "./pages/PayrollManagement/VacationMode";
import EmployeeProfile from "./pages/EmployeeProfile/EmployeeProfile";
import SalaryTemplate from "./pages/PayrollManagement/SalaryTemplates";
import SalaryConfiguration from "./pages/PayrollManagement/SalaryConfiguration";
import ScreenPermission from "./pages/AdminTools/screenPermission";
import OvertimeTransaction from "./pages/PayrollManagement/OvertimeTransaction";
import SalaryAdjustments from "./pages/PayrollManagement/SalaryAdjustments";
import ScheduledDeductions from "./pages/PayrollManagement/ScheduledDeductions";
import MaternityLeaveSalaries from "./pages/PayrollManagement/MaternityLeaveSalaries";
import TaxConfiguration from "./pages/AdminTools/taxConfiguration";
import CurrencyConversion from "./pages/PayrollManagement/CurrencyConversion";
import NotificationConfig from "./pages/AdminTools/notificationConfig";
import BankAndBranches from "./pages/MasterData/bankAndBranches";
import RentFreeQuarters from "./pages/PayrollManagement/RentFreeQuarters";
import SalaryTemplateNew from "./pages/PayrollManagement/SalaryTemplatesNew";
import EmployeeSalaryConfig from "./pages/PayrollManagement/EmployeeSalaryConfig";
import ViewPaySlips from "./pages/PayrollManagement/ViewPaySlips";
import SalaryDashboard from "./pages/PayrollManagement/SalaryDashboard";
import SystemParameters from "./pages/AdminTools/systemParameters";
import SalarySlipsView from "./pages/EmployeeSelfPortal/SalarySlipsView";
import SalaryReport from "./pages/EmployeeSelfPortal/SalaryReport";
import EmployeeOvertimeTransaction from "./pages/EmployeeSelfPortal/EmployeeOvertimeTransaction";
import ClockInClockOut from "./pages/PayrollManagement/ClockInClockOut";
import EmployeeClockInOut from "./pages/EmployeeSelfPortal/EmployeeClockInOut";
import EmployeeAttendance from "./pages/EmployeeSelfPortal/EmployeeAttendance";
import AttendanceDetails from "./pages/PayrollManagement/AttendanceDetails";
import Banks from "./pages/MasterData/banks";
import OfficeTypes from "./pages/MasterData/officeTypes";
import Offices from "./pages/MasterData/OfficeManagement/Offices";
import RentFreeAllowances from "./pages/PayrollManagement/RentFreeQuartersNew";
import LiveDashboard from "./pages/dashboard/LiveDashboard";
import ServiceChange from "./pages/MasterData/serviceChange";
import ServiceApproval from "./pages/MasterData/serviceApproval";

export const privateRoutes = [
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/dashboard/live-dashboard",
    element: <LiveDashboard />,
  },
  {
    path: "/dashboard/budget-codes",
    element: <BudgetCode />,
  },
  {
    path: "/dashboard/departments",
    element: <Departments />,
  },
  {
    path: "/dashboard/designations",
    element: <Designations />,
  },
  {
    path: "/dashboard/salary-heads", 
    element: <SalaryHeads />,
  },
  {
    path:"/dashboard/vacation-mode",
    element:<VacationMode/>
  },
  {
    path: "/dashboard/employee-profile",
    element: <EmployeeProfile />,
  }, 
  {
    path: "/dashboard/salary-templates",
    element: <SalaryTemplateNew />,
  },
  {
    path: "/dashboard/employee-salary-config",
    element: <EmployeeSalaryConfig />,
  },
  {
    path: "/dashboard/screen-permissions",
    element: <ScreenPermission />,
  },
  {
    path: "/dashboard/salary-adjustments",
    element: <SalaryAdjustments />,
  },
  {
    path: "/dashboard/maternity-leave-salaries",
    element: <MaternityLeaveSalaries />,
  },
  {
    path: "/dashboard/scheduled-deductions",
    element: <ScheduledDeductions />,
  },
  {
    path: "/dashboard/overtime-transactions",
    element: <OvertimeTransaction />,
  }, 
  {
    path: "/dashboard/income-tax-config",
    element: <TaxConfiguration />,
  }, 
  {
    path: "/dashboard/currency-conversion",
    element: <CurrencyConversion />,
  },
  {
    path: "/dashboard/notification-types",
    element: <NotificationConfig />,
  },
  {
    path: "/dashboard/bank-branches",
    element: <BankAndBranches />,
  },
  {
    path: "/dashboard/rent-free-quarters",
    element: <RentFreeAllowances />,
  },
  {
    path: "/dashboard/salary-slips",
    element: <ViewPaySlips />,
  },
  {
    path: "/dashboard/salary-dashboard",
    element: <SalaryDashboard />,
  },
  {
    path: "/dashboard/system-parameters",
    element: <SystemParameters />,
  },
  {
    path: "/dashboard/pay-slips",
    element: <SalarySlipsView />,
  },
  {
    path: "/dashboard/salary-report",
    element: <SalaryReport />,
  },
  {
    path: "/dashboard/overtime-details",
    element: <EmployeeOvertimeTransaction />,
  },
  {
    path: "/dashboard/clock-inout",
    element: <ClockInClockOut />,
  },
  {
    path: "/dashboard/clock-in-out-details",
    element: <EmployeeClockInOut />,
  },
  {
    path: "/dashboard/attendance-report",
    element: <EmployeeAttendance/>,
  },
  {
    path: "/dashboard/attendance",
    element: <AttendanceDetails />,
  },
  {
    path: "/dashboard/leave-passage-amount",
    element: <AttendanceDetails />,
  },
  {
    path: "/dashboard/banks",
    element: <Banks />,
  },
  {
    path: "/dashboard/office-types",
    element: <OfficeTypes />,
  },
  {
    path: "/dashboard/office-management",
    element: <Offices />,
  },
  {
    path: "/dashboard/office-mangement",
    element: <Offices />,
  },
  {
    path: "/dashboard/service-management",
    element: <ServiceChange />,
  },
  {
    path: "/dashboard/service-approval",
    element: <ServiceApproval />,
  },
];

export default privateRoutes