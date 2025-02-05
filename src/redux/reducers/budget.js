import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  budgetList: null,
};

const budgetSlice = createSlice({
  name: "budget",
  initialState,
  reducers: {
    setBudgetList: (state, action) => {
      state.budgetList = action.payload;
    },
  },
});

export const { setBudgetList } = budgetSlice.actions;
export default budgetSlice.reducer;
