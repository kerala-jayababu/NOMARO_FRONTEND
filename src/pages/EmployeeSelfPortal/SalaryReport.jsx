import React, { useEffect, useMemo, useState } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import CommonService from '../../core/services/CommonService';
import { Button, Form, Modal } from 'react-bootstrap';
import { toast } from "react-toastify";
import Utils from '../../utils/Utils';
import ViewPaySlipService from '../../core/services/ViewPaySlipService';
import secureLocalStorage from "react-secure-storage";

function SalaryReport() {

    const userData = JSON.parse(secureLocalStorage.getItem("user"));
    const [salaryReport, setSalaryReport] = useState({});
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [salaryMonthsList, setSalaryMonthsList] = useState([]);
    const [grossEarnings, setGrossEarnings] = useState(0);
    const [grossDeductions, setGrossDeductions] = useState(0);
    const [grossNetSalary, setGrossNetSalary] = useState(0);
    const [selectedRows, setSelectedRows] = useState([]);
    const [employeeSalaries, setEmployeeSalaries] = useState([]);
    const today = new Date();

    useEffect(() => {
        getSalaryMonths();
    }, [startDate, endDate]);

    const getSalaryReportData = () => {
        const start_date = moment(startDate).format("YYYY-MM");
        const end_date = moment(endDate).format("YYYY-MM");
        const start_id = salaryMonthsList.find(option => option.formattedDate == start_date).idSalaryMonth;
        const end_id = salaryMonthsList.find(option => option.formattedDate == end_date).idSalaryMonth;
        ViewPaySlipService.getSalaryReport(userData.idEmployee ?? 0, start_id, end_id).then(res => {
            if (res.data.data.length > 0) {
                setSalaryReport(res.data.data[0]);
                setEmployeeSalaries(res.data.data[0].employeeSalaries);
                const earnings = res.data.data[0].employeeSalaries.reduce(
                    (sum, salary) => sum + salary.totalEarnings,
                    0
                );
                setGrossEarnings(earnings);
                const deductions = res.data.data[0].employeeSalaries.reduce(
                    (sum, salary) => sum + salary.totalDeductions,
                    0
                );
                setGrossDeductions(deductions);
                const netSalary = earnings - deductions;
                setGrossNetSalary(netSalary);
            } else {
                setSalaryReport({});
                setGrossEarnings(0);
                setGrossDeductions(0);
                setGrossNetSalary(0);
            }

        }).catch(err => {
            setSalaryReport({});
        });
    }

    const getSalaryMonths = () => {
        CommonService.getAllSalaryMonths().then(res => {
            if (res.data.length > 0) {
                res.data.forEach(el => {
                    el['formattedDate'] = moment(el['salaryMonthDate']).format("YYYY-MM");
                });
            }
            setSalaryMonthsList(res.data);
            getSalaryReportData();
        }).catch(err => {
        });
    };

    const validPaySlips = employeeSalaries;

    const handleRowSelect = (idEmployeeSalary) => {
        if (selectedRows.includes(idEmployeeSalary)) {
            setSelectedRows(selectedRows.filter(code => code !== idEmployeeSalary));
        } else {
            setSelectedRows([...selectedRows, idEmployeeSalary]);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allEmployeeSalIds = validPaySlips.map(slip => slip.idEmployeeSalary);
            setSelectedRows(allEmployeeSalIds);
        } else {
            setSelectedRows([]);
        }
    };

    const isAllSelected = validPaySlips.length > 0 && selectedRows.length === validPaySlips.length;

    const downloadMultipleSalarySlips = () => {
        const ids = selectedRows;
        const result = ids.join(",");
        ViewPaySlipService.downloadSalarySlips(result).then(res => {
            if (!res.data.data || !(res.data.data instanceof Blob)) {
                throw new Error("Invalid file data received");
            }

            const blob = new Blob([res.data.data], { type: res.data.headers['content-type'] });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            const defaultName = `payslip_multiple.pdf`;
            link.download = res.data.headers['content-disposition']
                ? res.headers['content-disposition'].split('filename=')[1].replace(/"/g, '')
                : defaultName;

            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);
        }).catch(err => {

        });
    }

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            <div className="row">
                <div className="col-lg-12 ">
                    <div className="card">
                        <div className="card-header d-flex align-items-center justify-content-between pb-3">
                            <h5 className="m-0">Salary Report</h5>
                            <div className="list_menu">
                                <div className="list_searchbox">
                                    {/* <label>Salary Month From</label> */}
                                    <DatePicker className="form-control" dateFormat="MMMM YYYY" placeholderText={'Start Date'}
                                        selected={startDate} onChange={(date) => setStartDate(date)} showMonthYearPicker={true} />
                                </div>
                                <div className="list_searchbox">
                                    {/* <label>Salary Month To</label> */}
                                    <DatePicker className="form-control" dateFormat="MMMM YYYY" placeholderText={'End Date'} minDate={startDate}
                                        selected={endDate} onChange={(date) => setEndDate(date)} showMonthYearPicker={true} />
                                </div>

                            </div>
                        </div>
                        <div className="card-body">
                            <div className="mb-3 row">
                                <div className="col-md-3 ">
                                    <label><b>EMP Code</b></label>
                                    <p>{salaryReport?.employeeCode}</p>
                                </div>
                                <div className="col-md-3 ">
                                    <label><b>EMP Name</b></label>
                                    <p>{salaryReport?.employeeName}</p>
                                </div>
                                <div className="col-md-3 ">
                                    <label><b>Designation</b></label>
                                    <p>{salaryReport?.designationName}</p>
                                </div>
                                <div className="col-md-3 ">
                                    <label><b>Department</b></label>
                                    <p>{salaryReport?.departmentName}</p>
                                </div>
                            </div>
                            <div className="mb-3 table-responsive text-nowrap">
                                <table className="table border">
                                    <thead>
                                        <tr>
                                            <th>
                                                <input
                                                    type="checkbox"
                                                    checked={isAllSelected}
                                                    onChange={handleSelectAll}
                                                    disabled={validPaySlips.length === 0}
                                                />
                                            </th>
                                            <th>Month</th>
                                            <th className="text-end">Total Earnings</th>
                                            <th className="text-end">Total Deductions</th>
                                            <th className="text-end">Net Salary</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {salaryReport?.employeeSalaries?.length > 0 ? (
                                            <>
                                                {salaryReport?.employeeSalaries?.map((sal, index) => (
                                                    <tr key={index}>
                                                        <td>
                                                            {sal.idEmployeeSalary ? (
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedRows.includes(sal.idEmployeeSalary)}
                                                                    onChange={() => handleRowSelect(sal.idEmployeeSalary)}
                                                                />
                                                            ) : (
                                                                <input type="checkbox" disabled />
                                                            )}
                                                        </td>
                                                        <td>{sal?.salaryMonthName}</td>
                                                        <td className="text-end">{Utils.formattedNumber(sal?.totalEarnings)}</td>
                                                        <td className="text-end">{Utils.formattedNumber(sal?.totalDeductions)}</td>
                                                        <td className="text-end">{Utils.formattedNumber(sal?.totalEarnings - sal?.totalDeductions)}</td>
                                                    </tr>
                                                ))}
                                            </>
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="text-center">
                                                    <div className="Nodatafound_box">
                                                        <h6><i className="bx bx-search"></i> No data available!</h6>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="row m-0">
                                <div className="col-lg-6">
                                    <table className="table border">
                                        <thead>
                                            <tr>
                                                <th colspan="2">For the period {moment(startDate).format("MMMM YYYY")} to {moment(endDate).format("MMMM YYYY")} </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>Total Earnings G$</td>
                                                <td className="text-end">{Utils.formattedNumber(grossEarnings)}</td>
                                            </tr>
                                            <tr>
                                                <td>Total Deductions G$</td>
                                                <td className="text-end">{Utils.formattedNumber(grossDeductions)}</td>
                                            </tr>
                                            <tr>
                                                <td>Net Salary G$</td>
                                                <td className="text-end">{Utils.formattedNumber(grossNetSalary)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="text-center py-2">
                                <button className="btn btn-primary btn-sm px-4"
                                    disabled={selectedRows.length === 0} onClick={() => downloadMultipleSalarySlips()}>
                                    Download selected
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SalaryReport