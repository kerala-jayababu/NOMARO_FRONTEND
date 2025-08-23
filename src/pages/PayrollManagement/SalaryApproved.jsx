import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getSalaryGenerations } from "../../redux/reducers/salaryGeneration";
import { fetchDepartments } from "../../redux/reducers/department";
import { fetchDesignations } from "../../redux/reducers/designation";
import CommonService from "../../core/services/CommonService";
import toast from "react-hot-toast";
import Select from "react-select";
import SalaryGenerationService from "../../core/services/SalaryGenerationService";
import LoadingOverlay from "../../components/LoadingOverlay";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";
import { fetchBudgetCode } from "../../redux/reducers/budgetCode";
import { API } from "../../redux/api/utils";

const BASE_URL = import.meta.env.VITE_API_URL;

const statusColor = [
  { status: "approved", color: "bg-success" },
  { status: "submitted", color: "bg-warning" },
  { status: "draft generated", color: "bg-label-warning" },
  { status: "draft", color: "bg-label-warning" },
  { status: "not generated", color: "bg-dark" },
  { status: "rejected", color: "bg-danger" },
   { status: "fm approved", color: "bg-info" },
  { status: "hr approved", color: "bg-info" }
];

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function SalaryApproved() {
  const dispatch = useDispatch();

  // ✅ Correct place for useState hooks
  const [statusOptions, setStatusOptions] = useState([]);
  const [salaryMonthsList, setSalaryMonthsList] = useState([]);
  const [showOverloay, setShowOverlay] = useState(false);
  const [salaryDraft, setSalaryDraft] = useState([]);
  const [filter, setFilter] = useState("");
  const [option, setOption] = useState("");
  const [currentMonth, setCurrentMonth] = useState();
  const [statusFilter, setStatusFilter] = useState({ value: "All", label: "Select Status" });
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedCard, setSelectedCard] = useState("All");
  const [allSalaryList, setAllSalaryList] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState({ type: "", title: "", message: "" });
  const [initialApprovalStatus, setInitialApprovalStatus] = useState(null);
  const optionsRef = useRef();
  const statusRef = useRef();
  const filterRef = useRef();

  const { salaryGenerationList } = useSelector((state) => state.salaryGeneration);
  const { departments } = useSelector((state) => state.department);
  const { designation } = useSelector((state) => state.designation);
   const { options } = useSelector((state) => state.budgetCode);
  const { idPayrollScreen } = useSelector((state) => state.auth);

useEffect(() => {
  const initialize = async () => {
    try {
      setShowOverlay(true);

      // Fetch token
      const storedUser = secureLocalStorage.getItem("user");
      const token = storedUser ? JSON.parse(storedUser)?.token : null;

      if (!token) {
        toast.error("Token not found");
        return;
      }

      // 1. Fetch status options
      const statusResponse = await API.get(`${BASE_URL}/api/v1/Common/GetSalaryOptions`);

      const statusData = statusResponse?.data || [];
      const formattedStatus = statusData.map((item) => ({
        value: item.value,
        label: item.label,
      }));
      const fullStatusOptions = [{ value: "All", label: "All Status" }, ...formattedStatus];
      setStatusOptions(fullStatusOptions);

      // 2. Get current approval status
      const approvalRes = await API.post(`${BASE_URL}/api/v1/SalaryGeneration/GetSalaryapprovalValue`);
      const approvalStatus = approvalRes?.data?.data?.approvalStatus;
      setInitialApprovalStatus(approvalStatus);

      const matchedStatus = fullStatusOptions.find(
        (opt) => opt.value.toLowerCase() === approvalStatus?.toLowerCase()
      );
      setStatusFilter(matchedStatus || { value: "All", label: "All Status" });

      // 3. Get salary months list
      const monthsData = await CommonService.getAllSalaryMonths();
      const monthList = monthsData?.data || [];

      const currentMonthObject = monthList
        .filter((m) => m.salaryMonthText.includes(new Date().getFullYear()))
        .find((m) => m.idSalaryMonth === approvalRes?.data?.data?.maxSalaryMonth);

      const filteredMonths = monthList.filter((month) => {
        const [monthName, year] = month.salaryMonthText.split(",");
        const monthIndex = months.indexOf(monthName);
        const currentMonthIndex = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        return (
          (year.trim() == currentYear && monthIndex >= currentMonthIndex - 1 && monthIndex <= currentMonthIndex + 1) ||
          (year.trim() == currentYear - 1 && monthIndex === 11 && currentMonthIndex === 0) ||
          (year.trim() == currentYear + 1 && monthIndex === 0 && currentMonthIndex === 11)
        );
      });

      setCurrentMonth({
        value: currentMonthObject.idSalaryMonth,
        label: currentMonthObject.salaryMonthText,
      });

      setSalaryMonthsList(filteredMonths);
    } catch (error) {
      console.error("Initialization error:", error);
      toast.error("Initialization failed");
    } finally {
      setShowOverlay(false);
    }
  };

  initialize();
}, []);

