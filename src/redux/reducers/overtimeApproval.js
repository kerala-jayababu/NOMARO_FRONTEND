import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";

export const BASE_URL = import.meta.env.VITE_API_URL;
const API_BASE_URL = `${BASE_URL}/api/v1/PayRollManagement`;
const API_EMPLOYEE_URL = `${BASE_URL}/api/v1/Employee`;
const API_COMMON_URL = `${BASE_URL}/api/v1/Common`;

// Helper to get auth token
const getAuthToken = () => {
  const storedUser = secureLocalStorage.getItem("user");
  return storedUser ? JSON.parse(storedUser)?.token : null;
};

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});

// Fetch overtime transactions with full details (approval cycles)
export const fetchOvertimeTransactionsFullDetails = createAsyncThunk(
  "overtimeApproval/fetchOvertimeTransactionsFullDetails",
  async ({ dateFrom = "", dateTo = "" } = {}, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const params = new URLSearchParams();
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const response = await axios.get(
        `${API_BASE_URL}/GetOvertimeTransactionsFullDetails?${params.toString()}`,
        authHeaders(token)
      );

      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch overtime transactions" }
      );
    }
  }
);

// Fetch overtime configs for a specific employee
export const fetchEmployeeOvertimeConfigs = createAsyncThunk(
  "overtimeApproval/fetchEmployeeOvertimeConfigs",
  async (employeeId, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const response = await axios.get(
        `${API_EMPLOYEE_URL}/GetEmployeeOvertimeConfigsByID?employeeId=${employeeId}`,
        authHeaders(token)
      );

      return { employeeId, data: response.data };
    } catch (error) {
      console.error("API Error:", error);
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch employee overtime configs" }
      );
    }
  }
);

// Handle approval workflow (approve/reject overtime transactions)
export const handleApprovalWorkflow = createAsyncThunk(
  "overtimeApproval/handleApprovalWorkflow",
  async (payload, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const response = await axios.post(
        `${API_COMMON_URL}/HandleApprovalWorkflow`,
        payload,
        authHeaders(token)
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to process approval" }
      );
    }
  }
);

// Fetch all salary months
export const fetchAllSalaryMonths = createAsyncThunk(
  "overtimeApproval/fetchAllSalaryMonths",
  async (_, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const response = await axios.get(
        `${API_COMMON_URL}/GetAllSalaryMonths`,
        authHeaders(token)
      );

      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch salary months" }
      );
    }
  }
);

const slice = createSlice({
  name: "overtimeApproval",
  initialState: {
    overtimeTransactions: [],
    // Keyed by employeeId — { [employeeId]: [ ...configs ] }
    employeeOvertimeConfigs: {},
    salaryMonths: [],
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

    // Fetch employee overtime configs
    builder.addCase(fetchEmployeeOvertimeConfigs.fulfilled, (state, action) => {
      const { employeeId, data } = action.payload;
      state.employeeOvertimeConfigs[employeeId] = data?.data || [];
    });

    // Fetch all salary months
    builder.addCase(fetchAllSalaryMonths.fulfilled, (state, action) => {
      state.salaryMonths = action.payload || [];
    });
  },
});

export const { resetError } = slice.actions;
export default slice.reducer;
