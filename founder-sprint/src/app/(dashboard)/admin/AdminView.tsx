"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import { BatchList } from "./batches/BatchList";
import { UserManagement } from "./users/UserManagement";
import { CompanyList } from "./companies/CompanyList";
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

interface Company {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  industry: string | null;
  hqLocation: string | null;
  foundedYear: number | null;
  logoUrl: string | null;
  tags: string[];
  memberCount: number;
  memberAvatars: Array<string | null>;
}

interface AdminViewProps {
  batches: Batch[];
  companies: Company[];
}

type AdminTab = "batches" | "users" | "companies";

const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  {
    id: "batches",
    label: "Batches",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    id: "users",
    label: "Users",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: "companies",
    label: "Companies",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
        <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
        <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
        <path d="M10 6h4" />
        <path d="M10 10h4" />
        <path d="M10 14h4" />
        <path d="M10 18h4" />
      </svg>
    ),
  },
];

export function AdminView({ batches, companies }: AdminViewProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const rawTab = searchParams.get("tab");
  const activeTab: AdminTab =
    rawTab === "users" || rawTab === "companies" ? rawTab : "batches";

  const setActiveTab = useCallback(
    (tab: AdminTab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "batches") {
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const totalMembers = batches.reduce((sum, b) => sum + b._count.userBatches, 0);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 600,
            fontFamily: '"Libre Caslon Condensed", Georgia, serif',
            color: "#2F2C26",
            marginBottom: "6px",
          }}
        >
          Admin
        </h1>
        <p style={{ fontSize: "14px", color: "#666666" }}>
          Manage batches, users, and companies
        </p>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          marginBottom: "28px",
          borderBottom: "1px solid #e0e0e0",
          paddingBottom: "0px",
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count =
            tab.id === "batches"
              ? batches.length
              : tab.id === "companies"
                ? companies.length
                : totalMembers;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "10px 16px",
                fontSize: "13px",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "#1A1A1A" : "#666666",
                background: "none",
                border: "none",
                borderBottom: isActive ? "2px solid #1A1A1A" : "2px solid transparent",
                marginBottom: "-1px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ display: "flex", opacity: isActive ? 1 : 0.6 }}>
                {tab.icon}
              </span>
              {tab.label}
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  fontFamily: '"Roboto Mono", monospace',
                  padding: "1px 7px",
                  borderRadius: "10px",
                  backgroundColor: isActive ? "#1A1A1A" : "#f0f0f0",
                  color: isActive ? "#FFFFFF" : "#999999",
                  lineHeight: "1.5",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "batches" && <BatchList batches={batches} />}
      {activeTab === "users" && (
        <UserManagement
          batches={batches.map((b) => ({
            id: b.id,
            name: b.name,
            status: b.status,
            endDate: b.endDate,
          }))}
        />
      )}
      {activeTab === "companies" && (
        <CompanyList initialCompanies={companies} />
      )}
    </div>
  );
}
