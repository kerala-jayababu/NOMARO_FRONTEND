import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import privateRoutes from "./routes";
import './App.css'
import Login from "./pages/Login";
import PrivateRoute from "./components/privateRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* <Route element={<PrivateRoute />}> */}
          {privateRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={route.element}
            ></Route>
          ))}
        {/* </Route> */}
        <Route path="/login" element={<Login />}></Route>
        <Route path="/" element={<Navigate to={"/login"} />}></Route>
        <Route path="*" element={<div>Error 404</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
