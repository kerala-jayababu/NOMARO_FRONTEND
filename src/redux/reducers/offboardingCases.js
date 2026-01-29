import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";

export const BASE_URL = import.meta.env.VITE_API_URL;
const API_BASE_URL = `${BASE_URL}/api/v1/OffboardingCases`;
const OFFBOARDING_API_URL = `${BASE_URL}/api/v1/EmployeeOffBoarding`;

// Helper to get auth token
const getAuthToken = () => {
  const storedUser = secureLocalStorage.getItem("user");
  return storedUser ? JSON.parse(storedUser)?.token : null;
};

// Helper to get logged in employee ID
const getLoggedInEmployeeId = () => {
  const storedUser = secureLocalStorage.getItem("user");
  return storedUser ? JSON.parse(storedUser)?.idEmployee : null;
};

// ============= ASYNC THUNKS =============

// Fetch exit cases for listing (uses logged in employee ID)
export const fetchExitCasesForListing = createAsyncThunk(
  "offboardingCases/fetchExitCasesForListing",
  async (_, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const idLoggedInEmployee = getLoggedInEmployeeId();
      if (!idLoggedInEmployee) {
        console.error("Logged in employee ID missing");
        return rejectWithValue({ message: "Logged in employee ID missing" });
      }

      const response = await axios.get(
        `${OFFBOARDING_API_URL}/GetExitCasesForListing`,
        {
          params: { idLoggidLoggedInEmployee: idLoggedInEmployee },
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
        error.response?.data || { message: "Failed to fetch exit cases for listing" }
      );
    }
  }
);

// Fetch resignation requests based on role type
export const fetchResignationRequests = createAsyncThunk(
  "offboardingCases/fetchResignationRequests",
  async ({ roleType = "REPOFFICER", idEmployee } = {}, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const response = await axios.get(
        `${OFFBOARDING_API_URL}/GetResignationRequests`,
        {
          params: { roleType, idEmployee },
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
        error.response?.data || { message: "Failed to fetch resignation requests" }
      );
    }
  }
);

// Submit reporting officer actions (Approve/Reject)
export const submitReportingOfficerAction = createAsyncThunk(
  "offboardingCases/submitReportingOfficerAction",
  async ({ idExitCase, idEmployee, approvedLWD, handOverNotes, action }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const response = await axios.post(
        `${OFFBOARDING_API_URL}/SubmitReportingOfficerActions`,
        {
          idExitCase,
          idEmployee,
          approvedLWD,
          handOverNotes,
          action,
        },
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
        error.response?.data || { message: "Failed to submit action" }
      );
    }
  }
);

// Submit HR Officer actions (Approve/Reject) - for HREXECUTIVE role
export const submitHROfficerAction = createAsyncThunk(
  "offboardingCases/submitHROfficerAction",
  async (payload, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const response = await axios.post(
        `${OFFBOARDING_API_URL}/SubmitHROfficerActions`,
        payload,
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
        error.response?.data || { message: "Failed to submit HR Officer action" }
      );
    }
  }
);

// Submit HR Manager actions (Approve/Reject) - for HRHEAD role (final approval)
export const submitHRManagerAction = createAsyncThunk(
  "offboardingCases/submitHRManagerAction",
  async (payload, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const response = await axios.post(
        `${OFFBOARDING_API_URL}/SubmitHRManagerActions`,
        payload,
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
        error.response?.data || { message: "Failed to submit HR Manager action" }
      );
    }
  }
);

// Fetch clearance templates for offboarding
export const fetchOffboardingClearanceTemplates = createAsyncThunk(
  "offboardingCases/fetchOffboardingClearanceTemplates",
  async (_, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const response = await axios.get(
        `${OFFBOARDING_API_URL}/GetClearanceTemplates`,
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
        error.response?.data || { message: "Failed to fetch clearance templates" }
      );
    }
  }
);

// Fetch clearance template departments by template ID
export const fetchClearanceTemplateDepartments = createAsyncThunk(
  "offboardingCases/fetchClearanceTemplateDepartments",
  async (idClearanceTemplate, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const response = await axios.get(
        `${OFFBOARDING_API_URL}/GetClearanceTemplateDepartments/${idClearanceTemplate}`,
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
        error.response?.data || { message: "Failed to fetch clearance template departments" }
      );
    }
  }
);

