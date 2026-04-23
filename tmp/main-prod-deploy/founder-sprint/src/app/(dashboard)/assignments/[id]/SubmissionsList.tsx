"use client";

import { useState, useTransition } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { addFeedback } from "@/actions/assignment";
import type { ChecklistItem } from "@/actions/assignment";
import { formatRelativeTime, getDisplayName } from "@/lib/utils";

interface User {
  id: string;
  name: string | null;
  email: string;
  profileImage: string | null;
}

interface Feedback {
  id: string;
  content: string;
  parentId: string | null;
  checklist?: unknown;
  createdAt: Date;
  author: User;
  replies?: Feedback[];
}

interface Submission {
  id: string;
  content: string | null;
  linkUrl: string | null;
  isLate: boolean;
  status: string;
  submittedAt: Date;
  author: User;
  feedbacks: Feedback[];
}

interface SubmissionsListProps {
  submissions: Submission[];
  isStaff: boolean;
  reviewCriteria?: string[];
}

function getStatusBadgeVariant(status: string): "warning" | "default" | "success" | "error" {
  switch (status) {
    case "approved": return "success";
    case "needs_revision": return "error";
    case "in_review": return "default";
    default: return "warning";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "approved": return "Approved";
    case "needs_revision": return "Needs Revision";
    case "in_review": return "In Review";
    default: return "Pending";
  }
}

export function SubmissionsList({ submissions, isStaff, reviewCriteria = [] }: SubmissionsListProps) {
  const [expandedSubmissions, setExpandedSubmissions] = useState<Set<string>>(new Set());
  const [feedbackContent, setFeedbackContent] = useState<Record<string, string>>({});
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [checklists, setChecklists] = useState<Record<string, ChecklistItem[]>>({});
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const toggleSubmission = (id: string) => {
    const newExpanded = new Set(expandedSubmissions);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
      if (reviewCriteria.length > 0 && !checklists[id]) {
        setChecklists((prev) => ({
          ...prev,
          [id]: reviewCriteria.map((label) => ({ label, checked: false })),
        }));
      }
    }
    setExpandedSubmissions(newExpanded);
  };

  const toggleChecklistItem = (submissionId: string, idx: number) => {
    setChecklists((prev) => ({
      ...prev,
      [submissionId]: (prev[submissionId] || []).map((item, i) =>
        i === idx ? { ...item, checked: !item.checked } : item
      ),
    }));
  };

  const handleAddFeedback = async (submissionId: string) => {
    const content = feedbackContent[submissionId];
    if (!content?.trim()) return;

    setError("");

    startTransition(async () => {
      const checklist = checklists[submissionId];
      const result = await addFeedback(
        submissionId,
        content,
        checklist && checklist.length > 0 ? checklist : undefined
      );
      if (result.success) {
        setFeedbackContent({ ...feedbackContent, [submissionId]: "" });
        if (reviewCriteria.length > 0) {
          setChecklists((prev) => ({
            ...prev,
            [submissionId]: reviewCriteria.map((label) => ({ label, checked: false })),
          }));
        }
      } else {
        setError(result.error);
      }
    });
  };

  const handleReply = async (submissionId: string, parentId: string) => {
    const content = replyContent[parentId];
    if (!content?.trim()) return;

    setError("");

    startTransition(async () => {
      const result = await addFeedback(submissionId, content, undefined, parentId);
      if (result.success) {
        setReplyContent((prev) => ({ ...prev, [parentId]: "" }));
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
        const submissionChecklist = checklists[submission.id] || [];

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
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(submission.status || "pending")}>
                    {getStatusLabel(submission.status || "pending")}
                  </Badge>
                  {submission.isLate && <Badge variant="error">Late</Badge>}
                </div>
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
                      {submission.feedbacks
                        .filter((feedback) => !feedback.parentId)
                        .map((feedback) => (
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

                          {(feedback.replies || []).length > 0 && (
                            <div className="pl-3 mt-2 space-y-2 border-l" style={{ borderColor: "var(--color-card-border)" }}>
                              {feedback.replies?.map((reply) => (
                                <div key={reply.id} className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium">{getDisplayName(reply.author)}</p>
                                    <p className="text-xs" style={{ color: "var(--color-foreground-muted)" }}>
                                      {formatRelativeTime(reply.createdAt)}
                                    </p>
                                  </div>
                                  <p className="text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
                                    {reply.content}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="pt-1">
                            <Textarea
                              placeholder="Reply to feedback..."
                              rows={2}
                              value={replyContent[feedback.id] || ""}
                              onChange={(e) =>
                                setReplyContent((prev) => ({ ...prev, [feedback.id]: e.target.value }))
                              }
                            />
                            <div className="flex justify-end mt-2">
                              <Button
                                size="sm"
                                onClick={() => handleReply(submission.id, feedback.id)}
                                loading={isPending}
                                disabled={!replyContent[feedback.id]?.trim()}
                              >
                                Reply
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {isStaff && (
                    <div className="space-y-2 pt-3 border-t" style={{ borderColor: "var(--color-card-border)" }}>
                      {submissionChecklist.length > 0 && (
                        <div className="space-y-1 mb-2">
                          <p className="text-sm font-medium" style={{ color: "var(--color-foreground-muted)" }}>
                            Review Criteria
                          </p>
                          {submissionChecklist.map((item, idx) => (
                            <label key={idx} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.checked}
                                onChange={() => toggleChecklistItem(submission.id, idx)}
                                className="rounded"
                              />
                              <span className="text-sm">{item.label}</span>
                            </label>
                          ))}
                        </div>
                      )}
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
