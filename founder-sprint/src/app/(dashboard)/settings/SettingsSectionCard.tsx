import React from "react";

export interface SettingsSectionCardProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  noPadding?: boolean;
}

export function SettingsSectionCard({
  title,
  action,
  children,
  noPadding = false,
}: SettingsSectionCardProps) {
  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        padding: noPadding ? "0" : "24px",
      }}
    >
      {title && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: children ? "16px" : "0",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#2F2C26",
            }}
          >
            {title}
          </h2>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
