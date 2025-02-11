import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";


const API_BASE_URL = "http://46.250.230.34:8081/api/v1/Employee";


// Fetch Employee Bank Accounts By ID
export const getEmployeeBankAccountsByID = createAsyncThunk(
    "employeeBankAccount/GetEmployeeBankAccountsByID",
    async (id) => {
        console.log(id, "response.id");
      try {
        const storedUser = secureLocalStorage.getItem("user");
        const token = storedUser ? JSON.parse(storedUser)?.token : null;
  
        console.log("Retrieved Token:", token); // Debugging
  
        if (!token) {
          console.error("Authorization token missing");
        }
        const response = await axios.get(
          `${API_BASE_URL}/GetEmployeeBankAccountsByID?Id=${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log(id, "response.id");
        console.log(response.data, "response.data");
        return response.data;
      } catch (error) {
        return error;
      }
    }
  );

const employeeProfileSlice = createSlice({
    name: "employeeBankAccount",
    initialState: {
     
      options: [],
      loading: false,
      error: null,
      
    },
    reducers: {},
    extraReducers: (builder) => {
      builder.addCase(getEmployeeBankAccountsByID.pending, (state) => {
        state.loading = true;
        state.error = null;
      });
      builder.addCase(getEmployeeBankAccountsByID.fulfilled, (state, action) => {
        state.loading = false;
        
        state.options = action.payload;
      
      });
      
      builder.addCase(getEmployeeBankAccountsByID.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
    },
  });
  
  

export default employeeProfileSlice.reducer;

