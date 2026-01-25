import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";

export const BASE_URL = import.meta.env.VITE_API_URL;
const API_BASE_URL = `${BASE_URL}/api/v1/LeaveManagement`;

// Fetch leave applications for approval
export const fetchLeaveApplicationsForApproval = createAsyncThunk(
  "leaveApproval/fetchLeaveApplicationsForApproval",
  async ({ approvalStatus = "", searchText = "", fromDate = "", toDate = "" }, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const params = new URLSearchParams();
      if (approvalStatus) params.append("approvalStatus", approvalStatus);
      if (searchText) params.append("SearchText", searchText);
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);

      const response = await axios.get(
        `${API_BASE_URL}/GetLeaveApplicationsForApproval?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Leave Applications Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch leave applications" }
      );
    }
  }
);

// Approve leave application (single)
export const approveLeaveApplication = createAsyncThunk(
  "leaveApproval/approveLeaveApplication",
  async ({ idLeaveApplication, remarks = "" }, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const params = new URLSearchParams();
      params.append("approvalStatus", "APPROVED");
      if (remarks) params.append("remarks", remarks);

      const response = await axios.post(
        `${API_BASE_URL}/SubmitLeaveApplicationApproval?${params.toString()}`,
        [idLeaveApplication],
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      return rejectWithValue(
        error.response?.data || { message: "Failed to approve leave application" }
      );
    }
  }
);

// Reject leave application (remarks mandatory)
export const rejectLeaveApplication = createAsyncThunk(
  "leaveApproval/rejectLeaveApplication",
  async ({ idLeaveApplication, remarks }, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      if (!remarks || !remarks.trim()) {
        return rejectWithValue({ message: "Remarks are mandatory for rejection" });
      }

      const params = new URLSearchParams();
      params.append("approvalStatus", "REJECTED");
      params.append("remarks", remarks);

      const response = await axios.post(
        `${API_BASE_URL}/SubmitLeaveApplicationApproval?${params.toString()}`,
        [idLeaveApplication],
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      return rejectWithValue(
        error.response?.data || { message: "Failed to reject leave application" }
      );
    }
  }
);

// Fetch leave dashboard for employee
export const fetchLeaveDashboardEmployee = createAsyncThunk(
  "leaveApproval/fetchLeaveDashboardEmployee",
  async ({ idEmployee, idYear }, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const params = new URLSearchParams();
      params.append("idEmployee", idEmployee);
      params.append("idYear", idYear);

      const response = await axios.get(
        `${API_BASE_URL}/GetLeaveDashboardEmployee?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch leave dashboard" }
      );
    }
  }
);

// Bulk approve leave applications (remarks optional)
export const bulkApproveLeaveApplications = createAsyncThunk(
  "leaveApproval/bulkApproveLeaveApplications",
  async ({ idLeaveApplications, remarks = "" }, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const params = new URLSearchParams();
      params.append("approvalStatus", "APPROVED");
      if (remarks) params.append("remarks", remarks);

      const response = await axios.post(
        `${API_BASE_URL}/SubmitLeaveApplicationApproval?${params.toString()}`,
        idLeaveApplications,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      return rejectWithValue(
        error.response?.data || { message: "Failed to bulk approve leave applications" }
      );
    }
  }
);

const slice = createSlice({
  name: "leaveApproval",
  initialState: {
    leaveApplications: [],
    leaveDashboard: [],
    leaveDashboardLoading: false,
    loading: false,
    error: null,
  },
  reducers: {
    resetError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch leave applications
    builder.addCase(fetchLeaveApplicationsForApproval.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchLeaveApplicationsForApproval.fulfilled, (state, action) => {
      state.leaveApplications = action.payload;
      state.loading = false;
      state.error = null;
    });
    builder.addCase(fetchLeaveApplicationsForApproval.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || action.error.message;
    });

    // Approve leave application
    builder.addCase(approveLeaveApplication.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(approveLeaveApplication.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(approveLeaveApplication.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || action.error.message;
    });

    // Reject leave application
    builder.addCase(rejectLeaveApplication.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(rejectLeaveApplication.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(rejectLeaveApplication.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || action.error.message;
    });

    // Bulk approve
    builder.addCase(bulkApproveLeaveApplications.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(bulkApproveLeaveApplications.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(bulkApproveLeaveApplications.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || action.error.message;
    });

    // Fetch leave dashboard employee
    builder.addCase(fetchLeaveDashboardEmployee.pending, (state) => {
      state.leaveDashboardLoading = true;
    });
    builder.addCase(fetchLeaveDashboardEmployee.fulfilled, (state, action) => {
      state.leaveDashboard = action.payload;
      state.leaveDashboardLoading = false;
    });
    builder.addCase(fetchLeaveDashboardEmployee.rejected, (state) => {
      state.leaveDashboardLoading = false;
      state.leaveDashboard = [];
    });
  },
});

export const { resetError } = slice.actions;
export default slice.reducer;
