import { getCurrentUser, isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelativeTime, formatDate, getRoleDisplayName, getDisplayName } from "@/lib/utils";
import { getBatchStatusLabel, getBatchStatusVariant, isBatchActive } from "@/lib/batch-utils";
import Link from "next/link";

export const revalidate = 30;

export default async function DashboardPage() {
  // Get current user and redirect if not authenticated
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const now = new Date();

  // Fetch all dashboard data in parallel
  const [
    openQuestionsCount,
    upcomingEventsCount,
    pendingAssignmentsCount,
    officeHoursCount,
    teamMembersCount,
    recentQuestions,
    upcomingEvents,
    activeAssignments,
    batchInfo,
  ] = await Promise.all([
    // Stats
    prisma.question.count({
      where: { batchId: user.batchId, status: "open" },
    }),
    prisma.event.count({
      where: { batchId: user.batchId, startTime: { gt: now }, eventType: { not: "office_hour" } },
    }),
    prisma.assignment.count({
      where: { batchId: user.batchId, dueDate: { gt: now } },
    }),
    prisma.event.count({
      where: { batchId: user.batchId, startTime: { gt: now }, eventType: "office_hour" },
    }),
    prisma.groupMember.findMany({
      where: {
        group: {
          members: {
            some: { userId: user.id },
          },
        },
      },
      select: { userId: true },
      distinct: ['userId'],
    }).then(members => members.length),
    // Recent Questions (last 5)
    prisma.question.findMany({
      where: { batchId: user.batchId },
      include: {
        author: { select: { id: true, name: true, email: true, profileImage: true } },
        _count: { select: { answers: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // Upcoming Events (next 3)
    prisma.event.findMany({
      where: {
        batchId: user.batchId,
        startTime: { gt: now },
      },
      orderBy: { startTime: "asc" },
      take: 3,
    }),
    // Active Assignments (next 5 with closest deadlines)
    prisma.assignment.findMany({
      where: {
        batchId: user.batchId,
        dueDate: { gt: now },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    // Batch info
    prisma.batch.findUnique({
      where: { id: user.batchId },
    }),
  ]);

  const userIsAdmin = isAdmin(user.role);

  return (
    <div className="py-8 space-y-8" style={{ backgroundColor: "var(--color-background)", minHeight: "100vh" }}>
      <div className="main-container space-y-8">
        {/* Batch Info Banner */}
        {batchInfo && (
          <div
            className="rounded-lg p-6"
            style={{
              backgroundColor: "#2F2C26",
              color: "white",
            }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-medium mb-2">
                  {batchInfo.name}
                </h2>
                <p className="text-sm opacity-80">
                  {formatDate(batchInfo.startDate)} - {formatDate(batchInfo.endDate)}
                </p>
              </div>
              <div>
                <Badge variant={getBatchStatusVariant(batchInfo)}>
                  {getBatchStatusLabel(batchInfo)}
                </Badge>
              </div>
            </div>
            {!isBatchActive(batchInfo) && (
              <p className="text-sm mt-2" style={{ opacity: 0.8 }}>
                This batch has ended. Content is read-only.
              </p>
            )}
          </div>
        )}

        {/* Welcome Header */}
        <div className="space-y-2">
          <h1 style={{ fontSize: "32px", fontWeight: 600, fontFamily: '"Libre Caslon Condensed", Georgia, serif', color: "var(--color-foreground)" }}>
            Welcome back, {getDisplayName(user)}
          </h1>
          <Badge variant="role">{getRoleDisplayName(user.role)}</Badge>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Open Questions" count={openQuestionsCount} href="/questions" icon="question" />
          <StatCard title="Upcoming Events" count={upcomingEventsCount} href="/events" icon="calendar" />
          <StatCard
            title="Active Assignments"
            count={pendingAssignmentsCount}
            href="/assignments"
            icon="clipboard"
            preview={
              activeAssignments.length > 0 && (
                <div className="mt-4 pt-4 border-t space-y-2" style={{ borderColor: "var(--color-card-border)" }}>
                  <p className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>
                    Upcoming Deadlines:
                  </p>
                  {activeAssignments.slice(0, 3).map((assignment) => (
                    <div key={assignment.id} className="text-xs" style={{ color: "var(--color-foreground-secondary)" }}>
                      <span className="font-medium">{assignment.title}</span>
                      <span className="mx-1">•</span>
                      <span>{formatDate(assignment.dueDate)}</span>
                    </div>
                  ))}
                  {activeAssignments.length > 3 && (
                    <p className="text-xs" style={{ color: "var(--color-foreground-secondary)" }}>
                      +{activeAssignments.length - 3} more
                    </p>
                  )}
                </div>
              )
            }
          />
        </div>

        {/* Second Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Office Hours" count={officeHoursCount} href="/events?type=office_hour" icon="clock" />
          <StatCard title="Team Members" count={teamMembersCount} href="/groups" icon="users" />
        </div>

      {/* Recent Questions & Upcoming Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Questions Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium">
              Recent Questions
            </h2>
            <Link
              href="/questions"
              className="text-sm"
              style={{ color: "var(--color-foreground-secondary)" }}
            >
              View all
            </Link>
          </div>
          <div className="card space-y-0 divide-y" style={{ borderColor: "var(--color-border)" }}>
            {recentQuestions.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No questions yet"
                  description="Questions from your batch will appear here"
                />
              </div>
            ) : (
              recentQuestions.map((question) => (
                <Link
                  key={question.id}
                  href={`/questions/${question.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="space-y-2">
                    <h3 className="font-medium line-clamp-1">{question.title}</h3>
                    <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
                      <Avatar src={question.author.profileImage} name={getDisplayName(question.author)} size={24} />
                      <span>{getDisplayName(question.author)}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(question.createdAt)}</span>
                      <span>•</span>
                      <span>{question._count.answers} {question._count.answers === 1 ? "answer" : "answers"}</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Upcoming Events Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium">
              Upcoming Events
            </h2>
            <Link
              href="/events"
              className="text-sm"
              style={{ color: "var(--color-foreground-secondary)" }}
            >
              View all
            </Link>
          </div>
          <div className="card space-y-0 divide-y" style={{ borderColor: "var(--color-border)" }}>
            {upcomingEvents.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No upcoming events"
                  description="Events for your batch will appear here"
                />
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <div key={event.id} className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium line-clamp-1">{event.title}</h3>
                      <Badge variant="default">{getEventTypeName(event.eventType)}</Badge>
                    </div>
                    <p className="text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
                      {formatDate(event.startTime)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

        {/* Admin Quick Links */}
        {userIsAdmin && (
          <section className="space-y-4">
            <h2 className="text-xl font-medium" style={{ color: "var(--color-foreground)" }}>
              Admin Quick Links
            </h2>
            <div className="flex gap-3">
              <Link href="/admin/batches" className="btn btn-secondary">
                Manage Batches
              </Link>
              <Link href="/admin/users" className="btn btn-secondary">
                Manage Users
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  count,
  href,
  icon,
  preview,
}: {
  title: string;
  count: number;
  href: string;
  icon?: "question" | "calendar" | "clipboard" | "clock" | "users";
  preview?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg p-6 bg-white"
      style={{
        border: "1px solid var(--color-card-border)",
        borderRadius: "8px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
      }}
    >
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          {icon && <StatIcon type={icon} />}
          <p className="text-sm font-medium" style={{ color: "var(--color-foreground-secondary)" }}>
            {title}
          </p>
        </div>
        <p className="text-3xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--color-foreground)" }}>
          {count}
        </p>
      </div>
      {preview}
    </Link>
  );
}

// Stat Icon Component
function StatIcon({ type }: { type: "question" | "calendar" | "clipboard" | "clock" | "users" }) {
  const iconColor = "#1A1A1A";

  switch (type) {
    case "question":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke={iconColor} strokeWidth="2" />
          <path
            d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13"
            stroke={iconColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="17" r="1" fill={iconColor} />
        </svg>
      );
    case "calendar":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="4" width="18" height="18" rx="2" stroke={iconColor} strokeWidth="2" />
          <line x1="3" y1="10" x2="21" y2="10" stroke={iconColor} strokeWidth="2" />
          <line x1="8" y1="2" x2="8" y2="6" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="2" x2="16" y2="6" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "clipboard":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M16 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H8"
            stroke={iconColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="8" y="2" width="8" height="4" rx="1" stroke={iconColor} strokeWidth="2" />
          <line x1="9" y1="13" x2="15" y2="13" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
          <line x1="9" y1="17" x2="13" y2="17" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "clock":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke={iconColor} strokeWidth="2" />
          <path d="M12 6V12L16 14" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "users":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
            stroke={iconColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="9" cy="7" r="4" stroke={iconColor} strokeWidth="2" />
          <path
            d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13"
            stroke={iconColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88"
            stroke={iconColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

// Event Type Display Name
function getEventTypeName(type: string): string {
  const names: Record<string, string> = {
    one_off: "One-off",
    office_hour: "Office Hour",
    in_person: "In Person",
  };
  return names[type] || type;
}
