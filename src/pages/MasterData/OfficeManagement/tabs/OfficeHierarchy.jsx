import React, { useCallback, useEffect, useMemo, useState } from "react";
import RCTree from "rc-tree";
import "rc-tree/assets/index.css";
import "../../OrgHierarchy.css";
import "./OfficeHierarchy.css";

function OfficeHierarchy({ offices, onViewOffice }) {
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [showInactive, setShowInactive] = useState(true);

  const visibleOffices = useMemo(
    () => (showInactive ? offices : offices.filter((o) => o.isActive)),
    [offices, showInactive]
  );

  // Build the tree from IdParentOffice. Offices whose parent is not in the list are shown as roots.
  const rcTreeData = useMemo(() => {
    const idSet = new Set(visibleOffices.map((o) => o.idOffice));
    const childrenMap = new Map();
    visibleOffices.forEach((o) => {
      const parentKey = o.idParentOffice && idSet.has(o.idParentOffice) ? o.idParentOffice : 0;
      if (!childrenMap.has(parentKey)) childrenMap.set(parentKey, []);
      childrenMap.get(parentKey).push(o);
    });

    const sortOffices = (list) =>
      list
        .slice()
        .sort((a, b) => (a.hierarchyLevel ?? 0) - (b.hierarchyLevel ?? 0) || a.officeName.localeCompare(b.officeName));

    const buildNodes = (parentKey) =>
      sortOffices(childrenMap.get(parentKey) || []).map((office) => {
        const children = buildNodes(office.idOffice);
        return {
          key: String(office.idOffice),
          title: (
            <div className="rc-tree-node-content">
              <div className="rc-tree-node-info">
                <span className="rc-tree-node-name">
                  {office.officeCode} - {office.officeName}
                  {!office.isActive && <span className="badge bg-label-warning ms-2">Inactive</span>}
                </span>
                <span className="rc-tree-node-designation">
                  {office.officeTypeName}
                  {office.city ? ` · ${office.city}` : ""}
                  {office.officeHeadName ? ` · Head: ${office.officeHeadName}` : ""}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-icon btn-outline-secondary border-0 ms-2"
                title="View"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewOffice(office.idOffice);
                }}
              >
                <span className="bx bx-show"></span>
              </button>
            </div>
          ),
          children,
          isLeaf: children.length === 0,
        };
      });

    return buildNodes(0);
  }, [visibleOffices, onViewOffice]);

  const allNodeKeys = useMemo(() => {
    const keys = [];
    const collectKeys = (nodes) => {
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

  // Expand everything on first load
  useEffect(() => {
    setExpandedKeys(allNodeKeys);
  }, [allNodeKeys]);

  const switcherIcon = useCallback((nodeProps) => {
    if (nodeProps.isLeaf) return <span style={{ display: "inline-block", width: 16 }} />;
    return <span className="rc-tree-switcher-icon">{nodeProps.expanded ? "−" : "+"}</span>;
  }, []);

  return (
    <div className="card">
      <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2 pb-3">
        <h5 className="m-0">Office Hierarchy</h5>
        <div className="list_menu">
          <div className="form-check form-switch m-0">
            <input
              className="form-check-input"
              type="checkbox"
              id="showInactiveOffices"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="showInactiveOffices">
              Show inactive offices
            </label>
          </div>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setExpandedKeys(allNodeKeys)}>
            Expand All
          </button>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setExpandedKeys([])}>
            Collapse All
          </button>
        </div>
      </div>
      <div className="card-body">
        {rcTreeData.length === 0 ? (
          <div className="text-center py-5">
            <i className="bx bx-sitemap text-muted" style={{ fontSize: "3rem" }}></i>
            <p className="mt-2 text-muted">No offices available</p>
          </div>
        ) : (
          <div className="rc-tree-container office-hierarchy">
            <RCTree
              treeData={rcTreeData}
              expandedKeys={expandedKeys}
              onExpand={(keys) => setExpandedKeys(keys)}
              switcherIcon={switcherIcon}
              showLine={{ showLeafIcon: false }}
              showIcon={false}
              selectable={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default OfficeHierarchy;
