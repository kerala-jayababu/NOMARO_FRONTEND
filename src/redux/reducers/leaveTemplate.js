import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";

export const BASE_URL = import.meta.env.VITE_API_URL;
const API_BASE_URL = `${BASE_URL}/api/v1/LeaveManagement`;
const MASTER_DATA_URL = `${BASE_URL}/api/v1/MasterData`;

export const fetchLeaveTemplates = createAsyncThunk(
  "leaveTemplate/fetchLeaveTemplates",
  async ({ status = "All", idYear = "", searchText = "" }, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.get(
        `${API_BASE_URL}/GetLeaveTemplates?Status=${status}&IdYear=${idYear}&searchText=${searchText}`,
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
        error.response?.data || "Failed to fetch leave templates"
      );
    }
  }
);

export const addUpdateLeaveTemplate = createAsyncThunk(
  "leaveTemplate/addUpdateLeaveTemplate",
  async (data, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.post(
        `${API_BASE_URL}/AddUpdateLeaveTemplate`,
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
        error.response?.data || "Failed to add/update leave template"
      );
    }
  }
);

export const fetchLeaveTemplateById = createAsyncThunk(
  "leaveTemplate/fetchLeaveTemplateById",
  async (idLeaveTemplate, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.get(
        `${API_BASE_URL}/GetLeaveTemplateByID?idLeaveTemplate=${idLeaveTemplate}`,
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
        error.response?.data || "Failed to fetch leave template details"
      );
    }
  }
);

export const fetchLeaveTemplateDetailById = createAsyncThunk(
  "leaveTemplate/fetchLeaveTemplateDetailById",
  async (idLeaveTemplateDetails, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.get(
        `${API_BASE_URL}/GetLeaveTemplateDetailById/${idLeaveTemplateDetails}`,
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
        error.response?.data || "Failed to fetch leave template detail"
      );
    }
  }
);

export const addUpdateLeaveTemplateDetails = createAsyncThunk(
  "leaveTemplate/addUpdateLeaveTemplateDetails",
  async (data, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      console.log("API Request - URL:", `${API_BASE_URL}/AddOrUpdateLeaveTemplateDetails`);
      console.log("API Request - Payload:", JSON.stringify(data, null, 2));

      const response = await axios.post(
        `${API_BASE_URL}/AddOrUpdateLeaveTemplateDetails`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("API Response - Status:", response.status);
      console.log("API Response - Data:", response.data);

      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      console.error("API Error Response:", error.response?.data);
      console.error("API Error Status:", error.response?.status);

      return rejectWithValue(
        error.response?.data || { message: "Failed to add/update leave template details" }
      );
    }
  }
);

export const submitLeaveTemplateForApproval = createAsyncThunk(
  "leaveTemplate/submitLeaveTemplateForApproval",
  async (idLeaveTemplate, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const response = await axios.post(
        `${API_BASE_URL}/SubmitLeaveTemplateForApproval?idLeaveTemplate=${idLeaveTemplate}`,
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
        error.response?.data || { message: "Failed to submit leave template for approval" }
      );
    }
  }
);

export const approveLeaveTemplate = createAsyncThunk(
  "leaveTemplate/approveLeaveTemplate",
  async ({ idLeaveTemplate, approvalStatus }, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const response = await axios.post(
        `${API_BASE_URL}/ApproveLeaveTemplate?idLeaveTemplate=${idLeaveTemplate}&approvalStatus=${approvalStatus}`,
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
        error.response?.data || { message: "Failed to approve/reject leave template" }
      );
    }
  }
);

export const deleteLeaveTemplateDetail = createAsyncThunk(
  "leaveTemplate/deleteLeaveTemplateDetail",
  async (idLeaveTemplateDetail, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const response = await axios.post(
        `${API_BASE_URL}/DeleteLeaveTemplateDetail?idLeaveTemplateDetail=${idLeaveTemplateDetail}`,
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
        error.response?.data || { message: "Failed to delete leave template detail" }
      );
    }
  }
);

export const fetchDesignationList = createAsyncThunk(
  "leaveTemplate/fetchDesignationList",
  async (_, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.get(
        `${MASTER_DATA_URL}/GetDesignationList`,
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
        error.response?.data || "Failed to fetch designation list"
      );
    }
  }
);

const slice = createSlice({
  name: "leaveTemplate",
  initialState: {
    leaveTemplates: [],
    leaveTemplateDetails: null,
    leaveTemplateDetailById: null,
    designationList: [],
    loading: false,
    error: null,
  },
  reducers: {
    resetError: (state) => {
      state.error = null;
    },
    resetLeaveTemplateDetailById: (state) => {
      state.leaveTemplateDetailById = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchLeaveTemplates.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchLeaveTemplates.fulfilled, (state, action) => {
      state.leaveTemplates = action.payload;
      state.loading = false;
      state.error = null;
    });
    builder.addCase(fetchLeaveTemplates.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
    builder.addCase(addUpdateLeaveTemplate.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addUpdateLeaveTemplate.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(addUpdateLeaveTemplate.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
    builder.addCase(fetchLeaveTemplateById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchLeaveTemplateById.fulfilled, (state, action) => {
      state.leaveTemplateDetails = action.payload;
      state.loading = false;
      state.error = null;
    });
    builder.addCase(fetchLeaveTemplateById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
    builder.addCase(addUpdateLeaveTemplateDetails.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addUpdateLeaveTemplateDetails.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(addUpdateLeaveTemplateDetails.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
    builder.addCase(fetchDesignationList.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDesignationList.fulfilled, (state, action) => {
      state.designationList = action.payload;
      state.loading = false;
      state.error = null;
    });
    builder.addCase(fetchDesignationList.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
    builder.addCase(fetchLeaveTemplateDetailById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchLeaveTemplateDetailById.fulfilled, (state, action) => {
      state.leaveTemplateDetailById = action.payload;
      state.loading = false;
      state.error = null;
    });
    builder.addCase(fetchLeaveTemplateDetailById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
    builder.addCase(submitLeaveTemplateForApproval.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(submitLeaveTemplateForApproval.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(submitLeaveTemplateForApproval.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
  },
});

export const { resetError, resetLeaveTemplateDetailById } = slice.actions;
export default slice.reducer;
