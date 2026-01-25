import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";

export const BASE_URL = import.meta.env.VITE_API_URL;
const API_BASE_URL = `${BASE_URL}/api/v1/LeaveManagement`;

export const fetchEmployeeLeaveSetup = createAsyncThunk(
  "employeeLeaveConfig/fetchEmployeeLeaveSetup",
  async ({ searchText = "", idYear = 2026 }, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.get(
        `${API_BASE_URL}/GetEmployeeLeaveSetup?searchText=${searchText}&idYear=${idYear}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch employee leave setup"
      );
    }
  }
);

export const fetchLeaveSetupOfAnEmployee = createAsyncThunk(
  "employeeLeaveConfig/fetchLeaveSetupOfAnEmployee",
  async ({ IdEmployee, idYear = 2026 }, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.get(
        `${API_BASE_URL}/GetLeaveSetupOfAnEmployee?IdEmployee=${IdEmployee}&idYear=${idYear}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch leave setup of employee"
      );
    }
  }
);

export const addUpdateEmployeeLeaveConfig = createAsyncThunk(
  "employeeLeaveConfig/addUpdateEmployeeLeaveConfig",
  async (data, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.post(
        `${API_BASE_URL}/AddUpdateEmployeeLeaveConfig`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to add/update employee leave config"
      );
    }
  }
);

export const addOrUpdateEmployeeLeaveConfigDetails = createAsyncThunk(
  "employeeLeaveConfig/addOrUpdateEmployeeLeaveConfigDetails",
  async (data, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.post(
        `${API_BASE_URL}/AddOrUpdateEmployeeLeaveConfigDetails`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update employee leave config details"
      );
    }
  }
);

const slice = createSlice({
  name: "employeeLeaveConfig",
  initialState: {
    employeeLeaveSetupList: [],
    employeeLeaveSetup: null,
    loading: false,
    error: null,
  },
  reducers: {
    resetError: (state) => {
      state.error = null;
    },
    resetEmployeeLeaveSetup: (state) => {
      state.employeeLeaveSetup = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchEmployeeLeaveSetup.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchEmployeeLeaveSetup.fulfilled, (state, action) => {
      state.employeeLeaveSetupList = action.payload;
      state.loading = false;
      state.error = null;
    });
    builder.addCase(fetchEmployeeLeaveSetup.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
    builder.addCase(fetchLeaveSetupOfAnEmployee.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchLeaveSetupOfAnEmployee.fulfilled, (state, action) => {
      state.employeeLeaveSetup = action.payload;
      state.loading = false;
      state.error = null;
    });
    builder.addCase(fetchLeaveSetupOfAnEmployee.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
    builder.addCase(addUpdateEmployeeLeaveConfig.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addUpdateEmployeeLeaveConfig.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(addUpdateEmployeeLeaveConfig.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
    builder.addCase(addOrUpdateEmployeeLeaveConfigDetails.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addOrUpdateEmployeeLeaveConfigDetails.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(addOrUpdateEmployeeLeaveConfigDetails.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
  },
});

export const { resetError, resetEmployeeLeaveSetup } = slice.actions;
export default slice.reducer;
