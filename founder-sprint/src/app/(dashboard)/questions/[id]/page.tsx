import { getCurrentUser } from "@/lib/permissions";
import { getQuestion } from "@/actions/question";
import { redirect, notFound } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { formatDate, getRoleDisplayName, getDisplayName } from "@/lib/utils";
import { AnswerForm } from "./AnswerForm";
import { SummaryForm } from "./SummaryForm";
import { DeleteQuestionButton } from "./DeleteQuestionButton";
import Link from "next/link";

export default async function QuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const question = await getQuestion(id);

  if (!question) {
    notFound();
  }

  const canAnswer = user.role === "super_admin" || user.role === "admin" || user.role === "mentor";
  const canCreateSummary = user.role === "super_admin" || user.role === "admin";
  const canDelete = user.role === "super_admin" || user.role === "admin";
  const isClosed = question.status === "closed";

  return (
    <div className="container" style={{ maxWidth: 900 }}>
      {/* Back link */}
      <Link href="/questions" className="inline-flex items-center gap-2 mb-6 text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
        <span>←</span>
        <span>Back to Questions</span>
      </Link>

      {/* Question */}
      <div className="card mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-3xl font-bold">{question.title}</h1>
          <div className="flex items-center gap-2">
            <Badge variant={question.status === "open" ? "success" : "warning"}>
              {question.status === "open" ? "Open" : "Closed"}
            </Badge>
            {canDelete && <DeleteQuestionButton questionId={question.id} />}
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <Avatar src={question.author.profileImage} name={getDisplayName(question.author)} size={48} />
          <div>
            <p className="font-semibold">{getDisplayName(question.author)}</p>
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
              {question.author.jobTitle && <span>{question.author.jobTitle}</span>}
              {question.author.jobTitle && question.author.company && <span>•</span>}
              {question.author.company && <span>{question.author.company}</span>}
              {(question.author.jobTitle || question.author.company) && <span>•</span>}
              <span>{formatDate(question.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="prose" style={{ whiteSpace: "pre-wrap" }}>
          {question.content}
        </div>

        {question.attachments && question.attachments.length > 0 && (
          <div className="mt-6 pt-6 border-t" style={{ borderColor: "var(--color-card-border)" }}>
            <p className="text-sm font-medium mb-3" style={{ color: "var(--color-foreground-secondary)" }}>
              Attachments
            </p>
            <div className="space-y-2">
              {question.attachments.map((attachment: any) => (
                <a
                  key={attachment.id}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm hover:underline"
                  style={{ color: "var(--color-accent)" }}
                >
                  {attachment.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      {question.summary && (
        <div className="mb-6">
          <div
            className="card"
            style={{
              backgroundColor: "var(--color-success-bg)",
              borderLeft: "4px solid var(--color-success)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg font-semibold">Summary</span>
              <Badge variant="success">Closed</Badge>
            </div>
            <div className="prose mb-4" style={{ whiteSpace: "pre-wrap" }}>
              {question.summary.content}
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
              <Avatar src={question.summary.author.profileImage} name={getDisplayName(question.summary.author)} size={24} />
              <span>{getDisplayName(question.summary.author)}</span>
              <span>•</span>
              <span>{formatDate(question.summary.createdAt)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Answers */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">
          Answers ({question.answers.length})
        </h2>

        {question.answers.length === 0 ? (
          <div className="card text-center py-8" style={{ color: "var(--color-foreground-secondary)" }}>
            No answers yet. {canAnswer && "Be the first to answer!"}
          </div>
        ) : (
          <div className="space-y-4">
            {question.answers.map((answer) => (
              <div key={answer.id} className="card">
                <div className="flex items-start gap-3 mb-4">
                  <Avatar src={answer.author.profileImage} name={getDisplayName(answer.author)} size={40} />
                  <div className="flex-1">
                    <p className="font-semibold">{getDisplayName(answer.author)}</p>
                    <p className="text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
                      {formatDate(answer.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="prose" style={{ whiteSpace: "pre-wrap" }}>
                  {answer.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Answer Form (staff only, not closed) */}
      {canAnswer && !isClosed && (
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-4">Add Answer</h3>
          <AnswerForm questionId={question.id} />
        </div>
      )}

      {/* Summary Form (admin only, not closed) */}
      {canCreateSummary && !isClosed && (
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-4">Close with Summary</h3>
          <div className="card" style={{ backgroundColor: "var(--color-warning-bg)" }}>
            <p className="text-sm mb-4" style={{ color: "var(--color-foreground-secondary)" }}>
              Creating a summary will close this question and prevent further answers.
            </p>
            <SummaryForm questionId={question.id} />
          </div>
        </div>
      )}
    </div>
  );
}
