import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import { getSessions, getAllBatchesForSelect, getSessionTemplates } from "@/actions/session";
import { getGroups } from "@/actions/group";
import { SessionsList } from "./SessionsList";

export const revalidate = 300;

export default async function SessionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [sessions, allBatches, groups, templates] = await Promise.all([
    getSessions(user.batchId),
    getAllBatchesForSelect(),
    getGroups(user.batchId),
    getSessionTemplates(),
  ]);
  const batchOptions = allBatches.map(b => ({
    id: b.id,
    name: b.name,
    status: b.status,
    memberCount: b._count.userBatches,
  }));

  const groupOptions = groups.map((group) => ({
    id: group.id,
    name: group.name,
  }));

  return (
    <SessionsList
      sessions={sessions}
      isAdmin={isAdmin(user.role)}
      batchOptions={batchOptions}
      groupOptions={groupOptions}
      templates={templates}
    />
  );
}
