import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";
export const BASE_URL = import.meta.env.VITE_API_URL;

const API_BASE_URL = `${BASE_URL}/api/v1/Employee`;

export const getAllEmployeeDetails = createAsyncThunk(
  "Employee/getAllEmployeeDetails",
  async (_, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }
      const response = await axios.get(`${API_BASE_URL}/GetEmployeeList`,  {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch options");
    }
  }
);

const slice = createSlice({
  name: "getAllEmployeeDetails",
  initialState: {
    options: [],
    loading: false,
    error: null,
    loaded: false,  // New flag to indicate if data is fetched
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getAllEmployeeDetails.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    // builder.addCase(getAllEmployeeDetails.fulfilled, (state, action) => {
    //   state.loading = false;
    //   state.loaded = true;  // Set to true once data is fetched
    //   if (action.payload && action.payload.data) {
    //     // Populate options with employee names
    //     state.options = action.payload.data.map((employee) => ({
    //       value: employee.idEmployee,
    //       label: employee.fullName,
    //     }));
    //   }
    // });
    builder.addCase(getAllEmployeeDetails.fulfilled, (state, action) => {
      state.loading = false;
      state.loaded = true;
      state.options = action.payload.data; // Store raw data without mapping
    });
    builder.addCase(getAllEmployeeDetails.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export default slice.reducer;

