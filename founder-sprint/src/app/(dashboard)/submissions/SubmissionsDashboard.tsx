"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { PageCategoryLabel } from "@/components/layout/PageCategoryLabel";
import { formatDate, getDisplayName } from "@/lib/utils";
import { getAssignmentNonSubmitters, sendAssignmentDeadlineReminders } from "@/actions/assignment";
import { useToast } from "@/hooks/useToast";

interface User {
  id: string;
  name: string | null;
  email: string;
  profileImage: string | null;
}

interface Assignment {
  id: string;
  title: string;
  dueDate?: Date;
  batch?: { id: string; name: string };
  targetCompanyIds?: string[];
}

interface Feedback {
  id: string;
}

interface Submission {
  id: string;
  content: string | null;
  linkUrl: string | null;
  isLate: boolean;
  status: string;
  submittedAt: Date;
  author: User;
  assignment: Assignment;
  feedbacks: Feedback[];
}

interface SubmissionsDashboardProps {
  submissions: Submission[];
  assignments: Assignment[];
}

type StatusFilter = "all" | "pending" | "in_review" | "approved" | "needs_revision";

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

export function SubmissionsDashboard({ submissions, assignments }: SubmissionsDashboardProps) {
  const [selectedAssignment, setSelectedAssignment] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("all");
  const [selectedBatch, setSelectedBatch] = useState<string>("all");
  const [selectedLateFilter, setSelectedLateFilter] = useState<"all" | "late" | "on_time">("all");
  const [selectedFeedbackFilter, setSelectedFeedbackFilter] = useState<"all" | "with_feedback" | "without_feedback">("all");
  const [showDueThisWeekOnly, setShowDueThisWeekOnly] = useState(false);
  const [nonSubmittersAssignmentId, setNonSubmittersAssignmentId] = useState<string>("all");
  const [nonSubmitters, setNonSubmitters] = useState<User[]>([]);
  const [nonSubmittersError, setNonSubmittersError] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const batches = Array.from(
    new Map(
      submissions
        .filter((submission) => submission.assignment.batch)
        .map((submission) => [submission.assignment.batch!.id, submission.assignment.batch!])
    ).values()
  );

  const filteredSubmissions = submissions.filter((s) => {
    const matchesAssignment = selectedAssignment === "all" || s.assignment.id === selectedAssignment;
    const matchesStatus = selectedStatus === "all" || (s.status || "pending") === selectedStatus;
    const matchesBatch = selectedBatch === "all" || s.assignment.batch?.id === selectedBatch;
    const matchesLateness =
      selectedLateFilter === "all" ||
      (selectedLateFilter === "late" ? s.isLate : !s.isLate);
    const hasFeedback = s.feedbacks.length > 0;
    const dueAt = s.assignment.dueDate ? new Date(s.assignment.dueDate) : null;
    const weekStart = new Date();
    const day = weekStart.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    weekStart.setDate(weekStart.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const matchesFeedback =
      selectedFeedbackFilter === "all" ||
      (selectedFeedbackFilter === "with_feedback" ? hasFeedback : !hasFeedback);
    const matchesDueThisWeek = !showDueThisWeekOnly || (dueAt !== null && dueAt >= weekStart && dueAt < weekEnd);

    return matchesAssignment && matchesStatus && matchesBatch && matchesLateness && matchesFeedback && matchesDueThisWeek;
  });

  const unreviewedCount = submissions.filter((submission) => submission.feedbacks.length === 0).length;

  const handleNeedsReviewFilter = () => {
    const isActive = selectedFeedbackFilter === "without_feedback";
    setSelectedFeedbackFilter(isActive ? "all" : "without_feedback");
    if (!isActive) {
      setSelectedStatus("all");
    }
  };

  const handleLoadNonSubmitters = () => {
    if (nonSubmittersAssignmentId === "all") {
      setNonSubmitters([]);
      setNonSubmittersError("");
      return;
    }

    startTransition(async () => {
      try {
        const result = await getAssignmentNonSubmitters(nonSubmittersAssignmentId);
        setNonSubmitters(result);
        setNonSubmittersError("");
      } catch {
        setNonSubmitters([]);
        setNonSubmittersError("Failed to load non-submitters.");
      }
    });
  };

  const handleSendReminder = () => {
    if (nonSubmittersAssignmentId === "all") return;

    startTransition(async () => {
      const result = await sendAssignmentDeadlineReminders(nonSubmittersAssignmentId);
      if (result.success) {
        toast.success(`Reminders sent to ${result.data.sent} founder${result.data.sent === 1 ? "" : "s"}`);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <PageCategoryLabel label="Batch" />
          <h1 style={{ fontSize: "32px", fontWeight: 600, fontFamily: '"Libre Caslon Condensed", Georgia, serif', color: "#2F2C26" }}>Submissions Dashboard</h1>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Button
            variant={selectedFeedbackFilter === "without_feedback" ? "primary" : "secondary"}
            onClick={handleNeedsReviewFilter}
          >
            Needs Review ({unreviewedCount})
          </Button>
          <Button
            variant={showDueThisWeekOnly ? "primary" : "secondary"}
            onClick={() => setShowDueThisWeekOnly((value) => !value)}
          >
            Due This Week
          </Button>
          {(selectedAssignment !== "all" || selectedStatus !== "all" || selectedBatch !== "all" || selectedLateFilter !== "all" || selectedFeedbackFilter !== "all") && (
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedAssignment("all");
                setSelectedStatus("all");
                setSelectedBatch("all");
                setSelectedLateFilter("all");
                setSelectedFeedbackFilter("all");
                setShowDueThisWeekOnly(false);
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Assignment:</label>
            <select
              value={selectedAssignment}
              onChange={(e) => setSelectedAssignment(e.target.value)}
              className="px-3 py-2 rounded-lg border text-sm"
              style={{
                borderColor: "var(--color-card-border)",
                backgroundColor: "var(--color-background)",
              }}
            >
              <option value="all">All Assignments</option>
              {assignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as StatusFilter)}
              className="px-3 py-2 rounded-lg border text-sm"
              style={{
                borderColor: "var(--color-card-border)",
                backgroundColor: "var(--color-background)",
              }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="needs_revision">Needs Revision</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Batch:</label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-3 py-2 rounded-lg border text-sm"
              style={{
                borderColor: "var(--color-card-border)",
                backgroundColor: "var(--color-background)",
              }}
            >
              <option value="all">All Batches</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>{batch.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Lateness:</label>
            <select
              value={selectedLateFilter}
              onChange={(e) => setSelectedLateFilter(e.target.value as "all" | "late" | "on_time")}
              className="px-3 py-2 rounded-lg border text-sm"
              style={{
                borderColor: "var(--color-card-border)",
                backgroundColor: "var(--color-background)",
              }}
            >
              <option value="all">All</option>
              <option value="on_time">On Time</option>
              <option value="late">Late</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Feedback:</label>
            <select
              value={selectedFeedbackFilter}
              onChange={(e) =>
                setSelectedFeedbackFilter(
                  e.target.value as "all" | "with_feedback" | "without_feedback"
                )
              }
              className="px-3 py-2 rounded-lg border text-sm"
              style={{
                borderColor: "var(--color-card-border)",
                backgroundColor: "var(--color-background)",
              }}
            >
              <option value="all">All</option>
              <option value="with_feedback">With Feedback</option>
              <option value="without_feedback">Without Feedback</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium">Non-submitters</h2>
            <p className="text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
              Select an assignment to list the intended recipients who still have not submitted.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={nonSubmittersAssignmentId}
              onChange={(e) => setNonSubmittersAssignmentId(e.target.value)}
              className="px-3 py-2 rounded-lg border text-sm"
              style={{
                borderColor: "var(--color-card-border)",
                backgroundColor: "var(--color-background)",
              }}
            >
              <option value="all">Select assignment</option>
              {assignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.title}
                </option>
              ))}
            </select>
            <Button onClick={handleLoadNonSubmitters} loading={isPending} disabled={nonSubmittersAssignmentId === "all"}>
              Load
            </Button>
            {nonSubmittersAssignmentId !== "all" && nonSubmitters.length > 0 && (
              <Button variant="secondary" onClick={handleSendReminder} loading={isPending}>
                Send Reminder
              </Button>
            )}
          </div>
        </div>

        {nonSubmittersError ? (
          <p className="text-sm" style={{ color: "var(--color-error)" }}>{nonSubmittersError}</p>
        ) : nonSubmittersAssignmentId === "all" ? (
          <p className="text-sm" style={{ color: "var(--color-foreground-secondary)" }}>Choose an assignment to see who is missing a submission.</p>
        ) : nonSubmitters.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-foreground-secondary)" }}>Everyone assigned to this assignment has submitted.</p>
        ) : (
          <div className="space-y-2">
            {nonSubmitters.map((user) => (
              <div key={user.id} className="flex items-center gap-3 rounded-lg border p-3" style={{ borderColor: "var(--color-card-border)", backgroundColor: "var(--color-background-secondary)" }}>
                <Avatar src={user.profileImage} name={getDisplayName(user)} size={32} />
                <div>
                  <p className="text-sm font-medium">{getDisplayName(user)}</p>
                  <p className="text-xs" style={{ color: "var(--color-foreground-secondary)" }}>{user.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {filteredSubmissions.length === 0 ? (
        <EmptyState
          title="No submissions found"
          description={
            selectedAssignment === "all" && selectedStatus === "all"
              ? "No submissions have been made yet."
              : "No submissions match the selected filters."
          }
        />
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--color-card-border)" }}>
                  <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: "var(--color-foreground-muted)" }}>
                    Student
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: "var(--color-foreground-muted)" }}>
                    Assignment
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: "var(--color-foreground-muted)" }}>
                    Batch
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: "var(--color-foreground-muted)" }}>
                    Submitted
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: "var(--color-foreground-muted)" }}>
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: "var(--color-foreground-muted)" }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((submission) => (
                  <tr
                    key={submission.id}
                    className="border-b"
                    style={{ borderColor: "var(--color-card-border)" }}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={submission.author.profileImage}
                          name={getDisplayName(submission.author)}
                          size={32}
                        />
                        <span className="text-sm font-medium">{getDisplayName(submission.author)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">{submission.assignment.title}</span>
                    </td>
                    <td className="py-3 px-4">
                      {submission.assignment.batch ? (
                        <span
                          style={{
                            fontSize: 11,
                            fontFamily: '"Roboto Mono", monospace',
                            backgroundColor: "#f0f0f0",
                            color: "#666666",
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {submission.assignment.batch.name}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: "#999999" }}>—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <p className="text-sm">{formatDate(submission.submittedAt)}</p>
                        {submission.isLate && (
                          <Badge variant="error">Late</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatusBadgeVariant(submission.status || "pending")}>
                        {getStatusLabel(submission.status || "pending")}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/submissions/${submission.id}`}
                        className="text-sm"
                        style={{ color: "var(--color-primary)" }}
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
