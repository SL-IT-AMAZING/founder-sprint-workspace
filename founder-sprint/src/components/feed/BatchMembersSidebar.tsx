"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { switchBatch } from "@/actions/batch-switcher";

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
  batches?: Array<{ batchId: string; batchName: string }>;
  currentBatchId?: string;
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

export function BatchMembersSidebar({ members, batches = [], currentBatchId = "" }: BatchMembersSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentBatch = batches.find((b) => b.batchId === currentBatchId);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSwitch = async (batchId: string) => {
    if (batchId === currentBatchId) {
      setIsOpen(false);
      return;
    }
    setSwitching(true);
    setIsOpen(false);
    const result = await switchBatch(batchId);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error);
    }
    setSwitching(false);
  };

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
      {/* Batch Switcher (only for multi-batch users) */}
      {batches.length > 1 && (
        <div ref={dropdownRef} style={{ position: "relative", marginBottom: "12px" }}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={switching}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "8px 10px",
              backgroundColor: "var(--color-background, #fefaf3)",
              border: "1px solid var(--color-card-border, #e0d6c8)",
              borderRadius: "6px",
              color: "var(--color-foreground, #2F2C26)",
              fontSize: "13px",
              fontFamily: "inherit",
              fontWeight: 500,
              cursor: switching ? "wait" : "pointer",
              opacity: switching ? 0.6 : 1,
              transition: "all 0.2s ease",
            }}
          >
            <span>{switching ? "Switching..." : currentBatch?.batchName || "Select Batch"}</span>
            <svg
              width="10"
              height="6"
              viewBox="0 0 10 6"
              fill="none"
              style={{
                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
                flexShrink: 0,
              }}
            >
              <path d="M1 1L5 5L9 1" stroke="var(--color-foreground, #2F2C26)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {isOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                right: 0,
                backgroundColor: "white",
                border: "1px solid var(--color-card-border, #e0d6c8)",
                borderRadius: "6px",
                padding: "4px 0",
                zIndex: 200,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              }}
            >
              {batches.map((batch) => {
                const isCurrent = batch.batchId === currentBatchId;
                return (
                  <button
                    key={batch.batchId}
                    onClick={() => handleSwitch(batch.batchId)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      width: "100%",
                      padding: "8px 12px",
                      border: "none",
                      background: "none",
                      color: isCurrent ? "var(--color-accent, #1A1A1A)" : "var(--color-foreground, #2F2C26)",
                      fontSize: "13px",
                      fontFamily: "inherit",
                      cursor: "pointer",
                      textAlign: "left" as const,
                      fontWeight: isCurrent ? 500 : 400,
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.04)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <span style={{ width: "14px", flexShrink: 0, color: "var(--color-accent, #1A1A1A)", fontSize: "12px" }}>{isCurrent ? "✓" : ""}</span>
                    <span>{batch.batchName}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

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
