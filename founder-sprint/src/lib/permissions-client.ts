import type { UserRole } from "@/types";

// Client-safe permission check helpers (no server dependencies)
export function isAdmin(role: UserRole): boolean {
  return role === "super_admin" || role === "admin";
}

export function isStaff(role: UserRole): boolean {
  return role === "super_admin" || role === "admin" || role === "mentor";
}

export function isSuperAdmin(role: UserRole): boolean {
  return role === "super_admin";
}

export function isFounder(role: UserRole): boolean {
  return role === "founder" || role === "co_founder";
}

export function canCreateQuestion(role: UserRole): boolean {
  return role === "founder" || role === "co_founder";
}

export function canAnswerQuestion(role: UserRole): boolean {
  return isStaff(role);
}

export function canCreateSummary(role: UserRole): boolean {
  return isAdmin(role);
}

export function canCreateEvent(role: UserRole): boolean {
  return isAdmin(role);
}

export function canCreateAssignment(role: UserRole): boolean {
  return isAdmin(role) || role === "mentor";
}

export function canManageBatch(role: UserRole): boolean {
  return isAdmin(role);
}

export function canManageUsers(role: UserRole): boolean {
  return isAdmin(role);
}

export function canCreateOfficeHourSlot(role: UserRole): boolean {
  return isStaff(role);
}

export function canManageGroups(role: UserRole): boolean {
  return isAdmin(role);
}
