import type { UserRole } from "@/types";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 0,
  admin: 1,
  mentor: 2,
  founder: 3,
  co_founder: 4,
};

export const ASSIGNABLE_ROLES: UserRole[] = ["admin", "mentor", "founder", "co_founder"];

export function getRolesBelow(role: UserRole): UserRole[] {
  return ASSIGNABLE_ROLES.filter((candidate) => ROLE_HIERARCHY[candidate] > ROLE_HIERARCHY[role]);
}

export function isRoleBelow(candidate: UserRole, ceiling: UserRole): boolean {
  return ROLE_HIERARCHY[candidate] > ROLE_HIERARCHY[ceiling];
}
