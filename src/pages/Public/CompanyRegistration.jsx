import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./companyRegistration.css";

// Public company self-registration (NOMARO_GLOBAL). Calls the API WITHOUT a company code. A separate axios
// instance is used because redux/api/utils.js adds a GLOBAL axios interceptor that inserts the last-used
// company code into every /api/v1/ URL; instances created with axios.create() do not run it.
const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1/CompanyOnboarding`;
const http = axios.create();
const CODE_RE = /^[A-Z]{2,10}$/;
const MAX_LOGO = 1024 * 1024;
const MOBILE_RE = /^\+?\d{7,15}$/;
const cleanMobile = (v) => v.replace(/[\s\-()]/g, "");

// Brand logos: put the files in public/assets. Until a file exists, its name is shown as text.
const BRANDS = [
  { src: "/assets/nomaro-logo.png", name: "NOMARO" },
  { src: "/assets/hanecode-logo.png", name: "Hanecode Innovations" },
];

// What a new company gets (shown under the page title)
const MODULES = [
  { title: "Employee Management", text: "Employee master, org hierarchy, agreements, grades and service changes" },
  { title: "Payroll", text: "Salary heads and setup, monthly salary processing, payslips and tax" },
  { title: "Attendance & Shifts", text: "Clock in/out, shifts, holidays, overtime and missing-entry approvals" },
  { title: "Leave Management", text: "Leave types, templates, balances and approval workflows" },
  { title: "Document Management", text: "Document register, expiry alerts, acknowledgements and reports" },
  { title: "Asset Management", text: "Company assets issued to employees and returned at exit" },
  { title: "Employee Self Service", text: "Profile change requests, my documents, attendance and payslips" },
  { title: "Offboarding", text: "Resignations, clearances and exit cases" },
];

const BrandLogo = ({ src, name }) => {
  const [failed, setFailed] = useState(false);
  return failed
    ? <span className="cr-brand-text">{name}</span>
    : <img src={src} alt={name} onError={() => setFailed(true)} />;
};

const errorText = (error, fallback) => error?.response?.data?.message || fallback;

const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const CompanyRegistration = () => {
  const [countries, setCountries] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [form, setForm] = useState({ countryCode: "", companyCode: "", companyName: "", companyAddress: "", contactName: "", contactMobile: "", email: "" });
  const [logo, setLogo] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [codeCheck, setCodeCheck] = useState(null); // {available, message, code}
  const [checking, setChecking] = useState(false);

  const [otpSent, setOtpSent] = useState(null);     // { masked }
  const [otp, setOtp] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [resendIn, setResendIn] = useState(0);
  const [token, setToken] = useState(null);
  const [busy, setBusy] = useState(null);           // "otp" | "verify" | "submit"
  const [message, setMessage] = useState(null);     // { type, text }
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef(null);
  const checkTimer = useRef(null);

  // the registration page is not a company page: always the product name in the browser tab
  useEffect(() => { document.title = "NOMARO"; }, []);

  useEffect(() => {
    http.get(`${API_BASE}/GetCountries`)
      .then((res) => {
        const list = res.data?.data || [];
        setCountries(list);
        if (list.length === 1) setForm((p) => ({ ...p, countryCode: list[0].countryCode }));
      })
      .catch((e) => setLoadError(errorText(e, "Registration is not available right now. Please try again later.")));
  }, []);

  // countdowns for OTP validity and the resend button
  useEffect(() => {
    if (secondsLeft <= 0 && resendIn <= 0) return undefined;
    const t = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
      setResendIn((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [secondsLeft > 0, resendIn > 0]);

  // live company-code availability
  useEffect(() => {
    clearTimeout(checkTimer.current);
    const code = form.companyCode;
    if (!CODE_RE.test(code)) {
      setCodeCheck(code ? { available: false, message: "Use 2 to 10 letters (A-Z).", code } : null);
      return undefined;
    }
    checkTimer.current = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await http.get(`${API_BASE}/CheckCompanyCode`, {
          params: { companyCode: code, countryCode: form.countryCode || undefined, email: form.email || undefined },
        });
        setCodeCheck({ ...res.data.data, code });
      } catch (e) {
        setCodeCheck({ available: false, message: errorText(e, "Could not check the code."), code });
      } finally {
        setChecking(false);
      }
    }, 450);
    return () => clearTimeout(checkTimer.current);
  }, [form.companyCode, form.countryCode]);

  useEffect(() => () => { if (logoUrl) URL.revokeObjectURL(logoUrl); }, [logoUrl]);

  const set = (patch) => {
    setMessage(null);
    setForm((p) => ({ ...p, ...patch }));
  };

  const setEmail = (email) => {
    // a changed email needs a new verification
    if (email.trim().toLowerCase() !== form.email.trim().toLowerCase()) {
      setToken(null);
      setOtpSent(null);
      setOtp("");
      setSecondsLeft(0);
    }
    set({ email });
  };

  const pickLogo = (file) => {
    if (!file) return;
    if (!/^image\/(png|jpe?g)$/i.test(file.type)) { setMessage({ type: "error", text: "The logo must be a PNG or JPG image." }); return; }
    if (file.size > MAX_LOGO) { setMessage({ type: "error", text: "The logo must be 1 MB or smaller." }); return; }
    if (logoUrl) URL.revokeObjectURL(logoUrl);
    setLogo(file);
    setLogoUrl(URL.createObjectURL(file));
    setMessage(null);
  };

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());

  const contactReady = form.contactName.trim().length > 0 && MOBILE_RE.test(cleanMobile(form.contactMobile));
  const mobileBad = form.contactMobile.trim() !== "" && !MOBILE_RE.test(cleanMobile(form.contactMobile));

  const sendOtp = async () => {
    if (!contactReady) { setMessage({ type: "error", text: "Enter your name and mobile number first." }); return; }
    if (!emailValid) { setMessage({ type: "error", text: "Enter a valid email address." }); return; }
    setBusy("otp");
    setMessage(null);
    try {
      const res = await http.post(`${API_BASE}/SendOtp`, { email: form.email.trim() });
      setOtpSent({ masked: res.data.data.maskedEmail });
      setSecondsLeft(res.data.data.validSeconds || 300);
      setResendIn(30);
      setOtp("");
      setToken(null);
      setMessage({ type: "info", text: res.data.message });
    } catch (e) {
      setMessage({ type: "error", text: errorText(e, "The code could not be sent.") });
    } finally {
      setBusy(null);
    }
  };

  const verifyOtp = async () => {
    if (!/^\d{6}$/.test(otp)) { setMessage({ type: "error", text: "Enter the 6-digit code." }); return; }
    setBusy("verify");
    setMessage(null);
    try {
      const res = await http.post(`${API_BASE}/VerifyOtp`, { email: form.email.trim(), otp });
      setToken(res.data.data.token);
      setSecondsLeft(0);
      setMessage({ type: "success", text: "Email verified." });
    } catch (e) {
      setMessage({ type: "error", text: errorText(e, "The code could not be verified.") });
    } finally {
      setBusy(null);
    }
  };

  const companyReady = form.countryCode && CODE_RE.test(form.companyCode) && codeCheck?.available !== false
    && form.companyName.trim() && form.companyAddress.trim();
  const canSubmit = companyReady && contactReady && token && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy("submit");
    setMessage(null);
    const fd = new FormData();
    fd.append("Token", token);
    fd.append("Email", form.email.trim());
    fd.append("CountryCode", form.countryCode);
    fd.append("CompanyCode", form.companyCode);
    fd.append("CompanyName", form.companyName.trim());
    fd.append("CompanyAddress", form.companyAddress.trim());
    fd.append("ContactName", form.contactName.trim());
    fd.append("ContactMobile", cleanMobile(form.contactMobile));
    if (logo) fd.append("Logo", logo);
    try {
      const res = await http.post(`${API_BASE}/Register`, fd, { headers: { "Content-Type": "multipart/form-data" }, timeout: 20 * 60 * 1000 });
      setResult(res.data.data);
    } catch (e) {
      setMessage({ type: "error", text: errorText(e, "The company could not be registered. Please try again.") });
    } finally {
      setBusy(null);
    }
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(result.companyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked */ }
  };

  if (result) {
    return (
      <div className="cr-page">
        <div className="cr-card cr-done">
          <div className="cr-check" aria-hidden="true">✓</div>
          <h1>{result.companyName} is ready</h1>
          <p className="cr-sub">Your NOMARO site has been created. Bookmark this address:</p>
          <div className="cr-url">
            <a href={result.companyUrl}>{result.companyUrl}</a>
            <button type="button" className="cr-btn cr-btn-light" onClick={copyUrl}>{copied ? "Copied" : "Copy"}</button>
          </div>
          <p>
            Log in with <b>{result.adminEmail}</b> using <b>Login with OTP</b>. You are the administrator, with access to every screen.
          </p>
          <p className="cr-sub">
            {result.emailSent
              ? `A confirmation with this address was sent to ${result.adminEmail}.`
              : "The confirmation email could not be sent, so please keep this address."}
          </p>
          <a className="cr-btn cr-btn-primary" href={result.companyUrl}>Go to login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="cr-page">
      <div className="cr-card">
        <div className="cr-brands">
          {BRANDS.map((b) => <BrandLogo key={b.name} {...b} />)}
        </div>
        <div className="cr-head">
          <h1>Register your company</h1>
          <p className="cr-lead">
            Set up your own NOMARO site in a few minutes: one place to manage your employees, from joining to exit,
            with payroll, attendance, leave, documents and company assets. Your company gets its own secure database,
            and you start as the administrator with access to every screen.
          </p>
          <ul className="cr-modules">
            {MODULES.map((m) => (
              <li key={m.title}><b>{m.title}</b><span>{m.text}</span></li>
            ))}
          </ul>
        </div>

        {loadError && <div className="cr-msg error">{loadError}</div>}

        <section className="cr-section">
          <h2><span>1</span>Company details</h2>
          <div className="cr-grid">
            <label className="cr-field">
              <span>Country <i>*</i></span>
              <select value={form.countryCode} onChange={(e) => set({ countryCode: e.target.value })} disabled={busy === "submit"}>
                <option value="">Select country</option>
                {countries.map((c) => <option key={c.countryCode} value={c.countryCode}>{c.countryName}</option>)}
              </select>
            </label>
            <label className="cr-field">
              <span>Company Code <i>*</i></span>
              <input value={form.companyCode} maxLength={10} placeholder="e.g. HANECODE" disabled={busy === "submit"} autoComplete="off"
                onChange={(e) => set({ companyCode: e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 10) })} />
              <small className={codeCheck ? (codeCheck.available ? "ok" : "bad") : ""}>
                {checking ? "Checking..." : codeCheck?.message || "Letters only, up to 10. Part of your site address."}
              </small>
            </label>
            <label className="cr-field cr-wide">
              <span>Company Name <i>*</i></span>
              <input value={form.companyName} maxLength={200} disabled={busy === "submit"} onChange={(e) => set({ companyName: e.target.value })} />
            </label>
            <label className="cr-field cr-wide">
              <span>Company Address <i>*</i></span>
              <textarea rows={3} maxLength={500} value={form.companyAddress} disabled={busy === "submit"} onChange={(e) => set({ companyAddress: e.target.value })} />
            </label>
            <div className="cr-field cr-wide">
              <span>Company Logo</span>
              <div className="cr-logo">
                <div className="cr-logo-box">{logoUrl ? <img src={logoUrl} alt="Company logo preview" /> : <span>No logo</span>}</div>
                <div>
                  <button type="button" className="cr-btn cr-btn-light" disabled={busy === "submit"} onClick={() => fileRef.current?.click()}>
                    {logo ? "Change logo" : "Upload logo"}
                  </button>
                  {logo && <button type="button" className="cr-link" onClick={() => { setLogo(null); setLogoUrl(null); }}>Remove</button>}
                  <small>PNG or JPG, up to 1 MB.</small>
                </div>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg" hidden onChange={(e) => { pickLogo(e.target.files?.[0]); e.target.value = ""; }} />
              </div>
            </div>
          </div>
        </section>

        <section className="cr-section">
          <h2><span>2</span>Your details</h2>
          <p className="cr-sub">The person registering the company. You become its Systems Administrator.</p>
          <div className="cr-grid">
            <label className="cr-field">
              <span>Name <i>*</i></span>
              <input value={form.contactName} maxLength={100} autoComplete="name" disabled={busy === "submit"}
                onChange={(e) => set({ contactName: e.target.value })} />
            </label>
            <label className="cr-field">
              <span>Mobile Number <i>*</i></span>
              <input type="tel" inputMode="tel" value={form.contactMobile} maxLength={20} autoComplete="tel" placeholder="e.g. +919876543210"
                disabled={busy === "submit"} onChange={(e) => set({ contactMobile: e.target.value.replace(/[^\d+\s\-()]/g, "") })} />
              <small className={mobileBad ? "bad" : ""}>{mobileBad ? "Enter 7 to 15 digits, with + at the start if needed." : "With country code, e.g. +91."}</small>
            </label>
          </div>
        </section>

        <section className="cr-section">
          <h2><span>3</span>Verify your email</h2>
          <p className="cr-sub">This email becomes the administrator login of your company.</p>
          <div className="cr-row cr-email">
            <label className="cr-field cr-grow">
              <span>Email Address <i>*</i></span>
              <input type="email" value={form.email} maxLength={200} disabled={busy === "submit"} onChange={(e) => setEmail(e.target.value)} />
            </label>
            {token ? (
              <span className="cr-verified">✓ Verified</span>
            ) : (
              <button type="button" className="cr-btn cr-btn-light" disabled={!emailValid || !contactReady || busy === "otp" || resendIn > 0}
                onClick={sendOtp}>
                {busy === "otp" ? "Sending..." : otpSent ? (resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code") : "Send code"}
              </button>
            )}
          </div>
          {otpSent && !token && (
            <div className="cr-row">
              <label className="cr-field">
                <span>6-digit code</span>
                <input className="cr-otp" inputMode="numeric" value={otp} maxLength={6} autoComplete="one-time-code"
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => { if (e.key === "Enter") verifyOtp(); }} />
                <small className={secondsLeft === 0 ? "bad" : ""}>
                  {secondsLeft > 0 ? `Sent to ${otpSent.masked} · valid for ${mmss(secondsLeft)}` : "The code has expired. Request a new one."}
                </small>
              </label>
              <button type="button" className="cr-btn cr-btn-primary" disabled={otp.length !== 6 || secondsLeft === 0 || busy === "verify"} onClick={verifyOtp}>
                {busy === "verify" ? "Verifying..." : "Verify"}
              </button>
            </div>
          )}
        </section>

        {message && <div className={`cr-msg ${message.type}`}>{message.text}</div>}

        {busy === "submit" ? (
          <div className="cr-progress">
            <div className="cr-spinner" aria-hidden="true"></div>
            <div>
              <b>Creating your company…</b>
              <div className="cr-sub">Setting up the database, settings and your administrator login. This can take a minute; please keep this page open.</div>
            </div>
          </div>
        ) : (
          <div className="cr-actions">
            <span className="cr-sub">{!contactReady ? "Enter your name and mobile number." : !token ? "Verify your email to continue." : !companyReady ? "Fill in the company details." : "Ready to create your company."}</span>
            <button type="button" className="cr-btn cr-btn-primary cr-btn-lg" disabled={!canSubmit} onClick={submit}>Create my company</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyRegistration;
