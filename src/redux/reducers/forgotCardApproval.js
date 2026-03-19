import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";

export const BASE_URL = import.meta.env.VITE_API_URL;
const API_SHIFT_URL = `${BASE_URL}/api/v1/Shift`;
const API_COMMON_URL = `${BASE_URL}/api/v1/Common`;

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

// Fetch forgot card entry details for approval
export const fetchForgotCardEntryDetailsForApproval = createAsyncThunk(
  "forgotCardApproval/fetchForgotCardEntryDetailsForApproval",
  async ({ dateFrom = "", approvalStatus = "" } = {}, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const params = new URLSearchParams();
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (approvalStatus) params.append("approvalStatus", approvalStatus);

      const response = await axios.get(
        `${API_SHIFT_URL}/GetForgotCardEntryDetailsForApproval?${params.toString()}`,
        authHeaders(token)
      );

      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch forgot card entry details" }
      );
    }
  }
);

// Handle approval workflow (approve/reject forgot card entries)
export const handleForgotCardApprovalWorkflow = createAsyncThunk(
  "forgotCardApproval/handleApprovalWorkflow",
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

const slice = createSlice({
  name: "forgotCardApproval",
  initialState: {
    forgotCardEntries: [],
    loading: false,
    error: null,
  },
  reducers: {
    resetError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchForgotCardEntryDetailsForApproval.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchForgotCardEntryDetailsForApproval.fulfilled, (state, action) => {
      state.forgotCardEntries = action.payload;
      state.loading = false;
      state.error = null;
    });
    builder.addCase(fetchForgotCardEntryDetailsForApproval.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || action.error.message;
    });
  },
});

export const { resetError } = slice.actions;
export default slice.reducer;
