import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  componentName: 'Default',
};

const componentSlice = createSlice({
  name: "component",
  initialState,
  reducers: {
    setComponent: (state, action) => {
      state.componentName = action.payload;
    },
  },
});

export const { setComponent } = componentSlice.actions;
export default componentSlice.reducer;
