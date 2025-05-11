import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  reports: [],
  reportData: [],
  reportCondition: [],
  reportColumns: [],
  report: null,
  loader: false,
};

const reportsSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {
    setReports: (state, action) => {
      state.reports = action.payload;
    },
    setReportData: (state, action) => {
      state.reportData = action.payload;
    },
    setReportCondition: (state, action) => {
      state.reportCondition = action.payload;
    },
    setReport: (state, action) => {
      state.report = action.payload;
    },
    setReportColumns: (state, action) => {
      state.reportColumns = action.payload;
    },
    showLoader: (state, _) => {
      state.loader = true;
    },
    hideLoader: (state, _) => {
      state.loader = false;
    },
  },
});

export const {
  setReports,
  setReportCondition,
  setReport,
  setLoader,
  showLoader,
  hideLoader,
  setReportData,
  setReportColumns,
} = reportsSlice.actions;
export default reportsSlice.reducer;
