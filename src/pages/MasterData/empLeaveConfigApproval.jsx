import { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import Grid from "../../components/grid";
import Button from "../../components/button";
import Pagination from "../../components/pagination";
import {
  fetchEmployeeLeaveSetup,
  fetchLeaveSetupOfAnEmployee,
  approveEmployeeLeaveConfig,
} from "../../redux/reducers/employeeLeaveConfig";
import { fetchLeaveTemplateById, fetchDesignationList } from "../../redux/reducers/leaveTemplate";
import { getAllEmployeeDetails } from "../../redux/reducers/getAllEmployeeDetails";
import CommonService from "../../core/services/CommonService";
import { toast } from "react-toastify";

const EmpLeaveConfigApproval = () => {
  const dispatch = useDispatch();
  const { employeeLeaveSetupList, loading, error } = useSelector(
    (state) => state.employeeLeaveConfig
  );
  const { designationList } = useSelector((state) => state.leaveTemplate);
  const { options: employeeList } = useSelector((state) => state.getAllEmployeeDetails);

  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("SUBMITTED");
  const [designationFilter, setDesignationFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [workYears, setWorkYears] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [templateAllocations, setTemplateAllocations] = useState([]);
  const [currentStatus, setCurrentStatus] = useState("");

  // Status filter options
  const statusOptions = [
    { value: "ALL", label: "All Status" },
    { value: "SUBMITTED", label: "Submitted" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
  ];

  // Fetch work years from API on component mount
  useEffect(() => {
    const fetchWorkYears = async () => {
      const result = await CommonService.getAllWorkYears();
      if (!result.error && result.data) {
        setWorkYears(result.data);
        // Set default year filter based on financial year (July 1 - June 30)
        if (result.data.length > 0 && !yearFilter) {
          const today = new Date();
          const currentMonth = today.getMonth() + 1;
          const currentYear = today.getFullYear();
          const financialYearStart = currentMonth >= 7 ? currentYear : currentYear - 1;

          const currentWorkYear = result.data.find((year) => {
            if (!year.displayText) return false;
            const firstYear = year.displayText.split("-")[0];
            return firstYear === String(financialYearStart);
          });
          if (currentWorkYear) {
            setYearFilter(String(currentWorkYear.idWorkYear));
          } else {
            setYearFilter(String(result.data[0].idWorkYear));
          }
        }
      }
    };
    fetchWorkYears();
  }, []);

  // Get previous, current, and next financial year start years
  const getRelevantYears = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const financialYearStart = currentMonth >= 7 ? currentYear : currentYear - 1;
    return [financialYearStart - 1, financialYearStart, financialYearStart + 1];
  }, []);

  // Filter work years to only include previous, current, and next financial year
  const filteredWorkYears = useMemo(() => {
    return workYears.filter((year) => {
      if (!year.displayText) return false;
      const firstYear = parseInt(year.displayText.split("-")[0]);
      return getRelevantYears.includes(firstYear);
    });
  }, [workYears, getRelevantYears]);

  // Year filter options from API
  const yearFilterOptions = useMemo(() => {
    return filteredWorkYears.map((year) => ({
      value: String(year.idWorkYear),
      label: year.displayText,
    }));
  }, [filteredWorkYears]);

  // Fetch initial data on component mount
  useEffect(() => {
    dispatch(getAllEmployeeDetails());
    dispatch(fetchDesignationList());
  }, [dispatch]);

  // Designation filter options
  const designationFilterOptions = useMemo(() => {
    if (designationList && designationList.data) {
      return [
        { value: "", label: "All Designations" },
        ...designationList.data.map((d) => ({
          value: String(d.idDesignation),
          label: d.designationName,
        })),
      ];
    }
    return [{ value: "", label: "All Designations" }];
  }, [designationList]);

  // Fetch employee leave setup list when search query, year filter, or status filter changes
  useEffect(() => {
    if (yearFilter) {
      const idYear = parseInt(yearFilter);
      if (!isNaN(idYear)) {
        dispatch(fetchEmployeeLeaveSetup({ searchText: searchQuery, idYear }));
      }
    }
  }, [dispatch, searchQuery, yearFilter]);

  // Helper function to format date as MM/DD/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Get employee leave setup data from API response with status filtering
  const employeeLeaveData = useMemo(() => {
    if (!employeeLeaveSetupList || !employeeLeaveSetupList.data) return [];

    let data = employeeLeaveSetupList.data.map((setup) => {
      const employee = employeeList?.find((emp) => emp.idEmployee === setup.idEmployee);
      const employeeCode = setup.employeeCode || setup.empCode || employee?.employeeCode || "";
      const designationName = setup.designationName || employee?.designationName || "";
      const idDesignation = setup.idDesignation || employee?.idDesignation || null;

      return {
        idEmployeeLeaveConfig: setup.idEmployeeLeaveConfig,
        employeeCode: employeeCode,
        employeeName: setup.employeeName,
        designation: designationName,
        idDesignation: idDesignation,
        templateName: setup.leaveTemplateName,
        validFrom: formatDate(setup.effectiveFrom),
        validTo: formatDate(setup.effectiveTo),
        status: setup.status || "SUBMITTED",
        viewDetails: setup.idEmployeeLeaveConfig,
        idEmployee: setup.idEmployee,
        idLeaveTemplate: setup.idLeaveTemplate,
        validFromRaw: setup.effectiveFrom,
        validToRaw: setup.effectiveTo,
        details: setup.details || [],
      };
    });

    // Apply status filter
    if (statusFilter !== "ALL") {
      data = data.filter((item) => item.status === statusFilter);
    }

    // Apply designation filter
    if (designationFilter) {
      data = data.filter((item) => String(item.idDesignation) === designationFilter);
    }

    return data;
  }, [employeeLeaveSetupList, employeeList, statusFilter, designationFilter]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return employeeLeaveData.slice(startIndex, endIndex);
  }, [employeeLeaveData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(employeeLeaveData.length / rowsPerPage);

  const handlePageChange = (page) => setCurrentPage(page);

  const getStatusBadgeClass = (status) => {
    const upperStatus = status?.toUpperCase();
    switch (upperStatus) {
      case "APPROVED":
        return "bg-label-success";
      case "SUBMITTED":
        return "bg-label-info";
      case "REJECTED":
        return "bg-label-danger";
      default:
        return "bg-label-warning";
    }
  };

  const formatStatusLabel = (status) => {
    if (!status) return "Submitted";
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case "SUBMITTED":
        return "Submitted";
      case "APPROVED":
        return "Approved";
      case "REJECTED":
        return "Rejected";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }
  };

  const columns = [
    { key: "employeeCode", label: "Emp. Code" },
    { key: "employeeName", label: "Employee Name" },
    { key: "designation", label: "Designation" },
    { key: "templateName", label: "Template Name" },
    { key: "validFrom", label: "Valid From" },
    { key: "validTo", label: "Valid To" },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <span className={`badge ${getStatusBadgeClass(value)}`}>
          {formatStatusLabel(value)}
        </span>
      ),
    },
    {
      key: "viewDetails",
      label: "View Details",
      headerStyle: { textAlign: "center" },
      render: (id) => (
        <div className="text-center">
          <button
            type="button"
            className="btn btn-sm p-0"
            onClick={() => handleView(id)}
            title="View Details"
          >
            <i className="bx bx-show fs-5"></i>
          </button>
        </div>
      ),
    },
  ];

  const handleView = async (id) => {
    const setup = employeeLeaveData.find((s) => s.idEmployeeLeaveConfig === id);
    if (setup) {
      setSelectedConfig(setup);
      setCurrentStatus(setup.status);
      setShowModal(true);

      // Fetch detailed employee leave setup
      try {
        const detailResult = await dispatch(
          fetchLeaveSetupOfAnEmployee({
            IdEmployee: setup.idEmployee,
            idYear: parseInt(yearFilter),
          })
        );

        if (detailResult.payload && detailResult.payload.data) {
          const detailedSetup = detailResult.payload.data;
          const configDetails =
            detailedSetup.details ||
            detailedSetup.employeeLeaveConfigDetails ||
            detailedSetup.employeeLeaveConfigDetail ||
            [];

          if (configDetails.length > 0) {
            const allocations = configDetails.map((detail) => ({
              idEmployeeLeaveConfigDetails:
                detail.idEmployeeLeaveConfigDetails ||
                detail.idEmployeeLeaveConfigDetail ||
                detail.id ||
                0,
              idLeaveType: detail.idLeaveType || 0,
              leaveTypeName: detail.leaveTypeName,
              allocatedDays: detail.allocatedDays || detail.allocatedDaysInYear || 0,
              carriedForwardDays:
                detail.maxCarryForwardDays ||
                detail.carriedForwardDays ||
                detail.carryForwardDays ||
                0,
            }));
            setTemplateAllocations(allocations);
            return;
          }
        }
      } catch (error) {
        console.error("Error fetching employee leave setup details:", error);
      }

      // Fallback: Use details from list API or fetch from template
      if (setup.details && setup.details.length > 0) {
        const allocations = setup.details.map((detail) => ({
          idEmployeeLeaveConfigDetails:
            detail.idEmployeeLeaveConfigDetails ||
            detail.idEmployeeLeaveConfigDetail ||
            detail.id ||
            0,
          idLeaveType: detail.idLeaveType || 0,
          leaveTypeName: detail.leaveTypeName,
          allocatedDays: detail.allocatedDays || detail.allocatedDaysInYear || 0,
          carriedForwardDays:
            detail.maxCarryForwardDays ||
            detail.carriedForwardDays ||
            detail.carryForwardDays ||
            0,
        }));
        setTemplateAllocations(allocations);
      } else if (setup.idLeaveTemplate) {
        try {
          const templateResult = await dispatch(
            fetchLeaveTemplateById(setup.idLeaveTemplate)
          );

          if (templateResult.payload && templateResult.payload.data) {
            const templateDetails =
              templateResult.payload.data.leaveTemplateDetails || [];

            const allocations = templateDetails.map((detail) => ({
              idEmployeeLeaveConfigDetails: 0,
              idLeaveType: detail.idLeaveType || 0,
              leaveTypeName: detail.leaveTypeName,
              allocatedDays: detail.maxLeavesPerYear || 0,
              carriedForwardDays: detail.isCarryForwardAllowed
                ? detail.maxCarryForwardDays || 0
                : 0,
            }));

            setTemplateAllocations(allocations);
          }
        } catch (error) {
          console.error("Error fetching template details:", error);
          setTemplateAllocations([]);
        }
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedConfig(null);
    setTemplateAllocations([]);
    setCurrentStatus("");
    // Refresh the list
    dispatch(fetchEmployeeLeaveSetup({ searchText: searchQuery, idYear: parseInt(yearFilter) }));
  };

  const handleApproveReject = async (approvalStatus) => {
    if (!selectedConfig) return;

    try {
      const result = await dispatch(
        approveEmployeeLeaveConfig({
          IdEmployeeLeaveConfig: selectedConfig.idEmployeeLeaveConfig,
          approvalStatus,
        })
      );

      if (result.payload && result.payload.success) {
        toast.success(
          approvalStatus === "APPROVED"
            ? "Employee leave config approved successfully!"
            : "Employee leave config rejected successfully!",
          {
            position: "top-right",
            autoClose: 4000,
          }
        );
        setCurrentStatus(approvalStatus);
        // Refresh the list
        dispatch(fetchEmployeeLeaveSetup({ searchText: searchQuery, idYear: parseInt(yearFilter) }));
      } else {
        toast.error(result.payload?.message || "Failed to process request", {
          position: "top-right",
          autoClose: 4000,
        });
      }
    } catch (error) {
      console.error("Error processing approval:", error);
      toast.error("Failed to process request", {
        position: "top-right",
        autoClose: 4000,
      });
    }
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">Employee Leave Configuration Approval</h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-2">
                  <select
                    className="form-select"
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                  >
                    {yearFilterOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <select
                    className="form-select"
                    value={designationFilter}
                    onChange={(e) => setDesignationFilter(e.target.value)}
                  >
                    {designationFilterOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <div className="list_searchbox">
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search by Emp. Code / Name"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <i className="bx bx-search"></i>
                  </div>
                </div>
              </div>
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : error ? (
                <div className="text-danger text-center py-4">{error}</div>
              ) : (
                <Grid
                  columns={columns}
                  data={paginatedData}
                  idKey="idEmployeeLeaveConfig"
                />
              )}
              <div className="text-end pt-2">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Employee Leave Configuration Modal */}
      {showModal && selectedConfig && (
        <ViewEmployeeLeaveConfigModal
          config={selectedConfig}
          templateAllocations={templateAllocations}
          currentStatus={currentStatus}
          onClose={handleCloseModal}
          onApproveReject={handleApproveReject}
        />
      )}
    </div>
  );
};

// View Modal Component
const ViewEmployeeLeaveConfigModal = ({
  config,
  templateAllocations,
  currentStatus,
  onClose,
  onApproveReject,
}) => {
  const modalRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const modalElement = document.getElementById("viewEmployeeLeaveConfigModal");
    if (modalElement && !modalRef.current) {
      modalRef.current = new bootstrap.Modal(modalElement, {
        focus: false,
        backdrop: "static",
        keyboard: false,
      });
      modalRef.current.show();

      const handleHidden = () => {
        if (onCloseRef.current) {
          onCloseRef.current();
        }
      };

      modalElement.addEventListener("hidden.bs.modal", handleHidden);

      return () => {
        modalElement.removeEventListener("hidden.bs.modal", handleHidden);
        if (modalRef.current) {
          modalRef.current.dispose();
          modalRef.current = null;
        }
      };
    }
  }, []);

  return (
    <div
      className="modal fade"
      id="viewEmployeeLeaveConfigModal"
      tabIndex="-1"
      aria-hidden="true"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
    >
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Employee Leave Configuration Details</h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label mb-1 fw-bold">Employee Code</label>
                <p className="mb-0">{config.employeeCode}</p>
              </div>
              <div className="col-md-6">
                <label className="form-label mb-1 fw-bold">Employee Name</label>
                <p className="mb-0">{config.employeeName}</p>
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label mb-1 fw-bold">Template Name</label>
                <p className="mb-0">{config.templateName}</p>
              </div>
              <div className="col-md-6">
                <label className="form-label mb-1 fw-bold">Status</label>
                <p className="mb-0">
                  <span
                    className={`badge ${
                      currentStatus === "APPROVED"
                        ? "bg-success"
                        : currentStatus === "REJECTED"
                        ? "bg-danger"
                        : "bg-warning"
                    }`}
                  >
                    {currentStatus}
                  </span>
                </p>
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label mb-1 fw-bold">Valid From</label>
                <p className="mb-0">{config.validFrom}</p>
              </div>
              <div className="col-md-6">
                <label className="form-label mb-1 fw-bold">Valid To</label>
                <p className="mb-0">{config.validTo}</p>
              </div>
            </div>

            <div className="mb-3">
              <h6 className="fw-bold mb-2">Template Allocations</h6>
              <div className="table-responsive">
                <table className="table table-bordered table-sm">
                  <thead>
                    <tr>
                      <th>Leave Type</th>
                      <th>No. of Days Allocated</th>
                      <th>No. of Days Carried Forward</th>
                      <th>Total Allocated Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templateAllocations.length > 0 ? (
                      templateAllocations.map((allocation, index) => (
                        <tr key={index}>
                          <td>{allocation.leaveTypeName || "-"}</td>
                          <td>{allocation.allocatedDays || 0}</td>
                          <td>{allocation.carriedForwardDays || 0}</td>
                          <td>
                            {(allocation.allocatedDays || 0) +
                              (allocation.carriedForwardDays || 0)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center text-muted">
                          No allocations available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="modal-footer justify-content-end">
            {currentStatus === "SUBMITTED" && (
              <>
                <Button
                  className="btn btn-primary px-4 me-2"
                  onClick={() => onApproveReject("APPROVED")}
                >
                  Approve
                </Button>
                <Button
                  className="btn btn-danger px-4"
                  onClick={() => onApproveReject("REJECTED")}
                >
                  Reject
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmpLeaveConfigApproval;
