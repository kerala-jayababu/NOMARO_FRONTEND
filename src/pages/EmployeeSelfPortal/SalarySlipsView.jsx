import React, { useEffect, useMemo, useState } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import CommonService from '../../core/services/CommonService';
import { Button, Form, Modal } from 'react-bootstrap';
import { toast } from "react-toastify";
import Utils from '../../utils/Utils';
import ViewPaySlipService from '../../core/services/ViewPaySlipService';
import MonthSelector from '../../components/monthSelector';
import secureLocalStorage from "react-secure-storage";

function SalarySlipsView() {
    const userData = JSON.parse(secureLocalStorage.getItem("user"));
    const [salarySlipData, setSalarySlipData] = useState({});
    const [salaryStructure, setSalaryStructure] = useState([]);
    const [startDate, setStartDate] = useState(new Date());
    const [salaryMonthsList, setSalaryMonthsList] = useState([]);
    const [totalValues, setTotalValues] = useState({});

    useEffect(() => {
        getSalaryMonths();
    }, [startDate]);

    const getSalaryDetails = () => {
        const date = moment(startDate).format("YYYY-MM");
        const monthId = salaryMonthsList.find(option => option.formattedDate == date).idSalaryMonth;
        let totals = {
            gyd: { earnings: 0, deductions: 0, net: 0 },
            usd: { earnings: 0, deductions: 0, net: 0 },
            ytd: { earnings: 0, deductions: 0, net: 0 }
        };
        ViewPaySlipService.getSalarySlipDetails(userData.idEmployee ?? 0, monthId).then(res => {
            setSalarySlipData(res.data.data[0]);
            if (res.data.data.length > 0) {
                res.data.data[0].employeeSalaryDetails.forEach(detail => {
                    if (detail.headType === 'EARNING') {
                        totals.gyd.earnings += detail.amountGYD;
                        totals.usd.earnings += detail.amountUSD;
                        totals.ytd.earnings += detail.ytdAmount;
                    } else if (detail.headType === 'DEDUCTION') {
                        totals.gyd.deductions += detail.amountGYD;
                        totals.usd.deductions += detail.amountUSD;
                        totals.ytd.deductions += detail.ytdAmount;
                    }
                });
                totals.gyd.net = totals.gyd.earnings - totals.gyd.deductions;
                totals.usd.net = totals.usd.earnings - totals.usd.deductions;
                totals.ytd.net = totals.ytd.earnings - totals.ytd.deductions;
                setTotalValues(totals);
            } else {
                setSalaryStructure({
                    earnings: [],
                    deductions: [],
                    totalEarnings: 0,
                    totalDeductions: 0,
                    netSalary: 0
                });
                setTotalValues({});
            }
            const earnings = res.data.data[0]?.employeeSalaryDetails.filter(el => el.headType == 'EARNING');
            const deductions = res.data.data[0]?.employeeSalaryDetails.filter(el => el.headType == 'DEDUCTION');
            setSalaryStructure({
                earnings: earnings ?? [],
                deductions: deductions ?? [],
                totalEarnings: res.data.data[0]?.totalEarnings ?? 0,
                totalDeductions: res.data.data[0]?.totalDeductions ?? 0,
                netSalary: res.data.data[0]?.netSalary ?? 0
            });
        }).catch(err => {
            setSalarySlipData({});
            setTotalValues({});
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
            getSalaryDetails();
        }).catch(err => {
        });
    };

    const downloadSalarySlips = () => {
        const date = moment(startDate).format("MMMM, YYYY");
        ViewPaySlipService.downloadSalarySlips(salarySlipData.idEmployeeSalary ?? 0).then(res => {
            if (!res.data.data || !(res.data.data instanceof Blob)) {
                throw new Error("Invalid file data received");
            }

            const blob = new Blob([res.data.data], { type: res.data.headers['content-type'] });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            const defaultName = `${salarySlipData.employeeCode}_${salarySlipData.employeeName}_${date}.pdf`;
            link.download = res.data.headers['content-disposition']
                ? res.headers['content-disposition'].split('filename=')[1].replace(/"/g, '')
                : defaultName;

            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);
        });
        
    }

    return (
        <>
            <div className="SalarySlipSection pb-0 ShowMobile">
                <div className="card">
                    <div className="card-header">
                        <h5 className="m-0">Salary Slip</h5>
                        <div className="list_menu">
                            <div className="list_searchbox">
                                <DatePicker className="form-control" dateFormat="MMMM YYYY" placeholderText={'Start Date'}
                                    selected={startDate} onChange={(date) => setStartDate(date)} showMonthYearPicker={true} />
                                {/* <MonthSelector months={salaryMonthsList} onSelection={(id)=> getSalaryDetails(id)} /> */}
                            </div>
                        </div>
                    </div>
                    <div className="card-body">
                        <div className='EMPDt_row'>
                            <div className="py-2 EMPDt_rowIn">
                                <label><b>EMP Code</b></label>
                                <p className='m-0'>{salarySlipData?.employeeCode}</p>
                            </div>
                            <div className="py-2 EMPDt_rowIn">
                                <label><b>EMP Name</b></label>
                                <p className='m-0'>{salarySlipData?.employeeName}</p>
                            </div>
                        </div>
                        <div className='EarningsBox'>
                            <h5 className='mb-2'>Earnings</h5>

                            {salaryStructure?.earnings?.length > 0 ? (
                                <>
                                    {salaryStructure?.earnings?.map((slip, index) => (
                                        <div className='EarningsBox_inner' key={index}>
                                            <h6 className='mb-2'>{slip?.salaryHeadName}</h6>
                                            <div className='EarningsBox_innerDt'>
                                                <div className='EarningsBox_innerDt_01'>
                                                    <label>Amount (G$)</label>
                                                    <p>{Utils.formattedNumber(slip?.amountGYD)}</p>
                                                </div>
                                                <div className='EarningsBox_innerDt_01'>
                                                    <label>Amount (US$)</label>
                                                    <p>{Utils.formattedNumber(slip?.amountUSD)}</p>
                                                </div>
                                                <div className='EarningsBox_innerDt_01'>
                                                    <label>YTD Amount (G$)</label>
                                                    <p>{Utils.formattedNumber(slip?.ytdAmount)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className='TotalEarningsBox_inner' >
                                        <h6 className='mb-2'>Total</h6>
                                        <div className='TotalEarningsBox_innerDt'>
                                            <div className='TotalEarningsBox_innerDt_01'>
                                                <label>Amount (G$)</label>
                                                <p>{Utils.formattedNumber(totalValues?.gyd?.earnings)}</p>
                                            </div>
                                            <div className='TotalEarningsBox_innerDt_01'>
                                                <label>Amount (US$)</label>
                                                <p>{Utils.formattedNumber(totalValues?.usd?.earnings)}</p>
                                            </div>
                                            <div className='TotalEarningsBox_innerDt_01'>
                                                <label>YTD Amount (G$)</label>
                                                <p>{Utils.formattedNumber(totalValues?.ytd?.earnings)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className='EarningsBox_inner'>
                                    <div className="Nodatafound_box text-center py-4">
                                        <h6 className='m-0'><i className="bx bx-search"></i> No data available!</h6>
                                    </div>
                                </div>
                            )}

                        </div>
                        <div className='DeductionsBx'>
                            <h5 className='mb-2'>Deductions</h5>

                            {salaryStructure?.deductions?.length > 0 ? (
                                <>
                                    {salaryStructure?.deductions?.map((slip, index) => (
                                        <div className='DeductionsBx_inner' key={index}>
                                            <h6 className='mb-2'>{slip?.salaryHeadName}</h6>
                                            <div className='DeductionsBx_innerDt'>
                                                <div className='DeductionsBx_innerDt_01'>
                                                    <label>Amounts(G$)</label>
                                                    <p>{Utils.formattedNumber(slip?.amountGYD)}</p>
                                                </div>
                                                <div className='DeductionsBx_innerDt_01'>
                                                    <label>Amounts(US$)</label>
                                                    <p>{Utils.formattedNumber(slip?.amountUSD)}</p>
                                                </div>
                                                <div className='DeductionsBx_innerDt_01'>
                                                    <label>YTDAmounts(G$)</label>
                                                    <p>{Utils.formattedNumber(slip?.ytdAmount)}</p>
                                                </div>
                                            </div>
                                        </div>

                                    ))}
                                    <div className='TotalDeductionsBox_inner' >
                                        <h6 className='mb-2'>Total</h6>
                                        <div className='TotalDeductionsBox_innerDt'>
                                            <div className='TotalDeductionsBox_innerDt_01'>
                                                <label>Amounts(G$)</label>
                                                <p>{Utils.formattedNumber(totalValues?.gyd?.deductions)}</p>
                                            </div>
                                            <div className='TotalDeductionsBox_innerDt_01'>
                                                <label>Amounts(US$)</label>
                                                <p>{Utils.formattedNumber(totalValues?.usd?.deductions)}</p>
                                            </div>
                                            <div className='TotalDeductionsBox_innerDt_01'>
                                                <label>YTDAmounts(G$)</label>
                                                <p>{Utils.formattedNumber(totalValues?.ytd?.deductions)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className='DeductionsBx_inner'>
                                    <div className="Nodatafound_box text-center py-4">
                                        <h6 className='m-0'><i className="bx bx-search"></i> No data available!</h6>
                                    </div>
                                </div>
                            )}

                        </div>




                    </div>
                </div>

                <div className='SSV_NetPaySection'>
                    <div>
                        <h5 className="fw-bold"> Net Pay G$ {Utils.formattedNumber(totalValues?.gyd?.net)}</h5>
                        <p>Payslip generated on : 01/01/2025</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => downloadSalarySlips()}>Download</button>
                </div>
            </div>


            <div className="container-xxl flex-grow-1 container-p-y SalarySlipSection ShowBigDevice">
                <div className="row">
                    <div className="col-lg-12 ">
                        <div className="card">
                            <div className="card-header  pb-3">
                                <h5 className="m-0">Salary Slip</h5>
                                <div className="list_menu">
                                    <div className="list_searchbox">
                                        <DatePicker className="form-control" dateFormat="MMMM YYYY" placeholderText={'Start Date'}
                                            selected={startDate} onChange={(date) => setStartDate(date)} showMonthYearPicker={true} />
                                    </div>
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="mb-3 row">
                                    <div className="col-md-3 ">
                                        <label><b>EMP Code</b></label>
                                        <p>{salarySlipData?.employeeCode}</p>
                                    </div>
                                    <div className="col-md-3 ">
                                        <label><b>EMP Name</b></label>
                                        <p>{salarySlipData?.employeeName}</p>
                                    </div>
                                    <div className="col-md-3 ">
                                        <label><b>Designation</b></label>
                                        <p>{salarySlipData?.designationName}</p>
                                    </div>
                                    <div className="col-md-3 ">
                                        <label><b>Department</b></label>
                                        <p>{salarySlipData?.departmentName}</p>
                                    </div>
                                </div>
                                <div className="mb-3 table-responsive text-nowrap">
                                    <table className="table border">
                                        <thead>
                                            <tr>
                                                <th>Earnings</th>
                                                <th className="text-end">Amounts(G$)</th>
                                                <th className="text-end">Amounts(US$)</th>
                                                <th className="text-end">YTDAmounts(G$)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {salaryStructure?.earnings?.length > 0 ? (
                                                <>
                                                    {salaryStructure?.earnings?.map((slip, index) => (
                                                        <tr key={index}>
                                                            <td>{slip?.salaryHeadName}</td>
                                                            <td className="text-end">{Utils.formattedNumber(slip?.amountGYD)}</td>
                                                            <td className="text-end">{Utils.formattedNumber(slip?.amountUSD)}</td>
                                                            <td className="text-end">{Utils.formattedNumber(slip?.ytdAmount)}</td>
                                                        </tr>
                                                    ))}
                                                    <tr>
                                                        <td><b>Total</b></td>
                                                        <td className="text-end fw-bold"> {Utils.formattedNumber(totalValues?.gyd?.earnings)}</td>
                                                        <td className="text-end fw-bold"> {Utils.formattedNumber(totalValues?.usd?.earnings)}</td>
                                                        <td className="text-end fw-bold"> {Utils.formattedNumber(totalValues?.ytd?.earnings)}</td>
                                                    </tr>
                                                </>
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" className="text-center">
                                                        <div className="Nodatafound_box">
                                                            <h6><i className="bx bx-search"></i> No data available!</h6>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="table-responsive text-nowrap">
                                    <table className="table border">
                                        <thead>
                                            <tr>
                                                <th>Deductions</th>
                                                <th className="text-end">Amounts(G$)</th>
                                                <th className="text-end">Amounts(US$)</th>
                                                <th className="text-end">YTDAmounts(G$)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {salaryStructure?.deductions?.length > 0 ? (
                                                <>
                                                    {salaryStructure?.deductions?.map((slip, index) => (
                                                        <tr key={index}>
                                                            <td>{slip?.salaryHeadName}</td>
                                                            <td className="text-end">{Utils.formattedNumber(slip?.amountGYD)}</td>
                                                            <td className="text-end">{Utils.formattedNumber(slip?.amountUSD)}</td>
                                                            <td className="text-end">{Utils.formattedNumber(slip?.ytdAmount)}</td>
                                                        </tr>
                                                    ))}
                                                    <tr>
                                                        <td><b>Total</b></td>
                                                        <td className="text-end fw-bold"> {Utils.formattedNumber(totalValues?.gyd?.deductions)}</td>
                                                        <td className="text-end fw-bold"> {Utils.formattedNumber(totalValues?.usd?.deductions)}</td>
                                                        <td className="text-end fw-bold"> {Utils.formattedNumber(totalValues?.ytd?.deductions)}</td>
                                                    </tr>
                                                </>
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" className="text-center">
                                                        <div className="Nodatafound_box">
                                                            <h6><i className="bx bx-search"></i> No data available!</h6>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="text-end fw-bold p-2 mt-2">
                                    <h5 className="fw-bold"> Net Pay G$ {Utils.formattedNumber(totalValues?.gyd?.net)}</h5>
                                </div>
                                <div className="Payslip_geneBox">
                                    <p>Payslip generated on : 01/01/2025</p>
                                    <button className="btn btn-primary" onClick={() => downloadSalarySlips()}>Download</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default SalarySlipsView