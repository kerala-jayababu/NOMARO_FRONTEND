import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "./auth";
import componentReducer from "./component";
import budgetReducer from "./budget";
import roleBasedScreenReducer from "./roleBasedScreen";

const rootReducer = combineReducers({
  auth: authReducer,
  component: componentReducer,
  budget: budgetReducer,
  roleBasedScreen:roleBasedScreenReducer
});

export default rootReducer;
