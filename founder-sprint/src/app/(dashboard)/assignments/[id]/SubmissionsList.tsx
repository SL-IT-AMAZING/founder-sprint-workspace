"use client";

import { useState, useTransition } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { addFeedback } from "@/actions/assignment";
import { formatRelativeTime, getInitials, getDisplayName } from "@/lib/utils";

interface User {
  id: string;
  name: string | null;
  email: string;
  profileImage: string | null;
}

interface Feedback {
  id: string;
  content: string;
  createdAt: Date;
  author: User;
}

interface Submission {
  id: string;
  content: string | null;
  linkUrl: string | null;
  isLate: boolean;
  submittedAt: Date;
  author: User;
  feedbacks: Feedback[];
}

interface SubmissionsListProps {
  submissions: Submission[];
  isStaff: boolean;
}

export function SubmissionsList({ submissions, isStaff }: SubmissionsListProps) {
  const [expandedSubmissions, setExpandedSubmissions] = useState<Set<string>>(new Set());
  const [feedbackContent, setFeedbackContent] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const toggleSubmission = (id: string) => {
    const newExpanded = new Set(expandedSubmissions);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSubmissions(newExpanded);
  };

  const handleAddFeedback = async (submissionId: string) => {
    const content = feedbackContent[submissionId];
    if (!content?.trim()) return;

    setError("");

    startTransition(async () => {
      const result = await addFeedback(submissionId, content);
      if (result.success) {
        setFeedbackContent({ ...feedbackContent, [submissionId]: "" });
      } else {
        setError(result.error);
      }
    });
  };

  if (submissions.length === 0) {
    return (
      <div className="card">
        <p style={{ color: "var(--color-foreground-secondary)" }}>No submissions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Submissions ({submissions.length})</h3>

      {error && (
        <div className="form-error p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {submissions.map((submission) => {
        const isExpanded = expandedSubmissions.has(submission.id);

        return (
          <div key={submission.id} className="card">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Avatar
                    src={submission.author.profileImage}
                    name={getDisplayName(submission.author)}
                  />
                  <div>
                    <p className="font-medium">{getDisplayName(submission.author)}</p>
                    <p className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                      {formatRelativeTime(submission.submittedAt)}
                    </p>
                  </div>
                </div>
                {submission.isLate && <Badge variant="error">Late</Badge>}
              </div>

              {isExpanded && (
                <>
                  {submission.content && (
                    <div className="pt-2">
                      <p style={{ whiteSpace: "pre-wrap" }}>{submission.content}</p>
                    </div>
                  )}

                  {submission.linkUrl && (
                    <div>
                      <a
                        href={submission.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm"
                        style={{ color: "var(--color-primary)" }}
                      >
                        View Submission Link →
                      </a>
                    </div>
                  )}

                  {submission.feedbacks.length > 0 && (
                    <div className="space-y-3 pt-3 border-t" style={{ borderColor: "var(--color-card-border)" }}>
                      <p className="text-sm font-medium">Feedback</p>
                      {submission.feedbacks.map((feedback) => (
                        <div key={feedback.id} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{getDisplayName(feedback.author)}</p>
                            <p className="text-xs" style={{ color: "var(--color-foreground-muted)" }}>
                              {formatRelativeTime(feedback.createdAt)}
                            </p>
                          </div>
                          <p className="text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
                            {feedback.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {isStaff && (
                    <div className="space-y-2 pt-3 border-t" style={{ borderColor: "var(--color-card-border)" }}>
                      <Textarea
                        placeholder="Add feedback..."
                        rows={3}
                        value={feedbackContent[submission.id] || ""}
                        onChange={(e) =>
                          setFeedbackContent({ ...feedbackContent, [submission.id]: e.target.value })
                        }
                      />
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          onClick={() => handleAddFeedback(submission.id)}
                          loading={isPending}
                          disabled={!feedbackContent[submission.id]?.trim()}
                        >
                          Add Feedback
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              <button
                onClick={() => toggleSubmission(submission.id)}
                className="text-sm"
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--color-primary)",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {isExpanded ? "Hide details" : "View details"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
