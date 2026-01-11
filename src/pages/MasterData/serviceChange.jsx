import React, { useEffect, useState, useMemo } from "react";
import CommonService from "../../core/services/CommonService";
import EmployeeManagementService from "../../core/services/EmployeeManagementService";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useLoader } from "../../components/LoaderContext";
import { toast } from "react-toastify";
import moment from "moment";
import secureLocalStorage from "react-secure-storage";

const ServiceChange = () => {
  const { showLoader, hideLoader } = useLoader();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceHistory, setServiceHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Form state for service changes
  const [formData, setFormData] = useState({
    reportingOfficer: {
      current: "",
      new: "",
      effectiveFrom: null,
      remarks: "",
    },
    department: {
      current: "",
      new: "",
      effectiveFrom: null,
      remarks: "",
    },
    designation: {
      current: "",
      new: "",
      effectiveFrom: null,
      remarks: "",
    },
    employmentType: {
      current: "",
      new: "",
      effectiveFrom: null,
      remarks: "",
    },
  });

  const employmentTypes = [
    { value: "Permanent", label: "Permanent" },
    { value: "Contract", label: "Contract" },
    { value: "Temporary", label: "Temporary" },
    { value: "Part-time", label: "Part-time" },
  ];

  useEffect(() => {
    loadEmployees();
    loadDepartmentsAndDesignations();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      loadEmployeeCurrentData();
    } else {
      resetFormData();
    }
  }, [selectedEmployee]);

  const loadEmployees = async () => {
    try {
      showLoader();
      const res = await CommonService.getEmployeeList();
      if (res.data?.data) {
        setEmployees(res.data.data);
      }
    } catch (error) {
      toast.error("Failed to load employees");
      console.error("Error loading employees:", error);
    } finally {
      hideLoader();
    }
  };

  const loadDepartmentsAndDesignations = async () => {
    try {
      const [deptRes, desigRes] = await Promise.all([
        CommonService.getDepartmentsList(),
        CommonService.getDesignationsList(),
      ]);
      if (deptRes.data?.data) {
        setDepartments(deptRes.data.data);
      }
      if (desigRes.data?.data) {
        setDesignations(desigRes.data.data);
      }
    } catch (error) {
      console.error("Error loading departments/designations:", error);
    }
  };

  const loadEmployeeCurrentData = async () => {
    if (!selectedEmployee) return;

    try {
      showLoader();
      const res = await CommonService.getEmployeeById(selectedEmployee.idEmployee);
      if (res.data?.data) {
        const employee = res.data.data;
        
        // Load reporting officer options
        const reportingRes = await CommonService.getEmployeeList();
        const reportingOfficerName = reportingRes.data?.data?.find(
          (emp) => emp.idEmployee.toString() === employee.reportingTo?.toString()
        )?.fullName || "";

        // Get department name from departments array
        const departmentName = departments.find(
          (dept) => dept.idDepartment?.toString() === employee.idDepartment?.toString()
        )?.departmentName || "";

        // Get designation name from designations array
        const designationName = designations.find(
          (desig) => desig.idDesignation?.toString() === employee.idDesignation?.toString()
        )?.designationName || "";

        setFormData({
          reportingOfficer: {
            current: reportingOfficerName || "",
            new: "",
            effectiveFrom: null,
            remarks: "",
          },
          department: {
            current: departmentName || "",
            new: "",
            effectiveFrom: null,
            remarks: "",
          },
          designation: {
            current: designationName || "",
            new: "",
            effectiveFrom: null,
            remarks: "",
          },
          employmentType: {
            current: employee.employmentType || "Permanent",
            new: "",
            effectiveFrom: null,
            remarks: "",
          },
        });
      }
    } catch (error) {
      toast.error("Failed to load employee data");
      console.error("Error loading employee data:", error);
    } finally {
      hideLoader();
    }
  };

  const resetFormData = () => {
    setFormData({
      reportingOfficer: {
        current: "",
        new: "",
        effectiveFrom: null,
        remarks: "",
      },
      department: {
        current: "",
        new: "",
        effectiveFrom: null,
        remarks: "",
      },
      designation: {
        current: "",
        new: "",
        effectiveFrom: null,
        remarks: "",
      },
      employmentType: {
        current: "",
        new: "",
        effectiveFrom: null,
        remarks: "",
      },
    });
  };

  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;

    return employees.filter((employee) => {
      return (
        employee.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.designation?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [employees, searchTerm]);

  const handleEmployeeSelect = (employee) => {
    if (selectedEmployee && selectedEmployee.idEmployee === employee.idEmployee) {
      setSelectedEmployee(null);
    } else {
      setSelectedEmployee(employee);
    }
  };

  const handleInputChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const getCurrentUserId = () => {
    const user = secureLocalStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      return userData.idEmployee || 0;
    }
    return 0;
  };

  const handleSave = async () => {
    // Validate that at least one change is made
    const hasChanges = Object.values(formData).some(
      (section) => section.new && section.effectiveFrom
    );

    if (!hasChanges) {
      toast.error("Please make at least one change with an effective date");
      return;
    }

    if (!selectedEmployee) {
      toast.error("Please select an employee");
      return;
    }

    try {
      showLoader();
      
      // Transform formData to API payload format
      const payload = [];
      const currentUserId = getCurrentUserId();
      const currentDate = moment().toISOString();

      // Map change types
      const changeTypeMap = {
        reportingOfficer: "REPOFFICER",
        department: "DEPARTMENT",
        designation: "DESIGNATION",
        employmentType: "EMPLOYMENTTYPE",
      };

      // Process each section that has changes
      Object.entries(formData).forEach(([sectionKey, sectionData]) => {
        if (sectionData.new && sectionData.effectiveFrom) {
          const changeType = changeTypeMap[sectionKey];
          
          // Get IDs for dropdown selections
          let fromValueID = 0;
          let toValueID = 0;
          let fromValue = sectionData.current;
          let toValue = sectionData.new;

          if (sectionKey === "reportingOfficer") {
            fromValueID = selectedEmployee.reportingTo || 0;
            toValueID = parseInt(sectionData.new) || 0;
            fromValue = sectionData.current || "";
            const toEmployee = employees.find(
              (emp) => emp.idEmployee.toString() === toValueID.toString()
            );
            toValue = toEmployee?.fullName || "";
          } else if (sectionKey === "department") {
            fromValueID = departments.find(
              (dept) => dept.departmentName === sectionData.current
            )?.idDepartment || 0;
            toValueID = parseInt(sectionData.new) || 0;
            const toDept = departments.find(
              (dept) => dept.idDepartment.toString() === sectionData.new
            );
            toValue = toDept?.departmentName || "";
          } else if (sectionKey === "designation") {
            fromValueID = designations.find(
              (desig) => desig.designationName === sectionData.current
            )?.idDesignation || 0;
            toValueID = parseInt(sectionData.new) || 0;
            const toDesig = designations.find(
              (desig) => desig.idDesignation.toString() === sectionData.new
            );
            toValue = toDesig?.designationName || "";
          } else if (sectionKey === "employmentType") {
            // EmploymentType is a string value, not an ID
            fromValue = sectionData.current;
            toValue = sectionData.new;
            fromValueID = 0;
            toValueID = 0;
          }

          payload.push({
            idEmployeeServiceChange: 0,
            idEmployee: selectedEmployee.idEmployee,
            changeType: changeType,
            changeDescription: `${changeType} change from "${fromValue}" to "${toValue}"`,
            fromValue: fromValue,
            toValue: toValue,
            fromValueID: fromValueID,
            toValueID: toValueID,
            changeValidFrom: moment(sectionData.effectiveFrom).toISOString(),
            changedBy: currentUserId,
            remarks: sectionData.remarks || "",
            approvalStatus: "Pending",
            approvedBy: 0,
            approvedDate: null,
            createdBy: currentUserId,
            createdAt: currentDate,
            updatedBy: currentUserId,
            updatedAt: currentDate,
          });
        }
      });

      if (payload.length === 0) {
        toast.error("Please make at least one change with an effective date");
        hideLoader();
        return;
      }

      const result = await EmployeeManagementService.addUpdateEmployeeServiceChanges(payload);
      
      if (result.error) {
        toast.error(result.error || "Failed to save service changes");
      } else {
        toast.success("Service changes saved successfully");
        resetFormData();
        setSelectedEmployee(null);
      }
    } catch (error) {
      toast.error("Failed to save service changes");
      console.error("Error saving service changes:", error);
    } finally {
      hideLoader();
    }
  };

  const handleCancel = () => {
    resetFormData();
    setSelectedEmployee(null);
  };

  const handleViewHistory = async () => {
    if (!selectedEmployee) {
      toast.error("Please select an employee to view history");
      return;
    }

    try {
      showLoader();
      const result = await EmployeeManagementService.getEmployeeServiceChanges({
        IdEmployee: selectedEmployee.idEmployee,
      });

      if (result.error) {
        toast.error(result.error || "Failed to load service history");
      } else {
        setServiceHistory(result.data?.data || []);
        setShowHistoryModal(true);
      }
    } catch (error) {
      toast.error("Failed to load service history");
      console.error("Error loading service history:", error);
    } finally {
      hideLoader();
    }
  };

  const reportingOfficerOptions = useMemo(() => {
    return employees.map((emp) => ({
      value: emp.idEmployee.toString(),
      label: emp.fullName,
    }));
  }, [employees]);

  const departmentOptions = useMemo(() => {
    return departments.map((dept) => ({
      value: dept.idDepartment.toString(),
      label: dept.departmentName,
    }));
  }, [departments]);

  const designationOptions = useMemo(() => {
    return designations.map((desig) => ({
      value: desig.idDesignation.toString(),
      label: desig.designationName,
    }));
  }, [designations]);

  const getChangeTypeLabel = (changeType) => {
    const changeTypeMap = {
      REPOFFICER: "Reporting Officer",
      DEPARTMENT: "Department",
      DESIGNATION: "Designation",
      EMPLOYMENTTYPE: "Employment Type",
    };
    return changeTypeMap[changeType] || changeType;
  };

  const renderServiceChangeSection = (title, sectionKey, options = null) => {
    const section = formData[sectionKey];
    return (
      <div className="card mb-3">
        <div className="card-body">
          <h6 className="card-title mb-3">{title}</h6>
          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label mb-1">Current</label>
              <input
                type="text"
                className="form-control"
                value={section.current}
                readOnly
                disabled
              />
            </div>
            <div className="col-md-4">
              <label className="form-label mb-1">New</label>
              {options ? (
                <select
                  className="form-select"
                  value={section.new}
                  onChange={(e) => handleInputChange(sectionKey, "new", e.target.value)}
                >
                  <option value="">Select {title.split(" ")[0]}</option>
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="form-control"
                  value={section.new}
                  onChange={(e) => handleInputChange(sectionKey, "new", e.target.value)}
                  placeholder={`Enter new ${title.split(" ")[0].toLowerCase()}`}
                />
              )}
            </div>
            <div className="col-md-4">
              <label className="form-label mb-1">Effective From</label>
              <DatePicker
                selected={section.effectiveFrom}
                onChange={(date) => handleInputChange(sectionKey, "effectiveFrom", date)}
                dateFormat="dd-MM-yyyy"
                className="form-control"
                placeholderText="dd-mm-yyyy"
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                wrapperClassName="d-block"
              />
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">
              <label className="form-label mb-1">Remarks</label>
              <textarea
                className="form-control"
                rows="2"
                value={section.remarks}
                onChange={(e) => handleInputChange(sectionKey, "remarks", e.target.value)}
                placeholder="Reason for change"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* History Modal */}
      {showHistoryModal && (
        <div
          className="modal fade show"
          style={{ display: "block" }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header bg-primary">
                <h5 className="modal-title text-white">
                  Service Change History - {selectedEmployee?.fullName}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowHistoryModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {serviceHistory.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    No service change history found
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Change Type</th>
                          <th>From</th>
                          <th>To</th>
                          <th>Effective From</th>
                          <th>Status</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {serviceHistory.map((change, index) => (
                          <tr key={index}>
                            <td>{getChangeTypeLabel(change.changeType)}</td>
                            <td>{change.fromValue}</td>
                            <td>{change.toValue}</td>
                            <td>
                              {change.changeValidFrom
                                ? moment(change.changeValidFrom).format(
                                    "DD-MM-YYYY"
                                  )
                                : "-"}
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  change.approvalStatus === "Approved"
                                    ? "bg-success"
                                    : change.approvalStatus === "Rejected"
                                    ? "bg-danger"
                                    : "bg-warning"
                                }`}
                              >
                                {change.approvalStatus || "Pending"}
                              </span>
                            </td>
                            <td>{change.remarks || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowHistoryModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showHistoryModal && (
        <div className="modal-backdrop fade show"></div>
      )}

      <div className="row">
        {/* Left Sidebar - Employee List */}
        <div className="col-lg-4">
          <div className="card ScreenpermissionCard mb-2 border">
            <div className="card-header d-flex align-items-center justify-content-between px-3 py-3 border-bottom bg-primary text-white">
              <h5 className="m-0 text-white">Employees</h5>
            </div>
            <div className="card-body p-0">
              <div className="p-3 border-bottom">
                <div className="list_searchbox">
                  <input
                    type="search"
                    className="form-control"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <i className="bx bx-search"></i>
                </div>
              </div>
              <div
                className="table-responsive"
                style={{
                  maxHeight: "600px",
                  overflowY: "auto",
                }}
              >
                <table className="table table-sm mb-0">
                  
                  <tbody className="table-border-bottom-0">
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan="2" className="text-center py-3">
                          No employees found
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((employee) => (
                        <tr
                          key={employee.idEmployee}
                          onClick={() => handleEmployeeSelect(employee)}
                          style={{
                            cursor: "pointer",
                            backgroundColor:
                              selectedEmployee?.idEmployee === employee.idEmployee
                                ? "#e7f5e7"
                                : "transparent",
                          }}
                        >
                          <td>
                            <input
                              type="radio"
                              className="form-check-input"
                              name="selectedEmployee"
                              checked={selectedEmployee?.idEmployee === employee.idEmployee}
                              onChange={() => handleEmployeeSelect(employee)}
                            />
                          </td>
                          <td>
                            <div>
                              <strong>{employee.fullName}</strong>
                            </div>
                            {employee.designation && (
                              <div className="text-muted small">{employee.designation}</div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Service Change Form */}
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between px-3 py-3 border-bottom bg-primary text-white">
              <h5 className="m-0 text-white">
                Employee Service Changes
                {selectedEmployee && ` – ${selectedEmployee.fullName}`}
              </h5>
              <button
                className="btn btn-success btn-sm"
                onClick={handleViewHistory}
                disabled={!selectedEmployee}
              >
                View History
              </button>
            </div>
            <div className="card-body">
              {!selectedEmployee ? (
                <div className="text-center py-5 text-muted">
                  Please select an employee from the list to make service changes
                </div>
              ) : (
                <>
                  {renderServiceChangeSection(
                    "Reporting Officer Change",
                    "reportingOfficer",
                    reportingOfficerOptions
                  )}
                  {renderServiceChangeSection(
                    "Department Change",
                    "department",
                    departmentOptions
                  )}
                  {renderServiceChangeSection(
                    "Designation Change",
                    "designation",
                    designationOptions
                  )}
                  {renderServiceChangeSection(
                    "Employment Type Change",
                    "employmentType",
                    employmentTypes
                  )}

                  <div className="d-flex justify-content-end gap-2 mt-3">
                    <button
                      className="btn btn-outline-secondary"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={handleSave}
                    >
                      Save Changes
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceChange;

