// Role and status types (matching Prisma enums)
export type UserRole = "super_admin" | "admin" | "mentor" | "founder" | "co_founder";
export type BatchStatus = "active" | "archived";
export type UserBatchStatus = "invited" | "active";
export type QuestionStatus = "open" | "closed";
export type OfficeHourSlotStatus = "available" | "requested" | "confirmed" | "completed" | "cancelled";
export type OfficeHourRequestStatus = "pending" | "approved" | "rejected" | "cancelled";
export type LikeTargetType = "post" | "comment";
export type EventType = "one_off" | "office_hour" | "in_person";

// Helper types
export type AdminRole = Extract<UserRole, "super_admin" | "admin">;
export type StaffRole = Extract<UserRole, "super_admin" | "admin" | "mentor">;

// User with batch context
export interface UserWithBatch {
  id: string;
  email: string;
  name: string;
  profileImage: string | null;
  jobTitle: string | null;
  company: string | null;
  bio: string | null;
  role: UserRole;
  batchId: string;
  batchName: string;
}

// Action result type for server actions
export type ActionResult<T = void> =
  | { success: true; data: T; warning?: string }
  | { success: false; error: string };

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
