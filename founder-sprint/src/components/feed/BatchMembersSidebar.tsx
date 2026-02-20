"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { getBatchStatusLabel, getBatchStatusVariant } from "@/lib/batch-utils";
import { getDisplayName } from "@/lib/utils";
import type { BatchStatus } from "@/types";

interface BatchMember {
  user: {
    id: string;
    name: string | null;
    email: string;
    profileImage: string | null;
  };
  role: string;
  status: string;
}

interface BatchMembersSidebarProps {
  members: BatchMember[];
  batchName?: string;
  batchStatus?: BatchStatus;
  batchEndDate?: Date;
  currentUserId?: string;
}

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  mentor: "Mentor",
  founder: "Founder",
  co_founder: "Co-Founder",
};

const rolePriority: Record<string, number> = {
  super_admin: 0,
  admin: 1,
  mentor: 2,
  founder: 3,
  co_founder: 4,
};

export function BatchMembersSidebar({ members, batchName, batchStatus, batchEndDate, currentUserId }: BatchMembersSidebarProps) {
  const activeMembers = members
    .filter((m) => m.status === "active")
    .sort((a, b) => (rolePriority[a.role] ?? 99) - (rolePriority[b.role] ?? 99));

  const groupedMembers: Record<string, BatchMember[]> = {};
  activeMembers.forEach((member) => {
    const role = member.role;
    if (!groupedMembers[role]) {
      groupedMembers[role] = [];
    }
    groupedMembers[role].push(member);
  });

  const roleOrder = ["super_admin", "admin", "mentor", "founder", "co_founder"];

  return (
    <div
      className="card sticky top-4"
      style={{
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        border: "1px solid #e0e0e0",
        padding: "16px",
      }}
    >
      {/* Batch Info Card */}
      {batchName && (
        <div style={{
          marginBottom: "16px",
          paddingBottom: "16px",
          borderBottom: "1px solid var(--color-card-border, #e0e0e0)",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}>
            <h3 style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "var(--color-foreground, #2F2C26)",
              margin: 0,
              fontFamily: "var(--font-serif, Georgia, serif)",
            }}>
              {batchName}
            </h3>
            {batchStatus && batchEndDate && (
              <Badge variant={getBatchStatusVariant({ status: batchStatus, endDate: new Date(batchEndDate) })}>
                {getBatchStatusLabel({ status: batchStatus, endDate: new Date(batchEndDate) })}
              </Badge>
            )}
          </div>
          {batchEndDate && (
            <p style={{
              fontSize: "12px",
              color: "var(--color-foreground-muted, #999)",
              margin: "6px 0 0 0",
            }}>
              {new Date(batchEndDate) > new Date()
                ? `Ends ${new Date(batchEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                : `Ended ${new Date(batchEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
              }
            </p>
          )}
          <p style={{
            fontSize: "12px",
            color: "var(--color-foreground-muted, #999)",
            margin: "2px 0 0 0",
          }}>
            {activeMembers.length} active members
          </p>
        </div>
      )}

      <h3 className="font-medium mb-4" style={{ color: "var(--color-foreground)" }}>
        Members ({activeMembers.length})
      </h3>

      <div className="space-y-4">
        {roleOrder.map((role) => {
          const roleMembers = groupedMembers[role];
          if (!roleMembers || roleMembers.length === 0) return null;

          return (
            <div key={role}>
              <p
                className="text-xs font-medium uppercase mb-2"
                style={{ color: "var(--color-foreground-muted)" }}
              >
                {roleLabels[role] || role} ({roleMembers.length})
              </p>
               <div className="space-y-2">
                 {roleMembers.slice(0, 10).map((member) => (
                   <Link key={member.user.id} href={`/profile/${member.user.id}`} className="hover:bg-gray-50 rounded px-1 -mx-1" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                     <Avatar
                       src={member.user.profileImage}
                       name={getDisplayName(member.user)}
                       size={28}
                      />
                      <div className="text-sm truncate" style={{ maxWidth: "140px" }}>
                       {getDisplayName(member.user)}
                       {member.user.id === currentUserId && <span style={{ color: "var(--color-foreground-muted)" }}> (You)</span>}
                     </div>
                   </Link>
                 ))}
                {roleMembers.length > 10 && (
                  <p
                    className="text-xs"
                    style={{ color: "var(--color-foreground-muted)" }}
                  >
                    +{roleMembers.length - 10} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activeMembers.length === 0 && (
        <p className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
          No active members yet
        </p>
      )}
    </div>
  );
}
