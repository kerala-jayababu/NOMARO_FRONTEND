import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";

// API Base URL
const API_BASE_URL = "http://46.250.230.34:8081/api/v1/SalaryGeneration";

// Get Salary Generation
export const getSalaryGenerations = createAsyncThunk(
  "salaryGeneration/getSalaryGenerations",
  async (params) => {
    const { idSalaryMonth, status } = params;
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token); // Debugging

      if (!token) {
        console.error("Authorization token missing");
      }

      const response = await axios.get(
        `${API_BASE_URL}/GetSalaryList?idSalaryMonth=${idSalaryMonth}&dropdownFilter=${status}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      return error;
    }
  }
);

const salaryGenerationSlice = createSlice({
  name: "salaryGeneration",
  initialState: {
    salaryGenerationList: [],
    options: [],
    loading: false,
    error: null,
    currentSalaryGeneration: null,
  },
  reducers: {
    clearcurrentSalaryGeneration: (state) => {
      state.currentSalaryGeneration = null;
    },
    setOptions: (state, action) => {
      state.options = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getSalaryGenerations.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(getSalaryGenerations.fulfilled, (state, action) => {
      state.salaryGenerationList = action.payload.data;
      state.status = "succeeded";
      state.loading = false;
    });
    builder.addCase(getSalaryGenerations.rejected, (state, action) => {
      state.status = "failed";
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const { clearError } = salaryGenerationSlice.actions;
export default salaryGenerationSlice.reducer;
