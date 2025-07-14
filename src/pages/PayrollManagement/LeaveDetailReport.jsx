import { useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import DatePicker from "react-datepicker";
import LeaveReportService from "../../core/services/LeaveReportService";
import secureLocalStorage from 'react-secure-storage';

function LeaveDetailReport() {

  const userData = JSON.parse(secureLocalStorage.getItem("user") || "{}");
  const todayMoment = moment();
  const today = todayMoment.toDate();
  const schoolYearStart = todayMoment.month() >= 6
    ? moment(`${todayMoment.year()}-07-01`)
    : moment(`${todayMoment.year() - 1}-07-01`);
  const [startDate, setStartDate] = useState(schoolYearStart.toDate());
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [leaveReports, setLeaveReports] = useState([]);
  const [totalLeaves, setTotalLeaves] = useState(0);

  useEffect(() => {
    getEmployeeLeaveReport();
  }, []);

  useEffect(() => {
    getEmployeeLeaveReport();
  }, [startDate, endDate]);

  const getEmployeeLeaveReport = () => {
    setLoading(true);
    LeaveReportService.getEmployeeLeaveReport(userData.idEmployee ?? 0, moment(startDate).format("YYYY-MM-DD"), moment(endDate).format("YYYY-MM-DD"))
    .then((res) => {
      const data = res.data.data || [];
      setLeaveReports(data);
      const total = data.reduce((sum, report) => sum + report.noDays, 0);
      setTotalLeaves(total);
    }).finally(()=> setLoading(false));
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {loading && (
        <div style={{position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
            backgroundColor: "rgba(255, 255, 255, 0.7)", zIndex: 9999, display: "flex", alignItems: "center",
            justifyContent: "center",
            }}>
            <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
            </div>
        </div>
      )}
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">Leave Report</h5>
              <div className="list_menu">
                <div><label>From</label></div>
                <div className="list_searchbox">
                  <DatePicker className="form-control" dateFormat="MM/dd/yyyy" placeholderText={"From Date"}
                    selected={startDate} onChange={(date) => setStartDate(date)} showMonthDropdown 
                    showYearDropdown dropdownMode="select" maxDate={today} shouldCloseOnSelect
                  />
                </div>
                <div><label>To</label></div>
                <div className="list_searchbox">
                  <DatePicker className="form-control" dateFormat="MM/dd/yyyy" placeholderText={"To Date"}
                    selected={endDate} onChange={(date) => setEndDate(date)} showMonthDropdown minDate={startDate}
                    maxDate={today} showYearDropdown dropdownMode="select" shouldCloseOnSelect
                  />
                </div>
              </div>
            </div>

            <div className="card-body">
              <div className="table-responsive text-nowrap" style={{ maxHeight: "440px", overflow: "auto" }}>
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Leave From</th>
                      <th>Leave To</th>
                      <th>Leave Type</th>
                      <th>No: of Days</th>
                    </tr>
                  </thead>
                  <tbody className="table-border-bottom-0">
                    {leaveReports.length > 0 ? (
                      <>
                        {leaveReports.map((report) => (
                          <tr key={report.idEmployeeLeave}>
                            <td>{moment(report.leaveFromDate).format("MM/DD/YYYY")}</td>
                            <td>{moment(report.leaveToDate).format("MM/DD/YYYY")}</td>
                            <td>{report.leaveTypeName}</td>
                            <td>{report.noDays}</td>
                          </tr>
                        ))}
                        <tr className="table-info text-center">
                          <td colSpan={4} className="fw-bold"  >Total {totalLeaves} Days</td>
                        </tr>
                      </>
                      ) : (
                        <tr>
                          <td colSpan={4} className="text-center">
                            <div className="Nodatafound_box p-2">
                              <h6 className='m-0'>
                                No data available!
                              </h6>
                            </div>
                          </td>
                        </tr>
                      )
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

}

export default LeaveDetailReport;
