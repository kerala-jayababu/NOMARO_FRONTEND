import React, { useEffect, useMemo, useRef, useState } from 'react';
import moment from "moment";
import CommonService from '../../core/services/CommonService';
import { Button, Form, Modal } from 'react-bootstrap';
import { toast } from "react-toastify";
import Utils from '../../utils/Utils';
import Pagination from '../../components/pagination';
import { NumericFormat } from "react-number-format";
import LeavePassageService from '../../core/services/LeavePassageService';

function LeavePassageAmount() {

    const [leavePassages, setLeavePassages] = useState([]);
    const [financialYearsList, setFinancialYearsList] = useState([]);
    const [selFinancialYear, setSelFinancialYear] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;
    const totalPages = Math.ceil(leavePassages.length / rowsPerPage);

    useEffect(() => {
        getFinancialYears();
    }, []);

    useEffect(() => {
        if (selFinancialYear != null) {
            getLeavePassages();
        }
    }, [selFinancialYear]);

    const getFinancialYears = () => {
        CommonService.getAllFinancialYears().then(res => {
            setFinancialYearsList(res.data);
        }).catch(err => {
            setFinancialYearsList([])
        });
    }

    const getLeavePassages = () => {
        setCurrentPage(1);
        LeavePassageService.getLeavePassagesAmountsList(searchText, selFinancialYear).then(res => {
            setLeavePassages(res.data.data);
        }).catch(err => {
            setLeavePassages([]);
        });
    }

    const handlePageChange = (page) => setCurrentPage(page);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return leavePassages.slice(startIndex, endIndex);
    }, [leavePassages, currentPage, rowsPerPage]);

    const saveLeavePassageAmounts = (e) => {
        let passData = leavePassages;
        LeavePassageService.saveLeavePassagesAmounts(passData).then(res => {
            if (res.data.status === 200) {
                getLeavePassages();
            }
        }).catch(err => {
        });
    }

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            <div className="row">
                <div className="col-lg-12">
                    <div className="card">
                        <div className="card-header d-flex align-items-center justify-content-between pb-3">
                            <h5 className="m-0">Leave Passage Amounts</h5>

                            <div className="list_menu">
                                <div className="list_searchbox">
                                    <select className="form-select" value={selFinancialYear}
                                        onChange={(e) => setSelFinancialYear(e.target.value)} style={{ width: '250px' }}>
                                        <option value={''}>Select financial year</option>
                                        {financialYearsList.map(stat => (
                                            <option key={stat.idFinancialYear} value={stat.idFinancialYear}>
                                                {moment(stat.financialYearFrom).format("MM-DD-YYYY")} to {moment(stat.financialYearTo).format("MM-DD-YYYY")}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="list_searchbox">
                                    <input type="text" className="form-control" placeholder="Search" value={searchText} maxLength={30}
                                        onChange={(e) => {
                                            setSearchText(e.target.value);
                                            if (e.target.value === "") {
                                                getLeavePassages();
                                            }
                                        }}
                                        onKeyDown={e => e.key === 'Enter' ? getLeavePassages() : ''} />
                                    <i className="bx bx-search cursor" onClick={() => getLeavePassages()}></i>
                                </div>
                                <button className="btn btn-primary btn-sm px-4" onClick={() => saveLeavePassageAmounts()}>Submit</button>
                            </div>

                        </div>
                        <div className="card-body">
                            <div className="table-responsive text-nowrap">
                                <table className="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Emp. Code</th>
                                            <th>Employee Name</th>
                                            <th>Department</th>
                                            <th>Designation</th>
                                            <th>Joining Date</th>
                                            <th className="text-end">LP Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="table-border-bottom-0">
                                        {paginatedData?.length > 0 ? (
                                            paginatedData?.map((item, index) => (
                                                <tr>
                                                    <td>{item?.employeeCode}</td>
                                                    <td>{item?.employeeName}</td>
                                                    <td>{item?.departmentName}</td>
                                                    <td>{item?.designationName}</td>
                                                    <td>{moment(item?.joiningDate).format("MM/DD/YYYY")}</td>
                                                    <td className="text-end">
                                                        <NumericFormat
                                                            className="form-control-sm"
                                                            value={item?.leavePassageAmount}
                                                            onValueChange={(values) => {
                                                                const { value } = values;
                                                            }}
                                                            decimalScale={2} // Allow up to 2 decimal places
                                                            allowNegative={true} // Disallow negative numbers
                                                            thousandSeparator={true} // Disable thousand separators
                                                            allowLeadingZeros={false}
                                                            placeholder="Add amount"
                                                            maxLength={12}
                                                            required
                                                        />
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="text-center">
                                                    <div className="Nodatafound_box">
                                                        <h6><i className="bx bx-search"></i> No data available!</h6>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="text-end pt-2">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    )
}

export default LeavePassageAmount