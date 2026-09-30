import React, { useState, useEffect, useMemo } from "react";
import { Form, Modal } from "react-bootstrap";
import CommonService from "../../core/services/CommonService";
import Utils from "../../utils/Utils";
import SalaryTemplateService from "../../core/services/SalaryTemplateService";
import Pagination from "../../components/pagination";
import ConfirmationModal from "../../components/ConfirmationModal";
import { showToast } from "../../components/ToastNotifications/toastUtils";
import { useLoader } from "../../components/LoaderContext";
import SalaryStructureGrid, { SalaryStructureTotals, SalaryStructureView } from "../../components/SalaryStructureGrid";
import {
  calculateStructure,
  newStructureRow,
  rowInputsForSave,
  toHeadsById,
  validateStructureRows,
} from "../../utils/salaryStructure";

const statusBadgeClass = (status) =>
  status === "APPROVED" ? "bg-label-success" : status === "SUBMITTED" ? "bg-label-warning" : status === "REJECTED" ? "bg-label-danger" : "bg-label-secondary";

const SalaryTemplateNew = () => {
  const [templateName, setTemplateName] = useState("");
  const [description, setDescription] = useState("");
  const [activeStatus, setActiveStatus] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState(null); // template being edited, null when adding
  const [templatesList, setTemplatesList] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [copyFromTemplate, setCopyFromTemplate] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [salaryHeadList, setSalaryHeadList] = useState([]);
  const [rows, setRows] = useState([newStructureRow()]);
  const [formError, setFormError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [validated, setValidated] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsToShow, setDetailsToShow] = useState({});
  const [statusList, setStatusList] = useState([]);
  const [statusType, setStatusType] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { showLoader, hideLoader } = useLoader();

  const isEdit = !!editingTemplate;
  const totalPages = Math.ceil(templatesList.length / rowsPerPage);
  const headsById = useMemo(() => toHeadsById(salaryHeadList), [salaryHeadList]);

  // Calculated Value is recalculated after every change
  const calculation = useMemo(() => calculateStructure(rows, headsById), [rows, headsById]);

  // Copy From: only templates that are approved and active
  const copyableTemplates = useMemo(
    () =>
      templatesList.filter(
        (t) => t.approvalStatus === "APPROVED" && t.activeStatus && t.idSalaryTemplate !== editingTemplate?.idSalaryTemplate
      ),
    [templatesList, editingTemplate]
  );

  useEffect(() => {
    getSalaryHeadData();
    getStatusList();
  }, []);

  useEffect(() => {
    getSalaryTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusType]);

  useEffect(() => {
    if (selectedTemplateId !== "") {
      setShowConfirmation(true);
    }
  }, [selectedTemplateId]);

  const getSalaryHeadData = () => {
    CommonService.getSalaryHeadList()
      .then((res) => setSalaryHeadList(res?.data?.data || []))
      .catch((err) => console.error("Failed to fetch salary heads:", err));
  };

  const getSalaryTemplates = () => {
    // Inactive templates are listed too, so they can be opened and made active again
    SalaryTemplateService.getAllSalaryTemplates(searchText, statusType, true)
      .then((res) => setTemplatesList(res?.data?.data || []))
      .catch((err) => console.error("Failed to fetch salary templates:", err));
  };

  // Rows from a saved template: only the head and the amount / percentage are taken over
  const rowsFromTemplate = (template, keepIds) =>
    (template.salaryTemplateDetails || []).map((detail) =>
      newStructureRow({
        idDetail: keepIds ? detail.idSalaryTemplateDetail : null,
        idSalaryHead: detail.idSalaryHead,
        fixedAmount: detail.fixedAmount,
        percentageValue: detail.percentageValue,
      })
    );

  const loadTemplate = (id, mode) => {
    showLoader();
    Promise.all([CommonService.getSalaryHeadList(), SalaryTemplateService.getAllSalaryTemplatesById(id)])
      .then(([salaryHeadsRes, templateRes]) => {
        setSalaryHeadList(salaryHeadsRes?.data?.data || []);
        const template = templateRes?.data?.data;
        if (!template) return;
        const templateRows = rowsFromTemplate(template, mode === "edit");
        setRows(templateRows.length ? templateRows : [newStructureRow()]);
        if (mode === "edit") {
          setEditingTemplate(template);
          setTemplateName(template.salaryTemplateName || "");
          setDescription(template.description || "");
          setActiveStatus(!!template.activeStatus);
        }
        setFormError("");
        setShowModal(true);
      })
      .catch((err) => console.error("Failed to fetch data:", err))
      .finally(() => hideLoader());
  };

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return templatesList.slice(startIndex, startIndex + rowsPerPage);
  }, [templatesList, currentPage, rowsPerPage]);

  const resetForm = () => {
    setRows([newStructureRow()]);
    setValidated(false);
    setTemplateName("");
    setDescription("");
    setActiveStatus(true);
    setEditingTemplate(null);
    setCopyFromTemplate(false);
    setSelectedTemplateId("");
    setFormError("");
  };

  const validateBeforeSubmit = () => {
    const name = templateName.trim();
    const nameUsed = templatesList.some(
      (t) => (t.salaryTemplateName || "").trim().toLowerCase() === name.toLowerCase() && t.idSalaryTemplate !== editingTemplate?.idSalaryTemplate
    );
    if (!name || nameUsed) return "A template with this name already exists.";
    return validateStructureRows(rows, headsById);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSaving) return;
    setValidated(true);
    const error = validateBeforeSubmit();
    setFormError(error || "");
    if (error) {
      showToast(error, "error");
      return;
    }

    const { totals, values } = calculation;
    const payload = {
      idSalaryTemplate: editingTemplate?.idSalaryTemplate ?? null,
      salaryTemplateName: templateName.trim(),
      description,
      totalEarnings: totals.totalEarnings,
      totalDeductions: totals.totalDeductions,
      netSalary: totals.netSalary,
      totalEmployerContribution: totals.totalEmployerContribution,
      grossMonthly: totals.grossMonthly,
      ctcMonthly: totals.ctcMonthly,
      activeStatus: isEdit ? activeStatus : true,
      approvalStatus: "SUBMITTED",
      salaryTemplateDetails: rows.map((row) => ({
        idSalaryTemplateDetail: row.idDetail,
        idSalaryTemplate: editingTemplate?.idSalaryTemplate ?? 0,
        idSalaryHead: row.idSalaryHead,
        ...rowInputsForSave(row, headsById[row.idSalaryHead]),
        finalSalaryAmount: values[row.key]?.calculatedValue ?? 0,
      })),
    };

    const request = isEdit
      ? SalaryTemplateService.updateSalaryTemplateData(payload)
      : SalaryTemplateService.saveSalaryTemplateData(payload);

    setIsSaving(true);
    showLoader();
    request
      .then((res) => {
        if (res.error) {
          setFormError(res.error);
          showToast(res.error, "error");
          return;
        }
        showToast(res.data?.message || "Salary template submitted for approval.", "success");
        setShowModal(false);
        resetForm();
        getSalaryTemplates();
      })
      .finally(() => {
        setIsSaving(false);
        hideLoader();
      });
  };

  const confirmFinalize = (val) => {
    setShowConfirmation(false);
    if (val) {
      loadTemplate(selectedTemplateId, "copy");
    } else {
      setSelectedTemplateId("");
    }
  };

  const getStatusList = () => {
    SalaryTemplateService.getStatusById(1)
      .then((res) => setStatusList(res?.data?.data || []))
      .catch((err) => console.error("Failed to fetch status list:", err));
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">List of Salary Templates</h5>
              <div className="list_menu">
                <div className="list_searchbox">
                  <select className="form-select" value={statusType}
                    onChange={(e) => setStatusType(e.target.value)} style={{ width: "180px" }}>
                    <option value={""}>Select</option>
                    {statusList.map((stat) => (
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
                        getSalaryTemplates();
                      }
                    }}
                    onKeyDown={(e) => (e.key === "Enter" ? getSalaryTemplates() : "")} />
                  <i className="bx bx-search cursor" onClick={() => getSalaryTemplates()}></i>
                </div>
                <button className="btn btn-primary btn-sm px-4" type="button"
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
                      <th>Template Name</th>
                      <th>Description</th>
                      <th className="text-end">Net Salary</th>
                      <th>Status</th>
                      <th>Active</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody className="table-border-bottom-0">
                    {paginatedData?.length > 0 ? (
                      paginatedData.map((item) => (
                        <tr key={item.idSalaryTemplate}>
                          <td>
                            <a href="#"
                              style={{ color: "var(--link-color)", cursor: "pointer", textDecoration: "none" }}
                              onClick={(e) => {
                                e.preventDefault();
                                SalaryTemplateService.getAllSalaryTemplatesById(item.idSalaryTemplate).then((res) => {
                                  setDetailsToShow(res?.data?.data || item);
                                  setShowDetailsModal(true);
                                });
                              }}>
                              {item?.salaryTemplateName}
                            </a>
                          </td>
                          <td>{item?.description}</td>
                          <td className="text-end">{Utils.formattedNumber(item?.netSalary)}</td>
                          <td>
                            <span className={`badge ${statusBadgeClass(item.approvalStatus)}`}>{item.approvalStatus}</span>
                          </td>
                          <td>
                            <span className={`badge ${item.activeStatus ? "bg-label-success" : "bg-label-secondary"}`}>
                              {item.activeStatus ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="text-end">
                            <button type="button" className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
                              title="Edit" onClick={() => { resetForm(); loadTemplate(item.idSalaryTemplate, "edit"); }}>
                              <span className="tf-icons bx bx-pencil"></span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center">
                          <div className="Nodatafound_box">
                            <h6><i className="bx bx-search"></i> No data available!</h6>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="text-end pt-2">
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </div>
            </div>
          </div>

          <Modal show={showModal} onHide={() => { setShowModal(false); resetForm(); }} size="xl"
            aria-labelledby="contained-modal-title-vcenter" centered backdrop="static" keyboard={false}>
            <Modal.Header closeButton>
              <Modal.Title>
                <h5>Add/Update Salary Template</h5>
              </Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <Form noValidate validated={validated} onSubmit={(e) => e.preventDefault()}>
                <div className="row m-0">
                  <div className="col-md-6 p-2">
                    <div className="form-check mb-1">
                      <input className="form-check-input" type="checkbox" id="copyFromTemplates"
                        checked={copyFromTemplate}
                        onChange={(e) => {
                          setCopyFromTemplate(e.target.checked);
                          if (!e.target.checked) setSelectedTemplateId("");
                        }} />
                      <label className="form-check-label" htmlFor="copyFromTemplates">Copy From Templates</label>
                    </div>
                    <div className="mb-2">
                      <label>Templates</label>
                      <select className="form-select" value={selectedTemplateId}
                        onChange={(e) => setSelectedTemplateId(e.target.value)} disabled={!copyFromTemplate}>
                        <option value="">Select Templates</option>
                        {copyableTemplates.map((tem) => (
                          <option key={tem.idSalaryTemplate} value={tem.idSalaryTemplate}>
                            {tem.salaryTemplateName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <label>Template Name</label>
                    <input className="form-control" type="text" value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)} maxLength="50" required />
                  </div>
                  <div className="col-md-6 p-2">
                    <label className="form-label mb-1">Description</label>
                    <textarea className="form-control" rows={isEdit ? 3 : 5} maxLength="500" value={description}
                      onChange={(e) => setDescription(e.target.value)}></textarea>
                    {isEdit && (
                      <div className="d-flex align-items-center gap-4 mt-2">
                        <div className="form-check form-switch m-0">
                          <input className="form-check-input" type="checkbox" role="switch" id="templateActive"
                            checked={activeStatus} onChange={(e) => setActiveStatus(e.target.checked)} />
                          <label className="form-check-label" htmlFor="templateActive">Active</label>
                        </div>
                        <div>
                          Status:{" "}
                          <span className={`badge ${statusBadgeClass(editingTemplate?.approvalStatus)}`}>
                            {Utils.toTitleCase(editingTemplate?.approvalStatus || "")}
                          </span>
                        </div>
                      </div>
                    )}
                    {isEdit && editingTemplate?.approvalStatus === "APPROVED" && (
                      <div className="text-muted small mt-1">Saving sends this template for approval again.</div>
                    )}
                  </div>
                </div>

                <SalaryStructureGrid
                  rows={rows}
                  onRowsChange={(updated) => { setRows(updated); setFormError(""); }}
                  salaryHeadList={salaryHeadList}
                  headsById={headsById}
                  calculation={calculation}
                />
                <SalaryStructureTotals totals={calculation.totals} />
                {formError && <div className="text-danger mt-2">{formError}</div>}
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <button className="btn btn-primary btn-sm py-2 px-4 me-2" onClick={handleSubmit}>
                {isEdit ? "Update" : "Submit for Approval"}
              </button>
              <button className="btn btn-outline-secondary btn-sm py-2 px-4"
                onClick={() => {
                  if (isEdit) {
                    loadTemplate(editingTemplate.idSalaryTemplate, "edit");
                  } else {
                    resetForm();
                  }
                }}>
                Reset
              </button>
            </Modal.Footer>
          </Modal>

          <Modal show={showDetailsModal} onHide={() => { setShowDetailsModal(false); setDetailsToShow({}); }} size="xl"
            aria-labelledby="contained-modal-title-vcenter" centered backdrop="static" keyboard={false}>
            <Modal.Header closeButton>
              <Modal.Title>
                <h5>Salary template details</h5>
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <h6>{detailsToShow?.salaryTemplateName}</h6>
              <div className="px-2">
                <SalaryStructureView details={detailsToShow?.salaryTemplateDetails} headsById={headsById} amountKey="finalSalaryAmount" />
                <SalaryStructureTotals totals={detailsToShow} />
              </div>
            </Modal.Body>
          </Modal>

          {showConfirmation && (
            <ConfirmationModal
              modalShow={true}
              messageText={"The existing data will be overwritten. Are you sure to copy this template?"}
              callbackModal={confirmFinalize}
              confirmBtn={"Confirm"}
              CancelBtn={"Cancel"}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SalaryTemplateNew;
