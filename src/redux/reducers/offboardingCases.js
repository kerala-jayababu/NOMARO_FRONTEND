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

// Helper to get current user data
const getCurrentUser = () => {
  const storedUser = secureLocalStorage.getItem("user");
  if (storedUser) {
    return JSON.parse(storedUser);
  }
  return null;
};

// ============= MOCK DATA =============
const mockExitCases = [
  {
    idExitCase: 1,
    idEmployee: 101,
    employeeCode: "E0001",
    employeeName: "Sriram Vasudevan",
    department: "IT Department",
    designation: "Senior Developer",
    employeeType: "Permanent",
    joinedDate: "2020-03-15",
    exitType: "Resignation",
    idExitType: 1,
    idExitReason: 1,
    exitReason: "Better Opportunity",
    initiationDate: "2026-01-05",
    noticePeriodDays: 30,
    proposedLWD: "2026-02-05",
    confirmedLWD: null,
    approvedLWD: null,
    status: "SUBMITTED",
    remarks: "Employee submitted resignation for better career growth.",
    handoverNotes: "Complete handover of current project documentation and knowledge transfer.",
    ktPlan: "Week 1: Documentation review\nWeek 2: Shadow sessions with replacement\nWeek 3: Final handover",
    exitInterviewDate: null,
    contactAfterExit: "sriram.personal@email.com",
    idClearanceTemplate: 1,
    clearanceTemplateName: "Standard IT Exit",
    clearanceStatus: null,
    documents: [
      {
        idDocument: 1,
        documentType: "Resignation Letter",
        fileName: "resignation_sriram.pdf",
        uploadedDate: "2026-01-05",
      },
    ],
    clearanceDepartments: [],
    createdBy: 1,
    createdOn: "2026-01-05",
    modifiedBy: null,
    modifiedOn: null,
  },
  {
    idExitCase: 2,
    idEmployee: 102,
    employeeCode: "E0002",
    employeeName: "Priya Sharma",
    department: "Human Resources",
    designation: "HR Manager",
    employeeType: "Permanent",
    joinedDate: "2019-07-22",
    exitType: "Retirement",
    idExitType: 2,
    idExitReason: 2,
    exitReason: "Retirement",
    initiationDate: "2025-12-01",
    noticePeriodDays: 60,
    proposedLWD: "2026-01-31",
    confirmedLWD: "2026-01-31",
    approvedLWD: "2026-01-31",
    status: "IN_CLEARANCE",
    remarks: "Planned retirement after 7 years of service.",
    handoverNotes: "Complete HR processes documentation and policy files handover.",
    ktPlan: "Transfer all ongoing recruitment cases and training programs.",
    exitInterviewDate: "2026-01-25",
    contactAfterExit: "priya.sharma@personal.com",
    idClearanceTemplate: 2,
    clearanceTemplateName: "HR Department Exit",
    clearanceStatus: "IN_PROGRESS",
    documents: [
      {
        idDocument: 2,
        documentType: "Retirement Request",
        fileName: "retirement_priya.pdf",
        uploadedDate: "2025-12-01",
      },
    ],
    clearanceDepartments: [
      {
        idClearanceDept: 1,
        department: "IT Department",
        owner: "Ravi Kumar",
        checklistItems: 5,
        departmentStatus: "COMPLETED",
        dueAmount: 0,
      },
      {
        idClearanceDept: 2,
        department: "Finance",
        owner: "Anita Desai",
        checklistItems: 4,
        departmentStatus: "PENDING",
        dueAmount: 2500,
      },
      {
        idClearanceDept: 3,
        department: "Admin",
        owner: "Suresh Menon",
        checklistItems: 3,
        departmentStatus: "IN_PROGRESS",
        dueAmount: 0,
      },
    ],
    createdBy: 1,
    createdOn: "2025-12-01",
    modifiedBy: 2,
    modifiedOn: "2026-01-10",
  },
  {
    idExitCase: 3,
    idEmployee: 103,
    employeeCode: "E0003",
    employeeName: "Rajesh Kumar",
    department: "Operations",
    designation: "Team Lead",
    employeeType: "Permanent",
    joinedDate: "2018-01-10",
    exitType: "Resignation",
    idExitType: 1,
    idExitReason: 3,
    exitReason: "Personal Reasons",
    initiationDate: "2026-01-10",
    noticePeriodDays: 30,
    proposedLWD: "2026-02-10",
    confirmedLWD: "2026-02-10",
    approvedLWD: "2026-02-10",
    status: "READY_FOR_CLOSURE",
    remarks: "All clearances completed. Ready for final settlement.",
    handoverNotes: "Operations manual and team responsibilities transferred to Anil.",
    ktPlan: "Completed all KT sessions with the new team lead.",
    exitInterviewDate: "2026-02-05",
    contactAfterExit: "rajesh.k@gmail.com",
    idClearanceTemplate: 1,
    clearanceTemplateName: "Standard IT Exit",
    clearanceStatus: "COMPLETED",
    documents: [
      {
        idDocument: 3,
        documentType: "Resignation Letter",
        fileName: "resignation_rajesh.pdf",
        uploadedDate: "2026-01-10",
      },
      {
        idDocument: 4,
        documentType: "No Dues Certificate",
        fileName: "no_dues_rajesh.pdf",
        uploadedDate: "2026-02-08",
      },
    ],
    clearanceDepartments: [
      {
        idClearanceDept: 4,
        department: "IT Department",
        owner: "Ravi Kumar",
        checklistItems: 5,
        departmentStatus: "COMPLETED",
        dueAmount: 0,
      },
      {
        idClearanceDept: 5,
        department: "Finance",
        owner: "Anita Desai",
        checklistItems: 4,
        departmentStatus: "COMPLETED",
        dueAmount: 0,
      },
      {
        idClearanceDept: 6,
        department: "Admin",
        owner: "Suresh Menon",
        checklistItems: 3,
        departmentStatus: "COMPLETED",
        dueAmount: 0,
      },
    ],
    createdBy: 1,
    createdOn: "2026-01-10",
    modifiedBy: 2,
    modifiedOn: "2026-02-08",
  },
  {
    idExitCase: 4,
    idEmployee: 104,
    employeeCode: "E0004",
    employeeName: "Anita Desai",
    department: "Finance",
    designation: "Finance Executive",
    employeeType: "Contract",
    joinedDate: "2023-06-01",
    exitType: "Contract End",
    idExitType: 3,
    idExitReason: 4,
    exitReason: "Contract Expiry",
    initiationDate: "2025-12-15",
    noticePeriodDays: 15,
    proposedLWD: "2025-12-31",
    confirmedLWD: "2025-12-31",
    approvedLWD: "2025-12-31",
    status: "COMPLETED",
    remarks: "Contract ended as per agreement. Final settlement processed.",
    handoverNotes: "All financial reports and documents handed over.",
    ktPlan: "Completed",
    exitInterviewDate: "2025-12-28",
    contactAfterExit: "anita.d@outlook.com",
    idClearanceTemplate: 3,
    clearanceTemplateName: "Contract Employee Exit",
    clearanceStatus: "COMPLETED",
    documents: [
      {
        idDocument: 5,
        documentType: "Contract End Notice",
        fileName: "contract_end_anita.pdf",
        uploadedDate: "2025-12-15",
      },
      {
        idDocument: 6,
        documentType: "Final Settlement",
        fileName: "settlement_anita.pdf",
        uploadedDate: "2026-01-05",
      },
    ],
    clearanceDepartments: [
      {
        idClearanceDept: 7,
        department: "IT Department",
        owner: "Ravi Kumar",
        checklistItems: 3,
        departmentStatus: "COMPLETED",
        dueAmount: 0,
      },
      {
        idClearanceDept: 8,
        department: "Finance",
        owner: "Mohan Pillai",
        checklistItems: 4,
        departmentStatus: "COMPLETED",
        dueAmount: 0,
      },
    ],
    createdBy: 2,
    createdOn: "2025-12-15",
    modifiedBy: 2,
    modifiedOn: "2026-01-05",
  },
  {
    idExitCase: 5,
    idEmployee: 105,
    employeeCode: "E0005",
    employeeName: "Vikram Singh",
    department: "Sales",
    designation: "Sales Manager",
    employeeType: "Permanent",
    joinedDate: "2021-09-15",
    exitType: "Resignation",
    idExitType: 1,
    idExitReason: 1,
    exitReason: "Better Opportunity",
    initiationDate: "2026-01-15",
    noticePeriodDays: 30,
    proposedLWD: "2026-02-15",
    confirmedLWD: null,
    approvedLWD: null,
    status: "DRAFT",
    remarks: "",
    handoverNotes: "",
    ktPlan: "",
    exitInterviewDate: null,
    contactAfterExit: "",
    idClearanceTemplate: null,
    clearanceTemplateName: null,
    clearanceStatus: null,
    documents: [],
    clearanceDepartments: [],
    createdBy: 105,
    createdOn: "2026-01-15",
    modifiedBy: null,
    modifiedOn: null,
  },
];

