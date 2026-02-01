"use client";

import { useState, type ReactNode } from "react";

interface Tab {
  key: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
}

export function Tabs({ tabs, defaultTab }: TabsProps) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.key);

  return (
    <div>
      <div className="flex gap-1 border-b" style={{ borderColor: "var(--color-card-border)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className="px-4 py-2.5 text-sm transition-colors"
            style={{
              background: "none",
              border: "none",
              borderBottom: active === tab.key ? "2px solid #555AB9" : "2px solid transparent",
              color: active === tab.key ? "#555AB9" : "var(--color-foreground-secondary)",
              fontWeight: active === tab.key ? 600 : 400,
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-4">
        {tabs.find((t) => t.key === active)?.content}
      </div>
    </div>
  );
}
