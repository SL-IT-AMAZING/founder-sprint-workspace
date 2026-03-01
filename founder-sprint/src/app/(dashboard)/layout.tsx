import BookfaceTopNav from "@/components/layout/BookfaceTopNav";
import DashboardMain from "@/components/layout/DashboardMain";
import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin as checkIsAdmin } from "@/lib/permissions";
import { getUserBatches } from "@/actions/batch-switcher";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const userIsAdmin = checkIsAdmin(user.role);

  const batchResult = await getUserBatches();
  const userBatches = batchResult.success ? batchResult.data : [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-background)" }}>
      <BookfaceTopNav
        user={user}
        isAdmin={userIsAdmin}
        batches={userBatches}
        currentBatchId={user.batchId}
      />
      <DashboardMain>{children}</DashboardMain>
    </div>
  );
}