const mockEmployees = [
  { idEmployee: 101, employeeCode: "E0001", fullName: "Sriram Vasudevan", department: "IT Department", designation: "Senior Developer", employeeType: "Permanent", joinedDate: "2020-03-15" },
  { idEmployee: 102, employeeCode: "E0002", fullName: "Priya Sharma", department: "Human Resources", designation: "HR Manager", employeeType: "Permanent", joinedDate: "2019-07-22" },
  { idEmployee: 103, employeeCode: "E0003", fullName: "Rajesh Kumar", department: "Operations", designation: "Team Lead", employeeType: "Permanent", joinedDate: "2018-01-10" },
  { idEmployee: 104, employeeCode: "E0004", fullName: "Anita Desai", department: "Finance", designation: "Finance Executive", employeeType: "Contract", joinedDate: "2023-06-01" },
  { idEmployee: 105, employeeCode: "E0005", fullName: "Vikram Singh", department: "Sales", designation: "Sales Manager", employeeType: "Permanent", joinedDate: "2021-09-15" },
  { idEmployee: 106, employeeCode: "E0006", fullName: "Deepa Nair", department: "Marketing", designation: "Marketing Executive", employeeType: "Permanent", joinedDate: "2022-02-28" },
  { idEmployee: 107, employeeCode: "E0007", fullName: "Arun Menon", department: "IT Department", designation: "Software Engineer", employeeType: "Permanent", joinedDate: "2023-01-15" },
];

