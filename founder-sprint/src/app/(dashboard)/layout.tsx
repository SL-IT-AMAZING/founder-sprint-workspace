import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin as checkIsAdmin, isStaff } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

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

  // Fetch all batches for staff users (mentors, admins) who may belong to multiple
  let userBatches: Array<{ batchId: string; batchName: string }> = [];
  if (isStaff(user.role) && user.email) {
    const allBatches = await prisma.userBatch.findMany({
      where: {
        user: { email: user.email },
        status: "active",
      },
      include: { batch: true },
      orderBy: { batch: { createdAt: "desc" } },
    });
    userBatches = allBatches.map((ub) => ({
      batchId: ub.batchId,
      batchName: ub.batch.name,
    }));
  }

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
