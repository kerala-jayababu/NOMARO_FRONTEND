import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";

// API Base URL
const API_BASE_URL = "http://46.250.230.34:8081/api/v1/PayRollManagement";

// Fetch List
export const fetchSalaryAdjustments = createAsyncThunk(
  "salaryAdjustments/fetchSalaryAdjustments",
  async (_, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token); // Debugging

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.get(`${API_BASE_URL}/GetAllSalaryAdjustments`,
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
        error.response?.data || "Failed to fetch salary adjustments"
      );
    }
  }
);

// Add 
export const addSalaryAdjustments = createAsyncThunk(
  "salaryAdjustments/addSalaryAdjustments",
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
        `${API_BASE_URL}/AddSalaryAdjustment`,
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
        error.response?.data || "Failed to add salary adjustments"
      );
    }
  }
);

// Update 
export const updateSalaryAdjustments = createAsyncThunk(
  "salaryAdjustments/updateSalaryAdjustments",
  async (data) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token); // Debugging

      if (!token) {
        console.error("Authorization token missing");
      }

      const response = await axios.post(
        `${API_BASE_URL}/UpdateSalaryAdjustment`,
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

// Fetch by ID
export const getSalaryAdjustmentsById = createAsyncThunk(
  "salaryAdjustments/getSalaryAdjustmentsById",
  async (id) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token); // Debugging

      if (!token) {
        console.error("Authorization token missing");
      }
      console.log(id, "id");
      const response = await axios.get(
        `${API_BASE_URL}/GetSalaryAdjustmentById?id=${id}`,
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

const salaryAdjustmentsSlice = createSlice({
  name: "salaryAdjustments",
  initialState: {
    salaryAdjustmentsList: [],
    status: "idle",
    error: null,
  },
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchSalaryAdjustments.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(fetchSalaryAdjustments.fulfilled, (state, action) => {
      state.status = "succeeded";
      state.salaryAdjustmentsList = action.payload;
    });
    builder.addCase(fetchSalaryAdjustments.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    });
    builder.addCase(addSalaryAdjustments.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(addSalaryAdjustments.fulfilled, (state, action) => {
      if (Array.isArray(state.salaryAdjustmentsList)) {
        state.salaryAdjustmentsList.push(action.payload);
      } else {
        console.error("salaryAdjustmentsList is not an array");
      }
    });
    builder.addCase(addSalaryAdjustments.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    });
    builder.addCase(updateSalaryAdjustments.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(updateSalaryAdjustments.fulfilled, (state, action) => {
      console.log("Update Vacation Mode - State:", state);
      console.log("Update Vacation Mode - Action Payload:", action.payload);

      if (action.payload && action.payload.success) {
        const updatedSalaryAdjustments = action.payload.data;

        if (!Array.isArray(state.salaryAdjustmentsList)) {
          console.error(
            "salaryAdjustmentsList is not an array:",
            state.salaryAdjustmentsList
          );
          state.salaryAdjustmentsList = [];
        }

        const index = state.salaryAdjustmentsList.findIndex(
          (vm) => vm.idSalaryAdjustments === updatedSalaryAdjustments.idSalaryAdjustments
        );

        if (index !== -1) {
          state.salaryAdjustmentsList[index] = updatedSalaryAdjustments;
        } else {
          state.salaryAdjustmentsList.push(updatedSalaryAdjustments);
        }
      }
    });

    builder.addCase(updateSalaryAdjustments.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    });
    builder.addCase(getSalaryAdjustmentsById.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(getSalaryAdjustmentsById.fulfilled, (state, action) => {
      if (action.payload && action.payload.success) {
        state.currentSalaryAdjustments = action.payload.data;
      }
    });
    builder.addCase(getSalaryAdjustmentsById.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    });
  },
});

export const { clearError } = salaryAdjustmentsSlice.actions;
export default salaryAdjustmentsSlice.reducer;
