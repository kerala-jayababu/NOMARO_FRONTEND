import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";
export const BASE_URL = import.meta.env.VITE_API_URL;

// API Base URL
const API_BASE_URL = `${BASE_URL}/api/v1/MasterData`;

// Fetch Departments List
export const fetchDepartments = createAsyncThunk(
  "department/fetchDepartments",
  async (_, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token); // Debugging

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }
      const response = await axios.get(`${API_BASE_URL}/GetDepartmentList`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data; // Assuming response.data is an array
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch departments"
      );
    }
  }
);

// Add Department
export const addMasterDepartment = createAsyncThunk(
  "department/addDepartment",
  async (data, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token);

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.post(`${API_BASE_URL}/AddDepartment`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data; 
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to add department"
      );
    }
  }
);

// Update Department
export const updateDepartments = createAsyncThunk(
  "department/updateDepartments",
  async (data) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token); // Debugging

      if (!token) {
        console.error("Authorization token missing");
      }
      const response = await axios.post(
        `${API_BASE_URL}/UpdateDepartment`,
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
      return error;
    }
  }
);

// Fetch Department by ID
export const getMasterDepartmentListById = createAsyncThunk(
  "department/getMasterDepartmentListById",
  async (id) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token); // Debugging

      if (!token) {
        console.error("Authorization token missing");
      }
      const response = await axios.get(
        `${API_BASE_URL}/GetDepartmentByID?Id=${id}`,
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

const slice = createSlice({
  name: "department",
  initialState: {
    departments: [],
    loading: false,
    error: null,
  },
  reducers: {
    resetError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchDepartments.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDepartments.fulfilled, (state, action) => {
      state.departments = action.payload;
      state.loading = false;
      state.error = null;
    });
    builder.addCase(fetchDepartments.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
    builder.addCase(addMasterDepartment.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addMasterDepartment.fulfilled, (state, action) => {
      state.status = "succeeded";

      if (Array.isArray(state.options)) {
        state.options.push(action.payload);
      } else {
        state.options = [action.payload];
      }
    });
    builder.addCase(addMasterDepartment.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
    builder.addCase(updateDepartments.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateDepartments.fulfilled, (state, action) => {
      if (Array.isArray(state.departments)) {
        state.departments = state.departments.map((dept) =>
          dept.idDepartment === action.payload.idDepartment
            ? action.payload
            : dept
        );
      } else {
        state.departments = [action.payload]; // Fallback to an array with the updated department
      }
      state.loading = false;
    });

    builder.addCase(updateDepartments.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
    builder.addCase(getMasterDepartmentListById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getMasterDepartmentListById.fulfilled, (state, action) => {
      state.loading = false;
      state.options = [action.payload];
    });
    builder.addCase(getMasterDepartmentListById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
  },
});

export const { resetError} = slice.actions;
export default slice.reducer;
