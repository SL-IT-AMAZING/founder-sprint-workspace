import { getCurrentUser } from "@/lib/permissions";
import { completeExpiredSlots, getOfficeHourSlots } from "@/actions/office-hour";
import { getCompaniesForBatch } from "@/actions/company";
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
  const slots = await getOfficeHourSlots(user.batchId, user.id, user.role);
  const companiesRaw = await getCompaniesForBatch(user.batchId);
  const companies = companiesRaw.map(c => ({ id: c.id, name: c.name, _count: { members: c._count?.members ?? 0, posts: 0 } }));
  const batchMembers = await prisma.userBatch.findMany({
    where: { batchId: user.batchId, status: "active" },
    select: {
      user: {
        select: {
          id: true, name: true, email: true, profileImage: true, role: true,
          companyMemberships: { where: { isCurrent: true }, select: { company: { select: { name: true } } } },
        },
      },
    },
  });
  const founders = batchMembers
    .filter(ub => ub.user.role === "founder" || ub.user.role === "co_founder")
    .map(ub => ({
      id: ub.user.id,
      name: ub.user.name,
      email: ub.user.email,
      profileImage: ub.user.profileImage,
      companyName: ub.user.companyMemberships[0]?.company.name ?? null,
    }));
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: "32px", fontWeight: 600, fontFamily: '"Libre Caslon Condensed", Georgia, serif', color: "#2F2C26" }}>Office Hours</h1>
      </div>
      <OfficeHoursList user={user} slots={slots} companies={companies} founders={founders} />
    </div>
  );
}
