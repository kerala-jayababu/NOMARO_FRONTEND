function VacationModes(){
    return (
        <div className="container-xxl flex-grow-1 container-p-y">
        <div className="row">

          <div className="col-lg-8 ">
            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between pb-3">
                <h5 className="m-0">List of Employees on Vacation Mode</h5>
                <button className="btn btn-primary btn-sm px-4">Add</button>
              </div>
              <div className="card-body">
                <div className="table-responsive text-nowrap">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Emp. Code</th>
                        <th>Employee Name</th>
                        <th>Date From</th>
                        <th>Date To</th>
                        <th>Substitute</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody className="table-border-bottom-0">
                      <tr>
                        <td>Emp00 </td>
                        <td>John</td>
                        <td>01/01/2025</td>
                        <td>05/01/2025</td>
                        <td>David</td>

                        <td className="text-end">
                          <button type="button" className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0">
                            <span className="tf-icons bx bx-pencil"></span>
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td>Emp01 </td>
                        <td>William</td>
                        <td>01/01/2025</td>
                        <td>05/01/2025</td>
                        <td>Thomas</td>

                        <td className="text-end">
                          <button type="button" className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0">
                            <span className="tf-icons bx bx-pencil"></span>
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td>Emp02 </td>
                        <td>Charles</td>
                        <td>01/01/2025</td>
                        <td>05/01/2025</td>
                        <td>Anthony</td>

                        <td className="text-end">
                          <button type="button" className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0">
                            <span className="tf-icons bx bx-pencil"></span>
                          </button>
                        </td>
                      </tr>

                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Add/Update Vacation Mode</h5>
              </div>
              <div className="card-body">
                <form>
                  
                  <div className="mb-2">
                    <label className="form-label mb-1">Employee Name</label>
                    <select className="form-select">
                      <option>Select Employee</option>
                      <option>johnny</option>
                      <option>John</option>
                      <option>William</option>
                    </select>
                  </div>
                  <div className="mb-2">
                    <label className="form-label mb-1">Vacation From</label>
                    <input type="date" className="form-control" maxLength="20" />
                  </div>
                  <div className="mb-2">
                    <label className="form-label mb-1">Vacation To</label>
                    <input type="date" className="form-control" maxLength="20" />
                  </div>
                  <div className="mb-2">
                    <label className="form-label mb-1">Approval Authority Substituted to</label>
                    <select className="form-select">
                      <option>Select</option>
                      <option>johnny</option>
                      <option>John</option>
                      <option>William</option>
                    </select>
                  </div>

                  <div className="mb-2">
                    <label className="form-label mb-1">Reason for Vacation</label>
                    <input type="text" className="form-control" maxLength="15" />
                  </div>


                  <div className="text-center">
                    <button type="submit" className="btn btn-primary px-4 me-2">Submit</button>
                    <button type="submit" className="btn btn-outline-secondary px-4">Reset</button>
                  </div>

                </form>
              </div>
            </div>
          </div>
        </div>

      </div>
    )
}
export default VacationModes;