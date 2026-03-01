"use client";

import { useState, useTransition } from "react";
import { addEducation, updateEducation, deleteEducation } from "@/actions/profile";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Education {
  id: string;
  institution: string;
  degree: string | null;
  fieldOfStudy: string | null;
  startYear: number | null;
  endYear: number | null;
}

interface EducationSectionProps {
  education: Education[];
}

export function EducationSection({ education }: EducationSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formData, setFormData] = useState({
    institution: "",
    degree: "",
    fieldOfStudy: "",
    startYear: "",
    endYear: "",
  });

  const resetForm = () => {
    setFormData({
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startYear: "",
      endYear: "",
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (edu: Education) => {
    setFormData({
      institution: edu.institution,
      degree: edu.degree || "",
      fieldOfStudy: edu.fieldOfStudy || "",
      startYear: edu.startYear?.toString() || "",
      endYear: edu.endYear?.toString() || "",
    });
    setEditingId(edu.id);
    setShowForm(true);
    setConfirmDeleteId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const data = {
        institution: formData.institution,
        degree: formData.degree || undefined,
        fieldOfStudy: formData.fieldOfStudy || undefined,
        startYear: formData.startYear ? parseInt(formData.startYear, 10) : undefined,
        endYear: formData.endYear ? parseInt(formData.endYear, 10) : undefined,
      };

      const result = editingId
        ? await updateEducation(editingId, data)
        : await addEducation(data);

      if (result.success) {
        setMessage({
          type: "success",
          text: editingId ? "Education updated successfully!" : "Education added successfully!",
        });
        resetForm();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: result.error });
      }
    });
  };

  const handleDelete = async (id: string) => {
    setMessage(null);
    startTransition(async () => {
      const result = await deleteEducation(id);

      if (result.success) {
        setMessage({ type: "success", text: "Education deleted successfully!" });
        setConfirmDeleteId(null);
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: result.error });
      }
    });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 className="text-lg font-medium">Education</h2>
        {!showForm && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowForm(true)}
            disabled={isPending}
          >
            Add Education
          </Button>
        )}
      </div>

      {message && (
        <div
          className="px-4 py-3 rounded"
          style={{
            backgroundColor: message.type === "success" ? "#d4edda" : "#f8d7da",
            color: message.type === "success" ? "#155724" : "#721c24",
            border: `1px solid ${message.type === "success" ? "#28a745" : "#C62828"}`,
            marginBottom: 16,
          }}
        >
          {message.text}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #e0e0e0",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <h3 className="text-md font-medium" style={{ marginBottom: 16 }}>
                {editingId ? "Edit Education" : "Add Education"}
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Input
                  label="Institution"
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  required
                  maxLength={200}
                  placeholder="University or school name"
                />

                <Input
                  label="Degree"
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  maxLength={200}
                  placeholder="e.g., Bachelor of Science"
                />

                <Input
                  label="Field of Study"
                  value={formData.fieldOfStudy}
                  onChange={(e) => setFormData({ ...formData, fieldOfStudy: e.target.value })}
                  maxLength={200}
                  placeholder="e.g., Computer Science"
                />

                <div style={{ display: "flex", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <Input
                      label="Start Year"
                      type="number"
                      value={formData.startYear}
                      onChange={(e) => setFormData({ ...formData, startYear: e.target.value })}
                      min={1900}
                      max={2100}
                      placeholder="e.g., 2015"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Input
                      label="End Year"
                      type="number"
                      value={formData.endYear}
                      onChange={(e) => setFormData({ ...formData, endYear: e.target.value })}
                      min={1900}
                      max={2100}
                      placeholder="e.g., 2019"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetForm}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={isPending} disabled={isPending}>
                {isPending ? "Saving..." : editingId ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </form>
      )}

      <div>
        {education.length === 0 && !showForm && (
          <p style={{ color: "#666666", fontSize: 14, textAlign: "center", padding: "24px 0" }}>
            No education added yet.
          </p>
        )}

        {education.map((edu, index) => (
          <div
            key={edu.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 16,
              padding: "16px 0",
              borderBottom: index === education.length - 1 ? "none" : "1px solid #f1eadd",
            }}
          >
            {/* Icon Block */}
            <div
              style={{
                width: 48,
                height: 48,
                backgroundColor: "#f1eadd",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 20, fontWeight: 700, color: "#2F2C26" }}>
                {edu.institution.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Content Stack */}
            <div style={{ flex: 1 }}>
              <h3 style={{ fontWeight: 500, fontSize: 15, color: "#2F2C26", marginBottom: 2 }}>
                {edu.institution}
              </h3>
              {(edu.degree || edu.fieldOfStudy) && (
                <p style={{ fontSize: 14, color: "#666666", marginBottom: 2 }}>
                  {edu.degree}
                  {edu.degree && edu.fieldOfStudy && " in "}
                  {edu.fieldOfStudy}
                </p>
              )}
              <p style={{ fontSize: 13, color: "#999999" }}>
                {edu.startYear || "N/A"} - {edu.endYear || "N/A"}
              </p>
            </div>

            {/* Right Action */}
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              {confirmDeleteId === edu.id ? (
                <>
                  <button
                    onClick={() => handleDelete(edu.id)}
                    disabled={isPending}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#C62828",
                      cursor: isPending ? "not-allowed" : "pointer",
                      fontSize: 14,
                      fontWeight: 500,
                      padding: "4px 8px",
                    }}
                  >
                    Confirm Delete
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    disabled={isPending}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#666666",
                      cursor: isPending ? "not-allowed" : "pointer",
                      fontSize: 14,
                      fontWeight: 500,
                      padding: "4px 8px",
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleEdit(edu)}
                    disabled={isPending}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#1A1A1A",
                      cursor: isPending ? "not-allowed" : "pointer",
                      fontSize: 14,
                      fontWeight: 500,
                      padding: "4px 8px",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(edu.id)}
                    disabled={isPending}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#1A1A1A",
                      cursor: isPending ? "not-allowed" : "pointer",
                      fontSize: 14,
                      fontWeight: 500,
                      padding: "4px 8px",
                    }}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
