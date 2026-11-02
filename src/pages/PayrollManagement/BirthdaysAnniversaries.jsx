import React from "react";
import Celebrations from "../../components/Celebrations";

/** Payroll: today's and upcoming birthdays / work anniversaries, with congratulations emails. */
function BirthdaysAnniversaries() {
  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="card mb-4">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2 pb-3">
          <div>
            <h5 className="m-0">Birthdays &amp; Work Anniversaries</h5>
            <small className="text-muted">Today and the next 7 days · send wishes on the day using the BIRTHDAYMESSAGE / WORKDAYMESSAGE email templates</small>
          </div>
        </div>
      </div>
      <Celebrations allowSend />
    </div>
  );
}

export default BirthdaysAnniversaries;
