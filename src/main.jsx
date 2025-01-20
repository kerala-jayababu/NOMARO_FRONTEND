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

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
