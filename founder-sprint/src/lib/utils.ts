// Simple cn utility without tailwind-merge (not needed with our CSS approach)
export function cn(...inputs: string[]) {
  return inputs.filter(Boolean).join(" ");
}

// Format date helpers
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

// Role display name
export function getRoleDisplayName(role: string): string {
  const names: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    mentor: "Mentor",
    founder: "Founder",
    co_founder: "Co-founder",
  };
  return names[role] || role;
}

// Batch status display
export function getBatchStatusColor(status: string): string {
  return status === "active" ? "badge-success" : "badge-error";
}

// Question status display
export function getQuestionStatusColor(status: string): string {
  return status === "open" ? "badge-success" : "badge-warning";
}

// Truncate text
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
