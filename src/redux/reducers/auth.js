import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  signInError: null,
  idPayrollScreen: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setSignInError: (state, action) => {
      state.signInError = action.payload;
    },
    clearMessage: (state) => {
      state.signInError = null;
    },
    setIdPayrollScreen: (state, action) => {
      state.idPayrollScreen = action.payload;
    },
  },
});

export const { setUser, setSignInError, clearMessage, setIdPayrollScreen } =
  userSlice.actions;
export default userSlice.reducer;
