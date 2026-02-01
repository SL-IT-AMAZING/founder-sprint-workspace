import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import { getSession } from "@/actions/session";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const session = await getSession(id);
  if (!session) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl">Session not found</h1>
      </div>
    );
  }

  const isUserAdmin = isAdmin(user.role);
  const isPastSession = new Date(session.sessionDate) < new Date();

  return (
    <div className="space-y-6">
      <Link href="/sessions" className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
        <span>←</span>
        <span>Back to Sessions</span>
      </Link>

      <div className="card">
        <div className="space-y-4">
          {/* Session Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl mb-2">{session.title}</h1>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant={isPastSession ? "default" : "success"}>
                  {isPastSession ? "Past Session" : "Upcoming"}
                </Badge>
              </div>
            </div>
            {isUserAdmin && (
              <Link href={`/sessions/${id}/edit`}>
                <Button variant="secondary" size="sm">
                  Edit Session
                </Button>
              </Link>
            )}
          </div>

          {/* Session Details */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--color-foreground-muted)" }}>
                Date & Time
              </p>
              <p className="text-base">{formatDate(session.sessionDate)}</p>
            </div>

            {session.description && (
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: "var(--color-foreground-muted)" }}>
                  Description
                </p>
                <p className="text-base" style={{ whiteSpace: "pre-wrap" }}>
                  {session.description}
                </p>
              </div>
            )}

            {/* Resources */}
            {(session.slidesUrl || session.recordingUrl) && (
              <div className="pt-3 border-t" style={{ borderColor: "var(--color-card-border)" }}>
                <p className="text-sm font-medium mb-2" style={{ color: "var(--color-foreground-muted)" }}>
                  Resources
                </p>
                <div className="space-y-2">
                  {session.slidesUrl && (
                    <div>
                      <a
                        href={session.slidesUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm inline-flex items-center gap-1"
                        style={{ color: "var(--color-primary)" }}
                      >
                        <span>View Slides</span>
                        <span>→</span>
                      </a>
                    </div>
                  )}
                  {session.recordingUrl && (
                    <div>
                      <a
                        href={session.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm inline-flex items-center gap-1"
                        style={{ color: "var(--color-primary)" }}
                      >
                        <span>Watch Recording</span>
                        <span>→</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
