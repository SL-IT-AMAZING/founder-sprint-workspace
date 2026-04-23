import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import { getGroup } from "@/actions/group";
import { GroupManage } from "./GroupManage";

export default async function GroupManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const group = await getGroup(id);
  if (!group) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl">Group not found</h1>
      </div>
    );
  }

  const userIsAdmin = isAdmin(user.role);
  const isMember = group.members.some((m) => m.user.id === user.id);

  if (!userIsAdmin && !isMember) {
    redirect(`/groups/${id}`);
  }

  return <GroupManage group={group} isAdmin={userIsAdmin} />;
}
