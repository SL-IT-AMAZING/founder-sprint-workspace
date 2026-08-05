// Role and status types (matching Prisma enums)
export type UserRole = "super_admin" | "admin" | "mentor" | "founder" | "co_founder";
export type UserStatus = "active" | "inactive" | (string & {});
export type BatchStatus = "active" | "archived";
export type UserBatchStatus = "invited" | "active" | "dropped_out";
export type QuestionStatus = "open" | "closed";
export type OfficeHourSlotStatus = "available" | "requested" | "confirmed" | "completed" | "cancelled";
export type OfficeHourSlotMode = "direct_company" | "direct_founder" | "open_batch";
export type OfficeHourRequestStatus = "pending" | "waitlisted" | "approved" | "rejected" | "cancelled";
export type LikeTargetType = "post" | "comment";
export type EventType = "one_off" | "office_hour" | "in_person" | "virtual" | "general_session";

// Helper types
export type AdminRole = Extract<UserRole, "super_admin" | "admin">;
export type StaffRole = Extract<UserRole, "super_admin" | "admin" | "mentor">;

// User with batch context
export interface UserWithBatch {
  id: string;
  email: string;
  notificationEmail: string | null;
  name: string | null;
  profileImage: string | null;
  timezone: string | null;
  status: UserStatus;
  jobTitle: string | null;
  company: string | null;
  bio: string | null;
  role: UserRole;
  additionalRoles: string[];
  batchId: string;
  batchName: string;
  batchEndDate?: Date;
  batchStatus?: BatchStatus;
  userBatchIds: string[];  // All batch IDs user is member of
}

// Action result type for server actions
export type ActionResult<T = void> =
  | { success: true; data: T; warning?: string }
  | { success: false; error: string };

/**
 * One row of a bulk invite report.
 *
 * `success` only means the membership was created — it says nothing about mail
 * delivery. Read `emailSent` for that, and show `note` to explain a row that
 * succeeded without an email going out.
 */
export type BulkInviteRow = {
  email: string;
  success: boolean;
  error?: string;
  inviteLink?: string;
  membershipStatus?: "active" | "invited";
  emailSent?: boolean;
  note?: string;
};

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
