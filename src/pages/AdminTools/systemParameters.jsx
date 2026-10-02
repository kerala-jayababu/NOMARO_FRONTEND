import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import { useLoader } from "../../components/LoaderContext";
import SystemParameterService from "../../core/services/SystemParameterService";

const MAX_IMAGE_BYTES = 1048576; // 1 MB (same as the API)
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/bmp", "image/webp"];

// ── Data type & valid value helpers (same rules as SystemParameterService in the API) ──

const normaliseType = (dataType) => {
  const t = (dataType || "").trim().toUpperCase();
  if (["INT", "INTEGER", "BIGINT", "SMALLINT", "NUMBER", "LONG"].includes(t)) return "INTEGER";
  if (["DECIMAL", "NUMERIC", "FLOAT", "DOUBLE", "MONEY", "CURRENCY", "PERCENTAGE"].includes(t)) return "DECIMAL";
  if (["BOOL", "BOOLEAN", "BIT", "YESNO", "YES/NO"].includes(t)) return "BOOLEAN";
  if (["DATE", "DATETIME"].includes(t)) return "DATE";
  if (t === "EMAIL") return "EMAIL";
  return "STRING";
};

// ValidValues for numbers can be a range: "1-31", "1..31" or "1 to 31"
const parseRange = (validValues, type) => {
  if (!validValues || (type !== "INTEGER" && type !== "DECIMAL")) return null;
  const m = validValues.trim().match(/^(-?\d+(?:\.\d+)?)\s*(?:-|\.\.|to)\s*(-?\d+(?:\.\d+)?)$/i);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  return { min: Math.min(a, b), max: Math.max(a, b) };
};

// Otherwise ValidValues is a list separated by , ; or |
const parseList = (validValues) =>
  validValues
    ? [...new Set(validValues.split(/[,;|]/).map((v) => v.trim()).filter(Boolean))]
    : [];

// Keep the Yes/No style the parameter already uses (1/0, Y/N, Yes/No or true/false)
const booleanOptions = (current) => {
  const c = (current || "").trim().toLowerCase();
  if (c === "1" || c === "0") return [{ value: "1", label: "Yes (1)" }, { value: "0", label: "No (0)" }];
  if (c === "y" || c === "n") return [{ value: "Y", label: "Yes (Y)" }, { value: "N", label: "No (N)" }];
  if (c === "yes" || c === "no") return [{ value: "Yes", label: "Yes" }, { value: "No", label: "No" }];
  return [{ value: "true", label: "Yes (true)" }, { value: "false", label: "No (false)" }];
};

// Dates are saved in the same style as the current value (dd-MM-yyyy or yyyy-MM-dd)
const toIsoDate = (value) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const m = value.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
};
const fromIsoDate = (iso, current) => {
  if (!iso) return "";
  const [y, mo, d] = iso.split("-");
  return /^\d{2}-\d{2}-\d{4}$/.test(current || "") ? `${d}-${mo}-${y}` : iso;
};

