import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";

// API Base URL
const API_BASE_URL = "http://46.250.230.34:8081/api/v1/MasterData";

// Fetch salaryHead List
export const fetchSalaryHead= createAsyncThunk(
    "salaryHead/fetchSalaryHead",
    async (_, { rejectWithValue }) => {
      try {
        const storedUser = secureLocalStorage.getItem("user");
        const token = storedUser ? JSON.parse(storedUser)?.token : null;
  
        console.log("Retrieved Token:", token); // Debugging
  
        if (!token) {
          console.error("Authorization token missing");
          return rejectWithValue("Authorization token missing");
        }
  
        const response = await axios.get(`${API_BASE_URL}/GetSalaryHeadList`, 
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
  
  // Add salaryHead Mode
  export const addSalaryHead = createAsyncThunk(
    "salaryHead/addSalaryHead",
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
          `${API_BASE_URL}/AddSalaryHead`,
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
          error.response?.data || "Failed to add vacation mode"
        );
      }
    }
  );
  
  // Update salaryHead Mode
  export const updateSalaryHead = createAsyncThunk(
    "salaryHead/updateSalaryHead",
    async (data) => {
      try {
        const storedUser = secureLocalStorage.getItem("user");
        const token = storedUser ? JSON.parse(storedUser)?.token : null;
  
        console.log("Retrieved Token:", token); // Debugging
  
        if (!token) {
          console.error("Authorization token missing");
        }
  
        const response = await axios.post(
          `${API_BASE_URL}/UpdateSalaryHead`,
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
  
  // Fetch salaryHead by ID
  export const getSalaryHeadById = createAsyncThunk(
    "salaryHead/getSalaryHeadById",
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
          `${API_BASE_URL}/GetSalaryHeadByID?id=${id}`,
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

const salaryHeadSlice = createSlice({
  name: "salaryHead",
  initialState: {
    salaryHeadList: [],
    loading: false,
    error: null,
    currentSalaryHead: null,  
  },
  reducers: {
    clearCurrentSalaryHead: (state) => {
      state.currentSalaryHead = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchSalaryHead.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(fetchSalaryHead.fulfilled, (state, action) => {
      state.salaryHeadList = action.payload.data; 
      state.status = "succeeded";
      state.loading = false;
    });
    builder.addCase(fetchSalaryHead.rejected, (state, action) => {
      state.status = "failed";
      state.loading = false;
      state.error = action.payload;
    });
    builder.addCase(addSalaryHead.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(addSalaryHead.fulfilled, (state, action) => {
      if (Array.isArray(state.salaryHeadList)) {
        state.salaryHeadList.push(action.payload);
      } else {
        console.error("salaryHead is not an array");
      }
    });
    builder.addCase(addSalaryHead.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    });
    builder.addCase(updateSalaryHead.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(updateSalaryHead.fulfilled, (state, action) => {
      console.log("Update Salary Head - State:", state);
      console.log("Update Salary Head - Action Payload:", action.payload);

      if (action.payload && action.payload.success) {
        const updatedSalaryHead = action.payload.data;

        if (!Array.isArray(state.salaryHeadList)) {
          console.error(
            "salaryHead is not an array:",
            state.salaryHeadList
          );
          state.salaryHeadList = [];
        }

        const index = state.salaryHeadList.findIndex(
          (vm) => vm.idVacationMode === updatedSalaryHead.idVacationMode
        );

        if (index !== -1) {
          state.salaryHeadList[index] = updatedSalaryHead;
        } else {
          state.salaryHeadList.push(updatedSalaryHead);
        }
      }
    });

    builder.addCase(updateSalaryHead.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    });
    builder.addCase(getSalaryHeadById.pending, (state) => {
      state.status = null;
      state.error = null;
    });
    builder.addCase(getSalaryHeadById.fulfilled, (state, action) => {
      if (action.payload && action.payload.success) {
        state.currentSalaryHead = action.payload.data;
      }
      state.status = "succeeded";
    });
    builder.addCase(getSalaryHeadById.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    });
  },
});

export const { clearError } = salaryHeadSlice.actions;
export default salaryHeadSlice.reducer;
