import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import Grid from "../../../components/grid";
import OfficeManagementService from "../../../core/services/OfficeManagementService";
import { showToast } from "../../../components/ToastNotifications/toastUtils";
import Utils from "../../../utils/Utils";

function PostingHistoryModal({ show, employee, onHide }) {
  const [postings, setPostings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee?.idEmployee) fetchPostings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee]);

  const fetchPostings = async () => {
    setLoading(true);
    try {
      const response = await OfficeManagementService.getEmployeeOfficePostings(employee.idEmployee);
      if (response.error) {
        showToast(response.error, "error");
        setPostings([]);
      } else {
        setPostings(Array.isArray(response.data?.data) ? response.data.data : []);
      }
    } catch (error) {
      showToast("Failed to fetch posting history", "error");
      setPostings([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: "officeCode", label: "Office Code" },
    { key: "officeName", label: "Office Name" },
    { key: "postingType", label: "Posting Type", render: (value) => value || "-" },
    { key: "postingFromDate", label: "From", render: (value) => Utils.formatDisplayDate(value) },
    { key: "postingToDate", label: "To", render: (value) => (value ? Utils.formatDisplayDate(value) : "-") },
    { key: "transferOrderNumber", label: "Order No.", render: (value) => value || "-" },
    {
      key: "isCurrentPosting",
      label: "Current",
      render: (_, row) => (
        <span className={`badge ${row.isCurrentPosting ? "bg-label-success" : "bg-label-secondary"}`}>
          {row.isCurrentPosting ? "Yes" : "No"}
        </span>
      ),
    },
    { key: "postingRemarks", label: "Remarks", render: (value) => value || "-" },
  ];

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      aria-labelledby="contained-modal-title-vcenter"
      centered
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <h5>
            Posting History - {employee?.employeeCode} {employee?.employeeName}
          </h5>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center p-3">Loading...</div>
        ) : (
          <Grid columns={columns} data={postings} idKey="idEmployeeOfficePosting" />
        )}
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn btn-outline-secondary btn-sm py-2 px-4" onClick={onHide}>
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
}

export default PostingHistoryModal;
