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

function App() {
  return (
    <HashRouter> {/* Use HashRouter instead of BrowserRouter */}
      <Routes>
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />}> 
            <Route index element={<ComingSoon />} /> {/* Default route inside Dashboard */}
            <Route path="vacation-mode" element={<VacationMode />} />
            <Route path="budget-codes" element={<BudgetCode />} />
            <Route path="departments" element={<Departments />} />
            <Route path="designations" element={<Designations />} />
            <Route path="salary-heads" element={<SalaryHeads />} />
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
