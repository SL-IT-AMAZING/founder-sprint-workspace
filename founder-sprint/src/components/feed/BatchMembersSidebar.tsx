"use client";

import { Avatar } from "@/components/ui/Avatar";

interface BatchMember {
  user: {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
  };
  role: string;
  status: string;
}

interface BatchMembersSidebarProps {
  members: BatchMember[];
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

export function BatchMembersSidebar({ members }: BatchMembersSidebarProps) {
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

  const roleOrder = ["admin", "mentor", "founder", "co_founder"];

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
      <h3 className="font-medium mb-4" style={{ color: "var(--color-foreground)" }}>
        Batch Members ({activeMembers.length})
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
                  <div key={member.user.id} className="flex items-center gap-2">
                    <Avatar
                      src={member.user.profileImage}
                      name={member.user.name}
                      size={28}
                    />
                    <span className="text-sm truncate" style={{ maxWidth: "140px" }}>
                      {member.user.name}
                    </span>
                  </div>
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
