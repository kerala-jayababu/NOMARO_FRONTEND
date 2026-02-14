import { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import Grid from "../../components/grid";
import Button from "../../components/button";
import Pagination from "../../components/pagination";
import {
  fetchLeaveTemplates,
  fetchLeaveTemplateById,
  fetchDesignationList,
  fetchLeaveTemplateDetailById,
  approveLeaveTemplate,
  fetchLeaveTemplateApprovers,
  resetLeaveTemplateDetailById
} from "../../redux/reducers/leaveTemplate";
import { fetchLeaveTypes } from "../../redux/reducers/leaveType";
import CommonService from "../../core/services/CommonService";
import secureLocalStorage from "react-secure-storage";
import { toast } from "react-toastify";

const LeaveTemplateApproval = () => {
  const dispatch = useDispatch();
  const { leaveTemplates, loading, error } = useSelector((state) => state.leaveTemplate);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("SUBMITTED");
  const [yearFilter, setYearFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [workYears, setWorkYears] = useState([]);

  // Fetch work years from API on component mount
  useEffect(() => {
    const fetchWorkYears = async () => {
      const result = await CommonService.getAllWorkYears();
      if (!result.error && result.data) {
        setWorkYears(result.data);
      }
    };
    fetchWorkYears();
  }, []);

  // Set default year filter based on financial year (July 1 - June 30)
  useEffect(() => {
    if (workYears.length > 0 && !yearFilter) {
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      const financialYearStart = currentMonth >= 7 ? currentYear : currentYear - 1;

      const currentWorkYear = workYears.find((year) => {
        if (!year.displayText) return false;
        const firstYear = year.displayText.split("-")[0];
        return firstYear === String(financialYearStart);
      });
      if (currentWorkYear) {
        setYearFilter(String(currentWorkYear.idWorkYear));
      }
    }
  }, [workYears]);

  // Get previous, current, and next financial year start years
  const getRelevantYears = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const financialYearStart = currentMonth >= 7 ? currentYear : currentYear - 1;

    return [
      financialYearStart - 1,
      financialYearStart,
      financialYearStart + 1
    ];
  }, []);

  // Filter work years to only include previous, current, and next financial year
  const filteredWorkYears = useMemo(() => {
    return workYears.filter((year) => {
      if (!year.displayText) return false;
      const firstYear = parseInt(year.displayText.split("-")[0]);
      return getRelevantYears.includes(firstYear);
    });
  }, [workYears, getRelevantYears]);

  // Year filter options from API with "All Years" option
  const yearFilterOptions = useMemo(() => {
    return [
      { value: "", label: "All Years" },
      ...filteredWorkYears.map((year) => ({
        value: String(year.idWorkYear),
        label: year.displayText,
      })),
    ];
  }, [filteredWorkYears]);

  // Status options - only SUBMITTED, APPROVED, REJECTED
  const statusOptions = [
    { value: "ALL", label: "All Status" },
    { value: "SUBMITTED", label: "Submitted" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
  ];

  // Fetch leave templates on component mount and when filters change
  useEffect(() => {
    const status = statusFilter || "ALL";
    const idYear = yearFilter || "";
    const searchText = searchQuery || "";

    dispatch(fetchLeaveTemplates({ status, idYear, searchText }));
  }, [dispatch, statusFilter, yearFilter, searchQuery]);

  // Helper function to get displayText from idWorkYear
  const getYearDisplayText = (idYear) => {
    const yearData = workYears.find((y) => y.idWorkYear === idYear);
    return yearData ? yearData.displayText : String(idYear);
  };

  // Get templates data from API response
  const templatesData = useMemo(() => {
    if (!leaveTemplates || !leaveTemplates.data) return [];

    return leaveTemplates.data.map((template) => ({
      idLeaveTemplate: template.idLeaveTemplate,
      idYear: template.idYear,
      year: getYearDisplayText(template.idYear),
      templateName: template.leaveTemplateName,
      description: template.leaveTemplateDesc || "",
      status: (template.approvlStatus || "DRAFT").toUpperCase(),
      viewDetails: template.idLeaveTemplate,
    }));
  }, [leaveTemplates, workYears]);

  const paginatedTemplates = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return templatesData.slice(startIndex, endIndex);
  }, [templatesData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(templatesData.length / rowsPerPage);

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
      case "DRAFT":
      default:
        return "bg-label-warning";
    }
  };

  const formatStatusLabel = (status) => {
    if (!status) return "Draft";
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case "DRAFT":
        return "Draft";
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
    { key: "year", label: "Year" },
    { key: "templateName", label: "Template Name" },
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
            onClick={() => handleViewDetails(id)}
            title="View Details"
          >
            <i className="bx bx-show fs-5"></i>
          </button>
        </div>
      ),
    },
  ];

  const handleViewDetails = (id) => {
    const template = templatesData.find((t) => t.idLeaveTemplate === id);
    setSelectedTemplate(template);
    setShowDetailsModal(true);
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">Leave Template Approval</h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-3">
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
                <div className="col-md-3">
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
                <div className="col-md-6">
                  <div className="list_searchbox">
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search..."
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
                  data={paginatedTemplates}
                  idKey="idLeaveTemplate"
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

      {showDetailsModal && selectedTemplate && (
        <TemplateDetailsViewModal
          template={selectedTemplate}
          statusFilter={statusFilter}
          yearFilter={yearFilter}
          searchQuery={searchQuery}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedTemplate(null);
            // Refresh the list
            dispatch(fetchLeaveTemplates({
              status: statusFilter || "ALL",
              idYear: yearFilter || "",
              searchText: searchQuery || ""
            }));
          }}
        />
      )}
    </div>
  );
};

