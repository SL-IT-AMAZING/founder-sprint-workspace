"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { switchBatch } from "@/actions/batch-switcher";

interface BatchSwitcherProps {
  batches: Array<{ batchId: string; batchName: string }>;
  currentBatchId: string;
}

export default function BatchSwitcher({ batches, currentBatchId }: BatchSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const router = useRouter();
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
      alert(result.error);
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
          backgroundColor: "#404040",
          border: "1px solid #555",
          borderRadius: "4px",
          padding: "4px 10px",
          color: "white",
          fontSize: "13px",
          cursor: switching ? "wait" : "pointer",
          opacity: switching ? 0.6 : 1,
          whiteSpace: "nowrap",
          transition: "opacity 0.2s",
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
            backgroundColor: "#333",
            border: "1px solid #555",
            borderRadius: "6px",
            padding: "4px 0",
            minWidth: "180px",
            zIndex: 200,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
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
                  color: "white",
                  fontSize: "13px",
                  cursor: "pointer",
                  textAlign: "left",
                  opacity: isCurrent ? 1 : 0.8,
                  fontWeight: isCurrent ? 500 : 400,
                  transition: "background-color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#444")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <span style={{ width: "16px", flexShrink: 0 }}>{isCurrent ? "✓" : ""}</span>
                <span>{batch.batchName}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
