"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { submitAssignment } from "@/actions/assignment";

interface SubmissionFormProps {
  assignmentId: string;
  existingSubmission?: {
    content: string | null;
    linkUrl: string | null;
    versions?: Array<{
      id: string;
      version: number;
      content: string | null;
      linkUrl: string | null;
      createdAt: Date;
    }>;
  };
}

export function SubmissionForm({ assignmentId, existingSubmission }: SubmissionFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await submitAssignment(assignmentId, formData);
      if (result.success) {
        setSuccess(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="card">
      <h3 className="text-lg font-medium mb-4">
        {existingSubmission ? "Update Submission" : "Submit Assignment"}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="form-error p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

        {success && (
          <div
            className="p-3 rounded-lg text-sm"
            style={{ backgroundColor: "var(--color-success-bg)", color: "var(--color-success)" }}
          >
            Submission saved successfully!
          </div>
        )}

        <Textarea
          name="content"
          label="Submission Text"
          placeholder="Your answer or notes"
          rows={6}
          defaultValue={existingSubmission?.content || ""}
        />

        <Input
          name="linkUrl"
          label="Link URL"
          type="url"
          placeholder="https://docs.google.com/document/..."
          defaultValue={existingSubmission?.linkUrl || ""}
        />

        <div className="flex justify-end">
          <Button type="submit" loading={isPending}>
            {existingSubmission ? "Update Submission" : "Submit"}
          </Button>
        </div>
      </form>

      {existingSubmission?.versions && existingSubmission.versions.length > 0 && (
        <div className="mt-6 pt-4 border-t space-y-3" style={{ borderColor: "var(--color-card-border)" }}>
          <h4 className="text-sm font-medium">Previous versions</h4>
          {existingSubmission.versions.map((version) => (
            <div key={version.id} className="rounded-lg p-3" style={{ backgroundColor: "var(--color-background)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--color-foreground-muted)" }}>
                v{version.version} • {new Date(version.createdAt).toLocaleString()}
              </p>
              {version.content && (
                <p className="text-sm" style={{ whiteSpace: "pre-wrap", color: "var(--color-foreground-secondary)" }}>
                  {version.content}
                </p>
              )}
              {version.linkUrl && (
                <a
                  href={version.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm"
                  style={{ color: "var(--color-primary)" }}
                >
                  {version.linkUrl}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
