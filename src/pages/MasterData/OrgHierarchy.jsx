import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Tree, TreeNode } from "react-organizational-chart";
import RCTree from "rc-tree";
import "rc-tree/assets/index.css";
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
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [viewMode, setViewMode] = useState("org");
  const [expandedKeys, setExpandedKeys] = useState([]);
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

        const levels = data.map((emp) => emp.levelNumber);
        const maxLevelValue = Math.max(...levels);
        setMaxLevel(maxLevelValue);
        setSelectedLevel(maxLevelValue + 1);

        // Set default expanded keys to root nodes only
        const roots = data.filter(
          (emp) => emp.reportingTo === 0 || !data.find((e) => e.idEmployee === emp.reportingTo)
        );
        setExpandedKeys(roots.map((r) => String(r.idEmployee)));
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

    const employeeMap = {};
    employees.forEach((emp) => {
      employeeMap[emp.idEmployee] = { ...emp, children: [] };
    });

    let roots = [];
    employees.forEach((emp) => {
      if (emp.reportingTo === 0 || !employeeMap[emp.reportingTo]) {
        roots.push(employeeMap[emp.idEmployee]);
      } else {
        employeeMap[emp.reportingTo].children.push(employeeMap[emp.idEmployee]);
      }
    });

    roots.sort((a, b) => a.levelNumber - b.levelNumber);
    return roots.length === 1 ? roots[0] : { isMultiRoot: true, roots };
  };

  const deepCloneNode = (node) => {
    if (!node) return null;
    return {
      ...node,
      children: node.children ? node.children.map(deepCloneNode) : [],
    };
  };

  const filterTreeByLevel = (node, targetLevel) => {
    if (!node) return null;
    if (node.levelNumber > targetLevel) return null;

    const filteredNode = { ...node, children: [] };

    if (node.levelNumber < targetLevel && node.children && node.children.length > 0) {
      filteredNode.children = node.children
        .map((child) => filterTreeByLevel(child, targetLevel))
        .filter((child) => child !== null);
    }

    return filteredNode;
  };

  const getDisplayTree = useCallback(() => {
    if (!treeData || selectedLevel === 0 || selectedLevel > maxLevel) {
      if (treeData?.isMultiRoot) {
        return { isMultiRoot: true, roots: treeData.roots.map(deepCloneNode) };
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
  }, [treeData, selectedLevel, maxLevel]);

  const getLevelOptions = useCallback(() => {
    const options = [];
    for (let i = 1; i <= maxLevel; i++) {
      options.push({ value: i, label: `Level ${i}` });
    }
    options.push({ value: maxLevel + 1, label: "All Levels" });
    return options;
  }, [maxLevel]);

  const handleLevelChange = useCallback((e) => {
    setSelectedLevel(parseInt(e.target.value, 10));
  }, []);

  const getPhotoUrl = useCallback((employeePhoto) => {
    if (employeePhoto && employeePhoto.trim() !== "") {
      return `data:image/jpeg;base64,${employeePhoto}`;
    }
    return defaultAvatar;
  }, []);

  const shouldRenderChildren = useCallback(
    (node) => {
      if (selectedLevel > maxLevel) return true;
      return node.levelNumber < selectedLevel;
    },
    [selectedLevel, maxLevel]
  );

  // ─── Org Chart View ───

  const EmployeeCard = React.memo(({ employee }) => (
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
  ));

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

  const renderOrgChart = () => {
    const displayTree = getDisplayTree();
    if (!displayTree) return null;

    if (displayTree.isMultiRoot) {
      return (
        <div className="org-multi-root-container">
          {displayTree.roots.map((root) => {
            const rc = shouldRenderChildren(root);
            return (
              <Tree
                key={root.idEmployee}
                lineWidth={"2px"}
                lineColor={"var(--primary-color)"}
                lineBorderRadius={"10px"}
                label={<EmployeeCard employee={root} />}
              >
                {rc &&
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

    const rc = shouldRenderChildren(displayTree);
    return (
      <Tree
        lineWidth={"2px"}
        lineColor={"var(--primary-color)"}
        lineBorderRadius={"10px"}
        label={<EmployeeCard employee={displayTree} />}
      >
        {rc &&
          displayTree.children &&
          displayTree.children.map((child) => (
            <React.Fragment key={child.idEmployee}>
              {renderTreeNodes(child)}
            </React.Fragment>
          ))}
      </Tree>
    );
  };

  // ─── RC Tree View ───

  // Convert hierarchy node to rc-tree data format
  const convertToRCTreeData = useCallback(
    (node) => {
      if (!node) return null;

      const hasChildren = node.children && node.children.length > 0;

      return {
        key: String(node.idEmployee),
        title: (
          <div className="rc-tree-node-content">
            <img
              src={getPhotoUrl(node.employeePhoto)}
              alt={node.fullName}
              className="rc-tree-node-photo"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = defaultAvatar;
              }}
            />
            <div className="rc-tree-node-info">
              <span className="rc-tree-node-name">{node.fullName}</span>
              <span className="rc-tree-node-designation">{node.designationName}</span>
            </div>
          </div>
        ),
        children: hasChildren
          ? node.children.map((child) => convertToRCTreeData(child)).filter(Boolean)
          : [],
        isLeaf: !hasChildren,
      };
    },
    [getPhotoUrl]
  );

  // Memoized rc-tree data from the filtered display tree
  const rcTreeData = useMemo(() => {
    const displayTree = getDisplayTree();
    if (!displayTree) return [];

    if (displayTree.isMultiRoot) {
      return displayTree.roots.map((root) => convertToRCTreeData(root)).filter(Boolean);
    }

    const converted = convertToRCTreeData(displayTree);
    return converted ? [converted] : [];
  }, [getDisplayTree, convertToRCTreeData]);

  // Collect all keys for expand/collapse all
  const allNodeKeys = useMemo(() => {
    const keys = [];
    const collectKeys = (nodes) => {
      if (!nodes) return;
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          keys.push(node.key);
          collectKeys(node.children);
        }
      });
    };
    collectKeys(rcTreeData);
    return keys;
  }, [rcTreeData]);

  const handleExpandAll = useCallback(() => {
    setExpandedKeys(allNodeKeys);
  }, [allNodeKeys]);

  const handleCollapseAll = useCallback(() => {
    setExpandedKeys([]);
  }, []);

  const handleExpand = useCallback((keys) => {
    setExpandedKeys(keys);
  }, []);

  // Custom switcher icon: + when collapsed, − when expanded
  const switcherIcon = useCallback((nodeProps) => {
    if (nodeProps.isLeaf) return <span style={{ display: "inline-block", width: 16 }} />;
    return (
      <span className="rc-tree-switcher-icon">
        {nodeProps.expanded ? "−" : "+"}
      </span>
    );
  }, []);

  const renderRCTree = () => {
    if (rcTreeData.length === 0) return null;

    return (
      <div className="rc-tree-container">
        <RCTree
          treeData={rcTreeData}
          expandedKeys={expandedKeys}
          onExpand={handleExpand}
          switcherIcon={switcherIcon}
          showLine={{ showLeafIcon: false }}
          showIcon={false}
          selectable={false}
        />
      </div>
    );
  };

  // ─── Render ───

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

  if (error) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="row">
          <div className="col-lg-12">
            <Card title="Organization Hierarchy">
              <div className="text-center py-5">
                <i className="bx bx-error-circle text-danger" style={{ fontSize: "3rem" }}></i>
                <p className="mt-2 text-danger">{error}</p>
                <button className="btn btn-primary mt-2" onClick={fetchHierarchyData}>
                  Retry
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h5 className="mb-0">Organization Hierarchy</h5>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                {viewMode === "tree" && (
                  <>
                    <div className="d-flex gap-1">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={handleExpandAll}
                      >
                        Expand All
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={handleCollapseAll}
                      >
                        Collapse All
                      </button>
                    </div>
                  </>
                )}
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
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    type="button"
                    className={`btn ${viewMode === "org" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setViewMode("org")}
                  >
                    Org Chart
                  </button>
                  <button
                    type="button"
                    className={`btn ${viewMode === "tree" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setViewMode("tree")}
                  >
                    Tree View
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              {viewMode === "org" ? (
                <div className="org-hierarchy-container">{renderOrgChart()}</div>
              ) : (
                renderRCTree()
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgHierarchy;
