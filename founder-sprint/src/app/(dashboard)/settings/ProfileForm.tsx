"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { updateExtendedProfile } from "@/actions/profile";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

interface ProfileFormProps {
  initialData: {
    name: string | null;
    email: string;
    jobTitle: string;
    company: string;
    bio: string;
    profileImage: string;
    headline: string;
    location: string;
    linkedinUrl: string;
    twitterUrl: string;
    websiteUrl: string;
  };
}

type SectionKey = "identity" | "work" | "bio" | "location" | "profileImage";

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [fields, setFields] = useState({
    name: initialData.name || "",
    headline: initialData.headline,
    jobTitle: initialData.jobTitle,
    company: initialData.company,
    bio: initialData.bio,
    location: initialData.location,
    linkedinUrl: initialData.linkedinUrl,
    twitterUrl: initialData.twitterUrl,
    websiteUrl: initialData.websiteUrl,
    profileImage: initialData.profileImage,
  });

  const [bioCharCount, setBioCharCount] = useState(initialData.bio.length);
  const [headlineCharCount, setHeadlineCharCount] = useState(initialData.headline.length);
  const [locationCharCount, setLocationCharCount] = useState(initialData.location.length);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleEdit = (section: SectionKey) => {
    setEditingSection(section);
    setMessage(null);
  };

  const handleCancel = (section: SectionKey) => {
    if (section === "identity") {
      setFields((prev) => ({
        ...prev,
        name: initialData.name || "",
        headline: initialData.headline,
      }));
      setHeadlineCharCount(initialData.headline.length);
    } else if (section === "work") {
      setFields((prev) => ({
        ...prev,
        jobTitle: initialData.jobTitle,
        company: initialData.company,
      }));
    } else if (section === "bio") {
      setFields((prev) => ({
        ...prev,
        bio: initialData.bio,
      }));
      setBioCharCount(initialData.bio.length);
    } else if (section === "location") {
      setFields((prev) => ({
        ...prev,
        location: initialData.location,
        linkedinUrl: initialData.linkedinUrl,
        twitterUrl: initialData.twitterUrl,
        websiteUrl: initialData.websiteUrl,
      }));
      setLocationCharCount(initialData.location.length);
    } else if (section === "profileImage") {
      setFields((prev) => ({
        ...prev,
        profileImage: initialData.profileImage,
      }));
    }
    setEditingSection(null);
  };

  const handleSave = async () => {
    setMessage(null);

    const formData = new FormData();
    formData.append("name", fields.name);
    formData.append("jobTitle", fields.jobTitle);
    formData.append("company", fields.company);
    formData.append("bio", fields.bio);
    formData.append("profileImage", fields.profileImage);
    formData.append("headline", fields.headline);
    formData.append("location", fields.location);
    formData.append("linkedinUrl", fields.linkedinUrl);
    formData.append("twitterUrl", fields.twitterUrl);
    formData.append("websiteUrl", fields.websiteUrl);

    startTransition(async () => {
      const result = await updateExtendedProfile(formData);

      if (result.success) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setEditingSection(null);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: result.error });
      }
    });
  };

  const updateField = (key: keyof typeof fields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className="px-4 py-3 rounded"
          style={{
            backgroundColor: message.type === "success" ? "#d4edda" : "#f8d7da",
            color: message.type === "success" ? "#155724" : "#721c24",
            border: `1px solid ${message.type === "success" ? "#28a745" : "#dc3545"}`,
          }}
        >
          {message.text}
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          minHeight: "32px",
          padding: "12px",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 500, color: "#666666", minWidth: 120 }}>Email:</span>
        <span style={{ fontSize: 14, color: "#2F2C26" }}>{initialData.email}</span>
      </div>

      <div
        style={{
          borderBottom: "1px solid #e0e0e0",
          paddingBottom: 20,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#2F2C26", margin: 0 }}>Identity</h3>
          {editingSection !== "identity" ? (
            <button
              type="button"
              onClick={() => handleEdit("identity")}
              style={{
                background: "none",
                border: "none",
                color: "#1A1A1A",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
                padding: "4px 8px",
              }}
            >
              Edit
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="ghost" size="sm" onClick={() => handleCancel("identity")} disabled={isPending}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} loading={isPending} disabled={isPending}>
                Save
              </Button>
            </div>
          )}
        </div>

        {editingSection === "identity" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input
              label="Name"
              value={fields.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
              maxLength={100}
              placeholder="Enter your name"
            />
            <div>
              <Input
                label="Headline"
                value={fields.headline}
                onChange={(e) => {
                  updateField("headline", e.target.value);
                  setHeadlineCharCount(e.target.value.length);
                }}
                maxLength={200}
                placeholder="e.g., Founder & CEO at TechCo"
              />
              <p
                className="text-xs mt-1 text-right"
                style={{
                  color: headlineCharCount > 200 ? "#dc3545" : "#666666",
                }}
              >
                {headlineCharCount}/200 characters
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 32 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#666666", minWidth: 120 }}>Name:</span>
              <span style={{ fontSize: 14, color: "#2F2C26" }}>{fields.name || <span style={{ color: "#999999" }}>Not set</span>}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 32 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#666666", minWidth: 120 }}>Headline:</span>
              <span style={{ fontSize: 14, color: "#2F2C26" }}>{fields.headline || <span style={{ color: "#999999" }}>Not set</span>}</span>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          borderBottom: "1px solid #e0e0e0",
          paddingBottom: 20,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#2F2C26", margin: 0 }}>Work</h3>
          {editingSection !== "work" ? (
            <button
              type="button"
              onClick={() => handleEdit("work")}
              style={{
                background: "none",
                border: "none",
                color: "#1A1A1A",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
                padding: "4px 8px",
              }}
            >
              Edit
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="ghost" size="sm" onClick={() => handleCancel("work")} disabled={isPending}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} loading={isPending} disabled={isPending}>
                Save
              </Button>
            </div>
          )}
        </div>

        {editingSection === "work" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input
              label="Job Title"
              value={fields.jobTitle}
              onChange={(e) => updateField("jobTitle", e.target.value)}
              maxLength={100}
              placeholder="e.g., CEO, Product Manager"
            />
            <Input
              label="Company"
              value={fields.company}
              onChange={(e) => updateField("company", e.target.value)}
              maxLength={100}
              placeholder="Enter your company name"
            />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 32 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#666666", minWidth: 120 }}>Job Title:</span>
              <span style={{ fontSize: 14, color: "#2F2C26" }}>{fields.jobTitle || <span style={{ color: "#999999" }}>Not set</span>}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 32 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#666666", minWidth: 120 }}>Company:</span>
              <span style={{ fontSize: 14, color: "#2F2C26" }}>{fields.company || <span style={{ color: "#999999" }}>Not set</span>}</span>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          borderBottom: "1px solid #e0e0e0",
          paddingBottom: 20,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#2F2C26", margin: 0 }}>Bio</h3>
          {editingSection !== "bio" ? (
            <button
              type="button"
              onClick={() => handleEdit("bio")}
              style={{
                background: "none",
                border: "none",
                color: "#1A1A1A",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
                padding: "4px 8px",
              }}
            >
              Edit
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="ghost" size="sm" onClick={() => handleCancel("bio")} disabled={isPending}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} loading={isPending} disabled={isPending}>
                Save
              </Button>
            </div>
          )}
        </div>

        {editingSection === "bio" ? (
          <div>
            <Textarea
              label="Bio"
              value={fields.bio}
              onChange={(e) => {
                updateField("bio", e.target.value);
                setBioCharCount(e.target.value.length);
              }}
              maxLength={500}
              placeholder="Tell us about yourself..."
              rows={4}
            />
            <p
              className="text-xs mt-1 text-right"
              style={{
                color: bioCharCount > 500 ? "#dc3545" : "#666666",
              }}
            >
              {bioCharCount}/500 characters
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, minHeight: 32 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#666666", minWidth: 120 }}>Bio:</span>
            <span style={{ fontSize: 14, color: "#2F2C26", flex: 1, whiteSpace: "pre-wrap" }}>
              {fields.bio || <span style={{ color: "#999999" }}>Not set</span>}
            </span>
          </div>
        )}
      </div>

      <div
        style={{
          borderBottom: "1px solid #e0e0e0",
          paddingBottom: 20,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#2F2C26", margin: 0 }}>Location & Links</h3>
          {editingSection !== "location" ? (
            <button
              type="button"
              onClick={() => handleEdit("location")}
              style={{
                background: "none",
                border: "none",
                color: "#1A1A1A",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
                padding: "4px 8px",
              }}
            >
              Edit
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="ghost" size="sm" onClick={() => handleCancel("location")} disabled={isPending}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} loading={isPending} disabled={isPending}>
                Save
              </Button>
            </div>
          )}
        </div>

        {editingSection === "location" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <Input
                label="Location"
                value={fields.location}
                onChange={(e) => {
                  updateField("location", e.target.value);
                  setLocationCharCount(e.target.value.length);
                }}
                maxLength={200}
                placeholder="e.g., San Francisco, CA"
              />
              <p
                className="text-xs mt-1 text-right"
                style={{
                  color: locationCharCount > 200 ? "#dc3545" : "#666666",
                }}
              >
                {locationCharCount}/200 characters
              </p>
            </div>
            <Input
              label="LinkedIn URL"
              value={fields.linkedinUrl}
              onChange={(e) => updateField("linkedinUrl", e.target.value)}
              type="url"
              placeholder="https://linkedin.com/in/..."
            />
            <Input
              label="Twitter URL"
              value={fields.twitterUrl}
              onChange={(e) => updateField("twitterUrl", e.target.value)}
              type="url"
              placeholder="https://twitter.com/..."
            />
            <Input
              label="Website URL"
              value={fields.websiteUrl}
              onChange={(e) => updateField("websiteUrl", e.target.value)}
              type="url"
              placeholder="https://..."
            />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 32 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#666666", minWidth: 120 }}>Location:</span>
              <span style={{ fontSize: 14, color: "#2F2C26" }}>{fields.location || <span style={{ color: "#999999" }}>Not set</span>}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 32 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#666666", minWidth: 120 }}>LinkedIn URL:</span>
              <span style={{ fontSize: 14, color: "#2F2C26", wordBreak: "break-all" }}>
                {fields.linkedinUrl || <span style={{ color: "#999999" }}>Not set</span>}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 32 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#666666", minWidth: 120 }}>Twitter URL:</span>
              <span style={{ fontSize: 14, color: "#2F2C26", wordBreak: "break-all" }}>
                {fields.twitterUrl || <span style={{ color: "#999999" }}>Not set</span>}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 32 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#666666", minWidth: 120 }}>Website URL:</span>
              <span style={{ fontSize: 14, color: "#2F2C26", wordBreak: "break-all" }}>
                {fields.websiteUrl || <span style={{ color: "#999999" }}>Not set</span>}
              </span>
            </div>
          </div>
        )}
      </div>

      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#2F2C26", margin: 0 }}>Profile Image</h3>
          {editingSection !== "profileImage" ? (
            <button
              type="button"
              onClick={() => handleEdit("profileImage")}
              style={{
                background: "none",
                border: "none",
                color: "#1A1A1A",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
                padding: "4px 8px",
              }}
            >
              Edit
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="ghost" size="sm" onClick={() => handleCancel("profileImage")} disabled={isPending}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} loading={isPending} disabled={isPending}>
                Save
              </Button>
            </div>
          )}
        </div>

        {editingSection === "profileImage" ? (
          <div>
            <Input
              label="Profile Image URL"
              value={fields.profileImage}
              onChange={(e) => updateField("profileImage", e.target.value)}
              type="url"
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-xs" style={{ color: "#666666", marginTop: 8 }}>
              Enter a URL to your profile image, or leave blank to use default avatar.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 32 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#666666", minWidth: 120 }}>Profile Image URL:</span>
            <span style={{ fontSize: 14, color: "#2F2C26", wordBreak: "break-all" }}>
              {fields.profileImage || <span style={{ color: "#999999" }}>Not set</span>}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
