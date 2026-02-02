import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import { getGroups } from "@/actions/group";
import { GroupsList } from "./GroupsList";

export const revalidate = 120;

export default async function GroupsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const groups = await getGroups(user.batchId);

  return <GroupsList groups={groups} isAdmin={isAdmin(user.role)} />;
}
