import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";

// API Base URL
const API_BASE_URL = "http://46.250.230.34:8081/api/v1/MasterData";


// Fetch Designation List
export const fetchDesignations = createAsyncThunk(
  "designation/fetchDesignations",
  async (_, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token); // Debugging

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }
      const response = await axios.get(`${API_BASE_URL}/GetDesignationList`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data; // Assuming response.data is an array
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch designation"
      );
    }
  }
);

// Add Designation
export const addMasterDesignation = createAsyncThunk(
  "designation/addDesignation",
  async (data, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token);

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.post(`${API_BASE_URL}/AddDesignation`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data; 
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to add Designation"
      );
    }
  }
);

// Update Designation
export const updateDesignations = createAsyncThunk(
  "designation/updateDesignations",
  async (data) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token); // Debugging

      if (!token) {
        console.error("Authorization token missing");
      }
      const response = await axios.post(
        `${API_BASE_URL}/UpdateDesignation`,
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

// Fetch Designation by ID
export const getMasterDesignationListById = createAsyncThunk(
  "designation/getMasterDesignationListById",
  async (id) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token); // Debugging

      if (!token) {
        console.error("Authorization token missing");
      }
      const response = await axios.get(
        `${API_BASE_URL}/GetDesignationByID?Id=${id}`,
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
  name: "designation",
  initialState: {
    designation: [],
    loading: false,
    error: null,
  },
  reducers: {
    resetError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchDesignations.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDesignations.fulfilled, (state, action) => {
      state.designation = action.payload;
      state.loading = false;
      state.error = null;
    });
    builder.addCase(fetchDesignations.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
    builder.addCase(addMasterDesignation.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addMasterDesignation.fulfilled, (state, action) => {
      state.status = "succeeded";

      if (Array.isArray(state.options)) {
        state.options.push(action.payload);
      } else {
        state.options = [action.payload];
      }
    });
    builder.addCase(addMasterDesignation.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
    builder.addCase(updateDesignations.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateDesignations.fulfilled, (state, action) => {
      if (Array.isArray(state.designation)) {
        state.designation = state.designation.map((dept) =>
          dept.idDesignation === action.payload.idDesignation
            ? action.payload
            : dept
        );
      } else {
        state.designation = [action.payload]; 
      }
      state.loading = false;
    });

    builder.addCase(updateDesignations.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
    builder.addCase(getMasterDesignationListById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getMasterDesignationListById.fulfilled, (state, action) => {
      state.loading = false;
      state.options = [action.payload];
    });
    builder.addCase(getMasterDesignationListById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    });
  },
});

export const { clearDesignation } = slice.actions;
export default slice.reducer;
