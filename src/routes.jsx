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

export const privateRoutes = [
  {
    path: "/dashboard",
    element: <Dashboard />,
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
    element: <SalaryTemplate />,
  },
  {
    path: "/dashboard/employee-salary-config",
    element: <SalaryConfiguration />,
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
    path: "/dashboard/tax-configuration",
    element: <TaxConfiguration />,
  }, 
  {
    path: "/dashboard/currency-conversion",
    element: <CurrencyConversion />,
  },
];

export default privateRoutes