useEffect(() => {
  if (!currentMonth) return;

  const fetchSalaryData = async () => {
    try {
      // setShowOverlay(true);
      const params = {
        idSalaryMonth: currentMonth.value,
        status: "All",
      };

      const { payload } = await dispatch(getSalaryGenerations(params));
      const allData = payload?.data || [];
      setAllSalaryList(allData);

      const filteredData =
        statusFilter.value === "All"
          ? allData
          : allData.filter(
              (item) =>
                statusFilter.value.toLowerCase().includes(item.approvalStatus.toLowerCase())
            );

      dispatch({
        type: "salaryGeneration/getSalaryGenerations/fulfilled",
        payload: { data: filteredData },
      });
    } catch (err) {
      console.error("Error fetching salary data:", err);
    } 
  };

  fetchSalaryData();
}, [dispatch, currentMonth, statusFilter]);


  const handleStatusChange = (status) => {
    if (!status) return;
    setStatusFilter(status);
    setSelectedCard(status.value);
    setSalaryDraft([]);
    handelCheckboxCheck(false);
    const params = {
      idSalaryMonth: currentMonth?.value,
      status: status.value,
    };
    dispatch(getSalaryGenerations(params));
  };

  const populateOptions = async (option) => {
    if (option.value === "designation") {
      await dispatch(fetchDesignations());
    } else if (option.value === "budget") {
            const result = await dispatch(fetchBudgetCode());
            console.log("Fetched budget codes:", result?.payload?.data);
          }else {
      await dispatch(fetchDepartments());
    }
    setOption(option.value);
    setFilter("");
    if (optionsRef.current) optionsRef.current.clearValue();
    setSalaryDraft([]);
    handelCheckboxCheck(false);
  };

  const handleMonthFromChange = (option) => {
    setCurrentMonth(option);
    clearAllFilter();
  };

  const clearAllFilter = () => {
    filterRef.current?.clearValue();
    optionsRef.current?.clearValue();
    statusRef.current?.clearValue();
    setStatusFilter({ value: "All", label: "Select Status" });
    setSelectedCard("All");
    setInitialApprovalStatus(null);
    setSalaryDraft([]);
    handelCheckboxCheck(false);
  };

  const handelCheckboxCheck = (checked) => {
    Array.from(document.querySelectorAll(".data-checkbox")).forEach((item) => {
      if (!item.disabled) item.checked = checked;
    });
  };

  const uncheckCheckBox = () => {
    document.querySelectorAll(".form-check-input").forEach((item) => (item.checked = false));
  };

  const handleApprovalWorkflow = async () => {
    const content = salaryDraft.map((item) => ({
      entityTablePrimaryKeyID: item.idEmployeeSalary,
      entityCode: "EMPSALGEN",
      status: "APPROVED",
      idPayrollScreen,
    }));

    setShowOverlay(true);
    const res = await SalaryGenerationService.handleApprovalWorkflow(content);
    setShowOverlay(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Approved successfully");
      uncheckCheckBox();
      setSalaryDraft([]);
      dispatch(getSalaryGenerations({ idSalaryMonth: currentMonth?.value, status: "All" }))
        .then(({ payload }) => setAllSalaryList(payload.data));
      clearAllFilter();
    }
  };

  const handleRejectWorkflow = async () => {   
    if (!rejectReason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }
    

    const content = salaryDraft.map((item) => ({
      entityTablePrimaryKeyID: item.idEmployeeSalary,
      entityCode: "EMPSALGEN",
      status: "REJECTED",
      rejectReason: rejectReason,
      idPayrollScreen,
    }));

    setShowRejectModal(false);
    setShowOverlay(true);
    const res = await SalaryGenerationService.handleApprovalWorkflow(content);
    setShowOverlay(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Rejected successfully");
      uncheckCheckBox();
      setSalaryDraft([]);
      setRejectReason("");
      dispatch(getSalaryGenerations({ idSalaryMonth: currentMonth?.value, status: "All" }))
        .then(({ payload }) => setAllSalaryList(payload.data));
      clearAllFilter();
    }
  };

  const handleConfirmAction = () => {
    if (confirmAction.type === "approve") {
      handleApprovalWorkflow();
    }
    setShowConfirmModal(false);
  };
  const showConfirmationModal = (type) => {
    let title = "";
    let message = "";

    switch (type) {
      case "approve":
        title = "Approve Records";
        message = "Are you sure you want to approve the selected records?";
        break;
    }

    setConfirmAction({ type, title, message });
    setShowConfirmModal(true);
  };

  const handleSelectAll = (e) => {
    debugger
    const checked = e.target.checked;
      const filtered = salaryGenerationList.filter((x) => x.approvalEnabled);
        setSalaryDraft(checked ? filtered : []);
    // const filtered = salaryGenerationList.filter((x) =>
    //   statusFilter.value.toLowerCase().includes(x.approvalStatus.toLowerCase())
    // );
   // setSalaryDraft(checked ? filtered : []);
    handelCheckboxCheck(checked);
  };

  const exportSalaryApproved = async () => {
    const employeeIds = salaryDraft.map((item) => item.idEmployee).join(",");
    setShowOverlay(true);
    const response = await SalaryGenerationService.exportSalaryApproved(
      employeeIds,
      currentMonth.value
    );
    setShowOverlay(false);
    if (response.error) {
      toast.error(response.error);
    } else {
      downloadFile(response.data);
    }
    uncheckCheckBox();
    setSalaryDraft([]);
  };
  const exportSalaryALLRecord = async () => {
  const employeeIds = salaryGenerationList.map((item) => item.idEmployee).join(",");
  if (!employeeIds) {
    toast.error("No employee records found to export.");
    return;
  }

  setShowOverlay(true);
  const response = await SalaryGenerationService.exportSalaryApproved(
    employeeIds,
    currentMonth.value
  );
  setShowOverlay(false);

  if (response.error) {
    toast.error(response.error);
  } else {
    downloadFile(response.data);
    toast.success("Exported all records successfully.");
  }

  uncheckCheckBox();
  setSalaryDraft([]);
};

  const downloadFile = (item) => {
    const byteArray = Uint8Array.from(atob(item.fileContent), (c) => c.charCodeAt(0));
    const blob = new Blob([byteArray], { type: item.fileType });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", item.fileName || "downloaded-file");
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  };


  return (
    <div class="container-xxl flex-grow-1 container-p-y">
      <div class="row">
        <div class="col-xl-12">
          <div class="card">
            <div class="card-header d-flex align-items-center justify-content-between pb-1">
              <h5 class="m-0 d-flex col-md-11 items-center justify-center">
                <span class="d-flex items-center justify-center pt-2">
                  Salary Approval for the month of
                </span>
                <Select
                  options={salaryMonthsList.map((item) => ({
                    value: item.idSalaryMonth,
                    label: item.salaryMonthText,
                  }))}
                  className="mx-2 w-25 textSize"
                  isSearchable
                  onChange={handleMonthFromChange}
                  value={currentMonth}
                />
              </h5>
            </div>
            <div class="card-body">
              <div class="p-2">
                <ul class="SalaryApproveCount_ul">
                  <li>
                    <div class="card SalaryApproveCount">
                      <div
                        class="card-body"
                        onClick={() =>
                          handleStatusChange({
                            value: "All",
                            label: "All Status",
                          })
                        }
                        style={{
                          backgroundColor:
                            selectedCard === "All" ? "#e7e7ff" : "",
                          cursor: "pointer",
                          transition: "background-color 0.3s",
                        }}
                      >
                        <h5>Total Employees</h5>
                        <div class="count">{allSalaryList?.length || 0}</div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div class="card SalaryApproveCount">
                      <div
                        class="card-body"
                        onClick={() =>
                          handleStatusChange({
                            value: "APPROVED",
                            label: "Approved",
                          })
                        }
                        style={{
                          backgroundColor:
                            selectedCard === "APPROVED" ? "#e7e7ff" : "",
                          cursor: "pointer",
                          transition: "background-color 0.3s",
                        }}
                      >
                        <h5>Approved</h5>
                        <div class="count text-success">
                          {allSalaryList?.filter(
                            (x) => x.approvalStatus.toLowerCase() === "approved"
                          )?.length || 0}
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div class="card SalaryApproveCount">
                      <div
                        class="card-body"
                        onClick={() =>
                          handleStatusChange({
                            value: "SUBMITTED",
                            label: "Submitted",
                          })
                        }
                        style={{
                          backgroundColor:
                            selectedCard === "SUBMITTED" ? "#e7e7ff" : "",
                          cursor: "pointer",
                          transition: "background-color 0.3s",
                        }}
                      >
                        <h5>Submitted</h5>
                        <div className="count bs-bg-warning">
                          {allSalaryList?.filter(
                            (x) =>
                              x.approvalStatus.toLowerCase() === "submitted"
                          )?.length || 0}
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div class="card SalaryApproveCount">
                      <div
                        class="card-body"
                        onClick={() =>
                          handleStatusChange({
                            value: "DRAFT GENERATED",
                            label: "Draft Generated",
                          })
                        }
                        style={{
                          backgroundColor:
                            selectedCard === "DRAFT GENERATED" ? "#e7e7ff" : "",
                          cursor: "pointer",
                          transition: "background-color 0.3s",
                        }}
                      >
                        <h5>Draft Generated</h5>
                        <div class="count text-secondary">
                          {allSalaryList?.filter(
                            (x) => x.approvalStatus.toLowerCase() === "draft"
                          )?.length || 0}
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div class="card SalaryApproveCount">
                      <div
                        class="card-body"
                        onClick={() =>
                          handleStatusChange({
                            value: "NOT GENERATED",
                            label: "Not Generated",
                          })
                        }
                        style={{
                          backgroundColor:
                            selectedCard === "NOT GENERATED" ? "#e7e7ff" : "",
                          cursor: "pointer",
                          transition: "background-color 0.3s",
                        }}
                      >
                        <h5>Not Generated</h5>
                        <div class="count text-dark">
                          {allSalaryList?.filter(
                            (x) =>
                              x.approvalStatus.toLowerCase() === "not generated"
                          )?.length || 0}
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
              <div class="row m-0 pb-2">
                <div class="col-md-4 p-2">
                  <Select
                    ref={filterRef}
                    className="textSize"
                    options={[
                      { value: "", label: "All Employees" },
                      {
                        value: "designation",
                        label: "Filter Designation Based",
                      },
                      { value: "department", label: "Filter Department Based" },
                       { value: "budget", label: "Filter Budget Based" },
                    ]}
                    defaultValue={{ value: "all", label: "All Employees" }}
                    onChange={(option) => {
                      populateOptions(option);
                    }}
                  />
                </div>
                <div class="col-md-4 p-2">
                  {option === "department" ? (
                    <Select
                      ref={optionsRef}
                      options={[
                        { value: "", label: "All Departments" },
                        ...(departments?.data?.map((dept) => ({
                          value: dept.departmentName,
                          label: dept.departmentName,
                        })) || []),
                      ]}
                      isSearchable
                      onChange={(option) => {
                        if (statusRef.current) statusRef.current.value = "All";
                        setFilter(option?.value || "");
                      }}
                      placeholder={"Select Department"}
                      className="textSize"
                    />
                  ) : option === "budget" ? (
                                      <Select
                                        ref={optionsRef}
                                        options={[
                                          { value: "", label: "All Budget Codes" },
                                          ...(options?.data?.map((budget) => ({
                                            value: budget.budgetCode,
                                            label: budget.budgetCode,
                                          })) || []),
                                        ]}
                                        isSearchable
                                        onChange={(option) => {
                                          if (statusRef.current) statusRef.current.value = "All";
                                          setFilter(option?.value || "");
                                        }}
                                        placeholder={"Select Budget Code"}
                                        className="textSize"
                                      />
                                    ) : (
                    <Select
                      ref={optionsRef}
                      options={[
                        { value: "", label: "All Designations" },
                        ...(designation?.data?.map((dept) => ({
                          value: dept.designationName,
                          label: dept.designationName,
                        })) || []),
                      ]}
                      isSearchable
                      onChange={(option) => {
                        if (statusRef.current) statusRef.current.value = "All";
                        setFilter(option?.value || "");
                      }}
                      placeholder={"Select Designations"}
                      className="textSize"
                    />
                  )}
                </div>
                <div class="col-md-4 p-2">
                  <Select
                    ref={statusRef}
                    className="textSize"
                    options={statusOptions.sort((a,b) => a.label.localeCompare(b.label))}
                    onChange={(option) => handleStatusChange(option)}
                    value={statusFilter}
                    isSearchable
                  />
                </div>
              </div>
              <div class="table-responsive ">
                <table class="table table-sm">
                  <thead>
                    <tr>
                                  <th>
                       
                          <input
                            type="checkbox"
                            class="form-check-input"
                           checked={
  salaryGenerationList?.filter((item) => item.approvalEnabled).length > 0 &&
  salaryDraft.length === salaryGenerationList?.filter((item) => item.approvalEnabled).length
}
                            onChange={handleSelectAll}
                          />
                        
                      </th>
                      <th>Emp. Code</th>
                      <th>Employee Name</th>
                      <th>Department</th>
                      <th>Designation</th>
                       <th>Budget Code</th>
                      <th class="text-end">Total Earnings</th>
                      <th class="text-end">Total Deductions</th>
                      <th class="text-end">Net Salary</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryGenerationList
                        ?.filter((x) => {
                        if (!filter) return true;

                        if (option === "department")
                          return (
                            x?.departmentName?.toLowerCase() ===
                            filter.toLowerCase()
                          );

                        if (option === "designation")
                          return (
                            x?.designationName?.toLowerCase() ===
                            filter.toLowerCase()
                          );

                        if (option === "budget")
                          return (
                            x?.budgetCode?.toLowerCase() ===
                            filter.toLowerCase()
                          );

                        return true;
                      })
                      ?.map((item, index) => (
                        <tr key={index}>
                          <td>
                                          <input
                type="checkbox"
                className="form-check-input cursor-pointer data-checkbox"
                value={item.approvalStatus}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSalaryDraft((prev) => [...prev, item]);
                  } else {
                    setSalaryDraft((prev) =>
                      prev.filter((x) => x.employeeCode !== item.employeeCode)
                    );
                  }
                }}
                disabled={!item.approvalEnabled}
              />
                          </td>
                          <td>{item.employeeCode}</td>
                          <td>{item.employeeName}</td>
                          <td>{item.departmentName}</td>
                          <td>{item.designationName}</td>
                             <td>{item.budgetCode}</td>
                          <td className="text-end">
                            {new Intl.NumberFormat("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(item.totalEarnings)}
                          </td>
                          <td className="text-end">
                            {new Intl.NumberFormat("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(item.totalDeductions)}
                          </td>
                          <td className="text-end">
                            {new Intl.NumberFormat("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(item.netSalary)}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                statusColor.find(
                                  (x) =>
                                    x.status ===
                                    item.approvalStatus.toLowerCase()
                                )?.color
                              }`}
                            >
                              {item.approvalStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                {/* Summary row below the table */}
                {salaryGenerationList?.length > 0 && (
                  <div className="p-2 mb-3 mt-3" style={{border:"1px solid black"}}>
                    <div className="d-flex justify-between" style={{justifyContent:"center"}}>
                      <div className="fw-bold fs-6" style={{ width: '25%', fontSize: '1.2rem' }}>
                        Total Earnings: {"  "}G$ {new Intl.NumberFormat("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).format(salaryGenerationList.reduce((sum, item) => sum + (parseFloat(item.totalEarnings) || 0), 0))}
                      </div>
                      <div className="fw-bold fs-6" style={{ width: '25%', fontSize: '1.2rem' }}>
                        Total Deductions: {"  "}G$ {new Intl.NumberFormat("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).format(salaryGenerationList.reduce((sum, item) => sum + (parseFloat(item.totalDeductions) || 0), 0))}
                      </div>
                      <div className="fw-bold fs-6" style={{ width: '25%', fontSize: '1.2rem' }}>
                      Total Net Salary: {"  "}G$  {new Intl.NumberFormat("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).format(salaryGenerationList.reduce((sum, item) => sum + (parseFloat(item.netSalary) || 0), 0))}
                      </div>
                    </div>
                  </div>
                )}

                <div class="text-center pt-3">

                    <button
                    type="button"
                    class="btn btn-primary btn-sm py-2 px-4 me-2"
                    onClick={exportSalaryApproved}
                    disabled={salaryDraft.length === 0}
                  >
                    Export to Excel for Detailed Review
                  </button>
                   <button
                    type="button"
                    class="btn btn-primary btn-sm py-2 px-4 me-2"
                    onClick={exportSalaryALLRecord}
                    
                  >
                    Export  ALL RECORD
                  </button>
                
                  <button
                    type="button"
                    disabled={salaryDraft.length === 0 || statusFilter.value.toLowerCase() === "approved"}
                    class="btn btn-primary btn-sm py-2 px-4 me-2"
                    onClick={() => setShowRejectModal(true)}
                  >
                    Reject Selected Records
                  </button>
                  <button
                    type="button"
                    disabled={salaryDraft.length === 0 || statusFilter.value.toLowerCase() === "approved"}
                    class="btn btn-info btn-sm py-2 px-4 me-2"
                    onClick={() => showConfirmationModal("approve")}
                  >
                    Approve Selected Records
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{confirmAction.title}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowConfirmModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>{confirmAction.message}</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirmAction}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-outline-secondary"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reject Records</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowRejectModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Rejection Reason</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter rejection reason..."
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleRejectWorkflow}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowRejectModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <LoadingOverlay isLoading={showOverloay} />
    </div>
  );
}

export default SalaryApproved;