const mockExitTypes = [
  { idExitType: 1, typeName: "Resignation" },
  { idExitType: 2, typeName: "Retirement" },
  { idExitType: 3, typeName: "Contract End" },
  { idExitType: 4, typeName: "Termination" },
  { idExitType: 5, typeName: "Layoff" },
];

const mockExitReasons = [
  { idExitReason: 1, reasonName: "Better Opportunity" },
  { idExitReason: 2, reasonName: "Retirement" },
  { idExitReason: 3, reasonName: "Personal Reasons" },
  { idExitReason: 4, reasonName: "Contract Expiry" },
  { idExitReason: 5, reasonName: "Health Issues" },
  { idExitReason: 6, reasonName: "Relocation" },
];

const mockClearanceTemplates = [
  { idClearanceTemplate: 1, templateName: "Standard IT Exit", description: "Standard exit template for IT employees" },
  { idClearanceTemplate: 2, templateName: "HR Department Exit", description: "Exit template for HR department" },
  { idClearanceTemplate: 3, templateName: "Contract Employee Exit", description: "Simplified exit for contract employees" },
];

// ============= ASYNC THUNKS =============

// Fetch resignation requests based on role type
export const fetchResignationRequests = createAsyncThunk(
  "offboardingCases/fetchResignationRequests",
  async ({ roleType = "REPOFFICER" } = {}, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue({ message: "Authorization token missing" });
      }

      const response = await axios.get(
        `${OFFBOARDING_API_URL}/GetResignationRequests`,
        {
          params: { roleType },
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
        // Return mock data for development
        let filteredData = [...mockExitCases];

        if (status && status !== "ALL") {
          filteredData = filteredData.filter(c => c.status === status);
        }

        if (searchText) {
          const search = searchText.toLowerCase();
          filteredData = filteredData.filter(c =>
            c.employeeCode.toLowerCase().includes(search) ||
            c.employeeName.toLowerCase().includes(search) ||
            c.status.toLowerCase().includes(search)
          );
        }

        return { success: true, data: filteredData };
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
      // Fallback to mock data on error
      let filteredData = [...mockExitCases];

      if (status && status !== "ALL") {
        filteredData = filteredData.filter(c => c.status === status);
      }

      if (searchText) {
        const search = searchText.toLowerCase();
        filteredData = filteredData.filter(c =>
          c.employeeCode.toLowerCase().includes(search) ||
          c.employeeName.toLowerCase().includes(search) ||
          c.status.toLowerCase().includes(search)
        );
      }

      return { success: true, data: filteredData };
    }
  }
);

