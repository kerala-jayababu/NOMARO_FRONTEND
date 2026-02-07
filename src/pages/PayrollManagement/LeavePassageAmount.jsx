import React, { useEffect, useMemo, useRef, useState } from 'react';
import moment from "moment";
import CommonService from '../../core/services/CommonService';
import { Button, Form, Modal } from 'react-bootstrap';
import { toast } from "react-toastify";
import Utils from '../../utils/Utils';
import Pagination from '../../components/pagination';
import { NumericFormat } from "react-number-format";
import LeavePassageService from '../../core/services/LeavePassageService';
import { useLoader } from '../../components/LoaderContext';

function LeavePassageAmount() {
    const [leavePassages, setLeavePassages] = useState([]);
    const [originalLeavePassages, setOriginalLeavePassages] = useState([]);
    const [workYearsList, setWorkYearsList] = useState([]);
    const [selFinancialYear, setSelFinancialYear] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isDataChanged, setIsDataChanged] = useState(false);
    const rowsPerPage = 10;
    const totalPages = Math.ceil(leavePassages.length / rowsPerPage);
    const { showLoader, hideLoader } = useLoader();

    useEffect(() => {
        getWorkYears();
    }, []);

    useEffect(() => {
        if (selFinancialYear != null) {
            setLeavePassages([]);
            getLeavePassages();
        }
    }, [selFinancialYear]);

    const getWorkYears = async () => {
        const result = await CommonService.getAllWorkYears();
        if (!result.error && result.data) {
            // Filter to show: 1 past year + current year + 2 future years
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth();
            
            // Determine financial year (assuming April-March or similar)
            let financialYear = currentYear;
            if (currentMonth < 3) { // January to March
                financialYear = currentYear - 1;
            }
            
            // Filter to show years from (financialYear - 1) to (financialYear + 2)
            const filteredYears = result.data.filter(year => {
                const yearStart = parseInt(year.displayText.split('-')[0]);
                return yearStart >= (financialYear - 1) && yearStart <= (financialYear + 2);
            });
            
            setWorkYearsList(filteredYears);
            // Set default to current year if available
            if (filteredYears.length > 0 && !selFinancialYear) {
                setSelFinancialYear(filteredYears[0].idWorkYear);
            }
        } else {
            setWorkYearsList([]);
        }
    }

    const getLeavePassages = () => {
        setCurrentPage(1);
        showLoader();
        setOriginalLeavePassages([]);
        LeavePassageService.getLeavePassagesAmountsList(searchText, selFinancialYear).then(res => {
            hideLoader();
            setLeavePassages(res.data.data);
            setOriginalLeavePassages(JSON.parse(JSON.stringify(res.data.data)));
            setIsDataChanged(false);
        }).catch(err => {
            hideLoader();
            setLeavePassages([]);
            setOriginalLeavePassages([]);
        });
    }

    const handlePageChange = (page) => setCurrentPage(page);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return leavePassages.slice(startIndex, endIndex);
    }, [leavePassages, currentPage, rowsPerPage]);

    const handleAmountChange = (index, value) => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const actualIndex = startIndex + index;
        const updatedLeavePassages = [...leavePassages];
        updatedLeavePassages[actualIndex].leavePassageAmount = value;
        setLeavePassages(updatedLeavePassages);

        const hasChanges = updatedLeavePassages.some((item, i) => {
            const originalItem = originalLeavePassages[i];
            const currentVal = String(item.leavePassageAmount || '');
            const originalVal = String(originalItem?.leavePassageAmount || '');
            return currentVal !== originalVal;
        });
        setIsDataChanged(hasChanges);
    }

    const saveLeavePassageAmounts = () => {
        const payload = leavePassages
            .filter((item) => {
                const originalItem = originalLeavePassages.find(orig => orig.idEmployee === item.idEmployee);
                if (!originalItem) return false;

                const currentVal = String(item.leavePassageAmount || '');
                const originalVal = String(originalItem.leavePassageAmount || '');

                return currentVal !== originalVal;
            })
            .map(item => ({
                idLeavePassageAmount: item.idLeavePassageAmount || 0,
                idEmployee: item.idEmployee,
                amount: item.leavePassageAmount === '' ? null : (item.leavePassageAmount ? parseFloat(item.leavePassageAmount) : 0),
                idFinancialYear: parseInt(selFinancialYear)
            }));

        if (payload.length === 0) {
            toast.info("No changes to save");
            return;
        }

        LeavePassageService.saveLeavePassagesAmounts(payload).then(res => {
            console.log(res)
            if (res.data.success) {
                getLeavePassages();
            }
        }).catch(err => {
        });
    }

    const resetChanges = () => {
        setLeavePassages(JSON.parse(JSON.stringify(originalLeavePassages)));
        setIsDataChanged(false);
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
                                    <select
                                        className="form-select"
                                        value={selFinancialYear || ''}
                                        onChange={(e) => setSelFinancialYear(e.target.value ? parseInt(e.target.value) : null)}
                                        style={{ width: '250px' }}
                                    >
                                        <option value={''}>Select financial year</option>
                                        {workYearsList.map(year => (
                                            <option key={year.idWorkYear} value={year.idWorkYear}>
                                                {year.displayText}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="list_searchbox">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search"
                                        value={searchText}
                                        maxLength={30}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' ? getLeavePassages() : ''}
                                    />
                                    <i className="bx bx-search cursor" onClick={() => getLeavePassages()}></i>
                                </div>
                                <div className="d-flex gap-2">
                                    <button
                                        className="btn btn-outline-secondary btn-sm px-3"
                                        onClick={resetChanges}
                                        disabled={!isDataChanged}
                                    >
                                        Reset
                                    </button>
                                    <button
                                        className="btn btn-primary btn-sm px-4"
                                        onClick={saveLeavePassageAmounts}
                                        disabled={!isDataChanged}
                                    >
                                        Submit
                                    </button>
                                </div>
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
                                                <tr key={index}>
                                                    <td>{item?.employeeCode}</td>
                                                    <td>{item?.employeeName}</td>
                                                    <td>{item?.departmentName}</td>
                                                    <td>{item?.designationName}</td>
                                                    <td>{item?.joiningDate ? moment(item.joiningDate).format("MM/DD/YYYY") : 'N/A'}</td>
                                                    <td className="text-end">
                                                        <NumericFormat
                                                            key={`${item.idEmployee}-${index}`}
                                                            className="form-control-sm text-end"
                                                            value={item?.leavePassageAmount || ''}
                                                            onValueChange={(values) => {
                                                                const { value } = values;
                                                                handleAmountChange(index, value);
                                                            }}
                                                            decimalScale={2}
                                                            allowNegative={false}
                                                            thousandSeparator={true}
                                                            allowLeadingZeros={false}
                                                            placeholder="Add amount"
                                                            maxLength={12}
                                                            style={{ width: '120px' }}
                                                        />
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="text-center">
                                                    <div className="Nodatafound_box">
                                                        <h6><i className="bx bx-search"></i> No data available!</h6>
                                                        {/* {selFinancialYear && (
                                                            <p className="text-muted small mt-1">
                                                                Try a different search term or financial year
                                                            </p>
                                                        )} */}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {leavePassages.length > 0 && (
                                <div className="text-end pt-2">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={handlePageChange}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LeavePassageAmount;