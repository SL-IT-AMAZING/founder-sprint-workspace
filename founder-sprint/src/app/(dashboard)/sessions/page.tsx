import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import { getSessions } from "@/actions/session";
import { SessionsList } from "./SessionsList";

export default async function SessionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sessions = await getSessions(user.batchId);

  return <SessionsList sessions={sessions} isAdmin={isAdmin(user.role)} />;
}
