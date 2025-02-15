import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import NavTabButton from "../../components/navbarButton";
import SingleSelectTable from "../../components/singleSelectTable";
import MultiSelectTable from "../../components/multiSelectTable";
import {
  screenPermission,
  getEmployeePermissionsById,
  manageEmployeePermissions,
  getRoleBasedPermissionsByDesignationId,
  manageRoleBasedPermissions,
} from "../../redux/reducers/screenPermission";
import { getAllEmployeeDetails } from "../../redux/reducers/getAllEmployeeDetails"; // Import the action
import { fetchDesignations } from "../../redux/reducers/designation"; // Import the action

function ScreenPermission() {
  const dispatch = useDispatch();
  const { payrollScreen } = useSelector((state) => state.screenPermission);
  const { options: employeeData } = useSelector(
    (state) => state.getAllEmployeeDetails
  ); // Get employee data from Redux store
  const { designation } = useSelector((state) => state.designation); // Get designation data

  const [activeTab, setActiveTab] = useState("#navs-top-Employee");
  const [selectedDesignation, setSelectedDesignation] = useState(null);
  const [employeePermissions, setEmployeePermissions] = useState([]);
  const [designationPermissions, setDesignationPermissions] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeePermissionIds, setEmployeePermissionIds] = useState({});
  const [designationPermissionIds, setDesignationPermissionIds] = useState({});

  useEffect(() => {
    dispatch(screenPermission());
    dispatch(getAllEmployeeDetails()); // Fetch employee data
    dispatch(fetchDesignations()); // Fetch designations data
  }, [dispatch]);

  useEffect(() => {
    if (payrollScreen?.data?.length > 0) {
      const transformedData = payrollScreen.data.map((screen) => ({
        screenName: screen.screenName,
        view: screen.permission?.includes("V") || false,
        add: screen.permission?.includes("A") || false,
        update: screen.permission?.includes("U") || false,
        delete: screen.permission?.includes("D") || false,
        subMenus:
          screen.subMenus?.map((subMenu) => ({
            screenName: subMenu.screenName,
            view: subMenu.permission?.includes("V") || false,
            add: subMenu.permission?.includes("A") || false,
            update: subMenu.permission?.includes("U") || false,
            delete: subMenu.permission?.includes("D") || false,
          })) || [],
      }));
      setEmployeePermissions(transformedData);
      setDesignationPermissions(transformedData);
    }
  }, [payrollScreen]);

  const handleTabClick = (target) => {
    setActiveTab(target);
  };

  
  const handleSelectDesignation = (selectedRow) => {
    console.log("Selected Designation:", selectedRow);
    const { idDesignation } = selectedRow;
    setSelectedDesignation(selectedRow);
  
    // Fetch the permissions for the selected designation
    dispatch(getRoleBasedPermissionsByDesignationId(idDesignation)).then((response) => {
      const fetchedPermissions = response.payload?.data || [];
      
      // Transform the fetched permissions into a map for easy lookup
      const permissionsMap = fetchedPermissions.reduce((acc, screen) => {
        acc[screen.screenName] = {
          idRolePermission: screen.idRolePermission,
          idPayrollScreen: screen.idPayrollScreen,
          view: screen.permission?.includes("V") || false,
          add: screen.permission?.includes("A") || false,
          update: screen.permission?.includes("U") || false,
          delete: screen.permission?.includes("D") || false,
        };
        return acc;
      }, {});
  
      // Store IDs for updates
      const idsMap = fetchedPermissions.reduce((acc, screen) => {
        acc[screen.screenName] = {
          idRolePermission: screen.idRolePermission,
          idPayrollScreen: screen.idPayrollScreen,
        };
        return acc;
      }, {});
      setDesignationPermissionIds(idsMap);
  
      // Merge fetched permissions with all screens
      const mergedPermissions = Array.isArray(payrollScreen.data)
        ? payrollScreen.data.map((screen) => {
            const screenPermissions = permissionsMap[screen.screenName] || {
              view: false,
              add: false,
              update: false,
              delete: false,
            };
  
            return {
              screenName: screen.screenName,
              view: screenPermissions.view,
              add: screenPermissions.add,
              update: screenPermissions.update,
              delete: screenPermissions.delete,
              subMenus: Array.isArray(screen.subMenus)
                ? screen.subMenus.map((subMenu) => {
                    const subMenuPermissions = permissionsMap[
                      subMenu.screenName
                    ] || {
                      view: false,
                      add: false,
                      update: false,
                      delete: false,
                    };
  
                    return {
                      screenName: subMenu.screenName,
                      view: subMenuPermissions.view,
                      add: subMenuPermissions.add,
                      update: subMenuPermissions.update,
                      delete: subMenuPermissions.delete,
                    };
                  })
                : [],
            };
          })
        : [];
  
      // Update the designationPermissions state
      setDesignationPermissions(mergedPermissions);
    });
  };

  // Headers and data for the Designation tab
  const designationHeaders = ["Designation"];
  const designationData = Array.isArray(designation.data)
    ? designation.data.map((item) => ({
        designation: item.designationName,
        idDesignation: item.idDesignation,
      }))
    : [];

  const columns = [
    { key: "screenName", label: "Screen Name", type: "text" },
    { key: "view", label: "View", type: "checkbox", className: "text-center" },
    { key: "add", label: "Add", type: "checkbox", className: "text-center" },
    {
      key: "update",
      label: "Update",
      type: "checkbox",
      className: "text-center",
    },
    {
      key: "delete",
      label: "Delete",
      type: "checkbox",
      className: "text-center",
    },
  ];

  const handleEmployeeSelectionChange = (updatedData) => {
    const transformedData = updatedData.map((screen) => {
      // Only update the parent screen's permissions
      return {
        ...screen,
        view: screen.view,
        add: screen.add,
        update: screen.update,
        delete: screen.delete,
        // Keep submenus as they are, without modifying their permissions
        subMenus: screen.subMenus.map((subMenu) => ({ ...subMenu })),
      };
    });

    setEmployeePermissions(transformedData);
  };


  const prepareDataForAPI = () => {
    const data = [];
  
    if (activeTab === "#navs-top-Employee") {
      // Handle employee permissions
      employeePermissions.forEach((screen) => {
        const screenIds = employeePermissionIds[screen.screenName] || {};
  
        // Add parent screen permissions
        if (screen.view || screen.add || screen.update || screen.delete) {
          data.push({
            idEmployeePermission: screenIds.idEmployeePermission || 0, // Use existing ID or 0 for new entries
            idEmployee: selectedEmployee?.idEmployee || 0,
            idPayrollScreen: screenIds.idPayrollScreen || 0, // Use existing ID or 0 for new entries
            permission: `${screen.view ? "V" : ""}${screen.add ? "A" : ""}${
              screen.update ? "U" : ""
            }${screen.delete ? "D" : ""}`,
            screenName: screen.screenName,
          });
        }
  
        // Add submenu permissions
        screen.subMenus.forEach((subMenu) => {
          const subMenuIds = employeePermissionIds[subMenu.screenName] || {};
  
          if (subMenu.view || subMenu.add || subMenu.update || subMenu.delete) {
            data.push({
              idEmployeePermission: subMenuIds.idEmployeePermission || 0, // Use existing ID or 0 for new entries
              idEmployee: selectedEmployee?.idEmployee || 0,
              idPayrollScreen: subMenuIds.idPayrollScreen || 0, // Use existing ID or 0 for new entries
              permission: `${subMenu.view ? "V" : ""}${subMenu.add ? "A" : ""}${
                subMenu.update ? "U" : ""
              }${subMenu.delete ? "D" : ""}`,
              screenName: subMenu.screenName,
            });
          }
        });
      });
    } else if (activeTab === "#navs-top-Role") {
      // Handle designation permissions
      designationPermissions.forEach((screen) => {
        const screenIds = designationPermissionIds[screen.screenName] || {};
  
        // Add parent screen permissions
        if (screen.view || screen.add || screen.update || screen.delete) {
          data.push({
            idRolePermission: screenIds.idRolePermission || 0, // Use existing ID or 0 for new entries
            idDesignation: selectedDesignation?.idDesignation || 0,
            idPayrollScreen: screenIds.idPayrollScreen || 0, // Use existing ID or 0 for new entries
            permission: `${screen.view ? "V" : ""}${screen.add ? "A" : ""}${
              screen.update ? "U" : ""
            }${screen.delete ? "D" : ""}`,
            screenName: screen.screenName,
          });
        }
  
        // Add submenu permissions
        screen.subMenus.forEach((subMenu) => {
          const subMenuIds = designationPermissionIds[subMenu.screenName] || {};
  
          if (subMenu.view || subMenu.add || subMenu.update || subMenu.delete) {
            data.push({
              idRolePermission: subMenuIds.idRolePermission || 0, // Use existing ID or 0 for new entries
              idDesignation: selectedDesignation?.idDesignation || 0,
              idPayrollScreen: subMenuIds.idPayrollScreen || 0, // Use existing ID or 0 for new entries
              permission: `${subMenu.view ? "V" : ""}${subMenu.add ? "A" : ""}${
                subMenu.update ? "U" : ""
              }${subMenu.delete ? "D" : ""}`,
              screenName: subMenu.screenName,
            });
          }
        });
      });
    }
  
    return data;
  };

  const handleSubmit = async () => {
    const data = prepareDataForAPI();
    console.log("Data to be saved:", data);
  
    if (data.length === 0) {
      console.warn("No permissions to save.");
      return;
    }
  
    try {
      let response;
      if (activeTab === "#navs-top-Employee") {
        response = await dispatch(manageEmployeePermissions(data)).unwrap();
      } else if (activeTab === "#navs-top-Role") {
        response = await dispatch(manageRoleBasedPermissions(data)).unwrap();
      }
      console.log("API Response:", response);
    } catch (error) {
      console.error("Error saving permissions:", error);
    }
  };

  const handleDesignationSelectionChange = (updatedData) => {
    setDesignationPermissions(updatedData);
  };

  const handleEmployeeSelect = (selectedRow) => {
    console.log("Selected Employee:", selectedRow);
    const { idEmployee } = selectedRow;
    setSelectedEmployee(selectedRow);

    // Fetch the permissions for the selected employee
    dispatch(getEmployeePermissionsById(idEmployee)).then((response) => {
      const fetchedPermissions = response.payload?.data || [];

      // Transform the fetched permissions into a map for easy lookup
      const permissionsMap = fetchedPermissions.reduce((acc, screen) => {
        acc[screen.screenName] = {
          idEmployeePermission: screen.idEmployeePermission,
          idPayrollScreen: screen.idPayrollScreen,
          view: screen.permission?.includes("V") || false,
          add: screen.permission?.includes("A") || false,
          update: screen.permission?.includes("U") || false,
          delete: screen.permission?.includes("D") || false,
        };
        return acc;
      }, {});

      // Store IDs for updates
      const idsMap = fetchedPermissions.reduce((acc, screen) => {
        acc[screen.screenName] = {
          idEmployeePermission: screen.idEmployeePermission,
          idPayrollScreen: screen.idPayrollScreen,
        };
        return acc;
      }, {});
      setEmployeePermissionIds(idsMap);

      // Merge fetched permissions with all screens
      const mergedPermissions = Array.isArray(payrollScreen.data)
        ? payrollScreen.data.map((screen) => {
            const screenPermissions = permissionsMap[screen.screenName] || {
              view: false,
              add: false,
              update: false,
              delete: false,
            };

            return {
              screenName: screen.screenName,
              view: screenPermissions.view,
              add: screenPermissions.add,
              update: screenPermissions.update,
              delete: screenPermissions.delete,
              subMenus: Array.isArray(screen.subMenus)
                ? screen.subMenus.map((subMenu) => {
                    const subMenuPermissions = permissionsMap[
                      subMenu.screenName
                    ] || {
                      view: false,
                      add: false,
                      update: false,
                      delete: false,
                    };

                    return {
                      screenName: subMenu.screenName,
                      view: subMenuPermissions.view,
                      add: subMenuPermissions.add,
                      update: subMenuPermissions.update,
                      delete: subMenuPermissions.delete,
                    };
                  })
                : [],
            };
          })
        : [];

      // Update the employeePermissions state
      setEmployeePermissions(mergedPermissions);
    });
  };

  // "idEmployee": 2,

  // Transform employee data for the SingleSelectTable
  const transformedEmployeeData = employeeData.map((employee) => ({
    idEmployee: employee.idEmployee,
    empCode: employee.employeeCode,
    empName: employee.fullName,
    designation: employee.designation,
  }));

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="pb-3">
        <h5 className="m-0">Screen Permissions</h5>
      </div>

      <div className="row">
        <div className="col-xl-12">
          <div className="nav-align-top mb-4">
            <ul className="nav nav-tabs" role="tablist">
              <NavTabButton
                id="employeeTab"
                label="Employees"
                target="#navs-top-Employee"
                isActive={activeTab === "#navs-top-Employee"}
                onClick={() => handleTabClick("#navs-top-Employee")}
              />
              <NavTabButton
                id="roleTab"
                label="Designations"
                target="#navs-top-Role"
                isActive={activeTab === "#navs-top-Role"}
                onClick={() => handleTabClick("#navs-top-Role")}
              />
            </ul>
            <div className="tab-content">
              <div
                className="tab-pane fade show active"
                id="navs-top-Employee"
                role="tabpanel"
              >
                <div className="row m-0">
                  <div className="col-lg-6 p-1">
                    <SingleSelectTable
                      title="Employee Permissions"
                      headers={["Emp. Code", "Employee Name", "Designation"]}
                      data={transformedEmployeeData} // Pass transformed employee data
                      onSelect={handleEmployeeSelect}
                      searchPlaceholder="Search employees..."
                    />
                  </div>

                  <div className="col-lg-6 p-1">
                    <div className="card border">
                      <div className="card-header d-flex align-items-center justify-content-between p-3 border-bottom">
                        <h5 className="m-0">Screen Permissions</h5>

                      </div>
                      <div className="card-body p-0">
                        <div className="table-responsive">
                          <MultiSelectTable
                            data={employeePermissions}
                            columns={columns}
                            onSelectionChange={handleEmployeeSelectionChange}
                          />
                          <div className="text-center p-2 mt-2">
                            <button
                              className="btn btn-primary btn-sm py-2 px-4 me-2"
                              onClick={handleSubmit}
                            >
                              Submit
                            </button>
                            <button className="btn btn-outline-secondary  btn-sm py-2 px-4">
                              Reset
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="tab-pane fade" id="navs-top-Role" role="tabpanel">
                <div className="row m-0">
                  <div className="col-lg-6 p-1">
                    <SingleSelectTable
                      title="Designation Permissions"
                      headers={designationHeaders}
                      data={designationData} // Pass designation data
                      onSelect={handleSelectDesignation}
                      searchPlaceholder="Search Designations"
                    />
                  </div>

                  <div className="col-lg-6 p-1">
                    <div className="card border">
                      <div className="card-header d-flex align-items-center justify-content-between p-3">
                        <h5 className="m-0">Screen Permissions</h5>
                      </div>
                      <div className="card-body p-0">
                        <div className="table-responsive">
                          <MultiSelectTable
                            data={designationPermissions}
                            columns={columns}
                            onSelectionChange={handleDesignationSelectionChange}
                          />
                          <div className="text-center p-2 mt-2 ">
                            <button
                              className="btn btn-primary btn-sm py-2 px-4 me-2"
                              onClick={handleSubmit}
                            >
                              Submit
                            </button>
                            <button className="btn btn-outline-secondary  btn-sm py-2 px-4">
                              Reset
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScreenPermission;
