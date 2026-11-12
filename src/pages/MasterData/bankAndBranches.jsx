import React, { useEffect, useRef, useState } from 'react'
import moment from 'moment';
import DatePicker from 'react-datepicker';
import { NumericFormat } from 'react-number-format';
import BankAndBranchService from '../../core/services/BankAndBranchService';
import { Form } from 'react-bootstrap';
import useScreenFields from '../../utils/useScreenFields';

const BANK_BRANCHES_SCREEN_CODE = 'BNKBNC';

function BankAndBranches() {
    const [banks, setBanks] = useState([]);
    const [branches, setBranches] = useState([]);
    const field = useScreenFields(BANK_BRANCHES_SCREEN_CODE);
    const branchNameField = field('BranchName', 'Branch Name', 50);
    const bankAddressField = field('BankAddress', 'Bank Address', 100);
    const phoneNumberField = field('PhoneNumber', 'Phone Number', 20);
    const ifscField = field('IFSCCode', 'IFSC Code', 25);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [choosedBankId, setChoosedBankId] = useState(0);
    const [validated, setValidated] = useState(false);
    useEffect(() => {
        getBanks();
    }, []);

    const getBanks = async () => {
        setLoading(true);
        BankAndBranchService.getAllBanks()
            .then(res => {
                setBanks(res.data.data);
                setLoading(false);
            })
            .catch(err => {
                setError('Failed to load banks and branches');
                setLoading(false);
            });
    };



    const getBranches = async (idBank) => {
        setBranches([]);
        setChoosedBankId(idBank);
        if (idBank == '') {
            // setBranches([]);
            return;
        }
        setLoading(true);
        BankAndBranchService.getBranches(idBank)
            .then(res => {
                if (res.data.data.length == 0) {
                    setBranches([
                        {
                            idBankBranches: 0,
                            idBank: idBank,
                            branchName: '',
                            bankAddress: '',
                            phoneNumber: '',
                            abaRoutingNumber: '',
                            isNew: true,
                        },
                    ]);
                } else {
                    setBranches(res.data.data);
                }

            })
            .catch(err => {
                // console.log('err',err);
                setError('Failed to load branches');
                setLoading(false);
                // toast.error('Something went wrong!', {
                //     position: 'top-right',
                //     autoClose: 2000
                // });
            });
    }

    const handleInputChange = (id, field, value) => {
        const updatedBranches = branches.map((branch) =>
            branch.idBankBranches === id ? { ...branch, [field]: value } : branch
        );
        setBranches(updatedBranches);
    };

    const handleAddRow = () => {
        setBranches([
            ...branches,
            {
                idBankBranches: branches.length + 1,
                idBank: choosedBankId,
                branchName: '',
                bankAddress: '',
                phoneNumber: '',
                abaRoutingNumber: '',
                isNew: true
            },
        ]);
    };

    const handleDeleteRow = (id) => {
        setBranches(branches.filter((branch) => branch.idBankBranches !== id));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('branches', branches);
        const hasEmptyBranchName = branchNameField.visible && branches.some(branch => !branch.branchName);
        if (hasEmptyBranchName) {
            setValidated(true);
            return;
        }
        let passData = branches.map((branch) =>
            branch.isNew ? { ...branch, idBankBranches: 0 } : branch
        );
        BankAndBranchService.saveBankAndBranch(passData).then(res => {
            getBranches(choosedBankId);
        }).catch(err => {
            console.log(err);
            // toast.error('Something went wrong');
        });

    };

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            <div className="row">
                <div className="col-lg-12 ">
                    <div className="card">
                        <div className="card-header d-flex align-items-center justify-content-between pb-3">
                            <h5 className="m-0">Bank Branches</h5>
                            <div className="list_menu">
                                <div>
                                    {/* <label className='p-2'>Select Bank</label> */}
                                    <select className="form-select" name="idBank" onChange={(e) => getBranches(e.target.value)}>
                                        <option value="">Select Bank</option>
                                        {banks.map(bank => (
                                            <option key={bank.idBank} value={bank.idBank}>{bank.bankName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>


                        </div>
                        <div className="card-body">
                            <div className="custom-table-wrapper">
                                <Form noValidate validated={validated}>
                                    <table className="table table-sm">
                                        <thead>
                                            <tr>
                                                {branchNameField.visible && <th>{branchNameField.label}</th>}
                                                {bankAddressField.visible && <th>{bankAddressField.label}</th>}
                                                {phoneNumberField.visible && <th>{phoneNumberField.label}</th>}
                                                {ifscField.visible && <th className='w-25'>{ifscField.label}</th>}
                                                <th className='w-auto'></th>
                                            </tr>
                                        </thead>
                                        <tbody className="table-border-bottom-0">
                                            {branches && branches.map((data, index) => (
                                                <tr key={data.idBankBranches}>
                                                    {branchNameField.visible && <td>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            maxLength={branchNameField.maxLength}
                                                            value={data.branchName}
                                                            required
                                                            onChange={(e) => handleInputChange(data.idBankBranches, 'branchName', e.target.value)}
                                                        />
                                                    </td>}
                                                    {bankAddressField.visible && <td>
                                                        <input
                                                            type="text"
                                                            maxLength={bankAddressField.maxLength}
                                                            className="form-control"
                                                            value={data.bankAddress}
                                                            onChange={(e) => handleInputChange(data.idBankBranches, 'bankAddress', e.target.value)}
                                                        />
                                                    </td>}
                                                    {phoneNumberField.visible && <td>
                                                        <input
                                                            type="number"
                                                            maxLength={phoneNumberField.maxLength}
                                                            className="form-control"
                                                            value={data.phoneNumber}
                                                            onChange={(e) => {
                                                                const newValue = e.target.value;
                                                                if (newValue.length <= phoneNumberField.maxLength) {
                                                                    handleInputChange(data.idBankBranches, 'phoneNumber', newValue);
                                                                }
                                                            }}
                                                        />
                                                    </td>}
                                                    {ifscField.visible && (
                                                        <td>
                                                            <input
                                                                type="text"
                                                                maxLength={ifscField.maxLength}
                                                                className="form-control"
                                                                value={data.abaRoutingNumber}
                                                                onChange={(e) => handleInputChange(data.idBankBranches, 'abaRoutingNumber', e.target.value)}
                                                            />
                                                        </td>
                                                    )}
                                                    <td className="text-end">
                                                        <div className="d-flex">
                                                            {(index === branches.length - 1) && (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-outline-primary border-0 btn-sm me-2"
                                                                    onClick={() => handleAddRow()}
                                                                >
                                                                    <i className="bx bx-plus"></i>
                                                                </button>
                                                            )}
                                                            {(branches.length > 1) && (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-outline-danger btn-sm border-0"
                                                                    onClick={() => handleDeleteRow(data.idBankBranches)}
                                                                >
                                                                    <i className="bx bx-trash"></i>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {branches.length === 0 && (
                                                <tr>
                                                    <td colSpan={[branchNameField, bankAddressField, phoneNumberField, ifscField].filter((f) => f.visible).length + 1} className="text-center">
                                                        <div className="Nodatafound_box">
                                                            <h6><i className="bx bx-search"></i> No data available!</h6>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </Form>
                            </div>

                            {/* Fixed Submit Button */}
                            {branches.length !== 0 && (
                                <div className="custom-submit-btn-wrapper text-center">
                                    <button
                                        type="submit"
                                        className="btn btn-primary px-4"
                                        onClick={(e) => handleSubmit(e)}
                                    >
                                        Submit
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>
                </div>

            </div>
        </div>
    )
}

export default BankAndBranches