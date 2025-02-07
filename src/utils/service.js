import axios from "axios";

const salaryTemplateURL = "http://46.250.230.34:8081/api/v1/SalaryTemplate/";

export const getAllSalaryTemplates = async () => {
  try {
    const response = await axios.get(`${salaryTemplateURL}GetAll`);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const addSalaryTemplate = async (data) => {
  try {
    const response = await axios.post(`${salaryTemplateURL}Add`, data);
    console.log(response, "response-test");
    return response.data;
  } catch (error) {
    return error;
  }
};

export const AddSalaryTemplateDetail = async (data) => {
  try {
    const response = await axios.post(
      `${salaryTemplateURL}AddSalaryTemplateDetail`,
      data
    );
    return response.data;
  } catch (error) {
    return error;
  }
};

export const getSalaryTemplateById = async (id) => {
  try {
    const response = await axios.get(`${salaryTemplateURL}GetById/${id}`);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const updateSalaryTemplate = async (data) => {
  try {
    const response = await axios.post(`${salaryTemplateURL}Update`, data);
    return response.data;
  } catch (error) {
    return error;
  }
};

export const getAllOptions = async () => {
  try {
    const response = await axios.get(
      `http://46.250.230.34:8081/api/v1/Common/GetAllOptions`
    );
    return response;
  } catch (error) {
    return error;
  }
};

export const getEmployeeDetails = async () => {
  try {
    const response = await axios.get(
      `http://46.250.230.34:8081/api/v1/Employee/GetEmployeeList`
    );
    return response.data;
  } catch (error) {
    return error;
  }
};

export const getMasterDepartmentList = async () => {
  try {
    const response = await axios.get(
      `http://46.250.230.34:8081/api/v1/MasterData/GetDepartmentList`
    );
    return response.data;
  } catch (error) {
    return error;
  }
};

export const getMasterDepartmentByID = async (id) => {
  try {
    console.log(id, "test");
    const response = await axios.get(
      `http://46.250.230.34:8081/api/v1/MasterData/GetDepartmentByID?Id=${id}`
    );
    console.log(response, "response");
    return response.data;
  } catch (error) {
    return error;
  }
};

export const updateMasterDepartment = async (data) => {
  try {
    const response = await axios.post(
      `http://46.250.230.34:8081/api/v1/MasterData/UpdateDepartment`,
      data
    );
    return response.data;
  } catch (error) {
    return error;
  }
};

export const addMasterDepartment = async (data) => {
  try {
    const response = await axios.post(
      `http://46.250.230.34:8081/api/v1/MasterData/AddDepartment`,
      data
    );
    return response.data;
  } catch (error) {
    return error;
  }
};

export const getBudgetList = async () => {
  try {
    const response = await axios.get(
      `http://46.250.230.34:8081/api/v1/MasterData/GetBudgetList`
    );
    return response.data;
  } catch (error) {
    return error;
  }
};

export const getBudgetById = async (id) => {
  try {
    console.log(id, "test");
    const response = await axios.get(
      `http://46.250.230.34:8081/api/v1/MasterData/GetBudgetById?Id=${id}`
    );
    console.log(response, "response");
    return response.data;
  } catch (error) {
    return error;
  }
};

export const addBudgetCode = async (data) => {
  try {
    const response = await axios.post(
      `http://46.250.230.34:8081/api/v1/MasterData/AddBudgetCode`,
      data
    );
    return response.data;
  } catch (error) {
    return error;
  }
};

export const updateBudgetCode = async (data) => {
  try {
    const response = await axios.post(
      `http://46.250.230.34:8081/api/v1/MasterData/UpdateBudgetCode`,
      data
    );
    return response.data;
  } catch (error) {
    return error;
  }
};

export const getDesignationList = async () => {
  try {
    const response = await axios.get(
      `http://46.250.230.34:8081/api/v1/MasterData/getMasterDesignationListById`
    );
    return response.data;
  } catch (error) {
    return error;
  }
};

export const getDesignationById = async (id) => {
  try {
    const response = await axios.get(
      `http://46.250.230.34:8081/api/v1/MasterData/GetDesignationByID?Id=${id}`
    );
    return response.data;
  } catch (error) {
    return error;
  }
};

export const addDesignation = async (data) => {
  try {
    const response = await axios.post(
      `http://46.250.230.34:8081/api/v1/MasterData/AddDesignation`,
      data
    );
    return response.data;
  } catch (error) {
    return error;
  }
};

export const updateDesignation = async (data) => {
  try {
    const response = await axios.post(
      `http://46.250.230.34:8081/api/v1/MasterData/UpdateDesignation`,
      data
    );
    return response.data;
  } catch (error) {
    return error;
  }
};

export const getSalaryHeadList = async () => {
  try {
    const response = await axios.get(
      `http://46.250.230.34:8081/api/v1/MasterData/GetSalaryHeadList`
    );
    return response.data;
  } catch (error) {
    return error;
  }
};

export const getSalaryHeadById = async (id) => {
  try {
    const response = await axios.get(
      `http://46.250.230.34:8081/api/v1/MasterData/GetSalaryHeadByID?Id=${id}`
    );
    return response.data;
  } catch (error) {
    return error;
  }
};

export const addSalaryHead = async (data) => {
  try {
    const response = await axios.post(
      `http://46.250.230.34:8081/api/v1/MasterData/AddSalaryHead`,
      data
    );
    return response.data;
  } catch (error) {
    return error;
  }
};

export const updateSalaryHead = async (data) => {
  try {
    const response = await axios.post(
      `http://46.250.230.34:8081/api/v1/MasterData/UpdateSalaryHead`,
      data
    );
    return response.data;
  } catch (error) {
    return error;
  }
};


export const getVacationModeList = async () => {
  try {
    const response = await axios.get(
      `http://46.250.230.34:8081/api/v1/MasterData/GetAllVacationModes`
    );
    return response.data;
  } catch (error) {
    return error;
  }
};

export const getEmployeeDetailsById = async (id) => {
  try {
    const response = await axios.get(
      `http://46.250.230.34:8081/api/v1/Employee/GetEmployeeDetailsByID?Id=${id}`
    );
    return response.data;
  } catch (error) {
    return error;
  }
};

export const getEmployeeProfileById = async (id) => {
  try {
    const response = await axios.get(
      `http://46.250.230.34:8081/api/v1/Employee/GetEmployeeProfileByID?Id=${id}`
    );
    return response.data;
  } catch (error) {
    return error;
  }
};