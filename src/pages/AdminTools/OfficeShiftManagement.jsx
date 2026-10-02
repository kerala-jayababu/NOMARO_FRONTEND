import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ShiftSetupService from "../../core/services/ShiftSetupService";
import "./OfficeShiftManagement.css";

const buildOfficeTree = (offices) => {
  const officeById = new Map(
    offices.map((office) => [office.idOffice, { ...office, children: [] }]),
  );
  const roots = [];

  officeById.forEach((office) => {
    const parent = officeById.get(office.idParentOffice);
    if (parent) {
      parent.children.push(office);
    } else {
      roots.push(office);
    }
  });

  return roots;
};

const flattenOfficeTree = (offices, depth = 0) =>
  offices.flatMap((office) => [
    { ...office, hierarchyDepth: depth },
    ...flattenOfficeTree(office.children, depth + 1),
  ]);

const filterOfficeTree = (nodes, searchTerm) => {
  if (!searchTerm) return nodes;

  return nodes.reduce((matches, office) => {
    const children = filterOfficeTree(office.children, searchTerm);
    const officeMatches = office.officeName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    if (officeMatches || children.length > 0) {
      matches.push({ ...office, children });
    }

    return matches;
  }, []);
};

function OfficeShiftManagement() {
  const [offices, setOffices] = useState([]);
  const [tableOffices, setTableOffices] = useState([]);
  const [savedManagerSelections, setSavedManagerSelections] = useState({});
  const [managerSelections, setManagerSelections] = useState({});
  const [employeeOptionsByOffice, setEmployeeOptionsByOffice] = useState({});
  const [loadingEmployeeOfficeIds, setLoadingEmployeeOfficeIds] = useState(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [selectedOfficeId, setSelectedOfficeId] = useState(null);
  const [collapsedOfficeIds, setCollapsedOfficeIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFilteringOffices, setIsFilteringOffices] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadShiftSetup = async () => {
      setIsLoading(true);
      setLoadError("");

      const response = await ShiftSetupService.getShiftSetupDetails();
      if (!isMounted) return;

      if (response.error || !response.data?.success) {
        const message =
          response.error ||
          response.data?.message ||
          "Unable to load the office hierarchy.";
        setLoadError(message);
        toast.error(message);
        setOffices([]);
        setIsLoading(false);
        return;
      }

      const officeData = Array.isArray(response.data.data)
        ? response.data.data
        : [];
      const initialManagerSelections = Object.fromEntries(
        officeData.map((office) => [
          office.idOffice,
          office.shiftManager == null ? "" : String(office.shiftManager),
        ]),
      );
      setOffices(officeData);
      setTableOffices(officeData);
      setManagerSelections(initialManagerSelections);
      setSavedManagerSelections(initialManagerSelections);
      setEmployeeOptionsByOffice({});
      setSelectedOfficeId(null);
      setCollapsedOfficeIds(new Set());
      setIsLoading(false);
    };

    loadShiftSetup();

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const officeTree = buildOfficeTree(offices);
  const visibleTree = filterOfficeTree(officeTree, searchTerm.trim());
  const tableOfficeRows = flattenOfficeTree(buildOfficeTree(tableOffices));

  const toggleOffice = (officeId) => {
    setCollapsedOfficeIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextIds.has(officeId)) nextIds.delete(officeId);
      else nextIds.add(officeId);
      return nextIds;
    });
  };

  const handleOfficeSelect = async (officeId) => {
    setSelectedOfficeId(officeId);
    setIsFilteringOffices(true);

    const response = await ShiftSetupService.getShiftSetupHierarchyByOffice(officeId);
    if (response.error || !response.data?.success) {
      const message =
        response.error ||
        response.data?.message ||
        "Unable to load this office hierarchy.";
      toast.error(message);
      setIsFilteringOffices(false);
      return;
    }

    setTableOffices(Array.isArray(response.data.data) ? response.data.data : []);
    setIsFilteringOffices(false);
  };

  const loadEmployeesForOffice = async (officeId) => {
    if (employeeOptionsByOffice[officeId] || loadingEmployeeOfficeIds.has(officeId)) {
      return;
    }

    setLoadingEmployeeOfficeIds((currentIds) => new Set(currentIds).add(officeId));
    const response = await ShiftSetupService.getShiftManagerEmployees(officeId);
    setLoadingEmployeeOfficeIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.delete(officeId);
      return nextIds;
    });

    if (response.error || !response.data?.success) {
      toast.error(
        response.error || response.data?.message || "Unable to load office employees.",
      );
      return;
    }

    setEmployeeOptionsByOffice((currentOptions) => ({
      ...currentOptions,
      [officeId]: Array.isArray(response.data.data) ? response.data.data : [],
    }));
  };

  const handleManagerChange = (officeId, idEmployee) => {
    setManagerSelections((currentSelections) => ({
      ...currentSelections,
      [officeId]: idEmployee,
    }));
  };

  const hasUnsavedChanges = offices.some(
    (office) =>
      (managerSelections[office.idOffice] || "") !==
      (savedManagerSelections[office.idOffice] || ""),
  );

  const handleReset = () => {
    setSelectedOfficeId(null);
    setTableOffices(offices);
    setSearchTerm("");
    setManagerSelections(savedManagerSelections);
  };

  const handleSaveChanges = async () => {
    const assignments = offices
      .filter(
        (office) =>
          (managerSelections[office.idOffice] || "") !==
          (savedManagerSelections[office.idOffice] || ""),
      )
      .map((office) => ({
        idOffice: office.idOffice,
        idEmployee: managerSelections[office.idOffice]
          ? Number(managerSelections[office.idOffice])
          : null,
      }));

    if (assignments.length === 0) return;

    setIsSaving(true);
    const response = await ShiftSetupService.updateShiftManagerAssignments(assignments);
    setIsSaving(false);

    if (response.error || !response.data?.success) {
      toast.error(
        response.error || response.data?.message || "Unable to save shift managers.",
      );
      return;
    }

    const updateOfficeManagers = (officeList) =>
      officeList.map((office) => {
        const selectedEmployeeId = managerSelections[office.idOffice] || "";
        if (!assignments.some((assignment) => assignment.idOffice === office.idOffice)) {
          return office;
        }

        const selectedEmployee = (employeeOptionsByOffice[office.idOffice] || []).find(
          (employee) => String(employee.idEmployee) === selectedEmployeeId,
        );

        return {
          ...office,
          shiftManager: selectedEmployeeId ? Number(selectedEmployeeId) : null,
          shiftManagerName: selectedEmployee?.employeeName || null,
        };
      });

    setOffices(updateOfficeManagers);
    setTableOffices(updateOfficeManagers);
    setSavedManagerSelections(managerSelections);
    toast.success("Shift managers updated successfully.");
  };

  const renderOfficeNode = (office, depth = 0) => {
    const hasChildren = office.children.length > 0;
    const isCollapsed = collapsedOfficeIds.has(office.idOffice);
    const isSelected = selectedOfficeId === office.idOffice;

    return (
      <li className="office-tree-item" key={office.idOffice}>
        <div
          className={`office-tree-row${isSelected ? " is-selected" : ""}`}
          style={{ "--tree-depth": depth }}
        >
          {hasChildren ? (
            <button
              type="button"
              className="office-tree-toggle"
              aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${office.officeName}`}
              aria-expanded={!isCollapsed}
              onClick={() => toggleOffice(office.idOffice)}
            >
              <i className={`bx ${isCollapsed ? "bx-chevron-right" : "bx-chevron-down"}`} />
            </button>
          ) : (
            <span className="office-tree-spacer" />
          )}
          <button
            type="button"
            className="office-tree-select"
            aria-current={isSelected ? "location" : undefined}
            onClick={() => handleOfficeSelect(office.idOffice)}
          >
            <i className="bx bx-buildings" aria-hidden="true" />
            <span>{office.officeName}</span>
          </button>
        </div>
        {hasChildren && !isCollapsed && (
          <ul className="office-tree-children">
            {office.children.map((child) => renderOfficeNode(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <main className="office-shift-page">
      <header className="office-shift-header">
        <div>
          <h1>Shift Management</h1>
          <p>Configure the employee responsible for Shift Management at each office or sub office.</p>
        </div>
      </header>

      <div className="office-shift-layout">
        <aside className="office-hierarchy-panel" aria-label="Office hierarchy">
          <label className="office-search">
            <i className="bx bx-search" aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search offices"
              aria-label="Search offices"
            />
          </label>

          {isLoading ? (
            <div className="office-shift-state" role="status">Loading offices...</div>
          ) : loadError ? (
            <div className="office-shift-state office-shift-error">
              <p>{loadError}</p>
              <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
                Retry
              </button>
            </div>
          ) : visibleTree.length === 0 ? (
            <div className="office-shift-state">No offices found.</div>
          ) : (
            <ul className="office-tree-root" role="tree">
              {visibleTree.map((office) => renderOfficeNode(office))}
            </ul>
          )}
        </aside>

        <section className="office-shift-configuration" aria-labelledby="shift-config-title">
          <div className="office-shift-config-heading">
            <h2 id="shift-config-title">Shift Manager Configuration</h2>
            <div className="office-shift-rule" />
            <h3>Assign Shift Manager</h3>
          </div>

          <div className="office-shift-table-wrap">
            <table className="office-shift-table">
              <thead>
                <tr>
                  <th scope="col">Level</th>
                  <th scope="col">Office / Sub Office</th>
                  <th scope="col">Shift Manager</th>
                </tr>
              </thead>
              <tbody>
                {isLoading || isFilteringOffices ? (
                  <tr><td colSpan="3" className="office-shift-table-state">Loading offices...</td></tr>
                ) : loadError ? (
                  <tr><td colSpan="3" className="office-shift-table-state">Office hierarchy could not be loaded.</td></tr>
                ) : tableOffices.length === 0 ? (
                  <tr><td colSpan="3" className="office-shift-table-state">No offices available.</td></tr>
                ) : (
                  tableOfficeRows.map((office) => (
                    <tr
                      key={office.idOffice}
                    >
                      <td>{office.hierarchyDepth + 1}</td>
                      <td>
                        <span className="office-table-name" style={{ "--office-depth": office.hierarchyDepth }}>
                          {office.officeName}
                        </span>
                      </td>
                      <td>
                        <select
                          className="shift-manager-select"
                          value={managerSelections[office.idOffice] ?? ""}
                          onFocus={() => loadEmployeesForOffice(office.idOffice)}
                          onChange={(event) =>
                            handleManagerChange(office.idOffice, event.target.value)
                          }
                          aria-label={`Shift manager for ${office.officeName}`}
                        >
                          <option value="">
                            {loadingEmployeeOfficeIds.has(office.idOffice)
                              ? "Loading shift managers..."
                              : "Select Shift Manager"}
                          </option>
                          {office.shiftManager != null &&
                            !(employeeOptionsByOffice[office.idOffice] || []).some(
                              (employee) => employee.idEmployee === office.shiftManager,
                            ) && (
                            <option value={String(office.shiftManager)}>
                              {office.shiftManagerName || `Employee ${office.shiftManager}`}
                            </option>
                          )}
                          {(employeeOptionsByOffice[office.idOffice] || []).map(
                            (employee) => (
                              <option key={employee.idEmployee} value={employee.idEmployee}>
                                {employee.employeeName}
                              </option>
                            ),
                          )}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="office-shift-actions">
            <button
              type="button"
              className="btn btn-outline-secondary px-4 office-reset-button"
              disabled={isLoading || isFilteringOffices || isSaving}
              onClick={handleReset}
            >
              <i className="bx bx-reset" aria-hidden="true" /> Reset
            </button>
            <button
              type="button"
              className="btn btn-primary px-4 office-save-button"
              disabled={!hasUnsavedChanges || isSaving || isLoading}
              onClick={handleSaveChanges}
            >
              <i className="bx bx-save" aria-hidden="true" />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default OfficeShiftManagement;