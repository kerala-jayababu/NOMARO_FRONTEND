import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";
import designation from "./designation";
import { handleApiSuccessOrError } from "../../core/constants/commons";
export const BASE_URL = import.meta.env.VITE_API_URL;
const API_BASE_URL = `${BASE_URL}/api/v1/RoleBasedScreens`;

export const screenPermission = createAsyncThunk(
  "screenPermission/GetScreenPermission",
  async () => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token); // Debugging

      if (!token) {
        console.error("Authorization token missing");
      }
      const appType = "PAYROLL";
      const response = await axios.get(`${API_BASE_URL}/GetAllPayrollScreens`, {
        params: { appType }, // query string ?appType=PAYROLL
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      // return error;
      return handleApiSuccessOrError(error, true);
    }
  }
);

export const getEmployeePermissionsById = createAsyncThunk(
  "screenPermission/GetEmployeePermissionsById",
  async (employeeId) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token); // Debugging

      if (!token) {
        console.error("Authorization token missing");
      }
      const response = await axios.get(
        `${API_BASE_URL}/GetEmployeePermissionsById?id=${employeeId}`,
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
      return handleApiSuccessOrError(error, true);
    }
  }
);

export const manageEmployeePermissions = createAsyncThunk(
  "screenPermission/ManageEmployeePermissions",
  async (data) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token); // Debugging

      if (!token) {
        console.error("Authorization token missing");
      }
      const response = await axios.post(
        `${API_BASE_URL}/ManageEmployeePermissions`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      handleApiSuccessOrError(response.data, false);
      return response.data;
    } catch (error) {
      console.log("error", error);
      return handleApiSuccessOrError(error, true);
      // return error;
    }
  }
);

export const getRoleBasedPermissionsByDesignationId = createAsyncThunk(
  "screenPermission/GetRoleBasedPermissionsByDesignationId",
  async (id) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token); // Debugging

      if (!token) {
        console.error("Authorization token missing");
      }
      const response = await axios.get(
        `${API_BASE_URL}/GetRoleBasedPermissionsByDesignationId?designationId=${id}`,
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
      return handleApiSuccessOrError(error, true);
    }
  }
);

export const manageRoleBasedPermissions = createAsyncThunk(
  "screenPermission/ManageRoleBasedPermissions",
  async (data) => {
    try {
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      console.log("Retrieved Token:", token); // Debugging

      if (!token) {
        console.error("Authorization token missing");
      }
      const response = await axios.post(
        `${API_BASE_URL}/ManageRoleBasedPermissions`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      handleApiSuccessOrError(response.data, false);
      return response.data;
    } catch (error) {
      // return error;
      return handleApiSuccessOrError(error, true);
    }
  }
);

const screenPermissionSlice = createSlice({
  name: "screenPermission",
  initialState: {
    payrollScreen: [],
    employeePermissionn: [],
    designationPermission: [],
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(screenPermission.pending, (state) => {
      state.error = null;
    });
    builder.addCase(screenPermission.fulfilled, (state, action) => {
      state.payrollScreen = action.payload;
    });
    builder.addCase(screenPermission.rejected, (state, action) => {
      state.error = action.error.message;
    });
    builder.addCase(getEmployeePermissionsById.pending, (state) => {
      state.error = null;
    });
    builder.addCase(getEmployeePermissionsById.fulfilled, (state, action) => {
      state.employeePermissionn = action.payload.data;
    });
    builder.addCase(getEmployeePermissionsById.rejected, (state, action) => {
      state.error = action.error.message;
    });
    builder.addCase(manageEmployeePermissions.pending, (state) => {
      state.error = null;
    });
    builder.addCase(manageEmployeePermissions.fulfilled, (state, action) => {
      state.employeePermissionn = action.payload.data;
    });
    builder.addCase(manageEmployeePermissions.rejected, (state, action) => {
      state.error = action.error.message;
    });
    builder.addCase(getRoleBasedPermissionsByDesignationId.pending, (state) => {
      state.error = null;
    });
    builder.addCase(
      getRoleBasedPermissionsByDesignationId.fulfilled,
      (state, action) => {
        state.designationPermission = action.payload.data;
      }
    );
    builder.addCase(
      getRoleBasedPermissionsByDesignationId.rejected,
      (state, action) => {
        state.error = action.error.message;
      }
    );
    builder.addCase(manageRoleBasedPermissions.pending, (state) => {
      state.error = null;
    });
    builder.addCase(manageRoleBasedPermissions.fulfilled, (state, action) => {
      state.designationPermission = action.payload.data;
    });
    builder.addCase(manageRoleBasedPermissions.rejected, (state, action) => {
      state.error = action.error.message;
    });
  },
});

export default screenPermissionSlice.reducer;
