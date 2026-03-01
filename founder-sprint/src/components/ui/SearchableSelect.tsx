"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";

export interface SearchableOption {
  id: string;
  label: string;
  secondary?: string;
  imageUrl?: string | null;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  emptyMessage?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  label,
  required,
  emptyMessage = "No results found",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.secondary && o.secondary.toLowerCase().includes(q))
    );
  }, [options, search]);

  const selectedOption = useMemo(
    () => options.find((o) => o.id === value),
    [options, value]
  );

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = useCallback(
    (id: string) => {
      onChange(id);
      setIsOpen(false);
      setSearch("");
    },
    [onChange]
  );

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    if (isOpen) setSearch("");
  }, [isOpen]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: 14,
            fontWeight: 500,
            color: "#2F2C26",
            fontFamily: '"BDO Grotesk", sans-serif',
            marginBottom: 4,
          }}
        >
          {label}
        </label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={handleToggle}
        style={{
          width: "100%",
          padding: "8px 12px",
          borderRadius: 6,
          border: "1px solid #e0e0e0",
          fontSize: 13,
          fontFamily: '"BDO Grotesk", sans-serif',
          backgroundColor: "#FFFFFF",
          color: selectedOption ? "#2F2C26" : "#999999",
          cursor: "pointer",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          transition: "border-color 0.15s",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "#1A1A1A")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "#e0e0e0")}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
          }}
        >
          {selectedOption ? selectedOption.label : placeholder}
          {selectedOption?.secondary && (
            <span style={{ color: "#999999", marginLeft: 6, fontSize: 12 }}>
              {selectedOption.secondary}
            </span>
          )}
        </span>
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            flexShrink: 0,
          }}
        >
          <path
            d="M1 1L5 5L9 1"
            stroke="#666666"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Hidden input for form submission */}
      {required && <input type="hidden" name="" value={value} required={required && !value} />}

      {/* Dropdown popover */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            backgroundColor: "#FFFFFF",
            border: "1px solid #e0e0e0",
            borderRadius: 6,
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          {/* Search input */}
          <div style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>
            <div style={{ position: "relative" }}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                style={{
                  position: "absolute",
                  left: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              >
                <path
                  d="M6.125 10.5C8.54125 10.5 10.5 8.54125 10.5 6.125C10.5 3.70875 8.54125 1.75 6.125 1.75C3.70875 1.75 1.75 3.70875 1.75 6.125C1.75 8.54125 3.70875 10.5 6.125 10.5Z"
                  stroke="#999999"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12.25 12.25L9.1875 9.1875"
                  stroke="#999999"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                style={{
                  width: "100%",
                  padding: "7px 8px 7px 30px",
                  fontSize: 13,
                  fontFamily: '"BDO Grotesk", sans-serif',
                  border: "1px solid #e0e0e0",
                  borderRadius: 4,
                  outline: "none",
                  color: "#2F2C26",
                  boxSizing: "border-box",
                  backgroundColor: "#FFFFFF",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#1A1A1A")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e0e0e0")}
              />
            </div>
          </div>

          {/* Options list */}
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {filtered.length === 0 && (
              <div
                style={{
                  padding: "12px 16px",
                  fontSize: 13,
                  color: "#999999",
                  textAlign: "center",
                  fontFamily: '"BDO Grotesk", sans-serif',
                }}
              >
                {emptyMessage}
              </div>
            )}
            {filtered.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "8px 12px",
                  border: "none",
                  background: option.id === value ? "rgba(26,26,26,0.06)" : "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: '"BDO Grotesk", sans-serif',
                  color: "#2F2C26",
                  textAlign: "left",
                  transition: "background-color 0.1s",
                }}
                onMouseEnter={(e) => {
                  if (option.id !== value) {
                    e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.03)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    option.id === value ? "rgba(26,26,26,0.06)" : "transparent";
                }}
              >
                {option.imageUrl !== undefined && (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      backgroundColor: "#f0f0f0",
                      backgroundImage: option.imageUrl ? `url(${option.imageUrl})` : "none",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#666666",
                    }}
                  >
                    {!option.imageUrl && option.label.charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontWeight: option.id === value ? 500 : 400,
                    }}
                  >
                    {option.label}
                  </div>
                  {option.secondary && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "#999999",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        marginTop: 1,
                      }}
                    >
                      {option.secondary}
                    </div>
                  )}
                </div>
                {option.id === value && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    style={{ flexShrink: 0 }}
                  >
                    <path
                      d="M2.5 7L5.5 10L11.5 4"
                      stroke="#1A1A1A"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
