import { getCurrentUser } from "@/lib/permissions";
import { completeExpiredSlots, getOfficeHourBatchContext, getOfficeHourRequesterStats, getOfficeHourSlots } from "@/actions/office-hour";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { OfficeHoursList } from "./OfficeHoursList";

export const revalidate = 60;

export default async function OfficeHoursPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  await completeExpiredSlots(user.batchId);
  const [slots, requesterStats, batchContextResult, batchOptions] = await Promise.all([
    getOfficeHourSlots(user.batchId, user.id, user.role),
    getOfficeHourRequesterStats(user.batchId),
    getOfficeHourBatchContext(user.batchId),
    user.role === "admin" || user.role === "super_admin"
      ? prisma.batch.findMany({
          orderBy: [{ status: "asc" }, { createdAt: "desc" }],
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);
  const batchContext = batchContextResult.success
    ? batchContextResult.data
    : { companies: [], founders: [], mentors: [] };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: "32px", fontWeight: 600, fontFamily: '"Libre Caslon Condensed", Georgia, serif', color: "#2F2C26" }}>Office Hours</h1>
      </div>
      <OfficeHoursList
        user={user}
        slots={slots}
        companies={batchContext.companies.map((company) => ({ id: company.id, name: company.name, _count: { members: company.memberCount, posts: 0 } }))}
        founders={batchContext.founders}
        mentors={batchContext.mentors}
        requesterStats={requesterStats}
        batchOptions={batchOptions}
        currentBatchId={user.batchId}
      />
    </div>
  );
}
