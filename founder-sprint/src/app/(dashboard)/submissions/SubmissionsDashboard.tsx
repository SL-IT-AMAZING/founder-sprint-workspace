"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, getDisplayName } from "@/lib/utils";

interface User {
  id: string;
  name: string | null;
  email: string;
  profileImage: string | null;
}

interface Assignment {
  id: string;
  title: string;
}

interface Feedback {
  id: string;
}

interface Submission {
  id: string;
  content: string | null;
  linkUrl: string | null;
  isLate: boolean;
  submittedAt: Date;
  author: User;
  assignment: Assignment;
  feedbacks: Feedback[];
}

interface SubmissionsDashboardProps {
  submissions: Submission[];
}

export function SubmissionsDashboard({ submissions }: SubmissionsDashboardProps) {
  const [selectedAssignment, setSelectedAssignment] = useState<string>("all");

  // Get unique assignments
  const assignments = Array.from(
    new Map(submissions.map((s) => [s.assignment.id, s.assignment])).values()
  );

  // Filter submissions
  const filteredSubmissions = selectedAssignment === "all"
    ? submissions
    : submissions.filter((s) => s.assignment.id === selectedAssignment);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: "32px", fontWeight: 600, fontFamily: '"Libre Caslon Condensed", Georgia, serif', color: "#2F2C26" }}>Submissions Dashboard</h1>
      </div>

      {/* Filter */}
      <div className="card">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Filter by Assignment:</label>
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
      </div>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <EmptyState
          title="No submissions yet"
          description={
            selectedAssignment === "all"
              ? "No submissions have been made yet."
              : "No submissions for this assignment yet."
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
                      <div className="space-y-1">
                        <p className="text-sm">{formatDate(submission.submittedAt)}</p>
                        {submission.isLate && (
                          <Badge variant="error" >Late</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={submission.feedbacks.length > 0 ? "success" : "warning"} >
                        {submission.feedbacks.length > 0 ? "Reviewed" : "Pending"}
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
