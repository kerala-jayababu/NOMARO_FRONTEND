import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";
export const BASE_URL = import.meta.env.VITE_API_URL;

const API_BASE_URL = `${BASE_URL}/api/v1/LeaveManagement`;

export const fetchLeaveTypes = createAsyncThunk(
  "leaveType/fetchLeaveTypes",
  async (_, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.get(`${API_BASE_URL}/GetLeaveTypes`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch leave types"
      );
    }
  }
);

export const addUpdateLeaveType = createAsyncThunk(
  "leaveType/addUpdateLeaveType",
  async (data, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.post(
        `${API_BASE_URL}/AddOrUpdateLeaveTypes`,
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
        error.response?.data || "Failed to add/update leave type"
      );
    }
  }
);

const slice = createSlice({
  name: "leaveType",
  initialState: {
    leaveTypes: [],
    loading: false,
    error: null,
  },
  reducers: {
    resetError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchLeaveTypes.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchLeaveTypes.fulfilled, (state, action) => {
      state.leaveTypes = action.payload;
      state.loading = false;
      state.error = null;
    });
    builder.addCase(fetchLeaveTypes.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
    builder.addCase(addUpdateLeaveType.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addUpdateLeaveType.fulfilled, (state, action) => {
      state.loading = false;
    });
    builder.addCase(addUpdateLeaveType.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
  },
});

export const { resetError } = slice.actions;
export default slice.reducer;
