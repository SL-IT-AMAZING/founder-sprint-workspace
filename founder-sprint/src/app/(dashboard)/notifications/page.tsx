import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { getNotifications } from "@/actions/notification";
import { NotificationsListClient } from "./NotificationsListClient";

export const revalidate = 30;

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const result = await getNotifications(page, 50);

  if (!result.success) {
    return <div className="card">Failed to load notifications.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 600,
            fontFamily: '"Libre Caslon Condensed", Georgia, serif',
            color: "#2F2C26",
            marginBottom: "8px",
          }}
        >
          Notifications
        </h1>
        <p className="text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
          Mentions and other system updates appear here.
        </p>
      </div>

      <NotificationsListClient notifications={result.data.items} />
    </div>
  );
}
