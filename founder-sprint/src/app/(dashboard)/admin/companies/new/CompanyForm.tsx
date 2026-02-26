"use client";

import { useState, useTransition, useRef } from "react";
import { createCompany, updateCompany } from "@/actions/company";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useRouter } from "next/navigation";

interface CompanyFormProps {
  initialData?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    website: string | null;
    industry: string | null;
    hqLocation: string | null;
    foundedYear: number | null;
    logoUrl: string | null;
    tags: string[];
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CompanyForm({ initialData }: CompanyFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [autoSlug, setAutoSlug] = useState(!initialData);
  const [logoUrl, setLogoUrl] = useState(initialData?.logoUrl || "");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleLogoUpload = async (file: File) => {
    setLogoError("");
    setLogoUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "company-logos");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (result.success && result.url) {
        setLogoUrl(result.url);
      } else {
        setLogoError(result.error || "Upload failed");
      }
    } catch {
      setLogoError("Upload failed. Please try again.");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleLogoUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleLogoUpload(file);
    } else {
      setLogoError("Please drop an image file (JPEG, PNG, GIF, or SVG)");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = initialData
        ? await updateCompany(initialData.id, formData)
        : await createCompany(formData);

      if (result.success) {
        router.push("/admin/companies");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card" style={{ maxWidth: "800px" }}>
        <h2 className="text-lg font-semibold mb-6">Company Information</h2>
        
        <div className="space-y-4">
          <Input
            label="Company Name"
            name="name"
            type="text"
            required
            placeholder="Acme Inc."
            value={name}
            onChange={(e) => {
              const nextName = e.target.value;
              setName(nextName);
              if (autoSlug) {
                setSlug(slugify(nextName));
              }
            }}
          />

          <div>
            <Input
              label="Slug"
              name="slug"
              type="text"
              required
              placeholder="acme-inc"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setAutoSlug(false);
              }}
            />
            <p className="text-xs mt-1" style={{ color: "#666" }}>
              URL-friendly identifier (auto-generated from name, but editable)
            </p>
          </div>

          <Textarea
            label="Description"
            name="description"
            placeholder="Brief description of the company..."
            rows={4}
            defaultValue={initialData?.description || ""}
          />

          <Input
            label="Website"
            name="website"
            type="url"
            placeholder="https://example.com"
            defaultValue={initialData?.website || ""}
          />

          <Input
            label="Industry"
            name="industry"
            type="text"
            placeholder="Technology, Healthcare, Finance, etc."
            defaultValue={initialData?.industry || ""}
          />

          <Input
            label="HQ Location"
            name="hqLocation"
            type="text"
            placeholder="San Francisco, CA"
            defaultValue={initialData?.hqLocation || ""}
          />

          <Input
            label="Founded Year"
            name="foundedYear"
            type="number"
            min={1800}
            max={2100}
            placeholder="2020"
            defaultValue={initialData?.foundedYear || ""}
          />

          {/* Logo Upload */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 500,
                marginBottom: "6px",
                color: "#2F2C26",
              }}
            >
              Company Logo
            </label>
            <input type="hidden" name="logoUrl" value={logoUrl} />
            <div
              onClick={() => !logoUploading && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: dragOver ? "2px dashed #1A1A1A" : "2px dashed #e0e0e0",
                borderRadius: "8px",
                padding: "24px",
                textAlign: "center",
                cursor: logoUploading ? "wait" : "pointer",
                backgroundColor: dragOver ? "#f5f5f0" : "#fefaf3",
                transition: "all 0.15s ease",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/svg+xml"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              {logoUrl ? (
                <div style={{ display: "flex", alignItems: "center", gap: "16px", justifyContent: "center" }}>
                  <img
                    src={logoUrl}
                    alt="Company logo"
                    style={{
                      width: "64px",
                      height: "64px",
                      objectFit: "contain",
                      borderRadius: "8px",
                      border: "1px solid #e0e0e0",
                      backgroundColor: "#fff",
                    }}
                  />
                  <div style={{ textAlign: "left" }}>
                    <p style={{ fontSize: "14px", color: "#2F2C26", fontWeight: 500 }}>
                      Logo uploaded
                    </p>
                    <p style={{ fontSize: "12px", color: "#999", marginTop: "2px" }}>
                      Click or drag to replace
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLogoUrl("");
                      }}
                      style={{
                        fontSize: "12px",
                        color: "#C62828",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        marginTop: "4px",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : logoUploading ? (
                <div>
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      border: "2px solid #e0e0e0",
                      borderTopColor: "#1A1A1A",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                      margin: "0 auto 8px",
                    }}
                  />
                  <p style={{ fontSize: "14px", color: "#666" }}>Uploading...</p>
                </div>
              ) : (
                <div>
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#999"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ margin: "0 auto 8px" }}
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p style={{ fontSize: "14px", color: "#2F2C26", fontWeight: 500 }}>
                    Click to upload or drag and drop
                  </p>
                  <p style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>
                    JPEG, PNG, GIF or SVG (max 2MB)
                  </p>
                </div>
              )}
            </div>
            {logoError && (
              <p style={{ fontSize: "12px", color: "#C62828", marginTop: "6px" }}>{logoError}</p>
            )}
          </div>

          <div>
            <Input
              label="Tags"
              name="tags"
              type="text"
              placeholder="saas, ai, b2b (comma-separated)"
              defaultValue={initialData?.tags.join(", ") || ""}
            />
            <p className="text-xs mt-1" style={{ color: "#666" }}>
              Separate multiple tags with commas
            </p>
          </div>
        </div>

        {error && (
          <div 
            className="mt-4 p-3 rounded-lg text-sm"
            style={{
              backgroundColor: "#fee2e2",
              border: "1px solid #fecaca",
              color: "#991b1b"
            }}
          >
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-6" style={{ borderTop: "1px solid #e0e0e0" }}>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            {initialData ? "Update Company" : "Create Company"}
          </Button>
        </div>
      </div>
    </form>
  );
}
