import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { API } from "../../redux/api/utils";
import Utils from "../../utils/Utils";

// Public page opened from the agreement email: no login. The link token identifies the agreement
// and a one-time code emailed to the employee confirms who is responding.
const BASE = "/api/v1/AgreementPortal";

export const fmtUtc = (value) => {
  if (!value) return "";
  const s = /Z$|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`;
  const d = new Date(s);
  return Number.isNaN(d.getTime())
    ? value
    : `${Utils.formatDisplayDate(d)} ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
};

const box = { maxWidth: 980, margin: "0 auto", padding: "24px 16px" };
const card = { background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(67,89,113,.15)", marginBottom: 16 };

const STATE_TEXT = {
  ACCEPTED: { tone: "#1d6b33", bg: "#e5f6ea", title: "Agreement accepted", text: "Your acceptance has been recorded. A confirmation with the certificate has been emailed to you and to HR." },
  REJECTED: { tone: "#a12230", bg: "#fde8ea", title: "Agreement rejected", text: "Your response has been recorded and HR has been informed. HR will contact you." },
  EXPIRED: { tone: "#8a5a00", bg: "#fff4dd", title: "This link has expired", text: "Please contact HR to send you a new link." },
  CANCELLED: { tone: "#8a5a00", bg: "#fff4dd", title: "This agreement was withdrawn", text: "HR has withdrawn this agreement. No action is needed." },
  REPLACED: { tone: "#8a5a00", bg: "#fff4dd", title: "A newer link was sent", text: "HR has sent you a newer email for this agreement. Please use the link in the latest email." },
  INVALID: { tone: "#a12230", bg: "#fde8ea", title: "This link is not valid", text: "Check that you opened the full link from the email, or contact HR." },
};

const AgreementReview = () => {
  const { token } = useParams();
  const [view, setView] = useState(null);
  const [error, setError] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [decision, setDecision] = useState("ACCEPT");
  const [confirmRead, setConfirmRead] = useState(false);
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [remarks, setRemarks] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    (async () => {
      try {
        const res = await API.post(`${BASE}/GetAgreement`, { token });
        const v = res.data?.data;
        setView(v);
        if (v?.state === "OPEN") {
          const doc = await API.post(`${BASE}/GetDocument`, { token }, { responseType: "blob" });
          setPdfUrl(URL.createObjectURL(new Blob([doc.data], { type: "application/pdf" })));
        }
      } catch (e) {
        setError(e.response?.data?.message || "The agreement could not be loaded. Please try again later.");
      }
    })();
  }, [token]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendOtp = async () => {
    setError("");
    setBusy(true);
    try {
      const res = await API.post(`${BASE}/SendOtp`, { token });
      setOtpMessage(res.data?.message || "Code sent.");
      setCooldown(60);
    } catch (e) {
      setError(e.response?.data?.message || "The code could not be sent.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setError("");
    if (decision === "ACCEPT" && !confirmRead) { setError("Tick the box to confirm you have read and understood the agreement."); return; }
    if (decision === "REJECT" && !remarks.trim()) { setError("Enter the reason for rejecting."); return; }
    if (!fullName.trim()) { setError("Type your full name."); return; }
    if (!/^\d{6}$/.test(otp.trim())) { setError("Enter the 6-digit code from your email."); return; }
    setBusy(true);
    try {
      const res = await API.post(`${BASE}/Respond`, { token, decision, otp: otp.trim(), fullName: fullName.trim(), confirmRead, remarks: remarks.trim() || null });
      setView(res.data?.data);
    } catch (e) {
      setError(e.response?.data?.message || "Your response could not be recorded. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const header = (
    <div style={{ background: "var(--primary-color, #0d384d)", color: "#fff", padding: "14px 0" }}>
      <div style={{ ...box, padding: "0 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <b style={{ fontSize: "1.05rem" }}>{view?.companyName || "NOMARO HRMS"}</b>
        <span style={{ fontSize: ".85rem", opacity: 0.85 }}>Agreement Review</span>
      </div>
    </div>
  );

  if (!view) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f5f9" }}>
        {header}
        <div style={box}><div style={{ ...card, padding: 24 }}>{error || "Loading..."}</div></div>
      </div>
    );
  }

  const st = STATE_TEXT[view.state];

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f9", fontSize: ".9rem" }}>
      {header}
      <div style={box}>
        <div style={{ ...card, padding: "18px 20px" }}>
          <h4 style={{ margin: "0 0 4px" }}>{view.agreementTitle || "Agreement"} {view.agreementVersion && <small className="text-muted">({view.agreementVersion})</small>}</h4>
          {view.employeeName && <div className="text-muted">For {view.employeeName}{view.sentOnUtc ? ` · sent ${fmtUtc(view.sentOnUtc)}` : ""}</div>}
          {view.fileHash && (
            <div className="text-muted" style={{ fontSize: ".75rem", marginTop: 6, wordBreak: "break-all" }}>
              {view.originalFileName} · SHA-256 {view.fileHash}
            </div>
          )}
        </div>

        {st && (
          <div style={{ ...card, padding: "18px 20px", background: st.bg, color: st.tone }}>
            <h5 style={{ margin: "0 0 6px", color: st.tone }}>{st.title}</h5>
            <div>{st.text}</div>
            {view.respondedOnUtc && <div style={{ marginTop: 6, fontSize: ".8rem" }}>Recorded on {fmtUtc(view.respondedOnUtc)}</div>}
          </div>
        )}

        {view.state === "OPEN" && (
          <>
            <div style={{ ...card, padding: 12 }}>
              <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                <b>Please read the document</b>
                {pdfUrl && <a href={pdfUrl} download={view.originalFileName} className="btn btn-sm btn-outline-secondary">Download PDF</a>}
              </div>
              {pdfUrl
                ? <iframe title="Agreement" src={pdfUrl} style={{ width: "100%", height: "70vh", border: "1px solid #e4e6e8", borderRadius: 6 }} />
                : <div className="text-muted p-3">Loading the document...</div>}
            </div>

            <div style={{ ...card, padding: "18px 20px" }}>
              <h5 style={{ marginTop: 0 }}>Your response</h5>
              <div className="d-flex gap-3 mb-3">
                <label className="d-flex align-items-center gap-2">
                  <input type="radio" name="decision" checked={decision === "ACCEPT"} onChange={() => setDecision("ACCEPT")} /> I accept
                </label>
                <label className="d-flex align-items-center gap-2">
                  <input type="radio" name="decision" checked={decision === "REJECT"} onChange={() => setDecision("REJECT")} /> I do not accept
                </label>
              </div>

              {decision === "ACCEPT" ? (
                <label className="d-flex gap-2 mb-3" style={{ alignItems: "flex-start" }}>
                  <input type="checkbox" className="form-check-input mt-1" checked={confirmRead} onChange={(e) => setConfirmRead(e.target.checked)} />
                  <span>I have read and understood <b>{view.agreementTitle}</b> and I agree to its terms. I understand that this electronic acceptance is legally binding in the same way as my signature.</span>
                </label>
              ) : (
                <div className="mb-3">
                  <label className="form-label mb-1">Reason for not accepting *</label>
                  <textarea className="form-control" rows={3} maxLength={500} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                </div>
              )}

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label mb-1">Your full name *</label>
                  <input className="form-control" maxLength={150} placeholder="As in your employee record" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label mb-1">6-digit code from your email *</label>
                  <div className="d-flex gap-2">
                    <input className="form-control" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
                    <button type="button" className="btn btn-outline-primary text-nowrap" disabled={busy || cooldown > 0} onClick={sendOtp}>
                      {cooldown > 0 ? `Resend in ${cooldown}s` : otpMessage ? "Resend Code" : "Send Code"}
                    </button>
                  </div>
                  <div className="text-muted" style={{ fontSize: ".75rem", marginTop: 4 }}>
                    {otpMessage || `The code is sent to ${view.maskedEmails?.join(" and ") || "your email"} and is valid for ${view.otpValidMinutes} minutes.`}
                  </div>
                </div>
              </div>

              {error && <div className="alert alert-danger py-2 mt-3 mb-0">{error}</div>}

              <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                <span className="text-muted" style={{ fontSize: ".75rem" }}>
                  Your name, the time, your IP address and browser are recorded with your response. This link is valid until {fmtUtc(view.linkExpiresOnUtc)}.
                </span>
                <button type="button" className={`btn ${decision === "ACCEPT" ? "btn-success" : "btn-danger"}`} disabled={busy || !pdfUrl} onClick={submit}>
                  {busy ? "Please wait..." : decision === "ACCEPT" ? "Accept Agreement" : "Submit Rejection"}
                </button>
              </div>
            </div>
          </>
        )}
        {view.state !== "OPEN" && error && <div className="alert alert-danger">{error}</div>}
      </div>
    </div>
  );
};

export default AgreementReview;
