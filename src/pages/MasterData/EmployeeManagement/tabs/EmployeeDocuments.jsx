import React, { useState, useEffect, useContext, useRef } from "react";
import { Modal } from "react-bootstrap";
import { EmployeeContext } from "../EmployeeManagement";
import EmployeeManagementService from "../../../../core/services/EmployeeManagementService";
import secureLocalStorage from "react-secure-storage";
import { toast } from "react-toastify";
import { useLoader } from "../../../../components/LoaderContext";
import moment from "moment";

const EmployeeDocuments = () => {
  const { employeeId } = useContext(EmployeeContext) || {};
  const id = employeeId;
  const { showLoader, hideLoader } = useLoader();
  const [documents, setDocuments] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);
  
  // Refs to track loading state and prevent duplicate calls
  const documentTypesLoadedRef = useRef(false);
  const documentsLoadedRef = useRef(null);

  const [formData, setFormData] = useState({
    idDocumentType: "",
    remarks: "",
    document: null,
  });

  // Load document types once on mount (static data)
  useEffect(() => {
    let isMounted = true;
    
    if (!documentTypesLoadedRef.current && isMounted) {
      documentTypesLoadedRef.current = true;
      loadDocumentTypes();
    }
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Load employee documents when id changes
  useEffect(() => {
    if (!id) return;
    
    if (documentsLoadedRef.current !== id) {
      documentsLoadedRef.current = id;
      loadDocuments();
    }
    
    return () => {
      // Reset ref when component unmounts to allow fresh load on next mount
      documentsLoadedRef.current = null;
    };
  }, [id]);

  const loadDocuments = async () => {
    if (!id) return;
    try {
      showLoader();
      const result = await EmployeeManagementService.getEmployeeDocuments(parseInt(id));
      hideLoader();
      if (result.error) {
        toast.error(result.error);
      } else {
        setDocuments(result.data?.data || []);
      }
    } catch (error) {
      hideLoader();
      toast.error("Failed to load documents");
    }
  };

  const loadDocumentTypes = async () => {
    try {
      const result = await EmployeeManagementService.getDocumentTypes();
      if (result.error) {
        toast.error(result.error);
      } else {
        setDocumentTypes(result.data?.data || []);
      }
    } catch (error) {
      console.error("Failed to load document types:", error);
    }
  };

  const getCurrentUserId = () => {
    const user = secureLocalStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      return userData.idEmployee || 1;
    }
    return 1;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        document: file,
      }));
    }
  };

  const handleUpload = async () => {
    if (!id) {
      toast.warning("Please save employee basic details first");
      return;
    }

    if (!formData.idDocumentType) {
      toast.error("Please select document type");
      return;
    }

    if (!formData.document && !editingId) {
      toast.error("Please select a document to upload");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        idEmployeeDocument: editingId || 0,
        idEmployee: parseInt(id),
        idDocumentType: parseInt(formData.idDocumentType),
        remarks: formData.remarks || "",
        documentContent: formData.document,
        idUser: getCurrentUserId(),
      };

      const result = await EmployeeManagementService.postEmployeeDocument(payload);
      setLoading(false);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(editingId ? "Document updated successfully" : "Document uploaded successfully");
        handleReset();
        loadDocuments();
      }
    } catch (error) {
      setLoading(false);
      toast.error("Failed to upload document");
    }
  };

  const handleEdit = (doc) => {
    setEditingId(doc.idEmployeeDocument);
    setFormData({
      idDocumentType: doc.idDocumentType?.toString() || "",
      remarks: doc.remarks || "",
      document: null,
    });
  };

  const handleDelete = async (docId) => {
    setSelectedDocId(docId);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedDocId) return;

    // Note: Delete API might need to be added to the service
    toast.info("Delete functionality to be implemented");
    setShowConfirmModal(false);
    setSelectedDocId(null);
  };

  const handleView = async (doc) => {
    try {
      showLoader();
      const result = await EmployeeManagementService.getEmployeeDocuments(parseInt(id), doc.idEmployeeDocument);
      hideLoader();
      
      if (result.error) {
        toast.error(result.error);
      } else {
        // Handle document viewing - might need to open in new window or download
        const documentData = result.data?.data?.[0];
        if (documentData?.documentContent) {
          // Create blob and open/download
          const byteCharacters = atob(documentData.documentContent);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: "application/pdf" });
          const url = window.URL.createObjectURL(blob);
          window.open(url, "_blank");
        }
      }
    } catch (error) {
      hideLoader();
      toast.error("Failed to view document");
    }
  };

  const handleReset = () => {
    setEditingId(null);
    setFormData({
      idDocumentType: "",
      remarks: "",
      document: null,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return moment(dateString).format("DD-MMM-YYYY");
  };

  return (
    <div className="row">
      <div className="col-lg-8">
        <div>
          <div>
            <h6 className="mb-0">Documents</h6>
          </div>
          <div className="p-3">
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Document Type</th>
                    <th>Remarks</th>
                    <th>Uploaded On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.length > 0 ? (
                    documents.map((doc) => (
                      <tr key={doc.idEmployeeDocument}>
                        <td>{doc.documentTypeName || doc.idDocumentType}</td>
                        <td>{doc.remarks || "-"}</td>
                        <td>{formatDate(doc.createdAt)}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-icon btn-outline-primary px-3 border-0 me-2"
                            onClick={() => handleView(doc)}
                            title="View"
                          >
                            <i className="bx bx-show"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0 me-2"
                            onClick={() => handleEdit(doc)}
                            title="Edit"
                          >
                            <i className="bx bx-pencil"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm border-0"
                            onClick={() => handleDelete(doc.idEmployeeDocument)}
                            title="Delete"
                          >
                            <i className="bx bx-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center">
                        No documents uploaded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-4">
        <div className="card" style={{boxShadow: '0 0px 2px 0 rgba(67, 89, 113, 1.12)'}}>
          <div className="card-header">
            <h6 className="mb-0">Add / Update Document</h6>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label mb-1">Document Type *</label>
              <select
                className="form-select"
                value={formData.idDocumentType}
                onChange={(e) => handleInputChange("idDocumentType", e.target.value)}
              >
                <option value="">Select Document Type</option>
                {documentTypes.map((type) => (
                  <option key={type.idDocumentType} value={type.idDocumentType}>
                    {type.documentTypeName}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label mb-1">Remarks</label>
              <textarea
                className="form-control"
                rows="3"
                value={formData.remarks}
                onChange={(e) => handleInputChange("remarks", e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label mb-1">Upload Document</label>
              <input
                type="file"
                className="form-control"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </div>

            <div className="d-flex gap-2">
              <button className="btn btn-primary" onClick={handleUpload} disabled={loading}>
              {loading ? "Saving..." : "Save"}
              </button>
              <button className="btn btn-outline-secondary" onClick={handleReset} disabled={loading}>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        show={showConfirmModal}
        onHide={() => {
          setShowConfirmModal(false);
          setSelectedDocId(null);
        }}
        size="sm"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header className="border-0" closeButton>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex align-items-center justify-content-center shortDataHeight">
            Are you sure you want to delete this document?
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-secondary px-3"
            onClick={() => {
              setShowConfirmModal(false);
              setSelectedDocId(null);
            }}
            autoFocus
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary px-3"
            onClick={confirmDelete}
          >
            Confirm
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EmployeeDocuments;
