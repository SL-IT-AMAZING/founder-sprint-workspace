"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { switchBatch } from "@/actions/batch-switcher";
import { getEffectiveBatchStatus } from "@/lib/batch-utils";
import { useToast } from "@/hooks/useToast";

interface BatchSwitcherProps {
  batches: Array<{ batchId: string; batchName: string; batchStatus?: string; endDate?: Date }>;
  currentBatchId: string;
}

export default function BatchSwitcher({ batches, currentBatchId }: BatchSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const ref = useRef<HTMLDivElement>(null);

  const currentBatch = batches.find((b) => b.batchId === currentBatchId);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  if (batches.length <= 1) return null;

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
      toast.error(result.error);
    }
    setSwitching(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: "var(--radius-sm, 4px)",
          padding: "4px 10px",
          color: "white",
          fontSize: "13px",
          fontFamily: "inherit",
          cursor: switching ? "wait" : "pointer",
          opacity: switching ? 0.6 : 1,
          whiteSpace: "nowrap" as const,
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
          }}
        >
          <path d="M1 1L5 5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            backgroundColor: "var(--color-card-bg, #ffffff)",
            border: "1px solid var(--color-card-border, #e0e0e0)",
            borderRadius: "8px",
            padding: "4px 0",
            minWidth: "200px",
            zIndex: 200,
            boxShadow: "var(--shadow-lg, 0 4px 12px rgba(0, 0, 0, 0.15))",
          }}
        >
          {batches.map((batch) => {
            const isCurrent = batch.batchId === currentBatchId;
            const effectiveStatus = batch.batchStatus && batch.endDate
              ? getEffectiveBatchStatus({ status: batch.batchStatus as "active" | "archived", endDate: new Date(batch.endDate) })
              : "active";
            const isEnded = effectiveStatus !== "active";
            return (
              <button
                key={batch.batchId}
                onClick={() => handleSwitch(batch.batchId)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "10px 14px",
                  border: "none",
                  background: "none",
                  color: isCurrent ? "var(--color-accent, #1A1A1A)" : "var(--color-foreground, #2F2C26)",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  cursor: "pointer",
                  textAlign: "left",
                  fontWeight: isCurrent ? 500 : 400,
                  opacity: isEnded ? 0.6 : 1,
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <span style={{ width: "16px", flexShrink: 0, color: "var(--color-accent, #1A1A1A)" }}>{isCurrent ? "✓" : ""}</span>
                <span>{batch.batchName}{isEnded ? ` (${effectiveStatus === "expired" ? "Ended" : "Archived"})` : ""}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
