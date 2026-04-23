import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import { getSessions, getAllBatchesForSelect, getSessionTemplates } from "@/actions/session";
import { getCompaniesForBatch } from "@/actions/company";
import { SessionsList } from "./SessionsList";

export const revalidate = 300;

export default async function SessionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [sessions, allBatches, companies, templates] = await Promise.all([
    getSessions(user.batchId),
    getAllBatchesForSelect(),
    getCompaniesForBatch(user.batchId),
    getSessionTemplates(),
  ]);
  const batchOptions = allBatches.map(b => ({
    id: b.id,
    name: b.name,
    status: b.status,
    memberCount: b._count.userBatches,
  }));

  const companyOptions = companies.map((company) => ({
    id: company.id,
    name: company.name,
    memberCount: company._count.members,
  }));

  return (
    <SessionsList
      sessions={sessions}
      isAdmin={isAdmin(user.role)}
      batchOptions={batchOptions}
      companyOptions={companyOptions}
      templates={templates}
      userTimezone={user.timezone}
    />
  );
}
