import Dashboard from "./pages/dashboard/Dashboard";
import BudgetCode from "./pages/MasterData/budgetCode";
import Departments from "./pages/MasterData/departments";
import Designations from "./pages/MasterData/designation";
import SalaryHeads from "./pages/MasterData/salaryHeads";
import VacationMode from "./pages/PayrollManagement/VacationMode";
import EmployeeProfile from "./pages/EmployeeProfile/EmployeeProfile";
import SalaryAdjustments from "./pages/PayrollManagement/SalaryAdjustments";
import MaternityLeaveSalaries from "./pages/PayrollManagement/MaternityLeaveSalaries";
import ScheduledDeductions from "./pages/PayrollManagement/ScheduledDeductions";
import OvertimeTransaction from "./pages/PayrollManagement/OvertimeTransaction";

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
  }
];

export default privateRoutes