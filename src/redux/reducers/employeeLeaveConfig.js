import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";

export const BASE_URL = import.meta.env.VITE_API_URL;
const API_BASE_URL = `${BASE_URL}/api/v1/LeaveManagement`;

export const fetchEmployeeLeaveSetup = createAsyncThunk(
  "employeeLeaveConfig/fetchEmployeeLeaveSetup",
  async ({ searchText = "", idYear = 2026, approvalStatus = "" }, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }

      const params = new URLSearchParams();
      params.append("searchText", searchText);
      params.append("IdYear", idYear);
      if (approvalStatus) params.append("ApprovalStatus", approvalStatus);

      const response = await axios.get(
        `${API_BASE_URL}/GetEmployeeLeaveSetup?${params.toString()}`,
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

export const fetchEmployeesNotConfiguredLeave = createAsyncThunk(
  "employeeLeaveConfig/fetchEmployeesNotConfiguredLeave",
  async ({ idWorkYear }, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.get(
        `${API_BASE_URL}/GetEmployeesNotConfiguredLeave?idWorkYear=${idWorkYear}`,
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
        error.response?.data || "Failed to fetch employees not configured for leave"
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

export const fetchEmployeeLeaveConfigApprovers = createAsyncThunk(
  "employeeLeaveConfig/fetchEmployeeLeaveConfigApprovers",
  async (_, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.get(
        `${API_BASE_URL}/GetEmployeeLeaveConfigApprovers`,
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
        error.response?.data || "Failed to fetch employee leave config approvers"
      );
    }
  }
);

export const addUpdateEmployeeLeaveConfigWithDetails = createAsyncThunk(
  "employeeLeaveConfig/addUpdateEmployeeLeaveConfigWithDetails",
  async (data, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.post(
        `${API_BASE_URL}/AddUpdateEmployeeLeaveConfigWithDetails`,
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
        error.response?.data || "Failed to add/update employee leave config with details"
      );
    }
  }
);

export const submitEmployeeLeaveConfigForApproval = createAsyncThunk(
  "employeeLeaveConfig/submitEmployeeLeaveConfigForApproval",
  async (idEmployeeLeaveTemplate, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const response = await axios.post(
        `${API_BASE_URL}/SubmitEmployeeLeaveConfigForApproval?idEmployeeLeaveTemplate=${idEmployeeLeaveTemplate}`,
        {},
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
        error.response?.data || { message: "Failed to submit employee leave config for approval" }
      );
    }
  }
);

export const approveEmployeeLeaveConfig = createAsyncThunk(
  "employeeLeaveConfig/approveEmployeeLeaveConfig",
  async ({ IdEmployeeLeaveConfig, approvalStatus }, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const response = await axios.post(
        `${API_BASE_URL}/ApproveEmployeeLeaveConfig?IdEmployeeLeaveConfig=${IdEmployeeLeaveConfig}&approvalStatus=${approvalStatus}`,
        {},
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
        error.response?.data || { message: "Failed to approve/reject employee leave config" }
      );
    }
  }
);

const slice = createSlice({
  name: "employeeLeaveConfig",
  initialState: {
    employeeLeaveSetupList: [],
    employeeLeaveSetup: null,
    employeesNotConfigured: [],
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
    builder.addCase(addUpdateEmployeeLeaveConfigWithDetails.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addUpdateEmployeeLeaveConfigWithDetails.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(addUpdateEmployeeLeaveConfigWithDetails.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
    builder.addCase(fetchEmployeesNotConfiguredLeave.fulfilled, (state, action) => {
      state.employeesNotConfigured = action.payload?.data || [];
    });
    builder.addCase(approveEmployeeLeaveConfig.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(approveEmployeeLeaveConfig.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(approveEmployeeLeaveConfig.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
  },
});

export const { resetError, resetEmployeeLeaveSetup } = slice.actions;
export default slice.reducer;
