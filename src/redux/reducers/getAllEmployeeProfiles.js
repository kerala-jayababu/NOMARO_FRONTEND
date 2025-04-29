import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";
export const BASE_URL = import.meta.env.VITE_API_URL;

const API_BASE_URL = `${BASE_URL}/api/v1/Employee`;

export const getEmployeeProfileByID = createAsyncThunk(
  "employeeBankAccount/GetEmployeeProfileByID",
  async (id) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token); // Debugging

      if (!token) {
        console.error("Authorization token missing");
      }
      const response = await axios.get(
        `${API_BASE_URL}/GetEmployeeProfileByID?Id=${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(id, "response.id");
      console.log(response.data, "response.data");
      return response.data;
    } catch (error) {
      return error;
    }
  }
);

const slice = createSlice({
  name: "employeeAllProfiles",
  initialState: {
    employeeData: {},
    loading: false,
    error: null,
    loaded: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getEmployeeProfileByID.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getEmployeeProfileByID.fulfilled, (state, action) => {
      state.loading = false;
      state.loaded = true;
      state.employeeData = action.payload;
    });
    builder.addCase(getEmployeeProfileByID.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error;
    });
  },
});

export default slice.reducer;