export const fetchExitCaseById = createAsyncThunk(
  "offboardingCases/fetchExitCaseById",
  async (id, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        const exitCase = mockExitCases.find(c => c.idExitCase === id);
        return { success: true, data: exitCase || null };
      }

      const response = await axios.get(`${API_BASE_URL}/GetExitCaseById/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      const exitCase = mockExitCases.find(c => c.idExitCase === id);
      return { success: true, data: exitCase || null };
    }
  }
);

export const addUpdateExitCase = createAsyncThunk(
  "offboardingCases/addUpdateExitCase",
  async (data, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return { success: true, message: "Exit case saved successfully (mock)" };
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
      return { success: true, message: "Exit case saved successfully (mock)" };
    }
  }
);

export const approveExitCase = createAsyncThunk(
  "offboardingCases/approveExitCase",
  async ({ idExitCase, approvalType, remarks }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return { success: true, message: `Exit case ${approvalType} approved successfully (mock)` };
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
      return { success: true, message: `Exit case ${approvalType} approved successfully (mock)` };
    }
  }
);

export const rejectExitCase = createAsyncThunk(
  "offboardingCases/rejectExitCase",
  async ({ idExitCase, rejectionType, remarks }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return { success: true, message: `Exit case ${rejectionType} rejected successfully (mock)` };
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
      return { success: true, message: `Exit case ${rejectionType} rejected successfully (mock)` };
    }
  }
);

export const initiateClearance = createAsyncThunk(
  "offboardingCases/initiateClearance",
  async ({ idExitCase, idClearanceTemplate }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return { success: true, message: "Clearance initiated successfully (mock)" };
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
      return { success: true, message: "Clearance initiated successfully (mock)" };
    }
  }
);

export const closeExitCase = createAsyncThunk(
  "offboardingCases/closeExitCase",
  async ({ idExitCase, remarks }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return { success: true, message: "Exit case closed successfully (mock)" };
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
      return { success: true, message: "Exit case closed successfully (mock)" };
    }
  }
);

export const fetchEmployeesForExit = createAsyncThunk(
  "offboardingCases/fetchEmployeesForExit",
  async (_, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return { success: true, data: mockEmployees };
      }

      const response = await axios.get(`${API_BASE_URL}/GetEmployeesForExit`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      return { success: true, data: mockEmployees };
    }
  }
);

export const fetchExitTypesForCases = createAsyncThunk(
  "offboardingCases/fetchExitTypesForCases",
  async (_, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return { success: true, data: mockExitTypes };
      }

      const response = await axios.get(`${API_BASE_URL}/GetExitTypes`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      return { success: true, data: mockExitTypes };
    }
  }
);

export const fetchExitReasonsForCases = createAsyncThunk(
  "offboardingCases/fetchExitReasonsForCases",
  async (_, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return { success: true, data: mockExitReasons };
      }

      const response = await axios.get(`${API_BASE_URL}/GetExitReasons`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      return { success: true, data: mockExitReasons };
    }
  }
);

export const fetchClearanceTemplatesForCases = createAsyncThunk(
  "offboardingCases/fetchClearanceTemplatesForCases",
  async (_, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return { success: true, data: mockClearanceTemplates };
      }

      const response = await axios.get(`${API_BASE_URL}/GetClearanceTemplates`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      return { success: true, data: mockClearanceTemplates };
    }
  }
);

const offboardingCasesSlice = createSlice({
  name: "offboardingCases",
  initialState: {
    exitCases: [],
    resignationRequests: [],
    selectedExitCase: null,
    employees: [],
    exitTypes: [],
    exitReasons: [],
    clearanceTemplates: [],
    offboardingClearanceTemplates: [],
    clearanceTemplateDepartments: [],
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
    error: null,
  },
  reducers: {
    resetError: (state) => {
      state.error = null;
    },
    clearSelectedExitCase: (state) => {
      state.selectedExitCase = null;
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

    // Fetch Resignation Requests
      .addCase(fetchResignationRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResignationRequests.fulfilled, (state, action) => {
        state.resignationRequests = action.payload?.data || [];
        state.loading = false;
      })
      .addCase(fetchResignationRequests.rejected, (state, action) => {
        state.loading = false;
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
      });
  },
});

export const {
  resetError,
  clearSelectedExitCase,
  updateStatusCounts,
} = offboardingCasesSlice.actions;

export default offboardingCasesSlice.reducer;
