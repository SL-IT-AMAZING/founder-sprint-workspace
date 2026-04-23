"use client";

import { useState, useTransition } from "react";
import { addExperience, updateExperience, deleteExperience } from "@/actions/profile";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

interface Experience {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  location: string | null;
}

interface ExperienceSectionProps {
  experiences: Experience[];
}

export function ExperienceSection({ experiences }: ExperienceSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formData, setFormData] = useState({
    company: "",
    title: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: "",
    location: "",
  });

  const resetForm = () => {
    setFormData({
      company: "",
      title: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      description: "",
      location: "",
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (exp: Experience) => {
    setFormData({
      company: exp.company,
      title: exp.title,
      startDate: exp.startDate.split("T")[0],
      endDate: exp.endDate ? exp.endDate.split("T")[0] : "",
      isCurrent: exp.isCurrent,
      description: exp.description || "",
      location: exp.location || "",
    });
    setEditingId(exp.id);
    setShowForm(true);
    setConfirmDeleteId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const data = {
        ...formData,
        endDate: formData.isCurrent ? undefined : formData.endDate || undefined,
      };

      const result = editingId
        ? await updateExperience(editingId, data)
        : await addExperience(data);

      if (result.success) {
        setMessage({
          type: "success",
          text: editingId ? "Experience updated successfully!" : "Experience added successfully!",
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
      const result = await deleteExperience(id);

      if (result.success) {
        setMessage({ type: "success", text: "Experience deleted successfully!" });
        setConfirmDeleteId(null);
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: result.error });
      }
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 className="text-lg font-medium">Experience</h2>
        {!showForm && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowForm(true)}
            disabled={isPending}
          >
            Add Experience
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
                {editingId ? "Edit Experience" : "Add Experience"}
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Input
                  label="Company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  required
                  maxLength={200}
                  placeholder="Company name"
                />

                <Input
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  maxLength={200}
                  placeholder="Your position"
                />

                <Input
                  label="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  maxLength={200}
                  placeholder="e.g., San Francisco, CA"
                />

                <div style={{ display: "flex", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <Input
                      label="Start Date"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Input
                      label="End Date"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      disabled={formData.isCurrent}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    id="isCurrent"
                    checked={formData.isCurrent}
                    onChange={(e) =>
                      setFormData({ ...formData, isCurrent: e.target.checked, endDate: "" })
                    }
                    style={{ width: 16, height: 16, cursor: "pointer" }}
                  />
                  <label htmlFor="isCurrent" style={{ fontSize: 14, cursor: "pointer" }}>
                    I currently work here
                  </label>
                </div>

                <Textarea
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your role and achievements..."
                  rows={4}
                />
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
        {experiences.length === 0 && !showForm && (
          <p style={{ color: "#666666", fontSize: 14, textAlign: "center", padding: "24px 0" }}>
            No experience added yet.
          </p>
        )}

        {experiences.map((exp, index) => (
          <div
            key={exp.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 16,
              padding: "16px 0",
              borderBottom: index === experiences.length - 1 ? "none" : "1px solid #f1eadd",
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
                {exp.company.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Content Stack */}
            <div style={{ flex: 1 }}>
              <h3 style={{ fontWeight: 500, fontSize: 15, color: "#2F2C26", marginBottom: 2 }}>
                {exp.title}
              </h3>
              <p style={{ fontSize: 14, color: "#666666", marginBottom: 2 }}>
                {exp.company}
                {exp.location && ` · ${exp.location}`}
              </p>
              <p style={{ fontSize: 13, color: "#999999" }}>
                {formatDate(exp.startDate)} -{" "}
                {exp.isCurrent ? "Present" : exp.endDate ? formatDate(exp.endDate) : "N/A"}
              </p>
              {exp.description && (
                <p style={{ fontSize: 14, color: "#2F2C26", marginTop: 8, whiteSpace: "pre-wrap" }}>
                  {exp.description}
                </p>
              )}
            </div>

            {/* Right Action */}
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              {confirmDeleteId === exp.id ? (
                <>
                  <button
                    onClick={() => handleDelete(exp.id)}
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
                    onClick={() => handleEdit(exp)}
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
                    onClick={() => setConfirmDeleteId(exp.id)}
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
