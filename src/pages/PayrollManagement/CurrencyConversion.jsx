import React from 'react'

function CurrencyConversion() {
  return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="row">
          <div className="col-lg-8 ">
            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between pb-3">
                <h5 className="m-0">List of Currency Conversion</h5>
                <button className="btn btn-primary btn-sm px-4">Add</button>
              </div>
              <div className="card-body">
                <div className="table-responsive text-nowrap">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>From Currency</th>
                        <th>To Currency</th>
                        <th className="text-end">Rate</th>
                      </tr>
                    </thead>
                    <tbody className="table-border-bottom-0">
                      <tr>
                        <td>02/12/2024</td>
                        <td>GYD</td>
                        <td>USD</td>
                        <td className="text-end">0.0048</td>
                        <td className="text-end">
                          <button type="button" className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0">
                            <span className="tf-icons bx bx-pencil"></span>
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td>10/01/2025</td>
                        <td>USD</td>
                        <td>GYD</td>
                        <td className="text-end">1</td>
                        <td className="text-end">
                          <button type="button" className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0">
                            <span className="tf-icons bx bx-pencil"></span>
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td>13/01/2025</td>
                        <td>GYD</td>
                        <td>INR</td>
                        <td className="text-end">0.41</td>
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
                <h5 className="mb-0">Add/Update Currency Conversion</h5>
              </div>
              <div className="card-body">
                <form>
                  <div className="mb-2">
                    <label className="form-label mb-1">Date</label>
                    <input type="date" className="form-control" maxlength="10" />
                  </div>
                  <div className="mb-2">
                    <label className="form-label mb-1">From Currency</label>
                    <select className="form-select">
                      <option selected>GYD</option>
                      <option>USD</option>
                      <option>IND</option>
                    </select>
                  </div>
                  <div className="mb-2">
                    <label className="form-label mb-1">To Currency</label>
                    <select className="form-select">
                      <option>GYD</option>
                      <option selected>USD</option>
                      <option>IND</option>
                    </select>
                  </div>
                  <div className="mb-2">
                    <label className="form-label mb-1">Rate</label>
                    <input type="text" className="form-control" maxlength="50" value="0.0048" />
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

export default CurrencyConversion