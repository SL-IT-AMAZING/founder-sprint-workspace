import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { getUserProfile } from "@/actions/profile";
import { Avatar } from "@/components/ui/Avatar";
import Link from "next/link";

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  mentor: "Mentor",
  founder: "Founder",
  co_founder: "Co-Founder",
};

export default async function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { userId } = await params;
  const result = await getUserProfile(userId);

  if (!result.success) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--color-foreground)" }}>
          Profile not found
        </h2>
        <p style={{ color: "var(--color-foreground-muted)", marginTop: "8px" }}>
          This user does not exist or is not in your batch.
        </p>
        <Link href="/feed" style={{ color: "var(--color-primary)", marginTop: "16px", display: "inline-block" }}>
          ← Back to Feed
        </Link>
      </div>
    );
  }

  const profile = result.data;
  const isOwnProfile = profile.id === user.id;
  const isMentor = profile.role === "mentor";

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto" }}>
      <Link
        href="/feed"
        style={{
          color: "var(--color-foreground-muted)",
          fontSize: "14px",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          marginBottom: "24px",
        }}
      >
        ← Back to Feed
      </Link>

      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          border: "1px solid #e0e0e0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "32px 32px 24px",
            display: "flex",
            alignItems: "flex-start",
            gap: "20px",
          }}
        >
          <Avatar src={profile.profileImage} name={profile.name} size={80} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <h1
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "var(--color-foreground, #2F2C26)",
                  margin: 0,
                  fontFamily: "var(--font-serif, Georgia, serif)",
                }}
              >
                {profile.name}
                {isOwnProfile && (
                  <span style={{ fontSize: "14px", fontWeight: 400, color: "var(--color-foreground-muted)" }}>
                    {" "}(You)
                  </span>
                )}
              </h1>
              {profile.role && (
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    padding: "2px 8px",
                    borderRadius: "9999px",
                    backgroundColor: "var(--color-background-secondary, #f5f5f5)",
                    color: "var(--color-foreground-muted)",
                  }}
                >
                  {roleLabels[profile.role] || profile.role}
                </span>
              )}
            </div>
            {(profile.jobTitle || profile.company) && (
              <p style={{ fontSize: "14px", color: "var(--color-foreground-muted)", margin: "4px 0 0" }}>
                {[profile.jobTitle, profile.company].filter(Boolean).join(" at ")}
              </p>
            )}
            <p style={{ fontSize: "13px", color: "var(--color-foreground-muted)", margin: "2px 0 0" }}>
              {profile.email}
            </p>
          </div>
          {isOwnProfile && (
            <Link
              href="/settings"
              style={{
                fontSize: "13px",
                color: "var(--color-primary, #2563eb)",
                textDecoration: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid var(--color-primary, #2563eb)",
                whiteSpace: "nowrap",
              }}
            >
              Edit Profile
            </Link>
          )}
        </div>

        {profile.bio && (
          <div style={{ padding: "0 32px 24px", borderTop: "1px solid #f0f0f0", paddingTop: "20px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-foreground-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              About
            </h3>
            <p style={{ fontSize: "14px", color: "var(--color-foreground)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
              {profile.bio}
            </p>
          </div>
        )}

        {profile.groups.length > 0 && (
          <div style={{ padding: "0 32px 24px", borderTop: "1px solid #f0f0f0", paddingTop: "20px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-foreground-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Groups
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {profile.groups.map((group) => (
                <span
                  key={group.id}
                  style={{
                    fontSize: "13px",
                    padding: "4px 12px",
                    borderRadius: "6px",
                    backgroundColor: "var(--color-background-secondary, #f5f5f5)",
                    color: "var(--color-foreground)",
                  }}
                >
                  {group.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {isMentor && profile.officeHourSlots.length > 0 && (
          <div style={{ padding: "0 32px 32px", borderTop: "1px solid #f0f0f0", paddingTop: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-foreground-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                Upcoming Office Hours
              </h3>
              <Link
                href="/office-hours"
                style={{ fontSize: "12px", color: "var(--color-primary, #2563eb)", textDecoration: "none" }}
              >
                View All →
              </Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {profile.officeHourSlots.map((slot) => {
                const start = new Date(slot.startTime);
                const end = new Date(slot.endTime);
                return (
                  <div
                    key={slot.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      backgroundColor: "var(--color-background-secondary, #f5f5f5)",
                      fontSize: "13px",
                    }}
                  >
                    <span style={{ color: "var(--color-foreground)" }}>
                      {start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    <span style={{ color: "var(--color-foreground-muted)" }}>
                      {start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })} – {end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isMentor && profile.officeHourSlots.length === 0 && (
          <div style={{ padding: "0 32px 32px", borderTop: "1px solid #f0f0f0", paddingTop: "20px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-foreground-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Office Hours
            </h3>
            <p style={{ fontSize: "13px", color: "var(--color-foreground-muted)", margin: 0 }}>
              No upcoming office hours scheduled.
            </p>
            <Link
              href="/office-hours"
              style={{ fontSize: "12px", color: "var(--color-primary, #2563eb)", textDecoration: "none", marginTop: "8px", display: "inline-block" }}
            >
              View Office Hours →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
