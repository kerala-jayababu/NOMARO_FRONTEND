import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";
export const BASE_URL = import.meta.env.VITE_API_URL;

// API Base URL
const API_BASE_URL = `${BASE_URL}/api/v1`;

// Get Salary Generation
export const getConfigApprovals = createAsyncThunk(
  "configApprovals/getConfigApprovals",
  async (params) => {
    const { dateFrom, status, entityType } = params;
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;


      if (!token) {
        console.error("Authorization token missing");
      }

      const response = await axios.get(
        `${API_BASE_URL}/PayRollManagement/GetConfigApprovalsList?fromDate=${dateFrom}&actionStatus=${status}&entityCode=${entityType}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log('configdata',response.data)
      return response.data;
    } catch (error) {
      return error;
    }
  }
);

export const getOvertimeTransactionById = createAsyncThunk(
  "configApprovals/getOvertimeTransactionById",
  async (id) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
      }

      const response = await axios.get(
        `${API_BASE_URL}/PayRollManagement/GetOvertimeTransactionById?id=${id}`,
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

export const getEmployeeSalaryConfigById = createAsyncThunk(
  "configApprovals/getEmployeeSalaryConfigById",
  async (id) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
      }

      const response = await axios.get(
        `${API_BASE_URL}/EmployeeSalaryConfig/GetEmployeeSalaryConfigById?id=${id}`,
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
export const getMaternityLeaveSalaryById = createAsyncThunk(
  "configApprovals/getMaternityLeaveSalaryById",
  async (id) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) console.error("Authorization token missing");

      const response = await axios.get(
        `${API_BASE_URL}/PayRollManagement/GetMaternityLeaveSalaryById?id=${id}`,
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


export const getSalaryTemplateById = createAsyncThunk(
  "configApprovals/getSalaryTemplateById",
  async (id) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
      }

      const response = await axios.get(
        `${API_BASE_URL}/SalaryTemplate/GetSalaryTemplateById?id=${id}`,
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
    overtimeTransaction: [],
    employeeSalaryConfig: [],
     maternityLeaveSalary: null,
    salaryTemplate: [],
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
    builder.addCase(getOvertimeTransactionById.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getMaternityLeaveSalaryById.fulfilled, (state, action) => {
  state.loading = false;
  state.maternityLeaveSalary = action.payload.data; // ✅ because API returns { data: ... }
});
    builder.addCase(getOvertimeTransactionById.fulfilled, (state, action) => {
      state.loading = false;
      state.overtimeTransaction = action.payload.data; // Store the fetched overtime transaction
    });
    builder.addCase(getOvertimeTransactionById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
    builder.addCase(getEmployeeSalaryConfigById.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getEmployeeSalaryConfigById.fulfilled, (state, action) => {
      state.loading = false;
      state.employeeSalaryConfig = action.payload.data; // Store the fetched employee salary config
    });
    builder.addCase(getEmployeeSalaryConfigById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
    builder.addCase(getSalaryTemplateById.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getSalaryTemplateById.fulfilled, (state, action) => {
      state.loading = false;
      state.salaryTemplate = action.payload.data; // Store the fetched salary template
    });
    builder.addCase(getSalaryTemplateById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
  },
});

export default configApprovalsSlice.reducer;
