import React, { useState, createContext, useMemo, Suspense, lazy, useRef, useEffect, useLayoutEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { Modal } from "react-bootstrap";
import Qualifications from "./tabs/Qualifications";
import Experience from "./tabs/Experience";
import EmployeeDocuments from "./tabs/EmployeeDocuments";
import Assets from "./tabs/Assets";
import EmployeeActions from "./tabs/EmployeeActions";
import Children from "./tabs/Children";

// Lazy load heavy components for better performance
const BasicDetails = lazy(() => import("./tabs/BasicDetails"));
const BankDetails = lazy(() => import("./tabs/BankDetails"));

export const EmployeeContext = createContext(null);

const EmployeeManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const employeeIdFromUrl = searchParams.get("id");
  const tabFromUrl = searchParams.get("tab");
  const [employeeId, setEmployeeId] = useState(employeeIdFromUrl);
  const [activeTab, setActiveTab] = useState(tabFromUrl || "basic-details");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [pendingTabSwitch, setPendingTabSwitch] = useState(null);
  const [employeeName, setEmployeeName] = useState("");
  const previousLocationRef = useRef(location);
  const isNavigatingAwayRef = useRef(false);
  const shouldBlockRef = useRef(false);

  const tabs = [
    { id: "basic-details", label: "General Info", component: BasicDetails },
    { id: "bank-details", label: "Bank Details", component: BankDetails },
    { id: "qualifications", label: "Qualifications", component: Qualifications },
    { id: "experience", label: "Experiences", component: Experience },
    { id: "documents", label: "Documents", component: EmployeeDocuments },
    { id: "children", label: "Child/ren", component: Children },
    { id: "assets", label: "Assets", component: Assets },
    // { id: "actions", label: "Employee Actions", component: EmployeeActions },
  ];

  // Initialize previous location on mount
  useEffect(() => {
    previousLocationRef.current = location;
  }, []);

  // Intercept navigation by overriding history methods
  useEffect(() => {
    if (!hasUnsavedChanges) {
      return; // No need to intercept if no unsaved changes
    }

    // Store original methods
    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);

    // Helper to extract path from URL (handles both hash and regular URLs)
    const getPathFromUrl = (url) => {
      if (!url) return '';
      if (typeof url === 'string') {
        // For HashRouter, URL might be like "/#/dashboard/employee-profile"
        if (url.includes('#')) {
          const hashPart = url.split('#')[1];
          return hashPart.split('?')[0];
        }
        return url.split('?')[0];
      }
      return '';
    };

    // Override pushState
    window.history.pushState = function(state, title, url) {
      if (isNavigatingAwayRef.current) {
        // Allow navigation if user confirmed
        return originalPushState(state, title, url);
      }

      // Get current and new paths
      const currentHash = window.location.hash;
      const currentPath = currentHash ? currentHash.substring(1).split('?')[0] : window.location.pathname;
      const newPath = getPathFromUrl(url);

      // Check if leaving employee-management page
      if (currentPath.includes('/employee-management') && newPath && !newPath.includes('/employee-management')) {
        // Block navigation - show modal
        const fullNewPath = newPath + (url && url.includes('?') ? '?' + url.split('?')[1] : '');
        setPendingNavigation(fullNewPath);
        setShowConfirmModal(true);
        return; // Don't call original pushState
      }

      // Allow navigation
      return originalPushState(state, title, url);
    };

    // Override replaceState
    window.history.replaceState = function(state, title, url) {
      if (isNavigatingAwayRef.current) {
        // Allow navigation if user confirmed
        return originalReplaceState(state, title, url);
      }

      // Get current and new paths
      const currentHash = window.location.hash;
      const currentPath = currentHash ? currentHash.substring(1).split('?')[0] : window.location.pathname;
      const newPath = getPathFromUrl(url);

      // Check if leaving employee-management page
      if (currentPath.includes('/employee-management') && newPath && !newPath.includes('/employee-management')) {
        // Block navigation - show modal
        const fullNewPath = newPath + (url && url.includes('?') ? '?' + url.split('?')[1] : '');
        setPendingNavigation(fullNewPath);
        setShowConfirmModal(true);
        return; // Don't call original replaceState
      }

      // Allow navigation
      return originalReplaceState(state, title, url);
    };

    // Cleanup: restore original methods
    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [hasUnsavedChanges]);

  // Also listen to hashchange as backup
  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const handleHashChange = () => {
      if (isNavigatingAwayRef.current) {
        return; // Allow if user confirmed
      }

      const hash = window.location.hash;
      const hashPath = hash.substring(1);
      const [path] = hashPath.split('?');
      
      // Check if we're leaving employee-management
      if (!path.includes('/employee-management') && previousLocationRef.current.pathname.includes('/employee-management')) {
        // Block and revert
        const previousFullPath = previousLocationRef.current.pathname + previousLocationRef.current.search;
        const previousHash = '#' + previousFullPath;
        window.history.replaceState(null, '', window.location.pathname + previousHash);
        navigate(previousFullPath, { replace: true });
        setPendingNavigation(path);
        setShowConfirmModal(true);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [hasUnsavedChanges, navigate]);

  // Detect route changes and block navigation if there are unsaved changes
  // Use useLayoutEffect to run synchronously before browser paint
  useLayoutEffect(() => {
    if (isNavigatingAwayRef.current) {
      // User confirmed navigation, allow it
      previousLocationRef.current = location;
      return;
    }

    const currentPath = location.pathname + location.search;
    const previousPath = previousLocationRef.current.pathname + previousLocationRef.current.search;
    
    // Skip if paths are the same (no navigation occurred)
    if (currentPath === previousPath) {
      return;
    }

    // Check if we're navigating away from employee-management page
    const isLeavingPage = previousLocationRef.current.pathname.includes('/employee-management') && 
                          !location.pathname.includes('/employee-management');
    
    // Only block if we're leaving the page (not just changing tabs/query params)
    if (isLeavingPage && hasUnsavedChanges) {
      // Store the target location
      const targetPath = location.pathname + location.search;
      const previousFullPath = previousLocationRef.current.pathname + previousLocationRef.current.search;
      
      // Immediately revert navigation using both methods
      // Method 1: Direct hash manipulation for HashRouter
      const currentHash = window.location.hash;
      if (currentHash) {
        const newHash = '#' + previousFullPath;
        // Use requestAnimationFrame to ensure this happens after React Router's update
        requestAnimationFrame(() => {
          window.history.replaceState(null, '', window.location.pathname + newHash);
        });
      }
      
      // Method 2: React Router navigate
      navigate(previousFullPath, { replace: true });
      
      // Set pending navigation and show modal
      setPendingNavigation(targetPath);
      setShowConfirmModal(true);
    } else {
      // Update previous location only if we're not blocking
      previousLocationRef.current = location;
    }
  }, [location, hasUnsavedChanges, navigate]);

  // Check if tab should be disabled (all tabs except basic-details require employeeId)
  const isTabDisabled = (tabId) => {
    return tabId !== "basic-details" && !employeeId;
  };
 
  React.useEffect(() => {
    const id = searchParams.get("id");
    const tab = searchParams.get("tab");
    
    setEmployeeId(id);
    
    // Clear employee name if no employee ID
    if (!id) {
      setEmployeeName("");
    }
    
    if (tab && tab !== "basic-details" && !id) {
      navigate(`/dashboard/employee-management?tab=basic-details`, { replace: true });
      setActiveTab("basic-details");
    } else if (tab && tab !== activeTab) {
      if (!isTabDisabled(tab)) {
        setActiveTab(tab);
      } else {
        setActiveTab("basic-details");
      }
    } else if (!tab && activeTab !== "basic-details") {
      setActiveTab("basic-details");
    }
  }, [searchParams]);

  // Handle tab click with validation
  const handleTabClick = (tabId) => {
    // Don't show warning if clicking the same tab
    if (tabId === activeTab) {
      return;
    }

    if (isTabDisabled(tabId)) {
      toast.warning("Please save employee basic details first to access this tab");
      // Force switch to basic-details if trying to access disabled tab
      setActiveTab("basic-details");
      navigate(`/dashboard/employee-management?tab=basic-details`, { replace: true });
      return;
    }
    
    // Check for unsaved changes before switching tabs
    if (hasUnsavedChanges) {
      setPendingTabSwitch(tabId);
      setShowConfirmModal(true);
      return;
    }
    
    // Switch tab if no unsaved changes
    switchToTab(tabId);
  };

  // Switch to a specific tab
  const switchToTab = (tabId) => {
    setActiveTab(tabId);
    const currentId = searchParams.get("id");
    if (currentId) {
      navigate(`/dashboard/employee-management?id=${currentId}&tab=${tabId}`, { replace: true });
    } else {
      navigate(`/dashboard/employee-management?tab=${tabId}`, { replace: true });
    }
  };

  // Update URL when employeeId is set (after saving basic details)
  React.useEffect(() => {
    if (employeeId && !searchParams.get("id")) {
      navigate(`/dashboard/employee-management?id=${employeeId}&tab=${activeTab}`, { replace: true });
    }
  }, [employeeId, activeTab, navigate, searchParams]);

  // Handle navigation with unsaved changes check
  const handleNavigation = (path) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(path);
      setShowConfirmModal(true);
    } else {
      navigate(path);
    }
  };

  // Confirm navigation/tab switch - discard changes
  const handleConfirmNavigation = () => {
    setHasUnsavedChanges(false);
    setShowConfirmModal(false);
    isNavigatingAwayRef.current = true;
    
    // Handle tab switch
    if (pendingTabSwitch) {
      switchToTab(pendingTabSwitch);
      setPendingTabSwitch(null);
    }
    // Handle navigation (from button click or menu/sidebar)
    else if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
    
    // Reset flag after a short delay to allow navigation to complete
    setTimeout(() => {
      isNavigatingAwayRef.current = false;
    }, 100);
  };

  // Cancel navigation/tab switch
  const handleCancelNavigation = () => {
    setShowConfirmModal(false);
    setPendingNavigation(null);
    setPendingTabSwitch(null);
  };

  return (
    <div className="container-xxl flex-grow-1" style={{ paddingTop: 0, paddingBottom: '1.625rem', paddingLeft: '1.625rem', paddingRight: '1.625rem' }}>
      <div className="row" style={{ marginTop: 0 }}>
        <div className="col-lg-12">
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', minHeight: '600px', maxHeight: 'calc(100vh - 120px)' }}>
            
            <div 
              className="card-header d-flex align-items-center justify-content-between"
              style={{
                position: 'sticky',
                top: 0,
                backgroundColor: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                padding: '1rem 1.5rem'
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <h5 className="m-0">Employee Management</h5>
                {employeeName && (
                  <span 
                    className="badge bg-primary"
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      color: '#fff'
                    }}
                  >
                    {employeeName}
                  </span>
                )}
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => handleNavigation("/dashboard/employee-profile")}
                style={{ 
                  whiteSpace: 'nowrap',
                  fontWeight: 500,
                  padding: '0.5rem 1rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <i className="bx bx-arrow-back me-1"></i> Back to Employee List
              </button>
            </div>
            
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', padding: 0 }}>
              
              <div
                style={{
                  position: 'sticky',
                  top: '0px',
                  backgroundColor: '#fff',
                  borderBottom: '1px solid rgba(67, 89, 113, 0.12)',
                  padding: '0 1.5rem',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}
              >
                <ul className="nav nav-tabs" role="tablist" style={{ marginBottom: 0, borderBottom: 'none', gap: '0.5rem' }}>
                  {tabs.map((tab) => {
                    const disabled = isTabDisabled(tab.id);
                    return (
                      <li key={tab.id} className="nav-item" role="presentation" style={{ marginRight: 0 }}>
                        <button
                          type="button"
                          className={`nav-link ${activeTab === tab.id ? "active" : ""} ${disabled ? "disabled" : ""}`}
                          onClick={() => handleTabClick(tab.id)}
                          role="tab"
                          aria-selected={activeTab === tab.id}
                          disabled={disabled}
                          style={{
                            border: activeTab === tab.id 
                              ? '2px solid #696cff' 
                              : '2px solid rgba(67, 89, 113, 0.12)',
                            borderRadius: '8px 8px 0 0',
                            padding: '0.75rem 1.25rem',
                            marginRight: '0.5rem',
                            backgroundColor: activeTab === tab.id 
                              ? '#fff' 
                              : 'rgba(67, 89, 113, 0.04)',
                            color: disabled 
                              ? '#c0c4c8' 
                              : activeTab === tab.id 
                                ? '#696cff' 
                                : '#697a8d',
                            fontWeight: activeTab === tab.id ? 600 : 400,
                            transition: 'all 0.2s ease',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            opacity: disabled ? 0.6 : 1,
                            pointerEvents: disabled ? 'none' : 'auto',
                            boxShadow: activeTab === tab.id 
                              ? '0 -2px 4px rgba(105, 108, 255, 0.1)' 
                              : 'none',
                            position: 'relative',
                            zIndex: activeTab === tab.id ? 1 : 0
                          }}
                          title={disabled ? "Please save employee basic details first" : ""}
                        >
                          {tab.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              
              <div 
                className="tab-content"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  padding: '1.5rem',
                  backgroundColor: '#fff'
                }}
              >
                {(() => {
                  const activeTabData = tabs.find(tab => tab.id === activeTab);
                  if (!activeTabData) return null;
                  
                  const TabComponent = activeTabData.component;
                  const contextValue = useMemo(() => ({ 
                    employeeId, 
                    setEmployeeId,
                    setHasUnsavedChanges,
                    hasUnsavedChanges,
                    setEmployeeName
                  }), [employeeId, hasUnsavedChanges]);
                  
                  return (
                    <div
                      key={activeTab}
                      className="tab-pane fade show active"
                      role="tabpanel"
                    >
                      <EmployeeContext.Provider value={contextValue}>
                        <Suspense fallback={
                          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </div>
                        }>
                          <TabComponent />
                        </Suspense>
                      </EmployeeContext.Provider>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Unsaved Changes */}
      <Modal
        show={showConfirmModal}
        onHide={handleCancelNavigation}
        size="sm"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header className="border-0" closeButton>
          <Modal.Title>Unsaved Changes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex align-items-center justify-content-center shortDataHeight">
            {pendingTabSwitch 
              ? "You have unsaved data. Are you sure you want to switch tabs without saving?"
              : "You have unsaved data. Are you sure you want to leave without saving?"
            }
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-secondary px-3"
            onClick={handleCancelNavigation}
            autoFocus
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary px-3"
            onClick={handleConfirmNavigation}
          >
            Leave Without Saving
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EmployeeManagement;

