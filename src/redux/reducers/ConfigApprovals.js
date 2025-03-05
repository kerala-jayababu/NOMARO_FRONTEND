import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";
export const BASE_URL = import.meta.env.VITE_API_URL;

// API Base URL
const API_BASE_URL = `${BASE_URL}/api/v1/PayRollManagement`;

// Get Salary Generation
export const getConfigApprovals = createAsyncThunk(
  "configApprovals/getConfigApprovals",
  async (params) => {
    const { dateFrom, status, entityType } = params;
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token); // Debugging

      if (!token) {
        console.error("Authorization token missing");
      }

      const response = await axios.get(
        `${API_BASE_URL}/GetConfigApprovalsList?fromDate=${dateFrom}&actionStatus=${status}&entityCode=${entityType}`,
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

const configApprovalsSlice = createSlice({
  name: "configApprovals",
  initialState: {
    configApprovalList: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getConfigApprovals.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(getConfigApprovals.fulfilled, (state, action) => {
      state.configApprovalList = action.payload.data;
      state.status = "succeeded";
      state.loading = false;
    });
    builder.addCase(getConfigApprovals.rejected, (state, action) => {
      state.status = "failed";
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export default configApprovalsSlice.reducer;
