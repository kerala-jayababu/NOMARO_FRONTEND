import React, { useEffect, useMemo, useState } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import CommonService from '../../core/services/CommonService';
import { Button, Form, Modal } from 'react-bootstrap';
import { toast } from "react-toastify";
import Utils from '../../utils/Utils';

function SalarySlipsView() {

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            <div className="row">
                <div className="col-lg-12 ">
                    <div className="card">
                        <div className="card-header d-flex align-items-center justify-content-between pb-3">
                            <h5 className="m-0">Payslipts</h5>
                            <input type="month" className="form-control w-auto" id="month" name="month" />
                        </div>
                        <div className="card-body">
                            <div className="mb-3 row">
                                <div className="col-md-3 ">
                                    <label>EMP Code</label>
                                    <p>SFB0004578</p>
                                </div>
                                <div className="col-md-3 ">
                                    <label>EMP Name</label>
                                    <p>Jhone Doe Thomas Charlie </p>
                                </div>
                                <div className="col-md-3 ">
                                    <label>Designation</label>
                                    <p>Software Engineer</p>
                                </div>
                                <div className="col-md-3 ">
                                    <label>Department</label>
                                    <p>IT</p>
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
                                        <tr>
                                            <td>Basic Pay</td>
                                            <td className="text-end">1,50,000.00</td>
                                            <td className="text-end">750.00</td>
                                            <td className="text-end">18,00,000.00</td>
                                        </tr>
                                        <tr>
                                            <td>Telephone Allowances</td>
                                            <td className="text-end">5,000.00</td>
                                            <td className="text-end">25.00</td>
                                            <td className="text-end">60,000.00</td>
                                        </tr>
                                        <tr>
                                            <td>Medical & Life Insurance</td>
                                            <td className="text-end">10,000.00</td>
                                            <td className="text-end">50.00</td>
                                            <td className="text-end">1,20,000.00</td>
                                        </tr>
                                        <tr>
                                            <td>Medical & Life Insurance1</td>
                                            <td className="text-end">10,000.00</td>
                                            <td className="text-end">50.00</td>
                                            <td className="text-end">1,20,000.00</td>
                                        </tr>
                                        <tr>
                                            <td>Medical & Life Insurance2</td>
                                            <td className="text-end">10,000.00</td>
                                            <td className="text-end">50.00</td>
                                            <td className="text-end">1,20,000.00</td>
                                        </tr>

                                        <tr>
                                            <td><b>Total</b></td>
                                            <td className="text-end fw-bold"> 1,85,000.00</td>
                                            <td className="text-end fw-bold"> 925.00</td>
                                            <td className="text-end fw-bold"> 22,20,000.00</td>
                                        </tr>
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
                                        <tr>
                                            <td>Pension</td>
                                            <td className="text-end">5,000.00</td>
                                            <td className="text-end">25.00</td>
                                            <td className="text-end">60,000.00</td>
                                        </tr>
                                        <tr>
                                            <td>NIS</td>
                                            <td className="text-end">2,000.00</td>
                                            <td className="text-end">10.00</td>
                                            <td className="text-end">24,000.00</td>
                                        </tr>
                                        <tr>
                                            <td>Payee</td>
                                            <td className="text-end">10,000.00</td>
                                            <td className="text-end">50.00</td>
                                            <td className="text-end">1,20,000.00</td>
                                        </tr>
                                        <tr>
                                            <td className="fw-bold">Total</td>
                                            <td className="text-end fw-bold">17,000.00</td>
                                            <td className="text-end fw-bold">85.00</td>
                                            <td className="text-end fw-bold">2,04,000.00</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="text-end fw-bold p-2 mt-2">
                                <h5 className="fw-bold"> Net Pay G$ 1,68,000.00</h5>
                            </div>
                            <div className="Payslip_geneBox">
                                <p>Payslip generated on : 01/01/2025</p>
                                <button className="btn btn-primary">Download</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SalarySlipsView