import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";


const API_BASE_URL = "http://46.250.230.34:8081/api/v1/Common";

export const getAllOptions = createAsyncThunk(
  "common/getAllOptions",
  async (_, { rejectWithValue }) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token); // Debugging

      if (!token) {
        console.error("Authorization token missing");
        return rejectWithValue("Authorization token missing");
      }
      const response = await axios.get(`${API_BASE_URL}/GetAllOptions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch options");
    }
  }
);

const slice = createSlice({
  name: "getAllOptions",
  initialState: {
    options: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getAllOptions.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getAllOptions.fulfilled, (state, action) => {
      state.loading = false;
      state.options = action.payload;
    });
    builder.addCase(getAllOptions.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export default slice.reducer;