export const fetchExitCases = createAsyncThunk(
  "offboardingCases/fetchExitCases",
  async ({ status = "", searchText = "" } = {}, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const response = await axios.get(`${API_BASE_URL}/GetExitCases`, {
        params: { status, searchText },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch exit cases" }
      );
    }
  }
);

export const fetchExitCaseById = createAsyncThunk(
  "offboardingCases/fetchExitCaseById",
  async (id, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const response = await axios.get(`${API_BASE_URL}/GetExitCaseById/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch exit case" }
      );
    }
  }
);

export const addUpdateExitCase = createAsyncThunk(
  "offboardingCases/addUpdateExitCase",
  async (data, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const response = await axios.post(
        `${API_BASE_URL}/AddOrUpdateExitCase`,
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
      console.error("API Error:", error);
      return rejectWithValue(
        error.response?.data || { message: "Failed to save exit case" }
      );
    }
  }
);

export const approveExitCase = createAsyncThunk(
  "offboardingCases/approveExitCase",
  async ({ idExitCase, approvalType, remarks }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const response = await axios.post(
        `${API_BASE_URL}/ApproveExitCase`,
        { idExitCase, approvalType, remarks },
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
        error.response?.data || { message: "Failed to approve exit case" }
      );
    }
  }
);

export const rejectExitCase = createAsyncThunk(
  "offboardingCases/rejectExitCase",
  async ({ idExitCase, rejectionType, remarks }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const response = await axios.post(
        `${API_BASE_URL}/RejectExitCase`,
        { idExitCase, rejectionType, remarks },
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
        error.response?.data || { message: "Failed to reject exit case" }
      );
    }
  }
);

export const initiateClearance = createAsyncThunk(
  "offboardingCases/initiateClearance",
  async ({ idExitCase, idClearanceTemplate }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const response = await axios.post(
        `${API_BASE_URL}/InitiateClearance`,
        { idExitCase, idClearanceTemplate },
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
        error.response?.data || { message: "Failed to initiate clearance" }
      );
    }
  }
);

export const closeExitCase = createAsyncThunk(
  "offboardingCases/closeExitCase",
  async ({ idExitCase, remarks }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const response = await axios.post(
        `${API_BASE_URL}/CloseExitCase`,
        { idExitCase, remarks },
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
        error.response?.data || { message: "Failed to close exit case" }
      );
    }
  }
);

export const fetchEmployeesForExit = createAsyncThunk(
  "offboardingCases/fetchEmployeesForExit",
  async (_, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const response = await axios.get(`${API_BASE_URL}/GetEmployeesForExit`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch employees" }
      );
    }
  }
);

export const fetchExitTypesForCases = createAsyncThunk(
  "offboardingCases/fetchExitTypesForCases",
  async (_, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const response = await axios.get(`${API_BASE_URL}/GetExitTypes`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch exit types" }
      );
    }
  }
);

export const fetchExitReasonsForCases = createAsyncThunk(
  "offboardingCases/fetchExitReasonsForCases",
  async (_, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const response = await axios.get(`${API_BASE_URL}/GetExitReasons`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch exit reasons" }
      );
    }
  }
);

export const fetchClearanceTemplatesForCases = createAsyncThunk(
  "offboardingCases/fetchClearanceTemplatesForCases",
  async (_, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const response = await axios.get(`${API_BASE_URL}/GetClearanceTemplates`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch clearance templates" }
      );
    }
  }
);

// Fetch exit clearance for department user (My Department Queue)
export const fetchExitClearanceForDepartmentUser = createAsyncThunk(
  "offboardingCases/fetchExitClearanceForDepartmentUser",
  async (_, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const response = await axios.get(
        `${OFFBOARDING_API_URL}/ExitClearanceForDepartmentUser`,
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
        error.response?.data || { message: "Failed to fetch department queue" }
      );
    }
  }
);

// Fetch exit clearance details by case ID and department
export const fetchExitClearanceDetails = createAsyncThunk(
  "offboardingCases/fetchExitClearanceDetails",
  async ({ idExitCase, idDepartment }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const response = await axios.get(
        `${OFFBOARDING_API_URL}/GetExitClearanceDetails`,
        {
          params: { idExitCase, idDepartment },
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
        error.response?.data || { message: "Failed to fetch clearance details" }
      );
    }
  }
);

// Submit exit case department clearance lines
export const submitExitCaseDepartmentClearanceLines = createAsyncThunk(
  "offboardingCases/submitExitCaseDepartmentClearanceLines",
  async (payload, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const response = await axios.post(
        `${OFFBOARDING_API_URL}/SubmitExitCaseDepartmentClearanceLines`,
        payload,
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
        error.response?.data || { message: "Failed to submit clearance lines" }
      );
    }
  }
);

const offboardingCasesSlice = createSlice({
  name: "offboardingCases",
  initialState: {
    exitCases: [],
    exitCasesForListing: [],
    resignationRequests: [],
    selectedExitCase: null,
    selectedExitCaseDetails: null,
    employees: [],
    exitTypes: [],
    exitReasons: [],
    clearanceTemplates: [],
    offboardingClearanceTemplates: [],
    clearanceTemplateDepartments: [],
    departmentQueue: [],
    exitClearanceDetails: null,
    statusCounts: {
      draft: 0,
      submitted: 0,
      inClearance: 0,
      readyForClosure: 0,
      completed: 0,
    },
    loading: false,
    actionLoading: false,
    templateLoading: false,
    clearanceLoading: false,
    error: null,
  },
  reducers: {
    resetError: (state) => {
      state.error = null;
    },
    clearSelectedExitCase: (state) => {
      state.selectedExitCase = null;
    },
    clearSelectedExitCaseDetails: (state) => {
      state.selectedExitCaseDetails = null;
    },
    clearExitClearanceDetails: (state) => {
      state.exitClearanceDetails = null;
    },
    updateStatusCounts: (state) => {
      const cases = state.exitCases;
      state.statusCounts = {
        draft: cases.filter(c => c.status === "DRAFT" || c.status === "SUBMITTED").length,
        submitted: cases.filter(c => c.status === "SUBMITTED").length,
        inClearance: cases.filter(c => c.status === "IN_CLEARANCE").length,
        readyForClosure: cases.filter(c => c.status === "READY_FOR_CLOSURE").length,
        completed: cases.filter(c => c.status === "COMPLETED").length,
      };
    },
  },
  extraReducers: (builder) => {
    // Fetch Exit Cases
    builder
      .addCase(fetchExitCases.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExitCases.fulfilled, (state, action) => {
        state.exitCases = action.payload?.data || [];
        state.loading = false;
        // Update status counts
        const cases = state.exitCases;
        state.statusCounts = {
          draft: cases.filter(c => c.status === "DRAFT" || c.status === "SUBMITTED").length,
          submitted: cases.filter(c => c.status === "SUBMITTED").length,
          inClearance: cases.filter(c => c.status === "IN_CLEARANCE").length,
          readyForClosure: cases.filter(c => c.status === "READY_FOR_CLOSURE").length,
          completed: cases.filter(c => c.status === "COMPLETED").length,
        };
      })
      .addCase(fetchExitCases.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

    // Fetch Exit Cases For Listing
      .addCase(fetchExitCasesForListing.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExitCasesForListing.fulfilled, (state, action) => {
        state.exitCasesForListing = Array.isArray(action.payload) ? action.payload : [];
        state.loading = false;
      })
      .addCase(fetchExitCasesForListing.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error.message;
      })

    // Fetch Exit Case By Id
      .addCase(fetchExitCaseById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExitCaseById.fulfilled, (state, action) => {
        state.selectedExitCase = action.payload?.data || null;
        state.loading = false;
      })
      .addCase(fetchExitCaseById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

    // Add/Update Exit Case
      .addCase(addUpdateExitCase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addUpdateExitCase.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addUpdateExitCase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

    // Approve Exit Case
      .addCase(approveExitCase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveExitCase.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(approveExitCase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

    // Reject Exit Case
      .addCase(rejectExitCase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rejectExitCase.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(rejectExitCase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

    // Initiate Clearance
      .addCase(initiateClearance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initiateClearance.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(initiateClearance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

    // Close Exit Case
      .addCase(closeExitCase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(closeExitCase.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(closeExitCase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

    // Fetch Employees
      .addCase(fetchEmployeesForExit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeesForExit.fulfilled, (state, action) => {
        state.employees = action.payload?.data || [];
        state.loading = false;
      })
      .addCase(fetchEmployeesForExit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

    // Fetch Exit Types
      .addCase(fetchExitTypesForCases.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchExitTypesForCases.fulfilled, (state, action) => {
        state.exitTypes = action.payload?.data || [];
      })
      .addCase(fetchExitTypesForCases.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })

    // Fetch Exit Reasons
      .addCase(fetchExitReasonsForCases.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchExitReasonsForCases.fulfilled, (state, action) => {
        state.exitReasons = action.payload?.data || [];
      })
      .addCase(fetchExitReasonsForCases.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })

    // Fetch Clearance Templates
      .addCase(fetchClearanceTemplatesForCases.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchClearanceTemplatesForCases.fulfilled, (state, action) => {
        state.clearanceTemplates = action.payload?.data || [];
      })
      .addCase(fetchClearanceTemplatesForCases.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })

    // Fetch Resignation Requests (used for viewing details)
      .addCase(fetchResignationRequests.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(fetchResignationRequests.fulfilled, (state, action) => {
        const data = action.payload?.data || [];
        state.resignationRequests = data;
        // Store the first item as selected exit case details (for view modal)
        state.selectedExitCaseDetails = data.length > 0 ? data[0] : null;
        state.actionLoading = false;
      })
      .addCase(fetchResignationRequests.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload?.message || action.error.message;
      })

    // Submit Reporting Officer Action
      .addCase(submitReportingOfficerAction.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(submitReportingOfficerAction.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(submitReportingOfficerAction.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload?.message || action.error.message;
      })

    // Submit HR Officer Action
      .addCase(submitHROfficerAction.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(submitHROfficerAction.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(submitHROfficerAction.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload?.message || action.error.message;
      })

    // Submit HR Manager Action (HRHEAD final approval)
      .addCase(submitHRManagerAction.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(submitHRManagerAction.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(submitHRManagerAction.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload?.message || action.error.message;
      })

    // Fetch Offboarding Clearance Templates
      .addCase(fetchOffboardingClearanceTemplates.pending, (state) => {
        state.templateLoading = true;
        state.error = null;
      })
      .addCase(fetchOffboardingClearanceTemplates.fulfilled, (state, action) => {
        state.offboardingClearanceTemplates = action.payload?.data || [];
        state.templateLoading = false;
      })
      .addCase(fetchOffboardingClearanceTemplates.rejected, (state, action) => {
        state.templateLoading = false;
        state.error = action.payload?.message || action.error.message;
      })

    // Fetch Clearance Template Departments
      .addCase(fetchClearanceTemplateDepartments.pending, (state) => {
        state.templateLoading = true;
        state.error = null;
      })
      .addCase(fetchClearanceTemplateDepartments.fulfilled, (state, action) => {
        state.clearanceTemplateDepartments = action.payload?.data || [];
        state.templateLoading = false;
      })
      .addCase(fetchClearanceTemplateDepartments.rejected, (state, action) => {
        state.templateLoading = false;
        state.error = action.payload?.message || action.error.message;
      })

    // Fetch Exit Clearance For Department User
      .addCase(fetchExitClearanceForDepartmentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExitClearanceForDepartmentUser.fulfilled, (state, action) => {
        state.departmentQueue = Array.isArray(action.payload) ? action.payload : [];
        state.loading = false;
      })
      .addCase(fetchExitClearanceForDepartmentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error.message;
      })

    // Fetch Exit Clearance Details
      .addCase(fetchExitClearanceDetails.pending, (state) => {
        state.clearanceLoading = true;
        state.error = null;
      })
      .addCase(fetchExitClearanceDetails.fulfilled, (state, action) => {
        state.exitClearanceDetails = action.payload?.data || null;
        state.clearanceLoading = false;
      })
      .addCase(fetchExitClearanceDetails.rejected, (state, action) => {
        state.clearanceLoading = false;
        state.error = action.payload?.message || action.error.message;
      })

    // Submit Exit Case Department Clearance Lines
      .addCase(submitExitCaseDepartmentClearanceLines.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(submitExitCaseDepartmentClearanceLines.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(submitExitCaseDepartmentClearanceLines.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload?.message || action.error.message;
      });
  },
});

export const {
  resetError,
  clearSelectedExitCase,
  clearSelectedExitCaseDetails,
  clearExitClearanceDetails,
  updateStatusCounts,
} = offboardingCasesSlice.actions;

export default offboardingCasesSlice.reducer;
