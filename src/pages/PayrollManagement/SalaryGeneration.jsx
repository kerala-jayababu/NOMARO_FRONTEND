import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getSalaryGenerations } from "../../redux/reducers/salaryGeneration";
import { fetchDepartments } from "../../redux/reducers/department";
import { fetchDesignations } from "../../redux/reducers/designation";
import CommonService from "../../core/services/CommonService";
import toast from "react-hot-toast";
import Select from "react-select";
import SalaryGenerationService from "../../core/services/SalaryGenerationService";
import { Modal } from "react-bootstrap";
import Utils from "../../utils/Utils";
import { BASE_URL, getSalaryHeadList } from "../../utils/service";
import LoadingOverlay from "../../components/LoadingOverlay";
import { API } from "../../redux/api/utils";
import { fetchBudgetCode } from "../../redux/reducers/budgetCode";
import { compare } from "mathjs";

const statusColor = [
  {
    status: "approved",
    color: "bg-success",
  },
  {
    status: "submitted",
    color: "bg-warning",
  },
  {
    status: "draft generated",
    color: "bg-label-warning",
  },
  {
    status: "draft",
    color: "bg-label-warning",
  },
  {
    status: "not generated",
    color: "bg-dark",
  },
  {
    status: "rejected",
    color: "bg-danger",
  },
  {
    status: "interim approved",
    color: "bg-info",
  },
  { status: "fm approved", color: "bg-info" },
  { status: "hr approved", color: "bg-info" },
];

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const statusOptions = [
  { value: "All", label: "All Status" },
  { value: "APPROVED", label: "Approved" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "DRAFT GENERATED", label: "Draft Generated" },
  { value: "NOT GENERATED", label: "Not Generated" },
  { value: "REJECTED", label: "Rejected" },
];

