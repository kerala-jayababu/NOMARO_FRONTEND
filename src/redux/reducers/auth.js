import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  signInError: null,
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
  },
});

export const { setUser, setSignInError, clearMessage } = userSlice.actions;
export default userSlice.reducer;
