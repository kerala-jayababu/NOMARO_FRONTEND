import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { Provider } from "react-redux";
import store from "./redux/store.js";
import '../public/assets/vendor/css/pages/page-auth.css'
import '../public/assets/vendor/css/pages/page-icons.css'
import '../public/assets/vendor/css/pages/page-misc.css'
import '../public/assets/vendor/css/pages/page-account-settings.css'
import '../public/assets/vendor/css/core.css'
import '../public/assets/vendor/css/theme-default.css'
import '../public/assets/vendor/fonts/boxicons.css'
import '../public/assets/css/demo.css'
import "../public/assets/vendor/js/helpers.js"
import "../public/assets/js/config.js"
import "../public/assets/vendor/libs/jquery/jquery.js"
import "../public/assets/vendor/libs/popper/popper.js"
import "../public/assets/vendor/js/bootstrap.js"
import "../public/assets/vendor/libs/perfect-scrollbar/perfect-scrollbar.js"
import "../public/assets/vendor/js/menu.js"
import "../public/assets/js/main.js"
import "../src/core/services/preventMultipleClicks.js";
import { ToastContainer } from "react-toastify";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <App />
      <ToastContainer />
    </Provider>
  </StrictMode>
);