const validate = (param, value) => {
  const type = normaliseType(param.dataType);
  const v = (value ?? "").trim();
  const range = parseRange(param.validValues, type);
  const list = range ? [] : parseList(param.validValues);
  if (v.length > 500) return "Value must not exceed 500 characters.";
  if (!v) return type === "STRING" && !param.validValues ? "" : "Enter a value.";
  if (type === "INTEGER" && !/^-?\d+$/.test(v)) return "Enter a whole number.";
  if (type === "DECIMAL" && !/^-?\d+(\.\d+)?$/.test(v)) return "Enter a number.";
  if (range && (Number(v) < range.min || Number(v) > range.max)) return `Enter a value between ${range.min} and ${range.max}.`;
  if (type === "EMAIL" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return "Enter a valid email address.";
  if (list.length && !list.some((x) => x.toLowerCase() === v.toLowerCase())) return `Select one of: ${list.join(", ")}.`;
  return "";
};

// The list never loads images; an image can exist when it is editable or the data type is an image type
const canHaveImage = (p) => p.parameterBinaryValueEditable || /image|binary|logo|picture|photo/i.test(p.dataType || "");

const formatBytes = (n) => (n >= 1024 * 1024 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

// ── Page ─────────────────────────────────────────────────────────────────────

function SystemParameters() {
  const { showLoader, hideLoader } = useLoader();
  const [parameters, setParameters] = useState([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [value, setValue] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [currentImage, setCurrentImage] = useState(null); // stored image in the edit popup: undefined = loading, null = none, { src, size }
  const [viewImage, setViewImage] = useState(null); // { name, src } for the View popup
  const [submitted, setSubmitted] = useState(false);

  const loadParameters = () => {
    showLoader();
    SystemParameterService.getConfigurableParameters().then((res) => {
      hideLoader();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setParameters(res.data?.data || []);
    });
  };

  useEffect(() => {
    loadParameters();
  }, []);

  // Free the preview URL of a picked file
  useEffect(() => () => imagePreview && URL.revokeObjectURL(imagePreview), [imagePreview]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return parameters;
    return parameters.filter((p) =>
      [p.parameterName, p.parameterDescription, p.parameterValue].some((x) => (x || "").toLowerCase().includes(s)));
  }, [parameters, search]);

  // Image of one parameter, read from the database only when View or Edit is clicked
  const fetchImage = async (param) => {
    const res = await SystemParameterService.getImage(param.idSystemParameter);
    if (res.error) {
      toast.error(res.error);
      return null;
    }
    const img = res.data?.data;
    return img ? { src: `data:${img.contentType};base64,${img.imageBase64}`, size: img.imageSizeBytes } : null;
  };

  const openView = async (param) => {
    showLoader();
    const img = await fetchImage(param);
    hideLoader();
    if (img) setViewImage({ name: param.parameterName, src: img.src });
    else toast.info("No image uploaded for this parameter.");
  };

  const openEdit = async (param) => {
    setEditing(param);
    setValue(param.parameterValue || "");
    setImageFile(null);
    setImagePreview("");
    setSubmitted(false);
    if (canHaveImage(param)) {
      setCurrentImage(undefined);
      setCurrentImage(await fetchImage(param));
    } else {
      setCurrentImage(null);
    }
  };

  const closeEdit = () => {
    setEditing(null);
    setImageFile(null);
    setImagePreview("");
    setCurrentImage(null);
  };

  const pickImage = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error("Select a PNG, JPG, GIF, BMP or WEBP image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image must not be larger than 1 MB.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const valueError = editing?.parameterValueEditable ? validate(editing, value) : "";
  const valueChanged = editing?.parameterValueEditable && (value ?? "").trim() !== (editing.parameterValue || "");
  const canSave = editing && !valueError && (valueChanged || imageFile);
  // Show the value error as soon as the user changes the value
  const showValueError = !!valueError && (valueChanged || submitted);

  const handleSave = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (!canSave) return;
    showLoader();
    SystemParameterService.updateParameter(
      editing.idSystemParameter,
      valueChanged ? value.trim() : null,
      imageFile,
    ).then((res) => {
      hideLoader();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.data?.message || "System parameter updated successfully.");
      closeEdit();
      loadParameters();
    });
  };

  // Input that matches the parameter's data type and valid values
  const renderValueInput = (param) => {
    const type = normaliseType(param.dataType);
    const range = parseRange(param.validValues, type);
    const list = range ? [] : parseList(param.validValues);
    const invalid = showValueError ? "is-invalid" : "";

    if (list.length) {
      const current = list.find((x) => x.toLowerCase() === (value || "").toLowerCase()) ?? value;
      return (
        <select className={`form-select ${invalid}`} value={current} onChange={(e) => setValue(e.target.value)}>
          {!list.some((x) => x.toLowerCase() === (value || "").toLowerCase()) && <option value={value}>{value || "Select"}</option>}
          {list.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
      );
    }
    if (type === "BOOLEAN") {
      const options = booleanOptions(param.parameterValue);
      return (
        <select className={`form-select ${invalid}`} value={value} onChange={(e) => setValue(e.target.value)}>
          {!options.some((o) => o.value === value) && <option value={value}>{value || "Select"}</option>}
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    }
    if (type === "INTEGER" || type === "DECIMAL") {
      return (
        <input type="number" className={`form-control ${invalid}`} value={value}
          step={type === "INTEGER" ? 1 : "any"} min={range?.min} max={range?.max}
          onChange={(e) => setValue(e.target.value)} />
      );
    }
    if (type === "DATE") {
      return (
        <input type="date" className={`form-control ${invalid}`} value={toIsoDate(value)}
          onChange={(e) => setValue(fromIsoDate(e.target.value, param.parameterValue))} />
      );
    }
    if (type === "EMAIL") {
      return <input type="email" className={`form-control ${invalid}`} value={value} maxLength={500} onChange={(e) => setValue(e.target.value)} />;
    }
    return (
      <textarea className={`form-control ${invalid}`} rows={(value || "").length > 60 ? 3 : 1} value={value} maxLength={500}
        onChange={(e) => setValue(e.target.value)} />
    );
  };

  const validValuesHint = (param) => {
    const type = normaliseType(param.dataType);
    const range = parseRange(param.validValues, type);
    if (range) return `Between ${range.min} and ${range.max}`;
    const list = parseList(param.validValues);
    return list.length ? list.join(", ") : "";
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between pb-3">
          <h5 className="m-0">System Parameters</h5>
          <div className="list_searchbox">
            <input type="text" className="form-control form-control-sm" style={{ width: 240 }}
              placeholder="Search Parameter" value={search} onChange={(e) => setSearch(e.target.value)} />
            <i className="bx bx-search"></i>
          </div>
        </div>
        <div className="card-body">
          <div className="table-responsive scroll-grid">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Description</th>
                  <th>Value</th>
                  <th>Image</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="table-border-bottom-0">
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-muted">No parameters found.</td></tr>
                )}
                {filtered.map((p) => {
                  const editable = p.parameterValueEditable || p.parameterBinaryValueEditable;
                  return (
                    <tr key={p.idSystemParameter}>
                      <td><span className="fw-semibold">{p.parameterName}</span></td>
                      <td style={{ whiteSpace: "normal", minWidth: 180 }}>{p.parameterDescription}</td>
                      <td style={{ whiteSpace: "normal", maxWidth: 320, wordBreak: "break-word" }}>
                        {p.parameterValue || <span className="text-muted">—</span>}
                      </td>
                      <td>
                        {canHaveImage(p) ? (
                          <button type="button" className="btn btn-sm btn-outline-primary py-0 px-2" onClick={() => openView(p)}>
                            <i className="bx bx-show me-1"></i>View
                          </button>
                        ) : <span className="text-muted">—</span>}
                      </td>
                      <td className="text-end">
                        {editable ? (
                          <button type="button" className="btn btn-sm btn-icon btn-outline-secondary px-3 border-0"
                            title="Edit" onClick={() => openEdit(p)}>
                            <span className="bx bx-pencil"></span>
                          </button>
                        ) : (
                          <span className="badge bg-label-secondary">Read only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit popup */}
      <Modal show={!!editing} onHide={closeEdit} size="lg" centered backdrop="static" keyboard={false} aria-labelledby="sp-edit-title">
        {editing && (
          <form onSubmit={handleSave} noValidate>
            <Modal.Header closeButton>
              <Modal.Title id="sp-edit-title"><h5 className="m-0">Edit System Parameter</h5></Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="row mb-2">
                <div className="col-12 mb-2">
                  <label className="form-label mb-1">Parameter</label>
                  <input className="form-control" value={editing.parameterName || ""} disabled />
                </div>
                {editing.parameterDescription && (
                  <div className="col-12 mb-2 small text-muted">{editing.parameterDescription}</div>
                )}
              </div>

              {editing.parameterValueEditable && (
                <div className="mb-3">
                  <label className="form-label mb-1">Parameter Value</label>
                  {renderValueInput(editing)}
                  {showValueError && <div className="invalid-feedback d-block">{valueError}</div>}
                  {validValuesHint(editing) && <div className="small text-muted mt-1">Valid values: {validValuesHint(editing)}</div>}
                </div>
              )}
              {!editing.parameterValueEditable && editing.parameterValue && (
                <div className="mb-3">
                  <label className="form-label mb-1">Parameter Value</label>
                  <input className="form-control" value={editing.parameterValue} disabled />
                </div>
              )}

              {canHaveImage(editing) && (
                <div className="mb-2">
                  <label className="form-label mb-1">Image</label>
                  <div className="d-flex gap-3 flex-wrap align-items-start">
                    <div className="border rounded p-2 text-center" style={{ width: 200 }}>
                      <div className="small text-muted mb-1">Current image</div>
                      {currentImage ? (
                        <img src={currentImage.src} alt="Current" className="img-fluid cursor-pointer" style={{ maxHeight: 120 }}
                          onClick={() => setViewImage({ name: editing.parameterName, src: currentImage.src })} />
                      ) : (
                        <div className="text-muted small py-4">{currentImage === undefined ? "Loading…" : "No image"}</div>
                      )}
                      {currentImage?.size > 0 && <div className="small text-muted mt-1">{formatBytes(currentImage.size)}</div>}
                    </div>
                    {imagePreview && (
                      <div className="border rounded p-2 text-center" style={{ width: 200, borderColor: "var(--primary-color)" }}>
                        <div className="small text-muted mb-1">New image</div>
                        <img src={imagePreview} alt="New" className="img-fluid" style={{ maxHeight: 120 }} />
                        <div className="small text-muted mt-1">{formatBytes(imageFile.size)}</div>
                      </div>
                    )}
                  </div>
                  {editing.parameterBinaryValueEditable && (
                    <div className="mt-2 d-flex align-items-center gap-2">
                      <label className="btn btn-sm btn-outline-primary mb-0">
                        <i className="bx bx-image-add me-1"></i>{currentImage || imageFile ? "Choose another image" : "Choose image"}
                        <input type="file" accept={IMAGE_TYPES.join(",")} hidden onChange={pickImage} />
                      </label>
                      {imageFile && (
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { setImageFile(null); setImagePreview(""); }}>
                          Keep current image
                        </button>
                      )}
                      <span className="small text-muted">PNG, JPG, GIF, BMP or WEBP · up to 1 MB</span>
                    </div>
                  )}
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <button type="submit" className="btn btn-primary px-4 me-2" disabled={!canSave}>Update</button>
              <button type="button" className="btn btn-outline-secondary px-4" onClick={closeEdit}>Cancel</button>
            </Modal.Footer>
          </form>
        )}
      </Modal>

      {/* View image popup */}
      <Modal show={!!viewImage} onHide={() => setViewImage(null)} size="lg" centered aria-labelledby="sp-view-title">
        <Modal.Header closeButton>
          <Modal.Title id="sp-view-title"><h5 className="m-0">{viewImage?.name}</h5></Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center" style={{ background: "repeating-conic-gradient(#f3f4f6 0% 25%, #fff 0% 50%) 50% / 20px 20px" }}>
          {viewImage && <img src={viewImage.src} alt={viewImage.name} className="img-fluid" style={{ maxHeight: "70vh" }} />}
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default SystemParameters;
