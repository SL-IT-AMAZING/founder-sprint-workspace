"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface BatchOption {
  id: string;
  name: string;
  status: string;
  memberCount: number;
}

interface BatchSelectProps {
  batches: BatchOption[];
  selectedBatchIds?: string[];
  required?: boolean;
}

export function BatchSelect({ batches, selectedBatchIds, required = true }: BatchSelectProps) {
  const hasPreselection = selectedBatchIds && selectedBatchIds.length > 0;
  const [mode, setMode] = useState<"all" | "specific">(hasPreselection ? "specific" : "all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    hasPreselection ? new Set(selectedBatchIds) : new Set()
  );
  const [search, setSearch] = useState("");
  const selectAllRef = useRef<HTMLInputElement>(null);

  const allSelected = batches.length > 0 && selectedIds.size === batches.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < batches.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(batches.map((b) => b.id)));
    }
  }, [allSelected, batches]);

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

  const filteredBatches = batches.filter((b) =>
    !search ? true : b.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedMemberCount = batches
    .filter((b) => selectedIds.has(b.id))
    .reduce((sum, b) => sum + b.memberCount, 0);

  const totalMembers = batches.reduce((sum, b) => sum + b.memberCount, 0);

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
        Batch Assignment
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
          onClick={() => setMode("all")}
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: 13,
            fontWeight: 500,
            fontFamily: '"BDO Grotesk", sans-serif',
            border: "none",
            cursor: "pointer",
            backgroundColor: mode === "all" ? "#1A1A1A" : "transparent",
            color: mode === "all" ? "#FFFFFF" : "#666666",
            transition: "background-color 0.15s, color 0.15s",
          }}
        >
          All Batches ({batches.length})
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
          Specific Batches
        </button>
      </div>

      {/* Batch checkbox list */}
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
              placeholder="Search batches..."
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
            Select All ({batches.length} batches)
          </label>

          {/* Scrollable list */}
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {filteredBatches.length === 0 && (
              <div style={{ padding: "12px 16px", fontSize: 13, color: "#999999", textAlign: "center", fontFamily: '"BDO Grotesk", sans-serif' }}>
                No batches match &quot;{search}&quot;
              </div>
            )}
            {filteredBatches.map((batch) => (
              <label
                key={batch.id}
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
                  checked={selectedIds.has(batch.id)}
                  onChange={() => handleToggle(batch.id)}
                  style={{ width: 16, height: 16, accentColor: "#1A1A1A", cursor: "pointer" }}
                />
                <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                  {batch.name}
                  <span
                    style={{
                      display: "inline-block",
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: batch.status === "active" ? "#22c55e" : "#9ca3af",
                    }}
                    title={batch.status}
                  />
                </span>
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
                  {batch.memberCount} {batch.memberCount === 1 ? "member" : "members"}
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
              {selectedIds.size} {selectedIds.size === 1 ? "batch" : "batches"} selected ({selectedMemberCount} {selectedMemberCount === 1 ? "member" : "members"})
            </div>
          )}

          {/* Validation hint */}
          {required && selectedIds.size === 0 && (
            <div
              style={{
                padding: "6px 12px",
                fontSize: 12,
                color: "#ef4444",
                fontFamily: '"BDO Grotesk", sans-serif',
                borderTop: "1px solid #e0e0e0",
              }}
            >
              At least 1 batch must be selected
            </div>
          )}
        </div>
      )}

      {/* Hidden inputs for FormData */}
      {mode === "all"
        ? batches.map((b) => (
            <input key={b.id} type="hidden" name="batchIds" value={b.id} />
          ))
        : Array.from(selectedIds).map((id) => (
            <input key={id} type="hidden" name="batchIds" value={id} />
          ))}
    </div>
  );
}
