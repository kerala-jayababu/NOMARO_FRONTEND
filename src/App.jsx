import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import privateRoutes from "./routes";
import "./App.css";
import Login from "./pages/Login";
import PrivateRoute from "./components/privateRoute";
import Dashboard from "./pages/dashboard/Dashboard";
import BudgetCode from "./pages/MasterData/budgetCode";
import Departments from "./pages/MasterData/departments";
import Designations from "./pages/MasterData/designation";
import SalaryHeads from "./pages/MasterData/salaryHeads";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />}>
          <Route path="/dashboard/budget-codes" element={<BudgetCode />} />
          <Route path="/dashboard/departments" element={<Departments />} />
          <Route path="/dashboard/designations" element={<Designations />} />
          <Route path="/dashboard/salary-heads" element={<SalaryHeads />} />
          </Route>
          
          </Route>
          
        <Route path="/login" element={<Login />}></Route>
        <Route path="/" element={<Navigate to={"/login"} />}></Route>
        <Route path="*" element={<div>Error 404</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
