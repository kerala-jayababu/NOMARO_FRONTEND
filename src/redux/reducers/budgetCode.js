import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";
import { handleApiSuccessOrError } from "../../core/constants/commons";
export const BASE_URL = import.meta.env.VITE_API_URL;

// API Base URL
const API_BASE_URL = `${BASE_URL}/api/v1/MasterData`;

export const fetchBudgetCode = createAsyncThunk(
  "budgetCode/GetBudgetList",
  async (_, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token); // Debugging

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.get(`${API_BASE_URL}/GetBudgetList`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("API Response:", response.data); // Debugging
      return response.data;
    } catch (error) {
      console.error("Fetch Budget Code Error:", error.response);
      // return rejectWithValue(
      //   error.response?.data || "Failed to fetch budget code"
      // );
      return handleApiSuccessOrError(error,true);
    }
  }
);

export const addBudgetCode = createAsyncThunk(
  "budgetCode/AddBudgetCode",
  async (data, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token); // Debugging

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.post(
        `${API_BASE_URL}/AddBudgetCode`, 
        data, // Body (payload)
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("API Response:", response.data); // Debugging
      handleApiSuccessOrError(response.data,false);
      return response.data;
    } catch (error) {
      console.error("Add Budget Code Error:", error.response);
      // return rejectWithValue(
      //   error.response?.data || "Failed to add budget code"
      // );
      return handleApiSuccessOrError(error,true);
    }
  }
);


// Update Budget Code
export const updateBudgetCode = createAsyncThunk(
  "budgetCode/UpdateBudgetCode",
  async (data) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token); // Debugging

      if (!token) {
        console.error("Authorization token missing");
      }

      const response = await axios.post(
        `${API_BASE_URL}/UpdateBudgetCode`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      handleApiSuccessOrError(response.data,false);
      return response.data;
    } catch (error) {
      // return error;
      return handleApiSuccessOrError(error,true);
    }
  }
);

// Fetch Budget Code by ID
export const getBudgetCodeById = createAsyncThunk(
  "budgetCode/GetBudgetById",
  async (id) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token); // Debugging

      if (!token) {
        console.error("Authorization token missing");
      }
      const response = await axios.get(
        `${API_BASE_URL}/GetBudgetById?Id=${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      // return error;
      return handleApiSuccessOrError(error,true);
    }
  }
);

const slice = createSlice({
  name: "budgetCode",
  initialState: {
    options: [],
    // loading: false,
    status: "idle",
    error: null,
  },
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchBudgetCode.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(fetchBudgetCode.fulfilled, (state, action) => {
      state.status = "succeeded";
      state.options = action.payload;
    });
    builder.addCase(fetchBudgetCode.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    });
    builder.addCase(addBudgetCode.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(addBudgetCode.fulfilled, (state, action) => {
      state.status = "succeeded";

      if (Array.isArray(state.options)) {
        state.options.push(action.payload);
      } else {
        state.options = [action.payload];
      }
    });

    builder.addCase(addBudgetCode.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    });
    builder.addCase(updateBudgetCode.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(updateBudgetCode.fulfilled, (state, action) => {
      state.status = "succeeded";
      state.options = state.options.map((option) =>
        option.idBudgetCode === action.payload.idBudgetCode
          ? action.payload
          : option
      );
    });
    builder.addCase(updateBudgetCode.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    });
    builder.addCase(getBudgetCodeById.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(getBudgetCodeById.fulfilled, (state, action) => {
      state.status = "succeeded";
      state.options = [action.payload];
    });
    builder.addCase(getBudgetCodeById.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    });
  },
});

export const { clearError } = slice.actions;
export default slice.reducer;
