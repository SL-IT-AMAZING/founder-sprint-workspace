import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, isStaff } from "@/lib/permissions";
import { getSubmission } from "@/actions/assignment";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { formatDate, getDisplayName } from "@/lib/utils";
import { FeedbackForm } from "./FeedbackForm";
import { StatusControl } from "./StatusControl";
import type { SubmissionStatus } from "@/actions/assignment";

type ChecklistItem = { label: string; checked: boolean };

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
    default: return "Pending Review";
  }
}

export default async function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const submission = await getSubmission(id);
  if (!submission) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl">Submission not found</h1>
      </div>
    );
  }

  const canProvideFeedback = isStaff(user.role) || submission.authorId === user.id;
  const currentStatus = (submission.status || "pending") as SubmissionStatus;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
        <Link href="/submissions">Submissions</Link>
        <span>/</span>
        <span>{submission.assignment.title}</span>
      </div>

      <div className="card">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl mb-2">{submission.assignment.title}</h1>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusBadgeVariant(currentStatus)}>
                  {getStatusLabel(currentStatus)}
                </Badge>
                {submission.isLate && <Badge variant="error">Late Submission</Badge>}
              </div>
            </div>
            {isStaff(user.role) && (
              <StatusControl submissionId={id} currentStatus={currentStatus} />
            )}
          </div>

          <div className="pt-3 border-t" style={{ borderColor: "var(--color-card-border)" }}>
            <p className="text-sm font-medium mb-2" style={{ color: "var(--color-foreground-muted)" }}>
              Submitted by
            </p>
            <div className="flex items-center gap-3">
              <Avatar
                src={submission.author.profileImage}
                name={getDisplayName(submission.author)}
                size={40}
              />
              <div>
                <p className="font-medium">{getDisplayName(submission.author)}</p>
                <p className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                  {formatDate(submission.submittedAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t" style={{ borderColor: "var(--color-card-border)" }}>
            <p className="text-sm font-medium mb-2" style={{ color: "var(--color-foreground-muted)" }}>
              Submission
            </p>

            {submission.content && (
              <div className="mb-3">
                <p className="text-sm font-medium mb-1">Content</p>
                <p style={{ whiteSpace: "pre-wrap", color: "var(--color-foreground-secondary)" }}>
                  {submission.content}
                </p>
              </div>
            )}

            {submission.linkUrl && (
              <div>
                <p className="text-sm font-medium mb-1">Link</p>
                <a
                  href={submission.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm inline-flex items-center gap-1"
                  style={{ color: "var(--color-primary)" }}
                >
                  <span>{submission.linkUrl}</span>
                  <span>→</span>
                </a>
              </div>
            )}

            {submission.versions.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium" style={{ color: "var(--color-foreground-muted)" }}>
                  Previous Versions
                </p>
                {submission.versions.map((version) => (
                  <div key={version.id} className="p-3 rounded-lg" style={{ backgroundColor: "var(--color-background)" }}>
                    <p className="text-xs mb-1" style={{ color: "var(--color-foreground-muted)" }}>
                      v{version.version} • {formatDate(version.createdAt)}
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

          {submission.feedbacks.length > 0 && (
            <div className="pt-3 border-t" style={{ borderColor: "var(--color-card-border)" }}>
              <p className="text-sm font-medium mb-3" style={{ color: "var(--color-foreground-muted)" }}>
                Feedback
              </p>
              <div className="space-y-3">
                {submission.feedbacks.filter((feedback) => !feedback.parentId).map((feedback) => {
                  const checklistItems = feedback.checklist as ChecklistItem[] | null;
                  return (
                    <div key={feedback.id} className="p-3 rounded-lg" style={{ backgroundColor: "var(--color-background)" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar
                          src={feedback.author.profileImage}
                          name={getDisplayName(feedback.author)}
                          size={24}
                        />
                        <p className="text-sm font-medium">{getDisplayName(feedback.author)}</p>
                        <span className="text-xs" style={{ color: "var(--color-foreground-muted)" }}>
                          {formatDate(feedback.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm" style={{ whiteSpace: "pre-wrap", color: "var(--color-foreground-secondary)" }}>
                        {feedback.content}
                      </p>
                      {checklistItems && checklistItems.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {checklistItems.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <span style={{ color: item.checked ? "var(--color-success)" : "var(--color-foreground-muted)" }}>
                                {item.checked ? "✓" : "○"}
                              </span>
                              <span style={{ color: item.checked ? "var(--color-foreground-secondary)" : "var(--color-foreground-muted)", textDecoration: item.checked ? "none" : "none" }}>
                                {item.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {(feedback.replies || []).length > 0 && (
                        <div className="mt-3 pl-3 space-y-2 border-l" style={{ borderColor: "var(--color-card-border)" }}>
                          {feedback.replies?.map((reply) => (
                            <div key={reply.id} className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Avatar
                                  src={reply.author.profileImage}
                                  name={getDisplayName(reply.author)}
                                  size={20}
                                />
                                <p className="text-sm font-medium">{getDisplayName(reply.author)}</p>
                                <span className="text-xs" style={{ color: "var(--color-foreground-muted)" }}>
                                  {formatDate(reply.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm" style={{ whiteSpace: "pre-wrap", color: "var(--color-foreground-secondary)" }}>
                                {reply.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {canProvideFeedback && (
                        <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--color-card-border)" }}>
                          <FeedbackForm
                            submissionId={id}
                            parentId={feedback.id}
                            submitLabel="Reply"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {isStaff(user.role) && (
        <div className="card">
          <h3 className="text-lg font-medium mb-3">Add Feedback</h3>
          <FeedbackForm
            submissionId={id}
            reviewCriteria={submission.assignment.reviewCriteria ?? []}
          />
        </div>
      )}
    </div>
  );
}
