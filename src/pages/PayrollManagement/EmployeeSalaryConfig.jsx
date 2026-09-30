import React, { useState, useEffect, useMemo } from "react";
import { Form, Modal } from "react-bootstrap";
import CommonService from "../../core/services/CommonService";
import Utils from "../../utils/Utils";
import Pagination from "../../components/pagination";
import ConfirmationModal from "../../components/ConfirmationModal";
import EmployeeSalaryConfigService from "../../core/services/EmployeeSalaryConfigService";
import moment from "moment";
import Select from 'react-select';
import { useLoader } from "../../components/LoaderContext";
import DatePicker from "react-datepicker";
import { toast } from "react-toastify";
import SalaryStructureGrid, { SalaryStructureTotals, SalaryStructureView } from "../../components/SalaryStructureGrid";
import {
  REVISION_REASONS,
  calculateStructure,
  newStructureRow,
  rowInputsForSave,
  toHeadsById,
  validateStructureRows,
} from "../../utils/salaryStructure";

// Default Valid From: the 1st of next month
const firstOfNextMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
};

const toDate = (value) => (value ? moment(value).startOf("day").toDate() : null);

const EmployeeSalaryConfig = () => {
  const [employeeSalaryConfigList, setEmployeeSalaryConfigList] = useState([]);
  const [employeeSalaryDetails, setEmployeeSalaryDetails] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [salaryHeadList, setSalaryHeadList] = useState([]);
  const totalPages = Math.ceil(employeeSalaryConfigList.length / rowsPerPage);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showNonConfigModal, setShowNonConfigModal] = useState(false);
  const [templatesList, setTemplatesList] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [employeesListOption, setEmployeesListOption] = useState([]);
  const [status, setStatus] = useState('');
  const [withoutConfigList, setWithoutConfigList] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [type, setType] = useState(1);
  const { showLoader, hideLoader } = useLoader();

  // Form
  const [editingConfig, setEditingConfig] = useState(null); // submitted structure being edited, null when adding
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [structureInfo, setStructureInfo] = useState(null); // current structure / pending / defaults for the employee
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [pendingTemplateId, setPendingTemplateId] = useState(""); // waiting for "Replace the current rows?"
  const [validFrom, setValidFrom] = useState(firstOfNextMonth);
  const [revisionReason, setRevisionReason] = useState("JOINING");
  const [rows, setRows] = useState([newStructureRow()]);
  const [formError, setFormError] = useState("");
  const [validated, setValidated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCopyConfirmation, setShowCopyConfirmation] = useState(false);
  const [selectedEmpConfigId, setSelectedEmpConfigId] = useState('');

  const isEdit = !!editingConfig;
  const headsById = useMemo(() => toHeadsById(salaryHeadList), [salaryHeadList]);

  // Calculated Value is recalculated after every change
  const calculation = useMemo(() => calculateStructure(rows, headsById), [rows, headsById]);

  const designationName = useMemo(() => {
    if (!selectedEmployee) return "";
    return employeesList.find((emp) => emp.idEmployee == selectedEmployee.value)?.designation || "";
  }, [selectedEmployee, employeesList]);

  useEffect(() => {
    setCurrentPage(1);
    getEmployeeSalaryConfigs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, type]);

  useEffect(() => {
    getSalaryHeadData();
    getEmployeesData();
    getSalaryTemplates();
    getStatusList();
  }, []);

  const getSalaryHeadData = () => {
    CommonService.getSalaryHeadList().then(res => {
      setSalaryHeadList(res?.data?.data || []);
    }).catch(err => {
      console.error("Failed to fetch salary heads:", err);
    });
  };

  const getEmployeesData = () => {
    CommonService.getEmployeeList().then(res => {
      const list = res?.data?.data || [];
      list.sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));
      setEmployeesList(list);
      setEmployeesListOption(list.map(employee => ({ value: employee.idEmployee, label: employee.fullName })));
    }).catch(() => {
    });
  };

  // Templates: only approved and active ones
  const getSalaryTemplates = () => {
    EmployeeSalaryConfigService.getAllSalaryTemplates().then(res => {
      const data = (res?.data?.data || []).filter(x => x.approvalStatus == 'APPROVED' && x.activeStatus);
      setTemplatesList(data);
    }).catch(err => {
      console.error("Failed to fetch salary templates:", err);
    });
  };

  const getEmployeeSalaryConfigs = () => {
    setEmployeeSalaryConfigList([]);
    EmployeeSalaryConfigService.getAllEmployeeSalaryConfigs(searchText, status ?? null, type == 1 ? true : false).then(res => {
      setEmployeeSalaryConfigList(res?.data?.data || []);
    }).catch(err => {
      setEmployeeSalaryConfigList([]);
      console.error("Failed to fetch salary configurations:", err);
    });
  };

  const viewWithoutConfigDetails = () => {
    if (employeeSalaryConfigList[0].notApprovedCount > 0) {
      getEmployeeWithoutConfig();
    }
  };

  const getEmployeeWithoutConfig = () => {
    showLoader();
    EmployeeSalaryConfigService.getAllEmployeeWithoutConfig().then(res => {
      hideLoader();
      setWithoutConfigList(res.data.data);
      setShowNonConfigModal(true);
    }).catch(err => {
      hideLoader();
      console.error("Failed to fetch employees without configuration:", err);
    });
  };

  const getEmpSalDetails = (id) => {
    EmployeeSalaryConfigService.getEmployeeSalaryConfigById(id).then(res => {
      setEmployeeSalaryDetails(res.data.data);
      setShowDetailsModal(true);
    }).catch(err => {
      console.error("Failed to fetch salary configuration:", err);
    });
  };

  /**
   * Loads the employee's current structure, pending structure and defaults.
   * applyDefaults: set Valid From (1st of next month, after the current structure) and Revision Reason.
   */
  const loadStructureInfo = (idEmployee, applyDefaults) => {
    setStructureInfo(null);
    if (!idEmployee) return;
    EmployeeSalaryConfigService.getEmployeeSalaryStructureInfo(idEmployee).then(res => {
      const info = res?.data?.data;
      if (!info) return;
      setStructureInfo(info);
      if (applyDefaults) {
        setValidFrom(toDate(info.defaultValidFrom) || firstOfNextMonth());
        setRevisionReason(info.defaultRevisionReason || "JOINING");
      }
    });
  };

  const handleEmployeeChange = (option) => {
    setSelectedEmployee(option);
    setFormError("");
    loadStructureInfo(option?.value, !isEdit);
  };

  // Rows from a saved template / structure: only the head and the amount / percentage are taken over
  const rowsFromDetails = (details, idKey) =>
    (details || []).map(detail =>
      newStructureRow({
        idDetail: idKey ? detail[idKey] ?? null : null,
        idSalaryHead: detail.idSalaryHead,
        fixedAmount: detail.fixedAmount,
        percentageValue: detail.percentageValue,
      })
    );

  const applyTemplate = (idTemplate) => {
    if (!idTemplate) {
      setSelectedTemplateId("");
      return;
    }
    showLoader();
    Promise.all([
      CommonService.getSalaryHeadList(),
      EmployeeSalaryConfigService.getAllSalaryTemplatesById(idTemplate),
    ])
      .then(([salaryHeadsRes, templateRes]) => {
        setSalaryHeadList(salaryHeadsRes?.data?.data || []);
        const templateRows = rowsFromDetails(templateRes?.data?.data?.salaryTemplateDetails, null);
        setRows(templateRows.length ? templateRows : [newStructureRow()]);
        setSelectedTemplateId(String(idTemplate));
        setFormError("");
      })
      .catch((err) => console.error("Failed to fetch template:", err))
      .finally(() => hideLoader());
  };

  // If the grid already has rows, ask "Replace the current rows?" first
  const handleTemplateChange = (idTemplate) => {
    if (idTemplate && rows.some(r => r.idSalaryHead)) {
      setPendingTemplateId(idTemplate);
      return;
    }
    applyTemplate(idTemplate);
  };

  const confirmReplaceRows = (val) => {
    if (val) applyTemplate(pendingTemplateId);
    setPendingTemplateId("");
  };

  /** mode "edit": change a submitted structure; mode "copy": new structure from an approved one. */
  const getEmpSalConfigById = (id, mode = "edit") => {
    showLoader();
    Promise.all([
      CommonService.getSalaryHeadList(),
      EmployeeSalaryConfigService.getEmployeeSalaryConfigById(id),
    ])
      .then(([salaryHeadsRes, configRes]) => {
        setSalaryHeadList(salaryHeadsRes?.data?.data || []);
        const config = configRes?.data?.data;
        if (!config) return;
        const isEditMode = mode === "edit";
        const configRows = rowsFromDetails(config.employeeSalaryConfigDetails, isEditMode ? "idEmployeeSalaryConfigDetail" : null);
        setRows(configRows.length ? configRows : [newStructureRow()]);
        setSelectedEmployee(employeesListOption.find(option => option.value === config.idEmployee) || { value: config.idEmployee, label: config.employeeName });
        setSelectedTemplateId(config.idSalaryTemplate ? String(config.idSalaryTemplate) : "");
        setEditingConfig(isEditMode ? config : null);
        if (isEditMode) {
          setValidFrom(toDate(config.validFrom));
          setRevisionReason(config.revisionReason || "JOINING");
        }
        loadStructureInfo(config.idEmployee, !isEditMode);
        setFormError("");
        setShowModal(true);
      })
      .catch((err) => {
        console.error("Failed to fetch data:", err);
      })
      .finally(() => hideLoader());
  };

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return employeeSalaryConfigList.slice(startIndex, endIndex);
  }, [employeeSalaryConfigList, currentPage, rowsPerPage]);

  const handlePageChange = (page) => setCurrentPage(page);

  const resetForm = () => {
    setRows([newStructureRow()]);
    setValidated(false);
    setSelectedEmployee(null);
    setStructureInfo(null);
    setEditingConfig(null);
    setSelectedTemplateId("");
    setPendingTemplateId("");
    setSelectedEmpConfigId('');
    setValidFrom(firstOfNextMonth());
    setRevisionReason("JOINING");
    setFormError("");
  };

  // Submit for Approval checks (the API repeats them)
  const validateBeforeSubmit = () => {
    if (!selectedEmployee) return "Select an employee.";
    if (!validFrom || validFrom.getDate() !== 1) return "Valid From must be the first day of a month.";
    const currentValidFrom = toDate(structureInfo?.currentValidFrom);
    if (currentValidFrom && validFrom <= currentValidFrom) {
      return `Valid From must be after ${moment(currentValidFrom).format("DD-MM-YYYY")}, the start of the current salary structure.`;
    }
    if (!isEdit && structureInfo?.hasPendingStructure) {
      return "This employee already has a salary structure waiting for approval.";
    }
    return validateStructureRows(rows, headsById);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSaving) return;
    setValidated(true);
    const error = validateBeforeSubmit();
    setFormError(error || "");
    if (error) {
      toast.error(error, { position: "top-right" });
      return;
    }

    const { totals, values } = calculation;
    const idConfig = editingConfig?.idEmployeeSalaryConfig ?? null;
    const payload = {
      idEmployeeSalaryConfig: idConfig,
      idEmployee: selectedEmployee.value,
      idSalaryTemplate: selectedTemplateId ? Number(selectedTemplateId) : null,
      validFrom: moment(validFrom).format("YYYY-MM-DD"),
      revisionReason,
      totalEarnings: totals.totalEarnings,
      totalDeductions: totals.totalDeductions,
      netSalary: totals.netSalary,
      totalEmployerContribution: totals.totalEmployerContribution,
      grossMonthly: totals.grossMonthly,
      ctcMonthly: totals.ctcMonthly,
      approvalStatus: "SUBMITTED",
      activeStatus: true,
      employeeSalaryConfigDetails: rows.map(row => ({
        idEmployeeSalaryConfigDetail: row.idDetail,
        idEmployeeSalaryConfig: idConfig ?? 0,
        idSalaryHead: row.idSalaryHead,
        ...rowInputsForSave(row, headsById[row.idSalaryHead]),
        salaryAmount: values[row.key]?.calculatedValue ?? 0,
      })),
    };

    const request = isEdit
      ? EmployeeSalaryConfigService.updateEmployeeSalaryConfigData(payload)
      : EmployeeSalaryConfigService.saveEmployeeSalaryConfigData(payload);

    setIsSaving(true);
    showLoader();
    request
      .then(res => {
        if (res.error) {
          setFormError(res.error);
          toast.error(res.error, { position: "top-right" });
          return;
        }
        toast.success(
          isEdit ? "Salary configuration updated successfully." : "Salary configuration submitted for approval successfully.",
          { position: "top-right" }
        );
        // Warnings only: month's salary already generated, statutory details missing
        const warnings = res.data?.data?.data;
        if (Array.isArray(warnings)) {
          warnings.forEach(w => toast.warning(w, { position: "top-right", autoClose: 8000 }));
        }
        setShowModal(false);
        resetForm();
        getEmployeeSalaryConfigs();
      })
      .catch(() => {
        toast.error("Failed to submit salary configuration.", { position: "top-right" });
      })
      .finally(() => {
        setIsSaving(false);
        hideLoader();
      });
  };

  const confirmCopyFinalize = (val) => {
    setShowCopyConfirmation(false);
    if (val) {
      getEmpSalConfigById(selectedEmpConfigId, "copy");
    }
    setSelectedEmpConfigId('');
  };

  const getStatusList = () => {
    EmployeeSalaryConfigService.getStatusById(2).then(res => {
      setStatusList(res.data.data);
    }).catch(err => {
      console.error("Failed to fetch status list:", err);
    });
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">List of Employee Salary Configuration</h5>
              <div className="list_menu">
                <div class="row m-0" style={{ width: '260px' }}>
                  <div class="col-md-4 p-2">
                    <div class="form-check form-check-inline ">
                      <input class="form-check-input" type="radio" name="inlineRadioOptions" id="inlineRadio1"
                        value={1} checked={type === 1 ? "checked" : ""}
                        onChange={(e) => setType(1)} />
                      <label class="form-check-label" for="inlineRadio1">Latest</label>
                    </div>
                  </div>
                  <div class="col-md-6 p-2">
                    <div class="form-check form-check-inline">
                      <input class="form-check-input" type="radio" name="inlineRadioOptions" id="inlineRadio2"
                        value={0} checked={type === 0 ? "checked" : ""}
                        onChange={(e) => setType(0)} />
                      <label class="form-check-label" for="inlineRadio2">With History</label>
                    </div>
                  </div>
                </div>
                <div className="list_searchbox">
                  {/* <select className="form-select" value={status}
                    onChange={(e) => setStatus(e.target.value)} style={{ width: '200px' }}>
                    <option value={''}>Latest</option>
                    <option value={'SHOW ALL'} key={'SHOW ALL'}>Show All</option>
                    <option value={'NOT CONFIGURED'} key={'NOT CONFIGURED'}>Not Configured</option>
                    <option value={'SUBMITTED'} key={'SUBMITTED'}>Submitted</option>
                    <option value={'REJECTED'} key={'REJECTED'}>Rejected</option>
                    <option value={'APPROVED'} key={'APPROVED'}>Approved</option>
                  </select> */}
                  <select className="form-select" value={status}
                    onChange={(e) => setStatus(e.target.value)} style={{ width: '200px' }}>
                    <option value={''}>Select</option>
                    {statusList.map(stat => (
                      <option key={stat.approvalStatusName} value={stat.approvalStatusName}>
                        {Utils.toTitleCase(stat.approvalStatusName)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="list_searchbox">
                  <input type="text" className="form-control" placeholder="Search" value={searchText} maxLength={30}
                    onChange={(e) => {
                      setSearchText(e.target.value);
                      if (e.target.value === "") {
                        getEmployeeSalaryConfigs();
                      }
                    }}
                    onKeyDown={e => e.key === 'Enter' ? getEmployeeSalaryConfigs() : ''} />
                  <i className="bx bx-search cursor" onClick={() => getEmployeeSalaryConfigs()}></i>
                </div>
                <button
                  className="btn btn-primary btn-sm px-4"
                  type="button"
                  onClick={() => { resetForm(); setShowModal(true); }}>
                  Add
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive ">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Emp. Code</th>
                      <th>Employee Name</th>
                      <th>Designation</th>
                      <th>Joining Date</th>
                      <th>Valid From</th>
                      <th className="text-end">Total Earnings</th>
                      <th className="text-end">Total Deductions</th>
                      <th className="text-end">Net Salary</th>
                      <th >Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody className="table-border-bottom-0">
                    {paginatedData?.length > 0 ? (
                      paginatedData?.map((item, index) => (
                        <tr key={item.idEmployeeSalaryConfig}>
                          <td>
                            <a
                              href="#"
                              style={{ color: "var(--link-color)", cursor: "pointer", textDecoration: "none" }}
                              onClick={(e) => {
                                e.preventDefault();
                                getEmpSalDetails(item.idEmployeeSalaryConfig);
                              }}
                            >
                              {item?.employeeCode}
                            </a>
                          </td>
                          <td>{item?.employeeName}</td>
                          <td>{item?.designationName != null ? (item?.designationName.length < 25 ? item?.designationName : (`${item?.designationName.substring(0, 25)}...`)) : 'NA'}</td>
                          <td>{item?.joiningDate != null ? moment(item?.joiningDate).format("DD-MM-YYYY") : 'NA'}</td>
                          <td>{item?.validFrom != null ? moment(item?.validFrom).format("DD-MM-YYYY") : 'NA'}</td>
                          <td className="text-end">{Utils.formattedNumber(item?.totalEarnings)}</td>
                          <td className="text-end">{Utils.formattedNumber(item?.totalDeductions)}</td>
                          <td className="text-end">{Utils.formattedNumber(item?.netSalary)}</td>
                          <td>
                            <span className={`badge ${item.approvalStatus == 'APPROVED' ? 'bg-label-success' : item.approvalStatus == 'SUBMITTED' ? 'bg-label-warning' : item.approvalStatus == 'REJECTED' ? 'bg-label-danger' : 'bg-label-primary'}`}>{item.approvalStatus}</span>
                          </td>
                          <td className="text-end">
                            {
                              item?.approvalStatus != "APPROVED" &&
                              <button type="button" className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0" onClick={() => getEmpSalConfigById(item?.idEmployeeSalaryConfig)}>
                                <span className="tf-icons bx bx-pencil"></span>
                              </button>
                            }
                            {
                              item?.approvalStatus == "APPROVED" &&
                              <button type="button" className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0" onClick={() => { setShowCopyConfirmation(true); setSelectedEmpConfigId(item?.idEmployeeSalaryConfig) }}>
                                <span className="tf-icons bx bx-copy"></span>
                              </button>
                            }
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="10" className="text-center">
                          <div className="Nodatafound_box">
                            <h6><i className="bx bx-search"></i> No data available!</h6>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* <div className="text-end pt-2">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div> */}
              {
                employeeSalaryConfigList.length > 0 &&
                <div className='row pt-3'>
                  {
                    type == 1 &&
                    <div className='col-lg-5'>
                      <table className="table table-sm">
                        <thead>
                          <th className="text-center">Approved</th>
                          <th className="text-center">Submitted</th>
                          <th className="text-center">Rejected</th>
                          <th className="text-center">Not Configured</th>
                          {/* <th className="text-center">Not Approved</th> */}
                        </thead>
                        <tbody>
                          <tr>
                            <td className="text-center"><strong>{employeeSalaryConfigList[0].approvedCount}</strong></td>
                            <td className="text-center"><strong>{employeeSalaryConfigList[0].submittedCount}</strong></td>
                            <td className="text-center"><strong>{employeeSalaryConfigList[0].rejectedCount}</strong></td>
                            {/* <td className="text-center"><strong>{employeeSalaryConfigList[0].notConfiguredCount}</strong></td> */}
                            <td className="text-center"><label className={employeeSalaryConfigList[0].notConfiguredCount > 0 ? 'cursor' : ''} onClick={() => viewWithoutConfigDetails()}><strong>{employeeSalaryConfigList[0].notConfiguredCount}</strong></label></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  }
                  {
                    type == 0 &&
                    <div className='col-lg-5'></div>
                  }
                  <div className='col-lg-7 text-end'>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </div>
              }
            </div>
          </div>

          <Modal
            show={showModal} onHide={() => { setShowModal(false); resetForm(); }} size='xl'
            aria-labelledby="contained-modal-title-vcenter"
            centered backdrop="static"
            keyboard={false}>
            <Modal.Header closeButton>
              <Modal.Title>
                <h5>Add/Update Employee Salary Configuration</h5>
              </Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <Form noValidate validated={validated} onSubmit={(e) => e.preventDefault()}>
                <div className="row m-0">
                  <div className="col-md-4 p-2">
                    <label className="form-label mb-1">Employee Name</label>
                    <Select
                      options={employeesListOption}
                      isSearchable
                      onChange={handleEmployeeChange}
                      value={selectedEmployee}
                      placeholder={'Select Employee'}
                      className='textSize'
                      isDisabled={isEdit}
                    />
                  </div>

                  <div className="col-md-4 p-2">
                    <label className="form-label mb-1">Designation</label>
                    <input className='form-control' value={designationName} disabled />
                  </div>

                  <div className="col-md-4 p-2">
                    <label className="form-label mb-1">Templates</label>
                    <select
                      className="form-select"
                      value={selectedTemplateId}
                      onChange={(e) => handleTemplateChange(e.target.value)}>
                      <option value="">Select Templates</option>
                      {templatesList.map(tem => (
                        <option key={tem.idSalaryTemplate} value={tem.idSalaryTemplate}>
                          {tem.salaryTemplateName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-4 p-2">
                    <label className="form-label mb-1">Valid From</label>
                    {/* Only the 1st of a month can be picked */}
                    <DatePicker className="form-control" selected={validFrom}
                      onChange={(date) => setValidFrom(date ? new Date(date.getFullYear(), date.getMonth(), 1) : null)}
                      wrapperClassName="datePicker"
                      dateFormat="dd-MM-yyyy"
                      showMonthYearPicker
                      placeholderText='Select Month' />
                  </div>

                  <div className="col-md-4 p-2">
                    <label className="form-label mb-1">Revision Reason</label>
                    <select className="form-select" value={revisionReason}
                      onChange={(e) => setRevisionReason(e.target.value)}>
                      {REVISION_REASONS.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  {selectedEmployee && (
                    <div className="col-md-12 px-2 pb-2">
                      <div className="small text-muted">
                        {structureInfo?.currentValidFrom
                          ? <>Current structure: Valid From <b>{moment(structureInfo.currentValidFrom).format("DD-MM-YYYY")}</b> · Net <b>{Utils.formattedNumber(structureInfo.currentNetSalary)}</b></>
                          : "No approved salary structure yet."}
                      </div>
                      {(structureInfo?.warnings || []).map((w, i) => (
                        <div key={i} className="small text-warning"><i className="bx bx-error"></i> {w}</div>
                      ))}
                    </div>
                  )}
                </div>

                <SalaryStructureGrid
                  rows={rows}
                  onRowsChange={(updated) => { setRows(updated); setFormError(""); }}
                  salaryHeadList={salaryHeadList}
                  headsById={headsById}
                  calculation={calculation}
                />
                <SalaryStructureTotals totals={calculation.totals} showStatutoryNote />
                {formError && <div className="text-danger mt-2">{formError}</div>}
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <button
                className="btn btn-primary btn-sm py-2 px-4 me-2"
                onClick={handleSubmit}>
                {isEdit ? "Update" : "Submit for Approval"}
              </button>
              <button
                className="btn btn-outline-secondary btn-sm py-2 px-4"
                onClick={() => {
                  if (isEdit) {
                    getEmpSalConfigById(editingConfig.idEmployeeSalaryConfig, "edit");
                  } else {
                    resetForm();
                  }
                }}>
                Reset
              </button>
            </Modal.Footer>
          </Modal>

          {
            pendingTemplateId !== "" &&
            <ConfirmationModal
              modalShow={true}
              messageText={"Replace the current rows?"}
              callbackModal={confirmReplaceRows}
              confirmBtn={"Replace"}
              CancelBtn={"Cancel"}
            />
          }

          {
            showCopyConfirmation &&
            <ConfirmationModal
              modalShow={true}
              messageText={"Are you sure to create a copy of this config?"}
              callbackModal={confirmCopyFinalize}
              confirmBtn={"Confirm"}
              CancelBtn={"Cancel"}
            />
          }

          <Modal
            show={showDetailsModal} onHide={() => { setShowDetailsModal(false); }} size='xl'
            aria-labelledby="contained-modal-title-vcenter"
            centered backdrop="static"
            keyboard={false}>
            <Modal.Header closeButton>
              <Modal.Title>
                <h5>Salary configuration details</h5>
              </Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <h6>
                {employeeSalaryDetails?.employeeName} ({employeeSalaryDetails?.employeeCode}) &nbsp; | &nbsp; Valid from: {moment(employeeSalaryDetails?.validFrom).format("DD-MM-YYYY")}
                {employeeSalaryDetails?.revisionReason && <> &nbsp; | &nbsp; {Utils.toTitleCase(employeeSalaryDetails.revisionReason)}</>}
              </h6>
              <div className="px-2">
                <SalaryStructureView details={employeeSalaryDetails?.employeeSalaryConfigDetails} headsById={headsById} amountKey="salaryAmount" />
                <SalaryStructureTotals totals={employeeSalaryDetails} showStatutoryNote />
              </div>
            </Modal.Body>
          </Modal>

          <Modal
            show={showNonConfigModal} onHide={() => { setShowNonConfigModal(false); }} size='xl'
            aria-labelledby="contained-modal-title-vcenter"
            centered backdrop="static"
            keyboard={false}>
            <Modal.Header closeButton>
              <Modal.Title>
                <h5>List of Employees without configuration</h5>
              </Modal.Title>
            </Modal.Header>

            <Modal.Body>

              <div className="table-responsive ">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Emp. Code</th>
                      <th>Employee Name</th>
                      <th>Designation</th>
                      <th>Department</th>
                      <th>Joining Date</th>
                      <th >Salary Configuration</th>
                    </tr>
                  </thead>
                  <tbody className="table-border-bottom-0">
                    {withoutConfigList?.length > 0 ? (
                      withoutConfigList?.map((item, index) => (
                        <tr key={item.idEmployeeSalaryConfig}>
                          <td>{index + 1}</td>
                          <td>{item?.employeeCode}</td>
                          <td>{item?.employeeName}</td>
                          <td>{item?.designationName.length < 25 ? item?.designationName : (`${item?.designationName.substring(0, 25)}...`)}</td>
                          <td>{item?.departmentName.length < 25 ? item?.departmentName : (`${item?.departmentName.substring(0, 25)}...`)}</td>
                          <td>{item?.joiningDate ? moment(item?.joiningDate).format("DD-MM-YYYY") : ''}</td>
                          <td>{item?.status}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center">
                          <div className="Nodatafound_box">
                            <h6><i className="bx bx-search"></i> No data available!</h6>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </Modal.Body>
          </Modal>

        </div>
      </div>
    </div>
  );
};

export default EmployeeSalaryConfig;