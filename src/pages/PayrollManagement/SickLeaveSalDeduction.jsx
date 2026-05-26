import { useEffect, useMemo, useState } from "react";
import moment from "moment";
import { Form, Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import Select from "react-select";
import Pagination from "../../components/pagination";
import CommonService from "../../core/services/CommonService";
import SickLeaveSalDeductionService from "../../core/services/SickLeaveSalDeductionService";
import Utils from "../../utils/Utils";

function SickLeaveSalDeduction() {
  const [salaryMonthsList, setSalaryMonthsList] = useState([]);
  const [employeesOptions, setEmployeesOptions] = useState([]);
  const [tableRows, setTableRows] = useState([]);
  const [originalRows, setOriginalRows] = useState({});
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFromDate, setFilterFromDate] = useState(
    moment().subtract(1, "month").startOf("month").format("YYYY-MM-DD")
  );
  const [filterToDate, setFilterToDate] = useState("");
  const [filterSalaryMonth, setFilterSalaryMonth] = useState("");
  const [searchText, setSearchText] = useState("");

  // Bottom action
  const [adjustingSalaryMonth, setAdjustingSalaryMonth] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(tableRows.length / rowsPerPage);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [validated, setValidated] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [newRecord, setNewRecord] = useState(defaultRecord());

  function defaultRecord() {
    return {
      idEmployee: 0,
      fromDate: "",
      toDate: "",
      totalLeaveDays: 0,
      reason: "",
      salaryDeductionDays: "",
      salaryDeductionRemarks: "",
      medicalProducedYesNo: false,
      idSalaryMonth: "",
    };
  }

  // Salary months filtered up to current month (for filter dropdown)
  const filterSalaryMonths = useMemo(() => {
    const currentMonthStart = moment().startOf("month");
    return salaryMonthsList.filter(
      (m) => !moment(m.salaryMonthDate).startOf("month").isAfter(currentMonthStart)
    );
  }, [salaryMonthsList]);

  // Salary months: current + next 2 (for adjusting dropdown and modal)
  const adjustingSalaryMonths = useMemo(() => {
    const currentMonthStart = moment().startOf("month");
    return salaryMonthsList.filter((m) => {
      const diff = moment(m.salaryMonthDate)
        .startOf("month")
        .diff(currentMonthStart, "months");
      return diff >= 0 && diff <= 2;
    });
  }, [salaryMonthsList]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return tableRows.slice(start, start + rowsPerPage);
  }, [tableRows, currentPage]);

  useEffect(() => {
    getSalaryMonths();
    getEmployees();
  }, []);

  // Auto-calculate total leave days in modal
  useEffect(() => {
    if (newRecord.fromDate && newRecord.toDate) {
      const from = moment(newRecord.fromDate);
      const to = moment(newRecord.toDate);
      const days = to.isSameOrAfter(from) ? to.diff(from, "days") + 1 : 0;
      setNewRecord((prev) => ({ ...prev, totalLeaveDays: days }));
    }
  }, [newRecord.fromDate, newRecord.toDate]);

  const getSalaryMonths = () => {
    CommonService.getAllSalaryMonths()
      .then((res) => setSalaryMonthsList(res.data || []))
      .catch(() => {});
  };

  const getEmployees = () => {
    CommonService.getEmployeeList()
      .then((res) => {
        const list = res.data?.data || [];
        setEmployeesOptions(
          list.map((emp) => ({
            value: emp.idEmployee,
            label: `${emp.employeeCode} - ${emp.fullName}`,
          }))
        );
      })
      .catch(() => {});
  };

  const fetchLeaveApplications = () => {
    setLoading(true);
    const params = {};
    if (filterStatus) params.adjustStatus = filterStatus;
    if (filterFromDate) params.fromDate = moment(filterFromDate).format("YYYY-MM-DD");
    if (filterToDate) params.toDate = moment(filterToDate).format("YYYY-MM-DD");
    if (searchText) params.searchText = searchText;
    if (filterSalaryMonth) params.idSalaryMonth = filterSalaryMonth;

    SickLeaveSalDeductionService.getLeaveApplications(params)
      .then((res) => {
        const data = res.data?.data || [];
        const mapped = data.map((item) => ({
          ...item,
          _medCert: item.medicalProducedYesNo ?? false,
          _deductDays: item.salaryDeductionDays ?? "",
          _remarks: item.salaryDeductionRemarks ?? "",
        }));
        setTableRows(mapped);
        const snapshot = {};
        mapped.forEach((row) => {
          snapshot[row.idLeaveApplication] = {
            _medCert: row._medCert,
            _deductDays: row._deductDays,
            _remarks: row._remarks,
          };
        });
        setOriginalRows(snapshot);
        setCurrentPage(1);
      })
      .catch(() => setTableRows([]))
      .finally(() => setLoading(false));
  };

  const updateRowField = (idLeaveApplication, field, value) => {
    setTableRows((prev) =>
      prev.map((row) =>
        row.idLeaveApplication === idLeaveApplication
          ? { ...row, [field]: value }
          : row
      )
    );
  };

  const isRowLocked = (row) => (row.idEmployeeSalary ?? 0) > 0;

  const isRowDirty = (row) => {
    const orig = originalRows[row.idLeaveApplication];
    if (!orig) return false;
    return (
      row._medCert !== orig._medCert ||
      String(row._deductDays) !== String(orig._deductDays) ||
      row._remarks !== orig._remarks
    );
  };

  const getStatus = (row) =>
    row.adjustedStatus === null || row.adjustedStatus === undefined
      ? "PENDING"
      : "ADJUSTED";

  const handleSubmit = () => {
    if (!adjustingSalaryMonth) {
      toast.error("Please select an Adjusting Salary Month.", {
        position: "top-right",
        autoClose: 2000,
      });
      return;
    }

    const editableRows = tableRows.filter((row) => !isRowLocked(row) && isRowDirty(row));
    if (editableRows.length === 0) {
      toast.warning("No changes detected to submit.", {
        position: "top-right",
        autoClose: 2000,
      });
      return;
    }

    for (const row of editableRows) {
      const deductDays = parseFloat(row._deductDays) || 0;
      if (deductDays > (row.totalLeaveDays || 0) && !row._remarks?.trim()) {
        toast.error(
          `Remarks are mandatory when Deduct Days exceeds Total Leave Days (${row.employeeName}).`,
          { position: "top-right", autoClose: 3000 }
        );
        return;
      }
    }

    const payload = editableRows.map((row) => ({
      idLeaveApplication: row.idLeaveApplication,
      idSalaryMonth: parseInt(adjustingSalaryMonth),
      medCertificateProduced: row._medCert,
      deductableDays: parseFloat(row._deductDays) || 0,
      remarks: row._remarks || "",
    }));

    setLoading(true);
    SickLeaveSalDeductionService.updateSickLeaveSalaryDeduction(payload)
      .then(() => {
        toast.success("Records updated successfully.", {
          position: "top-right",
          autoClose: 2000,
        });
        fetchLeaveApplications();
        setAdjustingSalaryMonth("");
      })
      .catch(() => {
        toast.error("Failed to update records.", {
          position: "top-right",
          autoClose: 2000,
        });
      })
      .finally(() => setLoading(false));
  };

  const handleReset = () => {
    setTableRows((prev) =>
      prev.map((row) =>
        isRowLocked(row)
          ? row
          : {
              ...row,
              _medCert: row.medicalProducedYesNo ?? false,
              _deductDays: row.salaryDeductionDays ?? "",
              _remarks: row.salaryDeductionRemarks ?? "",
            }
      )
    );
    setAdjustingSalaryMonth("");
  };

  const resetModal = () => {
    setValidated(false);
    setSelectedEmployee(null);
    setNewRecord(defaultRecord());
  };

  const isModalValid = () => {
    if (!newRecord.idEmployee || !newRecord.fromDate || !newRecord.toDate || !newRecord.idSalaryMonth) {
      return false;
    }
    const deductDays = parseFloat(newRecord.salaryDeductionDays) || 0;
    if (deductDays > newRecord.totalLeaveDays && !newRecord.salaryDeductionRemarks?.trim()) {
      return false;
    }
    return true;
  };

  const handleSave = (e) => {
    e.preventDefault();
    setValidated(true);
    if (!isModalValid()) return;

    const payload = {
      idLeaveApplication: 0,
      idEmployee: newRecord.idEmployee,
      fromDate: moment(newRecord.fromDate).toISOString(),
      toDate: moment(newRecord.toDate).toISOString(),
      totalLeaveDays: newRecord.totalLeaveDays,
      reason: newRecord.reason,
      salaryDeductionDays: parseFloat(newRecord.salaryDeductionDays) || 0,
      salaryDeductionRemarks: newRecord.salaryDeductionRemarks,
      medicalProducedYesNo: newRecord.medicalProducedYesNo,
      idSalaryMonth: parseInt(newRecord.idSalaryMonth),
    };

    setLoading(true);
    SickLeaveSalDeductionService.createSickLeaveApplication(payload)
      .then(() => {
        toast.success("Leave record created successfully.", {
          position: "top-right",
          autoClose: 2000,
        });
        setShowModal(false);
        resetModal();
        fetchLeaveApplications();
      })
      .catch(() => {
        toast.error("Failed to create leave record.", {
          position: "top-right",
          autoClose: 2000,
        });
      })
      .finally(() => setLoading(false));
  };

  const deductDaysExceed = (parseFloat(newRecord.salaryDeductionDays) || 0) > newRecord.totalLeaveDays;

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(255,255,255,0.7)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            {/* Title + Add button */}
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">Leave Salary Deduction</h5>
              <button
                className="btn btn-primary btn-sm px-4"
                onClick={() => setShowModal(true)}
              >
                + Add New Leave Record
              </button>
            </div>

            {/* Filter row */}
            <div className="card-header border-0 pt-0 pb-3">
              <div className="list_menu">
                <div className="list_searchbox">
                  <div>
                    <label>Salary Status</label>
                  </div>
                  <select
                    className="form-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="PENDING">PENDING</option>
                    <option value="ADJUSTED">ADJUSTED</option>
                  </select>
                </div>

                <div className="list_searchbox">
                  <div>
                    <label>Leave From</label>
                  </div>
                  <input
                    type="date"
                    className="form-control"
                    value={filterFromDate}
                    onChange={(e) => setFilterFromDate(e.target.value)}
                  />
                </div>

                <div className="list_searchbox">
                  <div>
                    <label>Leave To</label>
                  </div>
                  <input
                    type="date"
                    className="form-control"
                    value={filterToDate}
                    min={filterFromDate}
                    onChange={(e) => setFilterToDate(e.target.value)}
                  />
                </div>

                <div className="list_searchbox">
                  <div>
                    <label>Salary Month</label>
                  </div>
                  <select
                    className="form-select"
                    value={filterSalaryMonth}
                    onChange={(e) => setFilterSalaryMonth(e.target.value)}
                  >
                    <option value="">-- Select Salary Month --</option>
                    {filterSalaryMonths.map((m) => (
                      <option key={m.idSalaryMonth} value={m.idSalaryMonth}>
                        {m.salaryMonthText}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="list_searchbox">
                  <div>
                    <label>Search</label>
                  </div>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search employee..."
                    value={searchText}
                    maxLength={50}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchLeaveApplications()}
                  />
                </div>

                <div className="list_searchbox" style={{ alignSelf: "flex-end" }}>
                  <button
                    className="btn btn-primary px-4"
                    onClick={fetchLeaveApplications}
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="card-body pt-0">
              <div className="table-responsive text-nowrap">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Leave Period</th>
                      <th>No. of Days</th>
                      <th className="text-center">MC Produced?</th>
                      <th>Ded.Days</th>
                      <th>Remarks</th>
                      {/* <th className="text-end">Basic Pay</th> */}
                      <th className="text-end">Ded.Amount</th>
                      <th>Adj.Month</th>
                      <th className="text-center">Salary Status</th>
                    </tr>
                  </thead>
                  <tbody className="table-border-bottom-0">
                    {paginatedData.length > 0 ? (
                      paginatedData.map((row) => {
                        const locked = isRowLocked(row);
                        const status = getStatus(row);
                        return (
                          <tr key={row.idLeaveApplication}>
                            <td>
                              <div className="fw-semibold">
                                {row.employeeCode} - {row.employeeName}
                              </div>
                              <small className="text-muted">{row.designationName}</small>
                            </td>
                            <td className="text-center">
                              <div>{moment(row.fromDate).format("DD/MM/YYYY")}</div> 
                              <span className="text-muted" style={{ fontSize: "0.75rem" }}>To</span>
                              <div>{moment(row.toDate).format("DD/MM/YYYY")}</div>
                            </td>
                            <td className="text-center">
                              <span className="text-primary fw-semibold">
                                {row.totalLeaveDays}
                              </span>
                            </td>
                            <td className="text-center">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={row._medCert}
                                disabled={locked}
                                onChange={(e) =>
                                  updateRowField(
                                    row.idLeaveApplication,
                                    "_medCert",
                                    e.target.checked
                                  )
                                }
                              />
                            </td>
                            <td className="text-center">
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                style={{ width: "85px", textAlign: "center" }}
                                value={row._deductDays}
                                disabled={locked}
                                min={0}
                                step="any"
                                placeholder="0"
                                onChange={(e) =>
                                  updateRowField(
                                    row.idLeaveApplication,
                                    "_deductDays",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                style={{ minWidth: "160px" }}
                                placeholder="Remarks..."
                                value={row._remarks}
                                disabled={locked}
                                onChange={(e) =>
                                  updateRowField(
                                    row.idLeaveApplication,
                                    "_remarks",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            {/* <td className="text-end">
                              {Utils.formattedNumber(row.basicPay ?? 0)}
                            </td> */}
                            <td className="text-end">
                              {Utils.formattedNumber(row.deductedAmount ?? 0)}
                            </td>
                            <td>{row.salaryMonthText}</td>
                            <td className="text-center">
                              <span
                                className={`fw-semibold ${
                                  status === "ADJUSTED"
                                    ? "text-success"
                                    : "text-danger"
                                }`}
                              >
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="11" className="text-center">
                          <div className="Nodatafound_box p-2">
                            <h6>
                              <i className="bx bx-search"></i> No data available!
                            </h6>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {tableRows.length > 0 && (
                <div className="text-end pt-2">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setCurrentPage(page)}
                  />
                </div>
              )}

              {/* Bottom actions */}
              <div className="d-flex justify-content-end align-items-center gap-2 pt-3 border-top mt-2 flex-wrap">
                <div>
                  <label className="form-label mb-1 text-end d-block">
                    Adjusting Salary Month
                  </label>
                  <select
                    className="form-select form-select-sm"
                    style={{ minWidth: "230px" }}
                    value={adjustingSalaryMonth}
                    onChange={(e) => setAdjustingSalaryMonth(e.target.value)}
                  >
                    <option value="">-- Select Adjusting Salary Month --</option>
                    {adjustingSalaryMonths.map((m) => (
                      <option key={m.idSalaryMonth} value={m.idSalaryMonth}>
                        {m.salaryMonthText}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="d-flex gap-2" style={{ marginTop: "22px" }}>
                  <button
                    className="btn btn-outline-secondary btn-sm py-2 px-4"
                    onClick={handleReset}
                  >
                    Reset
                  </button>
                  <button
                    className="btn btn-primary btn-sm py-2 px-4"
                    onClick={handleSubmit}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Leave Record Modal */}
      <Modal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          resetModal();
        }}
        size="lg"
        centered
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <h5 className="m-0">Add New Leave Record</h5>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="accountDetail_card">
            <Form noValidate validated={validated}>
              <div className="row m-0">
                {/* Employee */}
                <div className="col-md-12 p-2">
                  <label className="form-label mb-1">
                    Employee <span className="text-danger">*</span>
                  </label>
                  <Select
                    options={employeesOptions}
                    isSearchable
                    value={selectedEmployee}
                    onChange={(opt) => {
                      setSelectedEmployee(opt);
                      setNewRecord((prev) => ({
                        ...prev,
                        idEmployee: opt?.value || 0,
                      }));
                    }}
                    placeholder="Search and select employee..."
                  />
                  {validated && !newRecord.idEmployee && (
                    <div className="text-danger small mt-1">
                      Employee is required.
                    </div>
                  )}
                </div>

                {/* From Date */}
                <div className="col-md-6 p-2">
                  <label className="form-label mb-1">
                    From Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className={`form-control ${
                      validated && !newRecord.fromDate ? "is-invalid" : ""
                    }`}
                    value={newRecord.fromDate}
                    onChange={(e) =>
                      setNewRecord((prev) => ({
                        ...prev,
                        fromDate: e.target.value,
                      }))
                    }
                  />
                  <div className="invalid-feedback">From Date is required.</div>
                </div>

                {/* To Date */}
                <div className="col-md-6 p-2">
                  <label className="form-label mb-1">
                    To Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className={`form-control ${
                      validated && !newRecord.toDate ? "is-invalid" : ""
                    }`}
                    value={newRecord.toDate}
                    min={newRecord.fromDate}
                    onChange={(e) =>
                      setNewRecord((prev) => ({
                        ...prev,
                        toDate: e.target.value,
                      }))
                    }
                  />
                  <div className="invalid-feedback">To Date is required.</div>
                </div>

                {/* Total Days (readonly) */}
                <div className="col-md-6 p-2">
                  <label className="form-label mb-1">Total Days</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newRecord.totalLeaveDays}
                    readOnly
                    style={{ backgroundColor: "#f8f9fa" }}
                  />
                </div>

                {/* Salary Deduction Days */}
                <div className="col-md-6 p-2">
                  <label className="form-label mb-1">Salary Deduction Days</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newRecord.salaryDeductionDays}
                    min={0}
                    step="any"
                    placeholder="0"
                    onChange={(e) =>
                      setNewRecord((prev) => ({
                        ...prev,
                        salaryDeductionDays: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* Salary Deduction Remarks */}
                <div className="col-md-12 p-2">
                  <label className="form-label mb-1">
                    Salary Deduction Remarks
                    {deductDaysExceed && (
                      <span className="text-danger"> *</span>
                    )}
                  </label>
                  <textarea
                    className={`form-control ${
                      validated && deductDaysExceed && !newRecord.salaryDeductionRemarks?.trim()
                        ? "is-invalid"
                        : ""
                    }`}
                    rows={2}
                    placeholder="Enter remarks..."
                    value={newRecord.salaryDeductionRemarks}
                    onChange={(e) =>
                      setNewRecord((prev) => ({
                        ...prev,
                        salaryDeductionRemarks: e.target.value,
                      }))
                    }
                  />
                  <div className="invalid-feedback">
                    Remarks are mandatory when Deduction Days exceed Total Leave Days.
                  </div>
                </div>

                {/* Reason */}
                <div className="col-md-12 p-2">
                  <label className="form-label mb-1">Reason</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Enter reason..."
                    value={newRecord.reason}
                    onChange={(e) =>
                      setNewRecord((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* Medical Certificate */}
                <div className="col-md-6 p-2">
                  <label className="form-label mb-1 d-block">
                    Medical Certificate Produced
                  </label>
                  <div className="d-flex gap-4 pt-1">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="medCertModal"
                        id="medCertYes"
                        checked={newRecord.medicalProducedYesNo === true}
                        onChange={() =>
                          setNewRecord((prev) => ({
                            ...prev,
                            medicalProducedYesNo: true,
                          }))
                        }
                      />
                      <label className="form-check-label" htmlFor="medCertYes">
                        Yes
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="medCertModal"
                        id="medCertNo"
                        checked={newRecord.medicalProducedYesNo === false}
                        onChange={() =>
                          setNewRecord((prev) => ({
                            ...prev,
                            medicalProducedYesNo: false,
                          }))
                        }
                      />
                      <label className="form-check-label" htmlFor="medCertNo">
                        No
                      </label>
                    </div>
                  </div>
                </div>

                {/* Adjusting Salary Month */}
                <div className="col-md-6 p-2">
                  <label className="form-label mb-1">
                    Adjusting Salary Month <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${
                      validated && !newRecord.idSalaryMonth ? "is-invalid" : ""
                    }`}
                    value={newRecord.idSalaryMonth}
                    onChange={(e) =>
                      setNewRecord((prev) => ({
                        ...prev,
                        idSalaryMonth: e.target.value,
                      }))
                    }
                  >
                    <option value="">-- Select --</option>
                    {adjustingSalaryMonths.map((m) => (
                      <option key={m.idSalaryMonth} value={m.idSalaryMonth}>
                        {m.salaryMonthText}
                      </option>
                    ))}
                  </select>
                  <div className="invalid-feedback">
                    Adjusting Salary Month is required.
                  </div>
                </div>
              </div>
            </Form>
          </div>

          <div className="modal-footer border-0 pt-2">
            <button
              className="btn btn-outline-secondary btn-sm py-2 px-4"
              onClick={() => {
                setShowModal(false);
                resetModal();
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm py-2 px-4"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default SickLeaveSalDeduction;
