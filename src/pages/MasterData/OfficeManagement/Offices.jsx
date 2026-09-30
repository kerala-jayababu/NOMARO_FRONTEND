import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import NavTabButton from "../../../components/navbarButton";
import Grid from "../../../components/grid";
import OfficeManagementService from "../../../core/services/OfficeManagementService";
import CommonService from "../../../core/services/CommonService";
import { showToast } from "../../../components/ToastNotifications/toastUtils";
import { useLoader } from "../../../components/LoaderContext";
import OfficeFormModal from "./OfficeFormModal";
import OfficeDetailsModal from "./OfficeDetailsModal";
import OfficeHierarchy from "./tabs/OfficeHierarchy";

function Offices() {
  const [activeTab, setActiveTab] = useState("#navs-top-offices");
  const [offices, setOffices] = useState([]);
  const [allOffices, setAllOffices] = useState([]);
  const [officeTypes, setOfficeTypes] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [filterOfficeType, setFilterOfficeType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsOfficeId, setDetailsOfficeId] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusOffice, setStatusOffice] = useState(null);

  const { showLoader, hideLoader } = useLoader();

  useEffect(() => {
    fetchOfficeTypes();
    fetchAllOffices();
    fetchEmployees();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchOffices();
    }, 500);
    return () => clearTimeout(debounceTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, filterOfficeType, filterStatus]);

  const fetchOfficeTypes = async () => {
    const response = await OfficeManagementService.getOfficeTypes();
    if (response.error) {
      showToast(response.error, "error");
      setOfficeTypes([]);
    } else {
      setOfficeTypes(Array.isArray(response.data?.data) ? response.data.data : []);
    }
  };

  const fetchOffices = async () => {
    setLoading(true);
    try {
      const response = await OfficeManagementService.getOffices({
        searchText: searchText.trim(),
        idOfficeType: filterOfficeType ? Number(filterOfficeType) : null,
        isActive: filterStatus === "" ? null : filterStatus === "true",
      });
      if (response.error) {
        showToast(response.error, "error");
        setOffices([]);
      } else {
        setOffices(Array.isArray(response.data?.data) ? response.data.data : []);
      }
    } catch (error) {
      showToast("Failed to fetch offices", "error");
      setOffices([]);
    } finally {
      setLoading(false);
    }
  };

  // Unfiltered list used by the parent office dropdown and the hierarchy view
  const fetchAllOffices = async () => {
    const response = await OfficeManagementService.getOffices();
    if (!response.error) {
      setAllOffices(Array.isArray(response.data?.data) ? response.data.data : []);
    }
  };

  const fetchEmployees = () => {
    CommonService.getEmployeeList()
      .then((res) => {
        const list = res.data?.data || [];
        setEmployeeOptions(
          list.map((emp) => ({
            value: emp.idEmployee,
            label: `${emp.employeeCode} - ${emp.fullName}`,
          }))
        );
      })
      .catch(() => {});
  };

  const refreshOffices = () => {
    fetchOffices();
    fetchAllOffices();
  };

  const handleAdd = () => {
    setSelectedOffice(null);
    setShowFormModal(true);
  };

  const handleEdit = (office) => {
    setSelectedOffice(office);
    setShowFormModal(true);
  };

  const handleView = (idOffice) => {
    setDetailsOfficeId(idOffice);
    setShowDetailsModal(true);
  };

  const handleStatusClick = (office) => {
    setStatusOffice(office);
    setShowStatusModal(true);
  };

  const handleStatusConfirm = async () => {
    if (!statusOffice) return;
    const newStatus = !statusOffice.isActive;
    showLoader();
    try {
      const response = await OfficeManagementService.updateOfficeStatus(statusOffice.idOffice, newStatus);
      if (response.error) {
        showToast(response.error, "error");
      } else {
        showToast(response.data?.message || "Office status updated successfully", "success");
        refreshOffices();
      }
    } catch (error) {
      showToast("Failed to update office status", "error");
    } finally {
      hideLoader();
      setShowStatusModal(false);
      setStatusOffice(null);
    }
  };

  const columns = [
    { key: "officeCode", label: "Office Code" },
    { key: "officeName", label: "Office Name" },
    { key: "officeTypeName", label: "Office Type" },
    {
      key: "parentOfficeName",
      label: "Parent Office",
      render: (value) => value || "-",
    },
    { key: "city", label: "City", render: (value) => value || "-" },
    {
      key: "officeHeadName",
      label: "Office Head",
      render: (value) => value || "-",
    },
    {
      key: "isActive",
      label: "Status",
      render: (_, row) => (
        <span className={`badge ${row.isActive ? "bg-label-success" : "bg-label-warning"}`}>
          {row.isActive ? "Active" : "Inactive"}
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
            title="View"
            onClick={() => handleView(row.idOffice)}
          >
            <span className="bx bx-show"></span>
          </button>
          <button
            type="button"
            className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
            title="Edit"
            onClick={() => handleEdit(row)}
          >
            <span className="bx bx-pencil"></span>
          </button>
          <button
            type="button"
            className={`btn btn-sm btn-icon px-3 border-0 ${row.isActive ? "btn-outline-danger" : "btn-outline-success"}`}
            title={row.isActive ? "Deactivate" : "Activate"}
            onClick={() => handleStatusClick(row)}
          >
            <span className={`bx ${row.isActive ? "bx-block" : "bx-check-circle"}`}></span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="pb-3">
        <h5 className="m-0">Office Management</h5>
      </div>

      <div className="nav-align-top mb-4">
        {/* Tab Navigation */}
        <ul className="nav nav-tabs" role="tablist">
          <NavTabButton
            id="officesTab"
            label="Offices"
            target="#navs-top-offices"
            isActive={activeTab === "#navs-top-offices"}
            onClick={() => setActiveTab("#navs-top-offices")}
          />
          <NavTabButton
            id="officeHierarchyTab"
            label="Office Hierarchy"
            target="#navs-top-office-hierarchy"
            isActive={activeTab === "#navs-top-office-hierarchy"}
            onClick={() => setActiveTab("#navs-top-office-hierarchy")}
          />
        </ul>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Offices Tab */}
          <div
            className={`tab-pane fade ${activeTab === "#navs-top-offices" ? "show active" : ""}`}
            id="navs-top-offices"
            role="tabpanel"
          >
            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2 pb-3">
                <h5 className="m-0">List of Offices</h5>
                <div className="list_menu flex-wrap">
                  <div className="list_searchbox">
                    <select
                      className="form-select form-select-sm"
                      value={filterOfficeType}
                      onChange={(e) => setFilterOfficeType(e.target.value)}
                    >
                      <option value="">All Office Types</option>
                      {officeTypes.map((type) => (
                        <option key={type.idOfficeType} value={type.idOfficeType}>
                          {type.officeTypeName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="list_searchbox">
                    <select
                      className="form-select form-select-sm"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="">All Status</option>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                  <div className="list_searchbox">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search code, name, city"
                      maxLength={50}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                    <i className="bx bx-search"></i>
                  </div>
                  <button type="button" className="btn btn-primary btn-sm" onClick={handleAdd}>
                    <i className="bx bx-plus me-1"></i> Add Office
                  </button>
                </div>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="text-center p-3">Loading...</div>
                ) : (
                  <Grid columns={columns} data={offices} idKey="idOffice" />
                )}
              </div>
            </div>
          </div>

          {/* Office Hierarchy Tab */}
          <div
            className={`tab-pane fade ${activeTab === "#navs-top-office-hierarchy" ? "show active" : ""}`}
            id="navs-top-office-hierarchy"
            role="tabpanel"
          >
            {activeTab === "#navs-top-office-hierarchy" && (
              <OfficeHierarchy offices={allOffices} onViewOffice={handleView} />
            )}
          </div>
        </div>
      </div>

      {showFormModal && (
        <OfficeFormModal
          show={showFormModal}
          office={selectedOffice}
          officeTypes={officeTypes}
          allOffices={allOffices}
          employeeOptions={employeeOptions}
          onHide={() => {
            setShowFormModal(false);
            setSelectedOffice(null);
          }}
          onSaved={() => {
            setShowFormModal(false);
            setSelectedOffice(null);
            refreshOffices();
          }}
        />
      )}

      {showDetailsModal && (
        <OfficeDetailsModal
          show={showDetailsModal}
          idOffice={detailsOfficeId}
          employeeOptions={employeeOptions}
          onHide={() => {
            setShowDetailsModal(false);
            setDetailsOfficeId(null);
          }}
        />
      )}

      <Modal
        show={showStatusModal}
        onHide={() => {
          setShowStatusModal(false);
          setStatusOffice(null);
        }}
        size="md"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <h5>{statusOffice?.isActive ? "Confirm Deactivate" : "Confirm Activate"}</h5>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="modal-body pt-1 text-center">
            <div className="text-center mb-5">
              <div className={`mb-4 ${statusOffice?.isActive ? "text-danger" : "text-success"}`}>
                <i className={`bx ${statusOffice?.isActive ? "bx-block" : "bx-check-circle"} fs-2`}></i>
              </div>
              <h6>
                Are you sure you want to {statusOffice?.isActive ? "deactivate" : "activate"}{" "}
                {statusOffice?.officeName}?
              </h6>
            </div>
            <button type="button" className="btn btn-primary btn-sm py-2 px-4 me-2" onClick={handleStatusConfirm}>
              Confirm
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm py-2 px-4"
              onClick={() => {
                setShowStatusModal(false);
                setStatusOffice(null);
              }}
            >
              Cancel
            </button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Offices;
