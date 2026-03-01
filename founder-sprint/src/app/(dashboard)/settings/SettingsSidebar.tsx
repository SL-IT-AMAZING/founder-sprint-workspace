"use client";

import React from "react";
import { SettingsSectionCard } from "./SettingsSectionCard";

export interface SettingsSidebarProps {
  user: {
    batchName: string | null;
    location?: string | null;
    linkedinUrl?: string | null;
    twitterUrl?: string | null;
    websiteUrl?: string | null;
  };
}

export function SettingsSidebar({ user }: SettingsSidebarProps) {
  const infoRows = [
    { label: "Batch", value: user.batchName },
    { label: "Location", value: user.location },
    { label: "LinkedIn", value: user.linkedinUrl, isUrl: true },
    { label: "Twitter", value: user.twitterUrl, isUrl: true },
    { label: "Website", value: user.websiteUrl, isUrl: true },
  ].filter((row) => row.value);

  return (
    <SettingsSectionCard title="Profile Info">
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {infoRows.map((row, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <span
              style={{
                fontWeight: 500,
                color: "#666666",
                fontSize: "14px",
                flexShrink: 0,
              }}
            >
              {row.label}:
            </span>
            {row.isUrl ? (
              <a
                href={row.value || ""}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#1A1A1A",
                  fontSize: "14px",
                  textAlign: "right",
                  wordBreak: "break-word",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = "underline";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = "none";
                }}
              >
                {row.value}
              </a>
            ) : (
              <span
                style={{
                  color: "#2F2C26",
                  fontSize: "14px",
                  textAlign: "right",
                }}
              >
                {row.value}
              </span>
            )}
          </div>
        ))}
      </div>
    </SettingsSectionCard>
  );
}
