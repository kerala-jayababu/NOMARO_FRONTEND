import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify';
import BankAndBranchService from '../../core/services/BankAndBranchService';
import { Form, Modal } from 'react-bootstrap';
import { useLoader } from '../../components/LoaderContext';
import Utils from '../../utils/Utils';

function Banks() {
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validated, setValidated] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedRowId, setSelectedRowId] = useState(null);
    const { showLoader, hideLoader } = useLoader();

    useEffect(() => {
        getBanks();
    }, []);

    const getBanks = async () => {
        setLoading(true);
        showLoader();
        setBanks([]);
        BankAndBranchService.getAllBanks()
            .then(res => {
                hideLoader();
                setLoading(false);
                if (res.data.data.length > 0) {
                    res.data.data.forEach(element => {
                        element['id'] = Utils.generateRandomId();
                    });
                    setBanks(res.data.data);
                } else {
                    setBanks([]);
                }
            })
            .catch(err => {
                hideLoader();
                setBanks([]);
                setLoading(false);
            });
    };

    const handleInputChange = (id, field, value) => {
        setBanks(prevBanks =>
            prevBanks.map(bank =>
                bank.id === id ? { ...bank, [field]: value } : bank
            )
        );
    };

    const handleAddRow = () => {
        const newBank = {
            idBank: null,
            id: Utils.generateRandomId(),
            bankName: "",
            swiftCode: ""
        };
        setBanks(prevBanks => [...prevBanks, newBank]);
    };

    const handleDeleteRow = (id) => {
        if (banks.length <= 1) {
            toast.error("At least one bank is required");
            return;
        }
        setBanks(prevBanks => prevBanks.filter(bank => bank.id !== id));
        setShowConfirmModal(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const form = e.currentTarget;

        const hasEmptyBank = banks.some(bank => !bank.bankName.trim());
        if (hasEmptyBank) {
            setValidated(true);
            toast.error("Please fill bank names");
            return;
        }

        let passData = banks.map(bank => ({
            idBank: bank.idBank && bank.idBank > 0 ? bank.idBank : 0,
            bankName: bank.bankName.trim(),
            swiftCode: bank.swiftCode != '' ? bank.swiftCode : 'NA'
        }));
        showLoader();
        BankAndBranchService.saveAllBanks(passData)
            .then(res => {
                hideLoader();
                if (res.data.status === 200) {
                    getBanks();
                    setValidated(false);
                }
            })
            .catch(err => {
                hideLoader();
            });
    };

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            <div className="row">
                <div className="col-lg-12 ">
                    <div className="card">
                        <div className="card-header d-flex align-items-center justify-content-between pb-3">
                            <h5 className="m-0">List of Banks</h5>
                            <div className="list_menu">
                                {banks.length == 0 &&
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        onClick={handleAddRow}>
                                        <i className="bx bx-plus me-1"></i> Add Bank
                                    </button>
                                }
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="custom-table-wrapper">
                                <Form noValidate validated={validated}>
                                    <table className="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Bank Name *</th>
                                                <th>Swift Code</th>
                                                <th className="text-end">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="table-border-bottom-0">
                                            {banks && banks.map((data, index) => (
                                                <tr key={data.id}>
                                                    <td>{index + 1}</td>
                                                    <td>
                                                        <Form.Control
                                                            type="text"
                                                            className="form-control"
                                                            maxLength="50"
                                                            value={data.bankName || ""}
                                                            required
                                                            onChange={(e) => handleInputChange(data.id, 'bankName', e.target.value)}
                                                            isInvalid={validated && !data.bankName?.trim()}
                                                        />
                                                    </td>
                                                    <td>
                                                        <Form.Control
                                                            type="text"
                                                            maxLength="100"
                                                            className="form-control"
                                                            value={data.swiftCode || ""}
                                                            onChange={(e) => handleInputChange(data.id, 'swiftCode', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="text-end">
                                                        <div className="d-flex justify-content-end">
                                                            {(index === banks.length - 1) && (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-outline-primary border-0 btn-sm me-2"
                                                                    onClick={handleAddRow}
                                                                    title="Add new bank"
                                                                >
                                                                    <i className="bx bx-plus"></i>
                                                                </button>
                                                            )}
                                                            {(banks.length > 1) && (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-outline-danger btn-sm border-0"
                                                                    onClick={() => { setSelectedRowId(data.id); setShowConfirmModal(true); }}
                                                                    title="Delete bank"
                                                                >
                                                                    <i className="bx bx-trash"></i>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {banks.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="text-center">
                                                        <div className="Nodatafound_box">
                                                            <h6><i className="bx bx-search"></i> No banks available!</h6>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </Form>
                            </div>

                            {/* Fixed Submit Button */}
                            {banks.length !== 0 && (
                                <div className="custom-submit-btn-wrapper text-center mt-4">
                                    <button
                                        type="submit"
                                        className="btn btn-primary px-4"
                                        onClick={handleSubmit}
                                        disabled={loading}
                                    >
                                        {loading ? 'Saving...' : 'Submit'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                show={showConfirmModal} onHide={() => { setShowConfirmModal(false); setSelectedRowId(null) }} size='md'
                aria-labelledby="contained-modal-title-vcenter"
                centered backdrop="static"
                keyboard={false}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <h5>Confirm Delete</h5>
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <div className="modal-body pt-1 text-center">
                        <div className="text-center mb-5">
                            <div className="mb-4 text-danger">
                                <i className="bx bx-x-circle fs-2"></i>
                            </div>
                            <h6> Are you sure to delete this?</h6>
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary btn-sm py-2 px-4 me-2"
                            onClick={() => handleDeleteRow(selectedRowId)}
                        >
                            Confirm
                        </button>
                        <button
                            type="submit"
                            className="btn btn-outline-secondary  btn-sm py-2 px-4"
                            onClick={() => { setShowConfirmModal(false); setSelectedRowId(null) }}
                        >
                            Cancel
                        </button>
                    </div>
                </Modal.Body>
            </Modal>

        </div>
    )
}

export default Banks