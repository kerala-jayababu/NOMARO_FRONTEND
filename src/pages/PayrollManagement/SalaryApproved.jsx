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
  },
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

function SalaryApproved() {
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
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
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
  };

  useEffect(() => {
    async function fetchData() {
      const params = {
        idSalaryMonth: currentMonth?.value,
        status: "All",
      };
      dispatch(getSalaryGenerations(params));
      const { payload } = await dispatch(getSalaryGenerations(params));
      setAllSalaryList(payload.data);
    }

    fetchData();
  }, [dispatch, filter, currentMonth]);

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

  const statusOptions = [
    { value: "All", label: "All Status" },
    { value: "APPROVED", label: "Approved" },
    { value: "SUBMITTED", label: "Submitted" },
    { value: "DRAFT GENERATED", label: "Draft Generated" },
    { value: "NOT GENERATED", label: "Not Generated" },
    { value: "REJECTED", label: "Rejected" }
  ];

  const handleStatusChange = (status) => {
    if (status.value) {
      setStatusFilter(status);
      setSelectedCard(status.value);
      const params = {
        idSalaryMonth: currentMonth?.value,
        status: status?.value,
      };
      dispatch(getSalaryGenerations(params));
    }
  };

  const handleMonthFromChange = (option) => {
    setCurrentMonth(option);
    if (filterRef.current) filterRef.current.clearValue();
    if (optionsRef.current) optionsRef.current.clearValue();
    if (statusRef.current) statusRef.current.clearValue();
    setStatusFilter({ value: "All", label: "Select Status" });
  };

  const uncheckCheckBox = () => {
    Array.from(document.querySelectorAll(".form-check-input")).map((item) => {
      item.checked = false;
    });
  };

  const handleApprovalWorkflow = async () => {
    const content = salaryDraft.map((item) => ({
      entityTablePrimaryKeyID: item.idEmployeeSalary,
      entityCode: "EMPSALGEN",
      status: "APPROVED",
    }));
    const res = await SalaryGenerationService.handleApprovalWorkflow(content);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Approval Workflow Updated Successfully");
      uncheckCheckBox();
      setSalaryDraft([]);
      const params = {
        idSalaryMonth: currentMonth?.value,
        status: statusFilter?.value,
      };
      dispatch(getSalaryGenerations(params));
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
      remarks: rejectReason,
    }));

    const res = await SalaryGenerationService.handleApprovalWorkflow(content);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Records Rejected Successfully");
      uncheckCheckBox();
      setSalaryDraft([]);
      setRejectReason("");
      setShowRejectModal(false);
      const params = {
        idSalaryMonth: currentMonth?.value,
        status: statusFilter?.value,
      };
      dispatch(getSalaryGenerations(params));
    }
  };

  const handleConfirmAction = () => {
    switch (confirmAction.type) {
      case 'approve':
        handleApprovalWorkflow();
        break;
    }
    setShowConfirmModal(false);
  };

  const showConfirmationModal = (type) => {
    let title = '';
    let message = '';
    
    switch (type) {
      case 'approve':
        title = 'Approve Records';
        message = 'Are you sure you want to approve the selected records?';
        break;
    }

    setConfirmAction({ type, title, message });
    setShowConfirmModal(true);
  };

  return (
    <div class="container-xxl flex-grow-1 container-p-y">
      <div class="row">
        <div class="col-xl-12">
          <div class="card">
            <div class="card-header d-flex align-items-center justify-content-between pb-1">
              <h5 class="m-0 d-flex col-md-11 items-center justify-center">
                <span class="d-flex items-center justify-center pt-2">
                  Salary Generation Approval for the month of
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
                        onClick={() => handleStatusChange({ value: "All", label: "All Status" })}
                        style={{
                          backgroundColor: selectedCard === "All" ? "#e7e7ff" : "",
                          cursor: "pointer",
                          transition: "background-color 0.3s"
                        }}
                      >
                        <h5>Total Employees</h5>
                        <div class="count">
                          {allSalaryList?.length || 0}
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div class="card SalaryApproveCount">
                      <div
                        class="card-body"
                        onClick={() => handleStatusChange({ value: "APPROVED", label: "Approved" })}
                        style={{
                          backgroundColor: selectedCard === "APPROVED" ? "#e7e7ff" : "",
                          cursor: "pointer",
                          transition: "background-color 0.3s"
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
                        onClick={() => handleStatusChange({ value: "SUBMITTED", label: "Submitted" })}
                        style={{
                          backgroundColor: selectedCard === "SUBMITTED" ? "#e7e7ff" : "",
                          cursor: "pointer",
                          transition: "background-color 0.3s"
                        }}
                      >
                        <h5>Submitted</h5>
                        <div class="count">
                          {allSalaryList?.filter(
                            (x) => x.approvalStatus.toLowerCase() === "submitted" || x.approvalStatus.toLowerCase() === 'interim approved'
                          )?.length || 0}
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div class="card SalaryApproveCount">
                      <div
                        class="card-body"
                        onClick={() => handleStatusChange({ value: "DRAFT GENERATED", label: "Draft Generated" })}
                        style={{
                          backgroundColor: selectedCard === "DRAFT GENERATED" ? "#e7e7ff" : "",
                          cursor: "pointer",
                          transition: "background-color 0.3s"
                        }}
                      >
                        <h5>Draft Generated</h5>
                        <div class="count text-warning">
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
                        onClick={() => handleStatusChange({ value: "NOT GENERATED", label: "Not Generated" })}
                        style={{
                          backgroundColor: selectedCard === "NOT GENERATED" ? "#e7e7ff" : "",
                          cursor: "pointer",
                          transition: "background-color 0.3s"
                        }}
                      >
                        <h5>Not Generated</h5>
                        <div class="count text-info">
                          {allSalaryList?.filter(
                            (x) => x.approvalStatus.toLowerCase() === "not generated"
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
                    options={statusOptions}
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
                      <td></td>
                      <th>Emp. Code</th>
                      <th>Employee Name</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th class="text-end">Total Earnings</th>
                      <th class="text-end">Total Deductions</th>
                      <th class="text-end">Net Salary</th>
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
                              disabled={
                                item.approvalStatus.toLowerCase() !==
                                "submitted"
                              }
                            />
                          </td>
                          <td>{item.employeeCode}</td>
                          <td>{item.employeeName}</td>
                          <td>{item.departmentName}</td>
                          <td>{item.designationName}</td>
                          <td className="text-end">
                            {Number(item.totalEarnings).toFixed(2)}
                          </td>
                          <td className="text-end">
                            {Number(item.totalDeductions).toFixed(2)}
                          </td>
                          <td className="text-end">
                            {Number(item.netSalary).toFixed(2)}
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
                <div class="text-center pt-3">
                  <button
                    type="submit"
                    class="btn btn-primary btn-sm py-2 px-4 me-2"
                  >
                    Export to Excel for Detailed Review
                  </button>
                  <button
                    type="button"
                    disabled={salaryDraft.length === 0}
                    class="btn btn-primary btn-sm py-2 px-4 me-2"
                    onClick={() => setShowRejectModal(true)}
                  >
                    Reject Selected Records
                  </button>
                  <button
                    type="button"
                    disabled={salaryDraft.length === 0}
                    class="btn btn-info btn-sm py-2 px-4 me-2"
                    onClick={() => showConfirmationModal('approve')}
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
    </div>
  );
}

export default SalaryApproved;
