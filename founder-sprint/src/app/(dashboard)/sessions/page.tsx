import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import { getSessions, getAllBatchesForSelect } from "@/actions/session";
import { SessionsList } from "./SessionsList";

export const revalidate = 300;

export default async function SessionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sessions = await getSessions(user.batchId);
  const allBatches = await getAllBatchesForSelect();
  const batchOptions = allBatches.map(b => ({
    id: b.id,
    name: b.name,
    status: b.status,
    memberCount: b._count.userBatches,
  }));

  return <SessionsList sessions={sessions} isAdmin={isAdmin(user.role)} batchOptions={batchOptions} />;
}
