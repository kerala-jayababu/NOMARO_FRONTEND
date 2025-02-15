import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";

const API_BASE_URL = "http://46.250.230.34:8081/api/v1/SalaryTemplate/";

export const getAllSalaryTemplates = createAsyncThunk(
  "salaryTemplate/getAllSalaryTemplates",
  async (_, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token); // Debugging

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }
      const response = await axios.get(`${API_BASE_URL}GetAllSalaryTemplates`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Add Department
export const addSalaryTemplate = createAsyncThunk(
  "salaryTemplate/addSalaryTemplate",
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
        `${API_BASE_URL}AddSalaryTemplate`,
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
        error.response?.data || "Failed to add department"
      );
    }
  }
);



export const getSalaryTemplateById = createAsyncThunk(
  "salaryTemplate/getSalaryTemplateById",
  async (id, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token);

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.get(`${API_BASE_URL}GetSalaryTemplateById?id=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const updateSalaryTemplate = createAsyncThunk(
  "salaryTemplate/updateSalaryTemplate",
  async (data, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token);

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }

      const response = await axios.post(`${API_BASE_URL}UpdateSalaryTemplate`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const salaryTemplateSlice = createSlice({
  name: "salaryTemplate",
  initialState: {
    salaryTemplates: [],
    salaryTemplateDetails: [],
    status: null,
    error: null,
  },
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getAllSalaryTemplates.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(getAllSalaryTemplates.fulfilled, (state, action) => {
      state.status = "success";
      state.salaryTemplates = action.payload;
      state.error = null;
    });
    builder.addCase(getAllSalaryTemplates.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    });
    builder.addCase(addSalaryTemplate.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(addSalaryTemplate.fulfilled, (state, action) => {
      state.status = "success";
      state.error = null;
      if (Array.isArray(state.salaryTemplates)) {
        state.salaryTemplates.push(action.payload);
      } else {
        state.salaryTemplates = [action.payload];
      }    });
    builder.addCase(addSalaryTemplate.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    });
    builder.addCase(updateSalaryTemplate.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addCase(updateSalaryTemplate.fulfilled, (state, action) => {
      state.status = "success";
      state.error = null;
      if (Array.isArray(state.salaryTemplates)) {
        state.salaryTemplates = state.salaryTemplates.map((template) =>
          template.id === action.payload.id ? action.payload : template
        );
      } else {
        state.salaryTemplates = [action.payload];
      }
    });
    builder.addCase(updateSalaryTemplate.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    });
    builder.addCase(getSalaryTemplateById.pending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    // builder.addCase(getSalaryTemplateById.fulfilled, (state, action) => {
    //   state.status = "success";
    //   state.error = null;
    //   state.salaryTemplates = action.payload.data;
    //   state.salaryTemplateDetails = action.payload.data.salaryTemplateDetails;
    // });
    builder.addCase(getSalaryTemplateById.fulfilled, (state, action) => {
        state.status = "success";
        state.error = null;
        state.selectedTemplate = action.payload.data;
        state.salaryTemplateDetails = action.payload.data.salaryTemplateDetails;
      });
      
    builder.addCase(getSalaryTemplateById.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.payload.data;
    });
  },
});

export const { clearError } = salaryTemplateSlice.actions;
export default salaryTemplateSlice.reducer;
