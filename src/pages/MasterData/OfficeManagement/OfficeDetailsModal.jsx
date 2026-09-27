import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import Grid from "../../../components/grid";
import OfficeManagementService from "../../../core/services/OfficeManagementService";
import { showToast } from "../../../components/ToastNotifications/toastUtils";
import Utils from "../../../utils/Utils";
import EmployeePostingModal from "./EmployeePostingModal";
import PostingHistoryModal from "./PostingHistoryModal";

function OfficeDetailsModal({ show, idOffice, employeeOptions, onHide }) {
  const [office, setOffice] = useState(null);
  const [loadingOffice, setLoadingOffice] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [isCurrentOnly, setIsCurrentOnly] = useState(true);

  const [showPostingModal, setShowPostingModal] = useState(false);
  const [editingPosting, setEditingPosting] = useState(null);
  const [historyEmployee, setHistoryEmployee] = useState(null);

  useEffect(() => {
    if (idOffice) fetchOffice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idOffice]);

  useEffect(() => {
    if (idOffice) fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idOffice, isCurrentOnly]);

  const fetchOffice = async () => {
    setLoadingOffice(true);
    try {
      const response = await OfficeManagementService.getOfficeById(idOffice);
      if (response.error) {
        showToast(response.error, "error");
        setOffice(null);
      } else {
        setOffice(response.data?.data || null);
      }
    } catch (error) {
      showToast("Failed to fetch office details", "error");
    } finally {
      setLoadingOffice(false);
    }
  };

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const response = await OfficeManagementService.getOfficeEmployees(idOffice, isCurrentOnly);
      if (response.error) {
        showToast(response.error, "error");
        setEmployees([]);
      } else {
        setEmployees(Array.isArray(response.data?.data) ? response.data.data : []);
      }
    } catch (error) {
      showToast("Failed to fetch office employees", "error");
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const address = office
    ? [office.addressLine1, office.addressLine2, office.city, office.district, office.state, office.country, office.pinCode]
        .filter(Boolean)
        .join(", ")
    : "";

  const detailItems = office
    ? [
        { label: "Office Code", value: office.officeCode },
        { label: "Office Name", value: office.officeName },
        { label: "Office Type", value: office.officeTypeName ? `${office.officeTypeName} (Level ${office.hierarchyLevel})` : "" },
        { label: "Parent Office", value: office.parentOfficeName ? `${office.parentOfficeCode} - ${office.parentOfficeName}` : "None (Top level)" },
        { label: "Office Head", value: office.officeHeadName },
        { label: "Status", value: office.isActive ? "Active" : "Inactive" },
        { label: "Phone Number", value: office.phoneNumber },
        { label: "Email ID", value: office.emailId },
        { label: "GSTIN", value: office.gstin },
        { label: "Opened Date", value: Utils.formatDisplayDate(office.openedDate) },
        { label: "Closed Date", value: Utils.formatDisplayDate(office.closedDate) },
      ]
    : [];

  const employeeColumns = [
    { key: "employeeCode", label: "Emp. Code" },
    { key: "employeeName", label: "Employee Name" },
    { key: "departmentName", label: "Department", render: (value) => value || "-" },
    { key: "designationName", label: "Designation", render: (value) => value || "-" },
    { key: "postingType", label: "Posting Type", render: (value) => value || "-" },
    { key: "postingFromDate", label: "From", render: (value) => Utils.formatDisplayDate(value) },
    { key: "postingToDate", label: "To", render: (value) => (value ? Utils.formatDisplayDate(value) : "-") },
    {
      key: "isCurrentPosting",
      label: "Current",
      render: (_, row) => (
        <span className={`badge ${row.isCurrentPosting ? "bg-label-success" : "bg-label-secondary"}`}>
          {row.isCurrentPosting ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Action",
      headerStyle: { textAlign: "right" },
      render: (_, row) => (
        <div className="text-end">
          <button
            type="button"
            className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
            title="Edit Posting"
            onClick={() => {
              setEditingPosting(row);
              setShowPostingModal(true);
            }}
          >
            <span className="bx bx-pencil"></span>
          </button>
          <button
            type="button"
            className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
            title="Posting History"
            onClick={() => setHistoryEmployee(row)}
          >
            <span className="bx bx-history"></span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Modal
        show={show && !showPostingModal && !historyEmployee}
        onHide={onHide}
        size="xl"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <h5>Office Details</h5>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="accountDetail_card">
            {loadingOffice ? (
              <div className="text-center p-3">Loading...</div>
            ) : !office ? (
              <div className="Nodatafound_box text-center">
                <h6><i className="bx bx-search"></i> Office not found!</h6>
              </div>
            ) : (
              <div className="row m-0">
                {detailItems.map((item) => (
                  <div className="col-lg-3 col-md-6 p-2" key={item.label}>
                    <label className="form-label mb-1">{item.label}</label>
                    <p className="m-0">{item.value || "-"}</p>
                  </div>
                ))}
                <div className="col-lg-12 p-2">
                  <label className="form-label mb-1">Address</label>
                  <p className="m-0">{address || "-"}</p>
                </div>
              </div>
            )}
          </div>

          <div className="card mt-3">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2 pb-3">
              <h5 className="m-0">Employees Posted</h5>
              <div className="list_menu">
                <div className="form-check form-switch m-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="isCurrentOnly"
                    checked={isCurrentOnly}
                    onChange={(e) => setIsCurrentOnly(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="isCurrentOnly">
                    Current postings only
                  </label>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={!office?.isActive}
                  title={office?.isActive ? "" : "Office is inactive"}
                  onClick={() => {
                    setEditingPosting(null);
                    setShowPostingModal(true);
                  }}
                >
                  <i className="bx bx-plus me-1"></i> Assign Employee
                </button>
              </div>
            </div>
            <div className="card-body">
              {loadingEmployees ? (
                <div className="text-center p-3">Loading...</div>
              ) : (
                <Grid columns={employeeColumns} data={employees} idKey="idEmployeeOfficePosting" />
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-outline-secondary btn-sm py-2 px-4" onClick={onHide}>
            Close
          </button>
        </Modal.Footer>
      </Modal>

      {showPostingModal && office && (
        <EmployeePostingModal
          show={showPostingModal}
          office={office}
          posting={editingPosting}
          employeeOptions={employeeOptions}
          onHide={() => {
            setShowPostingModal(false);
            setEditingPosting(null);
          }}
          onSaved={() => {
            setShowPostingModal(false);
            setEditingPosting(null);
            fetchEmployees();
          }}
        />
      )}

      {historyEmployee && (
        <PostingHistoryModal
          show={!!historyEmployee}
          employee={historyEmployee}
          onHide={() => setHistoryEmployee(null)}
        />
      )}
    </>
  );
}

export default OfficeDetailsModal;