function SalaryGeneration() {
  const dispatch = useDispatch();
  const [showOverloay, setShowOverlay] = useState(false);
  const [salaryMonthsList, setSalaryMonthsList] = useState([]);
  const [salaryDraft, setSalaryDraft] = useState([]);
  const [draftSalary, setDraftSalary] = useState([]);
  const [importedData, setImportedData] = useState([]);
  const [showImportData, setShowImportData] = useState(false);
  const [statusOptions, setStatusOptions] = useState([]);
  const [show, setShow] = useState(false);
  const optionsRef = useRef();
  const statusRef = useRef();
  const filterRef = useRef();
  const [filter, setFilter] = useState("");
  const [option, setOption] = useState("");
  const [currentMonth, setCurrentMonth] = useState();
  const [file, setFile] = useState();
  const [statusFilter, setStatusFilter] = useState({
    value: "All",
    label: "Select Status",
  });
  const { salaryGenerationList } = useSelector(
    (state) => state.salaryGeneration
  );
  const { departments } = useSelector((state) => state.department);
  const { designation } = useSelector((state) => state.designation);
  const { options } = useSelector((state) => state.budgetCode);
  const [selectedCard, setSelectedCard] = useState("All");
  const [allSalaryList, setAllSalaryList] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState({
    type: "",
    title: "",
    message: "",
  });

  const handleSelectAll = (e) => {
    if (e.target.checked && salaryGenerationList) {
      setSalaryDraft(
        salaryGenerationList.filter(
          (x) =>
            statusFilter.value
              .toLowerCase()
              .search(x.approvalStatus.toLowerCase()) >= 0
        )
      );
    } else {
      setSalaryDraft([]);
    }
    handelCheckboxCheck(e.target.checked);
  };

  const handelCheckboxCheck = (checked) => {
    
    Array.from(document.querySelectorAll(".data-checkbox")).map((item) => {
      if (!item.disabled) {
        item.checked = checked;
      }
    });
  };

  const getSalaryMonths = async () => {
    CommonService.getAllSalaryMonths().then((res) => {
      const currentMonth = res.data
        ?.filter((month) =>
          month.salaryMonthText.includes(new Date().getFullYear().toString())
        )
        .find((month) =>
          month.salaryMonthText.includes(months[new Date().getMonth()])
        );

      const filteredMonths = res.data?.filter((month) => {
        const currentDate = new Date();
        const currentMonthIndex = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        const [monthName, year] = month.salaryMonthText.split(",");
        const monthIndex = months.indexOf(monthName);

        if (year.trim() == currentYear) {
          return (
            monthIndex >= currentMonthIndex - 1 &&
            monthIndex <= currentMonthIndex + 1
          );
        }
        if (year.trim() == currentYear - 1) {
          return monthIndex === 11 && currentMonthIndex === 0;
        }
        if (year.trim() == currentYear + 1) {
          return monthIndex === 0 && currentMonthIndex === 11;
        }
        return false;
      });

      setCurrentMonth({
        value: currentMonth.idSalaryMonth,
        label: currentMonth.salaryMonthText,
      });
      setSalaryMonthsList(filteredMonths);
    });

    const statusResponse = await API.get(
      `${BASE_URL}/api/v1/Common/GetSalaryOptions`
    );
    const statusData = statusResponse?.data || [];
    const formattedStatus = statusData.map((item) => ({
      value: item.value,
      label: item.label,
    }));
    const fullStatusOptions = [
      { value: "All", label: "All Status" },
      ...formattedStatus,
    ];
    setStatusOptions(fullStatusOptions);
  };

  useEffect(() => {
    async function fetchData() {
      const params = {
        idSalaryMonth: currentMonth?.value,
        status: "All",
      };
      const { payload } = await dispatch(getSalaryGenerations(params));
      setAllSalaryList(payload.data);
      clearAllFilter();
    }

    fetchData();
  }, [dispatch, currentMonth]);

  useEffect(() => {
    getSalaryMonths();
  }, []);

  async function populateOptions(option) {
    if (option) {
      if (option.value === "designation") {
        await dispatch(fetchDesignations());
      } else if (option.value === "budget") {
        const result = await dispatch(fetchBudgetCode());
        console.log("Fetched budget codes:", result?.payload?.data);
      } else {
        await dispatch(fetchDepartments());
      }      
      if (optionsRef.current) optionsRef.current.clearValue();
      setOption(option.value);
      setSalaryDraft([]);
      handelCheckboxCheck(false);
      setFilter("");
    }
  }

  const handleStatusChange = (status, cardName) => {
    if (status?.value) {
      const params = {
        idSalaryMonth: currentMonth?.value,
        status: status?.value,
      };
      setSelectedCard(status.value);
      const selectedStatus = statusOptions.find(
        (option) => option.value === status.value
      );
      setSalaryDraft([]);
      handelCheckboxCheck(false);
      setStatusFilter(selectedStatus || { value: "All", label: "All Status" });
      dispatch(getSalaryGenerations(params));
    }
  };

  const handleMonthFromChange = (option) => {
    setCurrentMonth(option);
    clearAllFilter();
  };

  const clearAllFilter = () => {
    setSalaryDraft([]);
    handelCheckboxCheck(false);
    setSelectedCard("All");
    if (filterRef.current) filterRef.current.clearValue();
    if (optionsRef.current) optionsRef.current.clearValue();
    if (statusRef.current) statusRef.current.clearValue();
  };

  function disableCheckBox(item) {
    return (
      item.approvalStatus.toLowerCase() === "submitted" ||
      item.approvalStatus.toLowerCase() == "approved" ||
      (salaryDraft.length > 0 &&
        salaryDraft[0]?.approvalStatus?.toLowerCase() === "draft" &&
        item.approvalStatus.toLowerCase() === "not generated") ||
      (salaryDraft.length > 0 &&
        salaryDraft[0]?.approvalStatus?.toLowerCase() === "not generated" &&
        item.approvalStatus.toLowerCase() === "draft")
    );
  }

  const generateSalaryDraft = async () => {
    const params = {
      idSalaryMonth: currentMonth?.value,
      status: "All",
    };

    let filteredRecords = salaryDraft;
     if (filter && option) {
      filteredRecords = filteredRecords.filter((x) => {
        if (option === "department") {
          return x?.departmentName?.toLowerCase() === filter.toLowerCase();
        } else if (option === "designation") {
          return x?.designationName?.toLowerCase() === filter.toLowerCase();
        } else if (option === "budget") {
          return x?.budgetCode?.toLowerCase() === filter.toLowerCase();
        }
        return true;
      });
    }
    const employeeIds = filteredRecords.map((item) => item.idEmployee).join(",");
    setShowOverlay(true);
    const response = await SalaryGenerationService.generateDraftSalary(
      employeeIds,
      currentMonth.value
    );
    setShowOverlay(false);
    if (!response.error) {
      setDraftSalary(response.data.data);
      setShow(true);
      const { payload } = await dispatch(getSalaryGenerations(params));
      setAllSalaryList(payload.data);
      clearAllFilter();
    } else {
      toast.error(response.error);
    }
    setSalaryDraft([]);
    uncheckCheckBox();
  };

  const ShowDraft = useCallback(
    ({ show, setShow }) => {
      return (
        <Modal
          show={show}
          onHide={() => {
            setDraftSalary([]);
            setShow(false);
          }}
          size="xl"
          aria-labelledby="contained-modal-title-vcenter"
          backdrop="static"
          keyboard={false}
          position="top-center"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <h5>Draft Salary Details</h5>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div
              style={{ width: "69rem", height: "50vh", overflowY: "scroll" }}
            >
              <table className="table">
                <tr>
                  <th className="p-2">Employee Code</th>
                  <th className="p-2">Employee Name</th>
                  <th className="p-2">Designation Name</th>
                  <th className="p-2">Salary Generation Status</th>
                </tr>
                {draftSalary.map((item) => (
                  <tr key={item.idEmployee}>
                    <td className="p-2">{item.employeeCode}</td>
                    <td className="p-2">{item.employeeName}</td>
                    <td className="p-2">{item.designationName}</td>
                    <td className="p-2">{item.salaryGenerationStatus}</td>
                  </tr>
                ))}
              </table>
            </div>
          </Modal.Body>
        </Modal>
      );
    },
    [draftSalary]
  );

  const ShowImport = useCallback(
    ({ setShowImportData, showImportData }) => {
      return (
        <Modal
          show={showImportData}
          onHide={() => {
            setShowImportData(false);
          }}
          size="xl"
          aria-labelledby="contained-modal-title-vcenter"
          backdrop="static"
          keyboard={false}
          position="top-center"
          className="imp-sal-det"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <h5>Imported Salary Details</h5>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div
              style={{ width: "69rem", height: "50vh", overflowY: "scroll" }}
            >
              <table className="table">
                <tr>
                  <th className="p-2">Employee Code</th>
                  <th className="p-2">Upload Status</th>
                </tr>
                {importedData?.map((item) => (
                  <tr key={item.idEmployee}>
                    <td className="p-2">{item.employeeCode}</td>
                    <td className="p-2">{item.uploadStatus}</td>
                  </tr>
                ))}
              </table>
            </div>
          </Modal.Body>
        </Modal>
      );
    },
    [importedData]
  );

  const undoSalaryDraft = async () => {
    const params = {
      idSalaryMonth: currentMonth?.value,
      status: "All",
    };
    const employeeIds = salaryDraft.map((item) => item.idEmployee).join(",");
    setShowOverlay(true);
    const response = await SalaryGenerationService.undoGeneratedDraftSalary(
      employeeIds,
      currentMonth.value
    );
    setShowOverlay(false);
    if (!response.error) {
      toast.success("Draft Salary Generation Undone Successfully");
      const { payload } = await dispatch(getSalaryGenerations(params));
      setAllSalaryList(payload.data);
      clearAllFilter();
    } else {
      toast.error(response.error);
    }
    setSalaryDraft([]);
    uncheckCheckBox();
  };

  const submitForApproval = async () => {
    const params = {
      idSalaryMonth: currentMonth?.value,
      status: "All",
    };

    let filteredRecords = salaryDraft;
     if (filter && option) {
      filteredRecords = filteredRecords.filter((x) => {
        if (option === "department") {
          return x?.departmentName?.toLowerCase() === filter.toLowerCase();
        } else if (option === "designation") {
          return x?.designationName?.toLowerCase() === filter.toLowerCase();
        } else if (option === "budget") {
          return x?.budgetCode?.toLowerCase() === filter.toLowerCase();
        }
        return true;
      });
    }
    const employeeIds = filteredRecords.map((item) => item.idEmployee).join(",");
    setShowOverlay(true);
    const response = await SalaryGenerationService.submitSalaryDetails(
      employeeIds,
      currentMonth.value
    );
    setShowOverlay(false);
    if (!response.error) {
      toast.success("Salary Submitted for Approval Successfully");
      const { payload } = await dispatch(getSalaryGenerations(params));
      setAllSalaryList(payload.data);
      clearAllFilter();
    } else {
      toast.error(response.error);
    }
    setSalaryDraft([]);
    uncheckCheckBox();
  };

  const disableApprovalbtn = () => {
    return (
      salaryDraft.filter(
        (x) =>
          x.approvalStatus.toLowerCase() === "draft" ||
          x.approvalStatus.toLowerCase() === "rejected"
      ).length === 0
    );
  };

  const uncheckCheckBox = () => {
    Array.from(document.querySelectorAll(".form-check-input")).map((item) => {
      item.checked = false;
    });
  };

  const handleConfirmAction = () => {
    switch (confirmAction.type) {
      case "generate":
        generateSalaryDraft();
        break;
      case "undo":
        undoSalaryDraft();
        break;
      case "submit":
        submitForApproval();
        break;
    }
    setShowConfirmModal(false);
  };

  const showConfirmationModal = (type) => {
    let title = "";
    let message = "";

    switch (type) {
      case "generate":
        title = `Generate Draft Salary - ${currentMonth?.label || ''}`;
        message =
          "Are you sure you want to generate draft salary for selected employees?";
        break;
      case "undo":
        title = `Undo Draft Salary - ${currentMonth?.label || ''}`;
        message =
          "Are you sure you want to undo draft salary for selected employees?";
        break;
      case "submit":
        title = `Submit for Approval - ${currentMonth?.label || ''}`;
        message =
          "Are you sure you want to submit selected records for approval?";
        break;
    }

    setConfirmAction({ type, title, message });
    setShowConfirmModal(true);
  };

  const ExportSalaryGeneration = async () => {
    const employeeIds = salaryDraft.map((item) => item.idEmployee).join(",");
    setShowOverlay(true);
    const response = await SalaryGenerationService.exportSalaryGeneration(
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

  const downloadFile = (item) => {
    const base64Data = item.fileContent;
    const fileName = item.fileName || "downloaded-file";

    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: item.fileType });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }
    try {
      const salaryHeadList = await getSalaryHeadList();
      console.log(salaryHeadList);
      const data = await Utils.processExcelFile(file, salaryHeadList.data);
      const content = {
        idSalaryMonth: currentMonth.value,
        employeeSalaryJsonData: data,
      };
      setShowOverlay(true);
      const response =
        await SalaryGenerationService.UploadSalaryGenerationDetails(content);
      setShowOverlay(false);
      if (response.error) {
        toast.error(response.error);
      } else {
        setImportedData(response.data.data);
        setShowImportData(true);
        setShowImportModal(false);
      }
      const params = {
        idSalaryMonth: currentMonth?.value,
        status: "All",
      };
      const { payload } = await dispatch(getSalaryGenerations(params));
      setAllSalaryList(payload.data);
      clearAllFilter();
    } catch (error) {
      console.error("Error processing Excel file:", error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files;

    if (!file) {
      toast.error("Please select a file");
      return;
    }

    if (file[0].name.split(".").pop() !== "xlsx") {
      toast.error("Please select an Excel file");
      return;
    }
    setFile(file[0]);
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-xl-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-1">
              <h5 className="m-0 d-flex col-md-11 items-center justify-center">
                <span className="d-flex items-center justify-center pt-2">
                  Salary Generation for the Month of
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
            <div className="card-body">
              <div className="p-2">
                <ul className="SalaryApproveCount_ul">
                  <li>
                    <div className="card SalaryApproveCount">
                      <div
                        className="card-body"
                        onClick={() =>
                          handleStatusChange(
                            { value: "All" },
                            "Total Employees"
                          )
                        }
                        style={{
                          backgroundColor:
                            selectedCard === "All" ? "#e7e7ff" : "",
                          cursor: "pointer",
                          transition: "background-color 0.3s",
                        }}
                      >
                        <h5>Total Employees</h5>
                        <div className="count">
                          {allSalaryList?.length || 0}
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="card SalaryApproveCount">
                      <div
                        className="card-body"
                        onClick={() =>
                          handleStatusChange({ value: "APPROVED" }, "Approved")
                        }
                        style={{
                          backgroundColor:
                            selectedCard === "APPROVED" ? "#e7e7ff" : "",
                          cursor: "pointer",
                          transition: "background-color 0.3s",
                        }}
                      >
                        <h5>Approved</h5>
                        <div className="count text-success">
                          {allSalaryList?.filter(
                            (x) => x.approvalStatus.toLowerCase() === "approved"
                          )?.length || 0}
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="card SalaryApproveCount">
                      <div
                        className="card-body"
                        onClick={() =>
                          handleStatusChange(
                            { value: "SUBMITTED" },
                            "Submitted"
                          )
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
                          {
                            allSalaryList?.filter(
                              (x) =>
                                x.approvalStatus.toLowerCase() ===
                                  "submitted" ||
                                x.approvalStatus.toLowerCase() ===
                                  "interim approved"
                            )?.length
                          }
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="card SalaryApproveCount">
                      <div
                        className="card-body"
                        onClick={() =>
                          handleStatusChange(
                            { value: "DRAFT GENERATED" },
                            "Draft Generated"
                          )
                        }
                        style={{
                          backgroundColor:
                            selectedCard === "DRAFT GENERATED" ? "#e7e7ff" : "",
                          cursor: "pointer",
                          transition: "background-color 0.3s",
                        }}
                      >
                        <h5>Draft Generated</h5>
                        <div className="count text-secondary">
                          {allSalaryList?.filter(
                            (x) => x.approvalStatus.toLowerCase() === "draft"
                          )?.length || 0}
                        </div>
                      </div>
                    </div>
                  </li>

                  <li>
                    <div className="card SalaryApproveCount">
                      <div
                        className="card-body"
                        onClick={() =>
                          handleStatusChange(
                            { value: "NOT GENERATED" },
                            "Pending"
                          )
                        }
                        style={{
                          backgroundColor:
                            selectedCard === "NOT GENERATED" ? "#e7e7ff" : "",
                          cursor: "pointer",
                          transition: "background-color 0.3s",
                        }}
                      >
                        <h5>Not Generated</h5>
                        <div className="count text-dark">
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
              <div className="row m-0 pb-2">
                <div className="col-md-4 p-2">
                  <Select
                    options={[
                      { value: "", label: "All Employees" },
                      {
                        value: "designation",
                        label: "Filter Designation Based",
                      },
                      { value: "department", label: "Filter Department Based" },
                      { value: "budget", label: "Filter Budget Based" },
                    ]}
                    isSearchable
                    ref={filterRef}
                    onChange={(option) => populateOptions(option)}
                    placeholder="All Employees"
                    className="textSize"
                  />
                </div>
                <div className="col-md-4 p-2">
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
                <div className="col-md-4 p-2">
                  <Select
                    ref={statusRef}
                    options={statusOptions}
                    isSearchable
                    onChange={(option) => {
                      setStatusFilter(option);
                      handleStatusChange(option);
                    }}
                    value={statusFilter}
                    className="textSize"
                  />
                </div>
              </div>
              <div className="table-responsive ">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>
                        {["not generated", "draft generated", "rejected"].includes(
                          statusFilter?.value?.toLowerCase()
                        ) && (
                          <input
                            type="checkbox"
                            class="form-check-input"
                            checked={
                              salaryDraft.length ===
                              salaryGenerationList?.length
                            }
                            onChange={handleSelectAll}
                          />
                        )}
                      </th>
                      <th>Emp. Code</th>
                      <th>Employee Name</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th>Budget Code</th>
                      <th className="text-end">Total Earnings</th>
                      <th className="text-end">Total Deductions</th>
                      <th className="text-end">Net Salary</th>
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
                                    prev.filter(
                                      (x) =>
                                        x.employeeCode !== item.employeeCode
                                    )
                                  );
                                }
                              }}
                              disabled={disableCheckBox(item)}
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
                <div className="text-center pt-3">
                  <button
                    onClick={() => showConfirmationModal("generate")}
                    type="button"
                    disabled={
                      salaryDraft.filter(
                        (x) =>
                          x.approvalStatus.toLowerCase() === "not generated"
                      ).length === 0
                    }
                    className="btn btn-primary btn-sm py-2 px-4 me-2"
                  >
                    Generate Draft Salary
                  </button>
                  <button
                    type="button"
                    onClick={() => showConfirmationModal("undo")}
                    disabled={
                      salaryDraft.filter(
                        (x) => x.approvalStatus.toLowerCase() === "draft"
                      ).length === 0
                    }
                    className="btn btn-primary btn-sm py-2 px-4 me-2"
                  >
                    Undo Draft Salary Generation
                  </button>
                  <button
                    disabled={
                      salaryDraft.filter(
                        (x) =>
                          x.approvalStatus.toLowerCase() === "draft" ||
                          x.approvalStatus.toLowerCase() === "rejected"
                      ).length === 0
                    }
                    onClick={() => ExportSalaryGeneration()}
                    className="btn btn-primary btn-sm py-2 px-4 me-2"
                  >
                    Export to Excel for Review
                  </button>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="btn btn-primary btn-sm py-2 px-4 me-2"
                  >
                    Import from Excel
                  </button>
                  <button
                    onClick={() => showConfirmationModal("submit")}
                    disabled={disableApprovalbtn()}
                    type="button"
                    style={{
                      backgroundColor: disableApprovalbtn() ? "#7dccdc" : "",
                    }}
                    className="btn btn-info btn-sm py-2 px-4 me-2"
                  >
                    Submit for Approval
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
                  Confirm
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Import from Excel</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowImportModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <input type="file" onChange={handleFileChange} />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleImport}
                >
                  upload
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowImportModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ShowDraft show={show} setShow={setShow} />
      <ShowImport
        showImportData={showImportData}
        setShowImportData={setShowImportData}
      />
      <LoadingOverlay isLoading={showOverloay} />
    </div>
  );
}

export default SalaryGeneration;
