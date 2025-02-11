import Dashboard from "./pages/dashboard/Dashboard";
import BudgetCode from "./pages/MasterData/budgetCode";
import Departments from "./pages/MasterData/departments";
import Designations from "./pages/MasterData/designation";
import SalaryHeads from "./pages/MasterData/salaryHeads";
import VacationMode from "./pages/PayrollManagement/VacationMode";
import EmployeeProfile from "./pages/EmployeeProfile/EmployeeProfile";
import SalaryAdjustments from "./pages/PayrollManagement/SalaryAdjustments";

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
  }
];

export default privateRoutes