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
  ); 
  const { designation } = useSelector((state) => state.designation); 

  const [activeTab, setActiveTab] = useState("#navs-top-Employee");
  const [selectedDesignation, setSelectedDesignation] = useState(null);
  const [employeePermissions, setEmployeePermissions] = useState([]);
  const [designationPermissions, setDesignationPermissions] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeePermissionIds, setEmployeePermissionIds] = useState({});
  const [designationPermissionIds, setDesignationPermissionIds] = useState({});
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
const [designationSearchTerm, setDesignationSearchTerm] = useState("");

  useEffect(() => {
    dispatch(screenPermission());
    dispatch(getAllEmployeeDetails()); // Fetch employee data
    dispatch(fetchDesignations()); // Fetch designations data
  }, [dispatch]);

  useEffect(() => {
    if (payrollScreen?.data?.length > 0) {
      const transformedData = payrollScreen.data.map((screen) => ({
        screenName: screen.screenName,
        idPayrollScreen: screen.idPayrollScreen,
        idEmployeePermission: screen.idEmployeePermission,
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
    // Reset permissions when switching tabs
    if (target === "#navs-top-Employee") {
      // Clear employee permissions when switching to Employee tab
     setSelectedDesignation(null);
      setEmployeePermissions((prevPermissions) => prevPermissions.map(screen => ({
        ...screen,
        view: false,
        add: false,
        update: false,
        delete: false,
        subMenus: screen.subMenus.map(subMenu => ({
          ...subMenu,
          view: false,
          add: false,
          update: false,
          delete: false,
        }))
      })));
    } else if (target === "#navs-top-Role") {
      setSelectedEmployee(null);
      // Clear designation permissions when switching to Designation tab
      setDesignationPermissions((prevPermissions) => prevPermissions.map(screen => ({
        ...screen,
        view: false,
        add: false,
        update: false,
        delete: false,
        subMenus: screen.subMenus.map(subMenu => ({
          ...subMenu,
          view: false,
          add: false,
          update: false,
          delete: false,
        }))
      })));
    }
  };
  
  const handleSelectDesignation = (selectedRow) => {
    console.log("Selected Designation:", selectedRow);
    const { idDesignation } = selectedRow;
    setSelectedDesignation(selectedRow);

    dispatch(getRoleBasedPermissionsByDesignationId(idDesignation)).then(
      (response) => {
        const fetchedPermissions = response.payload?.data || [];

        const idsMap = {};
        const permissionsMap = {};

        fetchedPermissions.forEach((screen) => {
          idsMap[screen.screenName] = {
            idRolePermission: screen.idRolePermission,
            idPayrollScreen: screen.idPayrollScreen,
          };

          permissionsMap[screen.screenName] = {
            view: screen.validPermissions?.includes("V") || false,
            add: screen.validPermissions?.includes("A") || false,
            update: screen.validPermissions?.includes("U") || false,
            delete: screen.validPermissions?.includes("D") || false,
          };

          screen.subMenus?.forEach((subMenu) => {
            idsMap[subMenu.screenName] = {
              idRolePermission: subMenu.idRolePermission,
              idPayrollScreen: subMenu.idPayrollScreen,
            };

            permissionsMap[subMenu.screenName] = {
              view: subMenu.validPermissions?.includes("V") || false,
              add: subMenu.validPermissions?.includes("A") || false,
              update: subMenu.validPermissions?.includes("U") || false,
              delete: subMenu.validPermissions?.includes("D") || false,
            };
          });
        });

        setDesignationPermissionIds(idsMap);

        const mergedPermissions = Array.isArray(payrollScreen.data)
          ? payrollScreen.data.map((screen) => {
              const screenPermissions = permissionsMap[screen.screenName] || {
                view: false,
                add: false,
                update: false,
                delete: false,
              };

              return {
                ...screen,
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
                        ...subMenu,
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

        setDesignationPermissions(mergedPermissions);
      }
    );
  };



  const handleReset = () => {
    if (activeTab === "#navs-top-Employee") {
      // Reset employee data
      setSelectedEmployee(null);
      setEmployeePermissions((prevPermissions) => prevPermissions.map(screen => ({
        ...screen,
        view: false,
        add: false,
        update: false,
        delete: false,
        subMenus: screen.subMenus.map(subMenu => ({
          ...subMenu,
          view: false,
          add: false,
          update: false,
          delete: false,
        }))
      })));
    } else if (activeTab === "#navs-top-Role") {
      // Reset designation data
      setSelectedDesignation(null);
      setDesignationPermissions((prevPermissions) => prevPermissions.map(screen => ({
        ...screen,
        view: false,
        add: false,
        update: false,
        delete: false,
        subMenus: screen.subMenus.map(subMenu => ({
          ...subMenu,
          view: false,
          add: false,
          update: false,
          delete: false,
        }))
      })));
    }
  };
  

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
      employeePermissions.forEach((screen) => {
        const screenIds = employeePermissionIds[screen.screenName] || {};

        if (screen.view || screen.add || screen.update || screen.delete) {
          data.push({
            idEmployeePermission: screenIds.idEmployeePermission || 0,
            idEmployee: selectedEmployee?.idEmployee || 0,
            idPayrollScreen: screenIds.idPayrollScreen,
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
              idEmployeePermission: subMenuIds.idEmployeePermission || 0,
              idEmployee: selectedEmployee?.idEmployee || 0,
              idPayrollScreen: subMenuIds.idPayrollScreen || 0,
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
        console.log("Screen:", selectedDesignation);
        console.log("screenIds:", screenIds);
        // Add parent screen permissions
        if (screen.view || screen.add || screen.update || screen.delete) {
          data.push({
            idRolePermission: screenIds.idRolePermission || 0,
            idDesignation: selectedDesignation.idDesignation,
            idPayrollScreen: screenIds.idPayrollScreen || 0,
            permission: `${screen.view ? "V" : ""}${
              screen.add ? "A" : ""
            }${screen.update ? "U" : ""}${screen.delete ? "D" : ""}`,
            screenName: screen.screenName,
            rolePermissions: screen.rolePermissions,
          });
        }

        screen.subMenus.forEach((subMenu) => {
          const subMenuIds = designationPermissionIds[subMenu.screenName] || {};

          if (subMenu.view || subMenu.add || subMenu.update || subMenu.delete) {
            data.push({
              idRolePermission: subMenuIds.idRolePermission || 0,
              idDesignation: selectedDesignation?.idDesignation || 0,
              idPayrollScreen: subMenuIds.idPayrollScreen || 0,
              permission: `${subMenu.view ? "V" : ""}${
                subMenu.add ? "A" : ""
              }${subMenu.update ? "U" : ""}${subMenu.delete ? "D" : ""}`,
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
    const transformedData = updatedData.map((screen) => {
      return {
        ...screen,
        view: screen.view,
        add: screen.add,
        update: screen.update,
        delete: screen.delete,
        subMenus: screen.subMenus.map((subMenu) => ({ ...subMenu })),
      };
    });

    setDesignationPermissions(transformedData);
  };

  const handleEmployeeSelect = (selectedRow) => {
    if (selectedRow) {
      console.log("Selected Employee:", selectedRow);
      const { idEmployee } = selectedRow;
      setSelectedEmployee(selectedRow);
  
      // Fetch the permissions for the selected employee
      dispatch(getEmployeePermissionsById(idEmployee)).then((response) => {
        const fetchedPermissions = response.payload?.data || [];
  
        const idsMap = {};
        const permissionsMap = {};
  
        // Process fetched permissions
        fetchedPermissions.forEach((screen) => {
          // Store IDs for parent screens
          idsMap[screen.screenName] = {
            idEmployeePermission: screen.idEmployeePermission,
            idPayrollScreen: screen.idPayrollScreen,
          };
  
          // Store permissions for parent screens
          permissionsMap[screen.screenName] = {
            view: screen.validPermissions?.includes("V") || false,
            add: screen.validPermissions?.includes("A") || false,
            update: screen.validPermissions?.includes("U") || false,
            delete: screen.validPermissions?.includes("D") || false,
          };
  
          // Process submenu permissions
          screen.subMenus?.forEach((subMenu) => {
            // Store IDs for submenus
            idsMap[subMenu.screenName] = {
              idEmployeePermission: subMenu.idEmployeePermission,
              idPayrollScreen: subMenu.idPayrollScreen,
            };
  
            // Store permissions for submenus
            permissionsMap[subMenu.screenName] = {
              view: subMenu.validPermissions?.includes("V") || false,
              add: subMenu.validPermissions?.includes("A") || false,
              update: subMenu.validPermissions?.includes("U") || false,
              delete: subMenu.validPermissions?.includes("D") || false,
            };
          });
        });
  
        // Update the state with the IDs map
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
                ...screen,
                view: screenPermissions.view,
                add: screenPermissions.add,
                update: screenPermissions.update,
                delete: screenPermissions.delete,
                subMenus: Array.isArray(screen.subMenus)
                  ? screen.subMenus.map((subMenu) => {
                      const subMenuPermissions = permissionsMap[subMenu.screenName] || {
                        view: false,
                        add: false,
                        update: false,
                        delete: false,
                      };
  
                      return {
                        ...subMenu,
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
  
        // Update the employeePermissions state with merged permissions
        setEmployeePermissions(mergedPermissions);
      });
    } else {
      // Handle deselection
      setSelectedEmployee(null);
      // Reset permissions to initial state
      setEmployeePermissions(payrollScreen.data?.map(screen => ({
        ...screen,
        view: false,
        add: false,
        update: false,
        delete: false,
        subMenus: screen.subMenus?.map(subMenu => ({
          ...subMenu,
          view: false,
          add: false,
          update: false,
          delete: false,
        })) || []
      })) || []);
      setEmployeePermissionIds({});
    }
  };
  

  const transformedEmployeeData = employeeData.map((employee) => ({
    idEmployee: employee.idEmployee,
    empCode: employee.employeeCode,
    empName: employee.fullName,
    designation: employee.designation,
  }));

  const filteredEmployeeData = transformedEmployeeData.filter((employee) => {
    return (
      employee.empCode.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
      employee.empName.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
      employee.designation.toLowerCase().includes(employeeSearchTerm.toLowerCase())
    );
  });
  
  const filteredDesignationData = designationData.filter((designation) => {
    return designation.designation
      .toLowerCase()
      .includes(designationSearchTerm.toLowerCase());
  });

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
                      data={filteredEmployeeData} // Pass transformed employee data
                      onSelect={handleEmployeeSelect}
                      searchPlaceholder="Search employees..."
                      selectedRow={selectedEmployee} // Add this line
                      searchTerm={employeeSearchTerm} // Pass search term
                      onSearchChange={setEmployeeSearchTerm} // Pass search handler
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
                            <button
                              className="btn btn-outline-secondary btn-sm py-2 px-4"
                              onClick={handleReset}
                            >
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
                      data={filteredDesignationData} // Pass designation data
                      onSelect={handleSelectDesignation}
                      searchPlaceholder="Search Designations"
                      searchTerm={designationSearchTerm} // Pass search term
                      onSearchChange={setDesignationSearchTerm} // Pass search handler
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
