import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getSalaryGenerations } from "../../redux/reducers/salaryGeneration";
import { fetchDepartments } from "../../redux/reducers/department";
import { fetchDesignations } from "../../redux/reducers/designation";
import CommonService from "../../core/services/CommonService";
import toast from "react-hot-toast";
import Select from "react-select";
import SalaryGenerationService from "../../core/services/SalaryGenerationService";

const statusColor = [
  {
    status: "approved",
    color: "bg-label-success",
  },
  {
    status: "submitted",
    color: "bg-label-primary",
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
    color: "bg-label-info",
  },
  {
    status: "rejected",
    color: "bg-label-danger",
  },
  {
    status: "interim approved",
    color: "bg-label-secondary",
  }
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
  { value: "REJECTED", label: "Rejected" }
];

function SalaryGeneration() {
  const dispatch = useDispatch();
  const [salaryMonthsList, setSalaryMonthsList] = useState([]);
  const [salaryDraft, setSalaryDraft] = useState([]);
  const optionsRef = useRef();
  const statusRef = useRef();
  const filterRef = useRef();
  const [filter, setFilter] = useState("");
  const [option, setOption] = useState("");
  const [currentMonth, setCurrentMonth] = useState();
  const [statusFilter, setStatusFilter] = useState({
    value: "All",
    label: "Select Status",
  });
  const { salaryGenerationList } = useSelector(
    (state) => state.salaryGeneration
  );
  const { departments } = useSelector((state) => state.department);
  const { designation } = useSelector((state) => state.designation);
  const [selectedCard, setSelectedCard] = useState("All");
  const [allSalaryList, setAllSalaryList] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState({ type: '', title: '', message: '' });
  
  const getSalaryMonths = () => {
    CommonService.getAllSalaryMonths().then((res) => {
      const currentMonth = res.data
        ?.filter((month) =>
          month.salaryMonthText.includes(new Date().getFullYear().toString())
        )
        .find((month) =>
          month.salaryMonthText.includes(months[new Date().getMonth()])
        );

      const filteredMonths = res.data.filter((month) => {
        const currentDate = new Date();
        const currentMonthIndex = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        const [monthName, year] = month.salaryMonthText.split(",");
        const monthIndex = months.indexOf(monthName);
        
        if (year.trim() == currentYear) {
          return monthIndex >= currentMonthIndex - 1 && monthIndex <= currentMonthIndex + 1;
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
  };

  useEffect(() => {

    async function fetchData(){
      const params = {
        idSalaryMonth: currentMonth?.value,
        status: "All",
      };
      const { payload } = await dispatch(getSalaryGenerations(params))
      setAllSalaryList(payload.data);
    }

    fetchData()

  }, [dispatch, currentMonth]);

  useEffect(() => {
    getSalaryMonths();
  }, []);

  async function populateOptions(option) {
    if (option) {
      if (option.value === "designation") {
        await dispatch(fetchDesignations());
      } else {
        await dispatch(fetchDepartments());
      }
      if (optionsRef.current) optionsRef.current.clearValue();
      setOption(option.value);
      setFilter("");
    }
  }

  const handleStatusChange = (status, cardName) => {
    if (status.value) {
      const params = {
        idSalaryMonth: currentMonth?.value,
        status: status?.value,
      };
      setSelectedCard(status.value);
      const selectedStatus = statusOptions.find(option => option.value === status.value);
      setStatusFilter(selectedStatus || { value: "All", label: "All Status" });
      dispatch(getSalaryGenerations(params));
    }
  };

  const handleMonthFromChange = (option) => {
    setCurrentMonth(option);
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
    const employeeIds = salaryDraft.map((item) => item.idEmployee).join(",");
    const response = await SalaryGenerationService.generateDraftSalary(
      employeeIds,
      currentMonth.value
    );

    if (!response.error) {
      toast.success("Draft Salary Generated Successfully");
      await dispatch(getSalaryGenerations(params));
    } else {
      toast.error(response.error);
    }
    setSalaryDraft([]);
    uncheckCheckBox();
  };

  const undoSalaryDraft = async () => {
    const params = {
      idSalaryMonth: currentMonth?.value,
      status: "All",
    };
    const employeeIds = salaryDraft.map((item) => item.idEmployee).join(",");
    const response = await SalaryGenerationService.undoGeneratedDraftSalary(
      employeeIds,
      currentMonth.value
    );

    if (!response.error) {
      toast.success("Draft Salary Generation Undone Successfully");
      await dispatch(getSalaryGenerations(params));
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
    const employeeIds = salaryDraft.map((item) => item.idEmployee).join(",");
    const response = await SalaryGenerationService.submitSalaryDetails(
      employeeIds,
      currentMonth.value
    );

    if (!response.error) {
      toast.success("Salary Submitted for Approval Successfully");
      await dispatch(getSalaryGenerations(params));
    } else {
      toast.error(response.error);
    }
    setSalaryDraft([]);
    uncheckCheckBox();
  };



  const disableApprovalbtn = () => {
    return (
      salaryDraft.filter((x) => x.approvalStatus.toLowerCase() === "draft")
        .length === 0
    );
  };

  const uncheckCheckBox = () => {
    Array.from(document.querySelectorAll(".form-check-input")).map((item) => {
      item.checked = false;
    });
  };

  const handleConfirmAction = () => {
    switch (confirmAction.type) {
      case 'generate':
        generateSalaryDraft();
        break;
      case 'undo':
        undoSalaryDraft();
        break;
      case 'submit':
        submitForApproval();
        break;
    }
    setShowConfirmModal(false);
  };

  const showConfirmationModal = (type) => {
    let title = '';
    let message = '';
    
    switch (type) {
      case 'generate':
        title = 'Generate Draft Salary';
        message = 'Are you sure you want to generate draft salary for selected employees?';
        break;
      case 'undo':
        title = 'Undo Draft Salary';
        message = 'Are you sure you want to undo draft salary for selected employees?';
        break;
      case 'submit':
        title = 'Submit for Approval';
        message = 'Are you sure you want to submit selected records for approval?';
        break;
    }

    setConfirmAction({ type, title, message });
    setShowConfirmModal(true);
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
                        onClick={() => handleStatusChange({ value: "All" }, "Total Employees")}
                        style={{
                          backgroundColor: selectedCard === "All" ? "#e7e7ff" : "",
                          cursor: "pointer",
                          transition: "background-color 0.3s"
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
                        onClick={() => handleStatusChange({ value: "APPROVED" }, "Approved")}
                        style={{
                          backgroundColor: selectedCard === "APPROVED" ? "#e7e7ff" : "",
                          cursor: "pointer",
                          transition: "background-color 0.3s"
                        }}
                      >
                        <h5>Approved</h5>
                        <div className="count text-success">
                          {allSalaryList?.filter(x => x.approvalStatus.toLowerCase() === "approved")?.length || 0}
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="card SalaryApproveCount">
                      <div
                        className="card-body"
                        onClick={() => handleStatusChange({ value: "SUBMITTED" }, "Submitted")}
                        style={{
                          backgroundColor: selectedCard === "SUBMITTED" ? "#e7e7ff" : "",
                          cursor: "pointer",
                          transition: "background-color 0.3s"
                        }}
                      >
                        <h5>Submitted</h5>
                        <div className="count">
                          {allSalaryList?.filter(
                            (x) => x.approvalStatus.toLowerCase() === "submitted"
                          )?.length}
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="card SalaryApproveCount">
                      <div
                        className="card-body"
                        onClick={() => handleStatusChange({ value: "DRAFT GENERATED" }, "Draft Generated")}
                        style={{
                          backgroundColor: selectedCard === "DRAFT GENERATED" ? "#e7e7ff" : "",
                          cursor: "pointer",
                          transition: "background-color 0.3s"
                        }}
                      >
                        <h5>Draft Generated</h5>
                        <div className="count text-warning">
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
                        onClick={() => handleStatusChange({ value: "NOT GENERATED" }, "Pending")}
                        style={{
                          backgroundColor: selectedCard === "NOT GENERATED" ? "#e7e7ff" : "",
                          cursor: "pointer",
                          transition: "background-color 0.3s"
                        }}
                      >
                        <h5>Not Generated</h5>
                        <div className="count text-info">
                          {allSalaryList?.filter(
                            (x) => x.approvalStatus.toLowerCase() === "not generated"
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
                        })) || [])
                      ]}
                      isSearchable
                      onChange={(option) => {
                        if (statusRef.current) statusRef.current.value = "All";
                        setFilter(option?.value || "");
                      }}
                      placeholder={"Select Department"}
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
                        })) || [])
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
                      <th></th>
                      <th>Emp. Code</th>
                      <th>Employee Name</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th className="text-end">Total Earnings</th>
                      <th className="text-end">Total Deductions</th>
                      <th className="text-end">Net Salary</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryGenerationList
                      ?.filter(
                        (x) =>
                          x.departmentName.toLowerCase() ===
                            filter.toLowerCase() ||
                          x.designationName.toLowerCase() ===
                            filter.toLowerCase() ||
                          filter.length === 0
                      )
                      ?.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <input
                              type="checkbox"
                              className="form-check-input cursor-pointer"
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
                          <td className="text-end">{Number(item.totalEarnings).toFixed(2)}</td>
                          <td className="text-end">{Number(item.totalDeductions).toFixed(2)}</td>
                          <td className="text-end">{Number(item.netSalary).toFixed(2)}</td>
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
                    onClick={() => showConfirmationModal('generate')}
                    type="button"
                    disabled={
                      salaryDraft.filter(
                        (x) => x.approvalStatus.toLowerCase() === "not generated"
                      ).length === 0
                    }
                    className="btn btn-primary btn-sm py-2 px-4 me-2"
                  >
                    Generate Draft Salary
                  </button>
                  <button
                    type="button"
                    onClick={() => showConfirmationModal('undo')}
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
                    type="submit"
                    className="btn btn-primary btn-sm py-2 px-4 me-2"
                  >
                    Export to Excel for Review
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm py-2 px-4 me-2"
                  >
                    Import from Excel
                  </button>
                  <button
                    onClick={() => showConfirmationModal('submit')}
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
    </div>
  );
}

export default SalaryGeneration;
