import { redirect } from "next/navigation";
import { getCurrentUser, isStaff, isFounder } from "@/lib/permissions";
import { getAssignment } from "@/actions/assignment";
import { Badge } from "@/components/ui/Badge";
import { formatDate, getDisplayName } from "@/lib/utils";
import { SubmissionForm } from "./SubmissionForm";
import { SubmissionsList } from "./SubmissionsList";

export default async function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const assignment = await getAssignment(id);
  if (!assignment) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl">Assignment not found</h1>
      </div>
    );
  }

  const userSubmission = assignment.submissions.find((s) => s.authorId === user.id);
  const now = new Date();
  const isOverdue = now > assignment.dueDate;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl mb-2">{assignment.title}</h1>
        <div className="flex items-center gap-3">
          <p className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
            Due {formatDate(assignment.dueDate)}
          </p>
          {isOverdue ? (
            <Badge variant="error">Overdue</Badge>
          ) : (
            <Badge variant="warning">Open</Badge>
          )}
        </div>
      </div>

      <div className="card">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Description</h3>
            <p style={{ whiteSpace: "pre-wrap", color: "var(--color-foreground-secondary)" }}>
              {assignment.description}
            </p>
          </div>

          {assignment.templateUrl && (
            <div>
              <a
                href={assignment.templateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm"
                style={{ color: "var(--color-primary)" }}
              >
                Download Template →
              </a>
            </div>
          )}
        </div>
      </div>

      {isFounder(user.role) && (
        <SubmissionForm assignmentId={id} existingSubmission={userSubmission} />
      )}

      {isStaff(user.role) && (
        <SubmissionsList submissions={assignment.submissions} isStaff={true} />
      )}

      {isFounder(user.role) && userSubmission && (
        <div className="card">
          <h3 className="text-lg font-medium mb-3">Your Submission</h3>
          <div className="space-y-3">
            {userSubmission.content && (
              <div>
                <p className="text-sm font-medium mb-1">Content</p>
                <p style={{ whiteSpace: "pre-wrap", color: "var(--color-foreground-secondary)" }}>
                  {userSubmission.content}
                </p>
              </div>
            )}

            {userSubmission.linkUrl && (
              <div>
                <p className="text-sm font-medium mb-1">Link</p>
                <a
                  href={userSubmission.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm"
                  style={{ color: "var(--color-primary)" }}
                >
                  {userSubmission.linkUrl}
                </a>
              </div>
            )}

            {userSubmission.feedbacks.length > 0 && (
              <div className="space-y-3 pt-3 border-t" style={{ borderColor: "var(--color-card-border)" }}>
                <p className="text-sm font-medium">Feedback</p>
                {userSubmission.feedbacks.map((feedback) => (
                  <div key={feedback.id} className="space-y-1">
                     <p className="text-sm font-medium">{getDisplayName(feedback.author)}</p>
                    <p className="text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
                      {feedback.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
