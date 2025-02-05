import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  payrollScreen: [],
};

const roleBasedScreenSlice = createSlice({
  name: "roleBasedScreen",
  initialState,
  reducers: {
    setPayrollScreen: (state, action) => {
      state.payrollScreen = action.payload;
    },
  },
});

export const { setPayrollScreen } = roleBasedScreenSlice.actions;
export default roleBasedScreenSlice.reducer;
