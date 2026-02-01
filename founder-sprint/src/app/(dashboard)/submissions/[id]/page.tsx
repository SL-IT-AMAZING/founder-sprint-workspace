import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, isStaff } from "@/lib/permissions";
import { getSubmission } from "@/actions/assignment";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { FeedbackForm } from "./FeedbackForm";

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

  const canProvideFeedback = isStaff(user.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
        <Link href="/submissions">Submissions</Link>
        <span>/</span>
        <span>{submission.assignment.title}</span>
      </div>

      <div className="card">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl mb-2">{submission.assignment.title}</h1>
              <div className="flex items-center gap-2">
                <Badge variant={submission.feedbacks.length > 0 ? "success" : "warning"}>
                  {submission.feedbacks.length > 0 ? "Reviewed" : "Pending Review"}
                </Badge>
                {submission.isLate && <Badge variant="error">Late Submission</Badge>}
              </div>
            </div>
          </div>

          {/* Submitter Info */}
          <div className="pt-3 border-t" style={{ borderColor: "var(--color-card-border)" }}>
            <p className="text-sm font-medium mb-2" style={{ color: "var(--color-foreground-muted)" }}>
              Submitted by
            </p>
            <div className="flex items-center gap-3">
              <Avatar
                src={submission.author.profileImage}
                name={submission.author.name}
                size={40}
              />
              <div>
                <p className="font-medium">{submission.author.name}</p>
                <p className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                  {formatDate(submission.submittedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Submission Content */}
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
          </div>

          {/* Feedback Section */}
          {submission.feedbacks.length > 0 && (
            <div className="pt-3 border-t" style={{ borderColor: "var(--color-card-border)" }}>
              <p className="text-sm font-medium mb-3" style={{ color: "var(--color-foreground-muted)" }}>
                Feedback
              </p>
              <div className="space-y-3">
                {submission.feedbacks.map((feedback) => (
                  <div key={feedback.id} className="p-3 rounded-lg" style={{ backgroundColor: "var(--color-background)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar
                        src={feedback.author.profileImage}
                        name={feedback.author.name}
                        size={24}
                      />
                      <p className="text-sm font-medium">{feedback.author.name}</p>
                      <span className="text-xs" style={{ color: "var(--color-foreground-muted)" }}>
                        {formatDate(feedback.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm" style={{ whiteSpace: "pre-wrap", color: "var(--color-foreground-secondary)" }}>
                      {feedback.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Feedback Form (Staff Only) */}
      {canProvideFeedback && (
        <div className="card">
          <h3 className="text-lg font-medium mb-3">Add Feedback</h3>
          <FeedbackForm submissionId={id} />
        </div>
      )}
    </div>
  );
}
