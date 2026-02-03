import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";

export const BASE_URL = import.meta.env.VITE_API_URL;
const API_BASE_URL = `${BASE_URL}/api/v1/PayRollManagement`;

// Fetch overtime transactions with full details (approval cycles)
export const fetchOvertimeTransactionsFullDetails = createAsyncThunk(
  "overtimeApproval/fetchOvertimeTransactionsFullDetails",
  async (_, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const response = await axios.get(
        `${API_BASE_URL}/GetOvertimeTransactionsFullDetails`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Overtime Transactions Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch overtime transactions" }
      );
    }
  }
);

const slice = createSlice({
  name: "overtimeApproval",
  initialState: {
    overtimeTransactions: [],
    loading: false,
    error: null,
  },
  reducers: {
    resetError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch overtime transactions
    builder.addCase(fetchOvertimeTransactionsFullDetails.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchOvertimeTransactionsFullDetails.fulfilled, (state, action) => {
      state.overtimeTransactions = action.payload;
      state.loading = false;
      state.error = null;
    });
    builder.addCase(fetchOvertimeTransactionsFullDetails.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || action.error.message;
    });
  },
});

export const { resetError } = slice.actions;
export default slice.reducer;
