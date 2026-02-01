"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/actions/profile";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

interface ProfileFormProps {
  initialData: {
    name: string;
    email: string;
    jobTitle: string;
    company: string;
    bio: string;
    profileImage: string;
  };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [charCount, setCharCount] = useState(initialData.bio.length);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateProfile(formData);

      if (result.success) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: result.error });
      }
    });
  };

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCharCount(e.target.value.length);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-lg font-medium">Edit Profile</h2>

      {message && (
        <div
          className="px-4 py-3 rounded"
          style={{
            backgroundColor: message.type === "success" ? "var(--color-success-light, #d4edda)" : "var(--color-error-light, #f8d7da)",
            color: message.type === "success" ? "var(--color-success-dark, #155724)" : "var(--color-error-dark, #721c24)",
            border: `1px solid ${message.type === "success" ? "var(--color-success, #28a745)" : "var(--color-error)"}`,
          }}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        {/* Email (read-only) */}
        <Input
          label="Email"
          type="email"
          value={initialData.email}
          disabled
          style={{
            backgroundColor: "var(--color-background-secondary, #f5f5f5)",
            cursor: "not-allowed",
          }}
        />

        {/* Name */}
        <Input
          label="Name"
          name="name"
          type="text"
          defaultValue={initialData.name}
          required
          maxLength={100}
          placeholder="Enter your name"
        />

        {/* Job Title */}
        <Input
          label="Job Title"
          name="jobTitle"
          type="text"
          defaultValue={initialData.jobTitle}
          maxLength={100}
          placeholder="e.g., CEO, Product Manager"
        />

        {/* Company */}
        <Input
          label="Company"
          name="company"
          type="text"
          defaultValue={initialData.company}
          maxLength={100}
          placeholder="Enter your company name"
        />

        {/* Bio */}
        <div>
          <Textarea
            label="Bio"
            name="bio"
            defaultValue={initialData.bio}
            maxLength={500}
            placeholder="Tell us about yourself..."
            onChange={handleBioChange}
            rows={4}
          />
          <p
            className="text-xs mt-1 text-right"
            style={{
              color: charCount > 500 ? "var(--color-error)" : "var(--color-foreground-muted)",
            }}
          >
            {charCount}/500 characters
          </p>
        </div>

        {/* Profile Image URL */}
        <Input
          label="Profile Image URL"
          name="profileImage"
          type="url"
          defaultValue={initialData.profileImage}
          placeholder="https://example.com/image.jpg"
        />
        <p className="text-xs" style={{ color: "var(--color-foreground-muted)", marginTop: -8 }}>
          Enter a URL to your profile image, or leave blank to use default avatar.
        </p>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" loading={isPending} disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