// Template Details View Modal Component (View Only)
const TemplateDetailsViewModal = ({ template, statusFilter, yearFilter, searchQuery, onClose }) => {
  const dispatch = useDispatch();
  const { leaveTemplateDetails } = useSelector((state) => state.leaveTemplate);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [showLeaveTypeModal, setShowLeaveTypeModal] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(template.status);
  const [isApprover, setIsApprover] = useState(false);

  // Ref to prevent duplicate API calls
  const submitLockRef = useRef(false);

  // Refs to prevent modal re-initialization on every render
  const modalInstanceRef = useRef(null);
  const onCloseRef = useRef(onClose);

  // Keep onCloseRef in sync without re-initializing modal
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (template?.idLeaveTemplate) {
      dispatch(fetchLeaveTemplateById(template.idLeaveTemplate));
    }

    // Fetch approvers and check if current user is an approver
    const checkApprover = async () => {
      const result = await dispatch(fetchLeaveTemplateApprovers());
      if (result.payload && result.payload.success && result.payload.data) {
        const storedUser = secureLocalStorage.getItem("user");
        const currentUserId = storedUser ? JSON.parse(storedUser)?.idEmployee : null;
        if (currentUserId && result.payload.data.includes(currentUserId)) {
          setIsApprover(true);
        }
      }
    };
    checkApprover();
  }, [dispatch, template?.idLeaveTemplate]);

  useEffect(() => {
    if (leaveTemplateDetails && leaveTemplateDetails.data) {
      const mappedLeaveTypes = leaveTemplateDetails.data.leaveTemplateDetails?.map((detail) => ({
        idLeaveTemplateDetails: detail.idLeaveTemplateDetails,
        idLeaveTemplate: detail.idLeaveTemplate,
        idLeaveType: detail.idLeaveType,
        leaveType: detail.leaveTypeName,
        leaveCode: detail.leaveCode,
        paid: detail.isPaid ? "Yes" : "No",
        maxPerYear: detail.maxLeavesPerYear,
        maxPerMonth: detail.maxLeavesPerMonth,
        carryForward: detail.isCarryForwardAllowed ? "Yes" : "No",
        approvalLevels: detail.requiredApprovalLevel,
        status: "Active",
        fullDetails: detail,
      })) || [];
      setLeaveTypes(mappedLeaveTypes);
    }
  }, [leaveTemplateDetails]);

  useEffect(() => {
    const modalElement = document.getElementById("templateDetailsViewModal");
    if (modalElement && !modalInstanceRef.current) {
      const modal = new bootstrap.Modal(modalElement, {
        focus: false,
        backdrop: 'static',
        keyboard: false
      });
      modalInstanceRef.current = modal;
      modal.show();

      const handleHidden = () => {
        onCloseRef.current();
      };
      modalElement.addEventListener("hidden.bs.modal", handleHidden);
      return () => {
        modalElement.removeEventListener("hidden.bs.modal", handleHidden);
        if (modalInstanceRef.current) {
          modalInstanceRef.current.dispose();
          modalInstanceRef.current = null;
        }
      };
    }
  }, []);

  const getStatusBadgeClass = (status) => {
    return status === "Active" ? "bg-label-success" : "bg-label-warning";
  };

  const handleViewLeaveType = (id) => {
    const leaveType = leaveTypes.find((lt) => lt.idLeaveTemplateDetails === id);
    setSelectedLeaveType(leaveType);
    setShowLeaveTypeModal(true);
  };

  const handleApproveReject = async (approvalStatus) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;

    try {
      setIsProcessing(true);
      const resultAction = await dispatch(
        approveLeaveTemplate({
          idLeaveTemplate: template.idLeaveTemplate,
          approvalStatus: approvalStatus
        })
      );

      if (approveLeaveTemplate.fulfilled.match(resultAction)) {
        if (resultAction.payload && resultAction.payload.success) {
          toast.success(
            approvalStatus === "APPROVED"
              ? "Leave template approved successfully!"
              : "Leave template rejected successfully!",
            {
              position: "top-right",
              autoClose: 4000,
            }
          );
          setCurrentStatus(approvalStatus);
          // Refresh the list
          dispatch(fetchLeaveTemplates({
            status: statusFilter || "ALL",
            idYear: yearFilter || "",
            searchText: searchQuery || ""
          }));
          // Close the modal after successful approve/reject
          if (modalInstanceRef.current) {
            modalInstanceRef.current.hide();
          }
        } else {
          toast.error(resultAction.payload?.message || `Failed to ${actionText} leave template`, {
            position: "top-right",
            autoClose: 4000,
          });
        }
      } else {
        toast.error(resultAction.payload?.message || `Failed to ${actionText} leave template`, {
          position: "top-right",
          autoClose: 4000,
        });
      }
    } catch (error) {
      console.error(`Error ${actionText}ing leave template:`, error);
      toast.error(`Failed to ${actionText} leave template`, {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setIsProcessing(false);
      submitLockRef.current = false;
    }
  };

  return (
    <>
      <div
        className="modal fade"
        id="templateDetailsViewModal"
        tabIndex="-1"
        aria-hidden="true"
        data-bs-backdrop="static"
        data-bs-keyboard="false"
        style={{ zIndex: 1100 }}
      >
        <div className="modal-dialog modal-xl modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Template Details</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label fw-bold">Year:</label>
                  <p>{template.year}</p>
                </div>
                <div className="col-md-8">
                  <label className="form-label fw-bold">Template Name:</label>
                  <p>{template.templateName}</p>
                </div>
              </div>

              <div className="mb-3">
                <h6 className="fw-bold">Leave Types in Template</h6>
                <div className="table-responsive">
                  <table className="table table-bordered table-sm">
                    <thead>
                      <tr>
                        <th>Leave Type</th>
                        <th>Paid</th>
                        <th>Max / Year</th>
                        <th>Max / Month</th>
                        <th>Carry Forward</th>
                        <th>Approval Levels</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveTypes.length > 0 ? (
                        leaveTypes.map((lt) => (
                          <tr key={lt.idLeaveTemplateDetails}>
                            <td>{lt.leaveType}</td>
                            <td>{lt.paid}</td>
                            <td>{lt.maxPerYear}</td>
                            <td>{lt.maxPerMonth}</td>
                            <td>{lt.carryForward}</td>
                            <td>{lt.approvalLevels}</td>
                            <td>
                              <span className={`badge ${getStatusBadgeClass(lt.status)}`}>
                                {lt.status}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-sm btn-icon btn-outline-secondary px-2 border-0"
                                onClick={() => handleViewLeaveType(lt.idLeaveTemplateDetails)}
                              >
                                <span className="bx bx-show"></span>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="text-center">
                            No leave types added yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            {currentStatus === "SUBMITTED" && isApprover && (
              <div className="modal-footer justify-content-end">
                <Button
                  type="button"
                  className="btn btn-primary px-4 me-2"
                  onClick={() => handleApproveReject("APPROVED")}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Approve"}
                </Button>
                <Button
                  type="button"
                  className="btn btn-danger px-4"
                  onClick={() => handleApproveReject("REJECTED")}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Reject"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showLeaveTypeModal && (
        <LeaveTypeViewModal
          leaveType={selectedLeaveType}
          templateYear={template.year}
          onClose={() => {
            setShowLeaveTypeModal(false);
            setSelectedLeaveType(null);
          }}
        />
      )}
    </>
  );
};

// Leave Type View Modal Component (View Only)
const LeaveTypeViewModal = ({ leaveType, templateYear, onClose }) => {
  const dispatch = useDispatch();
  const { designationList, leaveTemplateDetailById } = useSelector((state) => state.leaveTemplate);
  const [detailsLoaded, setDetailsLoaded] = useState(false);

  const fullDetails = leaveTemplateDetailById?.data || leaveType?.fullDetails;

  const roleOptions = useMemo(() => {
    if (designationList && designationList.data) {
      return designationList.data.map((designation) => ({
        value: String(designation.idDesignation),
        label: designation.designationName,
      }));
    }
    return [];
  }, [designationList]);

  useEffect(() => {
    dispatch(fetchDesignationList());
  }, [dispatch]);

  useEffect(() => {
    if (leaveType?.idLeaveTemplateDetails && !detailsLoaded) {
      dispatch(fetchLeaveTemplateDetailById(leaveType.idLeaveTemplateDetails));
      setDetailsLoaded(true);
    }
  }, [dispatch, leaveType?.idLeaveTemplateDetails, detailsLoaded]);

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      const parentModal = document.getElementById("templateDetailsViewModal");
      if (parentModal && parentModal.classList.contains('show')) {
        document.body.classList.add('modal-open');
      }
    };
  }, []);

  const getApproverName = (approverId) => {
    const role = roleOptions.find(r => r.value === String(approverId));
    return role ? role.label : approverId;
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1110,
          pointerEvents: 'none',
        }}
      />
      <div
        className="modal show d-block"
        id="leaveTypeViewModal"
        tabIndex="-1"
        role="dialog"
        style={{ zIndex: 1120, display: 'block', pointerEvents: 'auto' }}
      >
        <div className="modal-dialog modal-xl modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">View Template Leave Type</h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              <h6 className="fw-bold mb-3">Basic</h6>
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label fw-bold">Year:</label>
                  <p>{templateYear}</p>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Leave Type:</label>
                  <p>{fullDetails?.leaveTypeName || "-"}</p>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Status:</label>
                  <p>Active</p>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label fw-bold">Paid:</label>
                  <p>{fullDetails?.isPaid ? "Yes" : "No"}</p>
                </div>
                {!fullDetails?.isPaid && (
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Salary Deduction %:</label>
                    <p>{fullDetails?.salaryDeductionPercent || 0}</p>
                  </div>
                )}
              </div>

              <hr />
              <h6 className="fw-bold mb-3">Approval Workflow</h6>
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label fw-bold">No. of Approval Levels:</label>
                  <p>{fullDetails?.requiredApprovalLevel || 0}</p>
                </div>
              </div>
              {fullDetails?.leaveWorkFlowDetails?.map((workflow, index) => (
                <div key={index} className="row mb-2">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Approver Level {workflow.levelNumber}:</label>
                    <p>Level {workflow.levelNumber}</p>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Approver Type:</label>
                    <p>{workflow.approvalAuthorityType || "ROLE"}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Approver:</label>
                    <p>
                      {workflow.approvalAuthorityType === "REPOFFICER"
                        ? "Reporting Officer"
                        : getApproverName(workflow.approvalAuthorityID)}
                    </p>
                  </div>
                </div>
              ))}

              <hr />
              <h6 className="fw-bold mb-3">Limits & Dates</h6>
              <div className="row mb-3">
                <div className="col-md-3">
                  <label className="form-label fw-bold">Max Leaves Per Year:</label>
                  <p>{fullDetails?.maxLeavesPerYear || 0}</p>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Max Leaves Per Month:</label>
                  <p>{fullDetails?.maxLeavesPerMonth || 0}</p>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Backdated Leave Allowed:</label>
                  <p>{fullDetails?.allowBackdatedLeave ? "Yes" : "No"}</p>
                </div>
                {fullDetails?.allowBackdatedLeave && (
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Backdate Limit (days):</label>
                    <p>{fullDetails?.backdateLimitDays || 0}</p>
                  </div>
                )}
              </div>
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label fw-bold">Allow Half Day:</label>
                  <p>{fullDetails?.allowHalfDay ? "Yes" : "No"}</p>
                </div>
              </div>

              <hr />
              <h6 className="fw-bold mb-3">Eligibility & Rules</h6>
              <div className="row mb-3">
                <div className="col-md-3">
                  <label className="form-label fw-bold">Applicable Gender:</label>
                  <p>{fullDetails?.applicableGender === "BOTH" ? "Both" : fullDetails?.applicableGender || "Both"}</p>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Include Holidays Between:</label>
                  <p>{fullDetails?.includeHolidaysBetween ? "Yes" : "No"}</p>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">Requires Document:</label>
                  <p>{fullDetails?.requiresDocument ? "Yes" : "No"}</p>
                </div>
                {fullDetails?.requiresDocument && (
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Doc Required After Days:</label>
                    <p>{fullDetails?.documentRequiredAfterDays || 0}</p>
                  </div>
                )}
              </div>

              <hr />
              <h6 className="fw-bold mb-3">Carry Forward</h6>
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label fw-bold">Carry Forward Allowed:</label>
                  <p>{fullDetails?.isCarryForwardAllowed ? "Yes" : "No"}</p>
                </div>
                {fullDetails?.isCarryForwardAllowed && (
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Max Carry Forward Days:</label>
                    <p>{fullDetails?.maxCarryForwardDays || 0}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm py-2 px-4"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeaveTemplateApproval;
