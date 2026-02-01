import React, { useEffect, useState } from "react";
import { Tree, TreeNode } from "react-organizational-chart";
import Card from "../../components/card";
import OrgHierarchyService from "../../core/services/OrgHierarchyService";
import { useLoader } from "../../components/LoaderContext";
import { showToast } from "../../components/ToastNotifications/toastUtils";
import defaultAvatar from "../../assets/avatar.jpg";
import "./OrgHierarchy.css";

const OrgHierarchy = () => {
  const [hierarchyData, setHierarchyData] = useState([]);
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [maxLevel, setMaxLevel] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState(0); // 0 means show all
  const { showLoader, hideLoader } = useLoader();

  useEffect(() => {
    fetchHierarchyData();
  }, []);

  const fetchHierarchyData = async () => {
    try {
      setLoading(true);
      showLoader();
      const response = await OrgHierarchyService.getEmployeeHierarchy();

      if (response.error) {
        setError(response.error);
        showToast(response.error, "error");
        return;
      }

      if (response.data?.success && response.data?.data) {
        const data = response.data.data;
        setHierarchyData(data);
        const tree = buildTree(data);
        setTreeData(tree);

        // Calculate max level from data
        const levels = data.map((emp) => emp.levelNumber);
        const maxLevelValue = Math.max(...levels);
        setMaxLevel(maxLevelValue);
        setSelectedLevel(maxLevelValue + 1); // Show all levels by default (All Levels option)
      } else {
        setError("No hierarchy data available");
      }
    } catch (err) {
      setError("Failed to fetch organization hierarchy");
      showToast("Failed to fetch organization hierarchy", "error");
    } finally {
      setLoading(false);
      hideLoader();
    }
  };

  // Build tree structure from flat array
  const buildTree = (employees) => {
    if (!employees || employees.length === 0) return null;

    // Create a map of employees by ID
    const employeeMap = {};
    employees.forEach((emp) => {
      employeeMap[emp.idEmployee] = { ...emp, children: [] };
    });

    // Build the tree by linking children to parents
    let roots = [];
    employees.forEach((emp) => {
      if (emp.reportingTo === 0 || !employeeMap[emp.reportingTo]) {
        // Root node (no manager or manager not in list)
        roots.push(employeeMap[emp.idEmployee]);
      } else {
        // Add as child to parent
        employeeMap[emp.reportingTo].children.push(employeeMap[emp.idEmployee]);
      }
    });

    // Sort by level number for proper ordering
    roots.sort((a, b) => a.levelNumber - b.levelNumber);

    return roots.length === 1 ? roots[0] : { isMultiRoot: true, roots };
  };

  // Deep clone a node to prevent mutation of original data
  const deepCloneNode = (node) => {
    if (!node) return null;
    return {
      ...node,
      children: node.children ? node.children.map(deepCloneNode) : [],
    };
  };

  // Filter tree by level - uses the actual levelNumber from API data
  const filterTreeByLevel = (node, targetLevel) => {
    if (!node) return null;

    // If this node's level is greater than target, don't include it
    if (node.levelNumber > targetLevel) return null;

    // Deep clone to prevent mutation
    const filteredNode = {
      ...node,
      children: [],
    };

    // If this node is below the target level, include filtered children
    if (node.levelNumber < targetLevel && node.children && node.children.length > 0) {
      filteredNode.children = node.children
        .map((child) => filterTreeByLevel(child, targetLevel))
        .filter((child) => child !== null);
    }

    return filteredNode;
  };

  // Get filtered tree based on selected level
  const getDisplayTree = () => {
    // Show all levels if: no selection, 0, or "All Levels" option selected
    if (!treeData || selectedLevel === 0 || selectedLevel > maxLevel) {
      // Return a deep clone to prevent any potential mutation
      if (treeData?.isMultiRoot) {
        return {
          isMultiRoot: true,
          roots: treeData.roots.map(deepCloneNode),
        };
      }
      return treeData ? deepCloneNode(treeData) : null;
    }

    if (treeData.isMultiRoot) {
      return {
        isMultiRoot: true,
        roots: treeData.roots
          .map((root) => filterTreeByLevel(root, selectedLevel))
          .filter((root) => root !== null),
      };
    }

    return filterTreeByLevel(treeData, selectedLevel);
  };

  // Generate level options for dropdown
  const getLevelOptions = () => {
    const options = [];
    for (let i = 1; i <= maxLevel; i++) {
      options.push({ value: i, label: `Level ${i}` });
    }
    // Add "All Levels" option at the end
    options.push({ value: maxLevel + 1, label: "All Levels" });
    return options;
  };

  // Handle level change
  const handleLevelChange = (e) => {
    setSelectedLevel(parseInt(e.target.value, 10));
  };

  // Get employee photo URL from binary data
  const getPhotoUrl = (employeePhoto) => {
    if (employeePhoto && employeePhoto.trim() !== "") {
      return `data:image/jpeg;base64,${employeePhoto}`;
    }
    return defaultAvatar;
  };

  // Determine if children should be rendered for this node
  // Rules:
  // - Nodes at level < selectedLevel → render children (return true)
  // - Nodes at level >= selectedLevel → don't render children (return false)
  // - If "All Levels" selected → render all children (return true)
  const shouldRenderChildren = (node) => {
    // If "All Levels" is selected (selectedLevel > maxLevel), render all children
    if (selectedLevel > maxLevel) {
      return true;
    }
    // Only render children if node level is less than selected level
    return node.levelNumber < selectedLevel;
  };

  // Employee Card Component
  const EmployeeCard = ({ employee }) => (
    <div className="org-card-wrapper">
      <div className="org-employee-card">
        <div className="org-employee-photo-container">
          <img
            src={getPhotoUrl(employee.employeePhoto)}
            alt={employee.fullName}
            className="org-employee-photo"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = defaultAvatar;
            }}
          />
        </div>
        <div className="org-employee-info">
          <h6 className="org-employee-name">{employee.fullName}</h6>
          <span className="org-employee-designation">{employee.designationName}</span>
        </div>
      </div>
    </div>
  );

  // Recursive TreeNode renderer
  // Only renders children if node level < selectedLevel (or All Levels selected)
  const renderTreeNodes = (node) => {
    if (!node) return null;

    const renderChildren = shouldRenderChildren(node);

    return (
      <TreeNode label={<EmployeeCard employee={node} />}>
        {renderChildren &&
          node.children &&
          node.children.length > 0 &&
          node.children.map((child) => (
            <React.Fragment key={child.idEmployee}>
              {renderTreeNodes(child)}
            </React.Fragment>
          ))}
      </TreeNode>
    );
  };

  // Render the full tree
  const renderTree = () => {
    const displayTree = getDisplayTree();
    if (!displayTree) return null;

    // Handle multiple root nodes case
    if (displayTree.isMultiRoot) {
      return (
        <div className="org-multi-root-container">
          {displayTree.roots.map((root) => {
            const renderChildren = shouldRenderChildren(root);
            return (
              <Tree
                key={root.idEmployee}
                lineWidth={"2px"}
                lineColor={"var(--primary-color)"}
                lineBorderRadius={"10px"}
                label={<EmployeeCard employee={root} />}
              >
                {renderChildren &&
                  root.children &&
                  root.children.map((child) => (
                    <React.Fragment key={child.idEmployee}>
                      {renderTreeNodes(child)}
                    </React.Fragment>
                  ))}
              </Tree>
            );
          })}
        </div>
      );
    }

    // Single root node
    const renderChildren = shouldRenderChildren(displayTree);
    return (
      <Tree
        lineWidth={"2px"}
        lineColor={"var(--primary-color)"}
        lineBorderRadius={"10px"}
        label={<EmployeeCard employee={displayTree} />}
      >
        {renderChildren &&
          displayTree.children &&
          displayTree.children.map((child) => (
            <React.Fragment key={child.idEmployee}>
              {renderTreeNodes(child)}
            </React.Fragment>
          ))}
      </Tree>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="row">
          <div className="col-lg-12">
            <Card title="Organization Hierarchy">
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Loading organization hierarchy...</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="row">
          <div className="col-lg-12">
            <Card title="Organization Hierarchy">
              <div className="text-center py-5">
                <i className="bx bx-error-circle text-danger" style={{ fontSize: "3rem" }}></i>
                <p className="mt-2 text-danger">{error}</p>
                <button
                  className="btn btn-primary mt-2"
                  onClick={fetchHierarchyData}
                >
                  Retry
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!treeData || hierarchyData.length === 0) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="row">
          <div className="col-lg-12">
            <Card title="Organization Hierarchy">
              <div className="text-center py-5">
                <i className="bx bx-sitemap text-muted" style={{ fontSize: "3rem" }}></i>
                <p className="mt-2 text-muted">No organization hierarchy data available</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Organization Hierarchy</h5>
              <div className="org-level-filter">
                <select
                  className="form-select form-select-sm"
                  value={selectedLevel}
                  onChange={handleLevelChange}
                  style={{ minWidth: "120px" }}
                >
                  {getLevelOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="card-body">
              <div className="org-hierarchy-container">
                {renderTree()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgHierarchy;
