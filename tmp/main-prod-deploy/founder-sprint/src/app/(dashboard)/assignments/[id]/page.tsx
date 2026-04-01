import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, isStaff, isFounder, isAdmin } from "@/lib/permissions";
import { getAssignment, getAssignmentNonSubmitters } from "@/actions/assignment";
import { Badge } from "@/components/ui/Badge";
import { formatDate, getDisplayName } from "@/lib/utils";
import { SubmissionForm } from "./SubmissionForm";
import { SubmissionsList } from "./SubmissionsList";
import { SendReminderButton } from "./SendReminderButton";
import { DeleteAssignmentButton } from "./DeleteAssignmentButton";

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

  const [userSubmission, nonSubmitters] = await Promise.all([
    Promise.resolve(assignment.submissions.find((s) => s.authorId === user.id)),
    isStaff(user.role) ? getAssignmentNonSubmitters(id) : Promise.resolve([]),
  ]);
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
          {(assignment.targetCompanyIds?.length || 0) > 0 && (
            <Badge variant="default">
              {assignment.targetCompanyIds.length} specific compan{assignment.targetCompanyIds.length > 1 ? "ies" : "y"}
            </Badge>
          )}
          {isAdmin(user.role) && (
            <DeleteAssignmentButton assignmentId={id} assignmentTitle={assignment.title} />
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
        <div className="space-y-4">
          {nonSubmitters.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between gap-3 mb-2">
                <h3 className="text-lg font-medium">Non-submitters ({nonSubmitters.length})</h3>
                <SendReminderButton assignmentId={id} />
              </div>
              <div className="space-y-1">
                {nonSubmitters.map((person) => (
                  <p key={person.id} className="text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
                    {getDisplayName(person)} ({person.email})
                  </p>
                ))}
              </div>
            </div>
          )}
          <SubmissionsList
            submissions={assignment.submissions}
            isStaff={true}
            reviewCriteria={assignment.reviewCriteria ?? []}
          />
        </div>
      )}

      {isFounder(user.role) && userSubmission && (
        <div className="card">
          <h3 className="text-lg font-medium mb-3">Your Submission</h3>
          <div className="space-y-3">
            <Link href={`/submissions/${userSubmission.id}`} className="text-sm" style={{ color: "var(--color-primary)" }}>
              Open full feedback thread →
            </Link>
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
                {userSubmission.feedbacks.filter((feedback) => !feedback.parentId).map((feedback) => (
                  <div key={feedback.id} className="space-y-1">
                     <p className="text-sm font-medium">{getDisplayName(feedback.author)}</p>
                    <p className="text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
                      {feedback.content}
                    </p>
                    {(feedback.replies || []).length > 0 && (
                      <div className="pl-3 border-l space-y-1" style={{ borderColor: "var(--color-card-border)" }}>
                        {feedback.replies?.map((reply) => (
                          <div key={reply.id}>
                            <p className="text-xs font-medium">{getDisplayName(reply.author)}</p>
                            <p className="text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
                              {reply.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
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
