interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

import { type ReactNode } from "react";

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="card text-center py-12 space-y-3">
      <p className="text-lg font-medium" style={{ color: "var(--color-foreground-secondary)" }}>
        {title}
      </p>
      {description && (
        <p className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
          {description}
        </p>
      )}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
