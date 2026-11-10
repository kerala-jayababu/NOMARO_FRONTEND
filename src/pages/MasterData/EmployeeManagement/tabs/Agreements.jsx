import { useContext } from "react";
import { EmployeeContext } from "../EmployeeManagement";
import EmployeeAgreements from "../../employeeAgreements";

// Employee Management -> Agreements tab: the same screen as Employee Agreements, for the employee being edited
const Agreements = () => {
  const { employeeId } = useContext(EmployeeContext) || {};
  if (!employeeId) return <div className="p-3 text-muted">{"Save the employee's basic details first."}</div>;
  return <EmployeeAgreements embeddedEmployeeId={Number(employeeId)} />;
};

export default Agreements;
