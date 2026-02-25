"use client";

import { useState, useTransition } from "react";
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
  const router = useRouter();

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

          <Input
            label="Logo URL"
            name="logoUrl"
            type="url"
            placeholder="https://example.com/logo.png"
            defaultValue={initialData?.logoUrl || ""}
          />

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
