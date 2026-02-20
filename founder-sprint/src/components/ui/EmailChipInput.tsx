"use client";

import { useState, useRef, useCallback, type KeyboardEvent, type ClipboardEvent } from "react";

interface EmailChipInputProps {
  value: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  label?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseEmails(raw: string): string[] {
  return raw
    .split(/[\s,;\n\r]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
}

export function EmailChipInput({ value, onChange, placeholder, label }: EmailChipInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addEmails = useCallback(
    (raw: string) => {
      const parsed = parseEmails(raw);
      if (parsed.length === 0) return;
      const existing = new Set(value);
      const next = [...value];
      for (const email of parsed) {
        if (!existing.has(email)) {
          next.push(email);
          existing.add(email);
        }
      }
      onChange(next);
    },
    [value, onChange]
  );

  const removeEmail = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index));
    },
    [value, onChange]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const trimmed = input.trim();

    if (["Enter", "Tab", ",", " "].includes(e.key)) {
      if (trimmed) {
        e.preventDefault();
        addEmails(trimmed);
        setInput("");
      } else if (e.key === "Enter" || e.key === "Tab") {
        // Allow default behavior (form submit / focus next)
        return;
      } else {
        e.preventDefault();
      }
    }

    if (e.key === "Backspace" && !input && value.length > 0) {
      removeEmail(value.length - 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    addEmails(pasted);
    setInput("");
  };

  const handleBlur = () => {
    const trimmed = input.trim();
    if (trimmed) {
      addEmails(trimmed);
      setInput("");
    }
  };

  const validCount = value.filter((e) => EMAIL_RE.test(e)).length;
  const invalidCount = value.length - validCount;

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium">{label}</label>}
      <div
        onClick={() => inputRef.current?.focus()}
        className="form-input"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          padding: "8px 10px",
          minHeight: "80px",
          alignContent: "flex-start",
          cursor: "text",
          borderRadius: 6,
        }}
      >
        {value.map((email, i) => {
          const isValid = EMAIL_RE.test(email);
          return (
            <span
              key={`${email}-${i}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "13px",
                lineHeight: "20px",
                maxWidth: "100%",
                backgroundColor: isValid
                  ? "var(--color-background-secondary, #f5f5f5)"
                  : "rgba(239, 68, 68, 0.08)",
                border: isValid
                  ? "1px solid var(--color-card-border, #e0e0e0)"
                  : "1px solid rgba(239, 68, 68, 0.3)",
                color: isValid
                  ? "var(--color-foreground)"
                  : "#dc2626",
              }}
            >
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {email}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeEmail(i);
                }}
                style={{
                  background: "none",
                  border: "none",
                  padding: "0 2px",
                  cursor: "pointer",
                  fontSize: "14px",
                  lineHeight: 1,
                  color: isValid
                    ? "var(--color-foreground-secondary, #666)"
                    : "#dc2626",
                  flexShrink: 0,
                }}
                aria-label={`Remove ${email}`}
              >
                &times;
              </button>
            </span>
          );
        })}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? (placeholder || "Type or paste emails...") : ""}
          style={{
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: "14px",
            flex: 1,
            minWidth: "120px",
            padding: "2px 0",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          color: "var(--color-foreground-secondary)",
        }}
      >
        <span>Type or paste emails — press space, comma, or enter to add</span>
        {value.length > 0 && (
          <span>
            {validCount} email{validCount !== 1 ? "s" : ""}
            {invalidCount > 0 && (
              <span style={{ color: "#dc2626", marginLeft: "4px" }}>
                ({invalidCount} invalid)
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
