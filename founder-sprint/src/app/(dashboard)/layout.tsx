import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
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
      <Navbar
        user={user}
        isAdmin={userIsAdmin}
        batches={userBatches}
        currentBatchId={user.batchId}
      />
      <div className="main-container lg:grid lg:grid-cols-[240px_1fr] lg:gap-6 pt-6 pb-8">
        <aside className="hidden lg:block">
          <DashboardSidebar isAdmin={userIsAdmin} />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
