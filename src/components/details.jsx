import React from 'react';
import PropTypes from 'prop-types';

const Details = ({ employeeData, overtimeData, bankAccountData }) => {
  return (
    <div className="modal fade" id="EMP_profileView" tabIndex="-1" aria-hidden="true">
      <div className="modal-dialog modal-xl modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="modalCenterTitle">Employee Profile view</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body pt-1 accountDetail_card">
            <div className="accountDetail_cardProfile">
              <div className="avatar-upload">
                <div className="avatar-preview">
                  <img src={employeeData?.profileImage || "assets/img/picture-profile-icon-male-icon-human-or-people-sign-and-symbol-vector.jpg"} alt="profile" />
                </div>
              </div>

              <div className="row m-0 mt-3">
                <div className="col-lg-4 col-md-6 p-2">
                  <label className="form-label mb-1">Employee Code</label>
                  <p className="m-0">{employeeData?.employeeCode}</p>
                </div>
                <div className="col-lg-4 col-md-6 p-2">
                  <label className="form-label mb-1">Employee Name</label>
                  <p className="m-0">{employeeData?.employeeName}</p>
                </div>
                <div className="col-lg-4 col-md-6 p-2">
                  <label className="form-label mb-1">Date of Birth, Gender</label>
                  <p className="m-0">{employeeData?.dob} - {employeeData?.gender}</p>
                </div>

                <div className="col-lg-4 col-md-6 p-2">
                  <label className="form-label mb-1">Email ID</label>
                  <p className="m-0">{employeeData?.email}</p>
                </div>
                <div className="col-lg-4 col-md-6 p-2">
                  <label className="form-label mb-1">Work Phone</label>
                  <p className="m-0">{employeeData?.workPhone}</p>
                </div>
                <div className="col-lg-4 col-md-6 p-2">
                  <label className="form-label mb-1">Mobile Number</label>
                  <p className="m-0">{employeeData?.mobileNumber}</p>
                </div>

                <div className="col-lg-4 col-md-6 p-2">
                  <label className="form-label mb-1">Department</label>
                  <p className="m-0">{employeeData?.department}</p>
                </div>
                <div className="col-lg-4 col-md-6 p-2">
                  <label className="form-label mb-1">Designation</label>
                  <p className="m-0">{employeeData?.designation}</p>
                </div>
                <div className="col-lg-4 col-md-6 p-2">
                  <label className="form-label mb-1">Joining Date</label>
                  <p className="m-0">{employeeData?.joiningDate}</p>
                </div>

                <div className="col-lg-4 col-md-6 p-2">
                  <label className="form-label mb-1">Address</label>
                  <p className="m-0">{employeeData?.address}</p>
                </div>
                <div className="col-lg-4 col-md-6 p-2">
                  <label className="form-label mb-1">Reporting To</label>
                  <p className="m-0">{employeeData?.reportingTo}</p>
                </div>
                <div className="col-lg-4 col-md-6 p-2">
                  <label className="form-label mb-1">Current Status</label>
                  <p className="m-0"><span className="badge bg-label-success">{employeeData?.status}</span></p>
                </div>

                <div className="col-lg-4 col-md-6 p-2">
                  <label className="form-label mb-1">SSN</label>
                  <p className="m-0">{employeeData?.ssn}</p>
                </div>
                <div className="col-lg-4 col-md-6 p-2">
                  <label className="form-label mb-1">Tax ID Number</label>
                  <p className="m-0">{employeeData?.taxId}</p>
                </div>
                <div className="col-lg-4 col-md-6 p-2">
                  <label className="form-label mb-1">Budget Code </label>
                  <p className="m-0">{employeeData?.budgetCode}</p>
                </div>
              </div>

              <div className="row m-0">
                <div className="col-md-10 p-2">
                  <div className="py-2">
                    <h6 className="fw-bold mb-0">Overtime Configuration</h6>
                  </div>
                  <table className="table table-sm mb-0 border">
                    <thead>
                      <tr>
                        <th>Days</th>
                        <th className="text-end">Hourly Rate</th>
                        <th className="text-end">Applied Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overtimeData?.map((overtime, index) => (
                        <tr key={index}>
                          <td>{overtime.day}</td>
                          <td className="text-end">{overtime.hourlyRate}</td>
                          <td className="text-end">{overtime.appliedRate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            <div className="mt-2">
              <div className="py-2">
                <h6 className="fw-bold mb-0">Bank Account Details</h6>
              </div>
              <table className="table table-sm mb-0 border">
                <thead>
                  <tr>
                    <th>Bank Name</th>
                    <th>Branch Name</th>
                    <th>Account Number</th>
                    <th>% Salary</th>
                    <th>Currency</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {bankAccountData?.map((account, index) => (
                    <tr key={index}>
                      <td>{account.bankName}</td>
                      <td>{account.branchName}</td>
                      <td>{account.accountNumber}</td>
                      <td>{account.salaryPercentage}</td>
                      <td>{account.currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-end py-2">
                <button className="btn btn-sm btn-primary"> <i className='bx bx-user'></i> Update Profile </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Details;

Details.propTypes = {
    employeeData: PropTypes.object.isRequired,
    overtimeData: PropTypes.array.isRequired,
    bankAccountData: PropTypes.array.isRequired,
    };