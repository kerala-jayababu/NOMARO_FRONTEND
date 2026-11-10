import React, { useEffect, useMemo, useState } from "react";
import Card from "../../components/card";
import Button from "../../components/button";
import Input from "../../components/input";
import Dropdown from "../../components/dropdown";
import Grid from "../../components/grid";
import GradeService from "../../core/services/GradeService";
import { showToast } from "../../components/ToastNotifications/toastUtils";

const initialFormData = {
  gradeCode: "",
  gradeName: "",
  gradeLevel: "",
  description: "",
  isActive: true,
};

function Grades() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = editingId !== null;

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    setLoading(true);
    try {
      const response = await GradeService.getGrades();
      if (response.error) {
        showToast(response.error, "error");
        setGrades([]);
      } else {
        setGrades(Array.isArray(response.data?.data) ? response.data.data : []);
      }
    } catch (error) {
      showToast("Failed to fetch grades", "error");
      setGrades([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredGrades = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    if (!text) return grades;
    return grades.filter(
      (g) =>
        g.gradeCode?.toLowerCase().includes(text) ||
        g.gradeName?.toLowerCase().includes(text) ||
        g.description?.toLowerCase().includes(text)
    );
  }, [grades, searchText]);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const code = formData.gradeCode.trim();
    const name = formData.gradeName.trim();

    if (!code) {
      newErrors.gradeCode = "Grade Code is required";
    } else if (!/^[a-z0-9]+$/i.test(code)) {
      newErrors.gradeCode = "Grade Code must be alphanumeric";
    } else if (
      grades.some((g) => g.gradeCode?.toLowerCase() === code.toLowerCase() && g.idGrade !== editingId)
    ) {
      newErrors.gradeCode = "Grade Code already exists";
    }

    if (!name) {
      newErrors.gradeName = "Level Name is required";
    } else if (
      grades.some((g) => g.gradeName?.toLowerCase() === name.toLowerCase() && g.idGrade !== editingId)
    ) {
      newErrors.gradeName = "Level Name already exists";
    }

    if (!formData.gradeLevel || Number(formData.gradeLevel) <= 0) {
      newErrors.gradeLevel = "Grade Level must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        idGrade: editingId || 0,
        gradeCode: formData.gradeCode.trim().toUpperCase(),
        gradeName: formData.gradeName.trim(),
        gradeLevel: Number(formData.gradeLevel),
        description: formData.description.trim() || null,
        isActive: formData.isActive,
      };

      const response = await GradeService.addOrUpdateGrade(payload);
      if (response.error) {
        showToast(response.error, "error");
      } else {
        showToast(isEditing ? "Grade updated successfully!" : "Grade added successfully!", "success");
        handleReset();
        fetchGrades();
      }
    } catch (error) {
      showToast("Failed to save grade", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setErrors({});
    setEditingId(null);
  };

  const handleEdit = (grade) => {
    setFormData({
      gradeCode: grade.gradeCode || "",
      gradeName: grade.gradeName || "",
      gradeLevel: String(grade.gradeLevel ?? ""),
      description: grade.description || "",
      isActive: grade.isActive,
    });
    setErrors({});
    setEditingId(grade.idGrade);
  };

  const nextLevel = grades.length ? Math.max(...grades.map((g) => g.gradeLevel || 0)) + 1 : 1;

  const columns = [
    { key: "gradeLevel", label: "Level #" },
    { key: "gradeCode", label: "Grade" },
    { key: "gradeName", label: "Level Name" },
    { key: "description", label: "Description", render: (value) => value || "-" },
    { key: "employeeCount", label: "Employees" },
    {
      key: "isActive",
      label: "Status",
      render: (_, row) => (
        <span className={`badge ${row.isActive ? "bg-label-success" : "bg-label-warning"}`}>
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    { key: "actions", label: "Action", headerStyle: { textAlign: "right" } },
  ];

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-lg-8 p-1">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between pb-3">
              <h5 className="m-0">List of Employee Grades</h5>
              <div className="list_menu">
                <div className="list_searchbox">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search"
                    maxLength={30}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                  <i className="bx bx-search"></i>
                </div>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center p-3">Loading...</div>
              ) : (
                <Grid
                  columns={columns}
                  data={filteredGrades}
                  onEditClick={(id) => {
                    const grade = grades.find((g) => g.idGrade === id);
                    if (grade) handleEdit(grade);
                  }}
                  idKey="idGrade"
                />
              )}
            </div>
          </div>
        </div>
        <div className="col-lg-4 p-1">
          <Card title={isEditing ? "Update Grade" : "Add Grade"}>
            <form onSubmit={handleSubmit}>
              <Input
                label="Grade Code * (e.g. G1)"
                name="gradeCode"
                value={formData.gradeCode}
                onChange={(e) => handleInputChange("gradeCode", e.target.value.toUpperCase().replace(/\s/g, ""))}
                maxLength="10"
                error={errors.gradeCode}
                isInvalid={!!errors.gradeCode}
              />
              <Input
                label="Level Name * (e.g. Entry Level)"
                name="gradeName"
                value={formData.gradeName}
                onChange={(e) => handleInputChange("gradeName", e.target.value)}
                maxLength="100"
                error={errors.gradeName}
                isInvalid={!!errors.gradeName}
              />
              <Input
                label={`Grade Level * (1 = lowest${isEditing ? "" : `, next is ${nextLevel}`})`}
                name="gradeLevel"
                value={formData.gradeLevel}
                onChange={(e) => handleInputChange("gradeLevel", e.target.value.replace(/\D/g, ""))}
                maxLength="3"
                error={errors.gradeLevel}
                isInvalid={!!errors.gradeLevel}
              />
              <div className="mb-2">
                <label className="form-label mb-1">Description</label>
                <textarea
                  className="form-control"
                  name="description"
                  rows={2}
                  maxLength={250}
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  style={{ marginTop: "7px" }}
                />
              </div>
              <Dropdown
                label="Status"
                name="isActive"
                options={[
                  { value: "true", label: "Active" },
                  { value: "false", label: "Inactive" },
                ]}
                value={String(formData.isActive)}
                onChange={(e) => handleInputChange("isActive", e.target.value === "true")}
              />
              <div className="mt-3 text-center">
                <button type="submit" className="btn btn-primary px-4 me-2" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : isEditing ? "Update" : "Submit"}
                </button>
                <Button type="button" className="btn btn-outline-secondary px-4" onClick={handleReset}>
                  Reset
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Grades;
