import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";

// API Base URL
const API_BASE_URL = "http://46.250.230.34:8081/api/v1/MasterData";

// Fetch Vacation Mode List
export const fetchVacationMode = createAsyncThunk(
  "vacationMode/fetchVacationMode",
  async (_, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token); // Debugging

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.get(`${API_BASE_URL}/GetAllVacationModes`, 
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

// Add Vacation Mode
export const addVacationMode = createAsyncThunk(
  "vacationMode/addVacationMode",
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
        `${API_BASE_URL}/AddVacationMode`,
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

// Update Vacation Mode
export const updateVacationMode = createAsyncThunk(
  "vacationMode/updateVacationMode",
  async (data) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token); // Debugging

      if (!token) {
        console.error("Authorization token missing");
      }

      const response = await axios.post(
        `${API_BASE_URL}/UpdateVacationMode`,
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

// Fetch Vacation Mode by ID
export const getVacationModeById = createAsyncThunk(
  "vacationMode/getVacationModeById",
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
        `${API_BASE_URL}/GetVacationModeById?id=${id}`,
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

const vacationModeSlice = createSlice({
  name: "vacationMode",
  initialState: {
    vacationModeList: [],
    status: "idle",
    error: null,
  },
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchVacationMode.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(fetchVacationMode.fulfilled, (state, action) => {
      state.status = "succeeded";
      state.vacationModeList = action.payload;
    });
    builder.addCase(fetchVacationMode.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    });
    builder.addCase(addVacationMode.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(addVacationMode.fulfilled, (state, action) => {
      if (Array.isArray(state.vacationModeList)) {
        state.vacationModeList.push(action.payload);
      } else {
        console.error("vacationModeList is not an array");
      }
    });
    builder.addCase(addVacationMode.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    });
    builder.addCase(updateVacationMode.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(updateVacationMode.fulfilled, (state, action) => {
      console.log("Update Vacation Mode - State:", state);
      console.log("Update Vacation Mode - Action Payload:", action.payload);

      if (action.payload && action.payload.success) {
        const updatedVacationMode = action.payload.data;

        if (!Array.isArray(state.vacationModeList)) {
          console.error(
            "vacationModeList is not an array:",
            state.vacationModeList
          );
          state.vacationModeList = [];
        }

        const index = state.vacationModeList.findIndex(
          (vm) => vm.idVacationMode === updatedVacationMode.idVacationMode
        );

        if (index !== -1) {
          state.vacationModeList[index] = updatedVacationMode;
        } else {
          state.vacationModeList.push(updatedVacationMode);
        }
      }
    });

    builder.addCase(updateVacationMode.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    });
    builder.addCase(getVacationModeById.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(getVacationModeById.fulfilled, (state, action) => {
      if (action.payload && action.payload.success) {
        state.currentVacationMode = action.payload.data;
      }
    });
    builder.addCase(getVacationModeById.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    });
  },
});

export const { clearError } = vacationModeSlice.actions;
export default vacationModeSlice.reducer;
