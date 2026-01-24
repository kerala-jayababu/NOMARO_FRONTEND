import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";

export const BASE_URL = import.meta.env.VITE_API_URL;
const API_BASE_URL = `${BASE_URL}/api/v1/EmployeeOffBoarding`;
const MASTER_DATA_URL = `${BASE_URL}/api/v1/MasterData`;

// Helper to get auth token
const getAuthToken = () => {
  const storedUser = secureLocalStorage.getItem("user");
  return storedUser ? JSON.parse(storedUser)?.token : null;
};

// Helper to get current user ID
const getCurrentUserId = () => {
  const storedUser = secureLocalStorage.getItem("user");
  if (storedUser) {
    const userData = JSON.parse(storedUser);
    return userData.idEmployee || 1;
  }
  return 1;
};

// ============= EXIT REASONS THUNKS =============
export const fetchExitReasons = createAsyncThunk(
  "offboardingSetup/fetchExitReasons",
  async (_, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.get(`${API_BASE_URL}/GetExitReasons`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch exit reasons"
      );
    }
  }
);

export const addUpdateExitReason = createAsyncThunk(
  "offboardingSetup/addUpdateExitReason",
  async (data, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.post(
        `${API_BASE_URL}/AddOrUpdateExitReasons`,
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
        error.response?.data || "Failed to add/update exit reason"
      );
    }
  }
);

// ============= EXIT TYPES THUNKS =============
export const fetchExitTypes = createAsyncThunk(
  "offboardingSetup/fetchExitTypes",
  async (_, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.get(`${API_BASE_URL}/GetExitTypes`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch exit types"
      );
    }
  }
);

export const addUpdateExitType = createAsyncThunk(
  "offboardingSetup/addUpdateExitType",
  async (data, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.post(
        `${API_BASE_URL}/AddOrUpdateExitTypes`,
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
        error.response?.data || "Failed to add/update exit type"
      );
    }
  }
);

// ============= NOTICE PERIOD POLICIES THUNKS =============
export const fetchNoticePolicies = createAsyncThunk(
  "offboardingSetup/fetchNoticePolicies",
  async (_, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.get(`${API_BASE_URL}/GetNoticePeriodPolicies`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch notice policies"
      );
    }
  }
);

export const addUpdateNoticePolicy = createAsyncThunk(
  "offboardingSetup/addUpdateNoticePolicy",
  async (data, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.post(
        `${API_BASE_URL}/AddOrUpdateNoticePeriodPolicies`,
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
        error.response?.data || "Failed to add/update notice policy"
      );
    }
  }
);

// ============= CLEARANCE TEMPLATES THUNKS =============
export const fetchClearanceTemplates = createAsyncThunk(
  "offboardingSetup/fetchClearanceTemplates",
  async (_, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.get(`${API_BASE_URL}/GetClearanceTemplates`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch clearance templates"
      );
    }
  }
);

export const addUpdateClearanceTemplate = createAsyncThunk(
  "offboardingSetup/addUpdateClearanceTemplate",
  async (data, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.post(
        `${API_BASE_URL}/AddOrUpdateClearanceTemplates`,
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
        error.response?.data || "Failed to add/update clearance template"
      );
    }
  }
);

// ============= DEPARTMENT LIST THUNK =============
export const fetchDepartmentList = createAsyncThunk(
  "offboardingSetup/fetchDepartmentList",
  async (_, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.get(`${MASTER_DATA_URL}/GetDepartmentList`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch department list"
      );
    }
  }
);

// ============= CLEARANCE TEMPLATE DEPARTMENTS (CHECKLISTS) THUNKS =============
export const fetchClearanceTemplateDepartments = createAsyncThunk(
  "offboardingSetup/fetchClearanceTemplateDepartments",
  async (templateId, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.get(
        `${API_BASE_URL}/GetClearanceTemplateDepartments/${templateId}`,
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
        error.response?.data || "Failed to fetch clearance template departments"
      );
    }
  }
);

export const addUpdateClearanceTemplateDepartments = createAsyncThunk(
  "offboardingSetup/addUpdateClearanceTemplateDepartments",
  async (data, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.post(
        `${API_BASE_URL}/AddOrUpdateClearanceTemplateDepartments`,
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
        error.response?.data || "Failed to add/update clearance template departments"
      );
    }
  }
);

const offboardingSetupSlice = createSlice({
  name: "offboardingSetup",
  initialState: {
    exitReasons: [],
    exitTypes: [],
    noticePolicies: [],
    clearanceTemplates: [],
    departments: [],
    templateDepartments: [],
    loading: false,
    error: null,
  },
  reducers: {
    resetError: (state) => {
      state.error = null;
    },
    clearTemplateDepartments: (state) => {
      state.templateDepartments = [];
    },
  },
  extraReducers: (builder) => {
    // Exit Reasons
    builder
      .addCase(fetchExitReasons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExitReasons.fulfilled, (state, action) => {
        state.exitReasons = action.payload;
        state.loading = false;
      })
      .addCase(fetchExitReasons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(addUpdateExitReason.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addUpdateExitReason.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addUpdateExitReason.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

    // Exit Types
      .addCase(fetchExitTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExitTypes.fulfilled, (state, action) => {
        state.exitTypes = action.payload;
        state.loading = false;
      })
      .addCase(fetchExitTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(addUpdateExitType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addUpdateExitType.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addUpdateExitType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

    // Notice Policies
      .addCase(fetchNoticePolicies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNoticePolicies.fulfilled, (state, action) => {
        state.noticePolicies = action.payload;
        state.loading = false;
      })
      .addCase(fetchNoticePolicies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(addUpdateNoticePolicy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addUpdateNoticePolicy.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addUpdateNoticePolicy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

    // Clearance Templates
      .addCase(fetchClearanceTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClearanceTemplates.fulfilled, (state, action) => {
        state.clearanceTemplates = action.payload;
        state.loading = false;
      })
      .addCase(fetchClearanceTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(addUpdateClearanceTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addUpdateClearanceTemplate.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addUpdateClearanceTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

    // Department List
      .addCase(fetchDepartmentList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartmentList.fulfilled, (state, action) => {
        state.departments = action.payload;
        state.loading = false;
      })
      .addCase(fetchDepartmentList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

    // Clearance Template Departments (Checklists)
      .addCase(fetchClearanceTemplateDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClearanceTemplateDepartments.fulfilled, (state, action) => {
        state.templateDepartments = action.payload;
        state.loading = false;
      })
      .addCase(fetchClearanceTemplateDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(addUpdateClearanceTemplateDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addUpdateClearanceTemplateDepartments.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addUpdateClearanceTemplateDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const {
  resetError,
  clearTemplateDepartments,
} = offboardingSetupSlice.actions;

export default offboardingSetupSlice.reducer;
