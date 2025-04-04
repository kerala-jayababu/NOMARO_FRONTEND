import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";
import { handleApiSuccessOrError } from "../../core/constants/commons";
export const BASE_URL = import.meta.env.VITE_API_URL;

//const API_BASE_URL = "http://46.250.230.34:8081/api/v1/Employee";



// API Base URL
const API_BASE_URL = `${BASE_URL}/api/v1/Employee`;
// Fetch Employee Bank Accounts By ID
export const getEmployeeBankAccountsByID = createAsyncThunk(
    "employeeBankAccount/GetEmployeeBankAccountsByID",
    async (id) => {
      
      try {
        const storedUser = secureLocalStorage.getItem("user");
        const token = storedUser ? JSON.parse(storedUser)?.token : null;
  
      
  
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
       
        return response.data;
      } catch (error) {
        return error;
      }
    }
  );


export const manageEmployeeBankAccount = createAsyncThunk(
  "employeeBankAccount/ManageEmployeeBankAccount",
  async (data) => {
    try {
      debugger
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;


      if (!token) {
        console.error("Authorization token missing");
      }
      const response = await axios.post(
        `${API_BASE_URL}/ManageEmployeeBankAccounts`,
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
          return handleApiSuccessOrError(error,true);
    }
  }
);  

export const updateEmployeeDetails = createAsyncThunk(
  "employeeBankAccount/UpdateEmployeeDetails",
  async (data) => {
    try {
      debugger
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

    

      if (!token) {
        console.error("Authorization token missing");
      }
      const response = await axios.post(
        `${API_BASE_URL}/UpdateEmployeeDetails`,
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
      return handleApiSuccessOrError(error,true);
    }
  }
);

export const getEmployeeOvertimeConfigsByID = createAsyncThunk(
  "employeeBankAccount/GetEmployeeOvertimeConfigsByID",
  async (id) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

    

      if (!token) {
        console.error("Authorization token missing");
      }
      const response = await axios.get(
        `${API_BASE_URL}/GetEmployeeOvertimeConfigsByID?employeeId=${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
    
      return response.data;
    } catch (error) {
      return handleApiSuccessOrError(error,true);
    }
  }
);

export const manageEmployeeOvertimeConfigs = createAsyncThunk(
  "employeeBankAccount/ManageEmployeeOvertimeConfigs",
  async (data) => {
    try {
      debugger
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

   

      if (!token) {
        console.error("Authorization token missing");
      }
      const response = await axios.post(
        `${API_BASE_URL}/ManageEmployeeOvertimeConfigs`,
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
      return handleApiSuccessOrError(error,true);
    }
  }
);



const employeeProfileSlice = createSlice({
  name: "employeeBankAccount",
  initialState: {
    options: [],
    bankAccounts: [],
    message: "",
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
      state.options = action.payload; //[]
    });

    builder.addCase(getEmployeeBankAccountsByID.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    builder.addCase(manageEmployeeBankAccount.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(manageEmployeeBankAccount.fulfilled, (state, action) => {
      state.loading = false;
      state.options = action.payload; //""  
      if(!Array.isArray(action.payload?.data) ){

        state.message = action.payload.data;
      }
      state.bankAccounts = action.payload;
    });
    builder.addCase(manageEmployeeBankAccount.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    builder.addCase(updateEmployeeDetails.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateEmployeeDetails.fulfilled, (state, action) => {
      state.loading = false;
      state.options = action.payload;
    });
    builder.addCase(updateEmployeeDetails.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    builder.addCase(getEmployeeOvertimeConfigsByID.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getEmployeeOvertimeConfigsByID.fulfilled, (state, action) => {
      state.loading = false;
      state.options = action.payload;
    });
    builder.addCase(getEmployeeOvertimeConfigsByID.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    builder.addCase(manageEmployeeOvertimeConfigs.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(manageEmployeeOvertimeConfigs.fulfilled, (state, action) => {
      state.loading = false;
      state.options = action.payload;
    });
    builder.addCase(manageEmployeeOvertimeConfigs.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});



export default employeeProfileSlice.reducer;

