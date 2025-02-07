import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";

const API_BASE_URL = "http://46.250.230.34:8081/api/v1/Employee";

export const getEmployeeDetailsByID = createAsyncThunk(
  "Employee/GetEmployeeDetailsByID",
  async (id) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token); // Debugging

      if (!token) {
        console.error("Authorization token missing");
      }
      const response = await axios.get(
        `${API_BASE_URL}/GetEmployeeDetailsByID?Id=${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(response.data, "response.data");
      return response.data;
    } catch (error) {
      return error;
    }
  }
);

const slice = createSlice({
  name: "getEmployeeDetails",
  initialState: {
    options: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getEmployeeDetailsByID.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getEmployeeDetailsByID.fulfilled, (state, action) => {
      state.loading = false;
      // Check if data exists and populate options
      if (action.payload && action.payload.data) {
        console.log(action.payload, "action.payload");

        state.options.push(action.payload.data); // Append employee details
      }
    });
    builder.addCase(getEmployeeDetailsByID.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export default slice.reducer;
