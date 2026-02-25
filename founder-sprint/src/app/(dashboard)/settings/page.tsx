import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { getGroups, getUserGroups } from "@/actions/group";
import { getEnhancedUserProfile } from "@/actions/profile";

export const revalidate = 60;
import { ProfileForm } from "./ProfileForm";
import { GroupSelector } from "./GroupSelector";
import { ExperienceSection } from "./ExperienceSection";
import { EducationSection } from "./EducationSection";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { getRoleDisplayName, getDisplayName } from "@/lib/utils";
import { SettingsSectionCard } from "./SettingsSectionCard";
import { SettingsSidebar } from "./SettingsSidebar";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const isOnboarding = params.onboarding === "true";

  const isFounderRole = user.role === "founder" || user.role === "co_founder";
  let userGroups: Array<{ id: string; name: string }> = [];
  let availableGroups: Array<{ id: string; name: string; _count: { members: number } }> = [];

  if (isFounderRole && user.batchId) {
    const [userGroupsResult, allGroups] = await Promise.all([
      getUserGroups(user.batchId, user.id),
      getGroups(user.batchId),
    ]);
    userGroups = userGroupsResult.map(g => ({ id: g.id, name: g.name }));
    availableGroups = allGroups.map(g => ({ id: g.id, name: g.name, _count: { members: g._count.members } }));
  }

  // Fetch enhanced profile data
  const profileResult = await getEnhancedUserProfile(user.id);
  const profile = profileResult.success ? profileResult.data : null;
  const hasGroup = userGroups.length > 0;

  return (
    <div>
      {isOnboarding && (
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 600, fontFamily: '"Libre Caslon Condensed", Georgia, serif', color: "#2F2C26" }}>Complete Your Profile</h1>
          <p className="text-sm mt-2" style={{ color: "var(--color-foreground-muted)" }}>
            Please fill in your job title and company to get started.
            {isFounderRole && !hasGroup && availableGroups.length > 0 && " Please also select your group."}
          </p>
        </div>
      )}

      {!isOnboarding && (
        <h1 style={{ fontSize: "32px", fontWeight: 600, fontFamily: '"Libre Caslon Condensed", Georgia, serif', color: "#2F2C26", marginBottom: "24px" }}>
          Profile Settings
        </h1>
      )}

      {isFounderRole && availableGroups.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <SettingsSectionCard>
            <GroupSelector
              currentGroupId={userGroups[0]?.id || null}
              currentGroupName={userGroups[0]?.name || null}
              availableGroups={availableGroups}
              isOnboarding={isOnboarding && !hasGroup}
            />
          </SettingsSectionCard>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Main Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Profile Identity Card */}
          <SettingsSectionCard>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Avatar src={user.profileImage} name={getDisplayName(user)} size={64} />
              <div>
                <p style={{ fontSize: "18px", fontWeight: 600, color: "#2F2C26", marginBottom: "4px" }}>
                  {getDisplayName(user)}
                </p>
                <p style={{ fontSize: "14px", color: "#666666", marginBottom: "8px" }}>
                  {user.email}
                </p>
                <Badge variant="role">{getRoleDisplayName(user.role)}</Badge>
              </div>
            </div>
          </SettingsSectionCard>

          {/* ProfileForm Card */}
          <SettingsSectionCard title="Edit Profile">
            <ProfileForm
              initialData={{
                name: user.name || "",
                email: user.email,
                jobTitle: user.jobTitle || "",
                company: user.company || "",
                bio: user.bio || "",
                profileImage: user.profileImage || "",
                headline: profile?.headline || "",
                location: profile?.location || "",
                linkedinUrl: profile?.linkedinUrl || "",
                twitterUrl: profile?.twitterUrl || "",
                websiteUrl: profile?.websiteUrl || "",
              }}
            />
          </SettingsSectionCard>

          {/* Experience Card */}
          <SettingsSectionCard>
            <ExperienceSection experiences={profile?.experiences || []} />
          </SettingsSectionCard>

          {/* Education Card */}
          <SettingsSectionCard>
            <EducationSection education={profile?.education || []} />
          </SettingsSectionCard>
        </div>

        {/* Sidebar Column */}
        <div>
          <SettingsSidebar
            user={{
              batchName: user.batchName,
              location: profile?.location,
              linkedinUrl: profile?.linkedinUrl,
              twitterUrl: profile?.twitterUrl,
              websiteUrl: profile?.websiteUrl,
            }}
          />
        </div>
      </div>
    </div>
  );
}
