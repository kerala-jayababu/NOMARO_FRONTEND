import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "./auth";
import componentReducer from "./component";
import budgetReducer from "./budget";
import roleBasedScreenReducer from "./roleBasedScreen";
import departmentReducer from "./department";
import vacationMode from "./vacationMode";
import getAllOptions from "./getAllOptions";
import getEmployeeDetails from "./getEmployeeDetails";
import getAllEmployeeDetails from "./getAllEmployeeDetails";
import budgetCode from "./budgetCode";
import designation from "./designation";
import salaryHead from "./salaryHead";
import employeeProfiles from "./employeeProfiles";
import salaryConfig from "./salaryConfig";
import salaryTemplate from "./salaryTemplate";
import screenPermission from "./screenPermission";
import salaryGeneration from "./salaryGeneration"
import configApproval from "./ConfigApprovals"
import reports from "./reports";

const rootReducer = combineReducers({
  auth: authReducer,
  component: componentReducer,
  budget: budgetReducer,
  roleBasedScreen: roleBasedScreenReducer,
  department: departmentReducer,
  vacationMode: vacationMode,
  getAllOptions: getAllOptions,
  getEmployeeDetails: getEmployeeDetails,
  getAllEmployeeDetails: getAllEmployeeDetails,
  budgetCode: budgetCode,
  designation: designation,
  salaryHead: salaryHead,
  employeeProfiles: employeeProfiles,
  salaryConfig: salaryConfig,
  salaryTemplate: salaryTemplate,
  screenPermission: screenPermission,
  salaryGeneration: salaryGeneration,
  configApproval: configApproval,
  reports: reports,
});

export default rootReducer;
