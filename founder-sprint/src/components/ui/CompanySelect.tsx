"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface CompanyOption {
  id: string;
  name: string;
  memberCount: number;
}

interface CompanySelectProps {
  companies: CompanyOption[];
  totalBatchMembers: number;
}

export function CompanySelect({ companies, totalBatchMembers }: CompanySelectProps) {
  const [mode, setMode] = useState<"batch" | "specific">("batch");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const selectAllRef = useRef<HTMLInputElement>(null);

  const allSelected = companies.length > 0 && selectedIds.size === companies.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < companies.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(companies.map((c) => c.id)));
    }
  }, [allSelected, companies]);

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const filteredCompanies = companies.filter((c) =>
    !search ? true : c.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedMemberCount = companies
    .filter((c) => selectedIds.has(c.id))
    .reduce((sum, c) => sum + c.memberCount, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "#2F2C26",
          fontFamily: '"BDO Grotesk", sans-serif',
        }}
      >
        Invite Target
      </label>

      {/* Radio pill tabs */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderRadius: 6,
          overflow: "hidden",
          border: "1px solid #e0e0e0",
        }}
      >
        <button
          type="button"
          onClick={() => setMode("batch")}
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: 13,
            fontWeight: 500,
            fontFamily: '"BDO Grotesk", sans-serif',
            border: "none",
            cursor: "pointer",
            backgroundColor: mode === "batch" ? "#1A1A1A" : "transparent",
            color: mode === "batch" ? "#FFFFFF" : "#666666",
            transition: "background-color 0.15s, color 0.15s",
          }}
        >
          Entire Batch ({totalBatchMembers})
        </button>
        <button
          type="button"
          onClick={() => setMode("specific")}
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: 13,
            fontWeight: 500,
            fontFamily: '"BDO Grotesk", sans-serif',
            border: "none",
            borderLeft: "1px solid #e0e0e0",
            cursor: "pointer",
            backgroundColor: mode === "specific" ? "#1A1A1A" : "transparent",
            color: mode === "specific" ? "#FFFFFF" : "#666666",
            transition: "background-color 0.15s, color 0.15s",
          }}
        >
          Specific Companies
        </button>
      </div>

      {/* Company checkbox list */}
      {mode === "specific" && (
        <div
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          {/* Search input */}
          <div style={{ padding: 8, borderBottom: "1px solid #e0e0e0" }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies..."
              style={{
                width: "100%",
                padding: "7px 10px",
                fontSize: 13,
                fontFamily: '"BDO Grotesk", sans-serif',
                border: "1px solid #e0e0e0",
                borderRadius: 4,
                outline: "none",
                color: "#2F2C26",
                boxSizing: "border-box" as const,
                backgroundColor: "#FFFFFF",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#1A1A1A")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e0e0e0")}
            />
          </div>

          {/* Select All */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              cursor: "pointer",
              borderBottom: "1px solid #e0e0e0",
              backgroundColor: "#fafafa",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: '"BDO Grotesk", sans-serif',
              color: "#2F2C26",
            }}
          >
            <input
              type="checkbox"
              ref={selectAllRef}
              checked={allSelected}
              onChange={handleSelectAll}
              style={{ width: 16, height: 16, accentColor: "#1A1A1A", cursor: "pointer" }}
            />
            Select All ({companies.length} companies)
          </label>

          {/* Scrollable list */}
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {filteredCompanies.length === 0 && (
              <div style={{ padding: "12px 16px", fontSize: 13, color: "#999999", textAlign: "center", fontFamily: '"BDO Grotesk", sans-serif' }}>
                No companies match "{search}"
              </div>
            )}
            {filteredCompanies.map((company) => (
              <label
                key={company.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 12px",
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: '"BDO Grotesk", sans-serif',
                  color: "#2F2C26",
                  borderBottom: "1px solid #f0f0f0",
                  transition: "background-color 0.1s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(company.id)}
                  onChange={() => handleToggle(company.id)}
                  style={{ width: 16, height: 16, accentColor: "#1A1A1A", cursor: "pointer" }}
                />
                <span style={{ flex: 1 }}>{company.name}</span>
                <span
                  style={{
                    fontSize: 11,
                    color: "#999999",
                    fontFamily: '"Roboto Mono", monospace',
                    backgroundColor: "#f5f5f5",
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  {company.memberCount} {company.memberCount === 1 ? "member" : "members"}
                </span>
              </label>
            ))}
          </div>

          {/* Summary */}
          {selectedIds.size > 0 && (
            <div
              style={{
                padding: "8px 12px",
                fontSize: 12,
                color: "#666666",
                fontFamily: '"BDO Grotesk", sans-serif',
                borderTop: "1px solid #e0e0e0",
                backgroundColor: "#fafafa",
              }}
            >
              {selectedIds.size} {selectedIds.size === 1 ? "company" : "companies"} selected ({selectedMemberCount} {selectedMemberCount === 1 ? "member" : "members"})
            </div>
          )}
        </div>
      )}

      {/* Hidden inputs for FormData */}
      {mode === "specific" &&
        Array.from(selectedIds).map((id) => (
          <input key={id} type="hidden" name="groupIds" value={id} />
        ))}
    </div>
  );
}
