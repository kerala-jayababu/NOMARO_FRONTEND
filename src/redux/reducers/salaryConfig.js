import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";

const API_BASE_URL = "http://46.250.230.34:8081/api/v1/EmployeeSalaryConfig";

// Fetch salaryConfig List
export const getAllEmployeeSalaryConfig = createAsyncThunk(
  "salaryConfig/getAllEmployeeSalaryConfig",
  async (_, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token); // Debugging

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.get(
        `${API_BASE_URL}/GetAllEmployeeSalaryConfig`,
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
        error.response?.data || "Failed to fetch vacation mode"
      );
    }
  }
);

// Add salaryConfig Mode
export const AddEmployeeSalaryConfig = createAsyncThunk(
  "salaryConfig/AddEmployeeSalaryConfig",
  async (data, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token);

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.post(
        `${API_BASE_URL}/AddEmployeeSalaryConfig`,
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
        error.response?.data || "Failed to fetch vacation mode"
      );
    }
  }
);

export const updateEmployeeSalaryConfig = createAsyncThunk(
  "salaryConfig/updateEmployeeSalaryConfig",
  async (data, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token);

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.post(
        `${API_BASE_URL}/UpdateEmployeeSalaryConfig`,
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
        error.response?.data || "Failed to fetch vacation mode"
      );
    }
  }
);

export const getEmployeeSalaryConfigById = createAsyncThunk(
  "salaryConfig/getEmployeeSalaryConfigById",
  async (id, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.get(
        `${API_BASE_URL}/GetEmployeeSalaryConfigById?id=${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch employee salary config"
      );
    }
  }
);


const salaryConfig = createSlice({
  name: "salaryConfig",
  initialState: {
    salaryConfigList: [],
    status: null,
    error: null,
  },
  reducers: {
    clearData: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getAllEmployeeSalaryConfig.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(getAllEmployeeSalaryConfig.fulfilled, (state, action) => {
      state.salaryConfigList = action.payload.data;
      state.status = "success";
      state.error = false;
    });
    builder.addCase(getAllEmployeeSalaryConfig.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    });
    builder.addCase(AddEmployeeSalaryConfig.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(AddEmployeeSalaryConfig.fulfilled, (state, action) => {
      state.status = "success";
      state.error = false;
      state.salaryConfigList.push(action.payload);
    });
    builder.addCase(AddEmployeeSalaryConfig.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    });
    builder.addCase(updateEmployeeSalaryConfig.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(updateEmployeeSalaryConfig.fulfilled, (state, action) => {
      state.status = "success";
      state.error = false;
      state.salaryConfigList = state.salaryConfigList.map((item) =>
        item.id === action.payload.id ? action.payload : item
      );
    });
    builder.addCase(updateEmployeeSalaryConfig.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    });
    builder.addCase(getEmployeeSalaryConfigById.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(getEmployeeSalaryConfigById.fulfilled, (state, action) => {
      state.status = "success";
      state.error = false;
      state.salaryConfigList = action.payload.data;
    });
    builder.addCase(getEmployeeSalaryConfigById.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    });
  },
});

export const { clearData } = salaryConfig.actions;
export default salaryConfig.reducer;
