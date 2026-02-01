import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { ProfileForm } from "./ProfileForm";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { getRoleDisplayName } from "@/lib/utils";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const isOnboarding = params.onboarding === "true";

  return (
    <div className="space-y-6">
      {isOnboarding ? (
        <div>
          <h1 className="text-2xl">Complete Your Profile</h1>
          <p className="text-sm mt-2" style={{ color: "var(--color-foreground-muted)" }}>
            Please fill in your job title and company to get started.
          </p>
        </div>
      ) : (
        <h1 className="text-2xl">Profile Settings</h1>
      )}

      <div className="card">
        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="flex items-center gap-4">
            <Avatar src={user.profileImage} name={user.name} size={64} />
            <div>
              <p className="font-medium text-lg">{user.name}</p>
              <p className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                {user.email}
              </p>
            </div>
          </div>

          <div className="border-t pt-6" style={{ borderColor: "var(--color-card-border)" }}>
            <div className="space-y-4">
              {/* Role */}
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: "var(--color-foreground-muted)" }}>
                  Role
                </p>
                <Badge variant="role">{getRoleDisplayName(user.role)}</Badge>
              </div>

              {/* Batch */}
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: "var(--color-foreground-muted)" }}>
                  Batch
                </p>
                <p>{user.batchName}</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6" style={{ borderColor: "var(--color-card-border)" }}>
            <ProfileForm
              initialData={{
                name: user.name,
                email: user.email,
                jobTitle: user.jobTitle || "",
                company: user.company || "",
                bio: user.bio || "",
                profileImage: user.profileImage || "",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
