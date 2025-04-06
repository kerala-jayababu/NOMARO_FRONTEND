import React, { useEffect, useMemo, useState } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import CommonService from '../../core/services/CommonService';
import { Button, Form, Modal } from 'react-bootstrap';
import { toast } from "react-toastify";
import Utils from '../../utils/Utils';

function SalaryReport() {

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            <div className="row">
                <div className="col-lg-12 ">
                    <div className="card">
                        <div className="card-header d-flex align-items-center justify-content-between pb-3">
                            <h5 className="m-0">Salary Report</h5>
                            <div className="FilterSalary02">
                                <span>From </span>
                                <input type="month" className="form-control w-auto" id="month" name="month" />
                                <span>To</span>
                                <input type="month" className="form-control w-auto" id="month" name="month" />
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="mb-3 table-responsive text-nowrap">
                                <table className="table border">
                                    <thead>
                                        <tr>
                                            <th>Month</th>
                                            <th className="text-end">Total Earnings</th>
                                            <th className="text-end">Total Deductions</th>
                                            <th className="text-end">Net Salary</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Feb 2025</td>
                                            <td className="text-end">100,000.00</td>
                                            <td className="text-end">25,000.00</td>
                                            <td className="text-end">75,000.00</td>
                                        </tr>
                                        <tr>
                                            <td>Jan 2025</td>
                                            <td className="text-end">100,000.00</td>
                                            <td className="text-end">25,000.00</td>
                                            <td className="text-end">80,000.00</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="row m-0">
                                <div className="col-lg-6">
                                    <table className="table border">
                                        <thead>
                                            <tr>
                                                <th colspan="2">For the period Jan 2025 to Feb 2025 </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>Total Earnings G$</td>
                                                <td className="text-end">200,000.00</td>
                                            </tr>
                                            <tr>
                                                <td>Total Deductions G$</td>
                                                <td className="text-end">45,000.00</td>
                                            </tr>
                                            <tr>
                                                <td>Net Salary G$</td>
                                                <td className="text-end">155,000.00</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SalaryReport