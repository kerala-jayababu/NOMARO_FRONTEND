import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import privateRoutes from "./routes";
import './App.css'
import Login from "./pages/Login";
import PrivateRoute from "./components/privateRoute";
import Dashboard from "./pages/dashboard/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* <Route element={<PrivateRoute />}> */}
            <Route
              path="/dashboard"
              element={<Dashboard/>}
            ></Route>
        {/* </Route> */}
        <Route path="/login" element={<Login />}></Route>
        <Route path="/" element={<Navigate to={"/login"} />}></Route>
        <Route path="*" element={<div>Error 404</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
