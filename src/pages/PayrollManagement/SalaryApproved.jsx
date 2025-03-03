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
  const [filter, setFilter] = useState("");
  const [option, setOption] = useState("");
  const [currentMonth, setCurrentMonth] = useState();
  const [filterType, setFilterType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("All");
  const { salaryGenerationList } = useSelector(
    (state) => state.salaryGeneration
  );
  const { departments } = useSelector((state) => state.department);
  const { designation } = useSelector((state) => state.designation);

  const getSalaryMonths = () => {
    CommonService.getAllSalaryMonths().then((res) => {
      const salMonths = res.data;
      const currentMonth = res.data
        .filter((month) =>
          month.salaryMonthText.includes(new Date().getFullYear().toString())
        )
        .find((month) =>
          month.salaryMonthText.includes(months[new Date().getMonth()])
        );
      setCurrentMonth({
        value: currentMonth.idSalaryMonth,
        label: currentMonth.salaryMonthText,
      });
      setSalaryMonthsList(salMonths);
    });
  };

  useEffect(() => {
    const params = {
      idSalaryMonth: currentMonth?.value,
      status: "All",
    };
    dispatch(getSalaryGenerations(params));
  }, [dispatch, filter, currentMonth]);

  useEffect(() => {
    getSalaryMonths();
  }, []);

  async function populateOptions(option) {
    if (option === "designation") {
      await dispatch(fetchDesignations());
    } else {
      await dispatch(fetchDepartments());
    }
    if (optionsRef.current) optionsRef.current.clearValue();
    setOption(option);
    setFilter("");
  }

  async function handleStatusChange(status) {
    setStatusFilter(status);
    const params = {
      idSalaryMonth: currentMonth?.value,
      status,
    };
    dispatch(getSalaryGenerations(params));
  }

  const handleMonthFromChange = (option) => {
    setCurrentMonth(option);
  };

  const generateSalaryDraft = async () => {
    const params = {
      idSalaryMonth: currentMonth?.value,
      status: "All",
    };
    const employeeIds = salaryDraft.map((item) => item.idEmployee).join(",");
    await SalaryGenerationService.generateDraftSalary(
      employeeIds,
      currentMonth.value
    );
    await dispatch(getSalaryGenerations(params));
  };

  const undoSalaryDraft = async () => {
    const params = {
      idSalaryMonth: currentMonth?.value,
      status: "All",
    };
    const employeeIds = salaryDraft.map((item) => item.idEmployee).join(",");
    await SalaryGenerationService.undoGeneratedDraftSalary(
      employeeIds,
      currentMonth.value
    );
    await dispatch(getSalaryGenerations(params));
  };

  const submitForApproval = async () => {
    const params = {
      idSalaryMonth: currentMonth?.value,
      status: "All",
    };
    const employeeIds = salaryDraft.map((item) => item.idEmployee).join(",");
    await SalaryGenerationService.submitSalaryDetails(
      employeeIds,
      currentMonth.value
    );
    await dispatch(getSalaryGenerations(params));
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
                        onClick={() => handleStatusChange(statusFilter)}
                      >
                        <h5>Total Employees</h5>
                        <div class="count">
                          {" "}
                          {salaryGenerationList?.length || 0}
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div class="card SalaryApproveCount">
                      <div
                        class="card-body"
                        onClick={() => handleStatusChange(statusFilter)}
                      >
                        <h5>Approved</h5>
                        <div class="count text-success">
                          {salaryGenerationList?.filter(
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
                        onClick={() => handleStatusChange(statusFilter)}
                      >
                        <h5>Submitted</h5>
                        <div class="count text-">
                          {salaryGenerationList?.filter(
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
                        onClick={() => handleStatusChange(statusFilter)}
                      >
                        <h5>Draft Generated</h5>
                        <div class="count text-warning">
                          {salaryGenerationList?.filter(
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
                        onClick={() => handleStatusChange(statusFilter)}
                      >
                        <h5>Pending</h5>
                        <div class="count text-info">
                          {salaryGenerationList?.filter(
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
                    className="textSize"
                    options={[
                      { value: "all", label: "All Employees" },
                      {
                        value: "designation",
                        label: "Filter Designation Based",
                      },
                      { value: "department", label: "Filter Department Based" },
                    ]}
                    defaultValue={{ value: "all", label: "All Employees" }}
                    onChange={(option) => {
                      populateOptions(option.value);
                      setFilterType(option.value);
                    }}
                  />
                </div>
                <div class="col-md-4 p-2">
                  {option === "department" ? (
                    <Select
                      ref={optionsRef}
                      options={departments?.data?.map((dept) => ({
                        value: dept.departmentName,
                        label: dept.departmentName,
                      }))}
                      isSearchable
                      onChange={(option) => {
                        if (statusRef.current) statusRef.current.value = "All";
                        setFilter(option?.value);
                      }}
                      placeholder={"Select Department"}
                      className="textSize"
                    />
                  ) : (
                    <Select
                      ref={optionsRef}
                      options={designation?.data?.map((dept) => ({
                        value: dept.designationName,
                        label: dept.designationName,
                      }))}
                      isSearchable
                      onChange={(option) => {
                        if (statusRef.current) statusRef.current.value = "All";
                        setFilter(option?.value);
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
                    options={[
                      { value: "All", label: "Select Status" },
                      { value: "APPROVED", label: "Approved" },
                      { value: "DRAFT GENERATED", label: "Draft Generated" },
                      { value: "SUBMITTED", label: "Submitted" },
                      { value: "NOT GENERATED", label: "Not Generated" },
                    ]}
                    defaultValue={{ value: "All", label: "Select Status" }}
                    onChange={(option) => handleStatusChange(option.value)}
                    value={{
                      value: statusFilter,
                      label:
                        statusFilter === "All"
                          ? "Select Status"
                          : statusFilter === "APPROVED"
                          ? "Approved"
                          : statusFilter === "DRAFT GENERATED"
                          ? "Draft Generated"
                          : statusFilter === "SUBMITTED"
                          ? "Submitted"
                          : statusFilter === "NOT GENERATED"
                          ? "Not Generated"
                          : "Select Status",
                    }}
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
                          <td className="text-end">{item.totalEarnings}</td>
                          <td className="text-end">{item.totalDeductions}</td>
                          <td className="text-end">{item.netSalary}</td>
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
                    type="submit"
                    class="btn btn-primary btn-sm py-2 px-4 me-2"
                  >
                    Reject Selected Records
                  </button>
                  <button
                    type="submit"
                    class="btn btn-info btn-sm py-2 px-4 me-2"
                  >
                    Approve Selected Records
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalaryApproved;
