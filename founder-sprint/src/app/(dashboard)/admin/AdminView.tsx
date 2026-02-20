"use client";

import { useState } from "react";
import { BatchList } from "./batches/BatchList";
import { UserManagement } from "./users/UserManagement";
import type { BatchStatus } from "@/types";

interface Batch {
  id: string;
  name: string;
  description: string | null;
  status: BatchStatus;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  _count: {
    userBatches: number;
  };
}

interface AdminViewProps {
  batches: Batch[];
}

type AdminTab = "batches" | "users";

export function AdminView({ batches }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("batches");

  const tabs: { id: AdminTab; label: string }[] = [
    { id: "batches", label: "Batch Management" },
    { id: "users", label: "User Management" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif">Admin</h1>
      </div>

      <div className="flex gap-2 border-b" style={{ borderColor: "var(--color-card-border)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              color: activeTab === tab.id ? "var(--color-accent)" : "var(--color-foreground-secondary)",
              marginBottom: "-1px",
              background: "none",
              border: "none",
              borderBottomWidth: "2px",
              borderBottomStyle: "solid",
              borderBottomColor: activeTab === tab.id ? "var(--color-accent)" : "transparent",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "batches" && <BatchList batches={batches} />}
      {activeTab === "users" && (
        <UserManagement
          batches={batches.map((b) => ({ id: b.id, name: b.name, status: b.status, endDate: b.endDate }))}
        />
      )}
    </div>
  );
}
