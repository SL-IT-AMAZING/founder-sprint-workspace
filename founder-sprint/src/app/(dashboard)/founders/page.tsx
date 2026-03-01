import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/permissions";
import { getAllMembers, getAllMemberStats } from "@/actions/directory";
import { getFollowingIdsForUser } from "@/actions/follow";
import { FollowButton } from "@/components/feed/FollowButton";
import { SearchBar } from "./SearchBar";
import type { UserRole } from "@/types";

export const revalidate = 30;

const ROLE_FILTERS: Array<{ label: string; value: UserRole | "all" }> = [
  { label: "All", value: "all" },
  { label: "Founders", value: "founder" },
  { label: "Co-Founders", value: "co_founder" },
  { label: "Mentors", value: "mentor" },
  { label: "Admins", value: "admin" },
];

function getRoleBadgeText(role: UserRole): string {
  const roleMap: Record<UserRole, string> = {
    founder: "Founder",
    co_founder: "Co-Founder",
    mentor: "Mentor",
    admin: "Admin",
    super_admin: "Super Admin",
  };
  return roleMap[role] || role;
}

export default async function FoundersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string; page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const search = params.search || "";
  const roleFilter = (params.role || "all") as UserRole | "all";
  const page = Math.max(1, parseInt(params.page || "1", 10));

  const [membersResult, statsResult, followingIds] = await Promise.all([
    getAllMembers({
      search: search || undefined,
      role: roleFilter !== "all" ? roleFilter : undefined,
      page,
      limit: 20,
    }),
    getAllMemberStats(),
    getFollowingIdsForUser(user.id),
  ]);

  if (!membersResult.success) {
    return (
      <div style={{ padding: "24px", color: "#ef4444" }}>
        Error loading members: {membersResult.error}
      </div>
    );
  }

  if (!statsResult.success) {
    return (
      <div style={{ padding: "24px", color: "#ef4444" }}>
        Error loading stats: {statsResult.error}
      </div>
    );
  }

  const { users, total, hasMore } = membersResult.data;
  const stats = statsResult.data;
  const totalPages = Math.ceil(total / 20);

  const followingSet = new Set(followingIds);

  const buildUrl = (newPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (roleFilter !== "all") params.set("role", roleFilter);
    if (newPage > 1) params.set("page", newPage.toString());
    const queryString = params.toString();
    return queryString ? `/founders?${queryString}` : "/founders";
  };

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 600,
            fontFamily: '"Libre Caslon Condensed", Georgia, serif',
            color: "#2F2C26",
            marginBottom: "8px",
          }}
        >
          Founders
        </h1>
        <p style={{ fontSize: "14px", color: "#666666" }}>
          {stats.total} members across all batches
        </p>
      </div>

      <SearchBar initialSearch={search} initialRole={roleFilter} />

      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        {ROLE_FILTERS.map((filter) => {
          const isActive = roleFilter === filter.value;
          const filterUrl = (() => {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (filter.value !== "all") params.set("role", filter.value);
            const queryString = params.toString();
            return queryString ? `/founders?${queryString}` : "/founders";
          })();

          return (
            <Link
              key={filter.value}
              href={filterUrl}
              style={{
                padding: "8px 16px",
                borderRadius: "9px",
                fontSize: "14px",
                fontWeight: 500,
                border: "1px solid",
                borderColor: isActive ? "#1A1A1A" : "#e0e0e0",
                backgroundColor: isActive ? "#1A1A1A" : "#FFFFFF",
                color: isActive ? "#FFFFFF" : "#666666",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {users.length === 0 ? (
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            color: "#999999",
          }}
        >
          No members found
          {search && ` matching "${search}"`}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {users.map((member) => {
            const isFollowing = followingSet.has(member.id);
            const isCurrentUser = member.id === user.id;

            return (
              <div
                key={member.id}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  padding: "16px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "16px",
                }}
              >
                <Link
                  href={`/profile/${member.id}`}
                  style={{ textDecoration: "none" }}
                >
                  {member.profileImage ? (
                    <img
                      src={member.profileImage}
                      alt={member.name || "User"}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        backgroundColor: "#e0e0e0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#666666",
                        fontSize: "16px",
                        fontWeight: 600,
                      }}
                    >
                      {member.name?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                </Link>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <Link
                      href={`/profile/${member.id}`}
                      style={{
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#2F2C26",
                        textDecoration: "none",
                      }}
                    >
                      {member.name || "Unnamed User"}
                    </Link>
                    {/* Batch name badge */}
                    {"batchName" in member && member.batchName && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          color: "#1A1A1A",
                          backgroundColor: "rgba(26, 26, 26, 0.1)",
                          padding: "2px 6px",
                          borderRadius: "3px",
                          fontFamily: '"Roboto Mono", monospace',
                        }}
                      >
                        {member.batchName}
                      </span>
                    )}
                    {/* Role badge */}
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "#666666",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        backgroundColor: "#f5f5f5",
                      }}
                    >
                      {getRoleBadgeText(member.role)}
                    </span>
                  </div>

                  {(member.jobTitle || member.company) && (
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#666666",
                        marginBottom: "4px",
                      }}
                    >
                      {member.jobTitle}
                      {member.jobTitle && member.company && " at "}
                      {member.company && (
                        <span style={{ fontWeight: 500 }}>
                          {member.company}
                        </span>
                      )}
                    </p>
                  )}

                  {member.headline && (
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#999999",
                        marginTop: "4px",
                      }}
                    >
                      {member.headline}
                    </p>
                  )}
                </div>

                {!isCurrentUser && (
                  <div style={{ flexShrink: 0 }}>
                    <FollowButton
                      targetUserId={member.id}
                      isFollowing={isFollowing}
                      size="sm"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            marginTop: "32px",
          }}
        >
          {page > 1 ? (
            <Link
              href={buildUrl(page - 1)}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 500,
                borderRadius: "9px",
                border: "1px solid #e0e0e0",
                color: "#2F2C26",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
            >
              Previous
            </Link>
          ) : (
            <span
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 500,
                borderRadius: "9px",
                border: "1px solid #e0e0e0",
                color: "#999999",
                opacity: 0.5,
              }}
            >
              Previous
            </span>
          )}

          <span style={{ fontSize: "14px", color: "#666666" }}>
            Page {page} of {totalPages}
          </span>

          {page < totalPages ? (
            <Link
              href={buildUrl(page + 1)}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 500,
                borderRadius: "9px",
                border: "1px solid #e0e0e0",
                color: "#2F2C26",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
            >
              Next
            </Link>
          ) : (
            <span
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 500,
                borderRadius: "9px",
                border: "1px solid #e0e0e0",
                color: "#999999",
                opacity: 0.5,
              }}
            >
              Next
            </span>
          )}
        </div>
      )}
    </div>
  );
}
